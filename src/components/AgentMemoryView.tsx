import React, { useState } from 'react';
import { 
  Cpu, 
  Database, 
  Brain, 
  Terminal, 
  CheckCircle2, 
  Sparkles, 
  FileText, 
  Code, 
  RefreshCw, 
  Server, 
  Activity, 
  Zap, 
  Layers, 
  Bot, 
  Share2, 
  ShieldAlert, 
  Download, 
  Copy, 
  Check, 
  BookOpen, 
  Sliders
} from 'lucide-react';

interface SwarmAgentMemory {
  id: string;
  name: string;
  framework: 'OpenClaw' | 'Kimi AI' | 'Claude Code' | 'Harness' | 'Obsidian .md' | 'Cloud Backend Storage';
  status: 'Active' | 'Idle' | 'Syncing' | 'Standby';
  memoryTokens: string;
  activeContext: string;
  skills: string[];
  mcpConnected: boolean;
  lastUpdated: string;
}

export const AgentMemoryView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'memory' | 'mcp' | 'skills' | 'docs'>('memory');
  const [copiedDoc, setCopiedDoc] = useState(false);

  // Initial Agents Memory State
  const [agents, setAgents] = useState<SwarmAgentMemory[]>([
    {
      id: 'agent-1',
      name: 'OpenClaw Prospecting Agent',
      framework: 'OpenClaw',
      status: 'Active',
      memoryTokens: '42.8k / 128k',
      activeContext: 'Parsing Google Places API candidates & verifying SSL/TLS certificates',
      skills: ['google-maps-platform', 'website-auditor', 'firecrawl-headless'],
      mcpConnected: true,
      lastUpdated: '10s ago'
    },
    {
      id: 'agent-2',
      name: 'Kimi Reasoning & Scoring Agent',
      framework: 'Kimi AI',
      status: 'Active',
      memoryTokens: '86.4k / 200k',
      activeContext: 'Calculating agency opportunity score & estimated annual revenue tier',
      skills: ['gemini-api', 'lead-scoring-matrix', 'sector-revenue-benchmarks'],
      mcpConnected: true,
      lastUpdated: '2s ago'
    },
    {
      id: 'agent-3',
      name: 'Claude Code Campaign Writer',
      framework: 'Claude Code',
      status: 'Idle',
      memoryTokens: '18.2k / 200k',
      activeContext: 'Auto-drafting personalized multi-channel outreach sequences',
      skills: ['cold-email-copywriter', 'linkedin-pitch-generator', 'call-scripting'],
      mcpConnected: true,
      lastUpdated: '1m ago'
    },
    {
      id: 'agent-4',
      name: 'Harness Test Runner & Linter',
      framework: 'Harness',
      status: 'Active',
      memoryTokens: '9.1k / 64k',
      activeContext: 'Validating TypeScript compilation & ESM module execution',
      skills: ['lint-applet', 'compile-applet', 'type-checking'],
      mcpConnected: true,
      lastUpdated: '5s ago'
    },
    {
      id: 'agent-5',
      name: 'Obsidian .md Pitch Synthesizer',
      framework: 'Obsidian .md',
      status: 'Standby',
      memoryTokens: '14.5k / 128k',
      activeContext: 'Formatting vault pitch notes with YAML frontmatter tags',
      skills: ['obsidian-frontmatter-builder', 'markdown-export'],
      mcpConnected: true,
      lastUpdated: '3m ago'
    },
    {
      id: 'agent-6',
      name: 'Cloud Backend Storage Agent',
      framework: 'Cloud Backend Storage',
      status: 'Active',
      memoryTokens: '31.0k / 256k',
      activeContext: 'Syncing CRM webhook pipelines to HubSpot & Salesforce',
      skills: ['firebase-integration', 'cloudsql', 'oauth-integration'],
      mcpConnected: true,
      lastUpdated: '1s ago'
    }
  ]);

  const [agentsMdContent, setAgentsMdContent] = useState<string>(`# AGENTS.md — System Memory & Agentic Swarm Instructions

## Overview
ColdRunners AI Business Intelligence Finder operates an autonomous multi-agent swarm connected via Model Context Protocol (MCP) and Gemini 3.6 Flash.

### Active Agent Swarm Ecosystem
- **OpenClaw Agent**: Web crawling, Google Places API extraction, SSL check.
- **Kimi Reasoning**: AI opportunity scoring, revenue estimation, and flaw categorization.
- **Claude Code**: High-converting B2B outreach email auto-drafting and script generation.
- **Harness Test Runner**: Automated type safety, linting, and build verification.
- **Obsidian .md Generator**: Pitch notes formatting with YAML tags (\`#lead\`, \`#cold-outreach\`, \`#hot-opportunity\`).
- **Cloud Backend Storage Agent**: Durable Firestore/Cloud SQL persistence and CRM webhook dispatches.

### Rules & Persistence Guidelines
1. **Zero Mocking on Export**: Always produce valid CSV, JSON, Excel, PDF, and Obsidian markdown payloads.
2. **Direct CRM Sync**: Push leads directly to HubSpot, Salesforce, GoHighLevel, Zoho, and Pipedrive with full deal mapping.
3. **Data Security**: Keep all secret keys server-side in \`server.ts\` and proxy via \`/api/*\` endpoints.`);

  const handleCopyDocs = () => {
    navigator.clipboard.writeText(agentsMdContent);
    setCopiedDoc(true);
    setTimeout(() => setCopiedDoc(false), 2500);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-600 font-semibold text-xs uppercase tracking-wider">
              <Cpu className="w-4 h-4" />
              <span>Agents Memory & Framework Matrix</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Autonomous Agent Swarm Hub</h1>
            <p className="text-xs text-slate-500 max-w-xl">
              Track real-time memory states for OpenClaw, Kimi, Claude Code, Harness, Obsidian .md, and Cloud Backend Agents.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold bg-slate-900 text-white px-3 py-1.5 rounded-xl font-mono flex items-center space-x-1">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>MCP Bridge Active</span>
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('memory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeSubTab === 'memory' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
        >
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span>Agents Memory Matrix ({agents.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('mcp')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeSubTab === 'mcp' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
        >
          <Share2 className="w-4 h-4 text-sky-400" />
          <span>MCP Connectors</span>
        </button>

        <button
          onClick={() => setActiveSubTab('skills')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeSubTab === 'skills' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Loaded Skills</span>
        </button>

        <button
          onClick={() => setActiveSubTab('docs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeSubTab === 'docs' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-purple-400" />
          <span>AGENTS.md Developer Docs</span>
        </button>
      </div>

      {/* SUB-TAB 1: AGENTS MEMORY MATRIX */}
      {activeSubTab === 'memory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
          {agents.map((agent) => (
            <div key={agent.id} className="bg-white rounded-3xl p-5 ring-1 ring-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                    {agent.framework}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                    agent.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    agent.status === 'Syncing' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'Active' ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                    <span>{agent.status}</span>
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-2">{agent.name}</h3>

                <div className="mt-3 bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                    <span>Memory Usage</span>
                    <span className="font-mono text-emerald-700 font-bold">{agent.memoryTokens}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '40%' }} />
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Active Memory Context:</span>
                  <p className="text-xs text-slate-700 font-sans leading-relaxed bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                    "{agent.activeContext}"
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Attached Skills:</span>
                <div className="flex flex-wrap gap-1.5">
                  {agent.skills.map((skill) => (
                    <span key={skill} className="text-[10px] bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded-md border border-slate-200">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-TAB 2: MCP CONNECTORS */}
      {activeSubTab === 'mcp' && (
        <div className="bg-white rounded-3xl p-6 ring-1 ring-slate-200 shadow-xs space-y-6 animate-fade-in">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center">
              <Share2 className="w-5 h-5 text-sky-500 mr-2" />
              Model Context Protocol (MCP) Infrastructure Pipeline
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Active MCP client and server connectors routing contextual memory between AI Studio, Gemini 3.6 Flash, and external CRMs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-slate-900">mcp-gemini-reasoning-server</span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">CONNECTED</span>
              </div>
              <p className="text-xs text-slate-600">Model reasoning tool definitions for opportunity calculation & email copywriting.</p>
              <div className="text-[10px] font-mono text-slate-400">Endpoint: stdio://gemini-3.6-flash-mcp</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-slate-900">mcp-places-crawler-server</span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">CONNECTED</span>
              </div>
              <p className="text-xs text-slate-600">Google Places API, geocoding, and web scraper context handler.</p>
              <div className="text-[10px] font-mono text-slate-400">Endpoint: stdio://places-firecrawl-mcp</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-slate-900">mcp-crm-webhook-hub</span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">CONNECTED</span>
              </div>
              <p className="text-xs text-slate-600">HubSpot, Salesforce, and GoHighLevel payload transformer & pusher.</p>
              <div className="text-[10px] font-mono text-slate-400">Endpoint: http://localhost:3000/api/crm/sync</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-slate-900">mcp-obsidian-note-writer</span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">CONNECTED</span>
              </div>
              <p className="text-xs text-slate-600">Markdown pitch generator formatting vault notes with YAML frontmatter.</p>
              <div className="text-[10px] font-mono text-slate-400">Endpoint: file:///vault/coldrunners-pitch.md</div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: LOADED SKILLS MATRIX */}
      {activeSubTab === 'skills' && (
        <div className="bg-white rounded-3xl p-6 ring-1 ring-slate-200 shadow-xs space-y-6 animate-fade-in">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center">
              <Zap className="w-5 h-5 text-amber-500 mr-2" />
              Active System Skills Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Integrated system skills loaded into the autonomous agent swarm memory context.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'gemini-api', desc: 'Google GenAI SDK integration for lead intelligence & email copywriting', status: 'Active' },
              { name: 'firebase-integration', desc: 'Firestore persistence & Auth integration', status: 'Active' },
              { name: 'cloudsql', desc: 'Relational Cloud SQL PostgreSQL database handling', status: 'Ready' },
              { name: 'google-maps-platform', desc: 'Places API location discovery & geocoding', status: 'Active' },
              { name: 'image-generation', desc: 'Gemini visual asset & mock preview generator', status: 'Active' },
              { name: 'oauth-integration', desc: 'Google Workspace & 3rd party service OAuth flows', status: 'Ready' }
            ].map((skill) => (
              <div key={skill.name} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-xs text-emerald-800">{skill.name}</span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                    {skill.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{skill.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: AGENTS.MD DEVELOPER DOCS */}
      {activeSubTab === 'docs' && (
        <div className="bg-white rounded-3xl p-6 ring-1 ring-slate-200 shadow-xs space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center">
                <FileText className="w-5 h-5 text-purple-600 mr-2" />
                AGENTS.md Developer System Memory
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Persistent agent instructions and architecture guidelines loaded into system prompt context.
              </p>
            </div>

            <button
              onClick={handleCopyDocs}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              {copiedDoc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedDoc ? 'Copied Docs!' : 'Copy AGENTS.md'}</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <textarea
              rows={16}
              value={agentsMdContent}
              onChange={(e) => setAgentsMdContent(e.target.value)}
              className="w-full bg-transparent text-emerald-300 font-mono text-xs leading-relaxed outline-none resize-y"
            />
          </div>
        </div>
      )}
    </div>
  );
};
