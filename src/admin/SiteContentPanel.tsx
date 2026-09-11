import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Eye, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Override = { id: string; type: 'text' | 'link' | 'image'; target: string; value: string };
type SiteContent = { overrides: Override[] };
type Field = { label: string; type: Override['type']; target: string };

const fields: Field[] = [
  { label: 'Brand name', type: 'text', target: 'ZERO ONE' },
  { label: 'Digital experience headline', type: 'text', target: 'The future of' },
  { label: 'Digital experience accent', type: 'text', target: 'brand experience.' },
  { label: 'Experience description', type: 'text', target: 'We design digital experiences that turn attention into interaction — and interaction into something people remember.' },
  { label: 'Services — Brand Identity', type: 'text', target: 'Brand Identity' },
  { label: 'Services — Digital Platforms', type: 'text', target: 'Digital Platforms' },
  { label: 'Services — Campaign & Content', type: 'text', target: 'Campaign & Content' },
  { label: 'Services — Creative Strategy', type: 'text', target: 'Creative Strategy' },
  { label: 'WhatsApp URL', type: 'link', target: 'https://wa.me/201556764804' },
  { label: 'Logo image', type: 'image', target: '/ONE.png' },
];

const input = 'w-full rounded-xl border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.03] px-4 py-3 text-sm outline-none focus:border-[#F14A0B]/70';
const button = 'inline-flex items-center justify-center gap-2 rounded-full border border-[#F7F5F0]/15 px-4 py-2.5 text-sm font-semibold transition hover:border-[#F14A0B]/50';
const empty: Override = { id: '', type: 'text', target: '', value: '' };
const PREVIEW_KEY = 'zero-one:content-preview';

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
  const existingTargets = useMemo(() => new Set(items.map((item) => `${item.type}:${item.target}`)), [items]);

  const chooseField = (field: Field) => {
    const existing = items.find((item) => item.type === field.type && item.target === field.target);
    setDraft(existing ? { ...existing } : { ...empty, type: field.type, target: field.target });
    setError('');
  };

  const addOrUpdate = () => {
    const target = draft.target.trim(); const value = draft.value.trim();
    if (!target || !value) { setError('اكتب القيمة الجديدة الأول.'); return; }
    const duplicate = items.find((item) => item.id !== draft.id && item.type === draft.type && item.target === target);
    if (draft.id || duplicate) {
      const id = draft.id || duplicate!.id;
      setItems((current) => current.map((item) => item.id === id ? { ...item, type: draft.type, target, value } : item));
    } else setItems((current) => [...current, { ...draft, id: crypto.randomUUID(), target, value }]);
    setDraft({ ...empty, type: draft.type }); setError('');
  };

  const remove = (id: string) => setItems((current) => current.filter((item) => item.id !== id));

  const save = async () => {
    const client = supabase; if (!client) return;
    setSaving(true); setError('');
    const { error: e } = await client.from('site_content').upsert({ id: 'default', content: { overrides: items }, updated_at: new Date().toISOString() });
    if (e) setError(e.message);
    else { setSaved(true); window.setTimeout(() => setSaved(false), 2200); window.dispatchEvent(new CustomEvent('zero-one:content-updated')); }
    setSaving(false);
  };

  const preview = () => {
    try {
      localStorage.setItem(PREVIEW_KEY, JSON.stringify({ overrides: items, updatedAt: Date.now() }));
      window.open('/?preview=1', '_blank', 'noopener,noreferrer');
    } catch { setError('تعذر فتح المعاينة. جرّب تعطيل Private/Incognito restrictions.'); }
  };

  return <section className="mt-10">
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div><p className="text-[#F14A0B] text-xs font-bold uppercase tracking-[0.2em]">Site CMS</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Edit site content.</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#F7F5F0]/45">اختار العنصر من القائمة بدل ما تدور على النص يدويًا. عدّل القيمة، اعمل Preview للتجربة، وبعدها Save changes للنشر.</p></div>
      <div className="flex flex-wrap gap-2">
        <button onClick={preview} className={button}><Eye size={15}/> Preview</button>
        <button onClick={() => void load()} className={button}><RefreshCw size={15}/> Refresh</button>
        <button onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-[#F14A0B] px-5 py-2.5 text-sm font-semibold text-[#111111] disabled:opacity-50"><Save size={15}/> {saving ? 'Saving...' : 'Save changes'}</button>
      </div>
    </div>
    {saved && <div className="mb-5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">Saved successfully. The public site will refresh its content overrides.</div>}
    {error && <div role="alert" className="mb-5 rounded-xl border border-red-400/30 bg-red-400/5 px-4 py-3 text-sm text-red-200">{error}</div>}
    <div className="border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02] p-5 md:p-7">
      <div className="mb-5 flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-widest text-[#F14A0B]">Quick edit</p><h3 className="mt-1 text-xl font-bold">Choose what you want to change.</h3></div><span className="text-xs text-[#F7F5F0]/35">{items.length} saved override{items.length === 1 ? '' : 's'}</span></div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => { const active = existingTargets.has(`${field.type}:${field.target}`); return <button key={`${field.type}:${field.target}`} type="button" onClick={() => chooseField(field)} className={`rounded-xl border p-4 text-left transition ${active ? 'border-[#F14A0B]/50 bg-[#F14A0B]/10' : 'border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02] hover:border-[#F14A0B]/40'}`}><div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{field.label}</span><span className="text-[9px] uppercase tracking-widest text-[#F14A0B]">{field.type}</span></div><p className="mt-2 truncate text-[11px] text-[#F7F5F0]/35">{field.target}</p></button>; })}
      </div>
      <div className="mt-6 border-t border-[#F7F5F0]/10 pt-6"><div className="grid gap-3 md:grid-cols-[140px_1fr_1fr_auto] md:items-end">
        <label><span className="mb-2 block text-[10px] uppercase tracking-widest text-[#F7F5F0]/45">Type</span><select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as Override['type'] })} className={input}><option value="text">Text</option><option value="link">Link URL</option><option value="image">Image URL</option></select></label>
        <label><span className="mb-2 block text-[10px] uppercase tracking-widest text-[#F7F5F0]/45">Current</span><input value={draft.target} onChange={(e) => setDraft({ ...draft, target: e.target.value })} placeholder="Choose an item above or enter a value" className={input}/></label>
        <label><span className="mb-2 block text-[10px] uppercase tracking-widest text-[#F7F5F0]/45">New value</span><input value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} placeholder={draft.type === 'text' ? 'اكتب النص الجديد' : 'ضع الرابط الجديد'} className={input}/></label>
        <button onClick={addOrUpdate} className="inline-flex h-[46px] items-center justify-center gap-2 rounded-xl bg-[#F14A0B] px-5 font-semibold text-[#111111]"><Plus size={16}/> {draft.id ? 'Update' : 'Add'}</button>
      </div></div>
    </div>
    <div className="mt-6 space-y-3">{loading ? <div className="border border-[#F7F5F0]/10 p-8 text-sm text-[#F7F5F0]/45">Loading site content...</div> : items.length === 0 ? <div className="border border-dashed border-[#F7F5F0]/15 p-10 text-center"><p className="font-semibold">No content overrides yet.</p><p className="mt-2 text-sm text-[#F7F5F0]/40">اختار أي عنصر من Quick edit فوق وغيّر قيمته.</p></div> : items.map((item) => <div key={item.id} className="grid gap-4 border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02] p-4 md:grid-cols-[80px_1fr_1fr_auto] md:items-center"><span className="text-[10px] font-bold uppercase tracking-widest text-[#F14A0B]">{item.type}</span><div className="min-w-0"><p className="text-[10px] uppercase tracking-widest text-[#F7F5F0]/30">Current</p><p className="mt-1 break-words text-sm text-[#F7F5F0]/65">{item.target}</p></div><div className="min-w-0"><p className="text-[10px] uppercase tracking-widest text-[#F7F5F0]/30">Replacement</p><p className="mt-1 break-words text-sm font-semibold">{item.value}</p></div><div className="flex items-center gap-2"><button onClick={() => setDraft({ ...item })} className="rounded-full border border-[#F7F5F0]/15 px-3 py-2 text-xs font-semibold hover:border-[#F14A0B]/50">Edit</button>{item.type !== 'text' && <a href={item.value} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-full border border-[#F7F5F0]/15 hover:border-[#F14A0B]/50" aria-label="Open replacement"><ExternalLink size={14}/></a>}<button onClick={() => remove(item.id)} className="grid h-9 w-9 place-items-center rounded-full border border-red-400/20 text-red-200 hover:bg-red-400/10" aria-label="Remove override"><Trash2 size={15}/></button></div></div>)}</div>
    <div className="mt-6 border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.015] p-5 text-xs leading-6 text-[#F7F5F0]/40"><b className="text-[#F7F5F0]/65">Preview:</b> المعاينة بتفتح نسخة من الموقع بالتعديلات الحالية فقط. الـ Save changes هو اللي ينشر التعديلات فعليًا في Supabase.</div>
  </section>;
}
