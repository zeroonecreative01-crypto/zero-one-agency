import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Work', href: '/work' },
  { label: 'Services', href: '/services' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Pricing', href: '/#zero-one-pricing' },
];

const WELCOME_MESSAGES = [
  'Welcome to ZERO ONE — we build brands that move people.',
  'Welcome to ZERO ONE — strategy, design, content and digital.',
  'Welcome to ZERO ONE — creative built with intention.',
];

type IslandMessage = { title: string; delta?: number; total?: number; tone?: string };

function navigate(href: string) {
  if (href.startsWith('/#')) {
    const hash = href.slice(2);
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    window.setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
    return;
  }
  window.history.pushState({}, '', href);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export default function FloatingIsland() {
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState<string>('ZERO ONE');
  const [packageUpdate, setPackageUpdate] = useState<IslandMessage | null>(null);
  const [welcome, setWelcome] = useState(false);
  const [touchDevice, setTouchDevice] = useState(false);
  const hideTimer = useRef<number | null>(null);
  const messageTimer = useRef<number | null>(null);

  useEffect(() => {
    document.body.classList.add('zero-one-island-ready');

    const coarse = window.matchMedia('(hover: none), (pointer: coarse)');
    const update = () => setTouchDevice(coarse.matches);
    update();
    coarse.addEventListener?.('change', update);

    const showTimer = window.setTimeout(() => {
      setMessage('ZERO ONE');
      setWelcome(true);
      messageTimer.current = window.setTimeout(() => setWelcome(false), 4200);
    }, 700);

    const onPricingFocus = (event: Event) => {
      const detail = (event as CustomEvent<{ name?: string; tone?: string }>).detail;
      if (!detail?.name) return;
      if (messageTimer.current) window.clearTimeout(messageTimer.current);
      setPackageUpdate(null);
      setMessage(`${detail.tone ? `${detail.tone} — ` : ''}${detail.name}`);
      setWelcome(true);
      messageTimer.current = window.setTimeout(() => setWelcome(false), 1800);
    };

    const onPackageUpdate = (event: Event) => {
      const detail = (event as CustomEvent<IslandMessage>).detail;
      if (!detail?.title) return;
      if (messageTimer.current) window.clearTimeout(messageTimer.current);
      setPackageUpdate(detail);
      setWelcome(true);
      messageTimer.current = window.setTimeout(() => {
        setWelcome(false);
        setPackageUpdate(null);
      }, 2400);
    };

    window.addEventListener('zero-one:pricing-focus', onPricingFocus);
    window.addEventListener('zero-one:package-update', onPackageUpdate);

    return () => {
      document.body.classList.remove('zero-one-island-ready');
      window.clearTimeout(showTimer);
      coarse.removeEventListener?.('change', update);
      window.removeEventListener('zero-one:pricing-focus', onPricingFocus);
      window.removeEventListener('zero-one:package-update', onPackageUpdate);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      if (messageTimer.current) window.clearTimeout(messageTimer.current);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpanded(false);
        setWelcome(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const expand = () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    setWelcome(false);
    setExpanded(true);
  };

  const collapse = () => {
    if (touchDevice) return;
    hideTimer.current = window.setTimeout(() => setExpanded(false), 180);
  };

  const handleNav = (href: string) => {
    setExpanded(false);
    navigate(href);
  };

  const handleHome = (event: MouseEvent<HTMLSpanElement>) => {
    event.stopPropagation();
    setExpanded(false);
    setWelcome(false);
    navigate('/');
  };

  return (
    <div className="zero-one-island-layer">
      <div
        className={`zero-one-island ${expanded ? 'is-expanded' : ''} ${welcome ? 'is-welcome' : ''} ${packageUpdate ? 'is-package-update' : ''}`}
        onMouseEnter={!touchDevice ? expand : undefined}
        onMouseLeave={!touchDevice ? collapse : undefined}
      >
        <div className="zero-one-island__shine" aria-hidden="true" />
        <button
          type="button"
          className="zero-one-island__core"
          aria-label={expanded ? 'Collapse navigation' : 'Go to ZERO ONE home'}
          onClick={() => {
            setExpanded((value) => !value);
            setWelcome(false);
          }}
        >
          <span className="zero-one-island__mark" onClick={handleHome}>ZERO ONE</span>
          <span className="zero-one-island__status" aria-hidden="true" />
          <span className="zero-one-island__welcome" aria-live="polite">
            {packageUpdate ? (
              <span className="zero-one-island__package-message">
                <span className="zero-one-island__package-change">
                  {packageUpdate.tone} · {packageUpdate.title}
                </span>
                <span className="zero-one-island__package-total">
                  {packageUpdate.delta !== undefined ? `${packageUpdate.delta >= 0 ? '+' : '−'}${Math.abs(packageUpdate.delta).toLocaleString()} KWD` : ''}
                  {packageUpdate.total !== undefined ? `  ·  TOTAL ${packageUpdate.total.toLocaleString()} KWD` : ''}
                </span>
              </span>
            ) : message}
          </span>
          <span className="zero-one-island__menu-icon">{expanded ? <X size={14} /> : <Menu size={14} />}</span>
        </button>

        <div className="zero-one-island__nav" aria-label="Primary navigation">
          {NAV_ITEMS.map((item, index) => (
            <button
              key={item.href}
              type="button"
              className="zero-one-island__nav-item"
              style={{ transitionDelay: expanded ? `${40 + index * 25}ms` : '0ms' }}
              onClick={() => handleNav(item.href)}
            >
              <span>{item.label}</span>
              {item.label === 'Contact' || item.label === 'Pricing' ? <ArrowUpRight size={12} /> : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
