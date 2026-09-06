# ZERO ONE — Production Website

React + TypeScript + Vite + Tailwind CSS website for ZERO ONE.

## Run locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Included fixes

- Real browser URL routing with `pushState` / `popstate` for `/`, `/work`, `/services`, `/about`, and `/contact`.
- ZERO ONE social links wired to the supplied accounts.
- WhatsApp Business wired to `+20 155 676 4804`.
- Contact form opens a pre-filled WhatsApp inquiry instead of simulating a fake API success.
- Removed placeholder email, phone, office, and `#` social links.
- Fixed the About-page SEO prop issue.
- Added Vercel and Netlify SPA fallback configuration.
- Added Open Graph metadata and theme metadata.
- Included the supplied `ONE.png` logo.
- Preserved reduced-motion handling and responsive layout.

## Deployment

### Vercel
Import the project and deploy. `vercel.json` handles direct visits to nested routes.

### Netlify
Import the project and deploy. `netlify.toml` handles direct visits to nested routes.

## Before launch

Replace demo portfolio entries and Unsplash images with ZERO ONE's real case studies/assets. Replace placeholder statistics in `STATS` with verified numbers or remove the section. Add final legal/privacy copy when available.


### Client Logos
Client logos live in `public/clients/` and are rendered by the infinite RTL marquee on the Home page.
