import { useEffect } from 'react';

const EMAIL = 'zeroone.creative.01@gmail.com';

export default function SiteContactPatch() {
  useEffect(() => {
    const patch = () => {
      document.querySelectorAll('footer span').forEach((node) => {
        if (node.textContent?.trim().startsWith('Snapchat:')) node.remove();
      });

      const contactHeading = Array.from(document.querySelectorAll('footer h4')).find((node) => node.textContent?.trim() === 'Contact');
      const contactColumn = contactHeading?.parentElement;
      if (contactColumn && !contactColumn.querySelector('[data-zero-one-email]')) {
        const email = document.createElement('a');
        email.dataset.zeroOneEmail = 'true';
        email.href = `mailto:${EMAIL}`;
        email.textContent = EMAIL;
        email.className = 'text-[#F7F5F0]/70 hover:text-[#F7F5F0] transition-colors text-sm font-medium break-all';
        contactColumn.appendChild(email);
      }
    };

    patch();
    const observer = new MutationObserver(patch);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
