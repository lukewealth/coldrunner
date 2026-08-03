import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Send,
  Copy,
  ExternalLink,
  Sparkles,
  Zap,
  Activity,
  Layers,
  Linkedin,
  Instagram,
  Facebook,
  Twitter,
  UserCheck,
  Briefcase,
  RefreshCw,
  Check,
  FileText,
  MessageCircle,
  Share2
} from 'lucide-react';
import { BusinessLead, ActiveTab } from '../types';
import { api } from '../services/api';
import { useToast } from './ui/Toast';

interface BusinessDetailModalProps {
  lead: BusinessLead | null;
  onClose: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  initialTab?: 'audit' | 'overview' | 'pitch' | 'auto-email';
}

export const BusinessDetailModal: React.FC<BusinessDetailModalProps> = ({
  lead,
  onClose,
  setActiveTab,
  initialTab = 'audit'
}) => {
  const [activeTab, setModalTab] = useState<'audit' | 'overview' | 'pitch' | 'auto-email'>(initialTab);

  const [emailStyle, setEmailStyle] = useState<string>('Consultative Audit');
  const [draftSubject, setDraftSubject] = useState<string>('');
  const [draftBody, setDraftBody] = useState<string>('');
  const [promptTemplateUsed, setPromptTemplateUsed] = useState<string>('');
  const [isGeneratingEmail, setIsGeneratingEmail] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showPromptPreview, setShowPromptPreview] = useState<boolean>(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (lead && activeTab === 'auto-email' && !draftBody) {
      handleGenerateDraftEmail(emailStyle);
    }
  }, [lead, activeTab]);

  if (!lead) return null;

  const handleGenerateDraftEmail = async (style: string = emailStyle) => {
    setIsGeneratingEmail(true);
    setCopied(false);
    try {
      const data = await api.draftEmail(lead, style);
      setDraftSubject(data.subject || `Growth Opportunity for ${lead.name}`);
      setDraftBody(data.body || '');
      setPromptTemplateUsed(data.promptTemplateUsed || `Gemini Prompt Template targeting ${lead.name}`);
    } catch (err: any) {
      setDraftSubject(`Quick idea for ${lead.name} (${lead.opportunityScore}% Opp Score)`);
      setDraftBody(
        `Hi ${lead.ownerName || lead.hrContact?.name || 'Team'},\n\nI was looking at ${lead.name}'s digital presence in ${lead.city} and noticed your stellar rating (${lead.rating}★).\n\nHowever, when auditing your website (${lead.website}), we noticed ${lead.audit.issues?.[0] || 'performance bottlenecks'}.\n\nWith an Opportunity Score of ${lead.opportunityScore}/100, upgrading your site could significantly boost mobile conversion.\n\nWould you be open to a 5-minute video walkthrough?\n\nBest regards,\nLuke Okagha`
      );
      setPromptTemplateUsed(`[Fallback Template] Evaluated ${lead.name} | Flaw: ${lead.websiteStatus}`);
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const handleCopyEmail = () => {
    const fullText = `Subject: ${draftSubject}\n\n${draftBody}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const recipientEmail = lead.email || lead.hrContact?.email || '';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl ring-1 ring-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-fade-in">
        <div className="bg-slate-50 p-6 border-b border-slate-200 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 p-2 rounded-full transition-all cursor-pointer border border-slate-200"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pr-10">
            <div className="flex items-start space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xl shadow-xs">
                {lead.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">{lead.name}</h2>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    lead.grade === 'HOT' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {lead.grade} LEAD ({lead.opportunityScore}%)
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {lead.category} • {lead.city}, {lead.province || lead.country}
                </p>
                <p className="text-xs text-slate-600 font-medium mt-0.5 flex items-center">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1" />
                  {lead.address}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setModalTab('auto-email');
                  if (!draftBody) handleGenerateDraftEmail();
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-200 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-white text-white" />
                <span>Auto-Draft Email</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  setActiveTab('campaigns');
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Campaign Hub</span>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-700">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center">
                <Phone className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                {lead.phone}
              </span>
              <span className="flex items-center">
                <Mail className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                {lead.email}
              </span>
              <a
                href={`https://${lead.website}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center text-emerald-600 hover:underline font-mono"
              >
                <Globe className="w-3.5 h-3.5 mr-1" />
                {lead.website}
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>

            <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Socials:</span>
              {lead.socials?.linkedin && (
                <a href={`https://${lead.socials.linkedin}`} target="_blank" rel="noreferrer" className="p-1 text-sky-700 hover:bg-sky-50 rounded-md transition-colors" title={`LinkedIn: ${lead.socials.linkedin}`}>
                  <Linkedin className="w-3.5 h-3.5" />
                </a>
              )}
              {lead.socials?.instagram && (
                <a href={`https://${lead.socials.instagram}`} target="_blank" rel="noreferrer" className="p-1 text-pink-600 hover:bg-pink-50 rounded-md transition-colors" title={`Instagram: ${lead.socials.instagram}`}>
                  <Instagram className="w-3.5 h-3.5" />
                </a>
              )}
              {lead.socials?.facebook && (
                <a href={`https://${lead.socials.facebook}`} target="_blank" rel="noreferrer" className="p-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title={`Facebook: ${lead.socials.facebook}`}>
                  <Facebook className="w-3.5 h-3.5" />
                </a>
              )}
              {lead.socials?.x && (
                <a href={`https://${lead.socials.x}`} target="_blank" rel="noreferrer" className="p-1 text-slate-900 hover:bg-slate-100 rounded-md transition-colors" title={`X.com: ${lead.socials.x}`}>
                  <Twitter className="w-3.5 h-3.5" />
                </a>
              )}
              {lead.socials?.whatsapp && (
                <a href={`https://wa.me/${lead.socials.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors" title={`WhatsApp: ${lead.socials.whatsapp}`}>
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2 flex items-center space-x-2 overflow-x-auto">
          <button
            onClick={() => setModalTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'audit' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Website & Tech Audit
          </button>
          <button
            onClick={() => setModalTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Intelligence & HR Contact
          </button>
          <button
            onClick={() => setModalTab('pitch')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pitch' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            AI Pitch Rationale
          </button>
          <button
            onClick={() => {
              setModalTab('auto-email');
              if (!draftBody) handleGenerateDraftEmail();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
              activeTab === 'auto-email' ? 'bg-emerald-500 text-white shadow-xs' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto-Draft Email</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-700">
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Performance</span>
                  <div className={`text-2xl font-black ${lead.audit.performance < 50 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {lead.audit.performance}/100
                  </div>
                  <span className="text-[10px] text-slate-500">Load: {(lead.audit.loadTimeMs / 1000).toFixed(1)}s</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">SEO Health</span>
                  <div className={`text-2xl font-black ${lead.audit.seo < 60 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {lead.audit.seo}/100
                  </div>
                  <span className="text-[10px] text-slate-500">Local Maps Rank</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Accessibility</span>
                  <div className="text-2xl font-black text-blue-600">
                    {lead.audit.accessibility}/100
                  </div>
                  <span className="text-[10px] text-slate-500">Mobile Friendly</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Security & SSL</span>
                  <div className="text-2xl font-black text-emerald-600 flex items-center justify-center">
                    {lead.audit.hasSSL ? <ShieldCheck className="w-6 h-6 text-emerald-600" /> : <AlertTriangle className="w-6 h-6 text-red-600" />}
                  </div>
                  <span className="text-[10px] text-slate-500">{lead.audit.hasSSL ? 'HTTPS Active' : 'No SSL Warning'}</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                <span className="text-[11px] font-bold uppercase text-slate-500 block">Detected Technology Stack</span>
                <div className="flex flex-wrap gap-2">
                  {lead.audit.techStack.map((tech) => (
                    <span key={tech} className="bg-white border border-slate-200 text-slate-700 px-3 py-1 rounded-lg text-[11px] font-semibold shadow-2xs">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-50 border border-red-200 p-4 rounded-2xl space-y-2">
                  <span className="text-red-700 font-bold text-xs flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1.5" />
                    Detected Bottlenecks & Flaws
                  </span>
                  <ul className="space-y-1.5 text-slate-700 text-xs list-disc list-inside">
                    {lead.audit.issues.map((iss, i) => (
                      <li key={i}>{iss}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-2">
                  <span className="text-emerald-700 font-bold text-xs flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    High-Value Service Opportunities
                  </span>
                  <ul className="space-y-1.5 text-slate-700 text-xs list-disc list-inside">
                    {lead.audit.opportunities.map((opp, i) => (
                      <li key={i}>{opp}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-5">
              {lead.companyBio && (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center space-x-2 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>Company Bio & Overview</span>
                  </div>
                  <p className="text-slate-800 text-xs leading-relaxed font-sans font-medium">
                    {lead.companyBio}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center space-x-2 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Primary Decision Maker</span>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{lead.ownerName || 'Business Owner / Manager'}</div>
                    <div className="text-slate-500 text-xs font-medium">Founder / Managing Partner</div>
                  </div>
                  <div className="pt-2 border-t border-slate-200 space-y-1 text-slate-600 text-xs font-medium">
                    <div className="flex items-center">
                      <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                      <span>{lead.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                      <span>{lead.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-emerald-800 font-bold text-[11px] uppercase tracking-wider">
                      <Briefcase className="w-4 h-4 text-emerald-600" />
                      <span>HR & Hiring Contact</span>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Verified Contact
                    </span>
                  </div>

                  {lead.hrContact ? (
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{lead.hrContact.name}</div>
                      <div className="text-emerald-700 text-xs font-semibold">{lead.hrContact.title || 'Talent & HR Lead'}</div>
                      <div className="pt-2 mt-2 border-t border-emerald-200/80 space-y-1 text-slate-700 text-xs font-medium">
                        <div className="flex items-center">
                          <Mail className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                          <a href={`mailto:${lead.hrContact.email}`} className="hover:underline font-semibold">{lead.hrContact.email}</a>
                        </div>
                        {lead.hrContact.phone && (
                          <div className="flex items-center">
                            <Phone className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                            <span>{lead.hrContact.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-500 text-xs italic py-2">
                      No dedicated HR contact profile detected. Primary contact reaches management directly.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Estimated Annual Revenue</span>
                  <div className="text-xl font-bold text-slate-900">{lead.estimatedRevenue}</div>
                  <p className="text-[11px] text-slate-500">Based on local sector benchmarks and employee count</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Google Reviews Reputation</span>
                  <div className="text-xl font-bold text-emerald-600">★ {lead.rating} ({lead.reviewCount} Reviews)</div>
                  <p className="text-[11px] text-slate-500">High brand reputation ready for web conversion boost</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-semibold uppercase text-slate-400 block">AI Intelligence Summary</span>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">{lead.aiInsights}</p>
              </div>
            </div>
          )}

          {activeTab === 'pitch' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-2">
                <span className="text-emerald-800 font-bold text-xs uppercase block">Recommended Core Service Offer</span>
                <p className="text-sm font-bold text-slate-900">{lead.recommendedService}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-slate-500 text-[10px] font-semibold uppercase block">Tailored Agency Pitch Rationale</span>
                <p className="text-slate-700 text-xs leading-relaxed">
                  "Your team at {lead.name} has built a phenomenal {lead.rating}-star local reputation in {lead.city}. However, prospective mobile searchers are bumping into {lead.websiteStatus.toLowerCase()} issues on your website ({lead.website}). Upgrading to a high-converting web platform with automated booking will immediately capture lost digital leads."
                </p>
              </div>
            </div>
          )}

          {activeTab === 'auto-email' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs">Gemini-Powered Smart Email Auto-Draft</h3>
                    <p className="text-[11px] text-slate-600">
                      Personalized using website flaws, {lead.opportunityScore}% Opp Score, Company Bio, & HR contact.
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-emerald-200">
                  {['Consultative Audit', 'Direct Pitch', 'Short & Punchy'].map((style) => (
                    <button
                      key={style}
                      onClick={() => {
                        setEmailStyle(style);
                        handleGenerateDraftEmail(style);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        emailStyle === style ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {isGeneratingEmail ? (
                <div className="bg-slate-50 border border-slate-200 p-12 rounded-3xl text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-800">Generating hyper-personalized outreach draft with Gemini AI...</p>
                  <p className="text-[11px] text-slate-400">Analyzing {lead.name} website audit metrics and opportunity score...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Email Subject Line</label>
                    <input
                      type="text"
                      value={draftSubject}
                      onChange={(e) => setDraftSubject(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs p-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Email Body</label>
                      <span className="text-[10px] text-slate-400">Recipient: {recipientEmail || lead.email}</span>
                    </div>
                    <textarea
                      rows={10}
                      value={draftBody}
                      onChange={(e) => setDraftBody(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-sans text-xs p-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      onClick={() => setShowPromptPreview(!showPromptPreview)}
                      className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{showPromptPreview ? 'Hide Prompt Template Details' : 'View Gemini Prompt Context'}</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleGenerateDraftEmail(emailStyle)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-2 rounded-xl text-xs flex items-center space-x-1 transition-all cursor-pointer"
                        title="Regenerate draft"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Re-Draft</span>
                      </button>

                      <button
                        onClick={handleCopyEmail}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied to Clipboard!' : 'Copy Email'}</span>
                      </button>

                      {recipientEmail && (
                        <a
                          href={`mailto:${recipientEmail}?subject=${encodeURIComponent(draftSubject)}&body=${encodeURIComponent(draftBody)}`}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-200 transition-all cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Open in Mail Client</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {showPromptPreview && (
                    <div className="bg-slate-900 text-slate-300 p-4 rounded-2xl font-mono text-[11px] space-y-2 border border-slate-800 animate-fade-in">
                      <div className="text-emerald-400 font-bold uppercase text-[10px]">Gemini Prompt Context & Metadata:</div>
                      <p className="leading-relaxed">{promptTemplateUsed}</p>
                      <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-800">
                        Evaluated fields: Name ({lead.name}), Category ({lead.category}), Flaws ({lead.audit.issues.join(', ')}), HR Contact ({lead.hrContact?.name || 'N/A'}), Bio ({lead.companyBio ? 'Yes' : 'No'}).
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
