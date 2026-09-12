# ZERO ONE — Production Website

React + TypeScript + Vite + Tailwind CSS website for ZERO ONE.

## Local development

```bash
npm install
npm run dev
```

## Production verification

```bash
npm run typecheck
npm run build
npm run preview
```

## Production setup

### Supabase authentication

The `/admin` route uses Supabase email/password authentication and checks `app_metadata.role === "admin"` before showing the dashboard.

Set these variables in the deployment environment:

```text
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Do not commit `.env.local` or Supabase secret/service-role keys. The repository only contains `.env.example` with placeholders.

### Vercel

The repository uses `vercel.json` for Vite build configuration, SPA fallback, and baseline security headers.

Add the two Supabase `VITE_` variables to Vercel for Production (and Preview if you want authentication in preview deployments), then redeploy.

## Site behavior

- Client-side navigation uses `pushState` / `popstate`.
- Contact inquiries are prepared in WhatsApp rather than stored in a database.
- The floating admin button opens `/admin`.
- The public site remains usable if Supabase environment variables are not configured; only the admin route reports that authentication setup is required.
- Reduced-motion preferences are respected.
- Client logos are rendered from the site's client-logo data/assets.

## Launch checklist

- [ ] Add Supabase environment variables to the deployment.
- [ ] Confirm the admin account has `app_metadata.role = "admin"`.
- [ ] Set Supabase URL Configuration / Site URL to the production domain.
- [ ] Redeploy after environment changes.
- [ ] Test `/`, `/work`, `/work/<case-study>`, `/pricing`, `/services`, `/about`, `/contact`, and `/admin` directly in a fresh browser tab.
- [ ] Test the contact form and confirm WhatsApp opens with the inquiry text.
- [ ] Replace any remaining demo portfolio entries / external image assets with final approved case-study assets before launch.
- [ ] Add final Privacy Policy and Terms pages/copy before public launch.

## CI

GitHub Actions runs `npm run typecheck` and `npm run build` on pushes to `main` and pull requests targeting `main`.
