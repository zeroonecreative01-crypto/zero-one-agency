import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { getMarket, getStoredMarket, MARKETS, formatMarketPrice, setStoredMarket, type MarketCode } from '../lib/pricingMatrix';
import CustomPackageBuilder from './CustomPackageBuilder';

type PricingGroup = { title: string; items: string[] };
type PricingPackage = {
  id: string;
  name: string;
  price: string;
  currency: string;
  billing_label: string;
  tone: 'starter' | 'growth' | 'premium';
  popular: boolean;
  groups: PricingGroup[];
  market_prices: Partial<Record<MarketCode, number>>;
  sort_order: number;
};

const WHATSAPP = 'https://wa.me/201556764804?text=';

function localPrice(pkg: PricingPackage, market: MarketCode) {
  const configured = Number(pkg.market_prices?.[market]);
  return Number.isFinite(configured) && configured > 0 ? configured : Number(pkg.price) || 0;
}

function safeGroups(value: unknown): PricingGroup[] {
  if (!Array.isArray(value)) return [];
  return value.filter((group): group is PricingGroup => Boolean(group && typeof group === 'object' && typeof (group as PricingGroup).title === 'string' && Array.isArray((group as PricingGroup).items)));
}

export default function PricingPage() {
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [market, setMarket] = useState<MarketCode>(() => getStoredMarket());
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  useEffect(() => {
    document.title = 'Packages — ZERO ONE';
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
    if (!url || !key) {
      setLoading(false);
      return;
    }
    fetch(`${url}/rest/v1/pricing_packages?select=id,name,price,currency,billing_label,tone,popular,groups,market_prices,sort_order&order=sort_order.asc,created_at.desc`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Pricing request failed');
        return response.json() as Promise<PricingPackage[]>;
      })
      .then((items) => {
        const normalized = Array.isArray(items) ? items.map((item) => ({ ...item, groups: safeGroups(item.groups) })) : [];
        setPackages(normalized.sort((a, b) => a.sort_order - b.sort_order));
        setActive(0);
      })
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  }, []);

  const selectedMarket = useMemo(() => getMarket(market), [market]);

  const chooseMarket = (code: MarketCode) => {
    setMarket(code);
    setStoredMarket(code);
    setActive(0);
    window.dispatchEvent(new CustomEvent('zero-one:market-change', { detail: { code } }));
  };

  const move = (next: number) => {
    if (!packages.length) return;
    setDirection(next > active ? 'next' : 'prev');
    setActive((next + packages.length) % packages.length);
  };

  const current = packages[active];

  return (
    <main id="zero-one-pricing" className="zero-one-pricing-page zero-one-pricing min-h-screen bg-[#090909] text-[#F7F5F0]">
      <header className="mx-auto max-w-7xl px-6 pb-12 pt-8 md:px-12 lg:px-16">
        <div className="flex items-center justify-between border-b border-[#F7F5F0]/10 pb-6">
          <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#F7F5F0]/65 transition hover:text-[#F14A0B]"><ArrowLeft size={16} /> Back home</a>
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#F14A0B]">ZERO ONE / Packages</span>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-14 md:px-12 lg:px-16">
        <div className="zero-one-pricing__intro">
          <div className="zero-one-pricing__eyebrow flex items-center gap-3"><span className="inline-block h-px w-9" /> INVESTMENT <span className="inline-block h-px w-9" /></div>
          <h1>Choose Your Level<br />Of Growth.</h1>
          <p>Three focused monthly retainers built to match the stage, ambition, and pace of your brand. Choose the market that fits your business.</p>
        </div>

        <div className="border-y border-[#F7F5F0]/10 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#F7F5F0]/40">Choose your market</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {MARKETS.map((item) => (
                <button key={item.code} type="button" onClick={() => chooseMarket(item.code)} aria-pressed={item.code === market} className={`rounded-full border px-4 py-2.5 text-sm transition ${item.code === market ? 'border-[#F14A0B] bg-[#F14A0B] text-[#111111]' : 'border-[#F7F5F0]/12 text-[#F7F5F0]/60 hover:border-[#F7F5F0]/30 hover:text-[#F7F5F0]'}`}>
                  <span className="mr-1.5">{item.flag}</span>{item.country} <span className="ml-1 opacity-60">{item.currency}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 md:px-12 lg:px-16">
        {loading ? <div className="border border-[#F7F5F0]/10 p-10 text-sm text-[#F7F5F0]/45">Loading packages...</div> : !current ? <div className="border border-[#F7F5F0]/10 p-10 text-sm text-[#F7F5F0]/45">Packages are currently being updated. Contact ZERO ONE for the latest options.</div> : (
          <div className="zero-one-pricing-carousel">
            <button type="button" className="zero-one-pricing-carousel__arrow" onClick={() => move(active - 1)} aria-label="Previous package">‹</button>
            <div className="zero-one-pricing-carousel__viewport">
              <article key={`${current.id}-${market}`} data-direction={direction} className={`zero-one-pricing-carousel__card zero-one-package zero-one-package--${current.tone}`}>
                <div className="zero-one-package__signal"><span className="zero-one-package__signal-dot" /> {current.popular ? 'Recommended' : `${String(active + 1).padStart(2, '0')} / INVESTMENT`}</div>
                {current.popular && <span className="zero-one-package__popular">Most Popular</span>}
                <div className="zero-one-package__top">
                  <div><h2 className="zero-one-package__name">{current.name}</h2><span className="zero-one-package__tag inline-flex rounded-full border">{current.billing_label}</span></div>
                </div>
                <div className="zero-one-package__price"><strong>{formatMarketPrice(localPrice(current, market), market)}</strong><span>{selectedMarket.currency} / MONTH</span></div>
                <div className="zero-one-package__content">
                  {current.groups.map((group) => (
                    <div key={group.title} className="zero-one-package__group">
                      <h3>{group.title}</h3>
                      <ul className="zero-one-package__list">
                        {group.items.map((item) => <li key={item} className="flex gap-2"><Check size={14} />{item}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
                <a href={`${WHATSAPP}${encodeURIComponent(`Hi ZERO ONE, I'm interested in the ${current.name} package in ${selectedMarket.country}. I'd like to discuss the next steps.`)}`} target="_blank" rel="noopener noreferrer" className="zero-one-package__cta flex items-center justify-between">START WITH {current.name}<ArrowRight size={17} /></a>
              </article>
            </div>
            <button type="button" className="zero-one-pricing-carousel__arrow" onClick={() => move(active + 1)} aria-label="Next package">›</button>
            <div className="zero-one-pricing-carousel__footer col-start-2">
              <div className="zero-one-pricing-carousel__dots" aria-label="Choose package">
                {packages.map((pkg, index) => <button key={pkg.id} type="button" className={`zero-one-pricing-carousel__dot ${index === active ? 'is-active' : ''}`} onClick={() => move(index)} aria-label={`Show ${pkg.name}`}><span>{String(index + 1).padStart(2, '0')}</span></button>)}
              </div>
              <span className="zero-one-pricing-carousel__counter"><strong>{String(active + 1).padStart(2, '0')}</strong> / {String(packages.length).padStart(2, '0')}</span>
            </div>
          </div>
        )}
      </section>

      <section className="zero-one-custom-option border-t border-[#F7F5F0]/10 bg-[#0b0b0b] px-6 py-14 md:px-12">
        <div className="mx-auto max-w-7xl">
          <CustomPackageBuilder />
        </div>
      </section>

      <section className="border-t border-[#F7F5F0]/10 px-6 py-20 text-center md:px-12">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F14A0B]">Not sure where to start?</p>
        <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">Let’s find the right package for your next move.</h2>
        <a href="https://wa.me/201556764804?text=Hi%20ZERO%20ONE%2C%20I%27d%20like%20help%20choosing%20the%20right%20package." target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#F14A0B] px-7 py-4 text-sm font-bold text-[#111111] transition hover:scale-[1.02]">Talk to ZERO ONE <ArrowRight size={17} /></a>
      </section>
    </main>
  );
}
