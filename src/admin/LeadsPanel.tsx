import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Check, ChevronDown, Eye, RefreshCw, Trash2, X } from 'lucide-react';
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

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  won: 'Won',
  lost: 'Lost',
};

const STATUS_CLASSES: Record<LeadStatus, string> = {
  new: 'border-[#F14A0B]/40 bg-[#F14A0B]/10 text-[#F14A0B]',
  contacted: 'border-blue-400/30 bg-blue-400/10 text-blue-200',
  won: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  lost: 'border-red-400/30 bg-red-400/10 text-red-200',
};

const formatDate = (value: string) => new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(value));

export default function LeadsPanel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filter, setFilter] = useState<'all' | LeadStatus>('all');

  const loadLeads = useCallback(async (showRefreshState = false) => {
    if (!supabase) {
      setError('Supabase is not configured.');
      setLoading(false);
      return;
    }

    if (showRefreshState) setRefreshing(true);
    else setLoading(true);
    setError('');

    const { data, error: queryError } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setLeads([]);
    } else {
      setLeads((data ?? []) as Lead[]);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  const updateLeadStatus = async (id: string, status: LeadStatus) => {
    if (!supabase) return;
    setError('');
    const { error: updateError } = await supabase.from('leads').update({ status }).eq('id', id);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    setLeads((current) => current.map((lead) => lead.id === id ? { ...lead, status } : lead));
    setSelectedLead((current) => current?.id === id ? { ...current, status } : current);
  };

  const deleteLead = async (lead: Lead) => {
    if (!supabase) return;
    const confirmed = window.confirm(`Delete the inquiry from ${lead.name}? This cannot be undone.`);
    if (!confirmed) return;

    setError('');
    const { error: deleteError } = await supabase.from('leads').delete().eq('id', lead.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setLeads((current) => current.filter((item) => item.id !== lead.id));
    setSelectedLead(null);
  };

  const filteredLeads = useMemo(
    () => filter === 'all' ? leads : leads.filter((lead) => lead.status === filter),
    [filter, leads],
  );

  const stats = useMemo(() => ({
    total: leads.length,
    new: leads.filter((lead) => lead.status === 'new').length,
    contacted: leads.filter((lead) => lead.status === 'contacted').length,
    won: leads.filter((lead) => lead.status === 'won').length,
  }), [leads]);

  return (
    <section className="mt-12">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          ['Total Leads', stats.total],
          ['New', stats.new],
          ['Contacted', stats.contacted],
          ['Won', stats.won],
        ].map(([label, value]) => (
          <div key={label} className="border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02] p-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#F7F5F0]/40">{label}</p>
            <p className="mt-3 text-4xl font-bold tracking-tighter">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F14A0B]">Lead Management</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">Inbound inquiries.</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as 'all' | LeadStatus)}
              className="appearance-none rounded-full border border-[#F7F5F0]/15 bg-[#111111] px-5 py-3 pr-10 text-sm font-semibold outline-none focus:border-[#F14A0B]"
            >
              <option value="all">All statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" size={15} />
          </div>
          <button
            onClick={() => void loadLeads(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-full border border-[#F7F5F0]/15 px-5 py-3 text-sm font-semibold hover:bg-[#F7F5F0] hover:text-[#111111] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-6 border border-red-400/30 bg-red-400/5 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="border border-[#F7F5F0]/10 p-12 text-center text-sm uppercase tracking-[0.2em] text-[#F7F5F0]/40">Loading leads...</div>
      ) : filteredLeads.length === 0 ? (
        <div className="border border-dashed border-[#F7F5F0]/15 p-12 text-center">
          <p className="text-xl font-semibold">No inquiries yet.</p>
          <p className="mt-2 text-sm text-[#F7F5F0]/45">New contact form submissions will appear here automatically.</p>
        </div>
      ) : (
        <div className="overflow-hidden border border-[#F7F5F0]/10">
          <div className="hidden lg:grid grid-cols-[1.2fr_1fr_1fr_0.8fr_160px] gap-4 border-b border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.03] px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#F7F5F0]/40">
            <span>Lead</span><span>Company</span><span>Service</span><span>Status</span><span>Actions</span>
          </div>
          <div className="divide-y divide-[#F7F5F0]/10">
            {filteredLeads.map((lead) => (
              <div key={lead.id} className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_1fr_0.8fr_160px] gap-4 px-5 py-5 hover:bg-[#F7F5F0]/[0.02] transition-colors">
                <button onClick={() => setSelectedLead(lead)} className="text-left min-w-0">
                  <p className="font-semibold truncate">{lead.name}</p>
                  <p className="mt-1 text-sm text-[#F7F5F0]/45 truncate">{lead.email || 'No email'}</p>
                  <p className="mt-2 text-[11px] text-[#F7F5F0]/30">{formatDate(lead.created_at)}</p>
                </button>
                <div className="lg:flex lg:items-center text-sm text-[#F7F5F0]/65">{lead.company || '—'}</div>
                <div className="lg:flex lg:items-center text-sm text-[#F7F5F0]/65">{lead.service || '—'}</div>
                <div className="lg:flex lg:items-center">
                  <select
                    value={lead.status}
                    onChange={(event) => void updateLeadStatus(lead.id, event.target.value as LeadStatus)}
                    className={`w-full appearance-none rounded-full border px-3 py-2 text-xs font-semibold outline-none bg-transparent ${STATUS_CLASSES[lead.status]}`}
                    aria-label={`Status for ${lead.name}`}
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value} className="bg-[#111111] text-[#F7F5F0]">{label}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedLead(lead)} className="inline-flex items-center gap-2 rounded-full border border-[#F7F5F0]/15 px-3 py-2 text-xs font-semibold hover:bg-[#F7F5F0] hover:text-[#111111] transition-colors" title="View details">
                    <Eye size={14} /> View
                  </button>
                  <button onClick={() => void deleteLead(lead)} className="inline-flex items-center justify-center rounded-full border border-red-400/20 p-2 text-red-200 hover:bg-red-400/10 transition-colors" title="Delete lead">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedLead && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm" onClick={() => setSelectedLead(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-auto border border-[#F7F5F0]/10 bg-[#111111] shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-6 border-b border-[#F7F5F0]/10 p-6 md:p-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F14A0B]">Lead Details</p>
                <h3 className="mt-2 text-3xl font-bold tracking-tight">{selectedLead.name}</h3>
              </div>
              <button onClick={() => setSelectedLead(null)} className="rounded-full border border-[#F7F5F0]/15 p-2 hover:bg-[#F7F5F0] hover:text-[#111111] transition-colors" aria-label="Close details"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 md:p-8">
              {[
                ['Email', selectedLead.email],
                ['Phone', selectedLead.phone],
                ['Company', selectedLead.company],
                ['Service', selectedLead.service],
                ['Budget', selectedLead.budget],
                ['Received', formatDate(selectedLead.created_at)],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#F7F5F0]/35">{label}</p>
                  <p className="mt-2 text-sm text-[#F7F5F0]/80 break-words">{value || 'Not provided'}</p>
                </div>
              ))}
              <div className="md:col-span-2 border-t border-[#F7F5F0]/10 pt-6">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#F7F5F0]/35">Message</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#F7F5F0]/80">{selectedLead.message || 'No message provided.'}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-[#F7F5F0]/10 p-6 md:p-8">
              <p className="mr-auto text-xs text-[#F7F5F0]/35">Status: <span className="text-[#F7F5F0]/75">{STATUS_LABELS[selectedLead.status]}</span></p>
              {selectedLead.email && <a href={`mailto:${selectedLead.email}`} className="inline-flex items-center gap-2 rounded-full border border-[#F7F5F0]/15 px-4 py-2 text-sm font-semibold hover:bg-[#F7F5F0] hover:text-[#111111] transition-colors">Email <ArrowUpRight size={14}/></a>}
              <button onClick={() => void deleteLead(selectedLead)} className="inline-flex items-center gap-2 rounded-full border border-red-400/20 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-400/10 transition-colors"><Trash2 size={14}/> Delete</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
