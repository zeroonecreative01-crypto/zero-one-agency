import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AdminRoute, AuthProvider } from './auth/AuthProvider';
import AdminAccessButton from './components/AdminAccessButton';
import FloatingIsland from './components/FloatingIsland';
import RemotePortfolioSync from './components/RemotePortfolioSync';
import RemotePricingSync from './components/RemotePricingSync';
import CustomPackageBuilder from './components/CustomPackageBuilder';
import { SupportCenter } from './components/SupportCenter';
import './lib/leadsCapture';
import './styles.css';
import './site-polish.css';
import './pricing-polish.css';
import './components/FloatingIsland.css';
import './components/FloatingIslandFix.css';

function Root() {
  const [path, setPath] = useState(() => window.location.pathname.replace(/\/+$/, '') || '/');

  useEffect(() => {
    const handleNavigation = () => setPath(window.location.pathname.replace(/\/+$/, '') || '/');
    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, []);

  if (path === '/admin') return <AdminRoute />;

  return (
    <>
      <App />
      <FloatingIsland />
      <RemotePortfolioSync />
      <RemotePricingSync />
      <CustomPackageBuilder />
      <SupportCenter />
      <AdminAccessButton />
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </React.StrictMode>,
);
