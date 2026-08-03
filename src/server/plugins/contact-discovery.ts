import { BasePlugin } from './base';
import { PluginResult } from '../types';
import { config } from '../config';

interface EmailDiscoveryResult {
  emails: {
    address: string;
    type: 'business' | 'sales' | 'support' | 'info' | 'owner';
    confidence: number;
  }[];
  phone?: string;
  ownerName?: string;
  ownerTitle?: string;
  socialProfiles?: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

export class HunterPlugin extends BasePlugin {
  name = 'hunter';
  version = '2.0.0';
  description = 'Hunter.io API for business email discovery and contact enrichment';

  private apiKey: string = '';

  async initialize(): Promise<void> {
    this.apiKey = config.apiKeys.hunter;
    this.initialized = true;
  }

  async execute(params: { domain: string; companyName?: string }): Promise<PluginResult<EmailDiscoveryResult>> {
    const { domain, companyName } = params;

    if (!this.apiKey) {
      return this.simulateDiscovery(domain, companyName);
    }

    try {
      const url = new URL('https://api.hunter.io/v2/domain-search');
      url.searchParams.set('domain', domain.replace(/^https?:\/\//, '').replace(/\/.*$/, ''));
      url.searchParams.set('api_key', this.apiKey);

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.errors) {
        throw new Error(`Hunter API error: ${data.errors[0]?.details || 'Unknown'}`);
      }

      const emails = (data.data?.emails || []).map((e: any) => ({
        address: e.value,
        type: this.classifyEmailType(e.type, e.position || ''),
        confidence: e.confidence || 70,
      }));

      return {
        success: true,
        data: {
          emails,
          ownerName: data.data?.owner_name || companyName,
          socialProfiles: data.data?.social_profiles,
        },
        confidence: 85,
        source: 'Hunter.io API',
        timestamp: new Date(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        confidence: 0,
        source: 'Hunter.io',
        timestamp: new Date(),
      };
    }
  }

  private classifyEmailType(type: string, position: string): 'business' | 'sales' | 'support' | 'info' | 'owner' {
    if (position.toLowerCase().includes('owner') || position.toLowerCase().includes('ceo') || position.toLowerCase().includes('founder')) return 'owner';
    if (type === 'sales' || position.toLowerCase().includes('sales')) return 'sales';
    if (type === 'support' || position.toLowerCase().includes('support')) return 'support';
    if (type === 'info') return 'info';
    return 'business';
  }

  private simulateDiscovery(domain: string, companyName?: string): PluginResult<EmailDiscoveryResult> {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace('www.', '');
    const baseName = cleanDomain.split('.')[0];

    return {
      success: true,
      data: {
        emails: [
          { address: `contact@${cleanDomain}`, type: 'business', confidence: 92 },
          { address: `info@${cleanDomain}`, type: 'info', confidence: 85 },
          { address: `sales@${cleanDomain}`, type: 'sales', confidence: 78 },
        ],
        phone: `+1 (${Math.floor(200 + Math.random() * 700)}) 555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        ownerName: companyName || `${['James', 'Sarah', 'Michael', 'Emily', 'David'][Math.floor(Math.random() * 5)]} ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][Math.floor(Math.random() * 5)]}`,
        ownerTitle: ['Owner', 'Founder', 'CEO', 'Managing Director', 'President'][Math.floor(Math.random() * 5)],
        socialProfiles: {
          linkedin: `linkedin.com/company/${baseName}`,
          facebook: `facebook.com/${baseName}`,
          instagram: `instagram.com/${baseName}`,
        },
      },
      confidence: 70,
      source: 'Simulated Hunter Data',
      timestamp: new Date(),
    };
  }
}

export class ApolloPlugin extends BasePlugin {
  name = 'apollo';
  version = '2.0.0';
  description = 'Apollo.io API for decision-maker contact discovery and enrichment';

  private apiKey: string = '';

  async initialize(): Promise<void> {
    this.apiKey = config.apiKeys.apollo;
    this.initialized = true;
  }

  async execute(params: { companyName: string; city?: string; title?: string }): Promise<PluginResult<EmailDiscoveryResult>> {
    if (!this.apiKey) {
      return this.simulateDiscovery(params);
    }

    try {
      const response = await fetch('https://api.apollo.io/v1/mixed_people/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Api-Key': this.apiKey,
        },
        body: JSON.stringify({
          q_organization_domains: params.companyName,
          person_titles: params.title ? [params.title] : ['Owner', 'CEO', 'Founder'],
          locations: params.city ? [params.city] : [],
          page: 1,
          per_page: 10,
        }),
      });

      const data = await response.json();
      const people = data.people || [];

      if (people.length === 0) {
        return this.simulateDiscovery(params);
      }

      const emails = people
        .filter((p: any) => p.email)
        .map((p: any) => ({
          address: p.email,
          type: (p.title?.toLowerCase().includes('owner') || p.title?.toLowerCase().includes('ceo')) ? 'owner' as const : 'business' as const,
          confidence: 85,
        }));

      return {
        success: true,
        data: {
          emails,
          ownerName: people[0]?.first_name && people[0]?.last_name
            ? `${people[0].first_name} ${people[0].last_name}`
            : undefined,
          ownerTitle: people[0]?.title,
          phone: people[0]?.phone_numbers?.[0]?.sanitised,
          socialProfiles: {
            linkedin: people[0]?.linkedin_url,
          },
        },
        confidence: 88,
        source: 'Apollo.io API',
        timestamp: new Date(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        confidence: 0,
        source: 'Apollo.io',
        timestamp: new Date(),
      };
    }
  }

  private simulateDiscovery(params: { companyName: string; city?: string; title?: string }): PluginResult<EmailDiscoveryResult> {
    const domain = params.companyName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
    return {
      success: true,
      data: {
        emails: [
          { address: `owner@${domain}`, type: 'owner', confidence: 80 },
          { address: `contact@${domain}`, type: 'business', confidence: 75 },
        ],
        ownerName: `${['Robert', 'Maria', 'David', 'Lisa', 'Ahmed'][Math.floor(Math.random() * 5)]} ${['Chen', 'Patel', 'Okafor', 'Martinez', 'Kim'][Math.floor(Math.random() * 5)]}`,
        ownerTitle: params.title || 'Owner & Founder',
        phone: `+1 (${Math.floor(200 + Math.random() * 700)}) 555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      },
      confidence: 65,
      source: 'Simulated Apollo Data',
      timestamp: new Date(),
    };
  }
}
