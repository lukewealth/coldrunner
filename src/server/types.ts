export type LeadGrade = 'HOT' | 'WARM' | 'COLD';
export type LeadStatus = 'New' | 'Qualified' | 'Contacted' | 'Meeting Set' | 'Converted' | 'Archived';
export type WebsiteStatus = 'Missing' | 'Outdated' | 'Poor SEO' | 'Slow Speed' | 'Broken SSL' | 'Good';
export type VerificationStatus = 'Verified' | 'Pending' | 'Enriched';

export interface WebsiteAudit {
  performance: number;
  seo: number;
  accessibility: number;
  bestPractices: number;
  mobileScore: number;
  hasSSL: boolean;
  loadTimeMs: number;
  techStack: string[];
  issues: string[];
  opportunities: string[];
}

export interface BusinessLead {
  id: string;
  name: string;
  category: string;
  country: string;
  province: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  email: string;
  ownerName?: string;
  website: string;
  websiteStatus: WebsiteStatus;
  rating: number;
  reviewCount: number;
  opportunityScore: number;
  grade: LeadGrade;
  status: LeadStatus;
  estimatedRevenue: string;
  companyBio?: string;
  hrContact?: {
    name?: string;
    email?: string;
    title?: string;
    phone?: string;
  };
  socials: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    x?: string;
    whatsapp?: string;
    tiktok?: string;
    youtube?: string;
    threads?: string;
  };
  audit: WebsiteAudit;
  recommendedService: string;
  aiInsights: string;
  dataConfidence: number;
  verificationStatus: VerificationStatus;
  lastUpdated: string;
  createdAt: string;
  placeId?: string;
  googleMapsUrl?: string;
  openingHours?: string[];
  photos?: string[];
}

export interface SearchCriteria {
  country: string;
  province?: string;
  city: string;
  radiusKm: number;
  category: string;
  categories?: string[];
  minRating: number;
  minReviews: number;
  targetCount: number;
  websiteStatusFilter?: string;
  revenueEstimateFilter?: string;
  socialActivityFilter?: string;
  minOpportunityScore: number;
  targetJobTitle?: string;
  searchPurpose?: string;
  techStackFilter?: string;
  aiPromptQuery?: string;
}

export interface AgentTask {
  id: string;
  type: AgentType;
  criteria: SearchCriteria;
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  progress: number;
}

export type AgentType = 
  | 'master-planner'
  | 'google-places'
  | 'website-analyzer'
  | 'social-analyzer'
  | 'contact-discovery'
  | 'revenue-estimator'
  | 'seo-analyzer'
  | 'opportunity-scorer'
  | 'duplicate-detector'
  | 'report-generator'
  | 'export-agent'
  | 'local-research';

export interface AgentStatus {
  id: string;
  name: string;
  type: AgentType;
  status: 'idle' | 'running' | 'processing' | 'waiting' | 'completed' | 'error';
  itemsProcessed: number;
  currentTask: string;
  lastActive: Date;
}

export interface PluginResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  confidence: number;
  source: string;
  timestamp: Date;
}

export interface Plugin {
  name: string;
  version: string;
  description: string;
  initialize(): Promise<void>;
  execute(params: any): Promise<PluginResult>;
  healthCheck(): Promise<boolean>;
}

export interface WorkflowState {
  id: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  currentStep: number;
  totalSteps: number;
  tasks: AgentTask[];
  results: BusinessLead[];
  startedAt: Date;
  completedAt?: Date;
  progress: number;
  logs: WorkflowLog[];
}

export interface WorkflowLog {
  id: string;
  timestamp: Date;
  agent: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'excel' | 'markdown' | 'pdf';
  leads: BusinessLead[];
  includeAudit?: boolean;
  includeSocials?: boolean;
  includeHR?: boolean;
  filename?: string;
}

export interface CrmSyncResult {
  crmId: string;
  crmName: string;
  timestamp: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  syncedCount: number;
  dealsCreated: number;
  contactsCreated: number;
  totalEstimatedPipelineValue: string;
  logs: string[];
}

export type OutreachEventType =
  | 'search.started'
  | 'search.completed'
  | 'business.discovered'
  | 'business.qualified'
  | 'contact.enriched'
  | 'website.analyzed'
  | 'opportunity.scored'
  | 'lead.ready'
  | 'campaign.created'
  | 'email.generated'
  | 'email.approved'
  | 'email.sent'
  | 'reply.received'
  | 'meeting.booked'
  | 'proposal.generated';

export interface OutreachEvent {
  id: string;
  type: OutreachEventType;
  timestamp: Date;
  leadId?: string;
  campaignId?: string;
  data: Record<string, any>;
}

export interface WebhookSubscription {
  id: string;
  url: string;
  secret: string;
  events: OutreachEventType[];
  platform: 'n8n' | 'zapier' | 'make' | 'custom';
  active: boolean;
  createdAt: Date;
  lastTriggeredAt?: Date;
  deliveryCount: number;
  failureCount: number;
}

export type OutreachChannel = 'email' | 'contact_form' | 'linkedin' | 'phone' | 'whatsapp';

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';

export type MessageStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'sent' | 'failed';

export interface OutreachMessage {
  id: string;
  leadId: string;
  campaignId: string;
  channel: OutreachChannel;
  subject?: string;
  body: string;
  status: MessageStatus;
  strength: string;
  opportunity: string;
  benefit: string;
  cta: string;
  wordCount: number;
  approvedBy?: string;
  approvedAt?: Date;
  sentAt?: Date;
  createdAt: Date;
  sequenceStep: number;
}

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  criteria: SearchCriteria;
  leadIds: string[];
  messages: OutreachMessage[];
  channels: OutreachChannel[];
  sequenceSteps: number;
  createdAt: Date;
  updatedAt: Date;
  stats: CampaignStats;
}

export interface CampaignStats {
  totalLeads: number;
  messagesPrepared: number;
  messagesApproved: number;
  messagesSent: number;
  openRate: number;
  replyRate: number;
  positiveReplies: number;
  meetingsBooked: number;
  proposalsSent: number;
}

export interface OutreachAnalytics {
  qualifiedLeads: number;
  messagesPrepared: number;
  messagesApproved: number;
  messagesSent: number;
  openRate: number;
  replyRate: number;
  positiveReplies: number;
  meetingsBooked: number;
  proposalsSent: number;
  dealsWon: number;
  avgTimeToFirstResponse: number;
  eventsByType: Record<OutreachEventType, number>;
  webhookDeliveries: number;
  webhookFailures: number;
}
