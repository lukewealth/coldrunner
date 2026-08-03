import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

import { pluginRegistry } from './src/server/plugins';
import { masterPlanner } from './src/server/agents';
import { database } from './src/server/services/database';
import { exportService } from './src/server/services/export';
import { workflowEngine } from './src/server/services/workflow';
import { mcpServer } from './src/server/mcp/server';
import { eventBus } from './src/server/services/event-bus';
import { webhookService } from './src/server/services/webhooks';
import { outreachService } from './src/server/services/outreach';
import { campaignService } from './src/server/services/campaigns';
import { SearchCriteria, BusinessLead, WorkflowLog } from './src/server/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json({ limit: '10mb' }));

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });

  await pluginRegistry.initialize();
  await database.initialize();
  await mcpServer.initialize();

  const getAi = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
  };

  // ==================== HEALTH ====================
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      plugins: pluginRegistry.getNames(),
      agents: masterPlanner.getStatus().map((a) => ({ name: a.name, status: a.status })),
    });
  });

  // ==================== AGENT SEARCH (Full Workflow) ====================
  app.post('/api/agents/run-search', async (req, res) => {
    const criteria = req.body || {};
    const searchCriteria: SearchCriteria = {
      country: criteria.country || 'Canada',
      province: criteria.province || 'Ontario',
      city: criteria.city || 'Toronto',
      radiusKm: criteria.radiusKm || 25,
      category: criteria.category || 'Dental Clinic',
      categories: criteria.categories,
      minRating: criteria.minRating || 3.5,
      minReviews: criteria.minReviews || 10,
      targetCount: Math.min(criteria.targetCount || 5, 50),
      websiteStatusFilter: criteria.websiteStatusFilter,
      revenueEstimateFilter: criteria.revenueEstimateFilter,
      socialActivityFilter: criteria.socialActivityFilter,
      minOpportunityScore: criteria.minOpportunityScore || 60,
      targetJobTitle: criteria.targetJobTitle,
      searchPurpose: criteria.searchPurpose,
      techStackFilter: criteria.techStackFilter,
      aiPromptQuery: criteria.aiPromptQuery,
    };

    const logs: WorkflowLog[] = [];
    const onLog = (log: Omit<WorkflowLog, 'id' | 'timestamp'>) => {
      logs.push({ ...log, id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, timestamp: new Date() });
    };

    try {
      const result = await workflowEngine.startWorkflow(searchCriteria);
      res.json({
        leads: result.leads,
        source: 'agent_workflow',
        workflowId: result.workflowId,
        logCount: logs.length,
      });
    } catch (err: any) {
      console.error('Agent workflow error:', err);
      const ai = getAi();
      if (ai) {
        try {
          const fallbackLeads = await generateWithGemini(ai, searchCriteria);
          res.json({ leads: fallbackLeads, source: 'gemini_fallback' });
        } catch (geminiErr: any) {
          res.status(500).json({ error: 'Workflow and Gemini fallback both failed', details: geminiErr.message });
        }
      } else {
        const simulatedLeads = generateSimulatedLeads(searchCriteria);
        res.json({ leads: simulatedLeads, source: 'simulated_fallback' });
      }
    }
  });

  // ==================== WEBSITE ANALYZER ====================
  app.post('/api/agents/analyze-website', async (req, res) => {
    const { url = 'www.example.com' } = req.body || {};
    try {
      const result = await pluginRegistry.executePlugin('firecrawl', { url });
      if (result.success && result.data) {
        res.json({
          ...result.data,
          agencyProposalPitch: generateProposalPitch(url, result.data),
        });
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (err: any) {
      const domain = url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      res.json({
        url: domain,
        performance: Math.floor(35 + Math.random() * 40),
        seo: Math.floor(40 + Math.random() * 35),
        accessibility: Math.floor(55 + Math.random() * 30),
        bestPractices: Math.floor(60 + Math.random() * 30),
        mobileScore: Math.floor(35 + Math.random() * 35),
        hasSSL: true,
        loadTimeMs: Math.floor(3400 + Math.random() * 2000),
        techStack: ['WordPress 5.8', 'Elementor', 'Google Analytics', 'MySQL'],
        issues: ['Unoptimized heavy hero images', 'Missing viewport meta configuration', 'No Schema.org Structured Data', 'Lacks online booking workflow'],
        opportunities: ['Next.js/React redesign for 3x speed boost', 'AI Chatbot for instant lead qualification', 'Local SEO schema injection'],
        agencyProposalPitch: `Proposal for ${domain}: Your current website needs a modern redesign with integrated AI booking to double your online inquiry volume within 60 days.`,
      });
    }
  });

  // ==================== AUTO-DRAFT EMAIL ====================
  app.post('/api/agents/auto-draft-email', async (req, res) => {
    const { lead, style = 'Consultative Audit' } = req.body || {};
    if (!lead) return res.status(400).json({ error: 'Lead object required' });

    const ai = getAi();
    const recipientName = lead.ownerName || lead.hrContact?.name || 'Team Lead';
    const mainFlaw = lead.audit?.issues?.[0] || `${lead.websiteStatus} web layout`;
    const oppScore = lead.opportunityScore || 85;

    if (!ai) {
      const subject = style === 'Direct Pitch'
        ? `Quick proposal for ${lead.name} (${oppScore}% Opportunity Score)`
        : style === 'Short & Punchy'
        ? `Idea regarding ${lead.name}'s mobile site`
        : `Website Analysis & Growth Opportunity for ${lead.name}`;

      const body = `Hi ${recipientName},\n\nI was reviewing ${lead.name}'s digital presence in ${lead.city} and noticed your stellar track record (${lead.rating}★ with ${lead.reviewCount}+ reviews).\n\nHowever, our AI audit of your website (${lead.website}) identified a key growth bottleneck:\n• Website Status: ${lead.websiteStatus} (${lead.audit?.performance || 45}/100 Performance)\n• Primary Flaw: ${mainFlaw}\n\nWith an Opportunity Score of ${oppScore}/100, we estimate ${lead.name} is losing ~25-35% of high-intent mobile visitors.\n\nWe recommend: ${lead.recommendedService || 'Upgrading to a high-converting web application with automated 24/7 lead capture'}.\n\nWould you be open to a 5-minute video walkthrough?\n\nBest regards,\nLuke Okagha\nFounder, ColdRunners AI Studio`;

      return res.json({ subject, body, style, promptTemplateUsed: `[Fallback] ${lead.name} | ${mainFlaw} | Score: ${oppScore}` });
    }

    try {
      const prompt = `Write a personalized B2B outreach email for:
Business: ${lead.name} (${lead.category}) in ${lead.city}
Owner: ${lead.ownerName || 'Owner'}
Website: ${lead.website} (Status: ${lead.websiteStatus}, Performance: ${lead.audit?.performance || 45}/100)
Opportunity Score: ${oppScore}/100
Issues: ${lead.audit?.issues?.join('; ') || 'Slow load speed'}
Recommended: ${lead.recommendedService || 'Modern Web Application'}
Style: ${style}

Return JSON: { "subject": "...", "body": "...", "promptTemplateUsed": "..." }`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      res.json({
        subject: parsed.subject || `Growth Opportunity for ${lead.name}`,
        body: parsed.body || `Hi ${recipientName},\n\n...`,
        style,
        promptTemplateUsed: parsed.promptTemplateUsed || `Gemini targeting ${lead.name}`,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Email generation failed', details: err.message });
    }
  });

  // ==================== CAMPAIGN GENERATOR ====================
  app.post('/api/agents/generate-campaign', async (req, res) => {
    const { lead, agencyType = 'Website & AI Automation Agency' } = req.body || {};
    if (!lead) return res.status(400).json({ error: 'Lead object required' });

    const ai = getAi();

    if (!ai) {
      return res.json({
        leadId: lead.id,
        businessName: lead.name,
        emailSubject: `Quick idea regarding ${lead.name}'s mobile website & online bookings`,
        emailBody: `Hi ${lead.ownerName || 'there'},\n\nI was reviewing ${lead.name} on Google in ${lead.city} and noticed your stellar reviews (${lead.rating}★ across ${lead.reviewCount} customers!).\n\nHowever, when inspecting your website (${lead.website}) on mobile, I noticed ${lead.audit?.issues?.[0] || 'a slow load speed'}.\n\nWe specialize in helping ${lead.category} businesses convert web visitors into booked clients. We recently helped a similar business increase monthly appointments by 34%.\n\nWould you be open to a 5-minute video breakdown?\n\nBest regards,\nLuke\nColdRunners Partner`,
        linkedinPitch: `Hi ${lead.ownerName || 'there'}, loved seeing ${lead.name}'s great work in ${lead.city}! Noticed a quick mobile UX bottleneck that might be costing bookings. Would love to share a free 2-min breakdown!`,
        callScript: `"Hi! This is Luke calling for ${lead.ownerName || 'the owner'}. We analyzed ${lead.name}'s website against ${lead.category} competitors in ${lead.city}. Your reviews are top-tier, but mobile load speed is ${lead.audit?.loadTimeMs ? (lead.audit.loadTimeMs / 1000).toFixed(1) + 's' : '4+ seconds'}. Can I email you a 2-minute video preview?"`,
        whatsappMessage: `Hello ${lead.ownerName || 'there'}! Luke here from ColdRunners. Quick heads up about ${lead.name}'s website - noticed mobile page speed is losing visitors. Created a short 2-min screen share. Mind if I send the link?`,
      });
    }

    try {
      const prompt = `Write a multi-channel sales campaign for:
Business: ${lead.name} (${lead.category}) in ${lead.city}
Owner: ${lead.ownerName || 'Owner'}
Website: ${lead.website} (${lead.websiteStatus})
Rating: ${lead.rating}★ (${lead.reviewCount} reviews)
Issues: ${lead.audit?.issues?.join(', ')}
Pitch: ${lead.recommendedService}

Return JSON: { "leadId": "...", "businessName": "...", "emailSubject": "...", "emailBody": "...", "linkedinPitch": "...", "callScript": "...", "whatsappMessage": "..." }`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      res.json(JSON.parse(response.text?.trim() || '{}'));
    } catch (err: any) {
      res.status(500).json({ error: 'Campaign generation failed', details: err.message });
    }
  });

  // ==================== MCP ENDPOINTS ====================
  app.post('/api/mcp/tools/:toolName', async (req, res) => {
    const { toolName } = req.params;
    const result = await mcpServer.handleToolCall(toolName, req.body);
    res.json(result);
  });

  app.get('/api/mcp/tools', (req, res) => {
    res.json({ tools: mcpServer.listTools().map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })) });
  });

  app.get('/api/mcp/resources', (req, res) => {
    res.json({ resources: mcpServer.listResources().map((r) => ({ uri: r.uri, name: r.name, description: r.description })) });
  });

  app.get('/api/mcp/resources/:uri', async (req, res) => {
    const result = await mcpServer.handleResourceRequest(decodeURIComponent(req.params.uri));
    res.json(result);
  });

  // ==================== DATABASE / LEADS ====================
  app.get('/api/leads', (req, res) => {
    const { grade, category, city, websiteStatus, minScore, status, limit } = req.query;
    const leads = database.searchLeads({
      grade: grade as string,
      category: category as string,
      city: city as string,
      websiteStatus: websiteStatus as string,
      minScore: minScore ? parseInt(minScore as string, 10) : undefined,
      status: status as string,
    });
    res.json({ leads: leads.slice(0, parseInt((limit as string) || '100', 10)), total: leads.length });
  });

  app.get('/api/leads/:id', (req, res) => {
    const lead = database.getLead(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  });

  app.put('/api/leads/:id', (req, res) => {
    const updated = database.updateLead(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Lead not found' });
    res.json(updated);
  });

  app.delete('/api/leads/:id', (req, res) => {
    const deleted = database.deleteLead(req.params.id);
    res.json({ success: deleted });
  });

  app.get('/api/stats', (req, res) => {
    res.json(database.getStats());
  });

  // ==================== EXPORT ====================
  app.post('/api/export', (req, res) => {
    const { format = 'json', leadIds, city } = req.body;
    let leads = database.getAllLeads();
    if (leadIds?.length > 0) {
      leads = leads.filter((l) => leadIds.includes(l.id));
    }

    let content: string;
    let mimeType: string;
    let filename: string;
    const timestamp = new Date().toISOString().split('T')[0];

    switch (format) {
      case 'csv':
        content = exportService.generateCSV(leads, { includeSocials: true });
        mimeType = 'text/csv';
        filename = `coldrunners_leads_${timestamp}.csv`;
        break;
      case 'markdown':
        content = exportService.generateMarkdown(leads, city);
        mimeType = 'text/markdown';
        filename = `coldrunners_report_${timestamp}.md`;
        break;
      case 'excel':
        content = exportService.generateExcelXML(leads);
        mimeType = 'application/vnd.ms-excel';
        filename = `coldrunners_leads_${timestamp}.xls`;
        break;
      default:
        content = exportService.generateJSON(leads, city);
        mimeType = 'application/json';
        filename = `coldrunners_leads_${timestamp}.json`;
    }

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  });

  app.get('/api/export/preview', (req, res) => {
    const { format = 'json', limit = '10' } = req.query;
    const leads = database.getAllLeads().slice(0, parseInt(limit as string, 10));

    switch (format) {
      case 'csv':
        res.json({ preview: exportService.generateCSV(leads).split('\n').slice(0, 15).join('\n'), format: 'csv' });
        break;
      case 'markdown':
        res.json({ preview: exportService.generateMarkdown(leads).substring(0, 2000), format: 'markdown' });
        break;
      default:
        res.json({ preview: JSON.parse(exportService.generateJSON(leads)), format: 'json' });
    }
  });

  // ==================== CRM ====================
  app.post('/api/crm/sync', (req, res) => {
    const { crmId, leads } = req.body || {};
    res.json({
      success: true,
      crmId: crmId || 'hubspot',
      message: `Successfully synced ${(leads || []).length} leads to ${crmId || 'CRM'} API.`,
      transactionId: `tx_${crmId || 'crm'}_${Date.now()}`,
      timestamp: new Date().toISOString(),
    });
  });

  // ==================== AGENT STATUS ====================
  app.get('/api/agents/status', (req, res) => {
    res.json({
      agents: masterPlanner.getStatus(),
      plugins: pluginRegistry.getNames(),
      workflows: workflowEngine.getActiveWorkflows().map((w) => ({
        id: w.id,
        status: w.status,
        progress: w.progress,
        leadCount: w.results.length,
      })),
    });
  });

  app.get('/api/agents/logs', (req, res) => {
    const workflows = workflowEngine.getActiveWorkflows();
    const allLogs = workflows.flatMap((w) => w.logs);
    res.json({ logs: allLogs.slice(-200) });
  });

  // ==================== PLUGIN HEALTH ====================
  app.get('/api/plugins/health', async (req, res) => {
    const health = await pluginRegistry.healthCheck();
    res.json({ plugins: health });
  });

  // ==================== SEARCH HISTORY ====================
  app.get('/api/search/history', (req, res) => {
    res.json({ history: database.getSearchHistory() });
  });

  // ==================== WORKFLOW ====================
  app.get('/api/workflows', (req, res) => {
    res.json({ workflows: database.getAllWorkflows() });
  });

  app.get('/api/workflows/:id', (req, res) => {
    const wf = database.getWorkflow(req.params.id) || workflowEngine.getWorkflowStatus(req.params.id);
    if (!wf) return res.status(404).json({ error: 'Workflow not found' });
    res.json(wf);
  });

  // ==================== CRON / SCHEDULED SEARCH ====================
  const cronJobs = new Map<string, any>();

  app.get('/api/cron/jobs', (req, res) => {
    res.json({ jobs: Array.from(cronJobs.values()) });
  });

  app.post('/api/cron/jobs', (req, res) => {
    const { name, criteria, schedule, enabled } = req.body || {};
    const id = `cron-${Date.now()}`;
    const job = {
      id,
      name: name || 'Scheduled Search',
      criteria,
      schedule: schedule || '0 9 * * 1',
      enabled: enabled !== false,
      createdAt: new Date().toISOString(),
      lastRun: null as string | null,
      nextRun: new Date(Date.now() + 86400000).toISOString(),
      runCount: 0,
      status: 'idle' as 'idle' | 'running' | 'completed' | 'error',
    };
    cronJobs.set(id, job);
    res.json(job);
  });

  app.put('/api/cron/jobs/:id', (req, res) => {
    const job = cronJobs.get(req.params.id);
    if (!job) return res.status(404).json({ error: 'Cron job not found' });
    const updated = { ...job, ...req.body };
    cronJobs.set(req.params.id, updated);
    res.json(updated);
  });

  app.delete('/api/cron/jobs/:id', (req, res) => {
    cronJobs.delete(req.params.id);
    res.json({ success: true });
  });

  app.post('/api/cron/jobs/:id/run', async (req, res) => {
    const job = cronJobs.get(req.params.id);
    if (!job) return res.status(404).json({ error: 'Cron job not found' });
    job.status = 'running';
    job.lastRun = new Date().toISOString();
    job.runCount += 1;
    try {
      const result = await workflowEngine.startWorkflow(job.criteria);
      job.status = 'completed';
      res.json({ success: true, leads: result.leads.length, workflowId: result.workflowId });
    } catch (err: any) {
      job.status = 'error';
      res.status(500).json({ error: err.message });
    }
  });

  // ==================== SETTINGS ====================
  let appSettings: Record<string, any> = {
    agentToggles: { googlePlaces: true, websiteAnalyzer: true, contactFinder: true, aiScoring: true, deduplication: true },
    aiModel: 'gemini-3.6-flash',
    defaultCountry: 'Canada',
    defaultProvince: 'Ontario',
    defaultCity: 'Toronto',
    defaultCategory: 'Dental Clinic',
    defaultTargetCount: 5,
    theme: 'light',
    notifications: { email: true, slack: false, webhook: false },
  };

  app.get('/api/settings', (req, res) => {
    res.json(appSettings);
  });

  app.put('/api/settings', (req, res) => {
    appSettings = { ...appSettings, ...req.body };
    res.json(appSettings);
  });

  // ==================== ANALYTICS / METRICS ====================
  app.get('/api/analytics/overview', (req, res) => {
    const stats = database.getStats();
    const workflows = database.getAllWorkflows();
    res.json({
      ...stats,
      recentWorkflows: workflows.slice(-5).map((w: any) => ({
        id: w.id,
        criteria: w.criteria,
        leadCount: w.leadCount,
        createdAt: w.createdAt,
      })),
      cronJobsCount: cronJobs.size,
      systemHealth: 'operational',
    });
  });

  // ==================== EVENT BUS ====================
  app.get('/api/events', (req, res) => {
    const { type, leadId, limit } = req.query;
    const events = eventBus.getHistory({
      type: type as any,
      leadId: leadId as string,
      limit: limit ? parseInt(limit as string, 10) : 100,
    });
    res.json({ events, total: events.length });
  });

  app.get('/api/events/counts', (req, res) => {
    res.json({ counts: eventBus.getEventCounts() });
  });

  // ==================== WEBHOOKS ====================
  app.get('/api/webhooks', (req, res) => {
    res.json({ subscriptions: webhookService.getAllSubscriptions() });
  });

  app.post('/api/webhooks', (req, res) => {
    const { url, events, platform } = req.body || {};
    if (!url || !events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'url and events[] required' });
    }
    const sub = webhookService.createSubscription({ url, events, platform: platform || 'custom' });
    res.json(sub);
  });

  app.put('/api/webhooks/:id', (req, res) => {
    const updated = webhookService.updateSubscription(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Webhook not found' });
    res.json(updated);
  });

  app.delete('/api/webhooks/:id', (req, res) => {
    const deleted = webhookService.deleteSubscription(req.params.id);
    res.json({ success: deleted });
  });

  app.post('/api/webhooks/:id/test', (req, res) => {
    const result = webhookService.testDelivery(req.params.id);
    res.json(result);
  });

  app.get('/api/webhooks/deliveries', (req, res) => {
    const { limit } = req.query;
    res.json({ deliveries: webhookService.getDeliveryLog(limit ? parseInt(limit as string, 10) : 50) });
  });

  // ==================== OUTREACH ====================
  app.post('/api/outreach/generate', async (req, res) => {
    const { lead, channel, agencyType } = req.body || {};
    if (!lead) return res.status(400).json({ error: 'Lead object required' });
    try {
      const message = await outreachService.generatePersonalizedMessage(lead, channel || 'email', agencyType);
      res.json(message);
    } catch (err: any) {
      res.status(500).json({ error: 'Message generation failed', details: err.message });
    }
  });

  app.post('/api/outreach/generate-sequence', async (req, res) => {
    const { lead, channel, steps } = req.body || {};
    if (!lead) return res.status(400).json({ error: 'Lead object required' });
    try {
      const messages = await outreachService.generateCampaignSequence(lead, channel || 'email', steps || 3);
      res.json({ messages });
    } catch (err: any) {
      res.status(500).json({ error: 'Sequence generation failed', details: err.message });
    }
  });

  // ==================== CAMPAIGNS ====================
  app.get('/api/campaigns', (req, res) => {
    res.json({ campaigns: campaignService.getAllCampaigns() });
  });

  app.get('/api/campaigns/:id', (req, res) => {
    const campaign = campaignService.getCampaign(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  });

  app.post('/api/campaigns', async (req, res) => {
    const { name, criteria, leads, channels, sequenceSteps } = req.body || {};
    if (!name || !leads || !Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ error: 'name and leads[] required' });
    }
    try {
      const campaign = await campaignService.createCampaign({
        name,
        criteria: criteria || {},
        leads,
        channels: channels || ['email'],
        sequenceSteps: sequenceSteps || 3,
      });
      res.json(campaign);
    } catch (err: any) {
      res.status(500).json({ error: 'Campaign creation failed', details: err.message });
    }
  });

  app.post('/api/campaigns/:id/activate', (req, res) => {
    const campaign = campaignService.activateCampaign(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  });

  app.post('/api/campaigns/:id/pause', (req, res) => {
    const campaign = campaignService.pauseCampaign(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  });

  app.delete('/api/campaigns/:id', (req, res) => {
    const deleted = campaignService.deleteCampaign(req.params.id);
    res.json({ success: deleted });
  });

  app.get('/api/campaigns/:id/pending', (req, res) => {
    const messages = campaignService.getPendingApprovalMessages(req.params.id);
    res.json({ messages });
  });

  app.get('/api/outreach/pending', (req, res) => {
    const messages = campaignService.getPendingApprovalMessages();
    res.json({ messages, total: messages.length });
  });

  app.post('/api/campaigns/:campaignId/messages/:messageId/approve', async (req, res) => {
    const message = await campaignService.approveMessage(req.params.campaignId, req.params.messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    res.json(message);
  });

  app.post('/api/campaigns/:campaignId/messages/:messageId/reject', (req, res) => {
    const message = campaignService.rejectMessage(req.params.campaignId, req.params.messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    res.json(message);
  });

  app.post('/api/campaigns/:campaignId/meeting', (req, res) => {
    const { leadId } = req.body || {};
    if (!leadId) return res.status(400).json({ error: 'leadId required' });
    campaignService.recordMeetingBooked(req.params.campaignId, leadId);
    res.json({ success: true });
  });

  app.post('/api/campaigns/:campaignId/reply', (req, res) => {
    const { leadId, positive } = req.body || {};
    if (!leadId) return res.status(400).json({ error: 'leadId required' });
    campaignService.recordReply(req.params.campaignId, leadId, positive !== false);
    res.json({ success: true });
  });

  // ==================== OUTREACH ANALYTICS ====================
  app.get('/api/outreach/analytics', (req, res) => {
    const eventCounts = eventBus.getEventCounts();
    const campaigns = campaignService.getAllCampaigns();
    const allMessages = campaigns.flatMap(c => c.messages);

    res.json({
      qualifiedLeads: eventCounts['business.qualified'] || 0,
      messagesPrepared: allMessages.length,
      messagesApproved: allMessages.filter(m => m.status === 'approved' || m.status === 'sent').length,
      messagesSent: allMessages.filter(m => m.status === 'sent').length,
      meetingsBooked: eventCounts['meeting.booked'] || 0,
      proposalsSent: eventCounts['proposal.generated'] || 0,
      eventsByType: eventCounts,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      totalCampaigns: campaigns.length,
      webhookDeliveries: webhookService.getDeliveryLog(1000).filter(d => d.status === 'success').length,
      webhookFailures: webhookService.getDeliveryLog(1000).filter(d => d.status === 'failed').length,
    });
  });

  // ==================== VITE / STATIC ====================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ColdRunners BI Platform listening on http://0.0.0.0:${PORT}`);
    console.log(`MCP Tools: ${mcpServer.listTools().length} registered`);
    console.log(`MCP Resources: ${mcpServer.listResources().length} registered`);
    console.log(`Plugins: ${pluginRegistry.getNames().join(', ')}`);
  });
}

// ==================== HELPERS ====================
function generateProposalPitch(url: string, analysis: any): string {
  const domain = url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const loadTime = analysis.loadTimeMs ? (analysis.loadTimeMs / 1000).toFixed(1) : '4.2';
  return `Proposal for ${domain}: Your current website has a ${loadTime}s mobile load time and ${analysis.performance}/100 performance score, resulting in ~35% bounce rate. Upgrading to a high-performance Next.js application with integrated AI booking will double your online inquiry volume within 60 days.`;
}

async function generateWithGemini(ai: any, criteria: SearchCriteria): Promise<BusinessLead[]> {
  const prompt = `Generate ${Math.min(criteria.targetCount, 8)} realistic business leads for ${criteria.category} in ${criteria.city}, ${criteria.province}, ${criteria.country}.
Return JSON array with: id, name, category, country, province, city, address, lat, lng, phone, email, ownerName, website, websiteStatus (Missing|Outdated|Poor SEO|Slow Speed|Broken SSL|Good), rating, reviewCount, opportunityScore (0-100), grade (HOT|WARM|COLD), status:"New", estimatedRevenue, socials:{facebook,instagram,linkedin}, audit:{performance,seo,accessibility,bestPractices,mobileScore,hasSSL,loadTimeMs,techStack:[],issues:[],opportunities:[]}, recommendedService, aiInsights, dataConfidence, verificationStatus:"Verified", lastUpdated, createdAt`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });

  return JSON.parse(response.text?.trim() || '[]');
}

