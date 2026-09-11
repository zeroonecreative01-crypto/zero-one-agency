import { useEffect, useState } from 'react';

type PricingGroup = { title: string; items: string[] };
type PricingPackage = { id: string; name: string; price: string; currency: string; billing_label: string; tone: 'starter' | 'growth' | 'premium'; popular: boolean; groups: PricingGroup[]; market_prices: Record<string, number>; sort_order: number };
type PricingState = PricingPackage[] | null;

const TEASERS = [
  { eyebrow: '01 / BUILD', title: 'A stronger foundation.', copy: 'A focused creative system built to make your brand look, sound, and move with intent.' },
  { eyebrow: '02 / SCALE', title: 'More momentum. Less noise.', copy: 'A deeper creative engine designed for brands ready to grow with consistency and clarity.' },
  { eyebrow: '03 / LEAD', title: 'Make the next move count.', copy: 'A complete creative direction for brands that are ready to raise the standard.' },
];

function esc(value: unknown) { return String(value).replace(/[&<>\"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' })[char] ?? char); }

function teaserMarkup(index: number) {
  const teaser = TEASERS[index % TEASERS.length];
  return `<article class="zero-one-package zero-one-package--${index === 2 ? 'premium' : index === 1 ? 'growth' : 'starter'} zero-one-package--homepage-teaser"><span class="zero-one-package__glow" aria-hidden="true"></span><div class="zero-one-package__signal"><span class="zero-one-package__signal-dot"></span><span>${teaser.eyebrow}</span></div><div class="zero-one-package__top"><span class="zero-one-package__name">${esc(teaser.title)}</span><span class="zero-one-package__tag">CREATIVE</span></div><div class="zero-one-package__teaser-copy"><span>What comes next</span><strong>${esc(teaser.copy)}</strong></div><div class="zero-one-package__teaser-note"><span>Packages are built around your goals, market, and next stage.</span></div><a class="zero-one-package__cta" href="/pricing">Explore the packages <span aria-hidden="true">→</span></a></article>`;
}

function renderPricing(section: HTMLElement, packages: PricingPackage[]) {
  const grid = section.querySelector('.zero-one-pricing__grid');
  if (!grid || !packages.length) return;
  const count = Math.min(packages.length, TEASERS.length);
  let activeIndex = 0;
  const render = (direction: 'next' | 'prev' | 'direct' = 'direct') => {
    grid.innerHTML = `<div class="zero-one-pricing-carousel zero-one-pricing-carousel--teaser" role="region" aria-label="Explore packages" aria-live="polite"><button type="button" class="zero-one-pricing-carousel__arrow zero-one-pricing-carousel__arrow--prev" data-pricing-prev aria-label="Previous preview">←</button><div class="zero-one-pricing-carousel__viewport"><div class="zero-one-pricing-carousel__card" data-direction="${direction}">${teaserMarkup(activeIndex)}</div></div><button type="button" class="zero-one-pricing-carousel__arrow zero-one-pricing-carousel__arrow--next" data-pricing-next aria-label="Next preview">→</button></div><div class="zero-one-pricing-carousel__footer"><div class="zero-one-pricing-carousel__dots" role="tablist" aria-label="Package preview">${Array.from({ length: count }, (_, index) => `<button type="button" role="tab" aria-selected="${index === activeIndex}" aria-label="Preview ${String(index + 1).padStart(2, '0')}" class="zero-one-pricing-carousel__dot${index === activeIndex ? ' is-active' : ''}" data-pricing-index="${index}"><span>${String(index + 1).padStart(2, '0')}</span></button>`).join('')}</div><div class="zero-one-pricing-carousel__counter"><strong>${String(activeIndex + 1).padStart(2, '0')}</strong><span>/ ${String(count).padStart(2, '0')}</span></div></div>`;
    grid.querySelector('[data-pricing-prev]')?.addEventListener('click', () => { activeIndex = (activeIndex - 1 + count) % count; render('prev'); });
    grid.querySelector('[data-pricing-next]')?.addEventListener('click', () => { activeIndex = (activeIndex + 1) % count; render('next'); });
    grid.querySelectorAll<HTMLElement>('[data-pricing-index]').forEach((button) => button.addEventListener('click', () => { const nextIndex = Number(button.dataset.pricingIndex ?? 0); const nextDirection = nextIndex >= activeIndex ? 'next' : 'prev'; activeIndex = nextIndex; render(nextDirection); }));
  };
  grid.className = 'zero-one-pricing__grid zero-one-pricing__grid--carousel zero-one-pricing__grid--teaser';
  render();
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
      renderPricing(section, packages);
    };
    run();
  }, [packages]);
  return null;
}
