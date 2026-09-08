import './marketPricing.css';

export type MarketCode = 'KW' | 'SA' | 'AE' | 'EG';

export type Market = {
  code: MarketCode;
  country: string;
  flag: string;
  currency: string;
  locale: string;
  min: number;
  max: number;
};

export const MARKETS: Market[] = [
  { code: 'KW', country: 'Kuwait', flag: '🇰🇼', currency: 'KWD', locale: 'en-KW', min: 250, max: 2000 },
  { code: 'SA', country: 'Saudi Arabia', flag: '🇸🇦', currency: 'SAR', locale: 'en-SA', min: 1250, max: 10000 },
  { code: 'AE', country: 'UAE', flag: '🇦🇪', currency: 'AED', locale: 'en-AE', min: 1250, max: 10000 },
  { code: 'EG', country: 'Egypt', flag: '🇪🇬', currency: 'EGP', locale: 'en-EG', min: 25000, max: 200000 },
];

export const PACKAGE_PRICES: Record<string, Record<MarketCode, number>> = {
  Starter: { KW: 245, SA: 1250, AE: 1250, EG: 25000 },
  Growth: { KW: 425, SA: 2250, AE: 2250, EG: 45000 },
  Premium: { KW: 700, SA: 3750, AE: 3750, EG: 75000 },
};

export const SERVICE_PRICES: Record<string, Record<MarketCode, number>> = {
  posts: { KW: 8, SA: 40, AE: 40, EG: 800 },
  stories: { KW: 5, SA: 25, AE: 25, EG: 500 },
  reels: { KW: 28, SA: 140, AE: 140, EG: 2800 },
  videos: { KW: 85, SA: 425, AE: 425, EG: 8500 },
  motion: { KW: 70, SA: 350, AE: 350, EG: 7000 },
  strategy: { KW: 95, SA: 475, AE: 475, EG: 9500 },
  community: { KW: 110, SA: 550, AE: 550, EG: 11000 },
  reporting: { KW: 65, SA: 325, AE: 325, EG: 6500 },
  accountManager: { KW: 140, SA: 700, AE: 700, EG: 14000 },
  campaign: { KW: 180, SA: 900, AE: 900, EG: 18000 },
  ads: { KW: 220, SA: 1100, AE: 1100, EG: 22000 },
  brand: { KW: 420, SA: 2100, AE: 2100, EG: 42000 },
  landing: { KW: 300, SA: 1500, AE: 1500, EG: 30000 },
  website: { KW: 650, SA: 3250, AE: 3250, EG: 65000 },
  seo: { KW: 180, SA: 900, AE: 900, EG: 18000 },
};

const STORAGE_KEY = 'zero-one-market';

export function getStoredMarket(): MarketCode {
  if (typeof window === 'undefined') return 'KW';
  const value = window.localStorage.getItem(STORAGE_KEY) as MarketCode | null;
  return value && MARKETS.some((market) => market.code === value) ? value : 'KW';
}

export function setStoredMarket(code: MarketCode) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, code);
  window.dispatchEvent(new CustomEvent('zero-one:market-change', { detail: { code } }));
}

export function getMarket(code: MarketCode) {
  return MARKETS.find((market) => market.code === code) ?? MARKETS[0];
}

export function formatMarketPrice(value: number, market: MarketCode) {
  const config = getMarket(market);
  return value.toLocaleString(config.locale, { maximumFractionDigits: 0 });
}
