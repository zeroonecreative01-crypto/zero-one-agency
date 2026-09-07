import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ArrowUpRight, Menu, X, CheckCircle2, MessageCircle } from 'lucide-react';

// ============================================================================
// 1. CONFIGURATION & DATA (CENTRALIZED FOR EASY EDITING)
// ============================================================================

const SITE_CONFIG = {
  name: 'ZERO ONE',
  whatsapp: '+201556764804',
  whatsappUrl: 'https://wa.me/201556764804',
  social: {
    linkedin: 'https://www.linkedin.com/in/zeroonemarkating/',
    instagram: 'https://www.instagram.com/zeroone.ai.creative/',
    facebook: 'https://www.facebook.com/zeroone.ai.creative',
    threads: 'https://www.threads.com/@zeroone.ai.creative',
    tiktok: 'https://www.tiktok.com/@zeroone.creative',
    x: 'https://x.com/zerooneaicrea',
    snapchat: 'zeroonecreative',
  },
  logoPath: '/ONE.png',
};

const PROJECTS = [
  {
    id: 'p1',
    title: 'Aura Skincare',
    category: 'Brand Identity & E-commerce',
    image: 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=1600&auto=format&fit=crop',
    year: '2025',
    featured: true // Makes it span full width in the grid
  },
  {
    id: 'p2',
    title: 'Nexus Automotive',
    category: 'Global Campaign',
    image: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=1600&auto=format&fit=crop',
    year: '2025',
    featured: false
  },
  {
    id: 'p3',
    title: 'Lumina Tech',
    category: 'Digital Product',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1600&auto=format&fit=crop',
    year: '2024',
    featured: false
  },
  {
    id: 'p4',
    title: 'Kineo Architecture',
    category: 'Editorial Website',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop',
    year: '2026',
    featured: true
  }
];

const SERVICES = [
  { num: '01', title: 'Brand Identity', desc: 'Crafting distinct visual and verbal systems that define how brands exist in the world. We build foundations designed for longevity and impact.' },
  { num: '02', title: 'Digital Platforms', desc: 'Designing high-performance websites and applications. We blend premium editorial aesthetics with seamless, conversion-driven user experiences.' },
  { num: '03', title: 'Campaign & Content', desc: 'Developing narrative-driven campaigns that capture attention. From creative direction and copywriting to full-scale production.' },
  { num: '04', title: 'Creative Strategy', desc: 'Positioning brands for the future. We analyze culture, market trends, and human behavior to find whitespace and strategic advantage.' }
];

// Client logos are discovered automatically from src/assets/clients/.
// Add/remove image files there and the marquee updates on the next build.
const clientLogoModules = import.meta.glob('./assets/clients/*.{png,jpg,jpeg,webp,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const CLIENT_LOGOS = Object.entries(clientLogoModules)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
  .map(([path, src], index) => ({ id: `${index}-${path}`, src }));

// ============================================================================
// 2. UTILITY COMPONENTS & HOOKS
// ============================================================================

// Custom lightweight router for client-side navigation without external deps (Updated to avoid History API restrictions)
const normalizePath = (value: string) => {
  const path = value.replace(/\/+$/, '');
  return path || '/';
};

const useRouter = () => {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (newPath: string) => {
    const next = normalizePath(newPath);
    if (next !== window.location.pathname) {
      window.history.pushState({}, '', next);
      setPath(next);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return { path, navigate };
};

// SEO Meta tag manager
const SEO = ({ title, description }: { title: string; description: string }) => {
  useEffect(() => {
    document.title = `${title} | ${SITE_CONFIG.name}`;
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);
  }, [title, description]);
  return null;
};

// Accessible & Responsive Scroll Reveal
const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    if (mediaQuery.matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        prefersReducedMotion ? '' : isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      } ${className}`}
      style={{ transitionDelay: prefersReducedMotion ? '0ms' : `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// Reusable Button Component
const Button = ({ children, primary = false, onClick, type = "button", disabled = false, className = "" }: any) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`group relative inline-flex items-center justify-center px-8 py-4 overflow-hidden rounded-full font-medium tracking-wide transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F14A0B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111] disabled:opacity-50 disabled:cursor-not-allowed
      ${primary 
        ? 'bg-[#F14A0B] text-[#111111] hover:bg-[#F7F5F0]' 
        : 'border border-[#F7F5F0]/20 text-[#F7F5F0] hover:bg-[#F7F5F0] hover:text-[#111111]'
      } ${className}`}
    >
      <span className="relative flex items-center gap-3">
        {children}
        <ArrowRight className={`w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 ${primary ? 'text-[#111111]' : ''}`} />
      </span>
    </button>
  );
};

