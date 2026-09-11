import { useEffect } from 'react';

/**
 * Keeps the homepage information architecture intentional without changing
 * the existing visual components: About belongs late in the page, just before
 * the footer, while the old phone showcase is removed via final-polish.css.
 */
export default function HomepageStructureFix() {
  useEffect(() => {
    if (window.location.pathname.replace(/\/+$/, '') !== '') return;

    const moveAboutToBottom = () => {
      const about = document.querySelector<HTMLElement>('#about');
      const footer = document.querySelector('footer');
      if (!about || !footer || about.parentElement === footer.parentElement) return;
      footer.parentElement?.insertBefore(about, footer);
    };

    moveAboutToBottom();
    const observer = new MutationObserver(moveAboutToBottom);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
