import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

const localLogoModules = import.meta.glob('../assets/clients/*.{png,jpg,jpeg,webp,svg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

function resolveImage(src: string) {
  if (!src.startsWith('/src/assets/clients/')) return src;
  const key = `../assets/clients/${src.split('/').pop()}`;
  return localLogoModules[key] || src;
}

export default function ClientLogosSync() {
  useEffect(() => {
    let mounted = true;
    const render = async () => {
      const section = document.querySelector<HTMLElement>('.client-marquee-section');
      if (!section) return;
      const { data } = await supabase.from('client_logos').select('id,name,image_url,website_url,active,sort_order').eq('active', true).order('sort_order', { ascending: true });
      if (!mounted || !data?.length) return;
      const groups = section.querySelectorAll<HTMLElement>('.client-marquee__group');
      if (!groups.length) return;
      const buildGroup = () => {
        const group = document.createDocumentFragment();
        data.forEach((logo) => {
          const item = document.createElement('div');
          item.className = 'client-marquee__item';
          const content = document.createElement(logo.website_url ? 'a' : 'div');
          if (logo.website_url) { content.setAttribute('href', logo.website_url); content.setAttribute('target', '_blank'); content.setAttribute('rel', 'noreferrer'); }
          const img = document.createElement('img');
          img.src = resolveImage(logo.image_url);
          img.alt = logo.name || 'Client logo';
          img.loading = 'lazy';
          content.appendChild(img);
          item.appendChild(content);
          group.appendChild(item);
        });
        return group;
      };
      groups.forEach(group => { group.replaceChildren(buildGroup()); });
      section.style.display = '';
    };
    const handleUpdate = () => { void render(); };
    void render();
    window.addEventListener('zero-one:client-logos-updated', handleUpdate);
    return () => { mounted = false; window.removeEventListener('zero-one:client-logos-updated', handleUpdate); };
  }, []);
  return null;
}
