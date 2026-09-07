import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Project = {
  id: string;
  title: string;
  category: string;
  image: string;
  year: string | null;
  featured: boolean;
  sort_order: number;
  created_at: string;
};

type FormState = Omit<Project, 'id' | 'created_at'>;

const emptyForm: FormState = { title: '', category: '', image: '', year: '', featured: false, sort_order: 0 };

export default function PortfolioPanel() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const loadProjects = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase
      .from('portfolio_projects')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (queryError) setError(queryError.message);
    setProjects((data ?? []) as Project[]);
    setLoading(false);
  }, []);

  useEffect(() => { void loadProjects(); }, [loadProjects]);

  const filteredProjects = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return projects;
    return projects.filter((project) => `${project.title} ${project.category} ${project.year ?? ''}`.toLowerCase().includes(normalized));
  }, [projects, query]);

  const saveProject = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setError('');
    const payload = { ...form, title: form.title.trim(), category: form.category.trim(), image: form.image.trim(), year: form.year?.trim() || null };
    const result = editingId
      ? await supabase.from('portfolio_projects').update(payload).eq('id', editingId)
      : await supabase.from('portfolio_projects').insert(payload);
    if (result.error) setError(result.error.message);
    else { setForm(emptyForm); setEditingId(null); await loadProjects(); }
    setSaving(false);
  };

  const editProject = (project: Project) => {
    setEditingId(project.id);
    setForm({ title: project.title, category: project.category, image: project.image, year: project.year ?? '', featured: project.featured, sort_order: project.sort_order });
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const deleteProject = async (project: Project) => {
    if (!supabase || !window.confirm(`Delete “${project.title}”?`)) return;
    const { error: deleteError } = await supabase.from('portfolio_projects').delete().eq('id', project.id);
    if (deleteError) setError(deleteError.message);
    else setProjects((current) => current.filter((item) => item.id !== project.id));
  };

  const move = async (project: Project, direction: -1 | 1) => {
    if (!supabase) return;
    const index = projects.findIndex((item) => item.id === project.id);
    const target = projects[index + direction];
    if (!target) return;
    await Promise.all([
      supabase.from('portfolio_projects').update({ sort_order: target.sort_order }).eq('id', project.id),
      supabase.from('portfolio_projects').update({ sort_order: project.sort_order }).eq('id', target.id),
    ]);
    await loadProjects();
  };

  return (
    <section className="mt-16 border-t border-[#F7F5F0]/10 pt-16">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F14A0B]">Portfolio CMS</p><h2 className="mt-2 text-3xl font-bold tracking-tight">Manage work.</h2></div>
        <div className="flex gap-3">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects" className="w-full sm:w-56 rounded-full border border-[#F7F5F0]/15 bg-transparent px-5 py-3 text-sm outline-none focus:border-[#F14A0B]" />
          <button onClick={() => void loadProjects()} className="inline-flex items-center gap-2 rounded-full border border-[#F7F5F0]/15 px-4 py-3 text-sm font-semibold hover:bg-[#F7F5F0] hover:text-[#111111]"><RefreshCw size={15}/> Refresh</button>
        </div>
      </div>

      {error && <div role="alert" className="mb-6 border border-red-400/30 bg-red-400/5 p-4 text-sm text-red-200">{error}</div>}

      {loading ? <div className="border border-[#F7F5F0]/10 p-10 text-center text-sm uppercase tracking-[0.2em] text-[#F7F5F0]/40">Loading portfolio...</div> : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredProjects.map((project, index) => (
            <article key={project.id} className="overflow-hidden border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02]">
              <div className="aspect-[16/10] overflow-hidden bg-[#F7F5F0]/5"><img src={project.image} alt="" className="h-full w-full object-cover" /></div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4"><div><h3 className="text-xl font-bold">{project.title}</h3><p className="mt-1 text-sm text-[#F7F5F0]/50">{project.category} {project.year ? `· ${project.year}` : ''}</p></div>{project.featured && <span className="rounded-full border border-[#F14A0B]/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#F14A0B]">Featured</span>}</div>
                <div className="mt-5 flex flex-wrap gap-2"><button onClick={() => editProject(project)} className="inline-flex items-center gap-2 rounded-full border border-[#F7F5F0]/15 px-4 py-2 text-sm font-semibold hover:bg-[#F7F5F0] hover:text-[#111111]"><Pencil size={14}/> Edit</button><button onClick={() => void move(project, -1)} disabled={index === 0} className="rounded-full border border-[#F7F5F0]/15 px-3 py-2 text-sm disabled:opacity-30">↑</button><button onClick={() => void move(project, 1)} disabled={index === projects.length - 1} className="rounded-full border border-[#F7F5F0]/15 px-3 py-2 text-sm disabled:opacity-30">↓</button><button onClick={() => void deleteProject(project)} className="inline-flex items-center gap-2 rounded-full border border-red-400/20 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-400/10"><Trash2 size={14}/> Delete</button></div>
              </div>
            </article>
          ))}
        </div>
      )}

      <form onSubmit={saveProject} className="mt-8 border border-[#F7F5F0]/10 p-6 md:p-8">
        <div className="flex items-center justify-between mb-6"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F14A0B]">{editingId ? 'Edit project' : 'New project'}</p><h3 className="mt-2 text-2xl font-bold">{editingId ? 'Update project.' : 'Add to portfolio.'}</h3></div>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="rounded-full border border-[#F7F5F0]/15 p-2"><X size={16}/></button>}</div>
        <div className="grid gap-5 md:grid-cols-2">
          {[['title','Title'],['category','Category'],['image','Image URL'],['year','Year']].map(([key,label]) => <label key={key} className="block"><span className="mb-2 block text-xs uppercase tracking-widest text-[#F7F5F0]/45">{label}</span><input required={key !== 'year'} value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-full rounded-xl border border-[#F7F5F0]/15 bg-transparent px-4 py-3 outline-none focus:border-[#F14A0B]" /></label>)}
          <label className="flex items-center gap-3 md:col-span-2"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> <span className="text-sm">Featured project</span></label>
        </div>
        <button disabled={saving} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#F14A0B] px-6 py-3 font-semibold text-[#111111] disabled:opacity-50"><Plus size={16}/>{saving ? 'Saving...' : editingId ? 'Update Project' : 'Add Project'}</button>
      </form>
    </section>
  );
}
