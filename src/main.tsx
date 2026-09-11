import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AdminRoute, AuthProvider } from './auth/AuthProvider';
import AdminContentRoute from './admin/AdminContentRoute';
import AdminDashboard from './admin/AdminDashboard';
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
  return <><App /><FloatingIsland /><RemotePortfolioSync /><RemotePricingSync /><ClientLogosSync />{path === '/' && <CustomPackageBuilder />}<SupportCenter /><SiteContactPatch /><ExperienceUpgrade /><ConversionSections /><PerformancePolish /><MotionSystem /><SiteContentSync /></>;
}

function AdminDashboardRoute() {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  return <AdminDashboardPage ready={ready} />;
}

function AdminDashboardPage({ ready }: { ready: boolean }) {
  if (!ready) return <div className="min-h-screen bg-[#111111] text-[#F7F5F0] grid place-items-center">Checking session...</div>;
  return <AdminDashboardGate />;
}

function AdminDashboardGate() {
  const { user, loading, configured, signOut } = require('./auth/AuthProvider') as typeof import('./auth/AuthProvider');
  return <AdminDashboardAuth user={user} loading={loading} configured={configured} signOut={signOut} />;
}

function AdminDashboardAuth({ user, loading, configured, signOut }: { user: import('@supabase/supabase-js').User | null; loading: boolean; configured: boolean; signOut: () => Promise<{ error: Error | null }> }) {
  if (loading) return <div className="min-h-screen bg-[#111111] text-[#F7F5F0] grid place-items-center">Checking session...</div>;
  if (!configured || !user || user.app_metadata?.role !== 'admin') return <div className="min-h-screen bg-[#111111] text-[#F7F5F0] grid place-items-center px-6"><div className="max-w-lg border border-[#F7F5F0]/10 p-8"><h1 className="text-3xl font-bold">Admin access required.</h1><p className="mt-3 text-sm text-[#F7F5F0]/50">Sign in through the main admin area first.</p><div className="mt-6 flex flex-wrap gap-3"><a href="/admin" className="inline-flex rounded-full bg-[#F14A0B] px-5 py-3 font-semibold text-[#111111]">Open Admin</a>{user && <button onClick={() => void signOut()} className="rounded-full border border-[#F7F5F0]/15 px-5 py-3 font-semibold">Sign out</button>}</div></div></div>;
  return <div className="min-h-screen bg-[#111111] text-[#F7F5F0] px-6 py-8 md:px-12 lg:px-16"><div className="mx-auto max-w-7xl"><header className="border-b border-[#F7F5F0]/10 pb-6"><div className="flex items-end justify-between gap-6"><div><p className="text-[#F14A0B] text-xs font-bold uppercase tracking-[0.2em]">ZERO ONE / Admin</p><h1 className="mt-2 text-5xl md:text-7xl font-bold tracking-tighter">Dashboard.</h1></div><div className="flex gap-2"><a href="/admin" className="rounded-full border border-[#F7F5F0]/15 px-4 py-2.5 text-sm font-semibold">Admin</a><a href="/admin/content" className="rounded-full border border-[#F7F5F0]/15 px-4 py-2.5 text-sm font-semibold">Site Content</a></div></div></header><AdminDashboard onNavigate={(section) => { window.location.assign('/admin?section=' + section); }} /></div></div>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><AuthProvider><Root /></AuthProvider></React.StrictMode>);
