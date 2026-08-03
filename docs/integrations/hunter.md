# Hunter.io Integration Guide

## Overview

Hunter.io is an email discovery and verification service. ColdRunners uses it to find business email addresses associated with domains.

**Official Documentation:** https://hunter.io/api-documentation  
**Website:** https://hunter.io  
**API Reference:** https://hunter.io/api/v2/docs

## Features

- Domain search (find all emails for a domain)
- Email finder (find email by name + domain)
- Email verification
- Email count (check how many emails are available)
- Account information

## ColdRunners Usage

### Plugin Implementation

```typescript
// src/server/plugins/hunter.ts
import { Plugin, PluginResult } from '../types';

export class HunterPlugin implements Plugin {
  name = 'hunter';
  version = '1.0.0';
  description = 'Hunter.io email discovery';

  private apiKey: string;
  private baseUrl = 'https://api.hunter.io/v2';

  async initialize(): Promise<void> {
    this.apiKey = process.env.HUNTER_API_KEY || '';
  }

  async execute(params: { domain: string; companyName?: string }): Promise<PluginResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Hunter.io API key not configured',
        confidence: 0,
        source: this.name,
        timestamp: new Date(),
      };
    }

    try {
      // Domain search
      const response = await fetch(
        `${this.baseUrl}/domain-search?domain=${params.domain}&api_key=${this.apiKey}`
      );

      const data = await response.json();

      if (data.errors) {
        return {
          success: false,
          error: data.errors.map((e: any) => e.details).join(', '),
          confidence: 0,
          source: this.name,
          timestamp: new Date(),
        };
      }

      const emails = data.data.emails.map((email: any) => ({
        address: email.value,
        type: email.type,
        confidence: email.confidence,
        firstName: email.first_name,
        lastName: email.last_name,
        position: email.position,
        department: email.department,
      }));

      return {
        success: true,
        data: {
          domain: params.domain,
          emails,
          total: data.data.total,
        },
        confidence: 90,
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
      const response = await fetch(`${this.baseUrl}/account?api_key=${this.apiKey}`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

### Contact Discovery Agent

```typescript
// src/server/agents/contact-discovery.ts
export class ContactDiscoveryAgent {
  async execute(context: AgentContext): Promise<AgentResult> {
    let processed = 0;

    for (const lead of context.leads) {
      if (!lead.website) continue;

      const domain = lead.website.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

      // Hunter.io email discovery
      const hunterResult = await pluginRegistry.executePlugin('hunter', {
        domain,
        companyName: lead.name,
      });

      if (hunterResult.success && hunterResult.data?.emails?.length > 0) {
        const emails = hunterResult.data.emails;

        // Find best email (highest confidence, general or sales type)
        const bestEmail = emails.find((e: any) => 
          e.confidence > 80 && (e.type === 'general' || e.type === 'sales')
        ) || emails[0];

        lead.email = bestEmail.address;

        // Set HR contact if available
        if (bestEmail.firstName || bestEmail.lastName) {
          lead.hrContact = {
            name: `${bestEmail.firstName || ''} ${bestEmail.lastName || ''}`.trim(),
            email: bestEmail.address,
            title: bestEmail.position,
          };
        }

        processed++;
      }

      context.onLog({
        agent: this.name,
        level: 'info',
        message: `Discovered contacts for ${lead.name}`,
      });
    }

    return { success: true, itemsProcessed: processed };
  }
}
```

## API Endpoints

### Domain Search

Find all email addresses for a domain.

```bash
curl "https://api.hunter.io/v2/domain-search?domain=stripe.com&api_key=YOUR_API_KEY"
```

**Response:**
```json
{
  "data": {
    "domain": "stripe.com",
    "disposable": false,
    "webmail": false,
    "accept_all": false,
    "pattern": "{first}",
    "organization": "Stripe",
    "total": 42,
    "emails": [
      {
        "value": "support@stripe.com",
        "type": "general",
        "confidence": 99,
        "first_name": null,
        "last_name": null,
        "position": "Customer Support",
        "department": "support"
      },
      {
        "value": "john.doe@stripe.com",
        "type": "personal",
        "confidence": 95,
        "first_name": "John",
        "last_name": "Doe",
        "position": "Software Engineer",
        "department": "engineering"
      }
    ]
  }
}
```

### Email Finder

Find email address by name and domain.

```bash
curl "https://api.hunter.io/v2/email-finder?domain=stripe.com&first_name=John&last_name=Doe&api_key=YOUR_API_KEY"
```

**Response:**
```json
{
  "data": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@stripe.com",
    "score": 95,
    "position": "Software Engineer",
    "twitter": "johndoe",
    "linkedin": "linkedin.com/in/johndoe"
  }
}
```

### Email Verification

Verify if an email address is deliverable.

```bash
curl "https://api.hunter.io/v2/email-verifier?email=john@stripe.com&api_key=YOUR_API_KEY"
```

**Response:**
```json
{
  "data": {
    "email": "john@stripe.com",
    "result": "deliverable",
    "score": 95,
    "regexp": true,
    "gibberish": false,
    "disposable": false,
    "webmail": false,
    "mx_records": true,
    "smtp_server": true,
    "smtp_check": true,
    "accept_all": false,
    "block": false,
    "sources": [...]
  }
}
```

### Email Count

Check how many emails Hunter has for a domain.

```bash
curl "https://api.hunter.io/v2/email-count?domain=stripe.com"
```

**Response:**
```json
{
  "data": {
    "total": 42,
    "personal_emails": 35,
    "generic_emails": 7
  }
}
```

## Rate Limits & Pricing

### Free Plan

- 25 searches/month
- 50 verifications/month
- Basic support

### Starter Plan ($49/month)

- 500 searches/month
- 1,000 verifications/month
- Email finder

### Growth Plan ($149/month)

- 5,000 searches/month
- 10,000 verifications/month
- All features

### Business Plan ($399/month)

- 20,000 searches/month
- 50,000 verifications/month
- Priority support

## Best Practices

### 1. Check Email Count First

```typescript
async function hasEnoughEmails(domain: string): Promise<boolean> {
  const response = await fetch(
    `${baseUrl}/email-count?domain=${domain}`
  );
  const data = await response.json();
  return data.data.total >= 5;
}
```

### 2. Filter by Confidence

```typescript
const highConfidenceEmails = emails.filter(
  (e: any) => e.confidence >= 80
);
```

### 3. Prioritize Email Types

```typescript
const priority = ['general', 'sales', 'support', 'personal'];

