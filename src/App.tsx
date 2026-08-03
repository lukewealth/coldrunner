import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { SearchWizardView } from './components/SearchWizardView';
import { BusinessExplorerView } from './components/BusinessExplorerView';
import { BusinessDetailModal } from './components/BusinessDetailModal';
import { WebsiteAnalyzerView } from './components/WebsiteAnalyzerView';
import { LeadIntelligenceView } from './components/LeadIntelligenceView';
import { CampaignBuilderView } from './components/CampaignBuilderView';
import { ReportsView } from './components/ReportsView';
import { ExportCenterView } from './components/ExportCenterView';
import { SettingsView } from './components/SettingsView';
import { AgentMemoryView } from './components/AgentMemoryView';
import { TerminalLogsOverlay } from './components/TerminalLogsOverlay';
import { ApprovalQueueView } from './components/ApprovalQueueView';
import { CampaignTrackerView } from './components/CampaignTrackerView';
import { NotificationsPanel } from './components/NotificationsPanel';
import { ToastProvider, useToast } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { PageTransition } from './components/ui/PageTransition';
import { SkeletonDashboard } from './components/ui/Skeleton';
import { INITIAL_LEADS, INITIAL_AGENTS } from './data/mockLeads';
import { INITIAL_TERMINAL_LOGS } from './data/initialLogs';
import { BusinessLead, AgentStatusItem, SearchFilterCriteria, ActiveTab, LeadStatus, TerminalLog } from './types';
import { api } from './services/api';
import { useSSE } from './services/useSSE';

