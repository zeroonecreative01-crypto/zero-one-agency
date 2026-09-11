import { useEffect, useState } from 'react';
import { getStoredMarket, MARKETS, setStoredMarket, type MarketCode } from '../lib/pricingMatrix';

type PricingGroup = { title: string; items: string[] };
type PricingPackage = { id: string; name: string; price: string; currency: string; billing_label: string; tone: 'starter' | 'growth' | 'premium'; popular: boolean; groups: PricingGroup[]; market_prices: Partial<Record<MarketCode, number>>; sort_order: number };
type PricingState = PricingPackage[] | null;

function esc(value: unknown) { return String(value).replace(/[&<>\"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' })[char] ?? char); }

function teaserMarkup(pkg: PricingPackage) {
  const toneLabel = pkg.tone === 'premium' ? 'Premium' : pkg.tone === 'growth' ? 'Growth' : 'Starter';
  const highlights = pkg.groups.flatMap((group) => group.items).slice(0, 3);
  return `<article class="zero-one-package zero-one-package--${esc(pkg.tone)}" data-package-name="${esc(pkg.name)}"><span class="zero-one-package__glow" aria-hidden="true"></span>${pkg.popular ? '<span class="zero-one-package__popular">Most Popular</span>' : ''}<div class="zero-one-package__signal"><span class="zero-one-package__signal-dot"></span><span>${toneLabel} package</span></div><div class="zero-one-package__top"><span class="zero-one-package__name">${esc(pkg.name)}</span><span class="zero-one-package__tag">${esc(pkg.billing_label)}</span></div><div class="zero-one-package__teaser-copy"><span>Built for brands ready to move</span><strong>${highlights.map((item) => esc(item)).join(' · ')}</strong></div><a class="zero-one-package__cta" href="/pricing">Explore the packages <span aria-hidden="true">→</span></a></article>`;
}

function publishPackageSignal(pkg: PricingPackage) { window.dispatchEvent(new CustomEvent('zero-one:pricing-focus', { detail: { name: pkg.name, tone: pkg.tone, popular: pkg.popular } })); }

function renderPricing(section: HTMLElement, packages: PricingPackage[]) {
  const grid = section.querySelector('.zero-one-pricing__grid');
  if (!grid) return;
  const sorted = [...packages].sort((a, b) => a.sort_order - b.sort_order);
  let activeIndex = 0;
  const render = (direction: 'next' | 'prev' | 'direct' = 'direct') => {
    const pkg = sorted[activeIndex];
    if (!pkg) return;
    grid.innerHTML = `<div class="zero-one-pricing-carousel zero-one-pricing-carousel--teaser" role="region" aria-label="Explore packages" aria-live="polite"><button type="button" class="zero-one-pricing-carousel__arrow zero-one-pricing-carousel__arrow--prev" data-pricing-prev aria-label="Previous package">←</button><div class="zero-one-pricing-carousel__viewport"><div class="zero-one-pricing-carousel__card" data-direction="${direction}">${teaserMarkup(pkg)}</div></div><button type="button" class="zero-one-pricing-carousel__arrow zero-one-pricing-carousel__arrow--next" data-pricing-next aria-label="Next package">→</button></div><div class="zero-one-pricing-carousel__footer"><div class="zero-one-pricing-carousel__dots" role="tablist" aria-label="Select package preview">${sorted.map((item, index) => `<button type="button" role="tab" aria-selected="${index === activeIndex}" aria-label="Preview ${esc(item.name)} package" class="zero-one-pricing-carousel__dot${index === activeIndex ? ' is-active' : ''}" data-pricing-index="${index}"><span>${String(index + 1).padStart(2, '0')}</span></button>`).join('')}</div><div class="zero-one-pricing-carousel__counter"><strong>${String(activeIndex + 1).padStart(2, '0')}</strong><span>/ ${String(sorted.length).padStart(2, '0')}</span></div></div><div class="zero-one-pricing__teaser-footer"><span>Three ways to move your brand forward.</span><a href="/pricing">See what’s inside <span aria-hidden="true">→</span></a></div>`;
    grid.querySelector('[data-pricing-prev]')?.addEventListener('click', () => { activeIndex = (activeIndex - 1 + sorted.length) % sorted.length; publishPackageSignal(sorted[activeIndex]); render('prev'); });
    grid.querySelector('[data-pricing-next]')?.addEventListener('click', () => { activeIndex = (activeIndex + 1) % sorted.length; publishPackageSignal(sorted[activeIndex]); render('next'); });
    grid.querySelectorAll<HTMLElement>('[data-pricing-index]').forEach((button) => button.addEventListener('click', () => { const nextIndex = Number(button.dataset.pricingIndex ?? 0); const nextDirection = nextIndex >= activeIndex ? 'next' : 'prev'; activeIndex = nextIndex; publishPackageSignal(sorted[activeIndex]); render(nextDirection); }));
  };
  grid.className = 'zero-one-pricing__grid zero-one-pricing__grid--carousel zero-one-pricing__grid--teaser';
  render();
}

function setupMarketSelector(section: HTMLElement, packages: PricingPackage[], initialMarket: MarketCode) {
  let market = initialMarket;
  const intro = section.querySelector('.zero-one-pricing__intro');
  if (!intro || intro.querySelector('[data-market-selector]')) return;
  const selector = document.createElement('div');
  selector.className = 'zero-one-market-selector';
  selector.setAttribute('data-market-selector', 'true');
  selector.innerHTML = `<span class="zero-one-market-selector__label">Your market</span><div class="zero-one-market-selector__options" role="tablist" aria-label="Choose your market">${MARKETS.map((item) => `<button type="button" role="tab" aria-selected="${item.code === market}" class="zero-one-market-selector__option${item.code === market ? ' is-active' : ''}" data-market-code="${item.code}"><span>${item.flag}</span><strong>${item.country}</strong><small>${item.currency}</small></button>`).join('')}</div>`;
  intro.appendChild(selector);
  selector.querySelectorAll<HTMLButtonElement>('[data-market-code]').forEach((button) => button.addEventListener('click', () => {
    const code = button.dataset.marketCode as MarketCode;
    if (!MARKETS.some((item) => item.code === code)) return;
    market = code;
    setStoredMarket(code);
    selector.querySelectorAll('[data-market-code]').forEach((item) => {
      item.classList.toggle('is-active', (item as HTMLElement).dataset.marketCode === market);
      item.setAttribute('aria-selected', String((item as HTMLElement).dataset.marketCode === market));
    });
    renderPricing(section, packages);
  }));
  renderPricing(section, packages);
}

export default function RemotePricingSync() {
  const [packages, setPackages] = useState<PricingState>(null);
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
    if (!supabaseUrl || !supabaseKey || (window.location.pathname !== '/' && window.location.pathname !== '')) return;
    let active = true;
    fetch(`${supabaseUrl}/rest/v1/pricing_packages?select=id,name,price,currency,billing_label,tone,popular,groups,market_prices,sort_order&order=sort_order.asc,created_at.desc`, { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } })
      .then(async (response) => { if (!response.ok) throw new Error('Pricing request failed'); return response.json() as Promise<PricingPackage[]>; })
      .then((data) => { if (active) setPackages(data); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!packages) return;
    let attempts = 0;
    const run = () => {
      const section = document.getElementById('zero-one-pricing');
      if (!section) { if (attempts++ < 40) window.setTimeout(run, 100); return; }
      if (!section.querySelector('[data-market-selector]')) setupMarketSelector(section, packages, getStoredMarket());
      else renderPricing(section, packages);
    };
    run();
  }, [packages]);
  useEffect(() => {
    const onMarketChange = () => { if (!packages) return; const section = document.getElementById('zero-one-pricing'); if (section) renderPricing(section, packages); };
    window.addEventListener('zero-one:market-change', onMarketChange);
    return () => window.removeEventListener('zero-one:market-change', onMarketChange);
  }, [packages]);
  return null;
}
