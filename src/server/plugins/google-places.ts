import { BasePlugin } from './base';
import { PluginResult } from '../types';
import { config } from '../config';

interface PlacesSearchResult {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  rating?: number;
  userRatingsTotal?: number;
  types: string[];
  businessStatus?: string;
  openingHours?: string[];
  photos?: { photoReference: string; width: number; height: number }[];
  googleMapsUrl: string;
}

interface PlacesSearchParams {
  location: { lat: number; lng: number };
  radius: number;
  category: string;
  language?: string;
  maxResults?: number;
}

export class GooglePlacesPlugin extends BasePlugin {
  name = 'google-places';
  version = '2.0.0';
  description = 'Google Places API for compliant business discovery via Nearby Search, Text Search, and Place Details';

  private apiKey: string = '';

  async initialize(): Promise<void> {
    this.apiKey = config.apiKeys.googlePlaces;
    this.initialized = true;
  }

  async execute(params: PlacesSearchParams): Promise<PluginResult<PlacesSearchResult[]>> {
    if (!this.apiKey) {
      return this.simulateResults(params);
    }

    try {
      const results = await this.nearbySearch(params);
      const detailed = await Promise.all(
        results.slice(0, params.maxResults || 60).map((r) => this.getPlaceDetails(r.placeId))
      );

      return {
        success: true,
        data: detailed.filter((d): d is PlacesSearchResult => d !== null),
        confidence: 100,
        source: 'Google Places API',
        timestamp: new Date(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        confidence: 0,
        source: 'Google Places API',
        timestamp: new Date(),
      };
    }
  }

  private async nearbySearch(params: PlacesSearchParams): Promise<PlacesSearchResult[]> {
    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    url.searchParams.set('location', `${params.location.lat},${params.location.lng}`);
    url.searchParams.set('radius', String(params.radius * 1000));
    url.searchParams.set('type', this.mapCategory(params.category));
    url.searchParams.set('key', this.apiKey);
    if (params.language) url.searchParams.set('language', params.language);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown'}`);
    }

    return (data.results || []).map((r: any) => ({
      placeId: r.place_id,
      name: r.name,
      address: r.vicinity || '',
      lat: r.geometry.location.lat,
      lng: r.geometry.location.lng,
      rating: r.rating,
      userRatingsTotal: r.user_ratings_total,
      types: r.types || [],
      businessStatus: r.business_status,
      googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${r.place_id}`,
    }));
  }

  private async getPlaceDetails(placeId: string): Promise<PlacesSearchResult | null> {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('fields', 'place_id,name,formatted_address,geometry,formatted_phone_number,website,rating,user_ratings_total,types,business_status,opening_hours,photos,url');
    url.searchParams.set('key', this.apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' || !data.result) return null;

    const r = data.result;
    return {
      placeId: r.place_id,
      name: r.name,
      address: r.formatted_address,
      lat: r.geometry.location.lat,
      lng: r.geometry.location.lng,
      phone: r.formatted_phone_number,
      website: r.website,
      rating: r.rating,
      userRatingsTotal: r.user_ratings_total,
      types: r.types || [],
      businessStatus: r.business_status,
      openingHours: r.opening_hours?.weekday_text,
      photos: (r.photos || []).map((p: any) => ({
        photoReference: p.photo_reference,
        width: p.width,
        height: p.height,
      })),
      googleMapsUrl: r.url || `https://www.google.com/maps/place/?q=place_id:${r.place_id}`,
    };
  }

  async textSearch(query: string, location?: { lat: number; lng: number }, radius?: number): Promise<PluginResult<PlacesSearchResult[]>> {
    if (!this.apiKey) {
      return this.simulateResults({
        location: location || { lat: 43.6532, lng: -79.3832 },
        radius: radius || 25,
        category: query,
      });
    }

    try {
      const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
      url.searchParams.set('query', query);
      if (location) url.searchParams.set('location', `${location.lat},${location.lng}`);
      if (radius) url.searchParams.set('radius', String(radius * 1000));
      url.searchParams.set('key', this.apiKey);

      const response = await fetch(url.toString());
      const data = await response.json();

      const results = (data.results || []).map((r: any) => ({
        placeId: r.place_id,
        name: r.name,
        address: r.formatted_address,
        lat: r.geometry.location.lat,
        lng: r.geometry.location.lng,
        rating: r.rating,
        userRatingsTotal: r.user_ratings_total,
        types: r.types || [],
        businessStatus: r.business_status,
        googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${r.place_id}`,
      }));

      return {
        success: true,
        data: results,
        confidence: 100,
        source: 'Google Places Text Search',
        timestamp: new Date(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        confidence: 0,
        source: 'Google Places Text Search',
        timestamp: new Date(),
      };
    }
  }

  async geocode(address: string): Promise<PluginResult<{ lat: number; lng: number }>> {
    if (!this.apiKey) {
      return {
        success: true,
        data: { lat: 43.6532, lng: -79.3832 },
        confidence: 50,
        source: 'Geocode Fallback',
        timestamp: new Date(),
      };
    }

    try {
      const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
      url.searchParams.set('address', address);
      url.searchParams.set('key', this.apiKey);

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status !== 'OK' || !data.results?.[0]) {
        throw new Error(`Geocode error: ${data.status}`);
      }

      const loc = data.results[0].geometry.location;
      return {
        success: true,
        data: { lat: loc.lat, lng: loc.lng },
        confidence: 100,
        source: 'Google Geocoding API',
        timestamp: new Date(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        confidence: 0,
        source: 'Google Geocoding API',
        timestamp: new Date(),
      };
    }
  }

  private mapCategory(category: string): string {
    const mapping: Record<string, string> = {
      'Restaurant': 'restaurant',
      'Dental Clinic': 'dentist',
      'HVAC Services': 'establishment',
      'Law Firm': 'lawyer',
      'Auto Repair': 'car_repair',
      'Gym & Fitness': 'gym',
      'Plumbing': 'plumber',
      'Real Estate': 'real_estate_agency',
      'Medical Practice': 'doctor',
      'Accounting Firm': 'accounting',
      'Hotel': 'lodging',
      'Bar': 'bar',
      'Beauty': 'beauty_salon',
      'Barbers': 'hair_care',
      'Veterinary Clinics': 'veterinary_care',
      'Construction': 'general_contractor',
      'Electrical': 'electrician',
      'Roofing': 'roofing_contractor',
      'Landscaping': 'establishment',
      'Cleaning': 'establishment',
      'Insurance': 'insurance_agency',
      'Education': 'school',
      'Retail': 'store',
    };
    return mapping[category] || 'establishment';
  }

  private simulateResults(params: PlacesSearchParams): PluginResult<PlacesSearchResult[]> {
    const count = Math.min(params.maxResults || 20, 30);
    const results: PlacesSearchResult[] = Array.from({ length: count }, (_, i) => ({
      placeId: `sim_place_${Date.now()}_${i}`,
      name: this.generateBusinessName(params.category, i),
      address: `${100 + i * 45} Main St, ${params.location.lat.toFixed(4)}`,
      lat: params.location.lat + (Math.random() - 0.5) * 0.05,
      lng: params.location.lng + (Math.random() - 0.5) * 0.05,
      phone: `+1 (${Math.floor(200 + Math.random() * 700)}) 555-${String(1000 + i).padStart(4, '0')}`,
      website: i % 5 === 0 ? undefined : `www.${this.generateBusinessName(params.category, i).toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      rating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
      userRatingsTotal: Math.floor(20 + Math.random() * 300),
      types: [this.mapCategory(params.category)],
      businessStatus: 'OPERATIONAL',
      googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:sim_place_${i}`,
    }));

    return {
      success: true,
      data: results,
      confidence: 75,
      source: 'Simulated Places Data',
      timestamp: new Date(),
    };
  }

  private generateBusinessName(category: string, index: number): string {
    const prefixes = ['Apex', 'Summit', 'Precision', 'Metro', 'Elite', 'Urban', 'Vanguard', 'Iron', 'Bella', 'Golden', 'Pacific', 'Northern', 'Royal', 'Pioneer', 'Heritage'];
    const suffixes = ['Group', 'Solutions', 'Center', 'Partners', 'Associates', 'Studio', 'Works', 'Hub', 'Pro', 'Plus', 'Express', 'Direct'];
    const p = prefixes[index % prefixes.length];
    const s = suffixes[(index * 3) % suffixes.length];
    return `${p} ${category} ${s}`;
  }
}
