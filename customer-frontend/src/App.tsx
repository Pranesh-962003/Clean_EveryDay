import React, { useEffect, useRef } from 'react';
import { AppProvider, useApp } from './core/context/AppContext';
import Navigation from './features/webpage/components/Navigation';
import Footer from './features/webpage/components/Footer';
import AuthModal from './components/shared/AuthModal';
import Toast from './components/shared/Toast';
import InvoiceModal from './components/shared/InvoiceModal';
import Home from './features/webpage/pages/Home';
import Products from './features/webpage/pages/Products';
import ProductDetail from './features/webpage/pages/ProductDetail';
import Checkout from './features/webpage/pages/Checkout';
import Orders from './features/webpage/pages/Orders';
import Profile from './features/webpage/pages/Profile';
import ProtectedRoute from './components/shared/ProtectedRoute';

/* Map between URL pathname and curPage key */
const PATH_TO_PAGE: Record<string, string> = {
  '/': 'home',
  '/products': 'products',
  '/product': 'product-detail',
  '/checkout': 'checkout',
  '/orders': 'orders',
  '/profile': 'profile',
};

const PAGE_TO_PATH: Record<string, string> = {
  'home': '/',
  'products': '/products',
  'product-detail': '/product',
  'checkout': '/checkout',
  'orders': '/orders',
  'profile': '/profile',
};

const VALID_PAGES = Object.values(PATH_TO_PAGE);

const pathToPage = (pathname: string): string => {
  return PATH_TO_PAGE[pathname] || 'home';
};

const HomeCareApp: React.FC = () => {
  const { curPage, setCurPage } = useApp();
  const curPageRef = useRef(curPage);

  useEffect(() => {
    curPageRef.current = curPage;
  }, [curPage]);

  // Scroll to top on page transition
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [curPage]);

  // Push curPage → URL whenever curPage changes
  useEffect(() => {
    if (!curPage) return;
    const targetPath = PAGE_TO_PATH[curPage] || '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ page: curPage }, '', targetPath);
    }
  }, [curPage]);

  // Listen for browser back/forward (popstate)
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const page = e.state?.page || pathToPage(window.location.pathname);
      if (page && VALID_PAGES.includes(page) && page !== curPageRef.current) {
        setCurPage(page);
      }
    };

    // On first load, resolve URL → curPage
    const initialPage = pathToPage(window.location.pathname);
    if (initialPage !== curPageRef.current) {
      setCurPage(initialPage);
    }
    window.history.replaceState({ page: initialPage }, '', window.location.pathname);

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setCurPage]);

  const renderActivePage = () => {
    switch (curPage) {
      case 'home':
        return <Home />;
      case 'products':
        return <Products />;
      case 'product-detail':
        return <ProductDetail />;
      case 'checkout':
        return <Checkout />;
      case 'orders':
        return (
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        );
      case 'profile':
        return (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        );
      default:
        return <Home />;
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

      {/* Footer */}
      <Footer />

      {/* Global Modals & Alerts */}
      <AuthModal />
      <Toast />
      <InvoiceModal />
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
