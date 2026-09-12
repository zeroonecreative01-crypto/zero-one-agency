import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Project = {
  id: string;
  title: string;
  category: string;
  image: string;
  year: string | null;
};

const FALLBACK_PROJECTS: Project[] = [
  { id: 'p1', title: 'Aura Skincare', category: 'Brand Identity & E-commerce', image: 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=2000&auto=format&fit=crop', year: '2025' },
  { id: 'p2', title: 'Nexus Automotive', category: 'Global Campaign', image: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=2000&auto=format&fit=crop', year: '2025' },
  { id: 'p3', title: 'Lumina Tech', category: 'Digital Product', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2000&auto=format&fit=crop', year: '2024' },
  { id: 'p4', title: 'Kineo Architecture', category: 'Editorial Website', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000&auto=format&fit=crop', year: '2026' },
];

function normalizeSlug(value: string) {
  return decodeURIComponent(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function slugForProject(project: Project) {
  return normalizeSlug(project.title);
}

export default function CaseStudyPage({ slug, navigate }: { slug: string; navigate: (path: string) => void }) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (supabase) {
        const { data } = await supabase
          .from('portfolio_projects')
          .select('id,title,category,image,year')
          .order('sort_order', { ascending: true });
        const remote = (data ?? []) as Project[];
        const match = remote.find((item) => slugForProject(item) === normalizeSlug(slug) || item.id === slug);
        if (active && match) {
          setProject(match);
          setLoading(false);
          return;
        }
      }
      const fallback = FALLBACK_PROJECTS.find((item) => slugForProject(item) === normalizeSlug(slug) || item.id === slug) ?? null;
      if (active) {
        setProject(fallback);
        setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    if (project) document.title = `${project.title} — ZERO ONE`;
  }, [project]);

  if (loading) {
    return <main className="min-h-screen bg-[#111111] px-6 py-32 text-[#F7F5F0] md:px-12 lg:px-24"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F14A0B]">ZERO ONE / Work</p><p className="mt-6 text-sm text-[#F7F5F0]/45">Loading case study...</p></main>;
  }

  if (!project) {
    return <main className="min-h-screen bg-[#111111] px-6 py-32 text-[#F7F5F0] md:px-12 lg:px-24"><button onClick={() => navigate('/work')} className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.15em] text-[#F7F5F0]/60 hover:text-[#F14A0B]"><ArrowLeft size={16} /> Back to work</button><h1 className="mt-20 text-6xl font-bold tracking-tighter md:text-8xl">Project not found.</h1><p className="mt-6 max-w-xl text-lg text-[#F7F5F0]/50">This project may have been removed or is not published yet.</p></main>;
  }

  return (
    <main className="min-h-screen bg-[#111111] text-[#F7F5F0]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8 md:px-12 lg:px-16">
        <button onClick={() => navigate('/work')} className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.15em] text-[#F7F5F0]/60 transition hover:text-[#F14A0B]"><ArrowLeft size={16} /> Back to work</button>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#F14A0B]">ZERO ONE / Case Study</span>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-16 pt-16 md:px-12 md:pt-24 lg:px-16 lg:pb-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F14A0B]">{project.category}</p><h1 className="mt-5 text-6xl font-bold leading-[0.9] tracking-tighter md:text-8xl lg:text-[8rem]">{project.title}.</h1></div>
          <div className="border-t border-[#F7F5F0]/10 pt-5 text-sm text-[#F7F5F0]/50"><div className="flex justify-between gap-6"><span>Year</span><span className="font-mono text-[#F7F5F0]/80">{project.year ?? '—'}</span></div><div className="mt-3 flex justify-between gap-6"><span>Scope</span><span className="max-w-[180px] text-right text-[#F7F5F0]/80">{project.category}</span></div></div>
        </div>
      </section>

      <section className="px-6 md:px-12 lg:px-16"><div className="mx-auto max-w-7xl overflow-hidden bg-[#F7F5F0]/5"><img src={project.image} alt={project.title} className="aspect-[16/10] w-full object-cover" fetchPriority="high" /></div></section>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:px-12 md:py-28 lg:grid-cols-[0.8fr_1.2fr] lg:px-16">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F14A0B]">The Work</p><h2 className="mt-4 text-4xl font-bold tracking-tighter md:text-6xl">Built with one clear point of view.</h2></div>
        <div className="space-y-6 text-base leading-8 text-[#F7F5F0]/60 md:text-lg"><p>{project.title} is a selected ZERO ONE project across {project.category.toLowerCase()}.</p><p>We combine strategy, visual direction and digital craft into focused systems designed to make the brand easier to understand, remember and choose.</p><p>The full project story can be expanded here with the final approved case-study narrative, deliverables and measurable outcomes.</p></div>
      </section>

      <section className="border-t border-[#F7F5F0]/10 px-6 py-16 md:px-12 lg:px-16"><div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F14A0B]">Next move</p><h2 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">Have a project in mind?</h2></div><a href="https://wa.me/201556764804?text=Hi%20ZERO%20ONE%2C%20I%27d%20like%20to%20discuss%20a%20project." target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-3 rounded-full bg-[#F14A0B] px-7 py-4 font-semibold text-[#111111] transition hover:scale-[1.02]">Start a conversation <ArrowRight size={17} /></a></div></section>
    </main>
  );
}
