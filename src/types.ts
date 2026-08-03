export type LeadGrade = 'HOT' | 'WARM' | 'COLD';
export type LeadStatus = 'New' | 'Qualified' | 'Contacted' | 'Meeting Set' | 'Converted' | 'Archived';
export type WebsiteStatus = 'Missing' | 'Outdated' | 'Poor SEO' | 'Slow Speed' | 'Broken SSL' | 'Good';

export interface WebsiteAudit {
  performance: number; // 0 - 100
  seo: number; // 0 - 100
  accessibility: number; // 0 - 100
  bestPractices: number; // 0 - 100
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
  opportunityScore: number; // 0 - 100
  grade: LeadGrade;
  status: LeadStatus;
  estimatedRevenue: string; // e.g. "$250k - $500k"
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
  };
  audit: WebsiteAudit;
  recommendedService: string;
  aiInsights: string;
  dataConfidence: number; // e.g. 94%
  verificationStatus: 'Verified' | 'Pending' | 'Enriched';
  lastUpdated: string;
  createdAt: string;
}

export interface AgentStatusItem {
  id: string;
  name: string;
  status: 'Running' | 'Processing' | 'Waiting' | 'Completed' | 'Error';
  color: 'green' | 'amber' | 'gray' | 'blue' | 'red';
  itemsProcessed: number;
  currentTask: string;
}

export interface SearchFilterCriteria {
  country: string;
  province: string;
  city: string;
  radiusKm: number;
  category: string;
  minRating: number;
  minReviews: number;
  targetCount: number;
  websiteStatusFilter: string;
  revenueEstimateFilter: string;
  socialActivityFilter: string;
  minOpportunityScore: number;
  targetJobTitle?: string; // e.g. Owner, CEO, HR Manager
  searchPurpose?: string; // e.g. Website Redesign, SEO Marketing, Email Marketing, Sales Automation
  techStackFilter?: string; // e.g. WordPress, Wix, No SSL, Slow Speed
  aiPromptQuery?: string; // Agentic search prompt input
}

export interface TerminalLog {
  id: string;
  timestamp: string;
  agent: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export interface CampaignSequence {
  leadId: string;
  businessName: string;
  emailSubject: string;
  emailBody: string;
  linkedinPitch: string;
  callScript: string;
  whatsappMessage: string;
}

export type ActiveTab = 
  | 'dashboard'
  | 'search'
  | 'explorer'
  | 'analyzer'
  | 'intelligence'
  | 'campaigns'
  | 'reports'
  | 'exports'
  | 'agents-memory'
  | 'outreach'
  | 'approvals'
  | 'settings'
  | 'jobs'
  | 'job-map';

export type JobType = 'remote' | 'hybrid' | 'onsite';
export type JobExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'principal';
export type JobContractType = 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship';

export interface JobListing {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  companyWebsite?: string;
  location: string;
  city: string;
  country: string;
  lat?: number;
  lng?: number;
  jobType: JobType;
  experienceLevel: JobExperienceLevel;
  contractType: JobContractType;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  description: string;
  requirements: string[];
  technologies: string[];
  benefits: string[];
  postedAt: string;
  applicationUrl?: string;
  source: string;
  isFeatured?: boolean;
  applicantCount?: number;
}

export interface JobSearchCriteria {
  query: string;
  location: string;
  country: string;
  jobType: JobType | 'all';
  experienceLevel: JobExperienceLevel | 'all';
  contractType: JobContractType | 'all';
  salaryMin?: number;
  technologies: string[];
  remoteOnly: boolean;
  maxResults: number;
}

export interface GlobalCity {
  name: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
  techHub: boolean;
  topEmployers: string[];
}

export interface HiringCompany {
  name: string;
  industry: string;
  website: string;
  logo?: string;
  openPositions: number;
  locations: string[];
  remoteFriendly: boolean;
  techStack: string[];
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
  timestamp: string;
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
  createdAt: string;
  lastTriggeredAt?: string;
  deliveryCount: number;
  failureCount: number;
}

export type OutreachChannel = 'email' | 'contact_form' | 'linkedin' | 'phone' | 'whatsapp';
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
  approvedAt?: string;
  sentAt?: string;
  createdAt: string;
  sequenceStep: number;
}

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';

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

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  leadIds: string[];
  messages: OutreachMessage[];
  channels: OutreachChannel[];
  sequenceSteps: number;
  createdAt: string;
  updatedAt: string;
  stats: CampaignStats;
}

export interface OutreachAnalytics {
  qualifiedLeads: number;
  messagesPrepared: number;
  messagesApproved: number;
  messagesSent: number;
  meetingsBooked: number;
  proposalsSent: number;
  eventsByType: Record<OutreachEventType, number>;
  activeCampaigns: number;
  totalCampaigns: number;
  webhookDeliveries: number;
  webhookFailures: number;
}
