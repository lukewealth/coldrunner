# Google Places API Integration Guide

## Overview

Google Places API provides business location data, reviews, and details. ColdRunners uses it as the primary source for business discovery.

**Official Documentation:** https://developers.google.com/maps/documentation/places  
**API Reference:** https://developers.google.com/maps/documentation/places/web-service  
**Console:** https://console.cloud.google.com/google/maps-apis

## ColdRunners Usage

### Plugin Implementation

```typescript
// src/server/plugins/google-places.ts
import { Plugin, PluginResult } from '../types';

export class GooglePlacesPlugin implements Plugin {
  name = 'google-places';
  version = '1.0.0';
  description = 'Google Places API for business discovery';

  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api/place';

  async initialize(): Promise<void> {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY || '';
  }

  async execute(params: any): Promise<PluginResult> {
    switch (params.type) {
      case 'nearby':
        return await this.nearbySearch(params);
      case 'text':
        return await this.textSearch(params);
      case 'details':
        return await this.placeDetails(params);
      case 'geocode':
        return await this.geocode(params);
      default:
        return {
          success: false,
          error: `Unknown type: ${params.type}`,
          confidence: 0,
          source: this.name,
          timestamp: new Date(),
        };
    }
  }

  private async nearbySearch(params: {
    location: string;
    radius: number;
    keyword?: string;
  }): Promise<PluginResult> {
    const url = `${this.baseUrl}/nearbysearch/json?` + 
      `location=${params.location}` +
      `&radius=${params.radius}` +
      `&keyword=${encodeURIComponent(params.keyword || '')}` +
      `&key=${this.apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return {
        success: false,
        error: data.status,
        confidence: 0,
        source: this.name,
        timestamp: new Date(),
      };
    }

    return {
      success: true,
      data: data.results,
      confidence: 95,
      source: this.name,
      timestamp: new Date(),
    };
  }

  private async placeDetails(params: {
    placeId: string;
  }): Promise<PluginResult> {
    const url = `${this.baseUrl}/details/json?` +
      `place_id=${params.placeId}` +
      `&fields=name,formatted_address,formatted_phone_number,website,` +
      `rating,user_ratings_total,geometry,opening_hours,photos` +
      `&key=${this.apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return {
        success: false,
        error: data.status,
        confidence: 0,
        source: this.name,
        timestamp: new Date(),
      };
    }

    return {
      success: true,
      data: data.result,
      confidence: 98,
      source: this.name,
      timestamp: new Date(),
    };
  }

  private async geocode(params: {
    address: string;
  }): Promise<PluginResult> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?` +
      `address=${encodeURIComponent(params.address)}` +
      `&key=${this.apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return {
        success: false,
        error: data.status,
        confidence: 0,
        source: this.name,
        timestamp: new Date(),
      };
    }

    const location = data.results[0].geometry.location;

    return {
      success: true,
      data: {
        lat: location.lat,
        lng: location.lng,
        formattedAddress: data.results[0].formatted_address,
      },
      confidence: 99,
      source: this.name,
      timestamp: new Date(),
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/nearbysearch/json?` +
        `location=43.6532,-79.3832&radius=1000&key=${this.apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      return data.status === 'OK' || data.status === 'ZERO_RESULTS';
    } catch {
      return false;
    }
  }
}
```

### Discovery Agent

```typescript
// src/server/agents/google-places.ts
export class GooglePlacesAgent {
  name = 'Google Places Discovery Agent';

  async execute(context: AgentContext): Promise<AgentResult> {
    const { criteria } = context;

    // Step 1: Geocode city
    const geocodeResult = await pluginRegistry.executePlugin('google-places', {
      type: 'geocode',
      address: `${criteria.city}, ${criteria.province}, ${criteria.country}`,
    });

    if (!geocodeResult.success) {
      return { success: false, error: 'Geocoding failed', itemsProcessed: 0 };
    }

    const { lat, lng } = geocodeResult.data;

    // Step 2: Nearby search
    const searchResult = await pluginRegistry.executePlugin('google-places', {
      type: 'nearby',
      location: `${lat},${lng}`,
      radius: criteria.radiusKm * 1000,
      keyword: criteria.category,
    });

    if (!searchResult.success) {
      return { success: false, error: 'Search failed', itemsProcessed: 0 };
    }

    // Step 3: Enrich with Place Details
    const leads: BusinessLead[] = [];

    for (const place of searchResult.data.slice(0, criteria.targetCount)) {
      const detailsResult = await pluginRegistry.executePlugin('google-places', {
        type: 'details',
        placeId: place.place_id,
      });

      if (detailsResult.success) {
        const details = detailsResult.data;

        leads.push({
          id: `gp-${place.place_id}`,
          name: details.name,
          category: criteria.category,
          country: criteria.country,
          province: criteria.province,
          city: criteria.city,
          address: details.formatted_address,
          lat: details.geometry.location.lat,
          lng: details.geometry.location.lng,
          phone: details.formatted_phone_number || '',
          email: '',
          website: details.website || '',
          websiteStatus: 'Unknown',
          rating: details.rating || 0,
          reviewCount: details.user_ratings_total || 0,
          opportunityScore: 0,
          grade: 'COLD',
          status: 'New',
          estimatedRevenue: '',
          socials: {},
          audit: {
            performance: 0,
            seo: 0,
            accessibility: 0,
            bestPractices: 0,
            mobileScore: 0,
            hasSSL: false,
            loadTimeMs: 0,
            techStack: [],
            issues: [],
            opportunities: [],
          },
          recommendedService: '',
          aiInsights: '',
          dataConfidence: 95,
          verificationStatus: 'Verified',
          lastUpdated: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString().split('T')[0],
          placeId: place.place_id,
          googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
          openingHours: details.opening_hours?.weekday_text,
          photos: details.photos?.map((p: any) => 
            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photo_reference}&key=${process.env.GOOGLE_PLACES_API_KEY}`
          ),
        });
      }

      context.onLog({
        agent: this.name,
        level: 'info',
        message: `Enriched ${details.name}`,
      });
    }

    context.leads = leads;

    return { success: true, itemsProcessed: leads.length };
  }
}
```

## API Endpoints

### Nearby Search

Find businesses within a radius of a location.

```
GET https://maps.googleapis.com/maps/api/place/nearbysearch/json
  ?location=43.6532,-79.3832
  &radius=25000
  &keyword=Dental+Clinic
  &key=YOUR_API_KEY
