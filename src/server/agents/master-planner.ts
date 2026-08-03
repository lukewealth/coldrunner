import { Agent, AgentContext, AgentResult } from './types';
import { SearchCriteria, BusinessLead, WorkflowLog } from '../types';
import { GooglePlacesAgent } from './google-places';
import { WebsiteAnalyzerAgent } from './website-analyzer';
import { ContactDiscoveryAgent } from './contact-discovery';
import { OpportunityScorerAgent } from './opportunity-scorer';
import { DuplicateDetectorAgent } from './duplicate-detector';
import { AgentStatus } from '../types';
import { eventBus } from '../services/event-bus';

export class MasterPlannerAgent {
  name = 'Master Planning Agent';
  description = 'Orchestrates the full autonomous business intelligence workflow across all specialized agents';

  private agents = {
    googlePlaces: new GooglePlacesAgent(),
    websiteAnalyzer: new WebsiteAnalyzerAgent(),
    contactDiscovery: new ContactDiscoveryAgent(),
    opportunityScorer: new OpportunityScorerAgent(),
    duplicateDetector: new DuplicateDetectorAgent(),
  };

  private agentStatuses: Map<string, AgentStatus> = new Map();

  constructor() {
    this.initializeStatuses();
  }

  private initializeStatuses(): void {
    const statuses: AgentStatus[] = [
      { id: 'ag-mp', name: 'Master Planning Agent', type: 'master-planner', status: 'idle', itemsProcessed: 0, currentTask: 'Awaiting search request', lastActive: new Date() },
      { id: 'ag-gp', name: 'Google Places Discovery Agent', type: 'google-places', status: 'idle', itemsProcessed: 0, currentTask: 'Ready for geospatial query', lastActive: new Date() },
      { id: 'ag-wa', name: 'Website Intelligence Agent', type: 'website-analyzer', status: 'idle', itemsProcessed: 0, currentTask: 'Ready for website audit', lastActive: new Date() },
      { id: 'ag-cd', name: 'Contact & Email Discovery Agent', type: 'contact-discovery', status: 'idle', itemsProcessed: 0, currentTask: 'Ready for contact enrichment', lastActive: new Date() },
      { id: 'ag-os', name: 'AI Opportunity Scoring Agent', type: 'opportunity-scorer', status: 'idle', itemsProcessed: 0, currentTask: 'Ready for lead scoring', lastActive: new Date() },
      { id: 'ag-dd', name: 'Duplicate Detection Agent', type: 'duplicate-detector', status: 'idle', itemsProcessed: 0, currentTask: 'Ready for deduplication', lastActive: new Date() },
    ];

    for (const s of statuses) {
      this.agentStatuses.set(s.id, s);
    }
  }

