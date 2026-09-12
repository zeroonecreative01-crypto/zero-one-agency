import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Project = {
  id: string;
  title: string;
  category: string;
  image: string;
  year: string | null;
  featured: boolean;
  sort_order: number;
};

const normalizeSlug = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const navigate = (path: string) => {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

function PortfolioGrid({ projects, mode }: { projects: Project[]; mode: 'home' | 'work' }) {
  const visibleProjects = mode === 'home' ? projects.slice(0, 4) : projects;
  return (
    <div className={mode === 'home' ? 'grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-12 lg:gap-16' : 'grid grid-cols-1 gap-x-8 gap-y-24 md:grid-cols-2 lg:gap-x-16'}>
      {visibleProjects.map((project, index) => (
        <button
          key={project.id}
          type="button"
          className={`group block w-full cursor-pointer text-left ${mode === 'home' ? (project.featured ? 'md:col-span-12' : 'md:col-span-6') : index % 2 !== 0 ? 'md:mt-32' : ''}`}
          onClick={() => navigate(`/work/${normalizeSlug(project.title)}`)}
          aria-label={`View ${project.title} case study`}
        >
          <div className={`mb-6 overflow-hidden bg-[#F7F5F0]/5 ${mode === 'home' ? project.featured ? 'aspect-[16/9] lg:aspect-[21/9]' : 'aspect-[4/5] md:aspect-[3/4]' : 'aspect-[4/5] md:aspect-[3/4]'}`}>
            <img src={project.image} alt={project.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105 filter grayscale group-hover:grayscale-0" />
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h3 className={`${mode === 'home' ? 'text-2xl md:text-3xl' : 'text-3xl'} mb-2 font-bold tracking-tight transition-colors group-hover:text-[#F14A0B]`}>{project.title}</h3>
              <p className="text-sm font-medium uppercase tracking-wide text-[#F7F5F0]/60">{project.category}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden font-mono text-sm text-[#F7F5F0]/40 sm:block">{project.year ?? ''}</span>
              {mode === 'home' && <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F7F5F0]/20 transition-all duration-300 group-hover:border-[#F14A0B] group-hover:bg-[#F14A0B] group-hover:text-[#111111]"><ArrowUpRight className="h-4 w-4" /></span>}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export default function RemotePortfolioSync() {
  const [path, setPath] = useState(() => window.location.pathname.replace(/\/+$/, '') || '/');
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [mount, setMount] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const onNavigate = () => setPath(window.location.pathname.replace(/\/+$/, '') || '/');
    window.addEventListener('popstate', onNavigate);
    return () => window.removeEventListener('popstate', onNavigate);
  }, []);

  useEffect(() => {
    if (!supabase || (path !== '/' && path !== '/work')) return;
    let active = true;
    supabase
      .from('portfolio_projects')
      .select('id,title,category,image,year,featured,sort_order')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (active) setProjects((data ?? []) as Project[]);
      });
    return () => { active = false; };
  }, [path]);

  useEffect(() => {
    setMount(null);
    if (!projects?.length || (path !== '/' && path !== '/work')) return;

    let cancelled = false;
    let host: HTMLDivElement | null = null;
    let frame = 0;
    let attempts = 0;

    const attach = () => {
      if (cancelled) return;
      const heading = Array.from(document.querySelectorAll('h1, h2')).find((element) => element.textContent?.trim() === (path === '/' ? 'Selected Work' : 'Our Work.'));
      const section = heading?.closest('section');
      const grid = section?.querySelector(':scope > div.grid') as HTMLElement | null;
      if (!grid) {
        if (attempts++ < 30) frame = window.setTimeout(attach, 100);
        return;
      }

      host = document.createElement('div');
      host.setAttribute('data-remote-portfolio', 'true');
      grid.insertAdjacentElement('afterend', host);
      grid.hidden = true;
      setMount(host);
    };

    frame = window.setTimeout(attach, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(frame);
      setMount(null);
      if (host) host.remove();
      const heading = Array.from(document.querySelectorAll('h1, h2')).find((element) => element.textContent?.trim() === (path === '/' ? 'Selected Work' : 'Our Work.'));
      const section = heading?.closest('section');
      const grid = section?.querySelector(':scope > div.grid') as HTMLElement | null;
      if (grid) grid.hidden = false;
    };
  }, [path, projects]);

  if (!mount || !projects?.length) return null;
  return createPortal(<PortfolioGrid projects={projects} mode={path === '/' ? 'home' : 'work'} />, mount);
}
