import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { createPortal } from 'react-dom';
import { formatMarketPrice, getStoredMarket, type MarketCode } from '../lib/pricingMatrix';

const STATS = [
  ['25+', 'Brands'],
  ['5+', 'Markets'],
  ['7', 'Years'],
  ['40,000+', 'Projects'],
];

const CASES = [
  { title: 'Aura Skincare', category: 'Brand Identity / E-commerce', year: '2025', approach: 'Built a cohesive visual language around clarity, confidence and premium product storytelling.' },
  { title: 'Nexus Automotive', category: 'Global Campaign', year: '2025', approach: 'Created a campaign language designed for high-impact launches, social content and performance creative.' },
  { title: 'Lumina Tech', category: 'Digital Product', year: '2024', approach: 'Combined editorial typography, focused UX and a modular visual system to reduce friction and sharpen positioning.' },
];

type HomePackage = {
  id: string;
  name: string;
  price: string;
  currency: string;
  billing_label: string;
  tone: 'starter' | 'growth' | 'premium';
  popular: boolean;
  groups: { title: string; items: string[] }[];
  market_prices?: Partial<Record<MarketCode, number>>;
};

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function HomePackages() {
  const [packages, setPackages] = useState<HomePackage[]>([]);
  const [market] = useState<MarketCode>(() => getStoredMarket());
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
    if (!url || !key) return;
    fetch(`${url}/rest/v1/pricing_packages?select=id,name,price,currency,billing_label,tone,popular,groups,market_prices&order=sort_order.asc,created_at.desc`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
      .then(async (response) => { if (!response.ok) throw new Error('Pricing request failed'); return response.json() as Promise<HomePackage[]>; })
      .then((items) => {
        const next = Array.isArray(items) ? items.slice(0, 3) : [];
        setPackages(next);
        setActiveId(next.find((item) => item.popular)?.id ?? next[0]?.id ?? null);
      })
      .catch(() => setPackages([]));
  }, []);

  const selectPackage = (pkg: HomePackage) => {
    setActiveId(pkg.id);
    window.dispatchEvent(new CustomEvent('zero-one:pricing-focus', { detail: { name: pkg.name, tone: pkg.tone === 'premium' ? 'Premium' : pkg.tone === 'growth' ? 'Growth' : 'Starter' } }));
  };

  if (!packages.length) return null;

  return <section className="zo-packages" id="zero-one-home-packages" aria-label="ZERO ONE packages">
    <div className="zo-packages__inner">
      <div className="zo-kicker"><span /> PACKAGES</div>
      <div className="zo-packages__head">
        <div><h2>A clear level<br /><em>for every stage.</em></h2><p>Three focused retainers. Start lean, grow with intent, or go all in.</p></div>
        <button onClick={() => navigate('/pricing')} className="zo-outline-btn">See full packages <ArrowUpRight size={15} /></button>
      </div>
      <div className="zo-package-grid">
        {packages.map((pkg, index) => {
          const active = pkg.id === activeId;
          const price = Number(pkg.market_prices?.[market]) || Number(pkg.price) || 0;
          const highlights = (pkg.groups ?? []).flatMap((group) => group.items ?? []).slice(0, 2);
          return <button key={pkg.id} type="button" className={`zo-package ${active ? 'is-active' : ''}`} aria-pressed={active} onClick={() => selectPackage(pkg)}>
            <span className="zo-package__number">0{index + 1}</span>
            <span className="zo-package__top"><span>{pkg.billing_label || 'MONTHLY RETAINER'}</span>{pkg.popular ? <b><i /> Recommended</b> : null}</span>
            <span className="zo-package__name">{pkg.name}</span>
            <span className="zo-package__price">{price > 0 ? formatMarketPrice(price, market) : 'Custom'}<small>{price > 0 ? ` / ${pkg.currency || market.toUpperCase()} / MO` : ' / MONTH'}</small></span>
            <span className="zo-package__features">{highlights.map((item, itemIndex) => <span key={`${pkg.id}-${itemIndex}`}><i />{item}</span>)}</span>
            <span className="zo-package__action">{active ? 'Selected' : 'Explore'} <ArrowRight size={14} /></span>
          </button>;
        })}
      </div>
      <div className="zo-packages__hint"><span>Tap a package</span><i /> The island above will react.</div>
    </div>
  </section>;
}

function HomeUpgrade() {
  return <>
    <section className="zo-trust"><div className="zo-trust__inner"><div className="zo-kicker"><span /> WHY ZERO ONE</div><div className="zo-trust__grid"><h2>Creative thinking.<br /><em>Built for growth.</em></h2><div><p>We bring strategy, identity, content and digital experience into one connected creative system — so brands look sharper, move faster and stay consistent.</p><div className="zo-industries">{['Beauty', 'Real Estate', 'Automotive', 'Technology', 'Hospitality', 'Retail'].map((item) => <span key={item}>{item}</span>)}</div></div></div></div></section>
    <section className="zo-selected"><div className="zo-selected__inner"><div className="zo-kicker"><span /> SELECTED CASE STUDIES</div><div className="zo-selected__head"><h2>Work with a <em>point of view.</em></h2><button onClick={() => navigate('/work')} className="zo-outline-btn">View all work <ArrowUpRight size={15} /></button></div><div className="zo-case-grid">{CASES.map((item) => <article className="zo-case-mini" key={item.title} role="link" tabIndex={0} onClick={() => navigate(`/work/${slugify(item.title)}`)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') navigate(`/work/${slugify(item.title)}`); }}><div className="zo-case-mini__meta"><span>{item.category}</span><span>{item.year}</span></div><h3>{item.title}</h3><p>{item.approach}</p><div className="zo-case-mini__line">Case study <ArrowRight size={13} /></div></article>)}</div></div></section>
    <HomePackages />
    <section className="zo-cta"><div className="zo-cta__inner"><div><div className="zo-kicker"><span /> START A PROJECT</div><h2>Have a brand<br /><em>worth building?</em></h2></div><button onClick={() => navigate('/contact')} className="zo-cta__btn">Let's talk <ArrowRight size={17} /></button></div></section>
    <section className="zo-proof" aria-label="ZERO ONE agency facts"><div className="zo-proof__inner">{STATS.map(([value, label]) => <div className="zo-proof__stat" key={label}><strong>{value}</strong><span>{label}</span></div>)}</div></section>
  </>;
}

export default function ExperienceUpgrade() {
  const [mount, setMount] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (window.location.pathname !== '/') return;
    const footer = document.querySelector('footer');
    if (!footer?.parentNode) return;
    const node = document.createElement('div');
    node.id = 'zero-one-experience-upgrade';
    footer.parentNode.insertBefore(node, footer);
    setMount(node);
    return () => node.remove();
  }, []);

  if (!mount) return null;
  return createPortal(<HomeUpgrade />, mount);
}
