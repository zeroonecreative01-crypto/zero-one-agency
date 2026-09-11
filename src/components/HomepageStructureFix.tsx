import { useEffect } from 'react';

/**
 * Forces the final homepage information architecture after all legacy/enhancement
 * components mount: enhancement sections first, About second-to-last, footer last.
 */
export default function HomepageStructureFix() {
  useEffect(() => {
    if (window.location.pathname.replace(/\/+$/, '') !== '') return;

    const moveHomepageFooterAndAbout = () => {
      const root = document.getElementById('root');
      const footer = document.querySelector<HTMLElement>('footer');
      const aboutHeading = Array.from(document.querySelectorAll('h1')).find(
        (heading) => heading.textContent?.trim() === 'About Us.'
      );
      const about = aboutHeading?.closest<HTMLElement>('.w-full');

      if (!root || !footer || !about) return;

      // The footer originally lives inside SiteApp, while enhancement sections
      // are mounted as siblings. Move the footer to the root so it can truly be
      // the final element after every homepage section.
      if (footer.parentElement !== root) root.appendChild(footer);

      // Move About after all enhancement sections and immediately before footer.
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
