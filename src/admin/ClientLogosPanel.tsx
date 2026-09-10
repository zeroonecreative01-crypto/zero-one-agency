import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Save, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

type ClientLogo = { id: string; name: string; image_url: string; website_url: string | null; active: boolean; sort_order: number };
const emptyLogo = (): ClientLogo => ({ id: `new-${Date.now()}`, name: '', image_url: '', website_url: '', active: true, sort_order: 9999 });

export default function ClientLogosPanel() {
  const [logos, setLogos] = useState<ClientLogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    if (!supabase) { setMessage('Supabase is not configured.'); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase.from('client_logos').select('*').order('sort_order', { ascending: true });
    if (error) setMessage(error.message); else setLogos((data || []) as ClientLogo[]);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);
  const update = (id: string, patch: Partial<ClientLogo>) => setLogos(items => items.map(item => item.id === id ? { ...item, ...patch } : item));
  const move = (index: number, direction: -1 | 1) => { const target = index + direction; if (target < 0 || target >= logos.length) return; const next = [...logos]; [next[index], next[target]] = [next[target], next[index]]; setLogos(next); };
  const add = () => setLogos(items => [...items, emptyLogo()]);
  const remove = async (logo: ClientLogo) => {
    if (!window.confirm(`Delete ${logo.name || 'this logo'}?`)) return;
    if (!logo.id.startsWith('new-')) { if (!supabase) return; const { error } = await supabase.from('client_logos').delete().eq('id', logo.id); if (error) { setMessage(error.message); return; } }
    setLogos(items => items.filter(item => item.id !== logo.id));
    window.dispatchEvent(new CustomEvent('zero-one:client-logos-updated'));
  };
  const save = async () => {
    if (!supabase) { setMessage('Supabase is not configured.'); return; }
    setSaving(true); setMessage('');
    try {
      const rows = logos.map((logo, index) => ({ ...(logo.id.startsWith('new-') ? {} : { id: logo.id }), name: logo.name.trim() || `Client ${index + 1}`, image_url: logo.image_url.trim(), website_url: logo.website_url?.trim() || null, active: logo.active, sort_order: index + 1 })).filter(row => row.image_url);
      const { data, error } = await supabase.from('client_logos').upsert(rows).select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      setLogos((data || []) as ClientLogo[]); setMessage('Saved successfully.'); window.dispatchEvent(new CustomEvent('zero-one:client-logos-updated'));
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Save failed.'); } finally { setSaving(false); }
  };
  return <section className="mt-10 border border-[#F7F5F0]/10 bg-[#151515] p-6 md:p-8">
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F14A0B]">Client Brands</p><h2 className="mt-2 text-3xl font-bold tracking-tight">Logos.</h2><p className="mt-2 text-sm text-[#F7F5F0]/50">Add, remove, hide, reorder and edit the brands shown on the public site.</p></div><button onClick={add} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F14A0B] px-5 py-3 font-semibold text-[#111111]"><Plus size={17}/> Add Logo</button></div>
    {message && <div className="mt-5 border border-[#F7F5F0]/10 px-4 py-3 text-sm text-[#F7F5F0]/70">{message}</div>}
    {loading ? <p className="mt-8 text-sm text-[#F7F5F0]/50">Loading logos...</p> : <div className="mt-8 space-y-3">{logos.map((logo, index) => <div key={logo.id} className="grid gap-4 border border-[#F7F5F0]/10 p-4 md:grid-cols-[90px_1fr_auto] md:items-center"><div className="grid h-20 place-items-center bg-[#0f0f0f] p-3"><img src={logo.image_url} alt={logo.name || 'Client logo'} className="max-h-full max-w-full object-contain" /></div><div className="grid gap-3 md:grid-cols-3"><input value={logo.name} onChange={e => update(logo.id, { name: e.target.value })} placeholder="Company name" className="rounded-lg border border-[#F7F5F0]/10 bg-[#0f0f0f] px-3 py-2.5 text-sm outline-none focus:border-[#F14A0B]" /><input value={logo.image_url} onChange={e => update(logo.id, { image_url: e.target.value })} placeholder="Logo image URL" className="rounded-lg border border-[#F7F5F0]/10 bg-[#0f0f0f] px-3 py-2.5 text-sm outline-none focus:border-[#F14A0B]" /><input value={logo.website_url || ''} onChange={e => update(logo.id, { website_url: e.target.value })} placeholder="Website URL (optional)" className="rounded-lg border border-[#F7F5F0]/10 bg-[#0f0f0f] px-3 py-2.5 text-sm outline-none focus:border-[#F14A0B]" /></div><div className="flex items-center justify-end gap-2"><button title={logo.active ? 'Hide' : 'Show'} onClick={() => update(logo.id, { active: !logo.active })} className="grid h-9 w-9 place-items-center rounded-full border border-[#F7F5F0]/10">{logo.active ? <Eye size={16}/> : <EyeOff size={16}/>}</button><button title="Move up" onClick={() => move(index, -1)} className="grid h-9 w-9 place-items-center rounded-full border border-[#F7F5F0]/10"><ArrowUp size={15}/></button><button title="Move down" onClick={() => move(index, 1)} className="grid h-9 w-9 place-items-center rounded-full border border-[#F7F5F0]/10"><ArrowDown size={15}/></button><button title="Delete" onClick={() => void remove(logo)} className="grid h-9 w-9 place-items-center rounded-full border border-red-400/20 text-red-300"><Trash2 size={15}/></button></div></div>)}{!logos.length && <p className="border border-dashed border-[#F7F5F0]/10 p-8 text-center text-sm text-[#F7F5F0]/40">No client logos yet.</p>}</div>}
    <div className="mt-6 flex justify-end"><button disabled={saving} onClick={() => void save()} className="inline-flex items-center gap-2 rounded-full border border-[#F7F5F0]/15 px-5 py-3 text-sm font-semibold disabled:opacity-50"><Save size={16}/> {saving ? 'Saving...' : 'Save Changes'}</button></div>
  </section>;
}
