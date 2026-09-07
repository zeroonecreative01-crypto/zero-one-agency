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

The repository includes a Vercel configuration with:

- Vite framework detection
- `npm run build` build command
- `dist` output directory
- SPA fallback for direct visits to `/work`, `/services`, `/about`, `/contact`, and `/admin`
- Basic production security headers

Add the two Supabase `VITE_` variables to Vercel for Production (and Preview if you want authentication in preview deployments), then redeploy.

### Netlify

`netlify.toml` contains the SPA fallback and security headers.

## Site behavior

- Client-side navigation uses `pushState` / `popstate`.
- Contact inquiries are prepared in WhatsApp rather than stored in a database.
- The floating admin button opens `/admin`.
- The public site remains usable if Supabase environment variables are not configured; only the admin route reports that authentication setup is required.
- Reduced-motion preferences are respected.
- Client logos are loaded automatically from `src/assets/clients/`.

## Launch checklist

- [ ] Add Supabase environment variables to the deployment.
- [ ] Confirm the admin account has `app_metadata.role = "admin"`.
- [ ] Set Supabase URL Configuration / Site URL to the production domain.
- [ ] Redeploy after environment changes.
- [ ] Test `/`, `/work`, `/services`, `/about`, `/contact`, and `/admin` directly in a fresh browser tab.
- [ ] Test the contact form and confirm WhatsApp opens with the inquiry text.
- [ ] Replace demo portfolio entries / external Unsplash images with final approved case-study assets before launch.
- [ ] Add final Privacy Policy and Terms pages/copy before public launch.

## CI

GitHub Actions runs `npm run typecheck` and `npm run build` on pushes to `main` and pull requests targeting `main`.
