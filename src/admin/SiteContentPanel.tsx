import { useEffect, useState } from 'react';
import { ExternalLink, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Override = { id: string; type: 'text' | 'link' | 'image'; target: string; value: string };
type SiteContent = { overrides: Override[] };
const empty: Override = { id: '', type: 'text', target: '', value: '' };
const input = 'w-full rounded-xl border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.03] px-4 py-3 text-sm outline-none focus:border-[#F14A0B]/70';
const button = 'inline-flex items-center justify-center gap-2 rounded-full border border-[#F7F5F0]/15 px-4 py-2.5 text-sm font-semibold transition hover:border-[#F14A0B]/50';
const presets = [
  { label: 'Text', type: 'text' as const, placeholder: 'Exact text currently visible on the site' },
  { label: 'Link URL', type: 'link' as const, placeholder: 'https://current-link.com' },
  { label: 'Image URL', type: 'image' as const, placeholder: 'https://image-url.com/image.webp' },
];

export default function SiteContentPanel() {
  const [items, setItems] = useState<Override[]>([]);
  const [draft, setDraft] = useState<Override>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const load = async () => {
    const client = supabase;
    if (!client) return;
    setLoading(true); setError('');
    const { data, error: e } = await client.from('site_content').select('content').eq('id', 'default').single();
    if (e) setError(e.message);
    else {
      const content = (data?.content ?? {}) as SiteContent;
      setItems(Array.isArray(content.overrides) ? content.overrides : []);
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const add = () => {
    const target = draft.target.trim();
    const value = draft.value.trim();
    if (!target || !value) { setError('Preencha o valor atual e o novo valor.'); return; }
    setItems((current) => [...current, { ...draft, id: crypto.randomUUID(), target, value }]);
    setDraft({ ...empty, type: draft.type }); setError('');
  };

  const remove = (id: string) => setItems((current) => current.filter((item) => item.id !== id));

  const save = async () => {
    const client = supabase;
    if (!client) return;
    setSaving(true); setError('');
    const { error: e } = await client.from('site_content').upsert({ id: 'default', content: { overrides: items }, updated_at: new Date().toISOString() });
    if (e) setError(e.message);
    else {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
      window.dispatchEvent(new CustomEvent('zero-one:content-updated'));
    }
    setSaving(false);
  };

  const selected = presets.find((item) => item.type === draft.type) ?? presets[0];

  return <section className="mt-10">
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-[#F14A0B] text-xs font-bold uppercase tracking-[0.2em]">Site CMS</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">Edit site content.</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#F7F5F0]/45">Manage visible text, navigation/footer links, and image URLs from the admin panel. Changes are stored in Supabase and applied to the public site without editing code.</p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => void load()} className={button}><RefreshCw size={15}/> Refresh</button>
        <button onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-[#F14A0B] px-5 py-2.5 text-sm font-semibold text-[#111111] disabled:opacity-50"><Save size={15}/> {saving ? 'Saving...' : 'Save changes'}</button>
      </div>
    </div>
    {saved && <div className="mb-5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">Saved successfully. The public site will refresh its content overrides.</div>}
    {error && <div role="alert" className="mb-5 rounded-xl border border-red-400/30 bg-red-400/5 px-4 py-3 text-sm text-red-200">{error}</div>}
    <div className="border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02] p-5 md:p-7">
      <div className="mb-5 flex flex-wrap gap-2">
        {presets.map((preset) => <button key={preset.type} onClick={() => setDraft((current) => ({ ...current, type: preset.type }))} className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest transition ${draft.type === preset.type ? 'border-[#F14A0B] bg-[#F14A0B] text-[#111111]' : 'border-[#F7F5F0]/15 text-[#F7F5F0]/55 hover:border-[#F14A0B]/50'}`}>{preset.label}</button>)}
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label><span className="mb-2 block text-[10px] uppercase tracking-widest text-[#F7F5F0]/45">Current {draft.type === 'text' ? 'text' : 'URL'}</span><input value={draft.target} onChange={(e) => setDraft({ ...draft, target: e.target.value })} placeholder={selected.placeholder} className={input}/></label>
        <label><span className="mb-2 block text-[10px] uppercase tracking-widest text-[#F7F5F0]/45">Replacement</span><input value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} placeholder={draft.type === 'text' ? 'Enter the new text' : 'Enter the new URL'} className={input}/></label>
        <button onClick={add} className="inline-flex h-[46px] items-center justify-center gap-2 rounded-xl bg-[#F14A0B] px-5 font-semibold text-[#111111]"><Plus size={16}/> Add</button>
      </div>
    </div>
    <div className="mt-6 space-y-3">
      {loading ? <div className="border border-[#F7F5F0]/10 p-8 text-sm text-[#F7F5F0]/45">Loading site content...</div> : items.length === 0 ? <div className="border border-dashed border-[#F7F5F0]/15 p-10 text-center"><p className="font-semibold">No content overrides yet.</p><p className="mt-2 text-sm text-[#F7F5F0]/40">Add your first text, link, or image replacement above.</p></div> : items.map((item) => <div key={item.id} className="grid gap-4 border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02] p-4 md:grid-cols-[90px_1fr_1fr_auto] md:items-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#F14A0B]">{item.type}</span>
        <div className="min-w-0"><p className="text-[10px] uppercase tracking-widest text-[#F7F5F0]/30">Current</p><p className="mt-1 break-words text-sm text-[#F7F5F0]/65">{item.target}</p></div>
        <div className="min-w-0"><p className="text-[10px] uppercase tracking-widest text-[#F7F5F0]/30">Replacement</p><p className="mt-1 break-words text-sm font-semibold">{item.value}</p></div>
        <div className="flex items-center gap-2">{item.type !== 'text' && <a href={item.value} target="_blank" rel="noreferrer" className="grid h-10 w-10 place-items-center rounded-full border border-[#F7F5F0]/15 hover:border-[#F14A0B]/50" aria-label="Open replacement"><ExternalLink size={14}/></a>}<button onClick={() => remove(item.id)} className="grid h-10 w-10 place-items-center rounded-full border border-red-400/20 text-red-200 hover:bg-red-400/10" aria-label="Remove override"><Trash2 size={15}/></button></div>
      </div>)}
    </div>
    <div className="mt-6 border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.015] p-5 text-xs leading-6 text-[#F7F5F0]/40"><b className="text-[#F7F5F0]/65">How it works:</b> choose Text, Link URL, or Image URL. For text, paste the exact phrase currently visible; for links/images, paste the current URL. Then enter the replacement and press Add → Save changes. Logo management is handled separately below.</div>
  </section>;
}
