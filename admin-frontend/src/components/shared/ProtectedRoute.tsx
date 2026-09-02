import React, { useEffect } from 'react';
import { useApp } from '../../core/context/AppContext';
import { ShieldAlert, LogIn, ExternalLink } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const CartoonRunningLeaf: React.FC = () => (
  <div className="relative flex flex-col items-center justify-center select-none py-2">
    <style>{`
      @keyframes sprintBounce {
        0%, 100% { transform: translateY(0px) rotate(10deg); }
        50% { transform: translateY(-8px) rotate(15deg); }
      }
      @keyframes strideLegBack {
        0% { transform: rotate(-45deg); }
        50% { transform: rotate(38deg); }
        100% { transform: rotate(-45deg); }
      }
      @keyframes strideLegFront {
        0% { transform: rotate(38deg); }
        50% { transform: rotate(-45deg); }
        100% { transform: rotate(38deg); }
      }
      @keyframes speedLine {
        0%, 100% { opacity: 0.2; transform: translateX(0); }
        50% { opacity: 0.85; transform: translateX(-5px); }
      }
    `}</style>
    
    <div className="relative flex items-center justify-center">
      {/* Cartoon Wind Speed Lines Behind */}
      <div className="absolute -left-6 top-3 flex flex-col gap-1.5 opacity-70">
        <div className="w-4 h-0.5 bg-primary/70 rounded-full" style={{ animation: 'speedLine 0.28s ease-in-out infinite' }} />
        <div className="w-6 h-0.5 bg-primary/80 rounded-full ml-1" style={{ animation: 'speedLine 0.28s ease-in-out infinite 0.08s' }} />
        <div className="w-3 h-0.5 bg-primary/70 rounded-full" style={{ animation: 'speedLine 0.28s ease-in-out infinite 0.16s' }} />
      </div>

      {/* Side-Profile Leaf Body facing and sprinting RIGHT */}
      <div style={{ animation: 'sprintBounce 0.28s ease-in-out infinite' }}>
        <svg width="76" height="74" viewBox="0 0 76 74" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Back Stick Leg (Sprinting) */}
          <g style={{ transformOrigin: '32px 50px', animation: 'strideLegBack 0.28s linear infinite' }}>
            <line x1="32" y1="50" x2="22" y2="64" stroke="#113826" strokeWidth="3" strokeLinecap="round" />
            <line x1="22" y1="64" x2="28" y2="65" stroke="#113826" strokeWidth="3" strokeLinecap="round" />
          </g>

          {/* Front Stick Leg (Sprinting) */}
          <g style={{ transformOrigin: '36px 50px', animation: 'strideLegFront 0.28s linear infinite' }}>
            <line x1="36" y1="50" x2="48" y2="64" stroke="#1B4332" strokeWidth="3.2" strokeLinecap="round" />
            <line x1="48" y1="64" x2="54" y2="65" stroke="#1B4332" strokeWidth="3.2" strokeLinecap="round" />
          </g>

          {/* Leaf Stem facing backwards */}
          <path d="M22 18C22 18 16 12 10 12" stroke="#1B4332" strokeWidth="3" strokeLinecap="round"/>
          
          {/* Side-Profile Leaf Body pointing RIGHT */}
          <path 
            d="M20 18C38 10 58 20 60 36C62 52 42 58 26 52C16 48 10 32 20 18Z" 
            fill="url(#leafSprintGradient)" 
            stroke="#1B4332" 
            strokeWidth="3"
          />
          
          {/* Main Curved Vein */}
          <path d="M20 18C32 30 52 40 58 38" stroke="#2D6A4F" strokeWidth="2.2" strokeLinecap="round" opacity="0.6"/>
          <path d="M30 26C38 24 45 28 45 28" stroke="#2D6A4F" strokeWidth="1.8" strokeLinecap="round" opacity="0.5"/>
          <path d="M35 37C42 36 49 42 49 42" stroke="#2D6A4F" strokeWidth="1.8" strokeLinecap="round" opacity="0.5"/>

          {/* Cartoon Eye looking RIGHT */}
          <ellipse cx="46" cy="28" rx="4" ry="4.5" fill="#1B4332" />
          <circle cx="47.5" cy="26.5" r="1.5" fill="#FFFFFF" />

          {/* Side Smile looking RIGHT */}
          <path d="M43 36C43 36 47 39 51 35" stroke="#1B4332" strokeWidth="2.5" strokeLinecap="round"/>

          <defs>
            <linearGradient id="leafSprintGradient" x1="16" y1="12" x2="60" y2="58" gradientUnits="userSpaceOnUse">
              <stop stopColor="#52B788" />
              <stop offset="1" stopColor="#2D6A4F" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  </div>
);

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { curUser, openAuthModal, isAuthLoading } = useApp();

  useEffect(() => {
    if (!isAuthLoading && (!curUser || (requireAdmin && !curUser.isAdmin))) {
      openAuthModal('login');
    }
  }, [curUser, isAuthLoading, requireAdmin, openAuthModal]);

  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center select-none bg-sur">
        <div className="flex flex-col items-center gap-4">
          <CartoonRunningLeaf />
          <p className="text-xs text-mut font-semibold tracking-wide">Verifying Admin Session...</p>
        </div>
      </div>
    );
  }

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
