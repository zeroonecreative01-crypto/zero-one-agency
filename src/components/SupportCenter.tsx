import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, CircleHelp, Mail, MessageCircle, Send, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

const TOKEN_KEY = 'zero-one-support-token';
const SUPPORT_EMAIL = 'zeroone.creative.01@gmail.com';
const SUPPORT_TYPES = ['General Inquiry', 'Pricing', 'Services', 'Existing Project', 'Technical Support', 'Partnership', 'Other'];
const COUNTRIES = ['Kuwait', 'Saudi Arabia', 'United Arab Emirates', 'Egypt', 'Bahrain', 'Qatar', 'Oman', 'Jordan', 'Other'];

type Message = { id: string; conversation_id?: string; sender_type: 'client' | 'admin'; message: string; created_at: string; read_at?: string | null };
type ConversationPayload = { conversation: { id: string; visitor_token: string; support_type: string; status: string; priority: string }; client: { name: string; email: string; phone: string; country: string; language: string }; messages: Message[] };
type FormState = { name: string; email: string; phone: string; country: string; language: string; supportType: string; details: string; message: string };

const inputClass = 'w-full rounded-xl border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.03] px-3 py-3 text-sm text-[#F7F5F0] outline-none transition focus:border-[#F14A0B]/60';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.18em] text-[#F7F5F0]/45">{label}</span>{children}</label>;
}

function MessageBubble({ item }: { item: Message }) {
  const admin = item.sender_type === 'admin';
  return <div className={`flex ${admin ? 'justify-start' : 'justify-end'}`}><div className={`max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-6 ${admin ? 'rounded-bl-md border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.04] text-[#F7F5F0]/80' : 'rounded-br-md bg-[#F14A0B] text-[#111111]'}`}><p className="whitespace-pre-wrap">{item.message}</p><p className={`mt-1 text-[8px] ${admin ? 'text-[#F7F5F0]/25' : 'text-[#111111]/45'}`}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div></div>;
}

