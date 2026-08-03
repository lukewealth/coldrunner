import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  Flame, 
  Eye, 
  Send, 
  CheckSquare, 
  Square, 
  Globe, 
  Phone, 
  Mail, 
  MapPin, 
  Download, 
  ChevronDown,
  Sparkles,
  Zap,
  MoreHorizontal,
  Users,
  CheckCircle2,
  X,
  Archive,
  UserCheck,
  Tag,
  Sun,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { BusinessLead, LeadGrade, LeadStatus, ActiveTab } from '../types';
import { HeroStarRating, OpportunityStars, ScoreBadge } from './ui/HeroStar';

interface BusinessExplorerViewProps {
  leads: BusinessLead[];
  setSelectedLead: (lead: BusinessLead) => void;
  setActiveTab: (tab: ActiveTab) => void;
  onUpdateLeadStatus: (leadId: string, newStatus: LeadStatus) => void;
  onExportSelected: (selectedLeads: BusinessLead[]) => void;
  onBatchUpdateStatus?: (leadIds: string[], newStatus: LeadStatus) => void;
}

export const BusinessExplorerView: React.FC<BusinessExplorerViewProps> = ({
  leads,
  setSelectedLead,
  setActiveTab,
  onUpdateLeadStatus,
  onExportSelected,
  onBatchUpdateStatus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<'ALL' | LeadGrade>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedWebsiteStatus, setSelectedWebsiteStatus] = useState<string>('ALL');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [batchActionFeedback, setBatchActionFeedback] = useState<string | null>(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState<string>('Luke (Founder)');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'name' | 'opportunityScore' | 'rating' | 'reviewCount'>('opportunityScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const PAGE_SIZE = 15;

  // Filtered Leads logic
  const filteredLeads = leads.filter((lead) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchLower) ||
      lead.category.toLowerCase().includes(searchLower) ||
      lead.city.toLowerCase().includes(searchLower) ||
      (lead.companyBio && lead.companyBio.toLowerCase().includes(searchLower)) ||
      (lead.hrContact?.name && lead.hrContact.name.toLowerCase().includes(searchLower));
    
    const matchesGrade = selectedGrade === 'ALL' || lead.grade === selectedGrade;
    const matchesCategory = selectedCategory === 'ALL' || lead.category === selectedCategory;
    const matchesWebsite = selectedWebsiteStatus === 'ALL' || lead.websiteStatus === selectedWebsiteStatus;

    return matchesSearch && matchesGrade && matchesCategory && matchesWebsite;
  });

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortField === 'name') return a.name.localeCompare(b.name) * dir;
    return ((a[sortField] as number) - (b[sortField] as number)) * dir;
  });

  const totalPages = Math.max(1, Math.ceil(sortedLeads.length / PAGE_SIZE));
  const paginatedLeads = sortedLeads.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setCurrentPage(1);
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.length === paginatedLeads.length && paginatedLeads.length > 0) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(paginatedLeads.map((l) => l.id));
    }
  };

  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const showFeedback = (msg: string) => {
    setBatchActionFeedback(msg);
    setTimeout(() => setBatchActionFeedback(null), 3500);
  };

  const handleBatchStatusUpdate = (newStatus: LeadStatus) => {
    if (selectedLeadIds.length === 0) return;
    if (onBatchUpdateStatus) {
      onBatchUpdateStatus(selectedLeadIds, newStatus);
    } else {
      selectedLeadIds.forEach((id) => onUpdateLeadStatus(id, newStatus));
    }
    showFeedback(`Updated status of ${selectedLeadIds.length} lead(s) to "${newStatus}"`);
  };

  const handleBatchAssignTeam = () => {
    if (selectedLeadIds.length === 0) return;
    showFeedback(`Assigned ${selectedLeadIds.length} lead(s) to ${selectedTeamMember}`);
  };

  const handleBatchOutreach = () => {
    if (selectedLeadIds.length > 0) {
      const firstSelected = leads.find((l) => selectedLeadIds.includes(l.id));
      if (firstSelected) setSelectedLead(firstSelected);
    }
    setActiveTab('campaigns');
  };

  const handleBatchExport = () => {
    const selected = leads.filter((l) => selectedLeadIds.includes(l.id));
    onExportSelected(selected.length > 0 ? selected : filteredLeads);
  };

  const categories = Array.from(new Set(leads.map((l) => l.category)));

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-600 font-semibold text-xs uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>Business Intelligence Explorer</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Discovered Local Businesses</h1>
          <p className="text-xs text-slate-500">
            Search, filter, multi-select, and inspect verified local business leads with real-time website audits.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleBatchExport}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-all cursor-pointer border border-slate-200"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export ({selectedLeadIds.length > 0 ? selectedLeadIds.length : filteredLeads.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-200 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Discover More</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {batchActionFeedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{batchActionFeedback}</span>
          </div>
          <button onClick={() => setBatchActionFeedback(null)} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Multi-Select Toolbar (when 1 or more items selected) */}
      {selectedLeadIds.length > 0 && (
        <div className="sticky top-4 z-40 bg-slate-900 text-white p-4 rounded-3xl shadow-xl ring-1 ring-slate-800 flex flex-wrap items-center justify-between gap-4 animate-fade-in">
          {/* Left: Count & Select All controls */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-xs text-white">
                {selectedLeadIds.length} {selectedLeadIds.length === 1 ? 'Lead' : 'Leads'} Selected
              </span>
            </div>

            <button
              onClick={toggleSelectAll}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer font-medium"
            >
              {selectedLeadIds.length === filteredLeads.length ? 'Deselect All' : 'Select All Filtered'}
            </button>
          </div>

          {/* Right: Team Collaboration & Batch Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Status Dropdown */}
            <div className="flex items-center space-x-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <span className="text-[10px] font-mono text-slate-400 uppercase px-1 font-bold">Status:</span>
              <button
                onClick={() => handleBatchStatusUpdate('Qualified')}
                className="px-2.5 py-1 bg-slate-700 hover:bg-emerald-600 text-white text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Set Qualified
              </button>
              <button
                onClick={() => handleBatchStatusUpdate('Contacted')}
                className="px-2.5 py-1 bg-slate-700 hover:bg-sky-600 text-white text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Set Contacted
              </button>
              <button
                onClick={() => handleBatchStatusUpdate('Meeting Set')}
                className="px-2.5 py-1 bg-slate-700 hover:bg-purple-600 text-white text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Set Meeting
              </button>
              <button
                onClick={() => handleBatchStatusUpdate('Archived')}
                className="px-2.5 py-1 bg-slate-700 hover:bg-red-600 text-white text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Archive
              </button>
            </div>

            {/* Team Collaboration Assignee */}
            <div className="flex items-center space-x-1.5 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700 text-xs">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <select
                value={selectedTeamMember}
                onChange={(e) => setSelectedTeamMember(e.target.value)}
                className="bg-transparent text-slate-200 text-xs font-medium outline-none cursor-pointer"
              >
                <option value="Luke (Founder)" className="bg-slate-900 text-white">Assign: Luke (Founder)</option>
                <option value="Sarah (SDR)" className="bg-slate-900 text-white">Assign: Sarah (SDR)</option>
                <option value="Alex (AE)" className="bg-slate-900 text-white">Assign: Alex (AE)</option>
                <option value="AI Swarm Worker" className="bg-slate-900 text-white">Assign: AI Swarm Worker</option>
              </select>
              <button
                onClick={handleBatchAssignTeam}
                className="ml-1 bg-sky-500 hover:bg-sky-600 text-white px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer"
              >
                Assign
              </button>
            </div>

            {/* Batch Outreach Button */}
            <button
              onClick={handleBatchOutreach}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 transition-all cursor-pointer shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Outreach</span>
            </button>

            {/* Clear Selection */}
            <button
              onClick={() => setSelectedLeadIds([])}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Clear Selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input (5 cols) */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by business name, city, or service..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium text-xs pl-9 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Grade Filters (3 cols) */}
          <div className="md:col-span-3 flex items-center space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setSelectedGrade('ALL')}
              className={`flex-1 py-1.5 rounded-lg text-center font-semibold transition-all cursor-pointer ${
                selectedGrade === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All ({leads.length})
            </button>
            <button
              onClick={() => setSelectedGrade('HOT')}
              className={`flex-1 py-1.5 rounded-lg text-center font-semibold transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                selectedGrade === 'HOT' ? 'bg-orange-50 text-orange-700 font-bold border border-orange-200' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Hot</span>
            </button>
            <button
              onClick={() => setSelectedGrade('WARM')}
              className={`flex-1 py-1.5 rounded-lg text-center font-semibold transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                selectedGrade === 'WARM' ? 'bg-amber-50 text-amber-700 font-bold border border-amber-200' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Warm</span>
            </button>
          </div>

          {/* Category Dropdown (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium text-xs p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Website Status Dropdown (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={selectedWebsiteStatus}
              onChange={(e) => setSelectedWebsiteStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium text-xs p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Web Flaws</option>
              <option value="Missing">No Website / Parked</option>
              <option value="Outdated">Outdated CMS</option>
              <option value="Slow Speed">Slow Load Speed</option>
              <option value="Broken SSL">Broken SSL</option>
              <option value="Poor SEO">Poor Local SEO</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 w-10">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                    {selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Business & Owner</th>
                <th className="py-3.5 px-4">Rating</th>
                <th className="py-3.5 px-4">Website Flaw</th>
                <th className="py-3.5 px-4">Contact Details</th>
                <th className="py-3.5 px-4">Est. Revenue</th>
                <th className="py-3.5 px-4">AI Score</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {paginatedLeads.map((lead) => {
                const isSelected = selectedLeadIds.includes(lead.id);
                return (
                  <tr key={lead.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-emerald-50/40' : ''}`}>
                    <td className="py-3.5 px-4">
                      <button onClick={() => toggleSelectLead(lead.id)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                        {isSelected ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>

                    {/* Business Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{lead.name}</div>
                      <div className="text-slate-500 text-[11px]">
                        {lead.category} • {lead.city}, {lead.province || lead.country}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {lead.ownerName && (
                          <span className="text-emerald-700 text-[10px] font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60">
                            Owner: {lead.ownerName}
                          </span>
                        )}
                        {lead.hrContact?.name && (
                          <span className="text-sky-700 text-[10px] font-semibold bg-sky-50 px-1.5 py-0.5 rounded-md border border-sky-200/60">
                            HR: {lead.hrContact.name}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="py-3.5 px-4">
                      <HeroStarRating
                        rating={lead.rating}
                        size="xs"
                        color="amber"
                        showValue={true}
                        showCount={true}
                        reviewCount={lead.reviewCount}
                      />
                    </td>

                    {/* Website Flaw */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        {lead.websiteStatus}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[150px]">
                        {lead.website}
                      </div>
                    </td>

                    {/* Contact Details */}
                    <td className="py-3.5 px-4 text-[11px] space-y-0.5 font-medium">
                      <div className="text-slate-700 flex items-center">
                        <Phone className="w-3 h-3 mr-1 text-slate-400" />
                        {lead.phone}
                      </div>
                      <div className="text-slate-500 flex items-center truncate max-w-[160px]">
                        <Mail className="w-3 h-3 mr-1 text-slate-400" />
                        {lead.email}
                      </div>
                    </td>

                    {/* Revenue */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {lead.estimatedRevenue}
                    </td>

                    {/* Opportunity Score */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5">
                        <OpportunityStars score={lead.opportunityScore} size="xs" />
                        <ScoreBadge score={lead.opportunityScore} size="sm" />
                      </div>
                    </td>

                    {/* Lead Status dropdown */}
                    <td className="py-3.5 px-4">
                      <select
                        value={lead.status}
                        onChange={(e) => onUpdateLeadStatus(lead.id, e.target.value as LeadStatus)}
                        className="bg-slate-50 border border-slate-200 text-slate-900 text-[11px] font-semibold px-2.5 py-1 rounded-xl outline-none"
                      >
                        <option value="New">New</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Meeting Set">Meeting Set</option>
                        <option value="Converted">Converted</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => {
                          setSelectedLead(lead);
                          setActiveTab('campaigns');
                        }}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] shadow-xs transition-all cursor-pointer"
                      >
                        Outreach
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLeads.length === 0 && (
          <div className="text-center py-16 text-slate-400 text-xs">
            No businesses match your current filters. Try relaxing search criteria.
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-slate-500">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, sortedLeads.length)} of {sortedLeads.length} leads
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    currentPage === page
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