// Logo Component
const Logo = ({ onClick, className = "h-10" }: { onClick?: () => void, className?: string }) => (
  <button 
    onClick={onClick}
    className="hover:opacity-80 transition-opacity flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F14A0B]"
    aria-label={`${SITE_CONFIG.name} Home`}
  >
    <img 
      src={SITE_CONFIG.logoPath} 
      alt={`${SITE_CONFIG.name} Logo`} 
      className={`w-auto object-contain ${className}`}
      onError={(e) => {
        // Fallback if ONE.png is missing in production
        e.currentTarget.style.display = 'none';
        e.currentTarget.parentElement!.innerHTML = `<span class="text-xl font-bold tracking-tighter">${SITE_CONFIG.name}</span>`;
      }}
    />
  </button>
);

// ============================================================================
// 3. PAGE COMPONENTS
// ============================================================================

const ClientMarquee = () => {
  if (!CLIENT_LOGOS.length) return null;

  const renderGroup = (groupLabel: string) => (
    <div className="client-marquee__group" aria-hidden={groupLabel === 'duplicate'}>
      {CLIENT_LOGOS.map((client) => (
        <div className="client-marquee__item" key={`${groupLabel}-${client.id}`}>
          <img
            src={client.src}
            alt={groupLabel === 'duplicate' ? '' : 'ZERO ONE client'}
            loading="lazy"
            draggable={false}
          />
        </div>
      ))}
    </div>
  );

  return (
    <section className="client-marquee-section" aria-label="Selected clients">
      <div className="px-6 md:px-12 lg:px-24">
        <FadeIn>
          <div className="client-marquee__header">
            <div className="flex items-center gap-4">
              <span className="client-marquee__index">01</span>
              <span className="client-marquee__rule" aria-hidden="true" />
              <span className="client-marquee__eyebrow">Selected Clients</span>
            </div>
            <span className="client-marquee__count">{String(CLIENT_LOGOS.length).padStart(2, '0')} Brands</span>
          </div>
        </FadeIn>
      </div>

      <div className="client-marquee" role="region" aria-label="Client logos">
        <div className="client-marquee__track">
          {renderGroup('primary')}
          {renderGroup('duplicate')}
        </div>
      </div>
    </section>
  );
};

