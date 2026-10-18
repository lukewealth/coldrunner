import React, { useCallback, useEffect, useState } from 'react';
import { Activity, RefreshCw, Cpu, Coins, Gauge, AlertCircle } from 'lucide-react';

type ModelUsage = { model:string; requests:number; totalTokens:number; estimatedCostUsd:number; costUnknownRequests:number };
type Usage = { requests:number; successfulRequests:number; failedRequests:number; promptTokens:number; completionTokens:number; totalTokens:number; avgLatencyMs:number; estimatedCostUsd:number; costUnknownRequests:number; costNote:string; models:ModelUsage[]; recent:Array<{at:string;model:string;purpose:string;promptTokens:number;completionTokens:number;tokenCountSource:string;latencyMs:number;success:boolean;estimatedCostUsd:number|null}> };
type Model = {id:string;ownedBy?:string};
export const LLMUsageMonitor:React.FC = () => {
 const [usage,setUsage]=useState<Usage|null>(null);
 const [models,setModels]=useState<Model[]>([]);
 const [modelError,setModelError]=useState('');
 const [loading,setLoading]=useState(true);
 const refresh=useCallback(async()=>{
  try{const [u,m]=await Promise.all([fetch('/api/llm/usage'),fetch('/api/llm/models')]);if(u.ok){const d=await u.json();setUsage(d.usage)}else setModelError('Usage telemetry endpoint unavailable');if(m.ok){const d=await m.json();setModels(d.models||[]);setModelError('')}else{const d=await m.json().catch(()=>({}));setModelError(d.error||'LLM gateway unavailable')}}catch{setModelError('Unable to reach LLM monitoring endpoints')}finally{setLoading(false)}
 },[]);
 useEffect(()=>{void refresh();const timer=setInterval(()=>void refresh(),10000);return()=>clearInterval(timer)},[refresh]);
 const money=(v:number)=>new Intl.NumberFormat(undefined,{style:'currency',currency:'USD',maximumFractionDigits:6}).format(v);
 const stat=(label:string,value:string,icon:React.ReactNode)=> <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between text-xs text-slate-500"><span>{label}</span>{icon}</div><div className="mt-2 text-xl font-bold text-slate-900">{value}</div></div>;
 return <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-5">
  <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold uppercase tracking-wider"><Activity className="h-4 w-4"/>Live model monitor</div><h2 className="mt-1 text-lg font-bold text-slate-900">LLM usage & model availability</h2><p className="mt-1 text-xs text-slate-500">Refreshes every 10 seconds. Token counts and costs are labeled when estimated.</p></div><button onClick={()=>void refresh()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-3.5 w-3.5"/>Refresh</button></div>
  {modelError&&<div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"><AlertCircle className="h-4 w-4 shrink-0"/><span>{modelError}. Configure the gateway and API key on the server to enable live model discovery.</span></div>}
  <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
   {stat('Total tokens',usage?usage.totalTokens.toLocaleString():'—',<Gauge className="h-4 w-4"/>)}{stat('Requests',usage?usage.requests.toLocaleString():'—',<Activity className="h-4 w-4"/>)}{stat('Estimated cost',usage&&usage.costUnknownRequests===0?money(usage.estimatedCostUsd):usage&&usage.requests>0?money(usage.estimatedCostUsd)+' + unknown':'—',<Coins className="h-4 w-4"/>)}{stat('Available models',models.length.toLocaleString(),<Cpu className="h-4 w-4"/>)}{stat('Avg latency',usage?usage.avgLatencyMs.toLocaleString()+' ms':'—',<Gauge className="h-4 w-4"/>)}{stat('Success rate',usage&&usage.requests?Math.round(usage.successfulRequests/usage.requests*100)+'%':'—',<Activity className="h-4 w-4"/>)}
  </div>
  <div className="grid gap-4 lg:grid-cols-2">
   <div className="rounded-2xl border border-slate-200 p-4"><h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Model catalogue</h3>{loading?<p className="text-sm text-slate-400">Loading model status…</p>:models.length?<div className="max-h-52 space-y-2 overflow-auto">{models.map(m=><div key={m.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"><span className="break-all text-xs font-medium text-slate-800">{m.id}</span><span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Listed</span></div>)}</div>:<p className="text-sm text-slate-500">No models reported by the configured gateway.</p>}</div>
   <div className="rounded-2xl border border-slate-200 p-4"><h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Usage by model</h3>{usage?.models.length?<div className="space-y-3">{usage.models.map(m=><div key={m.model}><div className="flex items-center justify-between gap-2 text-xs"><span className="truncate font-semibold text-slate-800">{m.model}</span><span className="text-slate-500">{m.totalTokens.toLocaleString()} tokens</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{width:`${Math.min(100,usage.totalTokens?m.totalTokens/usage.totalTokens*100:0)}%`}}/></div><p className="mt-1 text-[10px] text-slate-500">{m.requests} requests · {m.costUnknownRequests? 'some costs unknown':money(m.estimatedCostUsd)}</p></div>)}</div>:<p className="text-sm text-slate-500">No LLM calls have been recorded by the gateway client yet.</p>}</div>
  </div>
  <p className="text-[11px] leading-relaxed text-slate-500">{usage?.costNote||'Costs require provider usage data and explicit model pricing. Listed models do not guarantee availability, tool calling, or web-search support.'}</p>
 </section>
};
