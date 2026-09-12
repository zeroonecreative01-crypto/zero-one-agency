import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, Menu, X } from 'lucide-react';
import { formatMarketPrice, getStoredMarket, type MarketCode } from '../lib/pricingMatrix';

const WORK = [
  { title: 'Aura Skincare', type: 'Brand Identity / E-commerce', year: '2025', image: 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=1600&auto=format&fit=crop' },
  { title: 'Nexus Automotive', type: 'Global Campaign', year: '2025', image: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=1600&auto=format&fit=crop' },
  { title: 'Lumina Tech', type: 'Digital Product', year: '2024', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1600&auto=format&fit=crop' },
];

type Package = { id: string; name: string; price: string; currency: string; billing_label: string; tone: 'starter' | 'growth' | 'premium'; popular: boolean; groups?: { title: string; items: string[] }[]; market_prices?: Partial<Record<MarketCode, number>> };

const FALLBACK: Package[] = [
  { id: 'starter', name: 'Starter', price: '450', currency: 'KWD', billing_label: 'LEAN RETAINER', tone: 'starter', popular: false, groups: [{ title: 'Core', items: ['Content direction', 'Monthly creative'] }] },
  { id: 'growth', name: 'Growth', price: '850', currency: 'KWD', billing_label: 'GROWTH RETAINER', tone: 'growth', popular: true, groups: [{ title: 'Core', items: ['Strategy + content', 'Social creative'] }] },
  { id: 'premium', name: 'Premium', price: '1500', currency: 'KWD', billing_label: 'FULL CREATIVE PARTNER', tone: 'premium', popular: false, groups: [{ title: 'Core', items: ['Full creative system', 'Campaign + digital'] }] },
];

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function HomeRefresh() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [packages, setPackages] = useState<Package[]>(FALLBACK);
  const [market] = useState<MarketCode>(() => getStoredMarket());
  const [active, setActive] = useState('growth');

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
    if (!url || !key) return;
    fetch(`${url}/rest/v1/pricing_packages?select=id,name,price,currency,billing_label,tone,popular,groups,market_prices&order=sort_order.asc,created_at.desc`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
      .then(async (res) => res.ok ? res.json() : Promise.reject(new Error('pricing')))
      .then((items: Package[]) => { if (!Array.isArray(items) || !items.length) return; const next = items.slice(0, 3); setPackages(next); setActive(next.find((item) => item.popular)?.id ?? next[0]?.id ?? ''); })
      .catch(() => undefined);
  }, []);

  const go = (path: string) => { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo({ top: 0, behavior: 'smooth' }); setMenuOpen(false); };
  const selectPackage = (pkg: Package) => { setActive(pkg.id); window.dispatchEvent(new CustomEvent('zero-one:pricing-focus', { detail: { name: pkg.name, tone: pkg.tone } })); };

  return <div className="home-refresh">
    <header className="home-refresh__header">
      <button className="home-refresh__logo" onClick={() => go('/')} aria-label="ZERO ONE home"><span>ZERO</span><b>01</b></button>
      <nav className={`home-refresh__nav ${menuOpen ? 'is-open' : ''}`}>
        <button onClick={() => go('/work')}>Work</button><button onClick={() => go('/services')}>Services</button><button onClick={() => go('/about')}>About</button><button onClick={() => go('/pricing')}>Pricing</button><button className="is-cta" onClick={() => go('/contact')}>Start a project <ArrowUpRight size={14} /></button>
      </nav>
      <button className="home-refresh__menu" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
    </header>

    <main>
      <section className="home-refresh__hero">
        <div className="home-refresh__hero-meta"><span>ZERO ONE / CREATIVE AGENCY</span><span>EST. 2026 / GLOBAL</span></div>
        <div className="home-refresh__hero-title"><span>Brands</span><span>with a</span><em>point of view.</em></div>
        <div className="home-refresh__hero-bottom"><p>Strategy, identity, content and digital — one connected creative system for brands ready to move.</p><button onClick={() => go('/work')}>Explore the work <ArrowRight size={15} /></button></div>
        <div className="home-refresh__scroll"><i /> Scroll to explore</div>
      </section>

      <section className="home-refresh__statement"><div className="home-refresh__eyebrow">01 / THE IDEA</div><div><h2>Less noise.<br /><em>More signal.</em></h2><p>We turn positioning into a visual language people can recognize, remember and act on.</p></div></section>

      <section className="home-refresh__work" id="work"><div className="home-refresh__section-head"><div><span>02 / SELECTED WORK</span><h2>Recent moves.</h2></div><button onClick={() => go('/work')}>View all work <ArrowUpRight size={15} /></button></div><div className="home-refresh__work-grid">{WORK.map((item, index) => <article key={item.title} className={`home-refresh__work-card card-${index + 1}`} onClick={() => go(`/work/${slugify(item.title)}`)}><div className="home-refresh__work-image"><img src={item.image} alt={item.title} loading="lazy" /></div><div className="home-refresh__work-info"><div><span>{item.type}</span><h3>{item.title}</h3></div><b>{item.year}</b><ArrowUpRight size={18} /></div></article>)}</div></section>

      <section className="home-refresh__packages" id="packages"><div className="home-refresh__section-head"><div><span>03 / PACKAGES</span><h2>Choose your <em>pace.</em></h2></div><button onClick={() => go('/pricing')}>Full pricing <ArrowUpRight size={15} /></button></div><div className="home-refresh__package-grid">{packages.map((pkg, index) => { const price = Number(pkg.market_prices?.[market]) || Number(pkg.price) || 0; const items = (pkg.groups ?? []).flatMap((group) => group.items ?? []).slice(0, 2); const selected = active === pkg.id; return <button type="button" key={pkg.id} className={`home-refresh__package ${selected ? 'is-selected' : ''}`} onClick={() => selectPackage(pkg)} aria-pressed={selected}><div className="home-refresh__package-top"><span>0{index + 1}</span>{pkg.popular && <b><i /> Most chosen</b>}</div><small>{pkg.billing_label}</small><h3>{pkg.name}</h3><div className="home-refresh__package-price">{price ? formatMarketPrice(price, market) : 'Custom'}<sup>{price ? ` / ${pkg.currency} / mo` : ' / month'}</sup></div><div className="home-refresh__package-items">{items.map((item) => <span key={item}><Check size={12} />{item}</span>)}</div><div className="home-refresh__package-action"><span>{selected ? 'Selected' : 'Select package'}</span><ArrowRight size={15} /></div></button>; })}</div><p className="home-refresh__package-note">Select a package — the island above responds instantly.</p></section>

      <section className="home-refresh__services"><div className="home-refresh__eyebrow">04 / CAPABILITIES</div><div className="home-refresh__services-list">{['Brand Identity', 'Digital Platforms', 'Campaign & Content', 'Creative Strategy'].map((item, index) => <button key={item} onClick={() => go('/services')}><span>0{index + 1}</span><strong>{item}</strong><ArrowUpRight size={17} /></button>)}</div></section>

      <section className="home-refresh__cta"><span>05 / START A PROJECT</span><h2>Make the next<br /><em>move count.</em></h2><button onClick={() => go('/contact')}>Let's talk <ArrowRight size={16} /></button></section>
    </main>
  </div>;
}
