import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, ArrowUpRight, Briefcase, CreditCard, MessageCircle, RefreshCw, Settings2, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Lead = { id: string; name: string; company: string | null; service: string | null; status: string; created_at: string };
type Support = { id: string; conversation_id: string; message: string; created_at: string; support_conversations?: { support_clients?: { name?: string; email?: string } } | null };

const fmt = (value: string) => new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export default function AdminDashboard({ onNavigate }: { onNavigate: (section: 'leads' | 'support' | 'portfolio' | 'pricing') => void }) {
  const [stats, setStats] = useState({ leads: 0, unread: 0, portfolio: 0, pricing: 0 });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [support, setSupport] = useState<Support[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    const client = supabase;
    if (!client) { setError('Supabase is not configured.'); setLoading(false); return; }
    if (refresh) setRefreshing(true); else setLoading(true);
    setError('');
    const [leadCount, unreadCount, portfolioCount, pricingCount, recentLeads, recentSupport] = await Promise.all([
      client.from('leads').select('id', { count: 'exact', head: true }),
      client.from('support_messages').select('id', { count: 'exact', head: true }).eq('sender_type', 'client').is('read_at', null),
      client.from('portfolio_projects').select('id', { count: 'exact', head: true }),
      client.from('pricing_packages').select('id', { count: 'exact', head: true }),
      client.from('leads').select('id,name,company,service,status,created_at').order('created_at', { ascending: false }).limit(5),
      client.from('support_messages').select('id,conversation_id,message,created_at,support_conversations(support_clients(name,email))').eq('sender_type', 'client').order('created_at', { ascending: false }).limit(5),
    ]);
    if (leadCount.error || recentLeads.error || recentSupport.error) setError(leadCount.error?.message || recentLeads.error?.message || recentSupport.error?.message || 'Could not load dashboard data.');
    setStats({ leads: leadCount.count ?? 0, unread: unreadCount.count ?? 0, portfolio: portfolioCount.count ?? 0, pricing: pricingCount.count ?? 0 });
    setLeads((recentLeads.data ?? []) as Lead[]);
    setSupport((recentSupport.data ?? []) as Support[]);
    setLoading(false); setRefreshing(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const cards = useMemo(() => [
    { label: 'Leads', value: stats.leads, icon: Users, action: () => onNavigate('leads'), tone: 'Inbound opportunities' },
    { label: 'Unread support', value: stats.unread, icon: MessageCircle, action: () => onNavigate('support'), tone: 'Client messages waiting' },
    { label: 'Portfolio', value: stats.portfolio, icon: Briefcase, action: () => onNavigate('portfolio'), tone: 'Projects in the CMS' },
    { label: 'Pricing', value: stats.pricing, icon: CreditCard, action: () => onNavigate('pricing'), tone: 'Configured packages' },
  ], [onNavigate, stats]);

  return <section className="mt-10">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F14A0B]">Control Center</p><h2 className="mt-2 text-3xl font-bold tracking-tight">What needs your attention?</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#F7F5F0]/45">Live business data, recent inquiries, and support activity in one place.</p></div>
      <button onClick={() => void load(true)} disabled={refreshing} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#F7F5F0]/15 px-4 py-2.5 text-xs font-semibold hover:bg-[#F7F5F0] hover:text-[#111111] disabled:opacity-50"><RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh</button>
    </div>
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards.map(({ label, value, icon: Icon, action, tone }) => <button key={label} onClick={action} className="group border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#F14A0B]/40"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F7F5F0]/45">{label}</span><Icon size={17} className="text-[#F14A0B]" /></div><div className="mt-5 text-4xl font-bold tracking-tight">{loading ? '—' : value}</div><p className="mt-2 text-xs text-[#F7F5F0]/35">{tone}</p></button>)}</div>
    {error && <div role="alert" className="mt-4 border border-red-400/30 bg-red-400/5 p-4 text-sm text-red-200">{error}</div>}
    <div className="mt-8 grid gap-4 lg:grid-cols-2">
      <div className="border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02]"><div className="flex items-center justify-between border-b border-[#F7F5F0]/10 p-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F14A0B]">Leads</p><h3 className="mt-1 text-xl font-bold">Recent inquiries</h3></div><button onClick={() => onNavigate('leads')} className="inline-flex items-center gap-1 text-xs font-semibold text-[#F7F5F0]/50 hover:text-[#F14A0B]">View all <ArrowUpRight size={13}/></button></div><div className="divide-y divide-[#F7F5F0]/10">{leads.length ? leads.map((lead) => <button key={lead.id} onClick={() => onNavigate('leads')} className="w-full p-5 text-left hover:bg-[#F7F5F0]/[0.025]"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate font-semibold">{lead.name}</p><p className="mt-1 truncate text-xs text-[#F7F5F0]/40">{lead.company || 'No company'} · {lead.service || 'No service'}</p></div><span className="shrink-0 rounded-full border border-[#F7F5F0]/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#F7F5F0]/50">{lead.status}</span></div><p className="mt-2 text-[10px] text-[#F7F5F0]/25">{fmt(lead.created_at)}</p></button>) : <p className="p-8 text-sm text-[#F7F5F0]/40">No inquiries yet.</p>}</div></div>
      <div className="border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02]"><div className="flex items-center justify-between border-b border-[#F7F5F0]/10 p-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F14A0B]">Support</p><h3 className="mt-1 text-xl font-bold">Recent client messages</h3></div><button onClick={() => onNavigate('support')} className="inline-flex items-center gap-1 text-xs font-semibold text-[#F7F5F0]/50 hover:text-[#F14A0B]">Open inbox <ArrowUpRight size={13}/></button></div><div className="divide-y divide-[#F7F5F0]/10">{support.length ? support.map((item) => { const client = item.support_conversations?.support_clients; return <button key={item.id} onClick={() => onNavigate('support')} className="w-full p-5 text-left hover:bg-[#F7F5F0]/[0.025]"><p className="font-semibold">{client?.name || client?.email || 'Client'}</p><p className="mt-1 line-clamp-2 text-sm leading-6 text-[#F7F5F0]/50">{item.message}</p><p className="mt-2 text-[10px] text-[#F7F5F0]/25">{fmt(item.created_at)}</p></button>}) : <p className="p-8 text-sm text-[#F7F5F0]/40">No client messages yet.</p>}</div></div>
    </div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2"><button onClick={() => window.location.assign('/admin/content')} className="flex items-center justify-between border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02] p-5 text-left hover:border-[#F14A0B]/40"><span><span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#F14A0B]">Site Content</span><span className="mt-1 block text-sm font-semibold">Edit website content & client logos</span></span><Settings2 size={18} className="text-[#F7F5F0]/40" /></button><button onClick={() => window.location.assign('/')} className="flex items-center justify-between border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02] p-5 text-left hover:border-[#F14A0B]/40"><span><span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#F14A0B]">Public Site</span><span className="mt-1 block text-sm font-semibold">Open the live website</span></span><ArrowUpRight size={18} className="text-[#F7F5F0]/40" /></button></div>
  </section>;
}
