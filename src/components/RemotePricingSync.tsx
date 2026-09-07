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
  const toneLabel = pkg.tone === 'premium' ? 'Premium' : pkg.tone === 'growth' ? 'Growth' : 'Starter';
  return `<article class="zero-one-package zero-one-package--${esc(pkg.tone)}" data-package-name="${esc(pkg.name)}"><span class="zero-one-package__glow" aria-hidden="true"></span>${pkg.popular ? '<span class="zero-one-package__popular">Most Popular</span>' : ''}<div class="zero-one-package__signal"><span class="zero-one-package__signal-dot"></span><span>${toneLabel} package</span></div><div class="zero-one-package__top"><span class="zero-one-package__name">${esc(pkg.name)}</span><span class="zero-one-package__tag">${esc(pkg.billing_label)}</span></div><div class="zero-one-package__price"><strong>${esc(pkg.price)}</strong><span>${esc(pkg.currency)} / ${esc(pkg.billing_label)}</span></div><div class="zero-one-package__rule"></div>${groups}<a class="zero-one-package__cta" href="${WHATSAPP}${message}" target="_blank" rel="noopener noreferrer">Start with ${esc(pkg.name)}</a></article>`;
}

function publishPackageSignal(pkg: PricingPackage) {
  window.dispatchEvent(new CustomEvent('zero-one:pricing-focus', { detail: { name: pkg.name, tone: pkg.tone, popular: pkg.popular } }));
}

function syncPricing(packages: PricingPackage[]) {
  const section = document.getElementById('zero-one-pricing');
  if (!section) return false;
  const grid = section.querySelector('.zero-one-pricing__grid');
  if (!grid) return false;

  const sorted = [...packages].sort((a, b) => a.sort_order - b.sort_order);
  let activeIndex = 0;

  const render = (direction: 'next' | 'prev' | 'direct' = 'direct') => {
    const pkg = sorted[activeIndex];
    grid.innerHTML = `
      <div class="zero-one-pricing-carousel" role="region" aria-label="Pricing packages" aria-live="polite">
        <button type="button" class="zero-one-pricing-carousel__arrow zero-one-pricing-carousel__arrow--prev" data-pricing-prev aria-label="Previous package">←</button>
        <div class="zero-one-pricing-carousel__viewport">
          <div class="zero-one-pricing-carousel__card" data-direction="${direction}">${cardMarkup(pkg)}</div>
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

    const packageCard = grid.querySelector('.zero-one-package') as HTMLElement | null;
    packageCard?.addEventListener('mousemove', (event) => {
      if (window.matchMedia('(pointer: coarse)').matches) return;
      const rect = packageCard.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      packageCard.style.setProperty('--tilt-x', `${(-y * 3).toFixed(2)}deg`);
      packageCard.style.setProperty('--tilt-y', `${(x * 3).toFixed(2)}deg`);
      packageCard.style.setProperty('--spot-x', `${(x + 0.5) * 100}%`);
      packageCard.style.setProperty('--spot-y', `${(y + 0.5) * 100}%`);
    });
    packageCard?.addEventListener('mouseleave', () => {
      packageCard.style.setProperty('--tilt-x', '0deg');
      packageCard.style.setProperty('--tilt-y', '0deg');
      packageCard.style.setProperty('--spot-x', '50%');
      packageCard.style.setProperty('--spot-y', '34%');
    });
    packageCard?.addEventListener('mouseenter', () => publishPackageSignal(pkg));

    const prev = grid.querySelector('[data-pricing-prev]');
    const next = grid.querySelector('[data-pricing-next]');
    prev?.addEventListener('click', () => {
      activeIndex = (activeIndex - 1 + sorted.length) % sorted.length;
      publishPackageSignal(sorted[activeIndex]);
      render('prev');
    });
    next?.addEventListener('click', () => {
      activeIndex = (activeIndex + 1) % sorted.length;
      publishPackageSignal(sorted[activeIndex]);
      render('next');
    });
    grid.querySelectorAll<HTMLElement>('[data-pricing-index]').forEach((button) => {
      button.addEventListener('click', () => {
        const nextIndex = Number(button.dataset.pricingIndex ?? 0);
        const nextDirection = nextIndex >= activeIndex ? 'next' : 'prev';
        activeIndex = nextIndex;
        publishPackageSignal(sorted[activeIndex]);
        render(nextDirection);
      });
    });

    section.querySelector('.zero-one-pricing__carousel-intro')?.remove();
  };

  grid.className = 'zero-one-pricing__grid zero-one-pricing__grid--carousel';
  publishPackageSignal(sorted[0]);
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
