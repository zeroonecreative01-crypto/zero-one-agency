# Authentication

The public website remains unauthenticated. The `/admin` route is protected by Supabase Auth.

## Flow

1. The browser loads `src/main.tsx`.
2. `AuthProvider` calls `supabase.auth.getSession()` to restore an existing session.
3. Supabase's `onAuthStateChange` listener keeps React state synchronized with sign-in, refresh, and sign-out events.
4. Visiting `/admin` renders `AdminRoute`.
5. If there is no session, the user sees the email/password sign-in form.
6. `signInWithPassword()` sends credentials directly to Supabase over HTTPS. The application does not receive or store the user's password.
7. Supabase returns a session containing the authenticated user and tokens; the Supabase client persists and refreshes the session automatically.
8. `/admin` requires `user.app_metadata.role === 'admin'`. A normal authenticated account receives a 403 screen.
9. Sign-out calls `supabase.auth.signOut()` and clears the client session.

## Required environment variables

Set these in the local `.env` file and in the hosting provider's environment settings:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Never put a Supabase service-role key in Vite environment variables or browser code.

## Admin role

Create the admin user in Supabase Auth, then set the user's **app_metadata** role to `admin` using a trusted server-side/admin mechanism or the Supabase dashboard tooling. Do not use `user_metadata` for authorization because it can be changed by the user.

## Important security boundary

The React route is a UX/authorization layer for the admin UI. Any future private data or write operation must also be protected server-side with Supabase Row Level Security (RLS) or a server-side API. Never rely on hiding `/admin` as the only security control.