```

**Parameters:**
- `location` (required) - Latitude,longitude
- `radius` (required) - Distance in meters (max 50000)
- `keyword` - Term to match in business data
- `type` - Place type (e.g., `dentist`, `restaurant`)
- `name` - Business name
- `opennow` - Only return places open now
- `minprice` / `maxprice` - Price level filter
- `pagetoken` - Token for next page of results

**Response:**
```json
{
  "status": "OK",
  "results": [
    {
      "place_id": "ChIJ...",
      "name": "Business Name",
      "vicinity": "Toronto",
      "geometry": {
        "location": {
          "lat": 43.6532,
          "lng": -79.3832
        }
      },
      "rating": 4.5,
      "user_ratings_total": 127,
      "types": ["dentist", "health", "point_of_interest"]
    }
  ],
  "next_page_token": "..."
}
```

### Text Search

Search for businesses by query string.

```
GET https://maps.googleapis.com/maps/api/place/textsearch/json
  ?query=Dental+Clinic+in+Toronto
  &key=YOUR_API_KEY
```

**Parameters:**
- `query` (required) - Search query
- `location` - Bias results to a location
- `radius` - Radius in meters
- `language` - Language for results
- `pagetoken` - Next page token

### Place Details

Get detailed information about a specific place.

```
GET https://maps.googleapis.com/maps/api/place/details/json
  ?place_id=ChIJ...
  &fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,geometry,opening_hours,photos
  &key=YOUR_API_KEY
```

**Fields:**
- `name` - Business name
- `formatted_address` - Full address
- `formatted_phone_number` - Phone number
- `website` - Website URL
- `rating` - Average rating (0-5)
- `user_ratings_total` - Total number of reviews
- `geometry.location` - Latitude/longitude
- `opening_hours.weekday_text` - Opening hours
- `photos` - Array of photo references
- `reviews` - User reviews
- `price_level` - Price level (0-4)
- `types` - Place types

### Geocoding

Convert address to coordinates.

```
GET https://maps.googleapis.com/maps/api/geocode/json
  ?address=Toronto,Ontario,Canada
  &key=YOUR_API_KEY
```

**Response:**
```json
{
  "status": "OK",
  "results": [
    {
      "formatted_address": "Toronto, ON, Canada",
      "geometry": {
        "location": {
          "lat": 43.6532,
          "lng": -79.3832
        }
      },
      "place_id": "ChIJ..."
    }
  ]
}
```

## Rate Limits & Pricing

### Rate Limits

- **Requests per second:** 50 QPS (queries per second)
- **Requests per day:** Unlimited (pay per use)
- **Concurrent requests:** No hard limit

### Pricing (as of 2025)

| API | Cost per 1000 requests |
|-----|------------------------|
| Nearby Search | $32 |
| Text Search | $32 |
| Place Details | $17 |
| Geocoding | $5 |

**Free tier:** $200 monthly credit (~6,250 searches)

### Quota Management

```typescript
// Track API usage
let dailyRequests = 0;
let dailyCost = 0;

