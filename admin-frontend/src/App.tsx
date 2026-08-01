import React, { useEffect, useRef, useCallback } from 'react';
import { AppProvider, useApp } from './core/context/AppContext';
import Navigation from './features/webpage/components/Navigation';
import AuthModal from './components/shared/AuthModal';
import Toast from './components/shared/Toast';
import AdminPanel from './features/crm/pages/AdminPanel';
import ProtectedRoute from './components/shared/ProtectedRoute';
import InvoiceModal from './features/crm/components/InvoiceModal';

/* Map between URL pathname and curPage key */
const PATH_TO_PAGE: Record<string, string> = {
  '/': 'admin',
  '/admin': 'admin',
};

const PAGE_TO_PATH: Record<string, string> = {
  'admin': '/admin',
};

const VALID_PAGES = Object.values(PATH_TO_PAGE);

const pathToPage = (pathname: string): string => {
  return PATH_TO_PAGE[pathname] || 'admin';
};

const HomeCareApp: React.FC = () => {
  const { curPage, setCurPage, invoiceOrder, setInvoiceOrder } = useApp();
  const isNavigating = useRef(false);

  // Scroll to top on page transition
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [curPage]);

  // Push curPage → URL whenever curPage changes
  useEffect(() => {
    if (!curPage) return;
    const targetPath = PAGE_TO_PATH[curPage] || '/';
    if (window.location.pathname !== targetPath) {
      isNavigating.current = true;
      window.history.pushState({ page: curPage }, '', targetPath);
      // Reset guard after browser processes the state change
      const t = setTimeout(() => { isNavigating.current = false; }, 0);
      return () => clearTimeout(t);
    }
  }, [curPage]);

  // Listen for browser back/forward (popstate)
  const handlePopState = useCallback((e: PopStateEvent) => {
    if (isNavigating.current) return;
    const page = e.state?.page || pathToPage(window.location.pathname);
    if (page && VALID_PAGES.includes(page) && page !== curPage) {
      setCurPage(page);
    }
  }, [curPage, setCurPage]);

  useEffect(() => {
    // On first load, resolve URL → curPage
    const initialPage = pathToPage(window.location.pathname);
    if (initialPage !== curPage) {
      setCurPage(initialPage);
    }
    // Replace current state so popstate works for the initial entry too
    window.history.replaceState({ page: initialPage }, '', window.location.pathname);

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderActivePage = () => {
    switch (curPage) {
      case 'admin':
        return (
          <ProtectedRoute requireAdmin={true}>
            <AdminPanel />
          </ProtectedRoute>
        );
      default:
        return (
          <ProtectedRoute requireAdmin={true}>
            <AdminPanel />
          </ProtectedRoute>
        );
    }
  };

  return (
    <div className="app-wrapper">
      {/* Sticky header navbar */}
      <Navigation />

      {/* Main viewport */}
      <main className="main-viewport-content">
        {renderActivePage()}
      </main>

      {/* Footer is omitted in admin panel dashboard */}

      {/* Global Modals & Alerts */}
      <AuthModal />
      <Toast />
      {invoiceOrder && (
        <InvoiceModal
          order={invoiceOrder}
          isOpen={!!invoiceOrder}
          onClose={() => setInvoiceOrder(null)}
        />
      )}
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <HomeCareApp />
    </AppProvider>
  );
}

export default App;
