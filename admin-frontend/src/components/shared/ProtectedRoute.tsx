import React, { useEffect } from 'react';
import { useApp } from '../../core/context/AppContext';
import { ShieldAlert, LogIn, ExternalLink } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { curUser, openAuthModal } = useApp();

  useEffect(() => {
    if (!curUser) {
      openAuthModal('login');
    }
  }, [curUser, openAuthModal]);

  if (!curUser || (requireAdmin && !curUser.isAdmin)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center select-none bg-sur">
        <div className="bg-wht border border-bdr rounded-2xl p-8 sm:p-10 shadow-premium-lg max-w-[460px] w-full animate-slideUp">
          <div className="w-14 h-14 bg-red-bg border border-red/10 text-red rounded-full flex items-center justify-center mx-auto mb-6 animate-pulseRing">
            <ShieldAlert size={26} />
          </div>
          
          <h2 className="font-display text-xl font-bold text-blk mb-2">
            Administrator Access Required
          </h2>
          <p className="text-xs text-mut leading-relaxed mb-8">
            Access to this management console is restricted to authorized personnel only. Please sign in to verify your identity.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => openAuthModal('login')}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-blk text-wht hover:bg-ink rounded-lg py-2.5 px-4 text-xs font-semibold cursor-pointer transition-colors shadow-premium-sm"
            >
              <LogIn size={14} /> Sign In
            </button>
            <a
              href="http://localhost:5173/"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-wht text-mid border border-bdr hover:border-mut rounded-lg py-2.5 px-4 text-xs font-semibold transition-colors"
            >
              Go to Storefront <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
