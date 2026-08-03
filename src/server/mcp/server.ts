import { masterPlanner } from '../agents';
import { pluginRegistry } from '../plugins';
import { database } from '../services/database';
import { exportService } from '../services/export';
import { workflowEngine } from '../services/workflow';
import { SearchCriteria, BusinessLead } from '../types';

interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (params: any) => Promise<any>;
}

interface McpResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  handler: () => Promise<any>;
}

export class McpServer {
  private tools: Map<string, McpTool> = new Map();
  private resources: Map<string, McpResource> = new Map();

  async initialize(): Promise<void> {
    await pluginRegistry.initialize();
    await database.initialize();
    this.registerTools();
    this.registerResources();
  }

  private registerTools(): void {
    this.tools.set('discover_businesses', {
      name: 'discover_businesses',
      description: 'Discover businesses using Google Places API for a given city, category, and criteria. Returns enriched business leads with opportunity scores.',
      inputSchema: {
        type: 'object',
        properties: {
          country: { type: 'string', description: 'Country name (e.g., Canada, United States)' },
          province: { type: 'string', description: 'Province or State name' },
          city: { type: 'string', description: 'City name' },
          category: { type: 'string', description: 'Business category (e.g., Dental Clinic, HVAC Services, Restaurant)' },
          radiusKm: { type: 'number', description: 'Search radius in kilometers', default: 25 },
          targetCount: { type: 'number', description: 'Target number of businesses to find', default: 20 },
          minRating: { type: 'number', description: 'Minimum Google rating', default: 4.3 },
          minReviews: { type: 'number', description: 'Minimum review count', default: 50 },
          minOpportunityScore: { type: 'number', description: 'Minimum opportunity score (0-100)', default: 60 },
        },
        required: ['country', 'city', 'category'],
      },
      handler: async (params) => {
        const criteria: SearchCriteria = {
          country: params.country,
          province: params.province || '',
          city: params.city,
          radiusKm: params.radiusKm || 25,
          category: params.category,
          minRating: params.minRating || 4.3,
          minReviews: params.minReviews || 50,
          targetCount: params.targetCount || 20,
          minOpportunityScore: params.minOpportunityScore || 60,
        };

        const result = await workflowEngine.startWorkflow(criteria);
        return {
          success: true,
          workflowId: result.workflowId,
          leadCount: result.leads.length,
          hotLeads: result.leads.filter((l) => l.grade === 'HOT').length,
          leads: result.leads,
        };
      },
    });

    this.tools.set('analyze_website', {
      name: 'analyze_website',
      description: 'Run a comprehensive website analysis including PageSpeed, SEO, tech stack detection, SSL check, and opportunity identification.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Website URL to analyze' },
        },
        required: ['url'],
      },
      handler: async (params) => {
        const result = await pluginRegistry.executePlugin('firecrawl', { url: params.url });
        return result;
      },
    });

    this.tools.set('discover_contacts', {
      name: 'discover_contacts',
      description: 'Discover business emails, owner contacts, and social profiles for a given domain or company name.',
      inputSchema: {
        type: 'object',
        properties: {
          domain: { type: 'string', description: 'Business domain (e.g., example.com)' },
          companyName: { type: 'string', description: 'Business name for Apollo search' },
          city: { type: 'string', description: 'City for location-based search' },
        },
        required: [],
      },
      handler: async (params) => {
        const results: any = {};
        
        if (params.domain) {
          results.hunter = await pluginRegistry.executePlugin('hunter', { domain: params.domain, companyName: params.companyName });
        }
        if (params.companyName) {
          results.apollo = await pluginRegistry.executePlugin('apollo', { companyName: params.companyName, city: params.city });
        }
        if (params.companyName) {
          results.social = await pluginRegistry.executePlugin('social-analyzer', { businessName: params.companyName, city: params.city });
        }

        return { success: true, data: results };
      },
    });

    this.tools.set('run_pagespeed', {
      name: 'run_pagespeed',
      description: 'Run Google PageSpeed Insights analysis for performance, SEO, accessibility, and best practices.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Website URL to test' },
          strategy: { type: 'string', enum: ['mobile', 'desktop'], default: 'mobile' },
        },
        required: ['url'],
      },
      handler: async (params) => {
        return await pluginRegistry.executePlugin('pagespeed', { url: params.url, strategy: params.strategy || 'mobile' });
      },
    });

    this.tools.set('get_leads', {
      name: 'get_leads',
      description: 'Retrieve stored business leads with optional filtering by grade, category, city, or minimum score.',
      inputSchema: {
        type: 'object',
        properties: {
          grade: { type: 'string', enum: ['HOT', 'WARM', 'COLD'], description: 'Filter by lead grade' },
          category: { type: 'string', description: 'Filter by business category' },
          city: { type: 'string', description: 'Filter by city' },
          websiteStatus: { type: 'string', description: 'Filter by website status' },
          minScore: { type: 'number', description: 'Minimum opportunity score' },
          limit: { type: 'number', description: 'Maximum number of leads to return', default: 50 },
        },
      },
      handler: async (params) => {
        const leads = database.searchLeads({
          grade: params.grade,
          category: params.category,
          city: params.city,
          websiteStatus: params.websiteStatus,
          minScore: params.minScore,
        });
        return { success: true, count: leads.length, leads: leads.slice(0, params.limit || 50) };
      },
    });

    this.tools.set('export_leads', {
      name: 'export_leads',
      description: 'Export business leads to CSV, JSON, Markdown, or Excel format.',
      inputSchema: {
        type: 'object',
        properties: {
          format: { type: 'string', enum: ['csv', 'json', 'markdown', 'excel'], description: 'Export format' },
          leadIds: { type: 'array', items: { type: 'string' }, description: 'Specific lead IDs to export (empty = all)' },
          city: { type: 'string', description: 'City name for report header' },
        },
        required: ['format'],
      },
      handler: async (params) => {
        let leads = database.getAllLeads();
        if (params.leadIds?.length > 0) {
          leads = leads.filter((l) => params.leadIds.includes(l.id));
        }

        let content: string;
        let mimeType: string;

        switch (params.format) {
          case 'csv':
            content = exportService.generateCSV(leads, { includeSocials: true });
            mimeType = 'text/csv';
            break;
          case 'json':
            content = exportService.generateJSON(leads, params.city);
            mimeType = 'application/json';
            break;
          case 'markdown':
            content = exportService.generateMarkdown(leads, params.city);
            mimeType = 'text/markdown';
            break;
          case 'excel':
            content = exportService.generateExcelXML(leads);
            mimeType = 'application/vnd.ms-excel';
            break;
          default:
            content = exportService.generateJSON(leads);
            mimeType = 'application/json';
        }

        return { success: true, format: params.format, mimeType, content, leadCount: leads.length };
      },
    });

    this.tools.set('get_stats', {
      name: 'get_stats',
      description: 'Get platform statistics including total leads, hot leads, categories, and cities.',
      inputSchema: { type: 'object', properties: {} },
      handler: async () => {
        return { success: true, data: database.getStats() };
      },
    });

    this.tools.set('geocode_location', {
      name: 'geocode_location',
      description: 'Convert an address to latitude/longitude coordinates using Google Geocoding API.',
      inputSchema: {
        type: 'object',
        properties: {
          address: { type: 'string', description: 'Full address to geocode' },
        },
        required: ['address'],
      },
      handler: async (params) => {
        const result = await pluginRegistry.executePlugin('google-places', { type: 'geocode', address: params.address });
        return result;
      },
    });

    this.tools.set('check_plugin_health', {
      name: 'check_plugin_health',
      description: 'Check health status of all registered plugins (Google Places, Firecrawl, Hunter, Apollo, etc.)',
      inputSchema: { type: 'object', properties: {} },
      handler: async () => {
        const health = await pluginRegistry.healthCheck();
        return { success: true, plugins: health };
      },
    });
  }

  private registerResources(): void {
    this.resources.set('leads://all', {
      uri: 'leads://all',
      name: 'All Business Leads',
      description: 'Complete list of all discovered and enriched business leads',
      mimeType: 'application/json',
      handler: async () => database.getAllLeads(),
    });

    this.resources.set('leads://hot', {
      uri: 'leads://hot',
      name: 'HOT Leads',
      description: 'Business leads with opportunity score >= 85',
      mimeType: 'application/json',
      handler: async () => database.searchLeads({ grade: 'HOT' }),
    });

    this.resources.set('stats://platform', {
      uri: 'stats://platform',
      name: 'Platform Statistics',
      description: 'Overall platform statistics and metrics',
      mimeType: 'application/json',
      handler: async () => database.getStats(),
    });

    this.resources.set('agents://status', {
      uri: 'agents://status',
      name: 'Agent Status',
      description: 'Current status of all autonomous agents',
      mimeType: 'application/json',
      handler: async () => masterPlanner.getStatus(),
    });

    this.resources.set('plugins://health', {
      uri: 'plugins://health',
      name: 'Plugin Health',
      description: 'Health status of all registered plugins',
      mimeType: 'application/json',
      handler: async () => pluginRegistry.healthCheck(),
    });

    this.resources.set('workflows://active', {
      uri: 'workflows://active',
      name: 'Active Workflows',
      description: 'Currently running and recent workflow states',
      mimeType: 'application/json',
      handler: async () => workflowEngine.getActiveWorkflows(),
    });
  }

  async handleToolCall(toolName: string, params: any): Promise<any> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return { success: false, error: `Tool "${toolName}" not found` };
    }

    try {
      return await tool.handler(params);
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async handleResourceRequest(uri: string): Promise<any> {
    const resource = this.resources.get(uri);
    if (!resource) {
      return { success: false, error: `Resource "${uri}" not found` };
    }

    try {
      const data = await resource.handler();
      return { success: true, uri, data, mimeType: resource.mimeType };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  listTools(): McpTool[] {
    return Array.from(this.tools.values()).map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
      handler: async () => {},
    }));
  }

  listResources(): McpResource[] {
    return Array.from(this.resources.values()).map((r) => ({
      uri: r.uri,
      name: r.name,
      description: r.description,
      mimeType: r.mimeType,
      handler: async () => {},
    }));
  }
}

export const mcpServer = new McpServer();
