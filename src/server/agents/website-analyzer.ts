import { Agent, AgentContext, AgentResult } from './types';
import { BusinessLead, WebsiteStatus } from '../types';
import { pluginRegistry } from '../plugins';
import { FirecrawlPlugin } from '../plugins/firecrawl';

export class WebsiteAnalyzerAgent implements Agent {
  type = 'website-analyzer' as const;
  name = 'Website Intelligence Agent';
  description = 'Analyzes websites for performance, SEO, tech stack, SSL, mobile-friendliness, and identifies improvement opportunities';

  async execute(context: AgentContext): Promise<AgentResult> {
    const { leads, onLog } = context;
    const firecrawl = pluginRegistry.get<FirecrawlPlugin>('firecrawl');

    if (!firecrawl) {
      return { success: false, error: 'Firecrawl plugin not available', itemsProcessed: 0 };
    }

    onLog({ agent: this.name, level: 'info', message: `Starting website analysis for ${leads.length} businesses...` });

    let processed = 0;
    const leadsWithWebsites = leads.filter((l) => l.website);
    const leadsWithout = leads.filter((l) => !l.website);

    for (const lead of leadsWithout) {
      lead.websiteStatus = 'Missing';
      lead.audit = {
        performance: 0,
        seo: 0,
        accessibility: 0,
        bestPractices: 0,
        mobileScore: 0,
        hasSSL: false,
        loadTimeMs: 0,
        techStack: ['No Active CMS', 'Domain Parked'],
        issues: [
          'No active website detected',
          'Relying purely on Google Business Profile for leads',
          'Missing online presence for customer discovery',
        ],
        opportunities: [
          'Complete high-converting website build',
          'Google Business Profile optimization',
          'Online booking/quote system',
        ],
      };
      processed++;
    }

    const batchSize = 10;
    for (let i = 0; i < leadsWithWebsites.length; i += batchSize) {
      const batch = leadsWithWebsites.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (lead) => {
          try {
            const result = await firecrawl.execute({ url: lead.website });
            
            if (result.success && result.data) {
              const analysis = result.data;
              lead.audit = {
                performance: analysis.performance,
                seo: analysis.seo,
                accessibility: analysis.accessibility,
                bestPractices: analysis.bestPractices,
                mobileScore: analysis.mobileScore,
                hasSSL: analysis.hasSSL,
                loadTimeMs: analysis.loadTimeMs,
                techStack: analysis.techStack,
                issues: analysis.issues,
                opportunities: analysis.opportunities,
              };
              lead.websiteStatus = this.classifyWebsiteStatus(analysis);
              onLog({
                agent: this.name,
                level: analysis.performance < 50 ? 'warning' : 'success',
                message: `Analyzed ${lead.website}: Performance ${analysis.performance}/100, SEO ${analysis.seo}/100`,
              });
            }
          } catch (err: any) {
            onLog({
              agent: this.name,
              level: 'error',
              message: `Failed to analyze ${lead.website}: ${err.message}`,
            });
          }
          processed++;
        })
      );
    }

    onLog({ agent: this.name, level: 'success', message: `Website analysis complete: ${processed} businesses analyzed` });

    return {
      success: true,
      leads,
      itemsProcessed: processed,
    };
  }

  private classifyWebsiteStatus(analysis: any): WebsiteStatus {
    if (!analysis.hasSSL) return 'Broken SSL';
    if (analysis.performance < 40) return 'Slow Speed';
    if (analysis.seo < 40) return 'Poor SEO';
    if (analysis.performance < 60 || analysis.seo < 60) return 'Outdated';
    return 'Good';
  }
}
