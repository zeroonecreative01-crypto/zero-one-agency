import React, { useEffect, useState } from 'react';
import { AdminRoute, AuthProvider, useAuth } from './auth/AuthProvider';
import SiteApp from './App';
import AdminContentRoute from './admin/AdminContentRoute';
import AdminDashboard from './admin/AdminDashboard';
import { PrivacyPolicy, TermsOfService } from './LegalPages';
import PricingPage from './components/PricingPage';
import FloatingIsland from './components/FloatingIsland';
import { SupportCenter } from './components/SupportCenter';
import SiteContentSync from './components/SiteContentSync';
import LegalFooterLinks from './components/LegalFooterLinks';
import EmployeeTaskBoard from './admin/EmployeeTaskBoard';
import CaseStudyPage from './components/CaseStudyPage';
import PortfolioPage from './components/PortfolioPage';
import HomeRefresh from './components/HomeRefresh';
import './lib/leadsCapture';
import './styles.css';
import './site-polish.css';
import './statement-white.css';
import './client-logo-fix.css';
import './components/FloatingIsland.css';
import './components/FloatingIslandFix.css';
import './components/SupportFloatingFix.css';
import './home-refresh.css';
import './pricing-page-reference.css';

const normalizePath = (value: string) => value.replace(/\/+$/, '') || '/';

function Root() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));
  useEffect(() => {
    const handleNavigation = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, []);

  const navigate = (next: string) => {
    const normalized = normalizePath(next);
    if (normalized !== window.location.pathname) window.history.pushState({}, '', normalized);
    setPath(normalized);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (path === '/admin') return <AdminRoute />;
  if (path === '/admin/dashboard') return <AdminDashboardRoute />;
  if (path === '/admin/content') return <AdminContentRoute />;
  if (path === '/team' || path === '/team/tasks') return <EmployeeTaskBoard />;
  if (path === '/privacy-policy') return <PrivacyPolicy navigate={navigate} />;
  if (path === '/terms-of-service') return <TermsOfService navigate={navigate} />;
  if (path === '/pricing') return <><PricingPage /><FloatingIsland /><SupportCenter /></>;
  if (path === '/work') return <><PortfolioPage navigate={navigate} /><SupportCenter /><LegalFooterLinks /></>;
  if (path.startsWith('/work/')) return <><CaseStudyPage slug={path.slice('/work/'.length)} navigate={navigate} /><SupportCenter /><LegalFooterLinks /></>;

  if (path === '/') return <><HomeRefresh /><FloatingIsland /><SupportCenter /><SiteContentSync /><LegalFooterLinks /></>;

  return <><SiteApp /><FloatingIsland /><SupportCenter /><SiteContentSync /><LegalFooterLinks /></>;
}

function AdminDashboardRoute() {
  const { user, loading, configured, signOut } = useAuth();
  if (loading) return <AdminDashboardShell>Checking session...</AdminDashboardShell>;
  if (!configured || !user || user.app_metadata?.role !== 'admin') return <AdminDashboardShell><div className="max-w-lg border border-[#F7F5F0]/10 p-8"><h1 className="text-3xl font-bold">Admin access required.</h1><p className="mt-3 text-sm text-[#F7F5F0]/50">Sign in through the main admin area first.</p><div className="mt-6 flex flex-wrap gap-3"><a href="/admin" className="rounded-full bg-[#F14A0B] px-5 py-3 font-semibold text-[#111111]">Open Admin</a>{user && <button onClick={() => void signOut()} className="rounded-full border border-[#F7F5F0]/15 px-5 py-3 font-semibold">Sign out</button>}</div></div></AdminDashboardShell>;
  return <AdminDashboardShell><header className="border-b border-[#F7F5F0]/10 pb-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[#F14A0B] text-xs font-bold uppercase tracking-[0.2em]">ZERO ONE / Admin</p><h1 className="mt-2 text-5xl md:text-7xl font-bold tracking-tighter">Dashboard.</h1><p className="mt-3 text-sm text-[#F7F5F0]/40">Signed in as {user.email}</p></div><div className="flex flex-wrap gap-2"><a href="/admin" className="rounded-full border border-[#F7F5F0]/15 px-4 py-2.5 text-sm font-semibold">Admin</a><a href="/admin/content" className="rounded-full border border-[#F7F5F0]/15 px-4 py-2.5 font-semibold">Site Content</a><button onClick={() => void signOut()} className="rounded-full border border-[#F7F5F0]/15 px-4 py-2.5 font-semibold">Sign out</button></div></div></header><AdminDashboard onNavigate={(section) => { window.location.assign('/admin?section=' + section); }} /></AdminDashboardShell>;
}

function AdminDashboardShell({ children }: { children: React.ReactNode }) { return <div className="min-h-screen bg-[#111111] text-[#F7F5F0] px-6 py-8 md:px-12 lg:px-16"><div className="mx-auto max-w-7xl">{children}</div></div>; }

import { createRoot } from 'react-dom/client';
createRoot(document.getElementById('root')!).render(<React.StrictMode><AuthProvider><Root /></AuthProvider></React.StrictMode>);