import { BusinessLead, SearchFilterCriteria, Campaign, OutreachMessage, OutreachAnalytics, WebhookSubscription, OutreachEvent, JobListing, JobSearchCriteria, GlobalCity, HiringCompany } from '../types';

const BASE = '';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || err.details || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  health: () =>
    request<{ status: string; timestamp: string; plugins: string[]; agents: { name: string; status: string }[] }>('/api/health'),

  doctor: (format?: string) =>
    request<any>(`/api/doctor${format ? `?format=${format}` : ''}`),

  runSearch: (criteria: SearchFilterCriteria) =>
    request<{ leads: BusinessLead[]; source: string; workflowId?: string; logCount?: number }>('/api/agents/run-search', {
      method: 'POST',
      body: JSON.stringify(criteria),
    }),

  analyzeWebsite: (url: string) =>
    request<any>('/api/agents/analyze-website', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),

  draftEmail: (lead: BusinessLead, style?: string) =>
    request<{ subject: string; body: string; style: string; promptTemplateUsed: string }>('/api/agents/auto-draft-email', {
      method: 'POST',
      body: JSON.stringify({ lead, style }),
    }),

  generateCampaign: (lead: BusinessLead, agencyType?: string) =>
    request<any>('/api/agents/generate-campaign', {
      method: 'POST',
      body: JSON.stringify({ lead, agencyType }),
    }),

  getLeads: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ leads: BusinessLead[]; total: number }>(`/api/leads${qs}`);
  },

  getLead: (id: string) => request<BusinessLead>(`/api/leads/${id}`),

  updateLead: (id: string, updates: Partial<BusinessLead>) =>
    request<BusinessLead>(`/api/leads/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),

  deleteLead: (id: string) =>
    request<{ success: boolean }>(`/api/leads/${id}`, { method: 'DELETE' }),

  getStats: () =>
    request<{
      totalLeads: number;
      hotLeads: number;
      warmLeads: number;
      coldLeads: number;
      totalWorkflows: number;
      totalSearches: number;
      categories: string[];
      cities: string[];
      avgOpportunityScore: number;
    }>('/api/stats'),

  getAgentsStatus: () =>
    request<{
      agents: any[];
      plugins: string[];
      workflows: { id: string; status: string; progress: number; leadCount: number }[];
    }>('/api/agents/status'),

  getAgentLogs: () =>
    request<{ logs: any[] }>('/api/agents/logs'),

  getPluginHealth: () =>
    request<{ plugins: { name: string; healthy: boolean; message?: string }[] }>('/api/plugins/health'),

  getSearchHistory: () =>
    request<{ history: { criteria: any; resultCount: number; timestamp: string }[] }>('/api/search/history'),

  getWorkflows: () =>
    request<{ workflows: any[] }>('/api/workflows'),

  getWorkflow: (id: string) =>
    request<any>(`/api/workflows/${id}`),

  exportData: (format: string, leadIds?: string[]) =>
    request<any>('/api/export', {
      method: 'POST',
      body: JSON.stringify({ format, leadIds }),
    }),

  exportPreview: (format?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (format) params.set('format', format);
    if (limit) params.set('limit', String(limit));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<any>(`/api/export/preview${qs}`);
  },

  syncCrm: (crmId: string, leads: BusinessLead[]) =>
    request<any>('/api/crm/sync', {
      method: 'POST',
      body: JSON.stringify({ crmId, leads }),
    }),

  createCronJob: (job: { name: string; criteria: SearchFilterCriteria; schedule: string; enabled: boolean }) =>
    request<any>('/api/cron/jobs', {
      method: 'POST',
      body: JSON.stringify(job),
    }),

  getCronJobs: () =>
    request<{ jobs: any[] }>('/api/cron/jobs'),

  updateCronJob: (id: string, updates: any) =>
    request<any>(`/api/cron/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  deleteCronJob: (id: string) =>
    request<{ success: boolean }>(`/api/cron/jobs/${id}`, { method: 'DELETE' }),

  runCronJob: (id: string) =>
    request<any>(`/api/cron/jobs/${id}/run`, { method: 'POST' }),

  getSettings: () =>
    request<any>('/api/settings'),

  updateSettings: (settings: any) =>
    request<any>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  getAnalyticsOverview: () =>
    request<any>('/api/analytics/overview'),

  getEvents: (params?: { type?: string; leadId?: string; limit?: number }) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return request<{ events: OutreachEvent[]; total: number }>(`/api/events${qs}`);
  },

  getEventCounts: () =>
    request<{ counts: Record<string, number> }>('/api/events/counts'),

  getWebhooks: () =>
    request<{ subscriptions: WebhookSubscription[] }>('/api/webhooks'),

  createWebhook: (data: { url: string; events: string[]; platform?: string }) =>
    request<WebhookSubscription>('/api/webhooks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateWebhook: (id: string, updates: any) =>
    request<WebhookSubscription>(`/api/webhooks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  deleteWebhook: (id: string) =>
    request<{ success: boolean }>(`/api/webhooks/${id}`, { method: 'DELETE' }),

  testWebhook: (id: string) =>
    request<any>(`/api/webhooks/${id}/test`, { method: 'POST' }),

  getWebhookDeliveries: (limit?: number) => {
    const qs = limit ? `?limit=${limit}` : '';
    return request<any>(`/api/webhooks/deliveries${qs}`);
  },

  generateOutreachMessage: (lead: BusinessLead, channel?: string, agencyType?: string) =>
    request<any>('/api/outreach/generate', {
      method: 'POST',
      body: JSON.stringify({ lead, channel, agencyType }),
    }),

  generateOutreachSequence: (lead: BusinessLead, channel?: string, steps?: number) =>
    request<{ messages: OutreachMessage[] }>('/api/outreach/generate-sequence', {
      method: 'POST',
      body: JSON.stringify({ lead, channel, steps }),
    }),

  getPendingMessages: () =>
    request<{ messages: OutreachMessage[]; total: number }>('/api/outreach/pending'),

  getOutreachAnalytics: () =>
    request<OutreachAnalytics>('/api/outreach/analytics'),

  getCampaigns: () =>
    request<{ campaigns: Campaign[] }>('/api/campaigns'),

  getCampaign: (id: string) =>
    request<Campaign>(`/api/campaigns/${id}`),

  createCampaign: (data: { name: string; leads: BusinessLead[]; channels?: string[]; sequenceSteps?: number; criteria?: any }) =>
    request<Campaign>('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  activateCampaign: (id: string) =>
    request<Campaign>(`/api/campaigns/${id}/activate`, { method: 'POST' }),

  pauseCampaign: (id: string) =>
    request<Campaign>(`/api/campaigns/${id}/pause`, { method: 'POST' }),

  deleteCampaign: (id: string) =>
    request<{ success: boolean }>(`/api/campaigns/${id}`, { method: 'DELETE' }),

  getCampaignPendingMessages: (id: string) =>
    request<{ messages: OutreachMessage[] }>(`/api/campaigns/${id}/pending`),

  approveMessage: (campaignId: string, messageId: string) =>
    request<OutreachMessage>(`/api/campaigns/${campaignId}/messages/${messageId}/approve`, { method: 'POST' }),

  rejectMessage: (campaignId: string, messageId: string) =>
    request<OutreachMessage>(`/api/campaigns/${campaignId}/messages/${messageId}/reject`, { method: 'POST' }),

  recordMeeting: (campaignId: string, leadId: string) =>
    request<{ success: boolean }>(`/api/campaigns/${campaignId}/meeting`, {
      method: 'POST',
      body: JSON.stringify({ leadId }),
    }),

  recordReply: (campaignId: string, leadId: string, positive?: boolean) =>
    request<{ success: boolean }>(`/api/campaigns/${campaignId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ leadId, positive }),
    }),

  getMcpTools: () =>
    request<{ tools: any[] }>('/api/mcp/tools'),

  executeMcpTool: (toolName: string, params?: any) =>
    request<any>(`/api/mcp/tools/${toolName}`, {
      method: 'POST',
      body: JSON.stringify(params || {}),
    }),

  getMcpResources: () =>
    request<{ resources: any[] }>('/api/mcp/resources'),

  getMcpResource: (uri: string) =>
    request<any>(`/api/mcp/resources/${encodeURIComponent(uri)}`),

  batchUpdateLeadStatus: (ids: string[], status: string) =>
    request<{ updated: number; leads: BusinessLead[] }>('/api/leads/batch/update', {
      method: 'POST',
      body: JSON.stringify({ ids, status }),
    }),

  batchDeleteLeads: (ids: string[]) =>
    request<{ deleted: number }>('/api/leads/batch/delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  advancedSearch: (query: {
    searchTerm?: string;
    grades?: string[];
    categories?: string[];
    cities?: string[];
    websiteStatuses?: string[];
    minScore?: number;
    maxScore?: number;
    minRating?: number;
    minReviews?: number;
    status?: string[];
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }) =>
    request<{ leads: BusinessLead[]; total: number }>('/api/leads/search', {
      method: 'POST',
      body: JSON.stringify(query),
    }),

  getNotifications: (params?: { limit?: number; unreadOnly?: boolean }) => {
    const qs = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [k, v]) => {
        if (v !== undefined) acc[k] = String(v);
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    return request<{ notifications: any[]; total: number; unreadCount: number }>(`/api/notifications${qs}`);
  },

  getUnreadNotificationCount: () =>
    request<{ count: number }>('/api/notifications/unread-count'),

  markNotificationRead: (id: string) =>
    request<any>(`/api/notifications/${id}/read`, { method: 'POST' }),

  markAllNotificationsRead: () =>
    request<{ success: boolean; markedRead: number }>('/api/notifications/read-all', { method: 'POST' }),

  deleteNotification: (id: string) =>
    request<{ success: boolean }>(`/api/notifications/${id}`, { method: 'DELETE' }),

  getExportedLeads: (limit?: number) => {
    const qs = limit ? `?limit=${limit}` : '';
    return request<{ leads: BusinessLead[]; total: number }>(`/api/leads/exported${qs}`);
  },

  restoreExportedLead: (id: string) =>
    request<{ success: boolean; lead: BusinessLead }>(`/api/leads/exported/${id}/restore`, { method: 'POST' }),

  exportAndFlush: (format: string, leadIds?: string[], city?: string) =>
    request<any>('/api/export/flush', {
      method: 'POST',
      body: JSON.stringify({ format, leadIds, city }),
    }),

  getLocalDbStatus: () =>
    request<{
      ip: string;
      dbSizeBytes: number;
      dbSizeHuman: string;
      activeLeads: number;
      archivedLeads: number;
      totalWorkflows: number;
      totalSearches: number;
    }>('/api/local-db/status'),

  searchJobs: (criteria: JobSearchCriteria) =>
    request<{ jobs: JobListing[]; total: number; source: string }>('/api/jobs/search', {
      method: 'POST',
      body: JSON.stringify(criteria),
    }),

  getJobCities: (region?: string) => {
    const qs = region && region !== 'all' ? `?region=${encodeURIComponent(region)}` : '';
    return request<{ cities: GlobalCity[] }>(`/api/jobs/cities${qs}`);
  },

  getJobCompanies: () =>
    request<{ companies: HiringCompany[] }>('/api/jobs/companies'),

  getJobStats: () =>
    request<{
      totalJobs: number;
      remoteJobs: number;
      companies: number;
      countries: number;
      topSkills: string[];
      avgSalary: Record<string, number>;
    }>('/api/jobs/stats'),
};
