import { Agent, AgentContext, AgentResult } from './types';
import { SearchCriteria, BusinessLead, WorkflowLog } from '../types';
import { pluginRegistry } from '../plugins';
import { GooglePlacesPlugin } from '../plugins/google-places';

export class GooglePlacesAgent implements Agent {
  type = 'google-places' as const;
  name = 'Google Places Discovery Agent';
  description = 'Discovers businesses using Google Places API (Nearby Search, Text Search, Place Details)';

  async execute(context: AgentContext): Promise<AgentResult> {
    const { criteria, onLog } = context;
    const placesPlugin = pluginRegistry.get<GooglePlacesPlugin>('google-places');

    if (!placesPlugin) {
      return { success: false, error: 'Google Places plugin not available', itemsProcessed: 0 };
    }

    onLog({ agent: this.name, level: 'info', message: `Starting discovery for ${criteria.category} in ${criteria.city}, ${criteria.province || criteria.country}` });

    try {
      const geocodeResult = await placesPlugin.geocode(`${criteria.city}, ${criteria.province || ''}, ${criteria.country}`);
      
      if (!geocodeResult.success || !geocodeResult.data) {
        onLog({ agent: this.name, level: 'error', message: `Geocoding failed: ${geocodeResult.error}` });
        return { success: false, error: geocodeResult.error, itemsProcessed: 0 };
      }

      const { lat, lng } = geocodeResult.data;
      onLog({ agent: this.name, level: 'success', message: `Geocoded ${criteria.city} to ${lat.toFixed(4)}, ${lng.toFixed(4)}` });

      const categories = criteria.categories || [criteria.category];
      let allResults: any[] = [];

      for (const category of categories) {
        onLog({ agent: this.name, level: 'info', message: `Searching for ${category} within ${criteria.radiusKm}km radius...` });

        const result = await placesPlugin.execute({
          location: { lat, lng },
          radius: criteria.radiusKm,
          category,
          maxResults: Math.ceil(criteria.targetCount / categories.length),
        });

        if (result.success && result.data) {
          allResults = [...allResults, ...result.data];
          onLog({ agent: this.name, level: 'success', message: `Found ${result.data.length} ${category} businesses` });
        }
      }

      onLog({ agent: this.name, level: 'success', message: `Total raw discovery: ${allResults.length} businesses from Google Places API` });
      context.leads = allResults.map((r) => this.mapToLead(r, criteria));

      return {
        success: true,
        leads: context.leads,
        itemsProcessed: allResults.length,
      };
    } catch (err: any) {
      onLog({ agent: this.name, level: 'error', message: `Discovery failed: ${err.message}` });
      return { success: false, error: err.message, itemsProcessed: 0 };
    }
  }

  private mapToLead(place: any, criteria: SearchCriteria): BusinessLead {
    const hasWebsite = !!place.website;
    const websiteStatus = !hasWebsite ? 'Missing' as const : 'Good' as const;
    const score = this.calculateInitialScore(place, websiteStatus);
    const grade = score >= 85 ? 'HOT' as const : score >= 60 ? 'WARM' as const : 'COLD' as const;

    return {
      id: `lead-${place.placeId || Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: place.name,
      category: criteria.category,
      country: criteria.country,
      province: criteria.province || '',
      city: criteria.city,
      address: place.address || '',
      lat: place.lat,
      lng: place.lng,
      phone: place.phone || '',
      email: '',
      website: place.website || '',
      websiteStatus,
      rating: place.rating || 0,
      reviewCount: place.userRatingsTotal || 0,
      opportunityScore: score,
      grade,
      status: 'New',
      estimatedRevenue: this.estimateRevenue(place),
      placeId: place.placeId,
      googleMapsUrl: place.googleMapsUrl,
      openingHours: place.openingHours,
      photos: place.photos?.map((p: any) => p.photoReference),
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
      dataConfidence: 85,
      verificationStatus: 'Pending',
      lastUpdated: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
    };
  }

  private calculateInitialScore(place: any, websiteStatus: string): number {
    let score = 0;
    if (!place.website) score += 40;
    if (place.rating >= 4.5) score += 10;
    if (place.userRatingsTotal >= 150) score += 10;
    if (place.userRatingsTotal >= 50) score += 5;
    if (place.businessStatus === 'OPERATIONAL') score += 5;
    score += Math.floor(Math.random() * 20);
    return Math.min(score, 100);
  }

  private estimateRevenue(place: any): string {
    const reviews = place.userRatingsTotal || 0;
    if (reviews > 200) return '$1.5M - $3.0M';
    if (reviews > 100) return '$800k - $1.5M';
    if (reviews > 50) return '$500k - $800k';
    if (reviews > 20) return '$250k - $500k';
    return '$100k - $250k';
  }
}
