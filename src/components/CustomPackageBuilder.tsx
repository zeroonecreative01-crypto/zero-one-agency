import React, { useEffect, useMemo, useRef, useState } from 'react';
import './CustomPackageBuilder.css';
import { formatMarketPrice, getMarket, getStoredMarket, MARKETS, SERVICE_PRICES, type MarketCode } from '../lib/pricingMatrix';

type QtyKey = 'posts' | 'reels' | 'stories' | 'videos' | 'motion';
type ToggleKey = 'strategy' | 'community' | 'reporting' | 'accountManager' | 'campaign' | 'ads' | 'brand' | 'landing' | 'website' | 'seo';
type Selection = Record<QtyKey, number> & Record<ToggleKey, boolean>;

const defaults: Selection = { posts: 8, reels: 0, stories: 8, videos: 0, motion: 0, strategy: false, community: false, reporting: false, accountManager: false, campaign: false, ads: false, brand: false, landing: false, website: false, seo: false };
const quantityOptions: Array<{ key: QtyKey; label: string; min: number; max: number; step: number }> = [
  { key: 'posts', label: 'Social posts', min: 0, max: 40, step: 4 },
  { key: 'stories', label: 'Story designs', min: 0, max: 40, step: 4 },
  { key: 'reels', label: 'Reels', min: 0, max: 12, step: 2 },
  { key: 'videos', label: 'Product / promo videos', min: 0, max: 6, step: 1 },
  { key: 'motion', label: 'Motion graphics', min: 0, max: 6, step: 1 },
];
const toggleOptions: Array<{ key: ToggleKey; label: string; description: string; group: string }> = [
  { key: 'strategy', label: 'Creative strategy', description: 'Monthly direction and content planning', group: 'Strategy & Support' },
  { key: 'community', label: 'Community management', description: 'Comments, messages and daily moderation', group: 'Strategy & Support' },
  { key: 'reporting', label: 'Monthly performance report', description: 'Insights, reporting and recommendations', group: 'Strategy & Support' },
  { key: 'accountManager', label: 'Dedicated account manager', description: 'A dedicated point of contact for your brand', group: 'Strategy & Support' },
  { key: 'campaign', label: 'Campaign design', description: 'Campaign visual direction, design and copy', group: 'Design' },
  { key: 'ads', label: 'Paid advertising', description: 'Campaign setup, targeting and optimization', group: 'Design' },
  { key: 'brand', label: 'Brand identity', description: 'Core visual identity system', group: 'Design' },
  { key: 'landing', label: 'Landing page', description: 'Conversion-focused landing page', group: 'Digital' },
  { key: 'website', label: 'Website', description: 'Full premium marketing website', group: 'Digital' },
  { key: 'seo', label: 'SEO foundation', description: 'Technical and on-page SEO setup', group: 'Digital' },
];

function priceFor(key: string, market: MarketCode) { return SERVICE_PRICES[key]?.[market] ?? 0; }
function clamp(value: number, market: MarketCode) {
  const config = getMarket(market);
  const step = market === 'EG' ? 500 : 25;
  return Math.min(config.max, Math.max(config.min, Math.round(value / step) * step));
}
function calculatePrice(selection: Selection, market: MarketCode) {
  const config = getMarket(market);
  let price = config.min;
  quantityOptions.forEach((item) => {
    const quantity = selection[item.key];
    if (quantity <= 0) return;
    const baseIncluded = item.key === 'posts' || item.key === 'stories' ? 8 : 0;
    const extra = Math.max(0, quantity - baseIncluded);
    const volumeFactor = quantity > 24 ? 1.35 : quantity > 16 ? 1.18 : 1;
    price += extra * priceFor(item.key, market) * volumeFactor;
  });
  toggleOptions.forEach((item) => { if (selection[item.key]) price += priceFor(item.key, market); });
  if (selection.website && selection.landing) price -= priceFor('landing', market);
  if (selection.brand && selection.campaign) price -= market === 'KW' ? 40 : market === 'EG' ? 4000 : 200;
  return clamp(price, market);
}
function changeQuantity(setSelection: React.Dispatch<React.SetStateAction<Selection>>, item: (typeof quantityOptions)[number], direction: 1 | -1) {
  setSelection((current) => ({ ...current, [item.key]: Math.min(item.max, Math.max(item.min, current[item.key] + item.step * direction)) }));
}

