import { useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
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

const navigate = (path: string) => {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

function PortfolioGrid({ projects, mode }: { projects: Project[]; mode: 'home' | 'work' }) {
  const visibleProjects = mode === 'home' ? projects.slice(0, 4) : projects;

  return (
    <div className={mode === 'home' ? 'grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 lg:gap-16' : 'grid grid-cols-1 md:grid-cols-2 gap-y-24 gap-x-8 lg:gap-x-16'}>
      {visibleProjects.map((project, index) => (
        <div
          key={project.id}
          className={mode === 'home'
            ? `group cursor-pointer ${project.featured ? 'md:col-span-12' : 'md:col-span-6'}`
            : `group cursor-pointer ${index % 2 !== 0 ? 'md:mt-32' : ''}`}
          onClick={() => navigate('/work')}
        >
          <div className={`overflow-hidden bg-[#F7F5F0]/5 mb-6 ${mode === 'home'
            ? project.featured ? 'aspect-[16/9] lg:aspect-[21/9]' : 'aspect-[4/5] md:aspect-[3/4]'
            : 'aspect-[4/5] md:aspect-[3/4]'} `}>
            <img
              src={project.image}
              alt={project.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105 filter grayscale group-hover:grayscale-0"
            />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <h3 className={`${mode === 'home' ? 'text-2xl md:text-3xl' : 'text-3xl'} font-bold mb-2 tracking-tight transition-colors group-hover:text-[#F14A0B]`}>
                {project.title}
              </h3>
              <p className="text-[#F7F5F0]/60 tracking-wide uppercase text-sm font-medium">{project.category}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[#F7F5F0]/40 font-mono text-sm hidden sm:block">{project.year ?? ''}</span>
              {mode === 'home' ? (
                <div className="w-10 h-10 rounded-full border border-[#F7F5F0]/20 flex items-center justify-center group-hover:bg-[#F14A0B] group-hover:border-[#F14A0B] group-hover:text-[#111111] transition-all duration-300">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RemotePortfolioSync() {
  const [path, setPath] = useState(() => window.location.pathname.replace(/\/+$/, '') || '/');
  const [projects, setProjects] = useState<Project[] | null>(null);

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
    if (!projects || (path !== '/' && path !== '/work')) return;

    let host: HTMLElement | null = null;
    let root: Root | null = null;

    const sync = () => {
      const heading = Array.from(document.querySelectorAll('h1, h2')).find((element) => {
        const text = element.textContent?.trim();
        return path === '/' ? text === 'Selected Work' : text === 'Our Work.';
      });
      const section = heading?.closest('section');
      const grid = section?.querySelector(':scope > div.grid') as HTMLElement | null;
      if (!grid) return;

      if (host && host.isConnected && host.dataset.sourceGrid === getGridKey(grid)) return;

      root?.unmount();
      host?.remove();

      host = document.createElement('div');
      host.dataset.sourceGrid = getGridKey(grid);
      grid.insertAdjacentElement('afterend', host);
      grid.style.display = 'none';
      root = createRoot(host);
      root.render(<PortfolioGrid projects={projects} mode={path === '/' ? 'home' : 'work'} />);
    };

    const getGridKey = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return `${element.tagName}-${rect.top}-${element.className}`;
    };

    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    const timer = window.setTimeout(sync, 0);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      root?.unmount();
      host?.remove();
    };
  }, [path, projects]);

  return null;
}
