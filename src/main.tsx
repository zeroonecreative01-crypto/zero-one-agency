import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AdminRoute, AuthProvider } from './auth/AuthProvider';
import AdminAccessButton from './components/AdminAccessButton';
import './styles.css';
import './site-polish.css';

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