function trackRequest(api: string) {
  dailyRequests++;
  
  const costs: Record<string, number> = {
    'nearbysearch': 0.032,
    'textsearch': 0.032,
    'details': 0.017,
    'geocode': 0.005,
  };
  
  dailyCost += costs[api] || 0;
  
  if (dailyCost > 150) {
    console.warn('Approaching daily budget limit');
  }
}
```

## Best Practices

### 1. Use Specific Fields

Only request fields you need to reduce costs:

```typescript
// Good - only request needed fields
const url = `${baseUrl}/details/json?` +
  `place_id=${placeId}` +
  `&fields=name,formatted_address,website,rating` +
  `&key=${apiKey}`;

// Bad - requests all fields (more expensive)
const url = `${baseUrl}/details/json?place_id=${placeId}&key=${apiKey}`;
```

### 2. Cache Results

Cache Place Details to avoid repeated requests:

```typescript
const cache = new Map<string, any>();

async function getPlaceDetails(placeId: string) {
  if (cache.has(placeId)) {
    return cache.get(placeId);
  }
  
  const result = await fetchPlaceDetails(placeId);
  cache.set(placeId, result);
  
  return result;
}
```

### 3. Handle Pagination

Nearby Search returns up to 20 results per page:

```typescript
async function getAllResults(location: string, radius: number, keyword: string) {
  const allResults = [];
  let pageToken = null;
  
  do {
    const url = `${baseUrl}/nearbysearch/json?` +
      `location=${location}&radius=${radius}&keyword=${keyword}` +
      (pageToken ? `&pagetoken=${pageToken}` : '') +
      `&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    allResults.push(...data.results);
    pageToken = data.next_page_token;
    
    // Wait before requesting next page (required by API)
    if (pageToken) {
      await sleep(2000);
    }
  } while (pageToken);
  
  return allResults;
}
```

### 4. Respect Rate Limits

```typescript
class RateLimiter {
  private queue: (() => Promise<any>)[] = [];
  private processing = false;
  
  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          resolve(await fn());
        } catch (err) {
          reject(err);
        }
      });
      
      this.process();
    });
  }
  
  private async process() {
    if (this.processing) return;
    this.processing = true;
    
    while (this.queue.length > 0) {
      const fn = this.queue.shift()!;
      await fn();
      await sleep(20); // 50 QPS = 20ms between requests
    }
    
    this.processing = false;
  }
}

const limiter = new RateLimiter();

// Usage
const result = await limiter.add(() => fetchPlaceDetails(placeId));
```

### 5. Error Handling

```typescript
async function safeApiCall(url: string): Promise<any> {
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OVER_QUERY_LIMIT') {
      throw new Error('Google Places API quota exceeded');
    }
    
    if (data.status === 'REQUEST_DENIED') {
      throw new Error('API request denied - check API key and permissions');
    }
    
    if (data.status === 'INVALID_REQUEST') {
      throw new Error('Invalid request parameters');
    }
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`API error: ${data.status}`);
    }
    
    return data;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Network error');
  }
}
```

## Compliance

### Terms of Service

✅ **Allowed:**
- Displaying results in your application
- Using data for business intelligence
- Caching results temporarily (up to 30 days)

❌ **Not Allowed:**
- Scraping Google Maps directly
- Bulk downloading data for resale
- Using data without attribution
- Pre-fetching, indexing, or storing Place Details (except temporary cache)

### Attribution

You must display "Powered by Google" when showing Places API results:

```typescript
// In your UI
<div>
  <p>Results provided by</p>
  <img src="https://developers.google.com/maps/documentation/images/powered_by_google_on_white.png" 
       alt="Powered by Google" />
</div>
```

## Troubleshooting

### REQUEST_DENIED

**Cause:** API key missing or invalid, or billing not enabled.

**Solution:**
1. Verify API key in Google Cloud Console
2. Enable Places API for your project
3. Enable billing (required even for free tier)

### OVER_QUERY_LIMIT

**Cause:** Exceeded daily quota or QPS limit.

**Solution:**
1. Implement rate limiting
2. Cache results
3. Request quota increase in Console

### ZERO_RESULTS

**Cause:** No businesses found for the query.

**Solution:**
1. Expand search radius
2. Try different keywords
3. Check location coordinates

### INVALID_REQUEST

**Cause:** Missing required parameters or invalid values.

**Solution:**
1. Verify all required parameters are present
2. Check parameter formats (e.g., `location` must be `lat,lng`)
3. Ensure radius is within valid range (0-50000)

## Resources

- **Official Docs:** https://developers.google.com/maps/documentation/places
- **API Reference:** https://developers.google.com/maps/documentation/places/web-service
- **Console:** https://console.cloud.google.com/google/maps-apis
- **Pricing:** https://developers.google.com/maps/documentation/places/web-service/usage-and-billing
- **Quotas:** https://developers.google.com/maps/documentation/places/web-service/usage-and-billing#qps
