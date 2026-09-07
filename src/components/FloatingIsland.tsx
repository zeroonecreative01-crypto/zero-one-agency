import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Work', href: '/work' },
  { label: 'Services', href: '/services' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Pricing', href: '/#zero-one-pricing' },
];

const WELCOME_MESSAGES = ['Welcome to ZERO ONE.', 'Ideas into impact.', 'Creative, by design.'];

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
  const [welcome, setWelcome] = useState(false);
  const [welcomeIndex, setWelcomeIndex] = useState(0);
  const [touchDevice, setTouchDevice] = useState(false);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    document.body.classList.add('zero-one-island-ready');

    const coarse = window.matchMedia('(hover: none), (pointer: coarse)');
    const update = () => setTouchDevice(coarse.matches);
    update();
    coarse.addEventListener?.('change', update);

    const showTimer = window.setTimeout(() => {
      setWelcome(true);
      window.setTimeout(() => setWelcome(false), 3100);
    }, 650);

    return () => {
      document.body.classList.remove('zero-one-island-ready');
      window.clearTimeout(showTimer);
      coarse.removeEventListener?.('change', update);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
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
          }}
        >
          <span className="zero-one-island__mark">ONE</span>
          <span className="zero-one-island__status" aria-hidden="true" />
          <span className="zero-one-island__welcome" aria-live="polite">{WELCOME_MESSAGES[welcomeIndex]}</span>
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