export default function CustomPackageBuilder() {
  const previousSelection = useRef<Selection>(defaults);
  const [selection, setSelection] = useState<Selection>(defaults);
  const [market, setMarket] = useState<MarketCode>(getStoredMarket());
  const [openGroup, setOpenGroup] = useState('Content');
  const price = useMemo(() => calculatePrice(selection, market), [selection, market]);
  const config = getMarket(market);
  const atMax = price >= config.max;

  useEffect(() => {
    const onMarketChange = (event: Event) => {
      const code = (event as CustomEvent<{ code?: MarketCode }>).detail?.code;
      if (code && MARKETS.some((item) => item.code === code)) setMarket(code);
    };
    window.addEventListener('zero-one:market-change', onMarketChange);
    return () => window.removeEventListener('zero-one:market-change', onMarketChange);
  }, []);

  useEffect(() => {
    const previous = previousSelection.current;
    if (previous !== selection) {
      const changedQuantity = quantityOptions.find((item) => previous[item.key] !== selection[item.key]);
      const changedToggle = toggleOptions.find((item) => previous[item.key] !== selection[item.key]);
      if (changedQuantity) {
        const delta = selection[changedQuantity.key] - previous[changedQuantity.key];
        if (delta !== 0) window.dispatchEvent(new CustomEvent('zero-one:package-update', { detail: { title: `${changedQuantity.label} × ${Math.abs(delta)}`, tone: delta > 0 ? 'Added' : 'Removed', delta: price - calculatePrice(previous, market), total: price, currency: config.currency } }));
      } else if (changedToggle) {
        const added = selection[changedToggle.key];
        window.dispatchEvent(new CustomEvent('zero-one:package-update', { detail: { title: changedToggle.label, tone: added ? 'Added' : 'Removed', delta: price - calculatePrice(previous, market), total: price, currency: config.currency } }));
      }
    }
    previousSelection.current = selection;
  }, [selection, price, market, config.currency]);

  const requestPackage = () => {
    const selected = [
      `Social posts: ${selection.posts}`,
      `Story designs: ${selection.stories}`,
      `Reels: ${selection.reels}`,
      `Product / promo videos: ${selection.videos}`,
      `Motion graphics: ${selection.motion}`,
      ...toggleOptions.filter((item) => selection[item.key]).map((item) => item.label),
    ];
    const message = encodeURIComponent([
      "Hi ZERO ONE, I'd like to build a custom package.",
      `Market: ${config.country}`,
      `Estimated monthly investment: ${formatMarketPrice(price, market)} ${config.currency}`,
      '',
      ...selected,
      '',
      'I would like to discuss the final scope and next steps.',
    ].join('\n'));
    window.open(`https://wa.me/201556764804?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="zero-one-custom-package" className="zero-one-builder" aria-label="فصّل باقتك على مزاجك">
      <div className="zero-one-builder__intro">
        <div className="zero-one-builder__eyebrow"><span /> CUSTOM OPTION <span /></div>
        <h2>فصّل باقتك<br /><em>على مزاجك.</em></h2>
        <p>مش لازم تختار باقة جاهزة. اختار المحتوى والفيديو والتصميم والدعم اللي يناسب البراند بتاعك، وشوف التقدير الشهري بيتغير مع اختياراتك — من الحد الأدنى لحد أقصى استثمار مناسب للسوق اللي اخترته.</p>
      </div>
      <div className="zero-one-builder__layout">
        <div className="zero-one-builder__controls">
          <div className="zero-one-builder__topline"><span>01 — CONFIGURE</span><span>{formatMarketPrice(config.min, market)} — {formatMarketPrice(config.max, market)} {config.currency}</span></div>
          <BuilderGroup title="Content" number="01" open={openGroup === 'Content'} onToggle={() => setOpenGroup(openGroup === 'Content' ? '' : 'Content')}>
            {quantityOptions.slice(0, 3).map((item) => <QuantityControl key={item.key} item={item} value={selection[item.key]} onChange={(direction) => changeQuantity(setSelection, item, direction)} />)}
          </BuilderGroup>
          <BuilderGroup title="Video" number="02" open={openGroup === 'Video'} onToggle={() => setOpenGroup(openGroup === 'Video' ? '' : 'Video')}>
            {quantityOptions.slice(3).map((item) => <QuantityControl key={item.key} item={item} value={selection[item.key]} onChange={(direction) => changeQuantity(setSelection, item, direction)} />)}
          </BuilderGroup>
          <BuilderGroup title="Design" number="03" open={openGroup === 'Design'} onToggle={() => setOpenGroup(openGroup === 'Design' ? '' : 'Design')}>
            {toggleOptions.filter((item) => item.group === 'Design').map((item) => <ToggleControl key={item.key} item={item} checked={selection[item.key]} disabled={atMax && !selection[item.key]} price={priceFor(item.key, market)} onToggle={() => setSelection((current) => ({ ...current, [item.key]: !current[item.key] }))} />)}
          </BuilderGroup>
          <BuilderGroup title="Digital" number="04" open={openGroup === 'Digital'} onToggle={() => setOpenGroup(openGroup === 'Digital' ? '' : 'Digital')}>
            {toggleOptions.filter((item) => item.group === 'Digital').map((item) => <ToggleControl key={item.key} item={item} checked={selection[item.key]} disabled={(item.key === 'landing' && selection.website) || (atMax && !selection[item.key])} price={priceFor(item.key, market)} note={item.key === 'landing' && selection.website ? 'Included with Website' : undefined} onToggle={() => setSelection((current) => ({ ...current, [item.key]: !current[item.key] }))} />)}
          </BuilderGroup>
          <BuilderGroup title="Strategy & Support" number="05" open={openGroup === 'Strategy & Support'} onToggle={() => setOpenGroup(openGroup === 'Strategy & Support' ? '' : 'Strategy & Support')}>
            {toggleOptions.filter((item) => item.group === 'Strategy & Support').map((item) => <ToggleControl key={item.key} item={item} checked={selection[item.key]} disabled={atMax && !selection[item.key]} price={priceFor(item.key, market)} onToggle={() => setSelection((current) => ({ ...current, [item.key]: !current[item.key] }))} />)}
          </BuilderGroup>
        </div>
        <aside className="zero-one-builder__summary">
          <div className="zero-one-builder__summary-head"><span>YOUR PACKAGE · {config.country.toUpperCase()}</span><span>LIVE ESTIMATE</span></div>
          <div className="zero-one-builder__price"><strong>{formatMarketPrice(price, market)}</strong><span>{config.currency} / MONTH</span></div>
          <div className="zero-one-builder__meter"><span style={{ width: `${((price - config.min) / (config.max - config.min)) * 100}%` }} /></div>
          <div className="zero-one-builder__range"><span>{formatMarketPrice(config.min, market)}</span><span>{atMax ? 'MAXIMUM' : `${formatMarketPrice(config.max, market)} ${config.currency}`}</span></div>
          <div className="zero-one-builder__selected">
            <Selected label={`${selection.posts} Social posts`} active={selection.posts > 0} />
            <Selected label={`${selection.stories} Story designs`} active={selection.stories > 0} />
            <Selected label={`${selection.reels} Reels`} active={selection.reels > 0} />
            <Selected label={`${selection.videos} Product / promo videos`} active={selection.videos > 0} />
            <Selected label={`${selection.motion} Motion graphics`} active={selection.motion > 0} />
            {toggleOptions.filter((item) => selection[item.key]).map((item) => <Selected key={item.key} label={item.label} active />)}
          </div>
          <button type="button" className="zero-one-builder__cta" onClick={requestPackage}>REQUEST MY PACKAGE <span>↗</span></button>
          <p className="zero-one-builder__note">Final scope is confirmed with our team. Your estimate is based on the mix you selected.</p>
        </aside>
      </div>
    </section>
  );
}

function BuilderGroup({ title, number, open, onToggle, children }: { title: string; number: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return <div className={`zero-one-builder__group${open ? ' is-open' : ''}`}><button type="button" className="zero-one-builder__group-head" onClick={onToggle}><span><small>{number}</small>{title}</span><b>{open ? '−' : '+'}</b></button><div className="zero-one-builder__group-body">{children}</div></div>;
}
function QuantityControl({ item, value, onChange }: { item: (typeof quantityOptions)[number]; value: number; onChange: (direction: 1 | -1) => void }) {
  return <div className="zero-one-builder__control"><div><strong>{item.label}</strong><small>{item.key === 'posts' ? 'Choose your monthly volume' : 'Add to your monthly mix'}</small></div><div className="zero-one-builder__stepper"><button type="button" aria-label={`Decrease ${item.label}`} onClick={() => onChange(-1)} disabled={value <= item.min}>−</button><span>{value}</span><button type="button" aria-label={`Increase ${item.label}`} onClick={() => onChange(1)} disabled={value >= item.max}>+</button></div></div>;
}
function ToggleControl({ item, checked, disabled, note, price, onToggle }: { item: (typeof toggleOptions)[number]; checked: boolean; disabled?: boolean; note?: string; price: number; onToggle: () => void }) {
  return <button type="button" className={`zero-one-builder__toggle${checked ? ' is-selected' : ''}`} onClick={onToggle} disabled={disabled}><span className="zero-one-builder__toggle-mark">{checked ? '✓' : '+'}</span><span><strong>{item.label}</strong><small>{note ?? item.description}</small></span><b>{checked ? 'SELECTED' : `+${price.toLocaleString()} ${price >= 1000 ? ' ' : ''}`}</b></button>;
}
function Selected({ label, active }: { label: string; active: boolean }) {
  return <div className={`zero-one-builder__selected-item${active ? ' is-active' : ''}`}><span>{active ? '●' : '○'}</span>{label}</div>;
}
