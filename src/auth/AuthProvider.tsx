import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { BriefcaseBusiness, LayoutDashboard, LogOut, Users } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import LeadsPanel from '../admin/LeadsPanel';
import PortfolioPanel from '../admin/PortfolioPanel';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AdminSection = 'overview' | 'leads' | 'portfolio';

type AdminNavItem = { id: AdminSection; label: string; icon: React.ComponentType<{ size?: number }> };

const ADMIN_NAV: AdminNavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'portfolio', label: 'Portfolio', icon: BriefcaseBusiness },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    loading,
    configured: isSupabaseConfigured,
    signIn: async (email, password) => {
      if (!supabase) return { error: new Error('Authentication is not configured.') };
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error ? new Error(error.message) : null };
    },
    signOut: async () => {
      if (!supabase) return { error: new Error('Authentication is not configured.') };
      const { error } = await supabase.auth.signOut();
      return { error: error ? new Error(error.message) : null };
    },
  }), [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#111111] text-[#F7F5F0]">{children}</div>;
}

function AdminOverview({ user, onNavigate }: { user: User; onNavigate: (section: AdminSection) => void }) {
  const cards = [
    { id: 'leads' as const, label: 'Leads', title: 'Manage inquiries.', copy: 'Review, qualify, and update incoming project opportunities.', icon: Users },
    { id: 'portfolio' as const, label: 'Portfolio', title: 'Manage work.', copy: 'Add, edit, feature, and reorder projects shown on the public site.', icon: BriefcaseBusiness },
  ];

  return (
    <section className="mt-10">
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map(({ id, label, title, copy, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className="group border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02] p-6 text-left transition-all hover:-translate-y-1 hover:border-[#F14A0B]/40 hover:bg-[#F7F5F0]/[0.04] md:p-8"
          >
            <div className="mb-8 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F14A0B]">{label}</span>
              <Icon size={22} className="text-[#F7F5F0]/35 transition-colors group-hover:text-[#F14A0B]" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-[#F7F5F0]/50">{copy}</p>
            <span className="mt-8 inline-flex rounded-full border border-[#F7F5F0]/15 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#F7F5F0]/70 transition-colors group-hover:border-[#F14A0B]/50 group-hover:text-[#F14A0B]">Open {label}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02] p-6 md:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F14A0B]">System</p>
            <p className="mt-2 font-semibold">Production admin session is active.</p>
          </div>
          <p className="text-sm text-[#F7F5F0]/45">Signed in as {user.email}</p>
        </div>
      </div>
    </section>
  );
}

export function AdminRoute() {
  const { user, loading, configured, signIn, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [section, setSection] = useState<AdminSection>('overview');

  if (loading) return <AuthShell><div className="min-h-screen flex items-center justify-center text-sm uppercase tracking-[0.2em] text-[#F7F5F0]/50">Checking session...</div></AuthShell>;

  if (!configured) return <AuthShell><div className="min-h-screen flex items-center justify-center px-6"><div className="w-full max-w-lg border border-[#F7F5F0]/10 p-8 md:p-12"><p className="text-[#F14A0B] text-xs font-bold uppercase tracking-[0.2em] mb-4">Authentication Setup Required</p><h1 className="text-3xl font-bold tracking-tight mb-4">Supabase is not configured.</h1><p className="text-[#F7F5F0]/60 leading-relaxed">Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the deployment environment, then redeploy.</p></div></div></AuthShell>;

  if (!user) {
    const handleSubmit = async (event: React.FormEvent) => {
      event.preventDefault();
      setError('');
      setSubmitting(true);
      const result = await signIn(email.trim(), password);
      setSubmitting(false);
      if (result.error) setError(result.error.message);
    };
    return <AuthShell><div className="min-h-screen flex items-center justify-center px-6 py-24"><form onSubmit={handleSubmit} className="w-full max-w-md border border-[#F7F5F0]/10 p-8 md:p-12"><p className="text-[#F14A0B] text-xs font-bold uppercase tracking-[0.2em] mb-4">ZERO ONE / Admin</p><h1 className="text-4xl font-bold tracking-tighter mb-10">Sign in.</h1>{error && <div role="alert" className="mb-6 border border-red-400/30 bg-red-400/5 p-4 text-sm text-red-200">{error}</div>}<div className="space-y-6"><label className="block"><span className="block text-xs uppercase tracking-widest text-[#F7F5F0]/50 mb-2">Email</span><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full bg-transparent border-b border-[#F7F5F0]/20 py-3 outline-none focus:border-[#F14A0B]" /></label><label className="block"><span className="block text-xs uppercase tracking-widest text-[#F7F5F0]/50 mb-2">Password</span><input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full bg-transparent border-b border-[#F7F5F0]/20 py-3 outline-none focus:border-[#F14A0B]" /></label><button disabled={submitting} className="w-full rounded-full bg-[#F14A0B] px-6 py-4 font-semibold text-[#111111] disabled:opacity-50">{submitting ? 'Signing in...' : 'Sign in'}</button></div></form></div></AuthShell>;
  }

  const isAdmin = user.app_metadata?.role === 'admin';
  if (!isAdmin) return <AuthShell><div className="min-h-screen flex items-center justify-center px-6"><div className="w-full max-w-lg text-center border border-[#F7F5F0]/10 p-8 md:p-12"><p className="text-[#F14A0B] text-xs font-bold uppercase tracking-[0.2em] mb-4">403 / Forbidden</p><h1 className="text-3xl font-bold mb-4">Admin access required.</h1><p className="text-[#F7F5F0]/60 mb-8">Your account is authenticated, but it does not have the admin role.</p><button onClick={() => signOut()} className="rounded-full border border-[#F7F5F0]/20 px-6 py-3 text-sm font-semibold hover:bg-[#F7F5F0] hover:text-[#111111] transition-colors">Sign out</button></div></div></AuthShell>;

  return (
    <AuthShell>
      <div className="min-h-screen px-6 py-8 md:px-12 lg:px-16 md:py-10">
        <div className="mx-auto max-w-7xl">
          <header className="border-b border-[#F7F5F0]/10 pb-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[#F14A0B] text-xs font-bold uppercase tracking-[0.2em] mb-3">ZERO ONE / Admin</p>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter">{section === 'overview' ? 'Dashboard.' : section === 'leads' ? 'Leads.' : 'Portfolio.'}</h1>
              </div>
              <button onClick={() => signOut()} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#F7F5F0]/20 px-5 py-3 text-sm font-semibold hover:bg-[#F7F5F0] hover:text-[#111111] transition-colors"><LogOut size={15} /> Sign out</button>
            </div>

            <nav aria-label="Admin sections" className="mt-8 flex flex-wrap gap-2 overflow-x-auto">
              {ADMIN_NAV.map(({ id, label, icon: Icon }) => {
                const active = section === id;
                return (
                  <button
                    key={id}
                    onClick={() => setSection(id)}
                    aria-current={active ? 'page' : undefined}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors ${active ? 'border-[#F14A0B] bg-[#F14A0B] text-[#111111]' : 'border-[#F7F5F0]/15 text-[#F7F5F0]/65 hover:border-[#F14A0B]/50 hover:text-[#F7F5F0]'}`}
                  >
                    <Icon size={15} /> {label}
                  </button>
                );
              })}
            </nav>
          </header>

          {section === 'overview' && <AdminOverview user={user} onNavigate={setSection} />}
          {section === 'leads' && <LeadsPanel />}
          {section === 'portfolio' && <PortfolioPanel />}
        </div>
      </div>
    </AuthShell>
  );
}