function AppContent() {
  const [leads, setLeads] = useState<BusinessLead[]>(INITIAL_LEADS);
  const [agents, setAgents] = useState<AgentStatusItem[]>(INITIAL_AGENTS);
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>(INITIAL_TERMINAL_LOGS);
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedLead, setSelectedLead] = useState<BusinessLead | null>(null);
  const [isAgentRunning, setIsAgentRunning] = useState<boolean>(false);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState<boolean>(true);
  const [apiHealth, setApiHealth] = useState<'ok' | 'degraded' | 'offline'>('ok');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { addToast } = useToast();

  const { isConnected: sseConnected, on: onSSE } = useSSE();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoadingDashboard(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    api.health()
      .then(() => setApiHealth('ok'))
      .catch(() => setApiHealth('offline'));

    api.getLeads({ limit: '100' })
      .then((data) => {
        if (data.leads && data.leads.length > 0) {
          setLeads(data.leads);
        }
      })
      .catch(() => {});

    api.getAgentsStatus()
      .then((data) => {
        if (data.agents && data.agents.length > 0) {
          setAgents(data.agents);
        }
      })
      .catch(() => {});

    api.getUnreadNotificationCount()
      .then((data) => setUnreadNotifications(data.count))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      api.getUnreadNotificationCount()
        .then((data) => setUnreadNotifications(data.count))
        .catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsub = onSSE('*', (event) => {
      if (event.type === 'notification') {
        setUnreadNotifications((c) => c + 1);
        addToast({
          type: 'info',
          title: event.payload?.title || 'New Notification',
          message: event.payload?.message || '',
        });
      }
    });
    return unsub;
  }, [onSSE, addToast]);

  const handleAddLog = useCallback((log: TerminalLog) => {
    setTerminalLogs((prev) => [...prev, log]);
  }, []);

  const handleClearLogs = useCallback(() => {
    setTerminalLogs([]);
  }, []);

  const handleExecuteSearch = async (criteria: SearchFilterCriteria): Promise<BusinessLead[]> => {
    setIsAgentRunning(true);
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });

    handleAddLog({
      id: `log-${Date.now()}-1`,
      timestamp: timeStr,
      agent: 'Master Planner',
      level: 'info',
      message: `Initiating agent search grid for ${criteria.category} in ${criteria.city}, ${criteria.province}`
    });

    try {
      const data = await api.runSearch(criteria);
      const newLeads: BusinessLead[] = data.leads || [];

      if (newLeads.length > 0) {
        setLeads((prev) => {
          const existingIds = new Set(prev.map((l) => l.id));
          const filteredNew = newLeads.filter((l) => !existingIds.has(l.id));
          return [...filteredNew, ...prev];
        });

        handleAddLog({
          id: `log-${Date.now()}-2`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          agent: 'Google Places Discovery',
          level: 'success',
          message: `Discovered and verified ${newLeads.length} business lead records in ${criteria.city}.`
        });

        addToast({
          type: 'success',
          title: `Discovered ${newLeads.length} leads`,
          message: `Agent search completed for ${criteria.category} in ${criteria.city}`,
        });
      }
      return newLeads;
    } catch (err) {
      console.error('Error running search:', err);
      handleAddLog({
        id: `log-${Date.now()}-err`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        agent: 'Master Planner',
        level: 'error',
        message: 'Failed to communicate with agent service endpoint.'
      });
      addToast({
        type: 'error',
        title: 'Search failed',
        message: 'Could not reach agent service. Check your connection.',
      });
      return [];
    } finally {
      setIsAgentRunning(false);
    }
  };

  const handleQuickSearch = async (params: { country: string; province: string; city: string; category: string; targetCount: number }) => {
    setIsAgentRunning(true);
    try {
      const results = await handleExecuteSearch({
        country: params.country,
        province: params.province,
        city: params.city,
        radiusKm: 25,
        category: params.category,
        minRating: 3.5,
        minReviews: 10,
        targetCount: params.targetCount,
        websiteStatusFilter: 'All Flaws',
        revenueEstimateFilter: 'All Ranges',
        socialActivityFilter: 'All Levels',
        minOpportunityScore: 70
      });

      if (results.length > 0) {
        setSelectedLead(results[0]);
      }
      setActiveTab('explorer');
    } finally {
      setIsAgentRunning(false);
    }
  };

  const handleUpdateLeadStatus = (leadId: string, newStatus: LeadStatus) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
    api.updateLead(leadId, { status: newStatus }).catch(() => {});
  };

  const handleBatchUpdateStatus = (leadIds: string[], newStatus: LeadStatus) => {
    setLeads((prev) =>
      prev.map((l) => (leadIds.includes(l.id) ? { ...l, status: newStatus } : l))
    );
    handleAddLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      agent: 'Team Collaboration Swarm',
      level: 'success',
      message: `Batch updated status for ${leadIds.length} lead(s) to "${newStatus}".`
    });
    addToast({
      type: 'success',
      title: `Updated ${leadIds.length} leads`,
      message: `Status changed to "${newStatus}"`,
    });
  };

  const handleExportSelected = (exportLeads: BusinessLead[]) => {
    setActiveTab('exports');
  };

  const hotLeadsCount = leads.filter((l) => l.grade === 'HOT').length;

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return isLoadingDashboard ? (
          <SkeletonDashboard />
        ) : (
          <DashboardView
            leads={leads}
            agents={agents}
            setActiveTab={setActiveTab}
            setSelectedLead={setSelectedLead}
            onQuickSearch={handleQuickSearch}
            onOpenTerminal={() => setIsTerminalOpen(true)}
          />
        );
      case 'search':
        return (
          <SearchWizardView
            onExecuteSearch={handleExecuteSearch}
            setActiveTab={setActiveTab}
            setSelectedLead={setSelectedLead}
            onOpenTerminal={() => setIsTerminalOpen(true)}
            onAddGlobalLog={handleAddLog}
          />
        );
      case 'explorer':
        return (
          <BusinessExplorerView
            leads={leads}
            setSelectedLead={setSelectedLead}
            setActiveTab={setActiveTab}
            onUpdateLeadStatus={handleUpdateLeadStatus}
            onExportSelected={handleExportSelected}
            onBatchUpdateStatus={handleBatchUpdateStatus}
          />
        );
      case 'analyzer':
        return <WebsiteAnalyzerView />;
      case 'intelligence':
        return <LeadIntelligenceView leads={leads} />;
      case 'campaigns':
        return (
          <CampaignBuilderView
            leads={leads}
            selectedLead={selectedLead}
            setSelectedLead={setSelectedLead}
          />
        );
      case 'reports':
        return <ReportsView leads={leads} />;
      case 'exports':
        return <ExportCenterView leads={leads} />;
      case 'agents-memory':
        return <AgentMemoryView onOpenTerminal={() => setIsTerminalOpen(true)} />;
      case 'outreach':
        return <CampaignTrackerView leads={leads} />;
      case 'approvals':
        return <ApprovalQueueView leads={leads} />;
      case 'settings':
        return <SettingsView />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-emerald-500 selection:text-white pb-20">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalLeadsCount={leads.length}
        hotLeadsCount={hotLeadsCount}
        isAgentRunning={isAgentRunning}
        onToggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
        terminalLogsCount={terminalLogs.length}
        apiHealth={apiHealth}
        notificationCount={unreadNotifications}
        onToggleNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
        sseConnected={sseConnected}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            <PageTransition tabKey={activeTab}>
              {renderActiveView()}
            </PageTransition>
          </AnimatePresence>
        </ErrorBoundary>
      </main>

      <TerminalLogsOverlay
        logs={terminalLogs}
        onClearLogs={handleClearLogs}
        onAddLog={handleAddLog}
        isAgentRunning={isAgentRunning}
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        activeTab={activeTab}
      />

      <NotificationsPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {selectedLead && (
        <BusinessDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          setActiveTab={setActiveTab}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}
