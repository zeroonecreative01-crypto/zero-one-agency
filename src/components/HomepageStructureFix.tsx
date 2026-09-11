import { useEffect } from 'react';

/**
 * Keeps the homepage information architecture stable after legacy/enhancement
 * components mount: enhancement sections first, About second-to-last, footer last.
 * The route guard is checked on every mutation so this never moves homepage
 * content onto internal pages after client-side navigation.
 */
export default function HomepageStructureFix() {
  useEffect(() => {
    const moveHomepageFooterAndAbout = () => {
      if (window.location.pathname.replace(/\/+$/, '') !== '') return;

      const root = document.getElementById('root');
      const footer = document.querySelector<HTMLElement>('footer');
      const aboutHeading = Array.from(document.querySelectorAll('h1')).find(
        (heading) => heading.textContent?.trim() === 'About Us.'
      );
      const about = aboutHeading?.closest<HTMLElement>('.w-full');

      if (!root || !footer || !about) return;

      if (footer.parentElement !== root) root.appendChild(footer);

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
