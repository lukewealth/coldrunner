import { BusinessLead, SearchFilterCriteria } from '../types';

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

  runSearch: (criteria: SearchFilterCriteria) =>
    request<{ leads: BusinessLead[]; source: string; workflowId?: string }>('/api/agents/run-search', {
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
};
