import React, { useState } from 'react';
import { 
  Send, 
  Mail, 
  Phone, 
  MessageSquare, 
  Linkedin, 
  Copy, 
  Check, 
  Sparkles, 
  RotateCw, 
  Zap, 
  Building2, 
  UserCheck
} from 'lucide-react';
import { BusinessLead } from '../types';

interface CampaignBuilderViewProps {
  leads: BusinessLead[];
  selectedLead: BusinessLead | null;
  setSelectedLead: (lead: BusinessLead) => void;
}

export const CampaignBuilderView: React.FC<CampaignBuilderViewProps> = ({
  leads,
  selectedLead,
  setSelectedLead
}) => {
  const currentLead = selectedLead || leads[0];
  const [activeTab, setActiveTab] = useState<'email' | 'call' | 'linkedin' | 'whatsapp'>('email');
  const [agencyType, setAgencyType] = useState('Website & AI Automation Agency');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [campaignData, setCampaignData] = useState<any>({
    leadId: currentLead?.id,
    businessName: currentLead?.name,
    emailSubject: `Quick idea regarding ${currentLead?.name}'s mobile website & online bookings`,
    emailBody: `Hi ${currentLead?.ownerName || 'there'},\n\nI was reviewing ${currentLead?.name} on Google in ${currentLead?.city} and noticed your team has stellar reviews (${currentLead?.rating}★ across ${currentLead?.reviewCount} customers!).\n\nHowever, when inspecting your website (${currentLead?.website}) on mobile, I noticed ${currentLead?.audit?.issues?.[0] || 'a slow load speed and missing mobile booking widget'}.\n\nAt our agency, we specialize in helping top-rated ${currentLead?.category} businesses convert existing web visitors into booked clients without paying for more ads. We recently helped a similar clinic increase monthly appointments by 34% with a fast Next.js site + automated AI booking assistant.\n\nWould you be open to a 5-minute video breakdown of how we'd fix this for ${currentLead?.name}?\n\nBest regards,\nLuke\nColdRunners Partner`,
    linkedinPitch: `Hi ${currentLead?.ownerName || 'there'}, loved seeing the great work ${currentLead?.name} is doing in ${currentLead?.city}! Noticed a quick mobile UX bottleneck on your site that might be costing you bookings. Would love to share a free 2-min breakdown!`,
    callScript: `Gatekeeper Script: "Hi! This is Luke calling for ${currentLead?.ownerName || 'the owner'}. I'm calling regarding a technical report we generated for ${currentLead?.name}'s website."\n\nDecision Maker Script: "Hi ${currentLead?.ownerName || 'there'}, I'm calling because we analyzed your website performance against top ${currentLead?.category} competitors in ${currentLead?.city}. Your reviews are top-tier, but your mobile load speed is sitting at ${currentLead?.audit?.loadTimeMs ? (currentLead?.audit?.loadTimeMs / 1000).toFixed(1) + 's' : '4+ seconds'}, which means mobile searchers are bouncing to competitors. We built a quick prototype to show you how to fix it - can I email you the 2-minute video preview?"`,
    whatsappMessage: `Hello ${currentLead?.ownerName || 'there'}! 👋 Luke here from ColdRunners. Quick heads up regarding ${currentLead?.name}'s website (${currentLead?.website}) - noticed your mobile page speed is losing mobile visitors. Created a short 2-min screen share for you. Mind if I send the link over?`
  });

  const handleGenerate = async () => {
    if (!currentLead) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/agents/generate-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead: currentLead, agencyType })
      });
      const data = await res.json();
      setCampaignData(data);
    } catch (err) {
      console.error('Error generating campaign:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-600 font-semibold text-xs uppercase tracking-wider">
              <Send className="w-4 h-4" />
              <span>Multi-Channel Outreach Campaign Builder</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">AI Personalization Engine</h1>
            <p className="text-xs text-slate-500">
              Generate hyper-personalized outbound sequences referencing specific website flaws and revenue gaps.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Target Lead & Agency Config (4 cols) */}
        <div className="lg:col-span-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">1. Select Target Prospect</span>

          <select
            value={currentLead?.id}
            onChange={(e) => {
              const found = leads.find((l) => l.id === e.target.value);
              if (found) setSelectedLead(found);
            }}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold p-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.city} - {l.opportunityScore}%)
              </option>
            ))}
          </select>

          {currentLead && (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2 text-xs">
              <div className="text-slate-900 font-bold">{currentLead.name}</div>
              <div className="text-slate-500">{currentLead.category} • {currentLead.city}</div>
              <div className="text-amber-700 font-semibold">Flaw: {currentLead.websiteStatus}</div>
              <div className="text-slate-600">Decision Maker: {currentLead.ownerName || 'Business Owner'}</div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-slate-500 text-[10px] font-bold uppercase block">Your Agency Offer Type</label>
            <input
              type="text"
              value={agencyType}
              onChange={(e) => setAgencyType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md shadow-emerald-200 active:scale-95"
          >
            {isGenerating ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Generating Personalized Sequence...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Regenerate with Gemini AI</span>
              </>
            )}
          </button>
        </div>

        {/* Right Side: Multi-channel Sequence Tabs & Content (8 cols) */}
        <div className="lg:col-span-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4">
          {/* Tabs */}
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <button
              onClick={() => setActiveTab('email')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'email' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Cold Email</span>
            </button>
            <button
              onClick={() => setActiveTab('call')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'call' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>SDR Phone Script</span>
            </button>
            <button
              onClick={() => setActiveTab('linkedin')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'linkedin' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Linkedin className="w-3.5 h-3.5" />
              <span>LinkedIn Note</span>
            </button>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'whatsapp' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Pitch</span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Subject Line</span>
                  <button
                    onClick={() => copyToClipboard(campaignData.emailSubject, 'subj')}
                    className="text-xs text-emerald-600 font-semibold flex items-center hover:underline cursor-pointer"
                  >
                    {copiedKey === 'subj' ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    Copy
                  </button>
                </div>
                <div className="text-xs font-bold text-slate-900">{campaignData.emailSubject}</div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 relative">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Personalized Email Pitch Body</span>
                  <button
                    onClick={() => copyToClipboard(campaignData.emailBody, 'body')}
                    className="text-xs text-emerald-600 font-semibold flex items-center hover:underline cursor-pointer"
                  >
                    {copiedKey === 'body' ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    Copy Email Body
                  </button>
                </div>
                <pre className="text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed">
                  {campaignData.emailBody}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'call' && (
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 relative">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">SDR Phone Script & Objection Handler</span>
                <button
                  onClick={() => copyToClipboard(campaignData.callScript, 'call')}
                  className="text-xs text-emerald-600 font-semibold flex items-center hover:underline cursor-pointer"
                >
                  {copiedKey === 'call' ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  Copy Phone Script
                </button>
              </div>
              <pre className="text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed">
                {campaignData.callScript}
              </pre>
            </div>
          )}

          {activeTab === 'linkedin' && (
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 relative">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">LinkedIn Connection Pitch Note</span>
                <button
                  onClick={() => copyToClipboard(campaignData.linkedinPitch, 'li')}
                  className="text-xs text-emerald-600 font-semibold flex items-center hover:underline cursor-pointer"
                >
                  {copiedKey === 'li' ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  Copy Note
                </button>
              </div>
              <p className="text-xs text-slate-800 font-sans leading-relaxed">{campaignData.linkedinPitch}</p>
            </div>
          )}

          {activeTab === 'whatsapp' && (
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 relative">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Direct WhatsApp Message</span>
                <button
                  onClick={() => copyToClipboard(campaignData.whatsappMessage, 'wa')}
                  className="text-xs text-emerald-600 font-semibold flex items-center hover:underline cursor-pointer"
                >
                  {copiedKey === 'wa' ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  Copy Message
                </button>
              </div>
              <p className="text-xs text-slate-800 font-sans leading-relaxed">{campaignData.whatsappMessage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
