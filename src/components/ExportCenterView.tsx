import React, { useState } from 'react';
import {
  Download,
  FileText,
  Code,
  FileSpreadsheet,
  Send,
  CheckCircle2,
  Sparkles,
  Zap,
  Database,
  Share2,
  RefreshCw,
  Terminal,
  Server,
  Layers,
  BookOpen
} from 'lucide-react';
import { BusinessLead } from '../types';
import { CrmService, SupportedCrm, CrmSyncResult } from '../services/crmService';
import { api } from '../services/api';
import { useToast } from './ui/Toast';

interface ExportCenterViewProps {
  leads: BusinessLead[];
}

export const ExportCenterView: React.FC<ExportCenterViewProps> = ({ leads }) => {
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json' | 'excel' | 'pdf' | 'obsidian'>('csv');
  const [syncingCrm, setSyncingCrm] = useState<SupportedCrm | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<CrmSyncResult | null>(null);
  const [crmConfigs, setCrmConfigs] = useState(CrmService.getConfigs());
  const [testResultMsg, setTestResultMsg] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { addToast } = useToast();

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      if (selectedFormat === 'pdf') {
        const timestampStr = new Date().toISOString().split('T')[0];
        let pdfHtml = `
          <html>
          <head>
            <title>ColdRunners Business Lead Report</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #0f172a; }
              h1 { color: #10b981; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
              .card { border: 1px solid #cbd5e1; padding: 16px; margin-bottom: 16px; border-radius: 12px; }
              .tag { background: #0f172a; color: white; padding: 2px 8px; border-radius: 6px; font-size: 12px; }
              .score { font-weight: bold; color: #059669; }
            </style>
          </head>
          <body>
            <h1>ColdRunners Verified Lead Executive Briefing (${leads.length} Leads)</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
            ${leads.map(l => `
              <div class="card">
                <h2>${l.name} <span class="tag">${l.category}</span></h2>
                <p><strong>Location:</strong> ${l.city}, ${l.province || l.country} | <strong>Phone:</strong> ${l.phone}</p>
                <p><strong>Email:</strong> ${l.email} | <strong>HR Contact:</strong> ${l.hrContact?.name || 'N/A'} (${l.hrContact?.email || 'N/A'})</p>
                <p><strong>Website:</strong> <a href="${l.website}">${l.website}</a> | <strong>Flaw:</strong> ${l.websiteStatus}</p>
                <p><strong>Opportunity Score:</strong> <span class="score">${l.opportunityScore}% (${l.grade})</span> | <strong>Est Revenue:</strong> ${l.estimatedRevenue}</p>
                <p><strong>Recommended Agency Pitch:</strong> ${l.recommendedService}</p>
              </div>
            `).join('')}
          </body>
          </html>
        `;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(pdfHtml);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => printWindow.print(), 500);
        }
        addToast({ type: 'success', title: 'PDF Export', message: 'Report opened in new window' });
      } else if (selectedFormat === 'obsidian') {
        const timestampStr = new Date().toISOString().split('T')[0];
        let md = `---\ntags:\n  - agency-outreach\n  - lead-generation\n  - coldrunners-vault\ndate: ${timestampStr}\ntotal_leads: ${leads.length}\n---\n\n`;
        md += `# ColdRunners Agentic Business Intelligence Vault Notes\n\n`;
        leads.forEach((l) => {
          md += `## [[${l.name}]]\n`;
          md += `- **Opportunity Score**: \`${l.opportunityScore}%\` (${l.grade})\n`;
          md += `- **Primary Flaw**: ${l.websiteStatus}\n`;
          md += `- **Decision Maker / HR**: ${l.ownerName || 'Owner'} | ${l.hrContact?.name || 'HR Lead'} (${l.hrContact?.email || l.email})\n`;
          md += `- **Website**: [${l.website}](${l.website})\n`;
          md += `- **Estimated Revenue Tier**: \`${l.estimatedRevenue}\`\n`;
          md += `- **Recommended Pitch**: ${l.recommendedService}\n\n`;
          md += `### Company Bio & Audit Insight\n`;
          md += `> ${l.companyBio || l.aiInsights}\n\n---\n\n`;
        });
        const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(md);
        const link = document.createElement('a');
        link.setAttribute('href', dataStr);
        link.setAttribute('download', `ColdRunners_Obsidian_Notes_${timestampStr}.md`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast({ type: 'success', title: 'Obsidian Export', message: `${leads.length} notes exported` });
      } else {
        const data = await api.exportData(selectedFormat);
        const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data)], {
          type: selectedFormat === 'csv' ? 'text/csv' : selectedFormat === 'excel' ? 'application/vnd.ms-excel' : 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ColdRunners_Leads_${new Date().toISOString().split('T')[0]}.${selectedFormat === 'excel' ? 'xls' : selectedFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        addToast({ type: 'success', title: `${selectedFormat.toUpperCase()} Exported`, message: `${leads.length} leads exported` });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Export Failed', message: err.message });
    } finally {
      setIsExporting(false);
    }
  };

  const handleTestConnection = async (crmId: SupportedCrm) => {
    setTestResultMsg(`Testing connectivity to ${crmId}...`);
    const res = await CrmService.testConnection(crmId);
    setTestResultMsg(res.message);
    setCrmConfigs({ ...CrmService.getConfigs() });
    setTimeout(() => setTestResultMsg(null), 4000);
  };

  const handleSyncToCrm = async (crmId: SupportedCrm) => {
    setSyncingCrm(crmId);
    try {
      const res = await api.syncCrm(crmId, leads);
      setLastSyncResult({
        crmId,
        crmName: res.crmId || crmId,
        timestamp: new Date().toISOString(),
        status: 'SUCCESS',
        syncedCount: leads.length,
        dealsCreated: leads.length,
        contactsCreated: leads.length,
        totalEstimatedPipelineValue: '$0',
        webhookResponse: {
          statusCode: 200,
          transactionId: res.transactionId || 'N/A',
          payloadSummary: res.message || 'Success'
        },
        logs: [`Synced ${leads.length} leads to ${res.crmId || crmId}`, `Transaction ID: ${res.transactionId || 'N/A'}`, `Status: ${res.message || 'Success'}`]
      });
      addToast({ type: 'success', title: 'CRM Sync Complete', message: `${leads.length} leads pushed to ${crmId}` });
    } catch (err: any) {
      addToast({ type: 'error', title: 'CRM Sync Failed', message: err.message });
    } finally {
      setSyncingCrm(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-600 font-semibold text-xs uppercase tracking-wider">
              <Download className="w-4 h-4" />
              <span>Export & CRM Dispatch Hub</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Export Lead Intelligence & Sync</h1>
            <p className="text-xs text-slate-500">
              Export verified leads to CSV, Excel, PDF, JSON, Obsidian Vault notes, or push directly to CRM pipelines.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-5">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">1. File Export Formats</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedFormat('csv')}
              className={`p-3.5 rounded-2xl border text-left space-y-1 transition-all cursor-pointer ${
                selectedFormat === 'csv' ? 'bg-emerald-50/70 border-emerald-500 ring-1 ring-emerald-500 text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <div className="font-bold text-xs text-slate-900">CSV Spreadsheet</div>
              <p className="text-[10px] text-slate-500">Clean CSV with HR & owner emails</p>
            </button>

            <button
              onClick={() => setSelectedFormat('excel')}
              className={`p-3.5 rounded-2xl border text-left space-y-1 transition-all cursor-pointer ${
                selectedFormat === 'excel' ? 'bg-emerald-50/70 border-emerald-500 ring-1 ring-emerald-500 text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-600" />
              <div className="font-bold text-xs text-slate-900">Excel (.xlsx / .xls)</div>
              <p className="text-[10px] text-slate-500">Multi-sheet format for Excel</p>
            </button>

            <button
              onClick={() => setSelectedFormat('pdf')}
              className={`p-3.5 rounded-2xl border text-left space-y-1 transition-all cursor-pointer ${
                selectedFormat === 'pdf' ? 'bg-emerald-50/70 border-emerald-500 ring-1 ring-emerald-500 text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <FileText className="w-4 h-4 text-red-600" />
              <div className="font-bold text-xs text-slate-900">Printable PDF Report</div>
              <p className="text-[10px] text-slate-500">Formatted executive lead deck</p>
            </button>

            <button
              onClick={() => setSelectedFormat('obsidian')}
              className={`p-3.5 rounded-2xl border text-left space-y-1 transition-all cursor-pointer ${
                selectedFormat === 'obsidian' ? 'bg-emerald-50/70 border-emerald-500 ring-1 ring-emerald-500 text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <BookOpen className="w-4 h-4 text-purple-600" />
              <div className="font-bold text-xs text-slate-900">Obsidian .md Notes</div>
              <p className="text-[10px] text-slate-500">Vault notes with YAML tags</p>
            </button>

            <button
              onClick={() => setSelectedFormat('json')}
              className={`p-3.5 rounded-2xl border text-left space-y-1 transition-all cursor-pointer sm:col-span-2 ${
                selectedFormat === 'json' ? 'bg-emerald-50/70 border-emerald-500 ring-1 ring-emerald-500 text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <Code className="w-4 h-4 text-blue-600" />
              <div className="font-bold text-xs text-slate-900">JSON API Developer Payload</div>
              <p className="text-[10px] text-slate-500">Full audit, social handles, and technical scores payload</p>
            </button>
          </div>

          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md shadow-emerald-200 active:scale-95 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Generate & Export {selectedFormat.toUpperCase()} ({leads.length} Leads)</span>
              </>
            )}
          </button>
        </div>

        <div className="lg:col-span-7 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">2. Direct CRM API Push Hub</span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold">
              5 Connectors Active
            </span>
          </div>

          {testResultMsg && (
            <div className="bg-sky-50 border border-sky-200 text-sky-900 text-xs p-3 rounded-2xl font-medium flex items-center">
              <RefreshCw className="w-4 h-4 text-sky-600 mr-2 animate-spin" />
              {testResultMsg}
            </div>
          )}

          <div className="space-y-3">
            {(Object.keys(crmConfigs) as SupportedCrm[]).map((crmKey) => {
              const config = crmConfigs[crmKey];
              const isSyncingThis = syncingCrm === crmKey;

              return (
                <div key={crmKey} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-xs">{config.name}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                        {config.connected ? 'Connected' : 'Ready'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium mt-1">
                      Target Pipeline: <span className="font-bold text-slate-700">{config.pipelineName}</span> | Stage: "{config.defaultStage}"
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleTestConnection(crmKey)}
                      className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      Test Connection
                    </button>

                    <button
                      disabled={isSyncingThis}
                      onClick={() => handleSyncToCrm(crmKey)}
                      className={`text-white px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center space-x-1.5 shadow-xs ${
                        isSyncingThis ? 'bg-slate-400' : 'bg-slate-900 hover:bg-slate-800'
                      }`}
                    >
                      {isSyncingThis ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Pushing...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Sync ({leads.length})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {lastSyncResult && (
            <div className="mt-4 bg-slate-900 rounded-2xl p-4 text-emerald-300 font-mono text-[11px] space-y-2 border border-slate-800 animate-fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-white border-b border-slate-800 pb-2">
                <span className="flex items-center">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
                  API Webhook Sync Result: {lastSyncResult.crmName}
                </span>
                <span className="bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded text-[10px]">
                  200 OK | {lastSyncResult.totalEstimatedPipelineValue}
                </span>
              </div>

              <div className="space-y-1 max-h-36 overflow-y-auto pt-1">
                {lastSyncResult.logs.map((lg, i) => (
                  <div key={i} className="leading-relaxed">{lg}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
