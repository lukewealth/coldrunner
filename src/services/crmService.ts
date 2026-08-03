import { BusinessLead } from '../types';

export type SupportedCrm = 'hubspot' | 'salesforce' | 'gohighlevel' | 'zoho' | 'pipedrive';

export interface CrmConfig {
  id: SupportedCrm;
  name: string;
  logo: string;
  color: string;
  apiKey?: string;
  webhookUrl?: string;
  connected: boolean;
  pipelineName: string;
  defaultStage: string;
}

export interface CrmSyncResult {
  crmId: SupportedCrm;
  crmName: string;
  timestamp: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  syncedCount: number;
  dealsCreated: number;
  contactsCreated: number;
  totalEstimatedPipelineValue: string;
  webhookResponse: {
    statusCode: number;
    transactionId: string;
    payloadSummary: string;
  };
  logs: string[];
}

// In-memory CRM Configurations
const defaultCrmConfigs: Record<SupportedCrm, CrmConfig> = {
  hubspot: {
    id: 'hubspot',
    name: 'HubSpot CRM',
    logo: 'HubSpot',
    color: 'border-orange-500 bg-orange-50 text-orange-700',
    apiKey: 'pat-na1-893f21-mock-hubspot-token',
    connected: true,
    pipelineName: 'ColdRunners Agency Pipeline',
    defaultStage: 'Lead Discovered / Audit Ready'
  },
  salesforce: {
    id: 'salesforce',
    name: 'Salesforce Sales Cloud',
    logo: 'Salesforce',
    color: 'border-blue-500 bg-blue-50 text-blue-700',
    apiKey: '00D50000000I3kM!AR8AQM_mock_salesforce_token',
    connected: true,
    pipelineName: 'B2B Web Outbound',
    defaultStage: 'Qualification'
  },
  gohighlevel: {
    id: 'gohighlevel',
    name: 'GoHighLevel (LeadConnector)',
    logo: 'GoHighLevel',
    color: 'border-emerald-500 bg-emerald-50 text-emerald-700',
    apiKey: 'ghl-live-location-99412-key',
    connected: true,
    pipelineName: 'Automated AI Outreach',
    defaultStage: 'New Lead Discovered'
  },
  zoho: {
    id: 'zoho',
    name: 'Zoho CRM',
    logo: 'Zoho',
    color: 'border-red-500 bg-red-50 text-red-700',
    apiKey: '1000.7d81a938mockzohokey',
    connected: false,
    pipelineName: 'Standard Sales Pipeline',
    defaultStage: 'Attempted to Contact'
  },
  pipedrive: {
    id: 'pipedrive',
    name: 'Pipedrive',
    logo: 'Pipedrive',
    color: 'border-slate-700 bg-slate-100 text-slate-800',
    apiKey: 'pipedrive_api_token_8832',
    connected: true,
    pipelineName: 'Agency Web Deals',
    defaultStage: 'Idea Qualified'
  }
};

export class CrmService {
  private static syncHistory: CrmSyncResult[] = [];

  static getConfigs(): Record<SupportedCrm, CrmConfig> {
    return defaultCrmConfigs;
  }

  static async testConnection(crmId: SupportedCrm, apiKey?: string): Promise<{ success: boolean; message: string }> {
    await new Promise((r) => setTimeout(r, 600));
    if (defaultCrmConfigs[crmId]) {
      defaultCrmConfigs[crmId].connected = true;
      if (apiKey) defaultCrmConfigs[crmId].apiKey = apiKey;
    }
    return {
      success: true,
      message: `Connection test to ${defaultCrmConfigs[crmId]?.name || crmId} passed. API key validated & OAuth token active.`
    };
  }

  static async syncLeads(
    crmId: SupportedCrm,
    leads: BusinessLead[],
    options?: { pipelineName?: string; stage?: string }
  ): Promise<CrmSyncResult> {
    const config = defaultCrmConfigs[crmId];
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    const transactionId = `tx_${crmId}_${Date.now()}`;

    // Simulate API delay
    await new Promise((r) => setTimeout(r, 1000));

    // Calculate pipeline value
    const totalEstValue = leads.length * 2500; // Est $2.5k avg agency project deal value

    const logs: string[] = [
      `[${timestamp}] Initiating batch sync of ${leads.length} leads to ${config.name}...`,
      `[${timestamp}] Authenticating via API token (${config.apiKey?.substring(0, 8)}...)...`,
      `[${timestamp}] Target Pipeline: "${options?.pipelineName || config.pipelineName}" | Stage: "${options?.stage || config.defaultStage}"`,
      `[${timestamp}] Mapping company profiles, owner contacts, HR contacts, & audit scores...`
    ];

    leads.forEach((l, idx) => {
      logs.push(
        `[${timestamp}] -> Created Contact & Deal: "${l.name}" (${l.city}) | Opp Score: ${l.opportunityScore}% | Flaw: ${l.websiteStatus}`
      );
    });

    logs.push(`[${timestamp}] Sync batch completed successfully. 200 OK received from ${config.name} endpoint.`);

    const result: CrmSyncResult = {
      crmId,
      crmName: config.name,
      timestamp: new Date().toISOString(),
      status: 'SUCCESS',
      syncedCount: leads.length,
      dealsCreated: leads.length,
      contactsCreated: leads.length,
      totalEstimatedPipelineValue: `$${(totalEstValue).toLocaleString()} USD`,
      webhookResponse: {
        statusCode: 200,
        transactionId,
        payloadSummary: `Batch payload delivered to ${config.name} API. ${leads.length} contacts, ${leads.length} deal cards created.`
      },
      logs
    };

    this.syncHistory.unshift(result);
    return result;
  }

  static getSyncHistory(): CrmSyncResult[] {
    return this.syncHistory;
  }
}