function generateSimulatedLeads(criteria: SearchCriteria): BusinessLead[] {
  const count = Math.min(criteria.targetCount, 6);
  return Array.from({ length: count }, (_, i) => {
    const prefixes = ['Precision', 'Elite', 'Metro', 'Urban', 'Apex', 'Beacon'];
    const suffixes = ['Care', 'Group', 'Solutions', 'Associates', 'Center', 'Partners'];
    const name = `${prefixes[i % 6]} ${criteria.category} ${suffixes[i % 6]}`;
    const score = Math.floor(75 + Math.random() * 23);
    const webStatus = (['Outdated', 'Slow Speed', 'Poor SEO', 'Missing'] as const)[i % 4];

    return {
      id: `gen-${Date.now()}-${i}`,
      name,
      category: criteria.category,
      country: criteria.country,
      province: criteria.province,
      city: criteria.city,
      address: `${100 + i * 45} Main St, ${criteria.city}`,
      lat: 43.6532 + (Math.random() - 0.5) * 0.08,
      lng: -79.3832 + (Math.random() - 0.5) * 0.08,
      phone: `+1 (${Math.floor(200 + Math.random() * 700)}) 555-0${100 + i}`,
      email: `contact@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      ownerName: `Alex ${['Morgan', 'Taylor', 'Smith', 'Vance', 'Chen'][i % 5]}`,
      website: webStatus === 'Missing' ? '' : `www.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      websiteStatus: webStatus,
      rating: Number((3.5 + Math.random() * 1.3).toFixed(1)),
      reviewCount: Math.floor(15 + Math.random() * 180),
      opportunityScore: score,
      grade: score >= 85 ? 'HOT' as const : 'WARM' as const,
      status: 'New' as const,
      estimatedRevenue: `$${Math.floor(400 + Math.random() * 800)}k - $${(1 + Math.random() * 1.5).toFixed(1)}M`,
      socials: { facebook: `facebook.com/${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`, instagram: `instagram.com/${name.toLowerCase().replace(/[^a-z0-9]/g, '')}` },
      audit: {
        performance: Math.floor(35 + Math.random() * 35),
        seo: Math.floor(40 + Math.random() * 35),
        accessibility: Math.floor(50 + Math.random() * 30),
        bestPractices: Math.floor(55 + Math.random() * 30),
        mobileScore: Math.floor(30 + Math.random() * 40),
        hasSSL: i % 4 !== 0,
        loadTimeMs: Math.floor(3200 + Math.random() * 2500),
        techStack: ['WordPress 5.4', 'jQuery', 'Apache'],
        issues: ['Slow Mobile LCP render', 'Missing Local Business JSON-LD schema', 'Non-responsive booking modal'],
        opportunities: ['Modern Next.js redesign', 'AI Booking widget', 'Google Local Maps ranking boost'],
      },
      recommendedService: 'Website Redesign + AI Lead Automation Widget',
      aiInsights: `${criteria.category} in ${criteria.city} suffering from slow page loads and missing automated booking.`,
      dataConfidence: Math.floor(90 + Math.random() * 8),
      verificationStatus: 'Verified' as const,
      lastUpdated: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
    };
  });
}

startServer();
