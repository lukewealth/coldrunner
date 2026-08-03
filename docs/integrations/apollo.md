# Apollo.io Integration Guide

## Overview

Apollo.io is a sales intelligence and engagement platform. ColdRunners uses it to enrich contact data and find decision-maker information.

**Official Documentation:** https://docs.apollo.io  
**Website:** https://apollo.io  
**API Reference:** https://docs.apollo.io/docs/api-overview

## Features

- Contact search and enrichment
- Company search
- Email verification
- Job title lookup
- Social profile discovery
- Technographics data

## ColdRunners Usage

### Plugin Implementation

```typescript
// src/server/plugins/apollo.ts
import { Plugin, PluginResult } from '../types';

export class ApolloPlugin implements Plugin {
  name = 'apollo';
  version = '1.0.0';
  description = 'Apollo.io contact enrichment';

  private apiKey: string;
  private baseUrl = 'https://api.apollo.io/v1';

  async initialize(): Promise<void> {
    this.apiKey = process.env.APOLLO_API_KEY || '';
  }

  async execute(params: {
    companyName?: string;
    city?: string;
    personTitle?: string;
  }): Promise<PluginResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Apollo.io API key not configured',
        confidence: 0,
        source: this.name,
        timestamp: new Date(),
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/contacts/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          q_organization_name: params.companyName,
          q_organization_localities: params.city ? [params.city.toLowerCase()] : undefined,
          person_titles: params.personTitle ? [params.personTitle] : ['Owner', 'CEO', 'Founder', 'President'],
          page: 1,
          per_page: 5,
        }),
      });

      const data = await response.json();

      if (!data.contacts || data.contacts.length === 0) {
        return {
          success: true,
          data: { contacts: [] },
          confidence: 0,
          source: this.name,
          timestamp: new Date(),
        };
      }

      const contacts = data.contacts.map((contact: any) => ({
        id: contact.id,
        firstName: contact.first_name,
        lastName: contact.last_name,
        name: contact.name,
        email: contact.email,
        title: contact.title,
        phone: contact.phone_numbers?.[0]?.sanitized_number,
        linkedin: contact.linkedin_url,
        organization: contact.organization_name,
        location: contact.city,
      }));

      return {
        success: true,
        data: { contacts },
        confidence: 85,
        source: this.name,
        timestamp: new Date(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        confidence: 0,
        source: this.name,
        timestamp: new Date(),
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/health`, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

## API Endpoints

### Contact Search

Search for contacts by company, title, location.

```bash
curl -X POST https://api.apollo.io/v1/contacts/search \
  -H "Content-Type: application/json" \
  -H "Cache-Control: no-cache" \
  -d '{
    "api_key": "YOUR_API_KEY",
    "q_organization_name": "Stripe",
    "person_titles": ["CEO", "Founder"],
    "page": 1,
    "per_page": 10
  }'
```

**Response:**
```json
{
  "contacts": [
    {
      "id": "123",
      "first_name": "John",
      "last_name": "Doe",
      "name": "John Doe",
      "email": "john@stripe.com",
      "title": "CEO",
      "phone_numbers": [
        {
          "sanitized_number": "+1234567890"
        }
      ],
      "linkedin_url": "https://linkedin.com/in/johndoe",
      "organization_name": "Stripe",
      "city": "San Francisco"
    }
  ],
  "total_pages": 1,
  "total_count": 1
}
```

### Company Search

Search for companies by name, industry, location.

```bash
curl -X POST https://api.apollo.io/v1/organizations/search \
  -H "Content-Type: application/json" \
  -H "Cache-Control: no-cache" \
  -d '{
    "api_key": "YOUR_API_KEY",
    "q_organization_name": "Stripe",
    "organization_locations": ["San Francisco"],
    "page": 1,
    "per_page": 10
  }'
```

### Person Bulk Lookup

Look up multiple people by email.

```bash
curl -X POST https://api.apollo.io/v1/people/bulk_match \
  -H "Content-Type: application/json" \
  -H "Cache-Control: no-cache" \
  -d '{
    "api_key": "YOUR_API_KEY",
    "emails": ["john@stripe.com", "jane@stripe.com"]
  }'
```

## Rate Limits

- **Free tier:** Limited credits
- **Basic plan:** 10,000 credits/month
- **Professional plan:** 50,000 credits/month
- **Organization plan:** Unlimited credits

1 credit = 1 contact reveal or 1 email verification

## Best Practices

### 1. Use Specific Titles

```typescript
const titles = ['Owner', 'CEO', 'Founder', 'President', 'Managing Director'];

const result = await apollo.search({
  companyName: lead.name,
  personTitle: titles.join(','),
});
```

### 2. Filter by Location

```typescript
const result = await apollo.search({
  companyName: lead.name,
  city: lead.city,
});
```

### 3. Cache Results

```typescript
const contactCache = new Map<string, any>();

async function getContacts(companyName: string) {
  if (contactCache.has(companyName)) {
    return contactCache.get(companyName);
  }

  const result = await apollo.search({ companyName });
  contactCache.set(companyName, result);
  return result;
}
```

## Resources

- **Official Docs:** https://docs.apollo.io
- **API Reference:** https://docs.apollo.io/docs/api-overview
- **Pricing:** https://apollo.io/pricing
- **Support:** https://apollo.io/help
