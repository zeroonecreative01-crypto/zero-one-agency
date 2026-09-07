import { useEffect, useRef, useState } from 'react';
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
      setMessage(WELCOME_MESSAGES[0]);
      setWelcome(true);
      messageTimer.current = window.setTimeout(() => {
        setWelcome(false);
        setMessage('ZERO ONE');
      }, 4200);
    }, 700);

    const onPricingFocus = (event: Event) => {
      const detail = (event as CustomEvent<{ name?: string; tone?: string }>).detail;
      if (!detail?.name) return;
      if (messageTimer.current) window.clearTimeout(messageTimer.current);
      const tone = detail.tone ? `${detail.tone[0].toUpperCase()}${detail.tone.slice(1)}` : 'Package';
      setMessage(`${tone} — ${detail.name}`);
      setWelcome(true);
      messageTimer.current = window.setTimeout(() => {
        setWelcome(false);
        setMessage('ZERO ONE');
      }, 1800);
    };

    window.addEventListener('zero-one:pricing-focus', onPricingFocus);

    return () => {
      document.body.classList.remove('zero-one-island-ready');
      window.clearTimeout(showTimer);
      coarse.removeEventListener?.('change', update);
      window.removeEventListener('zero-one:pricing-focus', onPricingFocus);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      if (messageTimer.current) window.clearTimeout(messageTimer.current);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpanded(false);
        setWelcome(false);
        setMessage('ZERO ONE');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const expand = () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    setWelcome(false);
    setMessage('ZERO ONE');
    setExpanded(true);
  };

  const collapse = () => {
    if (touchDevice) return;
    hideTimer.current = window.setTimeout(() => setExpanded(false), 180);
  };

  const handleNav = (href: string) => {
    setExpanded(false);
    setMessage('ZERO ONE');
    navigate(href);
  };

  return (
    <div className="zero-one-island-layer">
      <div
        className={`zero-one-island ${expanded ? 'is-expanded' : ''} ${welcome ? 'is-welcome' : ''}`}
        onMouseEnter={!touchDevice ? expand : undefined}
        onMouseLeave={!touchDevice ? collapse : undefined}
      >
        <div className="zero-one-island__shine" aria-hidden="true" />
        <button
          type="button"
          className="zero-one-island__core"
          aria-label={expanded ? 'Collapse navigation' : 'Expand navigation'}
          onClick={() => {
            setExpanded((value) => !value);
            setWelcome(false);
            if (expanded) setMessage('ZERO ONE');
          }}
        >
          <span className="zero-one-island__mark">{welcome ? '' : 'ZERO ONE'}</span>
          <span className="zero-one-island__status" aria-hidden="true" />
          <span className="zero-one-island__welcome" aria-live="polite">{message}</span>
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
