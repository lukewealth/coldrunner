import { BusinessLead, SearchCriteria, WorkflowLog } from '../types';

export class DatabaseService {
  private leads: Map<string, BusinessLead> = new Map();
  private workflows: Map<string, { criteria: SearchCriteria; leads: BusinessLead[]; logs: WorkflowLog[]; createdAt: Date }> = new Map();
  private searchHistory: { criteria: SearchCriteria; resultCount: number; timestamp: Date }[] = [];

  async initialize(): Promise<void> {
    // In-memory for now; can be swapped for SQLite/PostgreSQL
  }

  saveLeads(leads: BusinessLead[]): void {
    for (const lead of leads) {
      this.leads.set(lead.id, lead);
    }
  }

  getLead(id: string): BusinessLead | undefined {
    return this.leads.get(id);
  }

  getAllLeads(): BusinessLead[] {
    return Array.from(this.leads.values());
  }

  updateLead(id: string, updates: Partial<BusinessLead>): BusinessLead | undefined {
    const existing = this.leads.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, lastUpdated: new Date().toISOString().split('T')[0] };
    this.leads.set(id, updated);
    return updated;
  }

  deleteLead(id: string): boolean {
    return this.leads.delete(id);
  }

  searchLeads(query: {
    grade?: string;
    category?: string;
    city?: string;
    websiteStatus?: string;
    minScore?: number;
    status?: string;
  }): BusinessLead[] {
    return this.getAllLeads().filter((lead) => {
      if (query.grade && lead.grade !== query.grade) return false;
      if (query.category && lead.category !== query.category) return false;
      if (query.city && lead.city.toLowerCase() !== query.city.toLowerCase()) return false;
      if (query.websiteStatus && lead.websiteStatus !== query.websiteStatus) return false;
      if (query.minScore && lead.opportunityScore < query.minScore) return false;
      if (query.status && lead.status !== query.status) return false;
      return true;
    });
  }

  saveWorkflow(criteria: SearchCriteria, leads: BusinessLead[], logs: WorkflowLog[]): string {
    const id = `wf-${Date.now()}`;
    this.workflows.set(id, { criteria, leads, logs, createdAt: new Date() });
    return id;
  }

  getWorkflow(id: string) {
    return this.workflows.get(id);
  }

  getAllWorkflows() {
    return Array.from(this.workflows.entries()).map(([id, wf]) => ({
      id,
      ...wf,
      leadCount: wf.leads.length,
    }));
  }

  addSearchHistory(criteria: SearchCriteria, resultCount: number): void {
    this.searchHistory.push({ criteria, resultCount, timestamp: new Date() });
  }

  getSearchHistory() {
    return this.searchHistory;
  }

  getStats() {
    const leads = this.getAllLeads();
    return {
      totalLeads: leads.length,
      hotLeads: leads.filter((l) => l.grade === 'HOT').length,
      warmLeads: leads.filter((l) => l.grade === 'WARM').length,
      coldLeads: leads.filter((l) => l.grade === 'COLD').length,
      totalWorkflows: this.workflows.size,
      totalSearches: this.searchHistory.length,
      categories: [...new Set(leads.map((l) => l.category))],
      cities: [...new Set(leads.map((l) => l.city))],
      avgOpportunityScore: leads.length > 0
        ? Math.round(leads.reduce((sum, l) => sum + l.opportunityScore, 0) / leads.length)
        : 0,
    };
  }

  clearAll(): void {
    this.leads.clear();
    this.workflows.clear();
    this.searchHistory = [];
  }

  batchUpdateStatus(ids: string[], status: string): { updated: number; leads: BusinessLead[] } {
    let updated = 0;
    const leads: BusinessLead[] = [];
    for (const id of ids) {
      const result = this.updateLead(id, { status: status as any });
      if (result) {
        updated++;
        leads.push(result);
      }
    }
    return { updated, leads };
  }

  batchDelete(ids: string[]): { deleted: number } {
    let deleted = 0;
    for (const id of ids) {
      if (this.leads.delete(id)) deleted++;
    }
    return { deleted };
  }

  advancedSearch(query: {
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
  }): { leads: BusinessLead[]; total: number } {
    let results = this.getAllLeads();

    if (query.searchTerm) {
      const term = query.searchTerm.toLowerCase();
      results = results.filter((l) =>
        l.name.toLowerCase().includes(term) ||
        l.category.toLowerCase().includes(term) ||
        l.city.toLowerCase().includes(term) ||
        l.email.toLowerCase().includes(term) ||
        (l.ownerName && l.ownerName.toLowerCase().includes(term))
      );
    }
    if (query.grades && query.grades.length > 0) {
      results = results.filter((l) => query.grades!.includes(l.grade));
    }
    if (query.categories && query.categories.length > 0) {
      results = results.filter((l) => query.categories!.includes(l.category));
    }
    if (query.cities && query.cities.length > 0) {
      results = results.filter((l) => query.cities!.some((c) => c.toLowerCase() === l.city.toLowerCase()));
    }
    if (query.websiteStatuses && query.websiteStatuses.length > 0) {
      results = results.filter((l) => query.websiteStatuses!.includes(l.websiteStatus));
    }
    if (query.minScore !== undefined) {
      results = results.filter((l) => l.opportunityScore >= query.minScore!);
    }
    if (query.maxScore !== undefined) {
      results = results.filter((l) => l.opportunityScore <= query.maxScore!);
    }
    if (query.minRating !== undefined) {
      results = results.filter((l) => l.rating >= query.minRating!);
    }
    if (query.minReviews !== undefined) {
      results = results.filter((l) => l.reviewCount >= query.minReviews!);
    }
    if (query.status && query.status.length > 0) {
      results = results.filter((l) => query.status!.includes(l.status));
    }

    const total = results.length;

    if (query.sortBy) {
      const dir = query.sortDir === 'asc' ? 1 : -1;
      results.sort((a, b) => {
        const aVal = (a as any)[query.sortBy!];
        const bVal = (b as any)[query.sortBy!];
        if (typeof aVal === 'string') return aVal.localeCompare(bVal) * dir;
        return ((aVal as number) - (bVal as number)) * dir;
      });
    }

    const offset = query.offset || 0;
    const limit = query.limit || 100;
    results = results.slice(offset, offset + limit);

    return { leads: results, total };
  }
}

export const database = new DatabaseService();
