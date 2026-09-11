import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AdminRoute, AuthProvider } from './auth/AuthProvider';
import AdminContentRoute from './admin/AdminContentRoute';
import AdminAccessButton from './components/AdminAccessButton';
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

function Root() {
  const [path, setPath] = useState(() => window.location.pathname.replace(/\/+$/, '') || '/');
  useEffect(() => { const handleNavigation = () => setPath(window.location.pathname.replace(/\/+$/, '') || '/'); window.addEventListener('popstate', handleNavigation); return () => window.removeEventListener('popstate', handleNavigation); }, []);
  if (path === '/admin') return <AdminRoute />;
  if (path === '/admin/content') return <AdminContentRoute />;
  return <><App /><FloatingIsland /><RemotePortfolioSync /><RemotePricingSync /><ClientLogosSync />{path === '/' && <CustomPackageBuilder />}<SupportCenter /><SiteContactPatch /><ExperienceUpgrade /><ConversionSections /><PerformancePolish /><MotionSystem /><SiteContentSync /><AdminAccessButton /></>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><AuthProvider><Root /></AuthProvider></React.StrictMode>);
