import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, ChevronDown, Eye, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type LeadStatus = 'new' | 'contacted' | 'won' | 'lost';

type Lead = {
  id: string;
  created_at: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  service: string | null;
  budget: string | null;
  message: string | null;
  status: LeadStatus;
};

const STATUS_LABELS: Record<LeadStatus, string> = { new: 'New', contacted: 'Contacted', won: 'Won', lost: 'Lost' };
const STATUS_CLASSES: Record<LeadStatus, string> = {
  new: 'border-[#F14A0B]/40 bg-[#F14A0B]/10 text-[#F14A0B]',
  contacted: 'border-blue-400/30 bg-blue-400/10 text-blue-200',
  won: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  lost: 'border-red-400/30 bg-red-400/10 text-red-200',
};
const formatDate = (value: string) => new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const normalizePhone = (value: string) => value.replace(/[^0-9]/g, '');

export default function LeadsPanel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filter, setFilter] = useState<'all' | LeadStatus>('all');
  const [query, setQuery] = useState('');
  const [period, setPeriod] = useState<'all' | '7' | '30'>('all');

  const loadLeads = useCallback(async (showRefreshState = false) => {
    if (!supabase) { setError('Supabase is not configured.'); setLoading(false); return; }
    if (showRefreshState) setRefreshing(true); else setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (queryError) { setError(queryError.message); setLeads([]); }
    else setLeads((data ?? []) as Lead[]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { void loadLeads(); }, [loadLeads]);

  const updateLeadStatus = async (id: string, status: LeadStatus) => {
    if (!supabase) return;
    setError('');
    const { error: updateError } = await supabase.from('leads').update({ status }).eq('id', id);
    if (updateError) { setError(updateError.message); return; }
    setLeads((current) => current.map((lead) => lead.id === id ? { ...lead, status } : lead));
    setSelectedLead((current) => current?.id === id ? { ...current, status } : current);
  };

  const deleteLead = async (lead: Lead) => {
    if (!supabase) return;
    if (!window.confirm(`Delete the inquiry from ${lead.name}? This cannot be undone.`)) return;
    setError('');
    const { error: deleteError } = await supabase.from('leads').delete().eq('id', lead.id);
    if (deleteError) { setError(deleteError.message); return; }
    setLeads((current) => current.filter((item) => item.id !== lead.id));
    setSelectedLead(null);
  };

  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const cutoff = period === 'all' ? null : Date.now() - Number(period) * 24 * 60 * 60 * 1000;
    return leads.filter((lead) => {
      if (filter !== 'all' && lead.status !== filter) return false;
      if (cutoff && new Date(lead.created_at).getTime() < cutoff) return false;
      if (!normalizedQuery) return true;
      return [lead.name, lead.email, lead.phone, lead.company, lead.service, lead.budget, lead.message]
        .filter(Boolean).join(' ').toLowerCase().includes(normalizedQuery);
    });
  }, [filter, leads, period, query]);

  const stats = useMemo(() => {
    const won = leads.filter((lead) => lead.status === 'won').length;
    const lost = leads.filter((lead) => lead.status === 'lost').length;
    const closed = won + lost;
    return {
      total: leads.length,
      new: leads.filter((lead) => lead.status === 'new').length,
      contacted: leads.filter((lead) => lead.status === 'contacted').length,
      won,
      lost,
      conversion: closed ? Math.round((won / closed) * 100) : 0,
    };
  }, [leads]);

  return (
    <section className="mt-12">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5 mb-8">
        {[
          ['Total Leads', stats.total],
          ['New', stats.new],
          ['Contacted', stats.contacted],
          ['Won', stats.won],
          ['Win Rate', `${stats.conversion}%`],
        ].map(([label, value]) => (
          <div key={label} className="border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02] p-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#F7F5F0]/40">{label}</p>
            <p className="mt-3 text-4xl font-bold tracking-tighter">{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 flex flex-col gap-4 border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02] p-4 md:p-5 xl:flex-row xl:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-[#F7F5F0]/10 px-4 py-3">
          <Search size={16} className="shrink-0 text-[#F7F5F0]/40" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, company, service..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#F7F5F0]/25" />
          {query && <button onClick={() => setQuery('')} className="text-xs text-[#F7F5F0]/40 hover:text-[#F7F5F0]">Clear</button>}
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <select value={filter} onChange={(event) => setFilter(event.target.value as 'all' | LeadStatus)} className="appearance-none rounded-full border border-[#F7F5F0]/15 bg-[#111111] px-5 py-3 pr-10 text-sm font-semibold outline-none focus:border-[#F14A0B]">
              <option value="all">All statuses</option><option value="new">New</option><option value="contacted">Contacted</option><option value="won">Won</option><option value="lost">Lost</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" size={15} />
          </div>
          <div className="relative">
            <select value={period} onChange={(event) => setPeriod(event.target.value as 'all' | '7' | '30')} className="appearance-none rounded-full border border-[#F7F5F0]/15 bg-[#111111] px-5 py-3 pr-10 text-sm font-semibold outline-none focus:border-[#F14A0B]">
              <option value="all">All time</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" size={15} />
          </div>
          <button onClick={() => void loadLeads(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-full border border-[#F7F5F0]/15 px-5 py-3 text-sm font-semibold hover:bg-[#F7F5F0] hover:text-[#111111] transition-colors disabled:opacity-50"><RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />Refresh</button>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F14A0B]">Lead Management</p><h2 className="mt-2 text-3xl font-bold tracking-tight">Inbound inquiries.</h2></div>
        <p className="text-sm text-[#F7F5F0]/40">Showing {filteredLeads.length} of {leads.length} · {stats.lost} lost</p>
      </div>

      {error && <div role="alert" className="mb-6 border border-red-400/30 bg-red-400/5 p-4 text-sm text-red-200">{error}</div>}
      {loading ? <div className="border border-[#F7F5F0]/10 p-12 text-center text-sm uppercase tracking-[0.2em] text-[#F7F5F0]/40">Loading leads...</div> : filteredLeads.length === 0 ? (
        <div className="border border-dashed border-[#F7F5F0]/15 p-12 text-center"><p className="text-xl font-semibold">{leads.length ? 'No leads match these filters.' : 'No inquiries yet.'}</p><p className="mt-2 text-sm text-[#F7F5F0]/45">New contact form submissions will appear here automatically.</p></div>
      ) : (
        <div className="overflow-hidden border border-[#F7F5F0]/10">
          <div className="hidden lg:grid grid-cols-[1.2fr_1fr_1fr_0.8fr_170px] gap-4 border-b border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.03] px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#F7F5F0]/40"><span>Lead</span><span>Company</span><span>Service</span><span>Status</span><span>Actions</span></div>
          <div className="divide-y divide-[#F7F5F0]/10">
            {filteredLeads.map((lead) => (
              <div key={lead.id} className="grid grid-cols-1 gap-4 px-5 py-5 hover:bg-[#F7F5F0]/[0.02] transition-colors lg:grid-cols-[1.2fr_1fr_1fr_0.8fr_170px]">
                <button onClick={() => setSelectedLead(lead)} className="min-w-0 text-left"><p className="truncate font-semibold">{lead.name}</p><p className="mt-1 truncate text-sm text-[#F7F5F0]/45">{lead.email || 'No email'}</p><p className="mt-2 text-[11px] text-[#F7F5F0]/30">{formatDate(lead.created_at)}</p></button>
                <div className="text-sm text-[#F7F5F0]/65 lg:flex lg:items-center">{lead.company || '—'}</div>
                <div className="text-sm text-[#F7F5F0]/65 lg:flex lg:items-center">{lead.service || '—'}</div>
                <div className="lg:flex lg:items-center"><select value={lead.status} onChange={(event) => void updateLeadStatus(lead.id, event.target.value as LeadStatus)} className={`w-full appearance-none rounded-full border bg-transparent px-3 py-2 text-xs font-semibold outline-none ${STATUS_CLASSES[lead.status]}`} aria-label={`Status for ${lead.name}`}>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value} className="bg-[#111111] text-[#F7F5F0]">{label}</option>)}</select></div>
                <div className="flex items-center gap-2"><button onClick={() => setSelectedLead(lead)} className="inline-flex items-center gap-2 rounded-full border border-[#F7F5F0]/15 px-3 py-2 text-xs font-semibold hover:bg-[#F7F5F0] hover:text-[#111111] transition-colors"><Eye size={14}/>View</button>{lead.phone && <a href={`https://wa.me/${normalizePhone(lead.phone)}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full border border-[#F7F5F0]/15 p-2 hover:bg-[#F7F5F0] hover:text-[#111111] transition-colors" title="Open WhatsApp" aria-label={`Open WhatsApp for ${lead.name}`}><ArrowUpRight size={14}/></a>}<button onClick={() => void deleteLead(lead)} className="inline-flex items-center justify-center rounded-full border border-red-400/20 p-2 text-red-200 hover:bg-red-400/10 transition-colors" title="Delete lead" aria-label={`Delete ${lead.name}`}><Trash2 size={14}/></button></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedLead && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm" onClick={() => setSelectedLead(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-auto border border-[#F7F5F0]/10 bg-[#111111] shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-6 border-b border-[#F7F5F0]/10 p-6 md:p-8"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F14A0B]">Lead Details</p><h3 className="mt-2 text-3xl font-bold tracking-tight">{selectedLead.name}</h3></div><button onClick={() => setSelectedLead(null)} className="rounded-full border border-[#F7F5F0]/15 p-2 hover:bg-[#F7F5F0] hover:text-[#111111] transition-colors" aria-label="Close details"><X size={18}/></button></div>
            <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 md:p-8">
              {[['Email', selectedLead.email],['Phone', selectedLead.phone],['Company', selectedLead.company],['Service', selectedLead.service],['Budget', selectedLead.budget],['Received', formatDate(selectedLead.created_at)]].map(([label, value]) => <div key={label}><p className="text-[10px] uppercase tracking-[0.18em] text-[#F7F5F0]/35">{label}</p><p className="mt-2 break-words text-sm text-[#F7F5F0]/80">{value || 'Not provided'}</p></div>)}
              <div className="border-t border-[#F7F5F0]/10 pt-6 md:col-span-2"><p className="text-[10px] uppercase tracking-[0.18em] text-[#F7F5F0]/35">Message</p><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#F7F5F0]/80">{selectedLead.message || 'No message provided.'}</p></div>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-[#F7F5F0]/10 p-6 md:p-8"><p className="mr-auto text-xs text-[#F7F5F0]/35">Status: <span className="text-[#F7F5F0]/75">{STATUS_LABELS[selectedLead.status]}</span></p>{selectedLead.email && <a href={`mailto:${selectedLead.email}`} className="inline-flex items-center gap-2 rounded-full border border-[#F7F5F0]/15 px-4 py-2 text-sm font-semibold hover:bg-[#F7F5F0] hover:text-[#111111] transition-colors">Email <ArrowUpRight size={14}/></a>}{selectedLead.phone && <a href={`https://wa.me/${normalizePhone(selectedLead.phone)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#F7F5F0]/15 px-4 py-2 text-sm font-semibold hover:bg-[#F7F5F0] hover:text-[#111111] transition-colors">WhatsApp <ArrowUpRight size={14}/></a>}<button onClick={() => void deleteLead(selectedLead)} className="inline-flex items-center gap-2 rounded-full border border-red-400/20 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-400/10 transition-colors"><Trash2 size={14}/>Delete</button></div>
          </div>
        </div>
      )}
    </section>
  );
}
