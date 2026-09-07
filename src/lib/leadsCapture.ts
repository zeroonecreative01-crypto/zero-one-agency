import { createLead } from './leads';

const WHATSAPP_HOST = 'wa.me';
const WHATSAPP_PATH = '/201556764804';

const getField = (text: string, label: string) => {
  const line = text.split('\n').find((value) => value.startsWith(`${label}:`));
  return line ? line.slice(label.length + 1).trim() : '';
};

const captureLeadFromWhatsAppUrl = (rawUrl: string) => {
  let url: URL;

  try {
    url = new URL(rawUrl, window.location.origin);
  } catch {
    return;
  }

  if (url.hostname !== WHATSAPP_HOST || url.pathname !== WHATSAPP_PATH) return;

  const text = url.searchParams.get('text') || '';
  if (!text.startsWith('ZERO ONE Project Inquiry')) return;

  const name = getField(text, 'Name');
  const email = getField(text, 'Email');
  const company = getField(text, 'Company');
  const service = getField(text, 'Project Type');
  const message = getField(text, 'Message');

  if (!name || !email || !message) return;

  void createLead({
    name,
    email,
    company: company && company !== 'Not provided' ? company : undefined,
    service: service && service !== 'Not provided' ? service : undefined,
    message,
  }).catch((error) => {
    console.error('ZERO ONE: failed to persist contact inquiry', error);
  });
};

const originalOpen = window.open.bind(window);

window.open = ((url?: string | URL, target?: string, features?: string) => {
  if (typeof url === 'string') {
    captureLeadFromWhatsAppUrl(url);
  } else if (url instanceof URL) {
    captureLeadFromWhatsAppUrl(url.toString());
  }

  return originalOpen(url, target, features);
}) as typeof window.open;
