# Next.js Integration Guide

## Overview

Next.js is a React framework for production. ColdRunners will migrate from React SPA to Next.js in Phase 2+ for better SEO, server-side rendering, and API routes.

**Official Documentation:** https://nextjs.org/docs  
**GitHub:** https://github.com/vercel/next.js  
**Website:** https://nextjs.org

## Features

- Server-side rendering (SSR)
- Static site generation (SSG)
- API routes
- File-based routing
- Image optimization
- Built-in CSS support
- TypeScript support
- Middleware
- Edge functions

## Migration from React SPA

### Current React Structure

```
src/
├── App.tsx
├── components/
│   ├── DashboardView.tsx
│   ├── SearchWizardView.tsx
│   └── ...
└── main.tsx
```

### Next.js App Router Structure

```
app/
├── layout.tsx              # Root layout
├── page.tsx                # Home page
├── globals.css             # Global styles
│
├── dashboard/
│   └── page.tsx            # Dashboard page
│
├── search/
│   └── page.tsx            # Search wizard
│
├── explorer/
│   └── page.tsx            # Business explorer
│
├── analyzer/
│   └── page.tsx            # Website analyzer
│
├── campaigns/
│   └── page.tsx            # Campaign builder
│
├── reports/
│   └── page.tsx            # Reports
│
├── exports/
│   └── page.tsx            # Export center
│
└── api/
    ├── leads/
    │   └── route.ts        # GET /api/leads
    ├── agents/
    │   └── run-search/
    │       └── route.ts    # POST /api/agents/run-search
    └── export/
        └── route.ts        # POST /api/export
```

## Setup

### Installation

```bash
npx create-next-app@latest coldrunners-web \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

### Configuration

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['maps.googleapis.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*', // Backend API
      },
    ];
  },
};

module.exports = nextConfig;
```

## Pages

### Root Layout

```typescript
// app/layout.tsx
import { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ColdRunners - Business Intelligence Platform',
  description: 'Autonomous AI-powered business lead discovery',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### Dashboard Page

```typescript
// app/dashboard/page.tsx
import { DashboardView } from '@/components/DashboardView';

export default function DashboardPage() {
  return <DashboardView />;
}
```

### Search Page (Client Component)

```typescript
// app/search/page.tsx
'use client';

import { SearchWizardView } from '@/components/SearchWizardView';

export default function SearchPage() {
  return <SearchWizardView />;
}
```

## API Routes

### Leads API

```typescript
// app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const grade = searchParams.get('grade');
  const city = searchParams.get('city');

  const leads = await prisma.businessLead.findMany({
    where: {
      grade: grade || undefined,
      city: city || undefined,
    },
    orderBy: {
      opportunityScore: 'desc',
    },
  });

  return NextResponse.json({ leads });
}
```

### Agent Search API

```typescript
// app/api/agents/run-search/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const response = await fetch('http://localhost:3001/api/agents/run-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to execute search' },
      { status: 500 }
    );
  }
}
```

## Server Components

### Data Fetching

```typescript
// app/explorer/page.tsx
import { prisma } from '@/lib/prisma';
import { BusinessExplorerView } from '@/components/BusinessExplorerView';

export default async function ExplorerPage() {
  const leads = await prisma.businessLead.findMany({
    orderBy: { opportunityScore: 'desc' },
    take: 100,
  });

  return <BusinessExplorerView initialLeads={leads} />;
}
```

## Client Components

### Interactive Components

```typescript
// components/SearchWizardView.tsx
'use client';

import { useState } from 'react';

export function SearchWizardView() {
  const [step, setStep] = useState(1);
  const [criteria, setCriteria] = useState({});

  const handleSubmit = async () => {
    const response = await fetch('/api/agents/run-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(criteria),
    });

    const data = await response.json();
    // Handle results
  };

  return (
    <div>
      {/* Wizard UI */}
    </div>
  );
}
```

## Data Fetching Patterns

### Server-Side Fetching

```typescript
// app/leads/[id]/page.tsx
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function LeadPage({ params }: { params: { id: string } }) {
  const lead = await prisma.businessLead.findUnique({
    where: { id: params.id },
    include: { audit: true, socials: true },
  });

  if (!lead) {
    notFound();
  }

  return (
    <div>
      <h1>{lead.name}</h1>
      <p>Score: {lead.opportunityScore}</p>
    </div>
  );
}
```

### Client-Side Fetching with SWR

```typescript
// components/LeadList.tsx
'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function LeadList() {
  const { data, error, isLoading } = useSWR('/api/leads', fetcher);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading leads</div>;

  return (
    <ul>
      {data.leads.map((lead: any) => (
        <li key={lead.id}>{lead.name}</li>
      ))}
    </ul>
  );
}
```

## Middleware

### Authentication

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*'],
};
```

## Image Optimization

```typescript
// components/BusinessCard.tsx
import Image from 'next/image';

export function BusinessCard({ lead }: { lead: any }) {
  return (
    <div>
      <Image
        src={lead.photo || '/placeholder.png'}
        alt={lead.name}
        width={200}
        height={200}
        className="rounded-lg"
      />
      <h3>{lead.name}</h3>
    </div>
  );
}
```

## Loading States

```typescript
// app/dashboard/loading.tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
}
```

## Error Handling

```typescript
// app/dashboard/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## Not Found

```typescript
// app/dashboard/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2>Page not found</h2>
      <Link href="/dashboard" className="text-blue-500 hover:underline">
        Return to dashboard
      </Link>
    </div>
  );
}
```

## Deployment

### Vercel

```bash
npm install -g vercel
vercel
```

### Docker

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

## Resources

- **Official Docs:** https://nextjs.org/docs
- **App Router:** https://nextjs.org/docs/app
- **API Routes:** https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **Deployment:** https://nextjs.org/docs/app/building-your-application/deploying
- **Examples:** https://github.com/vercel/next.js/tree/canary/examples
