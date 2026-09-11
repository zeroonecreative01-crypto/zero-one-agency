import { useEffect } from 'react';

/**
 * Final homepage information architecture:
 * all homepage enhancement sections render first, then About, then the footer.
 * This DOM-level ordering keeps legacy/injected homepage sections from appearing
 * after About or after the footer.
 */
export default function HomepageStructureFix() {
  useEffect(() => {
    if (window.location.pathname.replace(/\/+$/, '') !== '') return;

    const moveHomepageFooterAndAbout = () => {
      const root = document.getElementById('root');
      const about = document.querySelector<HTMLElement>('#homepage-about');
      const footer = document.querySelector<HTMLElement>('footer');
      if (!root || !about || !footer) return;

      // Put the footer after every homepage enhancement component.
      if (footer.parentElement !== root) root.appendChild(footer);

      // About is the final content section immediately before the footer.
      if (about.parentElement !== root || about.nextElementSibling !== footer) {
        root.insertBefore(about, footer);
      }
    };

    moveHomepageFooterAndAbout();
    const observer = new MutationObserver(moveHomepageFooterAndAbout);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
