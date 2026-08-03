import { BusinessLead, OutreachMessage, OutreachChannel } from '../types';
import { eventBus } from './event-bus';

interface PersonalizationContext {
  strength: string;
  opportunity: string;
  benefit: string;
  cta: string;
}

export class OutreachService {
  async generatePersonalizedMessage(
    lead: BusinessLead,
    channel: OutreachChannel,
    agencyType: string = 'Website & AI Automation Agency'
  ): Promise<OutreachMessage> {
    const context = this.buildPersonalizationContext(lead);

    const subject = this.generateSubject(lead, context);
    const body = this.generateBody(lead, context, channel, agencyType);

    const message: OutreachMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      leadId: lead.id,
      campaignId: '',
      channel,
      subject: channel === 'email' ? subject : undefined,
      body,
      status: 'pending_approval',
      strength: context.strength,
      opportunity: context.opportunity,
      benefit: context.benefit,
      cta: context.cta,
      wordCount: body.split(/\s+/).length,
      createdAt: new Date(),
      sequenceStep: 1,
    };

    await eventBus.emit('email.generated', {
      messageId: message.id,
      channel,
      wordCount: message.wordCount,
    }, lead.id);

    return message;
  }

  async generateCampaignSequence(
    lead: BusinessLead,
    channel: OutreachChannel,
    steps: number = 3
  ): Promise<OutreachMessage[]> {
    const messages: OutreachMessage[] = [];
    const context = this.buildPersonalizationContext(lead);

    for (let step = 1; step <= steps; step++) {
      const body = this.generateSequenceStep(lead, context, channel, step);
      const subject = step === 1
        ? this.generateSubject(lead, context)
        : this.generateFollowUpSubject(lead, step);

      messages.push({
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        leadId: lead.id,
        campaignId: '',
        channel,
        subject: channel === 'email' ? subject : undefined,
        body,
        status: 'pending_approval',
        strength: context.strength,
        opportunity: context.opportunity,
        benefit: context.benefit,
        cta: context.cta,
        wordCount: body.split(/\s+/).length,
        createdAt: new Date(),
        sequenceStep: step,
      });
    }

    return messages;
  }

  private buildPersonalizationContext(lead: BusinessLead): PersonalizationContext {
    const strength = this.identifyStrength(lead);
    const opportunity = this.identifyOpportunity(lead);
    const benefit = this.identifyBenefit(lead);
    const cta = 'Would you be open to a short conversation to explore whether these improvements would make sense for your business?';

    return { strength, opportunity, benefit, cta };
  }

  private identifyStrength(lead: BusinessLead): string {
    if (lead.rating >= 4.5 && lead.reviewCount >= 100) {
      return `strong reputation with ${lead.reviewCount}+ reviews at ${lead.rating} stars`;
    }
    if (lead.rating >= 4.0 && lead.reviewCount >= 50) {
      return `solid track record with ${lead.reviewCount} positive reviews`;
    }
    if (lead.reviewCount >= 20) {
      return `growing presence with ${lead.reviewCount} customer reviews`;
    }
    return `established presence in ${lead.city}`;
  }

  private identifyOpportunity(lead: BusinessLead): string {
    switch (lead.websiteStatus) {
      case 'Missing':
        return 'customers may have difficulty finding your business online or contacting you outside business hours';
      case 'Outdated':
        return 'your current website may not reflect the quality of service your customers expect';
      case 'Poor SEO':
        return 'potential customers searching for your services may not be finding you on Google';
      case 'Slow Speed':
        return 'mobile visitors may be leaving before your page fully loads';
      case 'Broken SSL':
        return 'your website security may be causing browser warnings that drive visitors away';
      default:
        return 'there may be opportunities to improve your online presence and customer experience';
    }
  }

  private identifyBenefit(lead: BusinessLead): string {
    const category = lead.category.toLowerCase();

    if (category.includes('restaurant') || category.includes('food') || category.includes('cafe')) {
      return 'faster reservations, better mobile menu access, and more online orders';
    }
    if (category.includes('clinic') || category.includes('dental') || category.includes('health') || category.includes('medical')) {
      return 'easier appointment booking, reduced administrative workload, and better patient communication';
    }
    if (category.includes('contractor') || category.includes('plumb') || category.includes('electr') || category.includes('hvac') || category.includes('roof')) {
      return 'more quote requests, better local visibility, and a simpler contact process';
    }
    if (category.includes('salon') || category.includes('spa') || category.includes('barber') || category.includes('beauty')) {
      return '24/7 online booking, fewer no-shows, and a better client experience';
    }
    if (category.includes('law') || category.includes('legal') || category.includes('account')) {
      return 'automated consultation scheduling and a more professional online presence';
    }
    if (category.includes('real estate') || category.includes('realt')) {
      return 'better property showcases, virtual tours, and lead capture';
    }
    return 'more inquiries, better customer experience, and increased visibility';
  }

  private generateSubject(lead: BusinessLead, context: PersonalizationContext): string {
    const templates = [
      `Quick idea regarding ${lead.name}'s online presence`,
      `A thought about ${lead.name}'s mobile experience`,
      `${lead.name} — one opportunity I noticed`,
      `Loved what I saw at ${lead.name} — quick suggestion`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private generateFollowUpSubject(lead: BusinessLead, step: number): string {
    if (step === 2) {
      return `Following up — one more thought about ${lead.name}`;
    }
    return `Last note from me regarding ${lead.name}`;
  }

  private generateBody(lead: BusinessLead, context: PersonalizationContext, channel: OutreachChannel, agencyType: string): string {
    const ownerName = lead.ownerName || 'there';
    const recipientName = lead.hrContact?.name || ownerName;

    if (channel === 'linkedin') {
      return this.generateLinkedInMessage(lead, context, recipientName);
    }
    if (channel === 'whatsapp') {
      return this.generateWhatsAppMessage(lead, context, recipientName);
    }

    return this.generateEmailBody(lead, context, recipientName, agencyType);
  }

  private generateEmailBody(lead: BusinessLead, context: PersonalizationContext, recipientName: string, agencyType: string): string {
    return `Hi ${recipientName},

I came across ${lead.name} while researching top-rated ${lead.category.toLowerCase()} businesses in ${lead.city}, and I was impressed by your ${context.strength}.

I did notice one area where ${lead.name} might be missing out: ${context.opportunity}.

We help ${lead.category.toLowerCase()} businesses like yours improve their digital presence, and the typical result is ${context.benefit}.

${context.cta}

Best regards,
Luke
ColdRunners`;
  }

  private generateLinkedInMessage(lead: BusinessLead, context: PersonalizationContext, recipientName: string): string {
    return `Hi ${recipientName}, loved seeing ${lead.name}'s great work in ${lead.city}! Noticed a quick opportunity around ${context.opportunity.split(',')[0]}. Would love to share a free 2-min breakdown — no pressure at all.`;
  }

  private generateWhatsAppMessage(lead: BusinessLead, context: PersonalizationContext, recipientName: string): string {
    return `Hello ${recipientName}! Luke here from ColdRunners. I was looking at ${lead.name}'s online presence and noticed ${context.opportunity.split(',')[0]}. We help ${lead.category.toLowerCase()} businesses with exactly this. Mind if I send a quick 2-min video?`;
  }

  private generateSequenceStep(lead: BusinessLead, context: PersonalizationContext, channel: OutreachChannel, step: number): string {
    const ownerName = lead.ownerName || 'there';
    const recipientName = lead.hrContact?.name || ownerName;

    if (step === 1) {
      return this.generateBody(lead, context, channel, '');
    }

    if (step === 2) {
      const additionalBenefits = lead.audit.opportunities.slice(0, 2).join(' and ');
      return `Hi ${recipientName},

I wanted to follow up on my earlier note about ${lead.name}. Since then, I've been thinking about how ${additionalBenefits || 'a modernized online presence'} could specifically help your team.

We recently helped a similar ${lead.category.toLowerCase()} in ${lead.city} achieve measurable results within the first month.

Happy to share a quick case study if useful — just let me know.

Best,
Luke`;
    }

    return `Hi ${recipientName},

I know you're busy, so I'll keep this brief. I reached out a couple weeks ago about ${lead.name}'s online presence.

If now isn't the right time, no worries at all — just let me know and I won't follow up again.

If it is, I'd love to share a 5-minute walkthrough of what we've found. Either way, I wish you and the team continued success.

Best regards,
Luke`;
  }

  approveMessage(messageId: string, approvedBy: string = 'user'): OutreachMessage | null {
    return null;
  }

  rejectMessage(messageId: string): OutreachMessage | null {
    return null;
  }
}

export const outreachService = new OutreachService();
