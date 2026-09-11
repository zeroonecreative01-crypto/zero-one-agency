import { useEffect } from 'react';

const LegalFooterLinks = () => {
  useEffect(() => {
    const wire = () => {
      const footer = document.querySelector('footer');
      if (!footer) return;

      footer.querySelectorAll<HTMLElement>('span').forEach((span) => {
        const label = span.textContent?.trim();
        if (label !== 'Privacy Policy' && label !== 'Terms of Service') return;
        if (span.dataset.legalLinkWired === 'true') return;

        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.className = span.className;
        button.dataset.legalLinkWired = 'true';
        button.addEventListener('click', () => {
          const path = label === 'Privacy Policy' ? '/privacy-policy' : '/terms-of-service';
          window.history.pushState({}, '', path);
          window.dispatchEvent(new PopStateEvent('popstate'));
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        span.replaceWith(button);
      });
    };

    wire();
    const observer = new MutationObserver(wire);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
};

export default LegalFooterLinks;