const ScrollPhoneShowcase = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionPreference = () => setReducedMotion(mediaQuery.matches);
    handleMotionPreference();
    mediaQuery.addEventListener?.('change', handleMotionPreference);

    let frame = 0;
    const update = () => {
      frame = 0;
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const viewport = Math.max(window.innerHeight, 1);
      const travel = Math.max(section.offsetHeight - viewport, 1);
      const next = Math.min(1, Math.max(0, -rect.top / travel));
      setProgress(next);
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      mediaQuery.removeEventListener?.('change', handleMotionPreference);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const motion = reducedMotion ? 0.55 : progress;
  const phoneY = 180 - motion * 420;
  const phoneRotate = -10 + motion * 14;
  const phoneScale = 0.84 + motion * 0.14;
  const screenShift = 24 - motion * 72;
  const headlineX = -20 + motion * 20;

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[175vh] overflow-hidden bg-[#F7F5F0] text-[#111111]"
      aria-label="ZERO ONE digital experience showcase"
    >
      <div className="sticky top-0 min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(241,74,11,0.54),transparent_22%),radial-gradient(circle_at_76%_70%,rgba(241,74,11,0.20),transparent_24%)]" />
        <div className="absolute -left-40 top-1/2 h-[32rem] w-[32rem] -translate-y-1/2 rounded-full bg-[#F14A0B]/15 blur-3xl" />
        <div className="absolute -right-56 -top-32 h-[38rem] w-[38rem] rounded-full bg-[#F14A0B]/20 blur-3xl" />

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1600px] items-center px-6 py-24 md:px-12 lg:px-20">
          <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_360px_1fr] lg:gap-16">
            <div className="order-2 lg:order-1">
              <div className="mb-7 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#F14A0B]">
                <span className="font-mono">02</span>
                <span className="h-px w-10 bg-[#F14A0B]/60" />
                Digital Experience
              </div>
              <h2
                className="max-w-2xl text-5xl font-bold uppercase leading-[0.88] tracking-[-0.06em] sm:text-6xl md:text-7xl lg:text-[5.6rem]"
                style={{ transform: `translateX(${headlineX}px)` }}
              >
                The future of
                <br />
                <span className="text-[#F14A0B]">brand experience.</span>
              </h2>
              <p className="mt-8 max-w-lg text-base leading-7 text-[#111111]/65 md:text-lg">
                We design digital experiences that turn attention into interaction — and interaction into something people remember.
              </p>

              <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111111]/55">
                <span>Strategy</span>
                <span>UX / UI</span>
                <span>Art Direction</span>
                <span>Development</span>
              </div>
            </div>

            <div className="order-1 flex justify-center lg:order-2">
              <div className="relative h-[540px] w-[280px] sm:h-[650px] sm:w-[330px]">
                <div
                  className="absolute left-1/2 top-1/2 h-[510px] w-[270px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F14A0B]/35 blur-[60px]"
                  style={{ opacity: 0.4 + motion * 0.4, transform: `translate(-50%, -50%) scale(${0.7 + motion * 0.45})` }}
                />
                <div
                  className="absolute left-1/2 top-1/2 origin-center will-change-transform"
                  style={{ transform: `translate(-50%, calc(-50% + ${phoneY}px)) rotate(${phoneRotate}deg) scale(${phoneScale})` }}
                >
                  <div className="relative h-[510px] w-[258px] rounded-[42px] border-[6px] border-[#171717] bg-[#060606] p-[7px] shadow-[0_38px_95px_rgba(17,17,17,0.38)] sm:h-[620px] sm:w-[312px] sm:rounded-[50px]">
                    <div className="absolute left-1/2 top-2 z-30 h-7 w-28 -translate-x-1/2 rounded-full bg-[#050505]" />
                    <div className="relative h-full w-full overflow-hidden rounded-[33px] bg-[#F7F5F0] sm:rounded-[40px]">
                      <div className="absolute inset-x-0 top-0 h-[52%] bg-[#F14A0B]" />
                      <div className="absolute inset-x-0 bottom-0 h-[55%] bg-[#F7F5F0]" />

                      <div
                        className="absolute inset-x-0 top-0 px-5 pt-14 sm:px-6 sm:pt-16"
                        style={{ transform: `translateY(${screenShift}px)` }}
                      >
                        <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.16em] text-white/80">
                          <span>ZERO ONE</span>
                          <span>09:41</span>
                        </div>
                        <div className="mt-16 sm:mt-20">
                          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/65">Creative / Digital</p>
                          <p className="mt-2 text-[3.1rem] font-bold leading-[0.86] tracking-[-0.07em] text-white sm:text-[3.7rem]">
                            Move<br />people.
                          </p>
                        </div>

                        <div className="mt-8 space-y-3 sm:mt-10">
                          <div className="rounded-[20px] bg-white/95 p-4 shadow-[0_15px_35px_rgba(0,0,0,0.12)]">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[8px] font-semibold uppercase tracking-[0.15em] text-[#111111]/40">Featured</p>
                                <p className="mt-1 text-lg font-bold tracking-tight">Digital launch</p>
                              </div>
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111111] text-sm text-white">↗</span>
                            </div>
                            <div className="mt-5 grid grid-cols-3 gap-2">
                              <span className="h-12 rounded-lg bg-[#111111]/10" />
                              <span className="h-12 rounded-lg bg-[#F14A0B]" />
                              <span className="h-12 rounded-lg bg-[#111111]" />
                            </div>
                          </div>

                          <div className="rounded-[20px] bg-[#111111] p-4 text-white">
                            <p className="text-[8px] font-semibold uppercase tracking-[0.15em] text-white/40">Signal / 01</p>
                            <div className="mt-4 flex items-end justify-between">
                              <span className="text-3xl font-bold tracking-[-0.05em]">Clear.</span>
                              <span className="h-10 w-10 rounded-full border border-white/15 bg-[#F14A0B]" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="absolute inset-x-0 bottom-0 px-5 pb-6 sm:px-6 sm:pb-7">
                        <div className="flex items-center justify-between text-[8px] font-semibold uppercase tracking-[0.16em] text-[#111111]/40">
                          <span>Scroll</span>
                          <span className="font-mono text-[#F14A0B]">{String(Math.round(motion * 100)).padStart(2, '0')}</span>
                        </div>
                        <div className="mt-2 h-px w-full bg-[#111111]/10">
                          <div className="h-px bg-[#F14A0B] transition-[width] duration-150" style={{ width: `${Math.max(8, motion * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-3 lg:text-right">
              <div className="space-y-8 lg:ml-auto lg:max-w-sm">
                {[
                  ['01', 'Immersive', 'Interfaces that give brands a physical feeling on screen.'],
                  ['02', 'Intentional', 'Every transition, hierarchy, and interaction earns its place.'],
                  ['03', 'Memorable', 'Built to make the right impression long after the scroll.'],
                ].map(([num, title, copy]) => (
                  <div key={num} className="border-t border-[#111111]/15 pt-5">
                    <div className="flex items-start justify-between gap-5 lg:flex-row-reverse">
                      <span className="font-mono text-xs text-[#F14A0B]">{num}</span>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold uppercase tracking-tight">{title}</h3>
                        <p className="mt-2 text-sm leading-6 text-[#111111]/55">{copy}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-12 hidden items-center justify-end gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#111111]/35 lg:flex">
                <span>Scroll to explore</span>
                <span className="h-px w-12 bg-[#111111]/20" />
                <span className="font-mono text-[#F14A0B]">{String(Math.round(motion * 100)).padStart(2, '0')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Home = ({ navigate }: { navigate: (path: string) => void }) => (
  <div className="w-full">
    <SEO title="Creative Marketing Agency" description="We build brands, campaigns and digital experiences that make businesses impossible to ignore." />
    
    {/* HERO SECTION */}
    <section className="min-h-screen flex flex-col justify-center pt-32 pb-16 px-6 md:px-12 lg:px-24">
      <FadeIn delay={100}>
        <p className="text-[#F7F5F0]/60 text-xs md:text-sm font-semibold tracking-[0.2em] uppercase mb-8">
          Creative Agency — Est 2026
        </p>
      </FadeIn>
      <FadeIn delay={200}>
        <h1 className="text-[12vw] sm:text-7xl md:text-8xl lg:text-[10rem] leading-[0.85] font-bold tracking-tighter uppercase mb-12 max-w-[1200px]">
          We Build <br />
          Brands That <br />
          <span className="flex items-center gap-4 lg:gap-8">
            <span className="text-[#F14A0B]">Move</span>
            <span className="h-[2px] md:h-[4px] lg:h-[6px] flex-grow bg-[#F14A0B] hidden sm:block mt-2 lg:mt-6 max-w-[200px] lg:max-w-[400px]"></span>
          </span>
          People.
        </h1>
      </FadeIn>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mt-8 md:mt-20">
        <FadeIn delay={400} className="max-w-2xl">
          <p className="text-lg md:text-2xl text-[#F7F5F0]/80 font-light leading-relaxed">
            We build brands, campaigns, and digital experiences that make businesses impossible to ignore.
          </p>
        </FadeIn>
        <FadeIn delay={500}>
          <Button primary onClick={() => navigate('/work')}>View Our Work</Button>
        </FadeIn>
      </div>
    </section>

    <ClientMarquee />

    {/* SELECTED WORK (EDITORIAL GRID) */}
    <section className="py-24 md:py-32 px-6 md:px-12 lg:px-24 bg-[#111111]">
      <FadeIn>
        <div className="flex justify-between items-end mb-16 md:mb-24 border-b border-[#F7F5F0]/10 pb-8">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter">Selected Work</h2>
          <p className="text-[#F14A0B] hidden md:block text-sm font-mono tracking-widest uppercase">01 — 04</p>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 lg:gap-16">
        {PROJECTS.map((project, index) => (
          <div 
            key={project.id} 
            className={`group cursor-pointer ${project.featured ? 'md:col-span-12' : 'md:col-span-6'}`}
            onClick={() => navigate('/work')}
          >
            <FadeIn delay={index * 100}>
              <div className={`overflow-hidden bg-[#F7F5F0]/5 mb-6 ${project.featured ? 'aspect-[16/9] lg:aspect-[21/9]' : 'aspect-[4/5] md:aspect-[3/4]'}`}>
                <img 
                  src={project.image} 
                  alt={project.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105 filter grayscale group-hover:grayscale-0"
                />
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight transition-colors group-hover:text-[#F14A0B]">{project.title}</h3>
                  <p className="text-[#F7F5F0]/60 text-sm tracking-wide uppercase font-medium">{project.category}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[#F7F5F0]/40 font-mono text-sm hidden sm:block">{project.year}</span>
                  <div className="w-10 h-10 rounded-full border border-[#F7F5F0]/20 flex items-center justify-center group-hover:bg-[#F14A0B] group-hover:border-[#F14A0B] group-hover:text-[#111111] transition-all duration-300">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        ))}
      </div>
    </section>

    {/* STATEMENT SECTION */}
    <section className="py-32 md:py-48 px-6 md:px-12 lg:px-24 bg-[#F7F5F0] text-[#111111]">
       <FadeIn>
        <h2 className="text-4xl md:text-6xl lg:text-[5.5rem] font-bold tracking-tighter leading-[0.95] max-w-6xl uppercase">
          We don't make more noise. <br/>
          <span className="text-[#F14A0B]">We make better signals.</span>
        </h2>
        
        <div className="mt-16 md:mt-20 pt-10 border-t border-[#111111]/10 flex flex-col md:flex-row gap-8 md:items-end md:justify-between max-w-6xl">
          <p className="max-w-2xl text-base md:text-xl font-light leading-relaxed text-[#111111]/65">
            Strategy, identity, content and digital — one clear point of view, built to move people.
          </p>
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#111111]/50">
            <span className="h-2 w-2 rounded-full bg-[#F14A0B]" />
            Clarity over noise
          </div>
        </div>
       </FadeIn>
    </section>

    <ScrollPhoneShowcase />
  </div>
);

const Work = () => (
  <div className="w-full pt-40 pb-24 px-6 md:px-12 lg:px-24">
    <SEO title="Our Work" description="Explore our portfolio of premium brand identities and digital platforms." />
    <FadeIn>
      <h1 className="text-6xl md:text-8xl lg:text-[9rem] font-bold tracking-tighter uppercase leading-none mb-12">Our Work.</h1>
      <p className="text-xl md:text-2xl text-[#F7F5F0]/70 max-w-2xl mb-24 font-light">
        A selection of recent projects spanning digital platforms, brand identity, and creative strategy.
      </p>
    </FadeIn>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-24 gap-x-8 lg:gap-x-16">
      {PROJECTS.map((project, index) => (
        <FadeIn key={project.id} delay={index % 2 === 0 ? 0 : 200} className={`${index % 2 !== 0 ? 'md:mt-32' : ''}`}>
          <div className="group cursor-pointer">
             <div className="overflow-hidden bg-[#F7F5F0]/5 mb-6 aspect-[4/5] md:aspect-[3/4]">
                <img 
                  src={project.image} 
                  alt={project.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105 filter grayscale group-hover:grayscale-0"
                />
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-3xl font-bold mb-2 tracking-tight transition-colors group-hover:text-[#F14A0B]">{project.title}</h3>
                  <p className="text-[#F7F5F0]/60 tracking-wide uppercase text-sm font-medium">{project.category}</p>
                </div>
                <p className="text-[#F7F5F0]/40 font-mono text-sm">{project.year}</p>
              </div>
          </div>
        </FadeIn>
      ))}
    </div>
  </div>
);

const Services = () => (
  <div className="w-full pt-40 pb-24 px-6 md:px-12 lg:px-24">
    <SEO title="Services" description="Comprehensive creative solutions designed to elevate brands." />
    <FadeIn>
      <h1 className="text-6xl md:text-8xl lg:text-[9rem] font-bold tracking-tighter uppercase leading-none mb-12">Expertise.</h1>
      <p className="text-xl md:text-2xl text-[#F7F5F0]/70 max-w-2xl mb-24 font-light">
        We provide comprehensive creative solutions designed to elevate brands and drive measurable impact across every touchpoint.
      </p>
    </FadeIn>

    <div className="max-w-6xl">
      {SERVICES.map((service, index) => (
        <FadeIn key={index} delay={index * 100}>
          <div className="group border-t border-[#F7F5F0]/20 py-12 md:py-16 flex flex-col md:flex-row gap-6 md:gap-16 transition-colors duration-500 cursor-pointer">
            <span className="text-xl md:text-2xl text-[#F7F5F0]/40 group-hover:text-[#F14A0B] font-mono shrink-0 transition-colors">
              {service.num}
            </span>
            <div className="flex-grow">
              <h3 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight group-hover:text-[#F14A0B] transition-colors">{service.title}</h3>
              <p className="text-lg md:text-xl text-[#F7F5F0]/60 max-w-2xl leading-relaxed font-light">{service.desc}</p>
            </div>
            <div className="md:ml-auto opacity-0 group-hover:opacity-100 transform -translate-x-4 group-hover:translate-x-0 transition-all duration-500 flex items-center hidden md:flex">
               <ArrowRight className="w-10 h-10 text-[#F14A0B]" />
            </div>
          </div>
        </FadeIn>
      ))}
      <div className="border-t border-[#F7F5F0]/20"></div>
    </div>
  </div>
);

const About = () => (
  <div className="w-full pt-40 pb-24 px-6 md:px-12 lg:px-24">
    <SEO title="About Us" description="We are a collective of designers, strategists, and technologists building brands and digital experiences with intention." />
    <FadeIn>
      <h1 className="text-6xl md:text-8xl lg:text-[9rem] font-bold tracking-tighter uppercase leading-none mb-12">About Us.</h1>
    </FadeIn>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 mt-16 md:mt-24">
      <div className="lg:col-span-6 flex flex-col justify-center">
        <FadeIn delay={200}>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-8 leading-tight">
            Design driven by intention. Built for scale.
          </h2>
          <div className="space-y-6 text-[#F7F5F0]/70 text-lg md:text-xl font-light leading-relaxed">
            <p>
              Founded on the belief that aesthetics and performance are not mutually exclusive. We build digital experiences and brand identities that feel inevitable—designed with extreme intention and executed with precision.
            </p>
            <p>
              Our approach is highly collaborative, operating as an extension of our clients' teams rather than a traditional vendor. We favor honest communication, rigorous strategy, and impeccable craft over industry jargon.
            </p>
          </div>
        </FadeIn>
      </div>
      <div className="lg:col-span-6">
        <FadeIn delay={400}>
           <div className="aspect-[4/5] bg-[#F7F5F0]/5 overflow-hidden relative">
             <img 
               src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop" 
               alt="Studio Office"
               loading="lazy"
               className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-[1.5s]"
             />
             <div className="absolute inset-0 bg-black/10"></div>
           </div>
        </FadeIn>
      </div>
    </div>
  </div>
);

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', company: '', type: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    const text = [
      'ZERO ONE Project Inquiry',
      `Name: ${formData.name}`,
      `Email: ${formData.email}`,
      `Company: ${formData.company || 'Not provided'}`,
      `Project Type: ${formData.type || 'Not provided'}`,
      `Message: ${formData.message}`,
    ].join('\n');
    window.open(`${SITE_CONFIG.whatsappUrl}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    setStatus('success');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="w-full pt-40 pb-24 px-6 md:px-12 lg:px-24 flex flex-col min-h-screen">
      <SEO title="Contact" description="Ready to start a project? Get in touch with ZERO ONE." />
      <FadeIn>
        <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-bold tracking-tighter uppercase leading-none mb-16">
          Let's <br className="md:hidden" /><span className="text-[#F14A0B]">Make An Impact.</span>
        </h1>
      </FadeIn>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 mt-8">
        {/* Contact Form */}
        <div className="lg:col-span-7">
          <FadeIn delay={200}>
            {status === 'success' ? (
              <div className="bg-[#F7F5F0]/5 border border-[#F7F5F0]/20 p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
                <CheckCircle2 className="w-16 h-16 text-[#F14A0B] mb-6" />
                <h3 className="text-3xl font-bold mb-4 tracking-tight">Inquiry Received.</h3>
                <p className="text-[#F7F5F0]/70 text-lg">Thank you for reaching out. Our team will review your message and get back to you within 24-48 hours.</p>
                <Button className="mt-8" onClick={() => setStatus('idle')}>Send Another Message</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-semibold uppercase tracking-widest text-[#F7F5F0]/60">Name *</label>
                    <input required type="text" id="name" name="name" value={formData.name} onChange={handleChange} 
                      className="w-full bg-transparent border-b border-[#F7F5F0]/30 py-3 text-lg focus:border-[#F14A0B] focus:outline-none transition-colors placeholder:text-[#F7F5F0]/20" 
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-semibold uppercase tracking-widest text-[#F7F5F0]/60">Email *</label>
                    <input required type="email" id="email" name="email" value={formData.email} onChange={handleChange}
                      className="w-full bg-transparent border-b border-[#F7F5F0]/30 py-3 text-lg focus:border-[#F14A0B] focus:outline-none transition-colors placeholder:text-[#F7F5F0]/20" 
                      placeholder="jane@company.com"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label htmlFor="company" className="text-sm font-semibold uppercase tracking-widest text-[#F7F5F0]/60">Company</label>
                    <input type="text" id="company" name="company" value={formData.company} onChange={handleChange}
                      className="w-full bg-transparent border-b border-[#F7F5F0]/30 py-3 text-lg focus:border-[#F14A0B] focus:outline-none transition-colors placeholder:text-[#F7F5F0]/20" 
                      placeholder="Organization Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="type" className="text-sm font-semibold uppercase tracking-widest text-[#F7F5F0]/60">Project Type</label>
                    <select id="type" name="type" value={formData.type} onChange={handleChange}
                      className="w-full bg-transparent border-b border-[#F7F5F0]/30 py-3 text-lg focus:border-[#F14A0B] focus:outline-none transition-colors appearance-none cursor-pointer" 
                    >
                      <option value="" disabled className="bg-[#111111] text-[#F7F5F0]/50">Select an option</option>
                      <option value="brand" className="bg-[#111111]">Brand Identity</option>
                      <option value="digital" className="bg-[#111111]">Digital Platform / Website</option>
                      <option value="campaign" className="bg-[#111111]">Campaign & Content</option>
                      <option value="other" className="bg-[#111111]">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-semibold uppercase tracking-widest text-[#F7F5F0]/60">Message *</label>
                  <textarea required id="message" name="message" rows={4} value={formData.message} onChange={handleChange}
                    className="w-full bg-transparent border-b border-[#F7F5F0]/30 py-3 text-lg focus:border-[#F14A0B] focus:outline-none transition-colors resize-none placeholder:text-[#F7F5F0]/20" 
                    placeholder="Tell us about your project..."
                  />
                </div>

                <Button type="submit" primary disabled={status === 'submitting'} className="w-full md:w-auto mt-4">
                  {status === 'submitting' ? 'Sending...' : 'Submit Inquiry'}
                </Button>
              </form>
            )}
          </FadeIn>
        </div>

        {/* Contact Info Sidebar */}
        <div className="lg:col-span-4 lg:col-start-9 flex flex-col gap-12 mt-12 lg:mt-0">
          <FadeIn delay={400}>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[#F7F5F0]/60 mb-4">WhatsApp Business</h3>
            <a href={SITE_CONFIG.whatsappUrl} target="_blank" rel="noreferrer" className="text-2xl md:text-3xl font-bold hover:text-[#F14A0B] transition-colors inline-flex items-center gap-3 break-all">
              <MessageCircle className="w-7 h-7 shrink-0" />
              {SITE_CONFIG.whatsapp}
            </a>
          </FadeIn>

          <FadeIn delay={500}>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[#F7F5F0]/60 mb-6">Find ZERO ONE</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                ['Instagram', SITE_CONFIG.social.instagram],
                ['LinkedIn', SITE_CONFIG.social.linkedin],
                ['Facebook', SITE_CONFIG.social.facebook],
                ['Threads', SITE_CONFIG.social.threads],
                ['TikTok', SITE_CONFIG.social.tiktok],
                ['X', SITE_CONFIG.social.x],
              ].map(([label, href]) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" className="text-[#F7F5F0]/70 hover:text-[#F14A0B] transition-colors text-sm font-medium flex items-center gap-2">
                  {label}<ArrowUpRight size={14} />
                </a>
              ))}
              <span className="text-[#F7F5F0]/50 text-sm font-medium">Snapchat: {SITE_CONFIG.social.snapchat}</span>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
};

const NotFound = ({ navigate }: { navigate: (path: string) => void }) => (
  <div className="w-full min-h-screen flex flex-col items-center justify-center text-center px-6">
    <SEO title="404 Not Found" description="Page not found." />
    <h1 className="text-9xl font-bold tracking-tighter text-[#F14A0B] mb-4">404</h1>
    <h2 className="text-3xl font-bold mb-8">Page Not Found</h2>
    <p className="text-[#F7F5F0]/60 mb-12 max-w-md">The page you are looking for doesn't exist or has been moved.</p>
    <Button onClick={() => navigate('/')}>Return Home</Button>
  </div>
);

// ============================================================================
// 4. MAIN APP CONTAINER (LAYOUT & ROUTING)
// ============================================================================

export default function App() {
  const { path, navigate } = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [path]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; }
  }, [isMenuOpen]);

  const navLinks = [
    { id: '/work', label: 'Work' },
    { id: '/services', label: 'Services' },
    { id: '/about', label: 'About' },
  ];

  const renderPage = () => {
    switch (path) {
      case '/': return <Home navigate={navigate} />;
      case '/work': return <Work />;
      case '/services': return <Services />;
      case '/about': return <About />;
      case '/contact': return <Contact />;
      default: return <NotFound navigate={navigate} />;
    }
  };

  return (
    <>
      <style>{`
        /* Global Reset & Typography Polish */
        :root { color-scheme: dark; }
        ::selection { background-color: #F14A0B; color: #111111; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #111111; }
        ::-webkit-scrollbar-thumb { background: #333; }
        ::-webkit-scrollbar-thumb:hover { background: #F14A0B; }
        html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }
        body { background-color: #111111; color: #F7F5F0; }
      `}</style>

      <div className="min-h-screen font-sans flex flex-col relative">
        
        {/* TOP NAVIGATION */}
        <nav className="fixed top-0 left-0 w-full z-50 bg-[#111111]/80 backdrop-blur-xl border-b border-[#F7F5F0]/5 transition-all duration-300">
          <div className="flex items-center justify-between px-6 md:px-12 lg:px-24 h-20 md:h-24">
            
            <Logo onClick={() => navigate('/')} />

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-12 absolute left-1/2 -translate-x-1/2">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => navigate(link.id)}
                  className={`text-xs font-bold uppercase tracking-[0.15em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F14A0B] rounded-sm ${
                    path === link.id ? 'text-[#F14A0B]' : 'text-[#F7F5F0]/80 hover:text-[#F7F5F0]'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:block">
               <button 
                  onClick={() => navigate('/contact')}
                  className="px-6 py-3 bg-[#F7F5F0] hover:bg-[#F14A0B] text-[#111111] rounded-full text-xs font-bold uppercase tracking-[0.1em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F14A0B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]"
               >
                 Start a Project
               </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden text-[#F7F5F0] hover:text-[#F14A0B] transition-colors z-50 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F14A0B]"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close Menu" : "Open Menu"}
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </nav>

        {/* MOBILE FULLSCREEN MENU */}
        <div 
          className={`fixed inset-0 bg-[#111111] z-40 flex flex-col justify-center px-8 transition-all duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] md:hidden ${
            isMenuOpen ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'
          }`}
        >
          <div className="flex flex-col gap-8">
            {[...navLinks, { id: '/contact', label: 'Contact' }].map((link, i) => (
              <button
                key={link.id}
                onClick={() => navigate(link.id)}
                style={{ transitionDelay: isMenuOpen ? `${i * 100}ms` : '0ms' }}
                className={`text-5xl font-bold uppercase tracking-tighter text-left transition-all duration-500 transform ${
                  isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                } ${path === link.id ? 'text-[#F14A0B]' : 'text-[#F7F5F0]'}`}
              >
                {link.label}
              </button>
            ))}
          </div>
          
          <div 
             className={`mt-16 pt-8 border-t border-[#F7F5F0]/10 flex flex-col gap-4 transition-all duration-700 delay-300 transform ${isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
          >
             <p className="text-sm font-bold uppercase tracking-widest text-[#F14A0B]">Get in touch</p>
             <a href={SITE_CONFIG.whatsappUrl} target="_blank" rel="noreferrer" className="text-xl font-light hover:text-[#F14A0B] transition-colors">WhatsApp — {SITE_CONFIG.whatsapp}</a>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <main className="flex-grow flex flex-col">
          {renderPage()}
        </main>

        {/* FOOTER */}
        <footer className="w-full bg-[#111111] pt-24 pb-12 px-6 md:px-12 lg:px-24">
          {/* Pre-footer CTA */}
          <div className="mb-24 pb-24 border-b border-[#F7F5F0]/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
             <h2 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase">
               Ready to <br className="hidden md:block"/> make your mark?
             </h2>
             <Button primary onClick={() => navigate('/contact')}>Let's Talk</Button>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start gap-16 mb-24">
            <div className="max-w-sm">
              <Logo onClick={() => navigate('/')} className="h-12 mb-8 opacity-90" />
              <p className="text-[#F7F5F0]/60 font-light leading-relaxed">
                A creative marketing agency designing brands, campaigns, and digital platforms for the future.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-16 md:gap-24">
              <div className="flex flex-col gap-4">
                <h4 className="font-bold text-[#F14A0B] uppercase tracking-widest text-xs mb-4">Sitemap</h4>
                <button onClick={() => navigate('/')} className="text-[#F7F5F0]/70 hover:text-[#F7F5F0] transition-colors text-left text-sm font-medium">Home</button>
                <button onClick={() => navigate('/work')} className="text-[#F7F5F0]/70 hover:text-[#F7F5F0] transition-colors text-left text-sm font-medium">Work</button>
                <button onClick={() => navigate('/services')} className="text-[#F7F5F0]/70 hover:text-[#F7F5F0] transition-colors text-left text-sm font-medium">Services</button>
                <button onClick={() => navigate('/about')} className="text-[#F7F5F0]/70 hover:text-[#F7F5F0] transition-colors text-left text-sm font-medium">About</button>
                <button onClick={() => navigate('/contact')} className="text-[#F7F5F0]/70 hover:text-[#F7F5F0] transition-colors text-left text-sm font-medium">Contact</button>
              </div>
              <div className="flex flex-col gap-4">
                <h4 className="font-bold text-[#F14A0B] uppercase tracking-widest text-xs mb-4">Social</h4>
                <a href={SITE_CONFIG.social.instagram} target="_blank" rel="noreferrer" className="text-[#F7F5F0]/70 hover:text-[#F7F5F0] transition-colors flex items-center gap-2 text-sm font-medium">Instagram <ArrowUpRight size={14}/></a>
                <a href={SITE_CONFIG.social.linkedin} target="_blank" rel="noreferrer" className="text-[#F7F5F0]/70 hover:text-[#F7F5F0] transition-colors flex items-center gap-2 text-sm font-medium">LinkedIn <ArrowUpRight size={14}/></a>
                <a href={SITE_CONFIG.social.facebook} target="_blank" rel="noreferrer" className="text-[#F7F5F0]/70 hover:text-[#F7F5F0] transition-colors flex items-center gap-2 text-sm font-medium">Facebook <ArrowUpRight size={14}/></a>
                <a href={SITE_CONFIG.social.threads} target="_blank" rel="noreferrer" className="text-[#F7F5F0]/70 hover:text-[#F7F5F0] transition-colors flex items-center gap-2 text-sm font-medium">Threads <ArrowUpRight size={14}/></a>
                <a href={SITE_CONFIG.social.tiktok} target="_blank" rel="noreferrer" className="text-[#F7F5F0]/70 hover:text-[#F7F5F0] transition-colors flex items-center gap-2 text-sm font-medium">TikTok <ArrowUpRight size={14}/></a>
                <a href={SITE_CONFIG.social.x} target="_blank" rel="noreferrer" className="text-[#F7F5F0]/70 hover:text-[#F7F5F0] transition-colors flex items-center gap-2 text-sm font-medium">X <ArrowUpRight size={14}/></a>
                <span className="text-[#F7F5F0]/50 text-sm font-medium">Snapchat: {SITE_CONFIG.social.snapchat}</span>
              </div>
              <div className="flex flex-col gap-4">
                 <h4 className="font-bold text-[#F14A0B] uppercase tracking-widest text-xs mb-4">Contact</h4>
                 <a href={SITE_CONFIG.whatsappUrl} target="_blank" rel="noreferrer" className="text-[#F7F5F0]/70 hover:text-[#F7F5F0] transition-colors text-sm font-medium">WhatsApp</a>
                 <span className="text-[#F7F5F0]/50 text-sm font-medium">{SITE_CONFIG.whatsapp}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-[#F7F5F0]/10 text-xs font-semibold uppercase tracking-widest text-[#F7F5F0]/40">
            <p>&copy; {new Date().getFullYear()} {SITE_CONFIG.name}. All rights reserved.</p>
            <div className="flex gap-8">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}