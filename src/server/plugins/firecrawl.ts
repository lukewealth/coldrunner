import { BasePlugin } from './base';
import { PluginResult } from '../types';
import { config } from '../config';

interface WebsiteAnalysisResult {
  url: string;
  exists: boolean;
  metricsAvailable?: boolean;
  statusCode?: number;
  performance: number;
  seo: number;
  accessibility: number;
  bestPractices: number;
  mobileScore: number;
  hasSSL: boolean;
  loadTimeMs: number;
  techStack: string[];
  cms?: string;
  framework?: string;
  hosting?: string;
  issues: string[];
  opportunities: string[];
  lighthouse?: {
    performance: number;
    accessibility: number;
    'best-practices': number;
    seo: number;
    pwa: number;
  };
}

export class FirecrawlPlugin extends BasePlugin {
  name = 'firecrawl';
  version = '2.0.0';
  description = 'Firecrawl web scraping and analysis for website content extraction, tech detection, and Lighthouse auditing';

  private apiKey: string = '';
  private baseUrl = 'https://api.firecrawl.dev/v1';

  async initialize(): Promise<void> {
    this.apiKey = config.apiKeys.firecrawl;
    this.initialized = true;
  }

  async execute(params: { url: string }): Promise<PluginResult<WebsiteAnalysisResult>> {
    const { url } = params;
    const normalizedUrl = this.normalizeUrl(url);

    if (!this.apiKey) { return { success: false, error: 'FIRECRAWL_API_KEY is not configured; simulated website audits are disabled.', confidence: 0, source: 'Firecrawl not configured', timestamp: new Date() }; }

    try {
      const scrapePromise = this.scrapeWebsite(normalizedUrl);
      const lighthousePromise = this.runLighthouse(normalizedUrl);
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Firecrawl analysis timeout (20s)')), 20000);
      });

      const [scrapeResult, lighthouseResult] = await Promise.race([
        Promise.all([scrapePromise, lighthousePromise]),
        timeoutPromise,
      ]);

      const analysis = this.compileAnalysis(normalizedUrl, scrapeResult, lighthouseResult);

