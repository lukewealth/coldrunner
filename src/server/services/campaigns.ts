import { Campaign, CampaignStats, OutreachMessage, SearchCriteria, OutreachChannel, BusinessLead } from '../types';
import { eventBus } from './event-bus';
import { outreachService } from './outreach';

export class CampaignService {
  private campaigns: Map<string, Campaign> = new Map();

  async createCampaign(params: {
    name: string;
    criteria: SearchCriteria;
    leads: BusinessLead[];
    channels: OutreachChannel[];
    sequenceSteps: number;
  }): Promise<Campaign> {
    const id = `cmp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const allMessages: OutreachMessage[] = [];

    for (const lead of params.leads) {
      for (const channel of params.channels) {
        const messages = await outreachService.generateCampaignSequence(
          lead,
          channel,
          params.sequenceSteps
        );
        const withCampaign = messages.map(m => ({ ...m, campaignId: id }));
        allMessages.push(...withCampaign);
      }
    }

    const campaign: Campaign = {
      id,
      name: params.name,
      status: 'draft',
      criteria: params.criteria,
      leadIds: params.leads.map(l => l.id),
      messages: allMessages,
      channels: params.channels,
      sequenceSteps: params.sequenceSteps,
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: this.calculateStats(allMessages, params.leads.length),
    };

    this.campaigns.set(id, campaign);

    await eventBus.emit('campaign.created', {
      campaignId: id,
      name: campaign.name,
      leadCount: params.leads.length,
      messageCount: allMessages.length,
      channels: params.channels,
    });

    return campaign;
  }

  async activateCampaign(id: string): Promise<Campaign | null> {
    const campaign = this.campaigns.get(id);
    if (!campaign) return null;

    campaign.status = 'active';
    campaign.updatedAt = new Date();

    const firstStepMessages = campaign.messages.filter(m => m.sequenceStep === 1);
    for (const msg of firstStepMessages) {
      if (msg.status === 'pending_approval') {
        msg.status = 'approved';
        msg.approvedBy = 'system';
        msg.approvedAt = new Date();
      }
    }

    return campaign;
  }

  pauseCampaign(id: string): Campaign | null {
    const campaign = this.campaigns.get(id);
    if (!campaign) return null;

    campaign.status = 'paused';
    campaign.updatedAt = new Date();
    return campaign;
  }

  getCampaign(id: string): Campaign | undefined {
    return this.campaigns.get(id);
  }

  getAllCampaigns(): Campaign[] {
    return Array.from(this.campaigns.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  deleteCampaign(id: string): boolean {
    return this.campaigns.delete(id);
  }

  async approveMessage(campaignId: string, messageId: string, approvedBy: string = 'user'): Promise<OutreachMessage | null> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return null;

    const message = campaign.messages.find(m => m.id === messageId);
    if (!message) return null;

    message.status = 'approved';
    message.approvedBy = approvedBy;
    message.approvedAt = new Date();
    campaign.updatedAt = new Date();
    campaign.stats = this.calculateStats(campaign.messages, campaign.leadIds.length);

    await eventBus.emit('email.approved', {
      messageId: message.id,
      campaignId,
      channel: message.channel,
      leadId: message.leadId,
    }, message.leadId, campaignId);

    return message;
  }

  rejectMessage(campaignId: string, messageId: string): OutreachMessage | null {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return null;

    const message = campaign.messages.find(m => m.id === messageId);
    if (!message) return null;

    message.status = 'rejected';
    campaign.updatedAt = new Date();
    campaign.stats = this.calculateStats(campaign.messages, campaign.leadIds.length);

    return message;
  }

  getPendingApprovalMessages(campaignId?: string): OutreachMessage[] {
    const campaigns = campaignId
      ? [this.campaigns.get(campaignId)].filter(Boolean) as Campaign[]
      : this.getAllCampaigns();

    return campaigns.flatMap(c =>
      c.messages.filter(m => m.status === 'pending_approval')
    );
  }

  recordMeetingBooked(campaignId: string, leadId: string): void {
    const campaign = this.campaigns.get(campaignId);
    if (campaign) {
      campaign.stats.meetingsBooked++;
      campaign.updatedAt = new Date();
    }

    eventBus.emit('meeting.booked', { campaignId, leadId }, leadId, campaignId);
  }

  recordReply(campaignId: string, leadId: string, positive: boolean): void {
    const campaign = this.campaigns.get(campaignId);
    if (campaign) {
      campaign.stats.positiveReplies += positive ? 1 : 0;
      campaign.updatedAt = new Date();
    }

    eventBus.emit('reply.received', { campaignId, leadId, positive }, leadId, campaignId);
  }

  private calculateStats(messages: OutreachMessage[], totalLeads: number): CampaignStats {
    const approved = messages.filter(m => m.status === 'approved' || m.status === 'sent').length;
    const sent = messages.filter(m => m.status === 'sent').length;

    return {
      totalLeads,
      messagesPrepared: messages.length,
      messagesApproved: approved,
      messagesSent: sent,
      openRate: 0,
      replyRate: 0,
      positiveReplies: 0,
      meetingsBooked: 0,
      proposalsSent: 0,
    };
  }
}

export const campaignService = new CampaignService();
