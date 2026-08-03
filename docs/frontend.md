# Frontend Architecture

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | React | 19.x |
| Build Tool | Vite | 6.x |
| Styling | Tailwind CSS | 4.x |
| Charts | Recharts | 3.x |
| Animation | Motion (Framer Motion) | 12.x |
| Icons | Lucide React | 0.546+ |
| Language | TypeScript | 5.8+ |

## Component Architecture

```
App.tsx (Root)
├── Navbar
│   ├── Logo
│   ├── Tab navigation (10 tabs)
│   ├── Lead counter badges
│   ├── Agent status indicator
│   └── Terminal toggle
│
├── DashboardView
│   ├── Stats cards (total, hot, warm, cold)
│   ├── Agent status grid
│   ├── Quick search widget
│   └── Recent activity feed
│
├── SearchWizardView
│   ├── Step 1: Location (country, province, city)
│   ├── Step 2: Category & filters
│   ├── Step 3: Advanced options
│   ├── Step 4: Review & execute
│   └── Terminal log integration
│
├── BusinessExplorerView
│   ├── Filter bar (grade, category, city, status)
│   ├── Sort controls
│   ├── Bulk action toolbar
│   ├── Lead table with pagination
│   └── Row click → BusinessDetailModal
│
├── BusinessDetailModal
│   ├── Business info header
│   ├── Website audit scores
│   ├── Contact information
│   ├── Social media links
│   ├── Opportunity analysis
│   └── Action buttons (email, campaign, export)
│
├── WebsiteAnalyzerView
│   ├── URL input
│   ├── Performance/SEO/Accessibility scores
│   ├── Tech stack detection
│   ├── Issues & opportunities
│   └── Agency proposal pitch
│
├── LeadIntelligenceView
│   ├── Charts (Recharts)
│   ├── Grade distribution
│   ├── Category breakdown
│   ├── Website status distribution
│   └── Score histogram
│
├── CampaignBuilderView
│   ├── Lead selector
│   ├── Email draft (AI-generated)
│   ├── LinkedIn pitch
│   ├── Call script
│   ├── WhatsApp message
│   └── Style selector (Consultative, Direct, Short)
│
├── ReportsView
│   ├── Report type selector
│   ├── City/region filter
│   ├── Markdown preview
│   └── Download button
│
├── ExportCenterView
│   ├── Format selector (CSV, JSON, Excel, Markdown)
│   ├── Lead selection (all, filtered, specific)
│   ├── Preview pane
│   └── Download trigger
│
├── AgentMemoryView
│   ├── Agent knowledge base
│   ├── Workflow history
│   └── Terminal integration
│
├── SettingsView
│   ├── API key configuration
│   ├── Agent settings
│   ├── Export preferences
│   └── System information
│
└── TerminalLogsOverlay
    ├── Real-time log stream
    ├── Level filter (info, success, warning, error)
    ├── Agent filter
    ├── Clear logs
    └── Auto-scroll
```

## State Management

React `useState` hooks in `App.tsx` — no external state library.

```typescript
const [leads, setLeads] = useState<BusinessLead[]>(INITIAL_LEADS);
const [agents, setAgents] = useState<AgentStatusItem[]>(INITIAL_AGENTS);
const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>(INITIAL_TERMINAL_LOGS);
const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(true);
const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
const [selectedLead, setSelectedLead] = useState<BusinessLead | null>(null);
const [isAgentRunning, setIsAgentRunning] = useState<boolean>(false);
```

## Data Flow

```
User Action → Component Handler → App.tsx Handler → API Call → State Update → Re-render
```

### Search Flow

```
1. User completes SearchWizardView
2. handleExecuteSearch(criteria) called in App.tsx
3. POST /api/agents/run-search with SearchCriteria
4. Response contains leads array
5. setLeads() merges new leads (dedup by ID)
6. Terminal log updated with discovery count
7. Navigate to explorer view
```

### Export Flow

```
1. User selects leads in ExportCenterView
2. POST /api/export with format + leadIds
3. Server returns file content with proper MIME type
4. Browser downloads file
```

## Styling Approach

Tailwind CSS 4 with utility-first classes. No custom CSS files beyond `index.css`.

Key design tokens:
- Background: `bg-[#F8FAFC]`
- Text: `text-slate-900`
- Selection: `selection:bg-emerald-500 selection:text-white`
- Max width: `max-w-7xl mx-auto`
- Padding: `px-4 sm:px-6 lg:px-8`

## Navigation

Tab-based navigation via `ActiveTab` type:

```typescript
type ActiveTab =
  | 'dashboard'
  | 'search'
  | 'explorer'
  | 'analyzer'
  | 'intelligence'
  | 'campaigns'
  | 'reports'
  | 'exports'
  | 'agents-memory'
  | 'settings';
```

## API Integration

All API calls use `fetch()` directly. No axios or other HTTP library.

```typescript
const response = await fetch('/api/agents/run-search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(criteria),
});
const data = await response.json();
```

## Phase 2+ Frontend Migration

### Next.js Migration Path

```
React SPA → Next.js App Router
────────────────────────────────
Vite → Next.js bundler
Client-side routing → App Router (file-based)
useState → Server Components + Client Components
fetch() → Server Actions / Route Handlers
index.css → Global styles in layout.tsx
```

### Component Library

Consider adopting shadcn/ui for consistent, accessible components built on Radix UI + Tailwind CSS.
