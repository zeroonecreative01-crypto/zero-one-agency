import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, CheckCircle2, Menu, MessageCircle, X } from 'lucide-react';

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
  { id: 'p1', title: 'Aura Skincare', category: 'Brand Identity & E-commerce', image: 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=1600&auto=format&fit=crop', year: '2025', featured: true },
  { id: 'p2', title: 'Nexus Automotive', category: 'Global Campaign', image: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=1600&auto=format&fit=crop', year: '2025', featured: false },
  { id: 'p3', title: 'Lumina Tech', category: 'Digital Product', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1600&auto=format&fit=crop', year: '2024', featured: false },
  { id: 'p4', title: 'Kineo Architecture', category: 'Editorial Website', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop', year: '2026', featured: true },
];

const SERVICES = [
  { num: '01', title: 'Brand Identity', desc: 'Crafting distinct visual and verbal systems that define how brands exist in the world. We build foundations designed for longevity and impact.' },
  { num: '02', title: 'Digital Platforms', desc: 'Designing high-performance websites and applications. We blend premium editorial aesthetics with seamless, conversion-driven user experiences.' },
  { num: '03', title: 'Campaign & Content', desc: 'Developing narrative-driven campaigns that capture attention. From creative direction and copywriting to full-scale production.' },
  { num: '04', title: 'Creative Strategy', desc: 'Positioning brands for the future. We analyze culture, market trends, and human behavior to find whitespace and strategic advantage.' },
];

const clientLogoModules = import.meta.glob('./assets/clients/*.{png,jpg,jpeg,webp,svg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const CLIENT_LOGOS = Object.entries(clientLogoModules)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
  .map(([path, src], index) => ({ id: `${index}-${path}`, src }));

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

const FadeIn = ({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(media.matches);
    if (media.matches) {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`transition-all duration-700 ease-out ${reducedMotion || isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`} style={{ transitionDelay: reducedMotion ? '0ms' : `${delay}ms` }}>{children}</div>;
};

const Button = ({ children, primary = false, onClick, type = 'button', disabled = false, className = '' }: any) => (
  <button type={type} onClick={onClick} disabled={disabled} className={`group inline-flex items-center justify-center px-8 py-4 overflow-hidden rounded-full font-medium tracking-wide transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F14A0B] disabled:opacity-50 disabled:cursor-not-allowed ${primary ? 'bg-[#F14A0B] text-[#111111] hover:bg-[#F7F5F0]' : 'border border-[#F7F5F0]/20 text-[#F7F5F0] hover:bg-[#F7F5F0] hover:text-[#111111]'} ${className}`}>
    <span className="flex items-center gap-3">{children}<ArrowRight className={`w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 ${primary ? 'text-[#111111]' : ''}`} /></span>
  </button>
);

const Logo = ({ onClick, className = 'h-10' }: { onClick?: () => void; className?: string }) => (
  <button onClick={onClick} className="hover:opacity-80 transition-opacity flex items-center focus-visible:outline-none" aria-label={`${SITE_CONFIG.name} Home`}>
    <img src={SITE_CONFIG.logoPath} alt={`${SITE_CONFIG.name} Logo`} className={`w-auto object-contain ${className}`} onError={(e) => { e.currentTarget.style.display = 'none'; if (e.currentTarget.parentElement) e.currentTarget.parentElement.innerHTML = `<span class="text-xl font-bold tracking-tighter">${SITE_CONFIG.name}</span>`; }} />
  </button>
);

const ClientMarquee = () => {
  if (!CLIENT_LOGOS.length) return null;
  const renderGroup = (label: string) => <div className="client-marquee__group" aria-hidden={label === 'duplicate'}>{CLIENT_LOGOS.map((client) => <div className="client-marquee__item" key={`${label}-${client.id}`}><img src={client.src} alt={label === 'duplicate' ? '' : 'ZERO ONE client'} loading="lazy" draggable={false} /></div>)}</div>;
  return <section className="client-marquee-section" aria-label="Selected clients">
    <div className="px-6 md:px-12 lg:px-24"><FadeIn><div className="client-marquee__header"><div className="flex items-center gap-4"><span className="client-marquee__index">01</span><span className="client-marquee__rule" /><span className="client-marquee__eyebrow">Selected Clients</span></div><span className="client-marquee__count">{String(CLIENT_LOGOS.length).padStart(2, '0')} Brands</span></div></FadeIn></div>
    <div className="client-marquee" role="region" aria-label="Client logos"><div className="client-marquee__track">{renderGroup('primary')}{renderGroup('duplicate')}</div></div>
  </section>;
};

const Home = ({ navigate }: { navigate: (path: string) => void }) => (
  <div className="w-full">
    <SEO title="Creative Marketing Agency" description="We build brands, campaigns and digital experiences that make businesses impossible to ignore." />
    <section className="min-h-screen flex flex-col justify-center pt-32 pb-16 px-6 md:px-12 lg:px-24">
      <FadeIn delay={100}><p className="text-[#F7F5F0]/60 text-xs md:text-sm font-semibold tracking-[0.2em] uppercase mb-8">Creative Agency — Est 2026</p></FadeIn>
      <FadeIn delay={200}><h1 className="text-[12vw] sm:text-7xl md:text-8xl lg:text-[10rem] leading-[0.85] font-bold tracking-tighter uppercase mb-12 max-w-[1200px]">We Build <br />Brands That <br /><span className="flex items-center gap-4 lg:gap-8"><span className="text-[#F14A0B]">Move</span><span className="h-[2px] md:h-[4px] lg:h-[6px] flex-grow bg-[#F14A0B] hidden sm:block mt-2 lg:mt-6 max-w-[200px] lg:max-w-[400px]" /></span>People.</h1></FadeIn>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mt-8 md:mt-20"><FadeIn delay={400} className="max-w-2xl"><p className="text-lg md:text-2xl text-[#F7F5F0]/80 font-light leading-relaxed">We build brands, campaigns, and digital experiences that make businesses impossible to ignore.</p></FadeIn><FadeIn delay={500}><Button primary onClick={() => navigate('/work')}>View Our Work</Button></FadeIn></div>
    </section>
    <ClientMarquee />
    <section className="py-24 md:py-32 px-6 md:px-12 lg:px-24 bg-[#111111]"><FadeIn><div className="flex justify-between items-end mb-16 md:mb-24 border-b border-[#F7F5F0]/10 pb-8"><h2 className="text-3xl md:text-5xl font-bold tracking-tighter">Selected Work</h2><p className="text-[#F14A0B] hidden md:block text-sm font-mono tracking-widest uppercase">01 — 04</p></div></FadeIn><div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 lg:gap-16">{PROJECTS.map((project, index) => <div key={project.id} className={`group cursor-pointer ${project.featured ? 'md:col-span-12' : 'md:col-span-6'}`} onClick={() => navigate('/work')}><FadeIn delay={index * 100}><div className={`overflow-hidden bg-[#F7F5F0]/5 mb-6 ${project.featured ? 'aspect-[16/9] lg:aspect-[21/9]' : 'aspect-[4/5] md:aspect-[3/4]'}`}><img src={project.image} alt={project.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105 filter grayscale group-hover:grayscale-0" /></div><div className="flex justify-between items-start"><div><h3 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight group-hover:text-[#F14A0B] transition-colors">{project.title}</h3><p className="text-[#F7F5F0]/60 text-sm tracking-wide uppercase font-medium">{project.category}</p></div><div className="flex items-center gap-4"><span className="text-[#F7F5F0]/40 font-mono text-sm hidden sm:block">{project.year}</span><div className="w-10 h-10 rounded-full border border-[#F7F5F0]/20 flex items-center justify-center group-hover:bg-[#F14A0B] group-hover:border-[#F14A0B] group-hover:text-[#111111] transition-all duration-300"><ArrowUpRight className="w-4 h-4" /></div></div></div></FadeIn></div>)}</div></section>
    <section className="py-32 md:py-48 px-6 md:px-12 lg:px-24 bg-[#F7F5F0] text-[#111111]"><FadeIn><h2 className="text-4xl md:text-6xl lg:text-[5.5rem] font-bold tracking-tighter leading-[0.95] max-w-6xl uppercase">We don't make more noise. <br /><span className="text-[#F14A0B]">We make better signals.</span></h2><div className="mt-16 md:mt-20 pt-10 border-t border-[#111111]/10 flex flex-col md:flex-row gap-8 md:items-end md:justify-between max-w-6xl"><p className="max-w-2xl text-base md:text-xl font-light leading-relaxed text-[#111111]/65">Strategy, identity, content and digital — one clear point of view, built to move people.</p><div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#111111]/50"><span className="h-2 w-2 rounded-full bg-[#F14A0B]" />Clarity over noise</div></div></FadeIn></section>
    <About />
  </div>
);

const Work = () => <div className="w-full pt-40 pb-24 px-6 md:px-12 lg:px-24"><SEO title="Our Work" description="Explore our portfolio of premium brand identities and digital platforms." /><FadeIn><h1 className="text-6xl md:text-8xl lg:text-[9rem] font-bold tracking-tighter uppercase leading-none mb-12">Our Work.</h1><p className="text-xl md:text-2xl text-[#F7F5F0]/70 max-w-2xl mb-24 font-light">A selection of recent projects spanning digital platforms, brand identity, and creative strategy.</p></FadeIn><div className="grid grid-cols-1 md:grid-cols-2 gap-y-24 gap-x-8 lg:gap-x-16">{PROJECTS.map((project, index) => <FadeIn key={project.id} delay={index % 2 === 0 ? 0 : 200} className={index % 2 !== 0 ? 'md:mt-32' : ''}><div className="group"><div className="overflow-hidden bg-[#F7F5F0]/5 mb-6 aspect-[4/5] md:aspect-[3/4]"><img src={project.image} alt={project.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105 filter grayscale group-hover:grayscale-0" /></div><div className="flex justify-between items-start"><div><h3 className="text-3xl font-bold mb-2 tracking-tight group-hover:text-[#F14A0B] transition-colors">{project.title}</h3><p className="text-[#F7F5F0]/60 tracking-wide uppercase text-sm font-medium">{project.category}</p></div><p className="text-[#F7F5F0]/40 font-mono text-sm">{project.year}</p></div></div></FadeIn>)}</div></div>;

const Services = () => <div className="w-full pt-40 pb-24 px-6 md:px-12 lg:px-24"><SEO title="Services" description="Comprehensive creative solutions designed to elevate brands." /><FadeIn><h1 className="text-6xl md:text-8xl lg:text-[9rem] font-bold tracking-tighter uppercase leading-none mb-12">Expertise.</h1><p className="text-xl md:text-2xl text-[#F7F5F0]/70 max-w-2xl mb-24 font-light">We provide comprehensive creative solutions designed to elevate brands and drive measurable impact across every touchpoint.</p></FadeIn><div className="max-w-6xl">{SERVICES.map((service, index) => <FadeIn key={service.num} delay={index * 100}><div className="group border-t border-[#F7F5F0]/20 py-12 md:py-16 flex flex-col md:flex-row gap-6 md:gap-16 cursor-pointer"><span className="text-xl md:text-2xl text-[#F7F5F0]/40 group-hover:text-[#F14A0B] font-mono shrink-0">{service.num}</span><div className="flex-grow"><h3 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight group-hover:text-[#F14A0B] transition-colors">{service.title}</h3><p className="text-lg md:text-xl text-[#F7F5F0]/60 max-w-2xl leading-relaxed font-light">{service.desc}</p></div><ArrowRight className="hidden md:block md:ml-auto w-10 h-10 text-[#F14A0B] opacity-0 group-hover:opacity-100 transition-opacity" /></div></FadeIn>)}</div></div>;

const About = () => <div className="w-full pt-40 pb-24 px-6 md:px-12 lg:px-24"><SEO title="About Us" description="We are a collective of designers, strategists, and technologists building brands and digital experiences with intention." /><FadeIn><h1 className="text-6xl md:text-8xl lg:text-[9rem] font-bold tracking-tighter uppercase leading-none mb-12">About Us.</h1></FadeIn><div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 mt-16 md:mt-24"><div className="lg:col-span-6 flex flex-col justify-center"><FadeIn delay={200}><h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-8 leading-tight">Design driven by intention. Built for scale.</h2><div className="space-y-6 text-[#F7F5F0]/70 text-lg md:text-xl font-light leading-relaxed"><p>Founded on the belief that aesthetics and performance are not mutually exclusive. We build digital experiences and brand identities that feel inevitable—designed with extreme intention and executed with precision.</p><p>Our approach is highly collaborative, operating as an extension of our clients' teams rather than a traditional vendor. We favor honest communication, rigorous strategy, and impeccable craft over industry jargon.</p></div></FadeIn></div><div className="lg:col-span-6"><FadeIn delay={400}><div className="aspect-[4/5] bg-[#F7F5F0]/5 overflow-hidden relative"><img src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop" alt="Studio Office" loading="lazy" className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-[1.5s]" /><div className="absolute inset-0 bg-black/10" /></div></FadeIn></div></div></div>;

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', company: '', type: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    const text = ['ZERO ONE Project Inquiry', `Name: ${formData.name}`, `Email: ${formData.email}`, `Company: ${formData.company || 'Not provided'}`, `Project Type: ${formData.type || 'Not provided'}`, `Message: ${formData.message}`].join('\n');
    window.open(`${SITE_CONFIG.whatsappUrl}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    setStatus('success');
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  return <div className="w-full pt-40 pb-24 px-6 md:px-12 lg:px-24 flex flex-col min-h-screen"><SEO title="Contact" description="Ready to start a project? Get in touch with ZERO ONE." /><FadeIn><h1 className="text-6xl md:text-8xl lg:text-[10rem] font-bold tracking-tighter uppercase leading-none mb-16">Let's <br className="md:hidden" /><span className="text-[#F14A0B]">Make An Impact.</span></h1></FadeIn><div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 mt-8"><div className="lg:col-span-7"><FadeIn delay={200}>{status === 'success' ? <div className="bg-[#F7F5F0]/5 border border-[#F7F5F0]/20 p-12 flex flex-col items-center justify-center text-center min-h-[400px]"><CheckCircle2 className="w-16 h-16 text-[#F14A0B] mb-6" /><h3 className="text-3xl font-bold mb-4">Inquiry Received.</h3><p className="text-[#F7F5F0]/70 text-lg">Thank you for reaching out. Our team will review your message and get back to you within 24-48 hours.</p><Button className="mt-8" onClick={() => setStatus('idle')}>Send Another Message</Button></div> : <form onSubmit={handleSubmit} className="space-y-8"><div className="grid grid-cols-1 md:grid-cols-2 gap-8">{[['name','Name','Jane Doe','text'],['email','Email','jane@company.com','email']].map(([name,label,placeholder,type]) => <div key={name} className="space-y-2"><label htmlFor={name} className="text-sm font-semibold uppercase tracking-widest text-[#F7F5F0]/60">{label} *</label><input required type={type} id={name} name={name} value={formData[name as keyof typeof formData]} onChange={handleChange} className="w-full bg-transparent border-b border-[#F7F5F0]/30 py-3 text-lg focus:border-[#F14A0B] focus:outline-none" placeholder={placeholder} /></div>)}</div><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="space-y-2"><label htmlFor="company" className="text-sm font-semibold uppercase tracking-widest text-[#F7F5F0]/60">Company</label><input type="text" id="company" name="company" value={formData.company} onChange={handleChange} className="w-full bg-transparent border-b border-[#F7F5F0]/30 py-3 text-lg focus:border-[#F14A0B] focus:outline-none" placeholder="Organization Name" /></div><div className="space-y-2"><label htmlFor="type" className="text-sm font-semibold uppercase tracking-widest text-[#F7F5F0]/60">Project Type</label><select id="type" name="type" value={formData.type} onChange={handleChange} className="w-full bg-[#111111] border-b border-[#F7F5F0]/30 py-3 text-lg focus:border-[#F14A0B] focus:outline-none"><option value="" disabled>Select an option</option><option value="brand">Brand Identity</option><option value="digital">Digital Platform / Website</option><option value="campaign">Campaign & Content</option><option value="other">Other</option></select></div></div><div className="space-y-2"><label htmlFor="message" className="text-sm font-semibold uppercase tracking-widest text-[#F7F5F0]/60">Message *</label><textarea required id="message" name="message" rows={4} value={formData.message} onChange={handleChange} className="w-full bg-transparent border-b border-[#F7F5F0]/30 py-3 text-lg focus:border-[#F14A0B] focus:outline-none resize-none" placeholder="Tell us about your project..." /></div><Button type="submit" primary disabled={status === 'submitting'} className="w-full md:w-auto">{status === 'submitting' ? 'Sending...' : 'Submit Inquiry'}</Button></form>}</FadeIn></div><div className="lg:col-span-4 lg:col-start-9 flex flex-col gap-12 mt-12 lg:mt-0"><FadeIn delay={400}><h3 className="text-xs font-semibold uppercase tracking-widest text-[#F7F5F0]/60 mb-4">WhatsApp Business</h3><a href={SITE_CONFIG.whatsappUrl} target="_blank" rel="noreferrer" className="text-2xl md:text-3xl font-bold hover:text-[#F14A0B] transition-colors inline-flex items-center gap-3 break-all"><MessageCircle className="w-7 h-7 shrink-0" />{SITE_CONFIG.whatsapp}</a></FadeIn><FadeIn delay={500}><h3 className="text-xs font-semibold uppercase tracking-widest text-[#F7F5F0]/60 mb-6">Find ZERO ONE</h3><div className="grid grid-cols-2 gap-4">{Object.entries(SITE_CONFIG.social).filter(([key]) => key !== 'snapchat').map(([label, href]) => <a key={label} href={href} target="_blank" rel="noreferrer" className="text-[#F7F5F0]/70 hover:text-[#F14A0B] transition-colors text-sm font-medium flex items-center gap-2 capitalize">{label}<ArrowUpRight size={14} /></a>)}<span className="text-[#F7F5F0]/50 text-sm font-medium">Snapchat: {SITE_CONFIG.social.snapchat}</span></div></FadeIn></div></div></div>;
};

const NotFound = ({ navigate }: { navigate: (path: string) => void }) => <div className="w-full min-h-screen flex flex-col items-center justify-center text-center px-6"><SEO title="404 Not Found" description="Page not found." /><h1 className="text-9xl font-bold tracking-tighter text-[#F14A0B] mb-4">404</h1><h2 className="text-3xl font-bold mb-8">Page Not Found</h2><p className="text-[#F7F5F0]/60 mb-12 max-w-md">The page you are looking for doesn't exist or has been moved.</p><Button onClick={() => navigate('/')}>Return Home</Button></div>;

export default function App() {
  const { path, navigate } = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  useEffect(() => { setIsMenuOpen(false); }, [path]);
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMenuOpen]);
  const navLinks = [{ id: '/work', label: 'Work' }, { id: '/services', label: 'Services' }, { id: '/about', label: 'About' }];
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
  return <><style>{`:root { color-scheme: dark; } ::selection { background-color: #F14A0B; color: #111111; } html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; } body { background-color: #111111; color: #F7F5F0; }`}</style><div className="min-h-screen font-sans flex flex-col relative"><nav className="fixed top-0 left-0 w-full z-50 bg-[#111111]/80 backdrop-blur-xl border-b border-[#F7F5F0]/5"><div className="flex items-center justify-between px-6 md:px-12 lg:px-24 h-20 md:h-24"><Logo onClick={() => navigate('/')} /><div className="hidden md:flex items-center gap-12 absolute left-1/2 -translate-x-1/2">{navLinks.map((link) => <button key={link.id} onClick={() => navigate(link.id)} className={`text-xs font-bold uppercase tracking-[0.15em] transition-colors ${path === link.id ? 'text-[#F14A0B]' : 'text-[#F7F5F0]/80 hover:text-[#F7F5F0]'}`}>{link.label}</button>)}</div><div className="hidden md:block"><button onClick={() => navigate('/contact')} className="px-6 py-3 bg-[#F7F5F0] hover:bg-[#F14A0B] text-[#111111] rounded-full text-xs font-bold uppercase tracking-[0.1em] transition-all">Start a Project</button></div><button className="md:hidden text-[#F7F5F0] z-50 relative" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label={isMenuOpen ? 'Close Menu' : 'Open Menu'}>{isMenuOpen ? <X size={28} /> : <Menu size={28} />}</button></div></nav><div className={`fixed inset-0 bg-[#111111] z-40 flex flex-col justify-center px-8 transition-all duration-500 md:hidden ${isMenuOpen ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`}><div className="flex flex-col gap-8">{[...navLinks, { id: '/contact', label: 'Contact' }].map((link) => <button key={link.id} onClick={() => navigate(link.id)} className={`text-5xl font-bold uppercase tracking-tighter text-left ${path === link.id ? 'text-[#F14A0B]' : 'text-[#F7F5F0]'}`}>{link.label}</button>)}</div></div><main className="flex-grow flex flex-col">{renderPage()}</main><footer className="w-full bg-[#111111] pt-24 pb-12 px-6 md:px-12 lg:px-24"><div className="mb-24 pb-24 border-b border-[#F7F5F0]/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10"><h2 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase">Ready to <br className="hidden md:block" /> make your mark?</h2><Button primary onClick={() => navigate('/contact')}>Let's Talk</Button></div><div className="flex flex-col lg:flex-row justify-between items-start gap-16 mb-24"><div className="max-w-sm"><Logo onClick={() => navigate('/')} className="h-12 mb-8 opacity-90" /><p className="text-[#F7F5F0]/60 font-light leading-relaxed">A creative marketing agency designing brands, campaigns, and digital platforms for the future.</p></div><div className="flex flex-wrap gap-16 md:gap-24"><div className="flex flex-col gap-4"><h4 className="font-bold text-[#F14A0B] uppercase tracking-widest text-xs mb-4">Sitemap</h4>{[['Home','/'],['Work','/work'],['Services','/services'],['About','/about'],['Contact','/contact']].map(([label,id]) => <button key={id} onClick={() => navigate(id)} className="text-[#F7F5F0]/70 hover:text-[#F7F5F0] transition-colors text-left text-sm font-medium">{label}</button>)}</div><div className="flex flex-col gap-4"><h4 className="font-bold text-[#F14A0B] uppercase tracking-widest text-xs mb-4">Social</h4>{Object.entries(SITE_CONFIG.social).filter(([key]) => key !== 'snapchat').map(([label, href]) => <a key={label} href={href} target="_blank" rel="noreferrer" className="text-[#F7F5F0]/70 hover:text-[#F7F5F0] transition-colors text-sm font-medium capitalize">{label}</a>)}</div></div></div><div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-[#F7F5F0]/10 text-xs font-semibold uppercase tracking-widest text-[#F7F5F0]/40"><p>&copy; {new Date().getFullYear()} {SITE_CONFIG.name}. All rights reserved.</p><div className="flex gap-8"><span>Privacy Policy</span><span>Terms of Service</span></div></div></footer></div></>;
}
