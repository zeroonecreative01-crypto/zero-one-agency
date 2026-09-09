import { useEffect } from 'react';

const SELECTORS = [
  'main > div > section',
  'main > div > div > section',
  '.zero-one-package',
  '.zo-case-mini',
  '.zo-case',
  '.zo-proof__stat',
  '.zo-industries span',
  'footer',
].join(',');

function prepareMotion() {
  document.body.classList.add('zo-motion-ready');

  const elements = Array.from(document.querySelectorAll<HTMLElement>(SELECTORS));
  elements.forEach((element, index) => {
    if (element.dataset.zoMotionPrepared === 'true') return;
    element.dataset.zoMotionPrepared = 'true';
    element.classList.add('zo-reveal');

    const parent = element.parentElement;
    if (parent?.classList.contains('zo-case-grid') || parent?.classList.contains('zo-proof__inner')) {
      element.style.setProperty('--zo-reveal-delay', `${Math.min(index % 6, 5) * 70}ms`);
    }
  });

  const headings = Array.from(document.querySelectorAll<HTMLElement>('main h1, main h2, main h3'));
  headings.forEach((heading) => {
    if (heading.dataset.zoMotionPrepared === 'true') return;
    heading.dataset.zoMotionPrepared = 'true';
    heading.classList.add('zo-text-reveal');
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        (entry.target as HTMLElement).classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
  );

  document.querySelectorAll<HTMLElement>('.zo-reveal, .zo-text-reveal').forEach((element) => {
    if (!element.classList.contains('is-visible')) observer.observe(element);
  });

  return observer;
}

export default function MotionSystem() {
  useEffect(() => {
    const observer = prepareMotion();
    const mutationObserver = new MutationObserver(() => {
      const nextObserver = prepareMotion();
      nextObserver.disconnect();
    });

    mutationObserver.observe(document.getElementById('root')!, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      document.body.classList.remove('zo-motion-ready');
    };
  }, []);

  return null;
}
