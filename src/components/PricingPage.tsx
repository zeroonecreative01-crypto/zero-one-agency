import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
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

const toneLabel: Record<PricingPackage['tone'], string> = {
  starter: 'Starter',
  growth: 'Growth',
  premium: 'Premium',
};

const WHATSAPP = 'https://wa.me/201556764804?text=';

function localPrice(pkg: PricingPackage, market: MarketCode) {
  const configured = Number(pkg.market_prices?.[market]);
  return Number.isFinite(configured) && configured > 0 ? configured : Number(pkg.price) || 0;
}

export default function PricingPage() {
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [market, setMarket] = useState<MarketCode>(() => getStoredMarket());

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
      .then(setPackages)
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  }, []);

  const selectedMarket = useMemo(() => getMarket(market), [market]);

  const chooseMarket = (code: MarketCode) => {
    setMarket(code);
    setStoredMarket(code);
  };

  return (
    <main className="min-h-screen bg-[#111111] text-[#F7F5F0]">
      <header className="mx-auto max-w-7xl px-6 pb-14 pt-8 md:px-12 lg:px-16">
        <div className="flex items-center justify-between border-b border-[#F7F5F0]/10 pb-6">
          <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#F7F5F0]/65 transition hover:text-[#F14A0B]"><ArrowLeft size={16} /> Back home</a>
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#F14A0B]">ZERO ONE / Packages</span>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-16 md:px-12 lg:px-16">
        <div className="max-w-4xl">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.24em] text-[#F14A0B]">Built around your next move</p>
          <h1 className="text-6xl font-bold tracking-[-0.055em] md:text-8xl lg:text-[9rem] lg:leading-[0.86]">Choose your<br /><span className="text-[#F14A0B]">level.</span></h1>
          <p className="mt-8 max-w-2xl text-base leading-7 text-[#F7F5F0]/55 md:text-lg">Clear packages. Serious creative. Everything you need to move from an idea to a brand people remember.</p>
        </div>

        <div className="mt-14 border-y border-[#F7F5F0]/10 py-5">
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
        {loading ? (
          <div className="border border-[#F7F5F0]/10 p-10 text-sm text-[#F7F5F0]/45">Loading packages...</div>
        ) : packages.length === 0 ? (
          <div className="border border-[#F7F5F0]/10 p-10 text-sm text-[#F7F5F0]/45">Packages are currently being updated. Contact ZERO ONE for the latest options.</div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            {[...packages].sort((a, b) => a.sort_order - b.sort_order).map((pkg) => {
              const price = localPrice(pkg, market);
              const message = encodeURIComponent(`Hi ZERO ONE, I'm interested in the ${pkg.name} package in ${selectedMarket.country}. I'd like to discuss the next steps.`);
              return (
                <article key={pkg.id} className={`group relative flex flex-col overflow-hidden border p-7 transition duration-500 hover:-translate-y-1 md:p-9 ${pkg.popular ? 'border-[#F14A0B]/70' : 'border-[#F7F5F0]/10 hover:border-[#F7F5F0]/25'}`}>
                  <div className="absolute right-0 top-0 h-32 w-32 translate-x-10 -translate-y-10 rounded-full bg-[#F14A0B]/10 blur-3xl transition group-hover:bg-[#F14A0B]/20" />
                  {pkg.popular && <span className="relative mb-7 inline-flex w-fit rounded-full bg-[#F14A0B] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#111111]">Most Popular</span>}
                  {!pkg.popular && <span className="relative mb-7 text-[10px] font-bold uppercase tracking-[0.18em] text-[#F7F5F0]/35">{toneLabel[pkg.tone]}</span>}
                  <div className="relative flex items-start justify-between gap-4 border-b border-[#F7F5F0]/10 pb-7">
                    <div><h2 className="text-3xl font-bold tracking-tight">{pkg.name}</h2><p className="mt-2 text-xs uppercase tracking-[0.14em] text-[#F7F5F0]/35">{pkg.billing_label}</p></div>
                    <div className="text-right"><strong className="block text-3xl font-bold tracking-tight">{formatMarketPrice(price, market)}</strong><span className="text-xs text-[#F7F5F0]/40">{selectedMarket.currency}</span></div>
                  </div>
                  <div className="relative flex-1 pt-7">
                    {pkg.groups.map((group) => (
                      <div key={group.title} className="mb-7 last:mb-0">
                        <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#F14A0B]">{group.title}</h3>
                        <ul className="space-y-2.5">
                          {group.items.map((item) => <li key={item} className="flex gap-2.5 text-sm leading-5 text-[#F7F5F0]/62"><Check size={15} className="mt-0.5 shrink-0 text-[#F14A0B]" />{item}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <a href={`${WHATSAPP}${message}`} target="_blank" rel="noopener noreferrer" className="relative mt-9 inline-flex items-center justify-between border border-[#F7F5F0]/15 px-5 py-4 text-sm font-bold transition hover:border-[#F14A0B] hover:bg-[#F14A0B] hover:text-[#111111]">Start with {pkg.name}<ArrowRight size={17} /></a>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="border-t border-[#F7F5F0]/10 px-6 py-20 text-center md:px-12">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F14A0B]">Not sure where to start?</p>
        <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">Let’s find the right package for your next move.</h2>
        <a href="https://wa.me/201556764804?text=Hi%20ZERO%20ONE%2C%20I%27d%20like%20help%20choosing%20the%20right%20package." target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#F14A0B] px-7 py-4 text-sm font-bold text-[#111111] transition hover:scale-[1.02]">Talk to ZERO ONE <ArrowRight size={17} /></a>
      </section>
    </main>
  );
}
