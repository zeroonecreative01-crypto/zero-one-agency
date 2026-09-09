import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

type Override = { id: string; type: 'text' | 'link' | 'image'; target: string; value: string };

function applyOverrides(items: Override[]) {
  if (!items.length) return;
  const textItems = items.filter((x) => x.type === 'text' && x.target);
  const linkItems = items.filter((x) => x.type === 'link' && x.target);
  const imageItems = items.filter((x) => x.type === 'image' && x.target);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = []; let node: Node | null;
  while ((node = walker.nextNode())) nodes.push(node as Text);
  nodes.forEach((text) => { let value = text.nodeValue ?? ''; textItems.forEach((item) => { if (value.includes(item.target)) value = value.split(item.target).join(item.value); }); if (value !== text.nodeValue) text.nodeValue = value; });
  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => { linkItems.forEach((item) => { if (anchor.href === item.target || anchor.getAttribute('href') === item.target) anchor.setAttribute('href', item.value); }); });
  document.querySelectorAll<HTMLImageElement>('img[src]').forEach((img) => { imageItems.forEach((item) => { if (img.src === item.target || img.getAttribute('src') === item.target) img.setAttribute('src', item.value); }); });
}

export default function SiteContentSync() {
  useEffect(() => {
    if (window.location.pathname === '/admin') return;
    let active = true; let applying = false; let timer = 0;
    const load = async () => {
      if (!supabase || applying) return;
      const { data } = await supabase.from('site_content').select('content').eq('id','default').single();
      if (!active) return;
      const overrides = ((data?.content as { overrides?: Override[] } | null)?.overrides ?? []).filter((x) => x?.target && x?.value);
      if (!overrides.length) return;
      applying = true; applyOverrides(overrides); window.setTimeout(() => { applying = false; }, 50);
    };
    void load();
    const observer = new MutationObserver(() => { if (!applying) { window.clearTimeout(timer); timer = window.setTimeout(() => void load(), 120); } });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { active = false; observer.disconnect(); window.clearTimeout(timer); };
  }, []);
  return null;
}
