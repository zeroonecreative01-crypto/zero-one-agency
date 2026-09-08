import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react';

const STATS = [
  ['25+', 'Brands'],
  ['5+', 'Markets'],
  ['7', 'Years'],
  ['40,000+', 'Projects'],
];

const CASES = [
  { title: 'Aura Skincare', category: 'Brand Identity / E-commerce', year: '2025', challenge: 'Create a premium beauty presence with a system that can scale across packaging, content and digital touchpoints.', approach: 'Built a cohesive visual language around clarity, confidence and premium product storytelling.', deliverables: ['Brand identity', 'Digital direction', 'E-commerce experience', 'Content system'] },
  { title: 'Nexus Automotive', category: 'Global Campaign', year: '2025', challenge: 'Turn an automotive launch into a recognizable campaign system rather than a collection of disconnected assets.', approach: 'Created a campaign language designed for high-impact launches, social content and performance creative.', deliverables: ['Campaign concept', 'Art direction', 'Social creative', 'Performance assets'] },
  { title: 'Lumina Tech', category: 'Digital Product', year: '2024', challenge: 'Make a technology product feel simple, credible and memorable in a crowded digital category.', approach: 'Combined editorial typography, focused UX and a modular visual system to reduce friction and sharpen positioning.', deliverables: ['UX / UI', 'Visual system', 'Product storytelling', 'Web direction'] },
  { title: 'Kineo Architecture', category: 'Editorial Website', year: '2026', challenge: 'Translate architectural thinking into a digital experience with enough restraint to let the work lead.', approach: 'Designed an image-led editorial framework with strong hierarchy, pacing and responsive composition.', deliverables: ['Digital art direction', 'Editorial UX', 'Website design', 'Content structure'] },
];

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function ProofBar() {
  return <section className="zo-proof" aria-label="ZERO ONE agency facts"><div className="zo-proof__inner">{STATS.map(([value, label]) => <div className="zo-proof__stat" key={label}><strong>{value}</strong><span>{label}</span></div>)}</div></section>;
}

function HomeUpgrade() {
  return <>
    <ProofBar />
    <section className="zo-trust"><div className="zo-trust__inner"><div className="zo-kicker"><span /> WHY ZERO ONE</div><div className="zo-trust__grid"><h2>Creative thinking.<br /><em>Built for growth.</em></h2><div><p>We bring strategy, identity, content and digital experience into one connected creative system — so brands look sharper, move faster and stay consistent.</p><div className="zo-industries">{['Beauty', 'Real Estate', 'Automotive', 'Technology', 'Hospitality', 'Retail'].map((item) => <span key={item}>{item}</span>)}</div></div></div></div></section>
    <section className="zo-selected"><div className="zo-selected__inner"><div className="zo-kicker"><span /> SELECTED CASE STUDIES</div><div className="zo-selected__head"><h2>Work with a <em>point of view.</em></h2><button onClick={() => navigate('/work')} className="zo-outline-btn">View all work <ArrowUpRight size={15} /></button></div><div className="zo-case-grid">{CASES.slice(0, 3).map((item) => <article className="zo-case-mini" key={item.title}><div className="zo-case-mini__meta"><span>{item.category}</span><span>{item.year}</span></div><h3>{item.title}</h3><p>{item.approach}</p><div className="zo-case-mini__line">Case study <ArrowRight size={13} /></div></article>)}</div></div></section>
    <section className="zo-cta"><div className="zo-cta__inner"><div><div className="zo-kicker"><span /> START A PROJECT</div><h2>Have a brand<br /><em>worth building?</em></h2></div><button onClick={() => navigate('/contact')} className="zo-cta__btn">Let's talk <ArrowRight size={17} /></button></div></section>
  </>;
}

function WorkUpgrade() {
  return <section className="zo-cases"><div className="zo-cases__inner"><div className="zo-kicker"><span /> CASE STUDIES</div><div className="zo-cases__intro"><h2>How we<br /><em>think.</em></h2><p>Selected work, framed around the challenge, the creative decision and the system behind the final output.</p></div><div className="zo-cases__list">{CASES.map((item, index) => <article className="zo-case" key={item.title}><div className="zo-case__index">0{index + 1}</div><div className="zo-case__main"><div className="zo-case__meta"><span>{item.category}</span><span>{item.year}</span></div><h3>{item.title}</h3><div className="zo-case__columns"><div><span>THE CHALLENGE</span><p>{item.challenge}</p></div><div><span>THE APPROACH</span><p>{item.approach}</p></div><div><span>DELIVERABLES</span><ul>{item.deliverables.map((deliverable) => <li key={deliverable}><Check size={12} />{deliverable}</li>)}</ul></div></div></div></article>)}</div></div></section>;
}

export default function ExperienceUpgrade() {
  const [path, setPath] = useState(() => window.location.pathname.replace(/\/+$/, '') || '/');
  const [mount, setMount] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const onNavigate = () => setPath(window.location.pathname.replace(/\/+$/, '') || '/');
    window.addEventListener('popstate', onNavigate);
    const footer = document.querySelector('footer');
    if (!footer?.parentNode) return () => window.removeEventListener('popstate', onNavigate);
    const node = document.createElement('div');
    node.id = 'zero-one-experience-upgrade';
    footer.parentNode.insertBefore(node, footer);
    setMount(node);
    return () => { window.removeEventListener('popstate', onNavigate); node.remove(); };
  }, []);

  if (!mount) return null;
  return createPortal(path === '/work' ? <WorkUpgrade /> : path === '/' ? <HomeUpgrade /> : null, mount);
}
