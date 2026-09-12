import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown } from 'lucide-react';
import { getMarket, getStoredMarket, MARKETS, formatMarketPrice, setStoredMarket, type MarketCode } from '../lib/pricingMatrix';

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

function normalizePackage(item: PricingPackage): PricingPackage {
  return {
    ...item,
    groups: Array.isArray(item.groups)
      ? item.groups.filter((group) => group && typeof group.title === 'string').map((group) => ({
          title: group.title,
          items: Array.isArray(group.items) ? group.items.filter((value) => typeof value === 'string') : [],
        })).filter((group) => group.title && group.items.length)
      : [],
    market_prices: item.market_prices && typeof item.market_prices === 'object' ? item.market_prices : {},
    sort_order: Number(item.sort_order) || 0,
  };
}

export default function PricingPage() {
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [market, setMarket] = useState<MarketCode>(() => getStoredMarket());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Packages — ZERO ONE';
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
    if (!url || !key) { setLoading(false); return; }
    fetch(`${url}/rest/v1/pricing_packages?select=id,name,price,currency,billing_label,tone,popular,groups,market_prices,sort_order&order=sort_order.asc,created_at.desc`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
      .then(async (response) => { if (!response.ok) throw new Error('Pricing request failed'); return response.json() as Promise<PricingPackage[]>; })
      .then((items) => {
        const next = Array.isArray(items) ? items.map(normalizePackage).sort((a, b) => a.sort_order - b.sort_order) : [];
        setPackages(next);
        if (next[0]) setSelectedId(next.find((item) => item.popular)?.id ?? next[0].id);
      })
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  }, []);

  const selectedMarket = useMemo(() => getMarket(market), [market]);
  const selectedPackage = packages.find((item) => item.id === selectedId) ?? packages[0];

  const chooseMarket = (code: MarketCode) => {
    setMarket(code);
    setStoredMarket(code);
    window.dispatchEvent(new CustomEvent('zero-one:market-change', { detail: { code } }));
  };

  const selectPackage = (id: string) => setSelectedId((current) => current === id ? null : id);

  const packageMessage = selectedPackage
    ? `${WHATSAPP}${encodeURIComponent(`Hi ZERO ONE, I'm interested in the ${selectedPackage.name} package in ${selectedMarket.country}. I'd like to discuss the next steps.`)}`
    : `${WHATSAPP}${encodeURIComponent('Hi ZERO ONE, I would like help choosing the right package.')}`;

  return (
    <main id="zero-one-pricing" className="zero-one-pricing-page min-h-screen bg-[#0b0b0b] text-[#f7f5f0]">
      <header className="mx-auto max-w-7xl px-6 pb-10 pt-7 md:px-12 lg:px-16">
        <div className="flex items-center justify-between border-b border-white/[.08] pb-5">
          <a href="/" className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.18em] text-white/45 transition hover:text-[#f14a0b]"><ArrowLeft size={15} /> Back home</a>
          <span className="text-[10px] font-bold uppercase tracking-[.22em] text-[#f14a0b]">ZERO ONE / Packages</span>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-14 md:px-12 lg:px-16">
        <div className="zero-one-pricing__intro">
          <div className="mb-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[.28em] text-[#f14a0b]"><span className="h-px w-8 bg-[#f14a0b]/60" /> Investment</div>
          <h1>Choose the level.<br /><span>We’ll build the momentum.</span></h1>
          <p>Three focused monthly retainers. Select a package to explore its scope, switch your market to see local pricing, or build something completely custom below.</p>
        </div>

        <div className="zero-one-pricing__market">
          <span>Pricing for</span>
          <div className="zero-one-pricing__market-list">
            {MARKETS.map((item) => (
              <button key={item.code} type="button" onClick={() => chooseMarket(item.code)} aria-pressed={item.code === market} className={item.code === market ? 'is-active' : ''}>
                <span>{item.flag}</span>{item.country}<small>{item.currency}</small>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-28 md:px-12 lg:px-16">
        {loading ? (
          <div className="rounded-2xl border border-white/[.08] p-10 text-sm text-white/35">Loading packages...</div>
        ) : packages.length === 0 ? (
          <div className="rounded-2xl border border-white/[.08] p-10 text-sm text-white/35">Packages are currently being updated. Contact ZERO ONE for the latest options.</div>
        ) : (
          <>
            <div className="zero-one-package-grid">
              {packages.map((pkg, index) => {
                const active = pkg.id === selectedPackage?.id;
                const previewItems = pkg.groups.flatMap((group) => group.items).slice(0, 3);
                return (
                  <button key={`${pkg.id}-${market}`} type="button" onClick={() => selectPackage(pkg.id)} aria-pressed={active} className={`zero-one-package-card ${active ? 'is-active' : ''}`}>
                    <span className="zero-one-package-card__ghost">{String(index + 1).padStart(2, '0')}</span>
                    <div className="zero-one-package-card__meta">
                      <span>{pkg.billing_label || 'MONTHLY RETAINER'}</span>
                      {pkg.popular ? <b><i /> Recommended</b> : null}
                    </div>
                    <div className="zero-one-package-card__title-row">
                      <div><span className="zero-one-package-card__eyebrow">LEVEL {String(index + 1).padStart(2, '0')}</span><h2>{pkg.name}</h2></div>
                      <span className="zero-one-package-card__arrow"><ArrowRight size={16} /></span>
                    </div>
                    <div className="zero-one-package-card__price"><strong>{formatMarketPrice(localPrice(pkg, market), market)}</strong><span>{selectedMarket.currency}<br />/ MONTH</span></div>
                    <ul className="zero-one-package-card__preview">
                      {previewItems.map((item, itemIndex) => <li key={`${pkg.id}-preview-${itemIndex}`}><span />{item}</li>)}
                    </ul>
                    <div className="zero-one-package-card__footer"><span>{active ? 'Selected' : 'Explore scope'}</span><span>{pkg.groups.length} focus areas</span></div>
                  </button>
                );
              })}
            </div>

            {selectedPackage && (
              <div className="zero-one-package-detail">
                <div className="zero-one-package-detail__head">
                  <div><span>Selected package</span><h2>{selectedPackage.name}</h2></div>
                  <a href={packageMessage} target="_blank" rel="noopener noreferrer">Start with {selectedPackage.name}<ArrowRight size={16} /></a>
                </div>
                <div className="zero-one-package-detail__groups">
                  {selectedPackage.groups.map((group) => (
                    <div className="zero-one-package-detail__group" key={`${selectedPackage.id}-${group.title}`}>
                      <div><span>{group.title}</span><ChevronDown size={15} /></div>
                      <ul>{group.items.map((item, index) => <li key={`${group.title}-${index}`}><Check size={14} />{item}</li>)}</ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <section className="zero-one-custom-option border-t border-white/[.08] bg-[#101010] px-6 py-24 md:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#f14a0b]">Custom Studio</p>
            <h2 className="mt-3 text-5xl font-bold tracking-[-.055em] md:text-7xl">Build it around<br /><span className="text-white/35">what you actually need.</span></h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/40">Choose the content, video, design, digital and support your brand actually needs. Your monthly estimate updates as you build.</p>
          </div>
          <div id="zero-one-custom-package-mount" />
        </div>
      </section>

      <section className="border-t border-white/[.08] px-6 py-24 text-center md:px-12">
        <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#f14a0b]">Need a recommendation?</p>
        <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-[-.04em] md:text-6xl">Tell us where the brand is going. We’ll help choose the right level.</h2>
        <a href={`${WHATSAPP}${encodeURIComponent("Hi ZERO ONE, I'd like help choosing the right package.")}`} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#f7f5f0] px-7 py-4 text-[11px] font-bold uppercase tracking-[.12em] text-[#0b0b0b] transition hover:-translate-y-0.5 hover:bg-[#f14a0b]">Talk to ZERO ONE <ArrowRight size={16} /></a>
      </section>
    </main>
  );
}
