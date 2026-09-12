import React, { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const FALLBACK_PROJECTS = [
  { id: 'p1', title: 'Aura Skincare', category: 'Brand Identity & E-commerce', image: 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=1600&auto=format&fit=crop', year: '2025' },
  { id: 'p2', title: 'Nexus Automotive', category: 'Global Campaign', image: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=1600&auto=format&fit=crop', year: '2025' },
  { id: 'p3', title: 'Lumina Tech', category: 'Digital Product', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1600&auto=format&fit=crop', year: '2024' },
  { id: 'p4', title: 'Kineo Architecture', category: 'Editorial Website', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop', year: '2026' },
];

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

type Project = { id: string; title: string; category: string; image: string; year: string };

export default function PortfolioPage({ navigate }: { navigate: (path: string) => void }) {
  const [projects, setProjects] = useState<Project[]>(FALLBACK_PROJECTS);

  useEffect(() => {
    let mounted = true;
    if (!supabase) return;
    supabase.from('portfolio_projects').select('id,title,category,image,year').order('created_at', { ascending: false }).then(({ data }) => {
      if (!mounted || !data?.length) return;
      setProjects(data as Project[]);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    document.title = 'Our Work | ZERO ONE';
    const description = 'Explore selected ZERO ONE projects across brand identity, campaigns and digital experiences.';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name', 'description'); document.head.appendChild(meta); }
    meta.setAttribute('content', description);
  }, []);

  return (
    <main className="w-full pt-40 pb-24 px-6 md:px-12 lg:px-24">
      <header className="max-w-4xl mb-20 md:mb-28">
        <p className="text-[#F14A0B] text-xs font-bold tracking-[0.2em] uppercase mb-6">ZERO ONE / Selected Work</p>
        <h1 className="text-6xl md:text-8xl lg:text-[9rem] font-bold tracking-tighter uppercase leading-none">Our Work.</h1>
        <p className="mt-8 text-xl md:text-2xl text-[#F7F5F0]/65 max-w-2xl font-light leading-relaxed">A focused selection of brand identities, campaigns and digital experiences. Open a project to see the thinking behind the work.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-20 md:gap-y-28 gap-x-8 lg:gap-x-16">
        {projects.map((project, index) => (
          <button key={project.id} type="button" onClick={() => navigate(`/work/${slugify(project.title)}`)} className={`group text-left ${index % 2 !== 0 ? 'md:mt-24' : ''}`} aria-label={`Open case study: ${project.title}`}>
            <div className="overflow-hidden bg-[#F7F5F0]/5 mb-6 aspect-[4/5] md:aspect-[3/4]">
              <img src={project.image} alt={project.title} loading={index < 2 ? 'eager' : 'lazy'} className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105 filter grayscale group-hover:grayscale-0" />
            </div>
            <div className="flex justify-between items-start gap-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight transition-colors group-hover:text-[#F14A0B]">{project.title}</h2>
                <p className="mt-2 text-[#F7F5F0]/55 tracking-wide uppercase text-sm font-medium">{project.category}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-[#F7F5F0]/40 font-mono text-sm">{project.year}</span>
                <span className="grid w-10 h-10 rounded-full border border-[#F7F5F0]/20 place-items-center group-hover:bg-[#F14A0B] group-hover:border-[#F14A0B] group-hover:text-[#111111] transition-all"><ArrowUpRight className="w-4 h-4" /></span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}