const sortedEmails = emails.sort((a: any, b: any) => {
  const aIndex = priority.indexOf(a.type);
  const bIndex = priority.indexOf(b.type);
  return aIndex - bIndex;
});
```

### 4. Cache Results

```typescript
const emailCache = new Map<string, any>();

async function getEmails(domain: string) {
  if (emailCache.has(domain)) {
    return emailCache.get(domain);
  }

  const result = await hunterSearch(domain);
  emailCache.set(domain, result);
  return result;
}
```

## Error Handling

```typescript
async function safeHunterSearch(domain: string): Promise<any> {
  try {
    const response = await fetch(
      `${baseUrl}/domain-search?domain=${domain}&api_key=${apiKey}`
    );

    const data = await response.json();

    if (response.status === 429) {
      throw new Error('Hunter.io rate limit exceeded');
    }

    if (response.status === 401) {
      throw new Error('Invalid Hunter.io API key');
    }

    if (data.errors) {
      throw new Error(data.errors[0].details);
    }

    return data;
  } catch (err) {
    console.error(`Hunter.io error for ${domain}:`, err);
    return null;
  }
}
```

## Resources

- **Official Docs:** https://hunter.io/api-documentation
- **API Reference:** https://hunter.io/api/v2/docs
- **Pricing:** https://hunter.io/pricing
- **Support:** https://hunter.io/support