function useClientConversation(token: string | null) {
  const [data, setData] = useState<ConversationPayload | null>(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!supabase || !token) { setData(null); setLoading(false); return; }
    let mounted = true;
    setLoading(true);
    supabase.rpc('get_support_conversation', { p_visitor_token: token }).then(({ data: result, error }) => {
      if (!mounted) return;
      setData(error || !result ? null : result as ConversationPayload);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [token]);

  useEffect(() => {
    if (!supabase || !token) return;
    const channel = supabase.channel(`support:${token}`).on('broadcast', { event: 'INSERT' }, (payload) => {
      const row = payload.payload as Message;
      if (!row?.id) return;
      setData((current) => current ? { ...current, messages: current.messages.some((m) => m.id === row.id) ? current.messages : [...current.messages, row] } : current);
    }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [token]);

  return { data, setData, loading };
}

export function SupportCenter() {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [form, setForm] = useState<FormState>({ name: '', email: '', phone: '', country: '', language: 'English', supportType: 'General Inquiry', details: '', message: '' });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { data, setData, loading } = useClientConversation(token);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' }); }, [data?.messages.length, open]);
  const setField = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const startConversation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setError(''); setSubmitting(true);
    const { data: result, error: rpcError } = await supabase.rpc('create_support_conversation', { p_name: form.name, p_email: form.email, p_phone: form.phone, p_country: form.country, p_language: form.language, p_support_type: form.supportType, p_details: form.details, p_message: form.message });
    setSubmitting(false);
    if (rpcError || !result?.visitor_token) { setError(rpcError?.message || 'We could not start your conversation. Please try again.'); return; }
    localStorage.setItem(TOKEN_KEY, result.visitor_token);
    setToken(result.visitor_token);
  };

  const sendClientMessage = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!supabase || !token || !message.trim()) return;
    const text = message.trim(); setMessage('');
    const { error: rpcError } = await supabase.rpc('send_support_message', { p_visitor_token: token, p_message: text });
    if (rpcError) setMessage(text);
  };

  const reset = () => { localStorage.removeItem(TOKEN_KEY); setToken(null); setData(null); };
  if (!supabase) return null;

  return <>
    {open && <div className="fixed inset-0 z-[100] flex items-end justify-end p-4 sm:p-6 md:p-8 pointer-events-none"><div className="pointer-events-auto flex h-[min(720px,calc(100vh-32px))] w-full max-w-[440px] flex-col overflow-hidden rounded-[28px] border border-[#F7F5F0]/10 bg-[#111111] shadow-[0_30px_100px_rgba(0,0,0,.55)]">
      <header className="flex items-center justify-between border-b border-[#F7F5F0]/10 px-5 py-4"><div><p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#F14A0B]">ZERO ONE</p><h2 className="mt-1 text-lg font-semibold">Live Support</h2></div><button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full border border-[#F7F5F0]/10"><X size={16} /></button></header>
      {!token || (!loading && !data) ? <form onSubmit={startConversation} className="flex-1 overflow-y-auto p-5 sm:p-6"><p className="text-2xl font-semibold">How can we help?</p><p className="mt-2 text-sm leading-6 text-[#F7F5F0]/45">Tell us a little about you and our team will reply here.</p>{error && <div className="mt-4 border border-red-400/20 bg-red-400/5 p-3 text-xs text-red-200">{error}</div>}<div className="mt-6 space-y-4">
        <Field label="Name *"><input className={inputClass} required value={form.name} onChange={(e) => setField('name', e.target.value)} /></Field>
        <Field label="Email *"><input className={inputClass} required type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} /></Field>
        <Field label="Phone / WhatsApp *"><input className={inputClass} required value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="+965 ..." /></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Country *"><select className={inputClass} required value={form.country} onChange={(e) => setField('country', e.target.value)}><option value="">Select</option>{COUNTRIES.map((country) => <option key={country}>{country}</option>)}</select></Field><Field label="Language *"><select className={inputClass} value={form.language} onChange={(e) => setField('language', e.target.value)}><option>English</option><option>Arabic</option></select></Field></div>
        <Field label="Support type *"><select className={inputClass} value={form.supportType} onChange={(e) => setField('supportType', e.target.value)}>{SUPPORT_TYPES.map((type) => <option key={type}>{type}</option>)}</select></Field>
        <Field label="Details (optional)"><textarea className={inputClass} rows={2} value={form.details} onChange={(e) => setField('details', e.target.value)} /></Field>
        <Field label="Message *"><textarea className={inputClass} required rows={4} value={form.message} onChange={(e) => setField('message', e.target.value)} placeholder="Write your question..." /></Field>
      </div><button disabled={submitting} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#F14A0B] px-5 py-3.5 text-sm font-semibold text-[#111111] disabled:opacity-50">{submitting ? 'Starting...' : 'Start Conversation'} <ArrowRight size={15} /></button><a href={`mailto:${SUPPORT_EMAIL}`} className="mt-4 flex items-center justify-center gap-2 text-xs text-[#F7F5F0]/40"><Mail size={13} /> {SUPPORT_EMAIL}</a></form> : loading ? <div className="flex flex-1 items-center justify-center text-xs uppercase tracking-[0.2em] text-[#F7F5F0]/35">Loading conversation...</div> : <><div ref={messagesRef} className="flex-1 space-y-3 overflow-y-auto p-5"><div className="mb-5 rounded-2xl border border-[#F7F5F0]/8 bg-[#F7F5F0]/[0.03] p-4"><span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#F14A0B]">{data.client.language} · {data.conversation.support_type}</span><p className="mt-2 text-sm text-[#F7F5F0]/65">Hi {data.client.name.split(' ')[0]}, we’re here to help.</p></div>{data.messages.map((item) => <MessageBubble key={item.id} item={item} />)}</div><form onSubmit={sendClientMessage} className="border-t border-[#F7F5F0]/10 p-4"><div className="flex items-end gap-2 rounded-2xl border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.03] p-2"><textarea value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} rows={1} placeholder="Write a message..." className="min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none" /><button disabled={!message.trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F14A0B] text-[#111111] disabled:opacity-30"><Send size={15} /></button></div><div className="mt-3 flex items-center justify-between"><span className="text-[9px] text-[#F7F5F0]/25">Replies appear here in real time.</span><button type="button" onClick={reset} className="text-[9px] font-semibold uppercase tracking-widest text-[#F7F5F0]/35">Start over</button></div></form></>}</div></div>}
    <button onClick={() => setOpen(true)} aria-label="Open ZERO ONE support" className="fixed bottom-5 right-5 z-[90] flex items-center gap-3 rounded-full border border-[#F7F5F0]/15 bg-[#111111]/90 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#F7F5F0] shadow-[0_15px_50px_rgba(0,0,0,.35)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#F14A0B]/60 sm:bottom-7 sm:right-7"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#F14A0B] text-[#111111]"><MessageCircle size={15} /></span>Live Support</button>
  </>;
}

export function SupportPanel() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadConversations = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('support_conversations').select('*, support_clients(*)').order('last_message_at', { ascending: false });
    setConversations(data || []); if (!selectedId && data?.[0]?.id) setSelectedId(data[0].id); setLoading(false);
  };
  const loadMessages = async (id: string) => {
    if (!supabase) return;
    const { data } = await supabase.from('support_messages').select('id,conversation_id,sender_type,message,created_at,read_at').eq('conversation_id', id).order('created_at', { ascending: true });
    setMessages((data || []) as Message[]);
    await supabase.from('support_messages').update({ read_at: new Date().toISOString() }).eq('conversation_id', id).eq('sender_type', 'client').is('read_at', null);
  };
  useEffect(() => { void loadConversations(); }, []);
  useEffect(() => { if (selectedId) void loadMessages(selectedId); }, [selectedId]);
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase.channel('support-admin-inbox').on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, (payload) => {
      const row = payload.new as Message;
      if (payload.eventType === 'INSERT' && row?.conversation_id === selectedId) setMessages((current) => current.some((m) => m.id === row.id) ? current : [...current, row]);
      void loadConversations();
    }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [selectedId]);

  const selected = useMemo(() => conversations.find((item) => item.id === selectedId) || null, [conversations, selectedId]);
  const filtered = useMemo(() => conversations.filter((item) => { const client = item.support_clients || {}; const haystack = `${client.name || ''} ${client.email || ''} ${client.phone || ''} ${item.support_type || ''}`.toLowerCase(); return (!search || haystack.includes(search.toLowerCase())) && (statusFilter === 'all' || item.status === statusFilter); }), [conversations, search, statusFilter]);

  const sendReply = async (event?: React.FormEvent) => {
    event?.preventDefault(); if (!supabase || !selectedId || !reply.trim()) return;
    const text = reply.trim(); setReply(''); setSending(true);
    const { error } = await supabase.from('support_messages').insert({ conversation_id: selectedId, sender_type: 'admin', message: text });
    setSending(false); if (error) setReply(text);
  };
  const updateConversation = async (patch: Record<string, string>) => { if (!supabase || !selectedId) return; await supabase.from('support_conversations').update(patch).eq('id', selectedId); await loadConversations(); };

  return <section className="mt-8 overflow-hidden rounded-2xl border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02]"><div className="grid min-h-[680px] lg:grid-cols-[330px_minmax(0,1fr)]">
    <aside className="border-b border-[#F7F5F0]/10 lg:border-b-0 lg:border-r"><div className="border-b border-[#F7F5F0]/10 p-4"><div className="flex items-center justify-between"><div><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#F14A0B]">Client Inbox</p><p className="mt-1 text-sm font-semibold">{conversations.length} conversations</p></div><CircleHelp size={18} className="text-[#F7F5F0]/25" /></div><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients..." className="mt-4 w-full rounded-xl border border-[#F7F5F0]/10 bg-transparent px-3 py-2.5 text-sm outline-none" /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-2 w-full rounded-xl border border-[#F7F5F0]/10 bg-[#111111] px-3 py-2.5 text-xs text-[#F7F5F0]/60"><option value="all">All statuses</option><option value="new">New</option><option value="open">Open</option><option value="waiting_client">Waiting for client</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></div><div className="max-h-[580px] overflow-y-auto">{loading ? <p className="p-5 text-xs text-[#F7F5F0]/35">Loading...</p> : filtered.map((item) => { const client = item.support_clients || {}; return <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full border-b border-[#F7F5F0]/8 p-4 text-left ${item.id === selectedId ? 'bg-[#F14A0B]/10' : 'hover:bg-[#F7F5F0]/[0.03]'}`}><div className="flex items-start justify-between gap-3"><span className="truncate text-sm font-semibold">{client.name || 'Unknown client'}</span><span className={`h-2 w-2 shrink-0 rounded-full ${item.status === 'new' ? 'bg-[#F14A0B]' : item.status === 'resolved' || item.status === 'closed' ? 'bg-[#F7F5F0]/20' : 'bg-emerald-400'}`} /></div><p className="mt-1 truncate text-[11px] text-[#F7F5F0]/35">{client.country || ''} · {item.support_type}</p><p className="mt-2 truncate text-xs text-[#F7F5F0]/50">{new Date(item.last_message_at).toLocaleString()}</p></button>; })}</div></aside>
    <div className="flex min-w-0 flex-col">{!selected ? <div className="flex flex-1 items-center justify-center p-8 text-sm text-[#F7F5F0]/35">Select a conversation to reply.</div> : <><header className="border-b border-[#F7F5F0]/10 p-5"><div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#F14A0B]">{selected.support_type}</p><h3 className="mt-1 text-2xl font-semibold">{selected.support_clients?.name}</h3><p className="mt-1 text-xs text-[#F7F5F0]/40">{selected.support_clients?.email} · {selected.support_clients?.phone} · {selected.support_clients?.country} · {selected.support_clients?.language}</p></div><div className="flex flex-wrap gap-2"><select value={selected.status} onChange={(e) => void updateConversation({ status: e.target.value })} className="rounded-full border border-[#F7F5F0]/10 bg-[#111111] px-3 py-2 text-xs"><option value="new">New</option><option value="open">Open</option><option value="waiting_client">Waiting client</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select><select value={selected.priority} onChange={(e) => void updateConversation({ priority: e.target.value })} className="rounded-full border border-[#F7F5F0]/10 bg-[#111111] px-3 py-2 text-xs"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></div></div></header><div className="flex-1 space-y-3 overflow-y-auto p-5">{messages.map((item) => <MessageBubble key={item.id} item={item} />)}</div><form onSubmit={sendReply} className="border-t border-[#F7F5F0]/10 p-4"><div className="flex items-end gap-2 rounded-2xl border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.03] p-2"><textarea value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} rows={2} placeholder="Reply to client..." className="min-h-12 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none" /><button disabled={sending || !reply.trim()} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#F14A0B] text-[#111111] disabled:opacity-30"><Send size={16} /></button></div></form></>}</div>
  </div></section>;
}