      return {
        success: true,
        data: analysis,
        confidence: 90,
        source: 'Firecrawl + Lighthouse',
        timestamp: new Date(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        confidence: 0,
        source: 'Firecrawl',
        timestamp: new Date(),
      };
    }
  }

  private async scrapeWebsite(url: string): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          url,
          formats: ['html', 'markdown', 'links'],
          waitFor: 3000,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Firecrawl scrape failed: ${response.status} - ${errorText}`);
      }

      return response.json();
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Firecrawl scrape timeout (15s)');
      }
      throw err;
    }
  }

  private async runLighthouse(url: string): Promise<any> {
    const pagespeedKey = config.apiKeys.pagespeed;
    if (!pagespeedKey) return null;

    try {
      const psiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
      psiUrl.searchParams.set('url', url);
      psiUrl.searchParams.set('key', pagespeedKey);
      psiUrl.searchParams.set('category', 'performance');
      psiUrl.searchParams.set('category', 'accessibility');
      psiUrl.searchParams.set('category', 'best-practices');
      psiUrl.searchParams.set('category', 'seo');
      psiUrl.searchParams.set('strategy', 'mobile');

      const response = await this.fetchWithRetry(psiUrl.toString());
      const data = await response.json();
      return data.lighthouseResult?.categories || null;
    } catch {
      return null;
    }
  }

  private compileAnalysis(url: string, scrapeData: any, lighthouseData: any): WebsiteAnalysisResult {
    const techStack = this.detectTechStack(scrapeData);
    const hasSSL = url.startsWith('https');
    const metricsAvailable = ['performance', 'seo', 'accessibility', 'best-practices'].every((key) => typeof lighthouseData?.[key]?.score === 'number');

    const perf = typeof lighthouseData?.performance?.score === 'number' ? Math.round(lighthouseData.performance.score * 100) : 0;

    const seo = typeof lighthouseData?.seo?.score === 'number' ? Math.round(lighthouseData.seo.score * 100) : 0;

    const a11y = typeof lighthouseData?.accessibility?.score === 'number' ? Math.round(lighthouseData.accessibility.score * 100) : 0;

    const bp = typeof lighthouseData?.['best-practices']?.score === 'number' ? Math.round(lighthouseData['best-practices'].score * 100) : 0;

    const issues: string[] = [];
    const opportunities: string[] = [];
    if (!metricsAvailable) issues.push('PageSpeed metrics unavailable or incomplete; scores are not fully measured.');
    issues.push('Load time was not measured by this audit and is intentionally left unavailable.');

    if (perf < 50) issues.push(`Critical performance bottleneck: PageSpeed score ${perf}/100`);
    if (seo < 50) issues.push('Poor SEO health: Missing structured data, meta tags, or sitemap');
    if (a11y < 50) issues.push('Low accessibility score: Missing ARIA labels, poor contrast, or keyboard navigation issues');
    if (!hasSSL) issues.push('CRITICAL: No SSL certificate - browsers show "Not Secure" warning');
    if (techStack.some((t) => t.includes('WordPress 4') || t.includes('WordPress 5.0'))) {
      issues.push('Outdated WordPress CMS version with potential security vulnerabilities');
    }

    if (perf < 60) opportunities.push('Migrate to modern framework (Next.js/React) for 3-5x speed improvement');
    if (seo < 60) opportunities.push('Implement Local Business schema markup and optimize for Google Maps ranking');
    if (!issues.some((i) => i.includes('booking'))) {
      opportunities.push('Add AI-powered online booking/chatbot for 24/7 lead capture');
    }

    return {
      url,
      exists: !!scrapeData,
      metricsAvailable,
      statusCode: 200,
      performance: perf,
      seo,
      accessibility: a11y,
      bestPractices: bp,
      mobileScore: Math.round((perf + a11y) / 2),
      hasSSL,
      loadTimeMs: 0,
      techStack,
      cms: techStack.find((t) => ['WordPress', 'Wix', 'Squarespace', 'Shopify'].some((c) => t.includes(c))),
      framework: techStack.find((t) => ['React', 'Next.js', 'Vue', 'Angular', 'Laravel'].some((f) => t.includes(f))),
      issues,
      opportunities,
      lighthouse: lighthouseData,
    };
  }

  private detectTechStack(scrapeData: any): string[] {
    const stack: string[] = [];
    const html = scrapeData?.html || '';

    if (html.includes('wp-content') || html.includes('wordpress')) stack.push('WordPress');
    if (html.includes('wix.com') || html.includes('wixstatic')) stack.push('Wix');
    if (html.includes('squarespace')) stack.push('Squarespace');
    if (html.includes('shopify')) stack.push('Shopify');
    if (html.includes('__next') || html.includes('_next/')) stack.push('Next.js');
    if (html.includes('react') || html.includes('__REACT')) stack.push('React');
    if (html.includes('vue') || html.includes('__vue')) stack.push('Vue.js');
    if (html.includes('angular')) stack.push('Angular');
    if (html.includes('jquery')) stack.push('jQuery');
    if (html.includes('bootstrap')) stack.push('Bootstrap');
    if (html.includes('tailwind')) stack.push('Tailwind CSS');
    if (html.includes('elementor')) stack.push('Elementor');
    if (html.includes('php')) stack.push('PHP');
    if (html.includes('laravel')) stack.push('Laravel');
    if (html.includes('google-analytics') || html.includes('gtag')) stack.push('Google Analytics');
    if (html.includes('gtm') || html.includes('googletagmanager')) stack.push('Google Tag Manager');

    if (stack.length === 0) stack.push('Unknown / Custom Build');
    return stack;
  }

  private normalizeUrl(url: string): string {
    const input = url.trim();
    if (!input || input.length > 2048) throw new Error('A valid website URL under 2048 characters is required');
    const hasScheme = input.startsWith('http://') || input.startsWith('https://');
    const parsed = new URL(hasScheme ? input : `https://${input}`);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error('Only public HTTP(S) website URLs are supported');
    const host = parsed.hostname.toLowerCase().replace('[', '').replace(']', '');
    const octets = host.split('.').map((part) => Number(part));
    const privateIpv4 = octets.length === 4 && octets.every((part) => Number.isInteger(part) && part >= 0 && part <= 255) && (
      octets[0] === 0 || octets[0] === 10 || octets[0] === 127 ||
      (octets[0] === 169 && octets[1] === 254) ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168)
    );
    const blocked = host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') ||
      host === '::1' || host === '0.0.0.0' || host === '169.254.169.254' ||
      privateIpv4 || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:');
    if (blocked) throw new Error('Local, private, and link-local destinations are not allowed');
    return parsed.toString();
  }

  private simulateAnalysis(url: string): PluginResult<WebsiteAnalysisResult> {
    const hasSSL = url.startsWith('https');
    const perf = Math.floor(25 + Math.random() * 55);
    const seo = Math.floor(30 + Math.random() * 50);
    const a11y = Math.floor(35 + Math.random() * 45);
    const bp = Math.floor(40 + Math.random() * 40);
    const techStacks = [
      ['WordPress 5.2', 'jQuery 1.12', 'Apache', 'PHP 7.4'],
      ['Wix', 'Google Analytics', 'Cloudflare'],
      ['Squarespace 7.1', 'Mindbody Embed'],
      ['Custom HTML', 'Bootstrap 3.3', 'Nginx'],
      ['WordPress 4.9', 'Elementor', 'PDF Menu Plugin'],
    ];

    return {
      success: true,
      data: {
        url,
        exists: true,
        statusCode: 200,
        performance: perf,
        seo,
        accessibility: a11y,
        bestPractices: bp,
        mobileScore: Math.round((perf + a11y) / 2),
        hasSSL,
        loadTimeMs: Math.floor(2500 + (100 - perf) * 45),
        techStack: techStacks[Math.floor(Math.random() * techStacks.length)],
        issues: [
          `Slow mobile page load: ${(2.5 + Math.random() * 3).toFixed(1)}s LCP`,
          'Missing Local Business JSON-LD structured data schema',
          'Non-responsive elements causing horizontal scroll on mobile',
          ...(hasSSL ? [] : ['Expired or missing SSL certificate']),
        ],
        opportunities: [
          'Modern Next.js/React redesign for 3x speed boost',
          'AI booking chatbot integration for 24/7 lead capture',
          'Local SEO schema injection for Google Map Pack ranking',
        ],
      },
      confidence: 70,
      source: 'Simulated Analysis',
      timestamp: new Date(),
    };
  }
}
