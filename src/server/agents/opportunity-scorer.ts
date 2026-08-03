import { Agent, AgentContext, AgentResult } from './types';
import { BusinessLead, LeadGrade } from '../types';

export class OpportunityScorerAgent implements Agent {
  type = 'opportunity-scorer' as const;
  name = 'AI Opportunity Scoring Agent';
  description = 'Calculates opportunity scores (0-100) based on website flaws, reviews, revenue potential, and social activity';

  async execute(context: AgentContext): Promise<AgentResult> {
    const { leads, onLog } = context;

    onLog({ agent: this.name, level: 'info', message: `Scoring ${leads.length} leads for opportunity potential...` });

    for (const lead of leads) {
      lead.opportunityScore = this.calculateScore(lead);
      lead.grade = this.classifyGrade(lead.opportunityScore);
      lead.recommendedService = this.generateRecommendation(lead);
      lead.aiInsights = this.generateInsights(lead);
    }

    const hotCount = leads.filter((l) => l.grade === 'HOT').length;
    const warmCount = leads.filter((l) => l.grade === 'WARM').length;

    onLog({
      agent: this.name,
      level: 'success',
      message: `Scoring complete: ${hotCount} HOT, ${warmCount} WARM leads identified`,
    });

    leads.sort((a, b) => b.opportunityScore - a.opportunityScore);

    return { success: true, leads, itemsProcessed: leads.length };
  }

  private calculateScore(lead: BusinessLead): number {
    let score = 0;

    if (lead.websiteStatus === 'Missing') score += 40;
    else if (lead.websiteStatus === 'Broken SSL') score += 35;
    else if (lead.websiteStatus === 'Outdated') score += 25;
    else if (lead.websiteStatus === 'Slow Speed') score += 20;
    else if (lead.websiteStatus === 'Poor SEO') score += 15;

    if (!lead.audit.hasSSL) score += 10;
    if (lead.audit.mobileScore < 50) score += 10;
    if (lead.audit.performance < 50) score += 10;
    if (lead.audit.seo < 50) score += 10;

    if (lead.rating >= 4.5) score += 10;
    else if (lead.rating >= 4.0) score += 5;

    if (lead.reviewCount >= 150) score += 10;
    else if (lead.reviewCount >= 50) score += 5;

    const socialCount = Object.values(lead.socials).filter(Boolean).length;
    if (socialCount >= 3) score += 10;
    else if (socialCount >= 1) score += 5;

    if (lead.estimatedRevenue.includes('$1M') || lead.estimatedRevenue.includes('$2M') || lead.estimatedRevenue.includes('$3M')) {
      score += 5;
    }

    return Math.min(score, 100);
  }

  private classifyGrade(score: number): LeadGrade {
    if (score >= 85) return 'HOT';
    if (score >= 60) return 'WARM';
    return 'COLD';
  }

  private generateRecommendation(lead: BusinessLead): string {
    const category = lead.category.toLowerCase();

    if (lead.websiteStatus === 'Missing') {
      if (category.includes('restaurant')) return 'Complete Website Build + Online Ordering System';
      if (category.includes('dental') || category.includes('clinic') || category.includes('medical')) return 'Website Build + Patient Booking Portal';
      if (category.includes('hvac') || category.includes('plumbing') || category.includes('electrical')) return 'Website Build + Emergency Dispatch + Quote Estimator';
      if (category.includes('law')) return 'Website Build + Client Intake Form + Consultation Booking';
      if (category.includes('gym') || category.includes('fitness')) return 'Website Build + Class Scheduling + Membership Portal';
      return 'Complete Website Build + AI Lead Capture System';
    }

    if (lead.websiteStatus === 'Broken SSL') return 'SSL Repair + Security Hardening + Modern Redesign';
    if (lead.websiteStatus === 'Slow Speed') return 'Performance Optimization + Modern Framework Migration (Next.js)';
    if (lead.websiteStatus === 'Poor SEO') return 'Local SEO Overhaul + Google Maps Optimization + Schema Markup';
    if (lead.websiteStatus === 'Outdated') return 'Website Redesign + AI Chatbot + Automated Booking System';

    if (category.includes('restaurant')) return 'Interactive Digital Menu + Commission-Free Reservation System';
    if (category.includes('dental') || category.includes('clinic')) return 'AI Patient Intake + Automated Appointment Reminders';
    if (category.includes('law')) return 'AI Legal Intake Assistant + Bilingual Support';
    if (category.includes('gym')) return 'Custom Class Scheduling + Lead Magnet Funnel';

    return 'Website Redesign + AI Lead Automation Widget';
  }

  private generateInsights(lead: BusinessLead): string {
    const flaws: string[] = [];
    if (lead.websiteStatus === 'Missing') flaws.push('no website');
    if (lead.websiteStatus === 'Broken SSL') flaws.push('broken SSL certificate');
    if (lead.websiteStatus === 'Slow Speed') flaws.push(`slow ${lead.audit.loadTimeMs > 0 ? (lead.audit.loadTimeMs / 1000).toFixed(1) + 's' : '4+ s'} page load`);
    if (lead.websiteStatus === 'Poor SEO') flaws.push('poor search visibility');
    if (lead.websiteStatus === 'Outdated') flaws.push('outdated website design');

    const flawText = flaws.length > 0 ? flaws.join(', ') : 'digital presence gaps';

    return `${lead.name} is a ${lead.rating}-star rated ${lead.category} in ${lead.city} with ${lead.reviewCount} reviews (est. revenue ${lead.estimatedRevenue}). Currently losing mobile leads due to ${flawText}. High-value prospect for ${lead.recommendedService.toLowerCase()}.`;
  }
}
