import { useEffect } from 'react';

const SITE_NAME = 'ZERO ONE';
const DESCRIPTION = 'ZERO ONE is a creative marketing agency building brands, campaigns and digital experiences across the region and beyond.';

export default function PerformancePolish() {
  useEffect(() => {
    document.documentElement.lang = 'en';
    document.documentElement.style.setProperty('color-scheme', 'dark');

    let schema = document.getElementById('zero-one-schema') as HTMLScriptElement | null;
    if (!schema) {
      schema = document.createElement('script');
      schema.id = 'zero-one-schema';
      schema.type = 'application/ld+json';
      document.head.appendChild(schema);
    }
    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      description: DESCRIPTION,
      email: 'zeroone.creative.01@gmail.com',
      sameAs: ['https://www.instagram.com/zeroone.ai.creative/','https://www.linkedin.com/in/zeroonemarkating/','https://www.facebook.com/zeroone.ai.creative','https://www.tiktok.com/@zeroone.creative','https://x.com/zerooneaicrea'],
    });

    const markImages = () => {
      const images = Array.from(document.images);
      images.forEach((image, index) => {
        if (index > 1 && image.loading === 'eager') image.loading = 'lazy';
        if (!image.decoding) image.decoding = 'async';
        image.setAttribute('fetchpriority', index === 0 ? 'high' : 'auto');
      });
    };
    markImages();

    let timer = 0;
    const observer = new MutationObserver((mutations) => {
      if (!mutations.some((mutation) => Array.from(mutation.addedNodes).some((node) => node.nodeType === Node.ELEMENT_NODE))) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(markImages, 120);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { observer.disconnect(); window.clearTimeout(timer); };
  }, []);
  return null;
}