  async execute(
    criteria: SearchCriteria,
    onLog: (log: Omit<WorkflowLog, 'id' | 'timestamp'>) => void,
    onProgress?: (step: number, totalSteps: number, partialLeads: BusinessLead[]) => void,
  ): Promise<BusinessLead[]> {
    const context: any = {
      taskId: `workflow-${Date.now()}`,
      criteria,
      leads: [] as BusinessLead[],
      logs: [] as WorkflowLog[],
      onLog: (log: Omit<WorkflowLog, 'id' | 'timestamp'>) => {
        onLog(log);
        context.logs.push({ ...log, id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, timestamp: new Date() });
      },
    };

    this.updateStatus('ag-mp', 'running', 'Coordinating autonomous research workflow...');
    context.onLog({ agent: this.name, level: 'info', message: `Initiating autonomous research workflow for ${criteria.category} in ${criteria.city}, ${criteria.country}` });
    context.onLog({ agent: this.name, level: 'info', message: `Target: ${criteria.targetCount} qualified businesses | Min Rating: ${criteria.minRating} | Min Reviews: ${criteria.minReviews}` });

    await eventBus.emit('search.started', {
      criteria,
      taskId: context.taskId,
    });

    try {
      // Step 1: Google Places Discovery
      this.updateStatus('ag-gp', 'running', `Discovering ${criteria.category} businesses in ${criteria.city}...`);
      const discoveryResult = await this.agents.googlePlaces.execute(context);
      
      if (!discoveryResult.success || !context.leads.length) {
        throw new Error(discoveryResult.error || 'No businesses discovered');
      }

      context.onLog({ agent: this.name, level: 'success', message: `Phase 1 complete: ${context.leads.length} businesses discovered via Google Places API` });
      this.updateStatus('ag-gp', 'completed', `Discovered ${discoveryResult.itemsProcessed} businesses`, discoveryResult.itemsProcessed);
      onProgress?.(1, 6, [...context.leads]);

      for (const lead of context.leads) {
        await eventBus.emit('business.discovered', {
          name: lead.name,
          category: lead.category,
          city: lead.city,
          rating: lead.rating,
          reviewCount: lead.reviewCount,
        }, lead.id);
      }

      // Step 2: Website Analysis
      this.updateStatus('ag-wa', 'running', `Analyzing websites for ${context.leads.length} businesses...`);
      const websiteResult = await this.agents.websiteAnalyzer.execute(context);
      context.onLog({ agent: this.name, level: 'success', message: `Phase 2 complete: Website analysis for ${websiteResult.itemsProcessed} businesses` });
      this.updateStatus('ag-wa', 'completed', `Analyzed ${websiteResult.itemsProcessed} websites`, websiteResult.itemsProcessed);
      onProgress?.(2, 6, [...context.leads]);

      for (const lead of context.leads) {
        await eventBus.emit('website.analyzed', {
          name: lead.name,
          websiteStatus: lead.websiteStatus,
          performance: lead.audit.performance,
          seo: lead.audit.seo,
        }, lead.id);
      }

      // Step 3: Contact Discovery
      this.updateStatus('ag-cd', 'running', `Enriching contacts for ${context.leads.length} businesses...`);
      const contactResult = await this.agents.contactDiscovery.execute(context);
      context.onLog({ agent: this.name, level: 'success', message: `Phase 3 complete: Contact enrichment for ${contactResult.itemsProcessed} businesses` });
      this.updateStatus('ag-cd', 'completed', `Enriched ${contactResult.itemsProcessed} contacts`, contactResult.itemsProcessed);
      onProgress?.(3, 6, [...context.leads]);

      for (const lead of context.leads) {
        await eventBus.emit('contact.enriched', {
          name: lead.name,
          email: lead.email,
          hasOwnerName: !!lead.ownerName,
          hasSocials: Object.values(lead.socials).some(Boolean),
        }, lead.id);
      }

      // Step 4: Opportunity Scoring
      this.updateStatus('ag-os', 'running', `Scoring ${context.leads.length} leads for opportunity...`);
      const scoringResult = await this.agents.opportunityScorer.execute(context);
      context.onLog({ agent: this.name, level: 'success', message: `Phase 4 complete: Opportunity scoring for ${scoringResult.itemsProcessed} leads` });
      this.updateStatus('ag-os', 'completed', `Scored ${scoringResult.itemsProcessed} leads`, scoringResult.itemsProcessed);
      onProgress?.(4, 6, [...context.leads]);

      for (const lead of context.leads) {
        await eventBus.emit('opportunity.scored', {
          name: lead.name,
          score: lead.opportunityScore,
          grade: lead.grade,
        }, lead.id);
      }

      // Step 5: Filter by criteria
      let filteredLeads = context.leads.filter((l: BusinessLead) => {
        if (l.rating < criteria.minRating) return false;
        if (l.reviewCount < criteria.minReviews) return false;
        if (l.opportunityScore < criteria.minOpportunityScore) return false;
        return true;
      });

      context.onLog({ agent: this.name, level: 'info', message: `Filtered to ${filteredLeads.length} leads meeting minimum criteria (Rating >= ${criteria.minRating}, Reviews >= ${criteria.minReviews}, Score >= ${criteria.minOpportunityScore})` });
      onProgress?.(5, 6, [...filteredLeads]);

      for (const lead of filteredLeads) {
        await eventBus.emit('business.qualified', {
          name: lead.name,
          category: lead.category,
          city: lead.city,
          rating: lead.rating,
          reviews: lead.reviewCount,
          websiteStatus: lead.websiteStatus,
          opportunityScore: lead.opportunityScore,
        }, lead.id);
      }

      // Step 6: Duplicate Detection
      this.updateStatus('ag-dd', 'running', `Checking for duplicates among ${filteredLeads.length} leads...`);
      context.leads = filteredLeads;
      const dedupResult = await this.agents.duplicateDetector.execute(context);
      filteredLeads = dedupResult.leads || filteredLeads;
      this.updateStatus('ag-dd', 'completed', `Deduplicated to ${filteredLeads.length} unique leads`, dedupResult.itemsProcessed);
      onProgress?.(6, 6, [...filteredLeads]);

      // Step 7: Trim to target count
      const finalLeads = filteredLeads.slice(0, criteria.targetCount);

      context.onLog({ agent: this.name, level: 'success', message: `Workflow complete: ${finalLeads.length} qualified business leads ready for export` });
      this.updateStatus('ag-mp', 'completed', `Workflow complete: ${finalLeads.length} leads delivered`, finalLeads.length);

      for (const lead of finalLeads) {
        await eventBus.emit('lead.ready', {
          name: lead.name,
          category: lead.category,
          city: lead.city,
          opportunityScore: lead.opportunityScore,
          grade: lead.grade,
          websiteStatus: lead.websiteStatus,
          recommendedService: lead.recommendedService,
        }, lead.id);
      }

      await eventBus.emit('search.completed', {
        criteria,
        taskId: context.taskId,
        totalDiscovered: context.leads.length,
        qualified: filteredLeads.length,
        delivered: finalLeads.length,
      });

      return finalLeads;
    } catch (err: any) {
      context.onLog({ agent: this.name, level: 'error', message: `Workflow failed: ${err.message}` });
      this.updateStatus('ag-mp', 'error', `Failed: ${err.message}`);
      throw err;
    }
  }

  getStatus(): AgentStatus[] {
    return Array.from(this.agentStatuses.values());
  }

  private updateStatus(id: string, status: AgentStatus['status'], task: string, items?: number): void {
    const existing = this.agentStatuses.get(id);
    if (existing) {
      existing.status = status;
      existing.currentTask = task;
      existing.lastActive = new Date();
      if (items !== undefined) existing.itemsProcessed = items;
    }
  }
}

export const masterPlanner = new MasterPlannerAgent();
