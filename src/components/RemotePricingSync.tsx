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
  const groups = pkg.groups.map((group) => `<div class="zero-one-package__group"><h3>${esc(group.title)}</h3><ul class="zero-one-package__list">${group.items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div>`).join('');
  const message = encodeURIComponent(`Hi ZERO ONE, I'm interested in the ${pkg.name} package. I'd like to discuss the next steps.`);
  return `<article class="zero-one-package zero-one-package--${esc(pkg.tone)}"><span class="zero-one-package__glow" aria-hidden="true"></span>${pkg.popular ? '<span class="zero-one-package__popular">Most Popular</span>' : ''}<div class="zero-one-package__top"><span class="zero-one-package__name">${esc(pkg.name)}</span><span class="zero-one-package__tag">${esc(pkg.billing_label)}</span></div><div class="zero-one-package__price"><strong>${esc(pkg.price)}</strong><span>${esc(pkg.currency)} / ${esc(pkg.billing_label)}</span></div><div class="zero-one-package__rule"></div>${groups}<a class="zero-one-package__cta" href="${WHATSAPP}${message}" target="_blank" rel="noopener noreferrer">Start with ${esc(pkg.name)}</a></article>`;
}

function syncPricing(packages: PricingPackage[]) {
  const section = document.getElementById('zero-one-pricing');
  if (!section) return false;
  const grid = section.querySelector('.zero-one-pricing__grid');
  if (!grid) return false;
  const sorted = [...packages].sort((a, b) => a.sort_order - b.sort_order);
  grid.innerHTML = sorted.map(cardMarkup).join('');
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
      .then((data) => { if (active) setPackages(data); })
      .catch(() => undefined);

    return () => { active = false; };
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
