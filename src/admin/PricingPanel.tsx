import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type PricingGroup = { title: string; items: string[] };
type PricingPackage = {
  id: string;
  created_at: string;
  name: string;
  price: string;
  currency: string;
  billing_label: string;
  tone: 'starter' | 'growth' | 'premium';
  popular: boolean;
  groups: PricingGroup[];
  sort_order: number;
};

type FormState = Omit<PricingPackage, 'id' | 'created_at'>;

const emptyForm: FormState = {
  name: '', price: '', currency: 'KWD', billing_label: 'Monthly', tone: 'starter', popular: false, groups: [{ title: 'Included Services', items: [''] }], sort_order: 0,
};

const inputClass = 'w-full rounded-xl border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.03] px-4 py-3 text-sm outline-none transition focus:border-[#F14A0B]/70';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-full border border-[#F7F5F0]/15 px-4 py-2.5 text-sm font-semibold transition hover:border-[#F14A0B]/50';

export default function PricingPanel() {
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<PricingPackage | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => packages.filter((item) => `${item.name} ${item.price} ${item.currency}`.toLowerCase().includes(query.toLowerCase())), [packages, query]);

  const load = async () => {
    if (!supabase) return;
    setLoading(true); setError('');
    const { data, error: requestError } = await supabase.from('pricing_packages').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false });
    if (requestError) setError(requestError.message);
    setPackages(((data ?? []) as PricingPackage[]).map((item) => ({ ...item, groups: Array.isArray(item.groups) ? item.groups : [] })));
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const openCreate = () => {
    setCreating(true); setEditing(null); setError('');
    setForm({ ...emptyForm, sort_order: packages.length });
  };
  const openEdit = (item: PricingPackage) => {
    setEditing(item); setCreating(false); setError('');
    setForm({ name: item.name, price: item.price, currency: item.currency, billing_label: item.billing_label, tone: item.tone, popular: item.popular, groups: item.groups.length ? item.groups : emptyForm.groups, sort_order: item.sort_order });
  };
  const closeForm = () => { setCreating(false); setEditing(null); setError(''); };

  const save = async () => {
    if (!supabase) return;
    setSaving(true); setError('');
    const payload = { ...form, name: form.name.trim(), price: form.price.trim(), currency: form.currency.trim().toUpperCase(), billing_label: form.billing_label.trim() || 'Monthly', groups: form.groups.map((group) => ({ title: group.title.trim(), items: group.items.map((item) => item.trim()).filter(Boolean) })).filter((group) => group.title && group.items.length) };
    if (!payload.name || !payload.price || !payload.groups.length) { setError('Add a package name, price, and at least one feature group with an item.'); setSaving(false); return; }

    const request = editing
      ? supabase.from('pricing_packages').update(payload).eq('id', editing.id).select().single()
      : supabase.from('pricing_packages').insert(payload).select().single();
    const { data, error: requestError } = await request;
    if (requestError) setError(requestError.message); else {
      setPackages((current) => {
        if (editing) return current.map((item) => item.id === editing.id ? ({ ...(data as PricingPackage), groups: payload.groups }) : item).sort((a, b) => a.sort_order - b.sort_order);
        return [...current, { ...(data as PricingPackage), groups: payload.groups }].sort((a, b) => a.sort_order - b.sort_order);
      });
      closeForm();
    }
    setSaving(false);
  };

  const remove = async (item: PricingPackage) => {
    if (!supabase || !window.confirm(`Delete ${item.name} package?`)) return;
    const { error: requestError } = await supabase.from('pricing_packages').delete().eq('id', item.id);
    if (requestError) { setError(requestError.message); return; }
    setPackages((current) => current.filter((entry) => entry.id !== item.id));
  };

  const move = async (index: number, direction: -1 | 1) => {
    if (!supabase) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= packages.length) return;
    const current = packages[index], next = packages[nextIndex];
    const { error: firstError } = await supabase.from('pricing_packages').update({ sort_order: next.sort_order }).eq('id', current.id);
    if (firstError) { setError(firstError.message); return; }
    const { error: secondError } = await supabase.from('pricing_packages').update({ sort_order: current.sort_order }).eq('id', next.id);
    if (secondError) { setError(secondError.message); return; }
    await load();
  };

  const updateGroup = (groupIndex: number, patch: Partial<PricingGroup>) => setForm((current) => ({ ...current, groups: current.groups.map((group, index) => index === groupIndex ? { ...group, ...patch } : group) }));
  const addGroup = () => setForm((current) => ({ ...current, groups: [...current.groups, { title: 'New Section', items: [''] }] }));
  const removeGroup = (groupIndex: number) => setForm((current) => ({ ...current, groups: current.groups.filter((_, index) => index !== groupIndex) }));
  const addItem = (groupIndex: number) => setForm((current) => ({ ...current, groups: current.groups.map((group, index) => index === groupIndex ? { ...group, items: [...group.items, ''] } : group) }));
  const updateItem = (groupIndex: number, itemIndex: number, value: string) => setForm((current) => ({ ...current, groups: current.groups.map((group, index) => index === groupIndex ? { ...group, items: group.items.map((item, innerIndex) => innerIndex === itemIndex ? value : item) } : group) }));
  const removeItem = (groupIndex: number, itemIndex: number) => setForm((current) => ({ ...current, groups: current.groups.map((group, index) => index === groupIndex ? { ...group, items: group.items.filter((_, innerIndex) => innerIndex !== itemIndex) } : group) }));

  return (
    <section className="mt-10">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[#F14A0B] text-xs font-bold uppercase tracking-[0.2em]">Pricing CMS</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Packages & features.</h2>
          <p className="mt-2 text-sm text-[#F7F5F0]/45">Update prices, sections, features, highlighting, and order. Changes appear on the public pricing section.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => void load()} className={buttonClass}><RefreshCw size={15} /> Refresh</button>
          <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F14A0B] px-5 py-2.5 text-sm font-semibold text-[#111111]"><Plus size={15} /> Add package</button>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-3"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search packages..." className={inputClass} /></div>
      {error && <div role="alert" className="mb-6 border border-red-400/30 bg-red-400/5 p-4 text-sm text-red-200">{error}</div>}

      {loading ? <div className="border border-[#F7F5F0]/10 p-8 text-sm text-[#F7F5F0]/50">Loading packages...</div> : (
        <div className="grid gap-4 lg:grid-cols-3">
          {filtered.map((item, index) => (
            <article key={item.id} className="flex flex-col border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02] p-5 md:p-6">
              <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F14A0B]">{item.tone} {item.popular ? '· Most Popular' : ''}</p><h3 className="mt-2 text-2xl font-bold">{item.name}</h3></div><div className="text-right"><div className="text-3xl font-bold tracking-tight">{item.price}</div><div className="text-[10px] uppercase tracking-widest text-[#F7F5F0]/40">{item.currency} / {item.billing_label}</div></div></div>
              <div className="mt-6 space-y-4 flex-1">{item.groups.slice(0, 3).map((group) => <div key={group.title}><p className="text-[10px] uppercase tracking-widest text-[#F7F5F0]/40">{group.title}</p><p className="mt-2 text-xs leading-5 text-[#F7F5F0]/65">{group.items.slice(0, 3).join(' · ')}{group.items.length > 3 ? ` · +${group.items.length - 3} more` : ''}</p></div>)}{item.groups.length > 3 && <p className="text-xs text-[#F7F5F0]/35">+{item.groups.length - 3} more sections</p>}</div>
              <div className="mt-6 flex flex-wrap gap-2"><button onClick={() => openEdit(item)} className={buttonClass}><Pencil size={14} /> Edit</button><button onClick={() => void remove(item)} className={buttonClass}><Trash2 size={14} /> Delete</button><button disabled={index === 0} onClick={() => void move(packages.findIndex((entry) => entry.id === item.id), -1)} className={`${buttonClass} disabled:opacity-25`} aria-label="Move up"><ArrowUp size={14} /></button><button disabled={index === filtered.length - 1} onClick={() => void move(packages.findIndex((entry) => entry.id === item.id), 1)} className={`${buttonClass} disabled:opacity-25`} aria-label="Move down"><ArrowDown size={14} /></button></div>
            </article>
          ))}
        </div>
      )}

      {(creating || editing) && <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-sm md:py-10">
        <div className="w-full max-w-4xl border border-[#F7F5F0]/10 bg-[#111111] shadow-2xl">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#F7F5F0]/10 bg-[#111111] px-5 py-4 md:px-7"><div><p className="text-[10px] uppercase tracking-[0.2em] text-[#F14A0B]">{editing ? 'Edit package' : 'New package'}</p><h3 className="mt-1 text-xl font-bold">{editing ? editing.name : 'Create pricing package'}</h3></div><button onClick={closeForm} className="rounded-full p-2 text-[#F7F5F0]/60 hover:bg-[#F7F5F0]/10 hover:text-[#F7F5F0]"><X size={18} /></button></div>
          <div className="space-y-7 p-5 md:p-7">
            <div className="grid gap-4 md:grid-cols-4"><label className="md:col-span-2"><span className="mb-2 block text-[10px] uppercase tracking-widest text-[#F7F5F0]/45">Package name</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} /></label><label><span className="mb-2 block text-[10px] uppercase tracking-widest text-[#F7F5F0]/45">Price</span><input value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className={inputClass} /></label><label><span className="mb-2 block text-[10px] uppercase tracking-widest text-[#F7F5F0]/45">Currency</span><input value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })} className={inputClass} /></label><label><span className="mb-2 block text-[10px] uppercase tracking-widest text-[#F7F5F0]/45">Billing label</span><input value={form.billing_label} onChange={(event) => setForm({ ...form, billing_label: event.target.value })} className={inputClass} /></label><label><span className="mb-2 block text-[10px] uppercase tracking-widest text-[#F7F5F0]/45">Visual tone</span><select value={form.tone} onChange={(event) => setForm({ ...form, tone: event.target.value as FormState['tone'] })} className={inputClass}><option value="starter">Starter</option><option value="growth">Growth</option><option value="premium">Premium</option></select></label><label className="flex items-end"><span className="flex w-full items-center gap-3 rounded-xl border border-[#F7F5F0]/10 px-4 py-3 text-sm"><input type="checkbox" checked={form.popular} onChange={(event) => setForm({ ...form, popular: event.target.checked })} /> Most popular</span></label></div>

            <div><div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-[0.2em] text-[#F14A0B]">Features</p><h4 className="mt-1 font-semibold">Sections & included items</h4></div><button onClick={addGroup} className={buttonClass}><Plus size={14} /> Add section</button></div><div className="space-y-4">{form.groups.map((group, groupIndex) => <div key={`${groupIndex}-${group.title}`} className="border border-[#F7F5F0]/10 p-4"><div className="mb-4 flex gap-3"><input value={group.title} onChange={(event) => updateGroup(groupIndex, { title: event.target.value })} placeholder="Section title" className={inputClass} /><button onClick={() => removeGroup(groupIndex)} className="rounded-xl border border-[#F7F5F0]/10 px-3 text-[#F7F5F0]/55 hover:border-red-400/40 hover:text-red-200"><Trash2 size={15} /></button></div><div className="space-y-2">{group.items.map((item, itemIndex) => <div key={itemIndex} className="flex gap-2"><input value={item} onChange={(event) => updateItem(groupIndex, itemIndex, event.target.value)} placeholder="Feature included in this package" className={inputClass} /><button onClick={() => removeItem(groupIndex, itemIndex)} className="rounded-xl border border-[#F7F5F0]/10 px-3 text-[#F7F5F0]/55 hover:border-red-400/40 hover:text-red-200"><X size={15} /></button></div>)}</div><button onClick={() => addItem(groupIndex)} className="mt-3 text-xs font-semibold uppercase tracking-widest text-[#F14A0B]">+ Add feature</button></div>)}</div></div>

            <div className="flex flex-col-reverse gap-3 border-t border-[#F7F5F0]/10 pt-5 sm:flex-row sm:justify-end"><button onClick={closeForm} className={buttonClass}>Cancel</button><button disabled={saving} onClick={() => void save()} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F14A0B] px-6 py-3 text-sm font-semibold text-[#111111] disabled:opacity-50"><Save size={15} /> {saving ? 'Saving...' : 'Save package'}</button></div>
          </div>
        </div>
      </div>}
    </section>
  );
}
