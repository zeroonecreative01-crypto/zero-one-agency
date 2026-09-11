import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AdminRoute, AuthProvider, useAuth } from './auth/AuthProvider';
import SiteApp from './App';
import AdminContentRoute from './admin/AdminContentRoute';
import AdminDashboard from './admin/AdminDashboard';
import { PrivacyPolicy, TermsOfService } from './LegalPages';
import FloatingIsland from './components/FloatingIsland';
import RemotePortfolioSync from './components/RemotePortfolioSync';
import RemotePricingSync from './components/RemotePricingSync';
import ClientLogosSync from './components/ClientLogosSync';
import CustomPackageBuilder from './components/CustomPackageBuilder';
import { SupportCenter } from './components/SupportCenter';
import SiteContactPatch from './components/SiteContactPatch';
import ExperienceUpgrade from './components/ExperienceUpgrade';
import ConversionSections from './components/ConversionSections';
import PerformancePolish from './components/PerformancePolish';
import MotionSystem from './components/MotionSystem';
import SiteContentSync from './components/SiteContentSync';
import HomepageStructureFix from './components/HomepageStructureFix';
import './lib/leadsCapture';
import './styles.css';
import './site-polish.css';
import './pricing-polish.css';
import './statement-white.css';
import './client-logo-fix.css';
import './components/FloatingIsland.css';
import './components/FloatingIslandFix.css';
import './components/SupportFloatingFix.css';
import './components/ExperienceUpgrade.css';
import './components/ConversionSections.css';
import './components/MotionSystem.css';
import './final-polish.css';

function Root() {
  const [path, setPath] = useState(() => window.location.pathname.replace(/\/+$/, '') || '/');
  useEffect(() => { const handleNavigation = () => setPath(window.location.pathname.replace(/\/+$/, '') || '/'); window.addEventListener('popstate', handleNavigation); return () => window.removeEventListener('popstate', handleNavigation); }, []);
  if (path === '/admin') return <AdminRoute />;
  if (path === '/admin/dashboard') return <AdminDashboardRoute />;
  if (path === '/admin/content') return <AdminContentRoute />;
  if (path === '/privacy-policy') return <PrivacyPolicy navigate={(next) => { window.history.pushState({}, '', next); setPath(next); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />;
  if (path === '/terms-of-service') return <TermsOfService navigate={(next) => { window.history.pushState({}, '', next); setPath(next); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />;
  return <><SiteApp /><FloatingIsland /><RemotePortfolioSync /><RemotePricingSync /><ClientLogosSync />{path === '/' && <CustomPackageBuilder />}<SupportCenter /><SiteContactPatch /><ExperienceUpgrade /><ConversionSections /><PerformancePolish /><MotionSystem /><SiteContentSync /><HomepageStructureFix /></>;
}

function AdminDashboardRoute() {
  const { user, loading, configured, signOut } = useAuth();
  if (loading) return <AdminDashboardShell>Checking session...</AdminDashboardShell>;
  if (!configured || !user || user.app_metadata?.role !== 'admin') return <AdminDashboardShell><div className="max-w-lg border border-[#F7F5F0]/10 p-8"><h1 className="text-3xl font-bold">Admin access required.</h1><p className="mt-3 text-sm text-[#F7F5F0]/50">Sign in through the main admin area first.</p><div className="mt-6 flex flex-wrap gap-3"><a href="/admin" className="rounded-full bg-[#F14A0B] px-5 py-3 font-semibold text-[#111111]">Open Admin</a>{user && <button onClick={() => void signOut()} className="rounded-full border border-[#F7F5F0]/15 px-5 py-3 font-semibold">Sign out</button>}</div></div></AdminDashboardShell>;
  return <AdminDashboardShell><header className="border-b border-[#F7F5F0]/10 pb-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[#F14A0B] text-xs font-bold uppercase tracking-[0.2em]">ZERO ONE / Admin</p><h1 className="mt-2 text-5xl md:text-7xl font-bold tracking-tighter">Dashboard.</h1><p className="mt-3 text-sm text-[#F7F5F0]/40">Signed in as {user.email}</p></div><div className="flex flex-wrap gap-2"><a href="/admin" className="rounded-full border border-[#F7F5F0]/15 px-4 py-2.5 text-sm font-semibold">Admin</a><a href="/admin/content" className="rounded-full border border-[#F7F5F0]/15 px-4 py-2.5 text-sm font-semibold">Site Content</a><button onClick={() => void signOut()} className="rounded-full border border-[#F7F5F0]/15 px-4 py-2.5 text-sm font-semibold">Sign out</button></div></div></header><AdminDashboard onNavigate={(section) => { window.location.assign('/admin?section=' + section); }} /></AdminDashboardShell>;
}

function AdminDashboardShell({ children }: { children: React.ReactNode }) { return <div className="min-h-screen bg-[#111111] text-[#F7F5F0] px-6 py-8 md:px-12 lg:px-16"><div className="mx-auto max-w-7xl">{children}</div></div>; }

createRoot(document.getElementById('root')!).render(<React.StrictMode><AuthProvider><Root /></AuthProvider></React.StrictMode>);
