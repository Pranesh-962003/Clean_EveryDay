import React, { useEffect } from 'react';
import { useApp } from '../../core/context/AppContext';
import { ShieldAlert, LogIn, ExternalLink } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ThreeDTruckLoader: React.FC = () => (
  <div className="relative flex flex-col items-center justify-center select-none py-4 overflow-hidden w-[280px] h-[140px]">
    <style>{`
      /* Smooth synchronized master delivery cycle (5s loop) */

      /* Person Walking & Loading Animation */
      @keyframes personJourney {
        0% { transform: translateX(-40px); opacity: 0; }
        8% { opacity: 1; }
        25% { transform: translateX(28px); } /* Walked to rear of truck */
        38% { transform: translateX(28px); } /* Stand still while putting box in */
        50% { transform: translateX(10px); } /* Step back after loading */
        85% { transform: translateX(10px); opacity: 1; }
        95%, 100% { transform: translateX(10px); opacity: 0; }
      }

      @keyframes personLegs {
        0%, 100% { transform: rotate(0deg); }
        15% { transform: rotate(-25deg); }
        30% { transform: rotate(25deg); }
        45% { transform: rotate(0deg); }
      }

      /* Box Loading into Truck */
      @keyframes boxMovement {
        0% { transform: translate(-40px, 0px); opacity: 0; }
        8% { opacity: 1; }
        25% { transform: translate(28px, -2px); } /* Carrying box to truck */
        35% { transform: translate(62px, -12px) scale(0.85); opacity: 1; } /* Lifted into truck cargo */
        38%, 100% { transform: translate(75px, -12px) scale(0.7); opacity: 0; } /* Inside cargo bay */
      }

      /* Truck Idle & Driving Motion */
      @keyframes truckMotion {
        0%, 38% { transform: translate(0px, 0px); } /* Parked at loading bay */
        42% { transform: translate(-3px, 1px); } /* Slight rev back before launch */
        78% { transform: translate(260px, 0px); opacity: 1; } /* Drive off to deliver! */
        85%, 100% { transform: translate(320px, 0px); opacity: 0; } /* Disappear off screen */
      }

      /* Truck Wheel Rotation */
      @keyframes wheelSpin {
        0%, 38% { transform: rotate(0deg); }
        42% { transform: rotate(-20deg); }
        78%, 85% { transform: rotate(1080deg); }
        100% { transform: rotate(1080deg); }
      }

      /* Truck Idle Engine Bounce */
      @keyframes engineVibe {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-1.5px); }
      }

      /* Cargo Door Shutting */
      @keyframes cargoDoorClose {
        0%, 30% { transform: scaleX(1); }
        38%, 85% { transform: scaleX(0.1); }
        100% { transform: scaleX(1); }
      }

      /* Exhaust Smoke Plume */
      @keyframes exhaustPuff {
        0%, 38% { opacity: 0; transform: scale(0.2) translate(0, 0); }
        45% { opacity: 0.8; transform: scale(1) translate(-12px, -8px); }
        60% { opacity: 0; transform: scale(1.6) translate(-28px, -16px); }
        100% { opacity: 0; }
      }

      /* Headlight Beam Glow */
      @keyframes headlightGlow {
        0%, 35% { opacity: 0.3; }
        42%, 80% { opacity: 0.95; }
        100% { opacity: 0.3; }
      }
    `}</style>

    <div className="relative w-full h-full flex items-center justify-center">
      {/* Isometric Road Base / Platform */}
      <div className="absolute bottom-4 w-60 h-2 bg-bdr/40 rounded-full" />
      <div className="absolute bottom-[17px] w-52 h-[1px] bg-primary/20 rounded-full" />

      {/* Main Delivery Animation Scene Container */}
      <div className="relative w-56 h-24 flex items-center">

        {/* --- PERSON / LOADER --- */}
        <div 
          className="absolute left-4 bottom-5 z-20"
          style={{ animation: 'personJourney 5s ease-in-out infinite' }}
        >
          <svg width="28" height="42" viewBox="0 0 28 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Person Legs */}
            <g style={{ transformOrigin: '12px 28px', animation: 'personLegs 0.6s ease-in-out infinite' }}>
              <line x1="10" y1="28" x2="6" y2="40" stroke="#113826" strokeWidth="3" strokeLinecap="round" />
            </g>
            <g style={{ transformOrigin: '16px 28px', animation: 'personLegs 0.6s ease-in-out infinite 0.3s' }}>
              <line x1="16" y1="28" x2="20" y2="40" stroke="#1B4332" strokeWidth="3.2" strokeLinecap="round" />
            </g>

            {/* Person Body & Vest */}
            <rect x="7" y="14" width="13" height="15" rx="4" fill="#2D6A4F" stroke="#113826" strokeWidth="1.5" />
            {/* Safety Vest Stripe */}
            <rect x="7" y="19" width="13" height="3" fill="#52B788" />

            {/* Head & Cap */}
            <circle cx="13.5" cy="8.5" r="5.5" fill="#E8B999" />
            <path d="M7 8C7 5 10 3 14 3C18 3 21 5 21 8H7Z" fill="#1B4332" />
            <path d="M14 3C18 3 22 4.5 24 5.5" stroke="#1B4332" strokeWidth="2" strokeLinecap="round" />

            {/* Arms holding box */}
            <path d="M9 16C12 20 18 20 22 17" stroke="#113826" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* --- CARRIED PARCEL BOX --- */}
        <div 
          className="absolute left-7 bottom-8 z-30 pointer-events-none"
          style={{ animation: 'boxMovement 5s ease-in-out infinite' }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* 3D Box Isometric Top/Sides */}
            <path d="M9 1L17 5V13L9 17L1 13V5L9 1Z" fill="#D97706" stroke="#92400E" strokeWidth="1" />
            <path d="M9 1L17 5L9 9L1 5L9 1Z" fill="#F59E0B" />
            <path d="M9 9V17L1 13V5L9 9Z" fill="#B45309" />
            {/* Packaging Tape */}
            <path d="M9 1L9 9M9 9L17 5M9 9L1 5" stroke="#FDE68A" strokeWidth="1.2" opacity="0.8" />
          </svg>
        </div>

        {/* --- 3D TRUCK --- */}
        <div 
          className="absolute left-16 bottom-4 z-10"
          style={{ animation: 'truckMotion 5s cubic-bezier(0.45, 0, 0.25, 1) infinite' }}
        >
          <div style={{ animation: 'engineVibe 0.3s ease-in-out infinite' }}>
            <svg width="128" height="72" viewBox="0 0 128 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                {/* 3D Container Metallic Gradients */}
                <linearGradient id="truckBodyGrad" x1="0" y1="0" x2="0" y2="50" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#2D6A4F" />
                  <stop offset="0.6" stopColor="#1B4332" />
                  <stop offset="1" stopColor="#0D2818" />
                </linearGradient>

                <linearGradient id="cabGrad" x1="60" y1="10" x2="115" y2="50" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#52B788" />
                  <stop offset="0.7" stopColor="#2D6A4F" />
                  <stop offset="1" stopColor="#1B4332" />
                </linearGradient>

                <linearGradient id="windshieldGrad" x1="85" y1="12" x2="105" y2="30" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#A7F3D0" />
                  <stop offset="1" stopColor="#34D399" stopOpacity="0.6" />
                </linearGradient>

                <linearGradient id="headlightBeam" x1="114" y1="36" x2="140" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FEF08A" stopOpacity="0.8" />
                  <stop offset="1" stopColor="#FEF08A" stopOpacity="0" />
                </linearGradient>

                <filter id="truckShadow" x="-10" y="48" width="148" height="24" filterUnits="userSpaceOnUse">
                  <ellipse cx="64" cy="58" rx="60" ry="6" fill="#000000" opacity="0.3" />
                </filter>
              </defs>

              {/* Truck Drop Shadow */}
              <ellipse cx="62" cy="62" rx="58" ry="5" fill="#113826" opacity="0.25" />

              {/* Exhaust Smoke Particle */}
              <circle cx="2" cy="46" r="4" fill="#9CA3AF" style={{ transformOrigin: '2px 46px', animation: 'exhaustPuff 5s ease-out infinite' }} />

              {/* --- TRUCK REAR CARGO CONTAINER (3D Isometric Box) --- */}
              {/* Container Roof top bevel */}
              <path d="M4 10L68 10L72 14L8 14Z" fill="#40916C" />
              {/* Main Cargo Container Body */}
              <rect x="4" y="14" width="68" height="36" rx="3" fill="url(#truckBodyGrad)" stroke="#113826" strokeWidth="1.5" />
              {/* Eco Clean Lines on Container Side */}
              <line x1="12" y1="20" x2="60" y2="20" stroke="#52B788" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
              <line x1="12" y1="26" x2="60" y2="26" stroke="#52B788" strokeWidth="1.5" opacity="0.4" />
              {/* Brand Eco Leaf Icon on Truck Side */}
              <path d="M34 30C40 26 48 30 48 36C42 40 34 38 34 30Z" fill="#52B788" opacity="0.85" />

              {/* Openable Rear Door (Animated Scale) */}
              <rect 
                x="4" y="15" width="10" height="34" fill="#0D2818" stroke="#52B788" strokeWidth="1"
                style={{ transformOrigin: '4px 32px', animation: 'cargoDoorClose 5s ease-in-out infinite' }} 
              />

              {/* --- TRUCK CABIN (FRONT) --- */}
              <path d="M72 20L92 20L112 32L114 50H72V20Z" fill="url(#cabGrad)" stroke="#113826" strokeWidth="1.5" />
              
              {/* 3D Curved Windshield Window */}
              <path d="M78 23H90L106 33H78V23Z" fill="url(#windshieldGrad)" stroke="#1B4332" strokeWidth="1" />
              {/* Window Glare Streak */}
              <path d="M85 24L98 32" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />

              {/* Front Grill & Bumper */}
              <rect x="110" y="38" width="5" height="12" rx="1.5" fill="#1E293B" />
              <line x1="111" y1="41" x2="114" y2="41" stroke="#94A3B8" strokeWidth="1" />
              <line x1="111" y1="44" x2="114" y2="44" stroke="#94A3B8" strokeWidth="1" />
              <line x1="111" y1="47" x2="114" y2="47" stroke="#94A3B8" strokeWidth="1" />

              {/* Headlight Glowing Light Cone */}
              <polygon 
                points="114,40 148,32 148,52 114,46" 
                fill="url(#headlightBeam)" 
                style={{ animation: 'headlightGlow 5s ease-in-out infinite' }}
              />
              {/* Headlight Bulb */}
              <circle cx="113" cy="42" r="2.5" fill="#FEF08A" />

              {/* Side Mirror */}
              <rect x="74" y="27" width="3" height="5" rx="1" fill="#113826" />

              {/* --- 3D ROTATING WHEELS WITH RIMS --- */}
              {/* Back Wheel 1 */}
              <g style={{ transformOrigin: '24px 52px', animation: 'wheelSpin 5s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}>
                <circle cx="24" cy="52" r="10" fill="#0F172A" stroke="#334155" strokeWidth="2" />
                <circle cx="24" cy="52" r="5" fill="#64748B" />
                <circle cx="24" cy="52" r="2" fill="#F8FAFC" />
                <line x1="24" y1="44" x2="24" y2="60" stroke="#CBD5E1" strokeWidth="1.2" />
                <line x1="16" y1="52" x2="32" y2="52" stroke="#CBD5E1" strokeWidth="1.2" />
              </g>

              {/* Back Wheel 2 */}
              <g style={{ transformOrigin: '48px 52px', animation: 'wheelSpin 5s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}>
                <circle cx="48" cy="52" r="10" fill="#0F172A" stroke="#334155" strokeWidth="2" />
                <circle cx="48" cy="52" r="5" fill="#64748B" />
                <circle cx="48" cy="52" r="2" fill="#F8FAFC" />
                <line x1="48" y1="44" x2="48" y2="60" stroke="#CBD5E1" strokeWidth="1.2" />
                <line x1="40" y1="52" x2="56" y2="52" stroke="#CBD5E1" strokeWidth="1.2" />
              </g>

              {/* Front Wheel */}
              <g style={{ transformOrigin: '96px 52px', animation: 'wheelSpin 5s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}>
                <circle cx="96" cy="52" r="10" fill="#0F172A" stroke="#334155" strokeWidth="2" />
                <circle cx="96" cy="52" r="5" fill="#64748B" />
                <circle cx="96" cy="52" r="2" fill="#F8FAFC" />
                <line x1="96" y1="44" x2="96" y2="60" stroke="#CBD5E1" strokeWidth="1.2" />
                <line x1="88" y1="52" x2="104" y2="52" stroke="#CBD5E1" strokeWidth="1.2" />
              </g>
            </svg>
          </div>
        </div>

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
          <ThreeDTruckLoader />
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
