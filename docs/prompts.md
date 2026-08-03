# Prompt Engineering

## Overview

ColdRunners uses AI prompts for email generation, campaign creation, business analysis, and lead scoring. This document covers prompt templates, best practices, and routing.

## Current Prompts (Gemini)

### Email Draft

```typescript
const prompt = `Write a personalized B2B outreach email for:
Business: ${lead.name} (${lead.category}) in ${lead.city}
Owner: ${lead.ownerName || 'Owner'}
Website: ${lead.website} (Status: ${lead.websiteStatus}, Performance: ${lead.audit?.performance || 45}/100)
Opportunity Score: ${lead.opportunityScore}/100
Issues: ${lead.audit?.issues?.join('; ') || 'Slow load speed'}
Recommended: ${lead.recommendedService || 'Modern Web Application'}
Style: ${style}

Return JSON: { "subject": "...", "body": "...", "promptTemplateUsed": "..." }`;
```

### Campaign Generation

```typescript
const prompt = `Write a multi-channel sales campaign for:
Business: ${lead.name} (${lead.category}) in ${lead.city}
Owner: ${lead.ownerName || 'Owner'}
Website: ${lead.website} (${lead.websiteStatus})
Rating: ${lead.rating}★ (${lead.reviewCount} reviews)
Issues: ${lead.audit?.issues?.join(', ')}
Pitch: ${lead.recommendedService}

Return JSON: { "leadId": "...", "businessName": "...", "emailSubject": "...",
"emailBody": "...", "linkedinPitch": "...", "callScript": "...",
"whatsappMessage": "..." }`;
```

### Lead Generation (Fallback)

```typescript
const prompt = `Generate ${count} realistic business leads for ${category} in ${city}, ${province}, ${country}.
Return JSON array with: id, name, category, country, province, city, address, lat, lng, phone,
email, ownerName, website, websiteStatus, rating, reviewCount, opportunityScore, grade, status,
estimatedRevenue, socials, audit, recommendedService, aiInsights, dataConfidence,
verificationStatus, lastUpdated, createdAt`;
```

## Prompt Design Principles

1. **Be specific** — Include all relevant context
2. **Define output format** — Always request JSON with explicit schema
3. **Set constraints** — Word limits, tone, style
4. **Provide examples** — Few-shot when possible
5. **Use system prompts** — Separate instructions from data
6. **Validate output** — Always parse and validate AI responses

## Email Styles

### Consultative Audit

Tone: Professional, analytical, value-focused.

```
You are a business consultant writing a personalized analysis email.
Focus on data-driven insights and specific improvements.
Tone: Professional, helpful, not salesy.
Include specific metrics from the website audit.
End with a soft call-to-action (video walkthrough offer).
```

### Direct Pitch

Tone: Confident, results-oriented, concise.

```
You are a sales professional writing a direct pitch email.
Lead with the opportunity score and potential ROI.
Be specific about what you'll deliver.
End with a clear call-to-action (meeting request).
```

### Short & Punchy

Tone: Casual, brief, curiosity-driven.

```
You are writing a short, attention-grabbing email.
Maximum 100 words.
Focus on one key insight.
End with a question to spark curiosity.
```

## Phase 2 — Local LLM Prompts

### Ollama Prompt Format

```typescript
async function generateWithOllama(model: string, prompt: string) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    body: JSON.stringify({
      model,
      prompt,
      system: 'You are a business intelligence analyst for ColdRunners.',
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        num_predict: 1024,
      },
    }),
  });
  return response.json();
}
```

### Business Analysis Prompt (Local)

```
You are analyzing a business for ColdRunners lead intelligence platform.

BUSINESS DATA:
Name: {name}
Category: {category}
Location: {city}, {province}
Website: {website}
Rating: {rating}/5 ({reviewCount} reviews)
Website Status: {websiteStatus}

AUDIT RESULTS:
Performance: {performance}/100
SEO: {seo}/100
Accessibility: {accessibility}/100
Issues: {issues}

Calculate an opportunity score (0-100) and provide:
1. Score with reasoning
2. Top 3 issues
3. Top 3 recommendations
4. One-sentence AI insight

Return valid JSON only.
```

## Prompt Templates Library

### Template: Website Analysis

```
Analyze the website {url} for business opportunity.

Check:
1. Page load speed (mobile)
2. SEO fundamentals (meta tags, headings, schema)
3. Technology stack (CMS, frameworks, analytics)
4. SSL certificate status
5. Mobile responsiveness
6. Contact form / booking system
7. Social media integration

Return JSON:
{
  "performance": 0-100,
  "seo": 0-100,
  "accessibility": 0-100,
  "bestPractices": 0-100,
  "techStack": ["..."],
  "issues": ["..."],
  "opportunities": ["..."]
}
```

### Template: Contact Discovery

```
Find contact information for {businessName} in {city}.

Look for:
1. Business email (general, sales, owner)
2. Phone number
3. Owner/decision-maker name
4. Social media profiles (LinkedIn, Facebook, Instagram)

Return JSON:
{
  "emails": [{"address": "...", "type": "...", "confidence": 0-100}],
  "phones": [{"number": "...", "type": "..."}],
  "contacts": [{"name": "...", "title": "..."}],
  "socials": {"linkedin": "...", "facebook": "...", "instagram": "..."}
}
```

### Template: Revenue Estimation

```
Estimate annual revenue for {businessName}.

Business data:
- Category: {category}
- Location: {city}, {province}
- Rating: {rating}/5 ({reviewCount} reviews)
- Website: {website}
- Social presence: {socials}

Consider:
- Industry averages for {category}
- Location economic factors
- Review volume as demand indicator
- Online presence maturity

Return JSON:
{
  "estimatedRevenue": "$Xk - $Yk",
  "confidence": 0-100,
  "reasoning": "..."
}
```

## Model Routing for Prompts

| Task | Model | Temperature | Max Tokens |
|------|-------|-------------|------------|
| Email draft | Qwen2.5-Coder 32B | 0.7 | 1024 |
| Campaign | DeepSeek-R1 | 0.8 | 2048 |
| Business analysis | Qwen3 8B | 0.3 | 512 |
| Lead generation | Qwen2.5-Coder 32B | 0.9 | 4096 |
| Score reasoning | DeepSeek-R1 | 0.2 | 256 |
| Summary | Qwen3 8B | 0.5 | 512 |
