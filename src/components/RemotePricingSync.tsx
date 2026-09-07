import { useEffect, useState } from 'react';

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
  sort_order: number;
};

type PricingState = PricingPackage[] | null;

const WHATSAPP = 'https://wa.me/201556764804?text=';

function esc(value: unknown) {
  return String(value).replace(/[&<>\"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' })[char] ?? char);
}

function cardMarkup(pkg: PricingPackage) {
  const groups = pkg.groups
    .map(
      (group) =>
        `<div class="zero-one-package__group"><h3>${esc(group.title)}</h3><ul class="zero-one-package__list">${group.items
          .map((item) => `<li>${esc(item)}</li>`)
          .join('')}</ul></div>`,
    )
    .join('');
  const message = encodeURIComponent(`Hi ZERO ONE, I'm interested in the ${pkg.name} package. I'd like to discuss the next steps.`);
  return `<article class="zero-one-package zero-one-package--${esc(pkg.tone)}"><span class="zero-one-package__glow" aria-hidden="true"></span>${pkg.popular ? '<span class="zero-one-package__popular">Most Popular</span>' : ''}<div class="zero-one-package__top"><span class="zero-one-package__name">${esc(pkg.name)}</span><span class="zero-one-package__tag">${esc(pkg.billing_label)}</span></div><div class="zero-one-package__price"><strong>${esc(pkg.price)}</strong><span>${esc(pkg.currency)} / ${esc(pkg.billing_label)}</span></div><div class="zero-one-package__rule"></div>${groups}<a class="zero-one-package__cta" href="${WHATSAPP}${message}" target="_blank" rel="noopener noreferrer">Start with ${esc(pkg.name)}</a></article>`;
}

function syncPricing(packages: PricingPackage[]) {
  const section = document.getElementById('zero-one-pricing');
  if (!section) return false;
  const grid = section.querySelector('.zero-one-pricing__grid');
  if (!grid) return false;

  const sorted = [...packages].sort((a, b) => a.sort_order - b.sort_order);
  let activeIndex = 0;

  const render = () => {
    const pkg = sorted[activeIndex];
    grid.innerHTML = `
      <div class="zero-one-pricing-carousel" role="region" aria-label="Pricing packages" aria-live="polite">
        <button type="button" class="zero-one-pricing-carousel__arrow zero-one-pricing-carousel__arrow--prev" data-pricing-prev aria-label="Previous package">←</button>
        <div class="zero-one-pricing-carousel__viewport">
          <div class="zero-one-pricing-carousel__card">${cardMarkup(pkg)}</div>
        </div>
        <button type="button" class="zero-one-pricing-carousel__arrow zero-one-pricing-carousel__arrow--next" data-pricing-next aria-label="Next package">→</button>
      </div>
      <div class="zero-one-pricing-carousel__footer">
        <div class="zero-one-pricing-carousel__dots" role="tablist" aria-label="Select pricing package">
          ${sorted
            .map(
              (item, index) =>
                `<button type="button" role="tab" aria-selected="${index === activeIndex}" aria-label="View ${esc(item.name)} package" class="zero-one-pricing-carousel__dot${
                  index === activeIndex ? ' is-active' : ''
                }" data-pricing-index="${index}"><span>${String(index + 1).padStart(2, '0')}</span></button>`,
            )
            .join('')}
        </div>
        <div class="zero-one-pricing-carousel__counter"><strong>${String(activeIndex + 1).padStart(2, '0')}</strong><span>/ ${String(sorted.length).padStart(2, '0')}</span></div>
      </div>
    `;

    const prev = grid.querySelector('[data-pricing-prev]');
    const next = grid.querySelector('[data-pricing-next]');
    prev?.addEventListener('click', () => {
      activeIndex = (activeIndex - 1 + sorted.length) % sorted.length;
      render();
    });
    next?.addEventListener('click', () => {
      activeIndex = (activeIndex + 1) % sorted.length;
      render();
    });
    grid.querySelectorAll<HTMLElement>('[data-pricing-index]').forEach((button) => {
      button.addEventListener('click', () => {
        activeIndex = Number(button.dataset.pricingIndex ?? 0);
        render();
      });
    });

    section.querySelector('.zero-one-pricing__carousel-intro')?.remove();
  };

  grid.className = 'zero-one-pricing__grid zero-one-pricing__grid--carousel';
  render();
  return true;
}

export default function RemotePricingSync() {
  const [packages, setPackages] = useState<PricingState>(null);

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
    if (!supabaseUrl || !supabaseKey || (window.location.pathname !== '/' && window.location.pathname !== '')) return;

    let active = true;
    fetch(`${supabaseUrl}/rest/v1/pricing_packages?select=id,name,price,currency,billing_label,tone,popular,groups,sort_order&order=sort_order.asc,created_at.desc`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Pricing request failed');
        return response.json() as Promise<PricingPackage[]>;
      })
      .then((data) => {
        if (active) setPackages(data);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!packages) return;
    let attempts = 0;
    const run = () => {
      if (syncPricing(packages) || attempts++ > 40) return;
      window.setTimeout(run, 100);
    };
    run();
  }, [packages]);

  return null;
}
