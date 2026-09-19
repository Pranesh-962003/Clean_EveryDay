import React, { useState } from 'react';
import { useApp } from '../../../core/context/AppContext';
import { 
  ShieldCheck, 
  LogOut, 
  Search, 
  Loader2, 
  Menu,
  ChevronDown, 
  SlidersHorizontal 
} from 'lucide-react';

interface NavigationProps {
  onMenuClick?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ onMenuClick }) => {
  const {
    curUser,
    isAuthLoading,
    openAuthModal,
    logoutUser,
    orders
  } = useApp();

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setIsLoggingOut(false);
      setIsUserDropdownOpen(false);
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const pendingOrdersCount = (orders || []).filter(o => o.status === 'Pending').length;

  const triggerCommandPalette = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
  };

  return (
    <header className="sticky top-0 z-[100] w-full bg-slate-950 text-white border-b border-slate-800/90 select-none no-print shrink-0">
      <div className="w-full flex items-center justify-between px-4 sm:px-6 h-[58px] gap-4">
        
        {/* Left: Mobile Menu Toggle & Title Badge */}
        <div className="flex items-center gap-3 shrink-0">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-slate-300 border border-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Console
            </span>
          </div>
        </div>

        {/* Center: Quick Search Command Palette Trigger */}
        <div className="flex-1 max-w-[440px] mx-2 hidden md:block">
          <button
            type="button"
            onClick={triggerCommandPalette}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all text-xs cursor-pointer shadow-xs min-h-[36px]"
          >
            <div className="flex items-center gap-2.5">
              <Search size={14} className="text-slate-500" />
              <span>Quick search orders, products, customers...</span>
            </div>
            <kbd className="hidden lg:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right: Actions + User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Pending Orders Counter */}
          {pendingOrdersCount > 0 && (
            <div 
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold"
              title={`${pendingOrdersCount} orders waiting for processing`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>{pendingOrdersCount} Pending</span>
            </div>
          )}

          {/* User Profile Dropdown */}
          {isAuthLoading ? (
            <div className="w-9 h-9 rounded-xl border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-400">
              <Loader2 size={16} className="animate-spin" />
            </div>
          ) : curUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-900 transition-colors cursor-pointer select-none border border-transparent hover:border-slate-800 min-h-[38px]"
              >
                <div className="w-8 h-8 rounded-lg bg-white text-slate-950 flex items-center justify-center text-xs font-black shrink-0 overflow-hidden shadow-sm">
                  {curUser.avatar ? (
                    <img src={curUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    getUserInitials(curUser.name || 'Admin')
                  )}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-none pr-1">
                  <span className="text-xs font-bold text-white truncate max-w-[100px]">
                    {curUser.name?.split(' ')[0] || 'Admin'}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">
                    {curUser.isAdmin ? 'Super Admin' : 'Staff'}
                  </span>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {/* Profile Dropdown Menu */}
              {isUserDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 text-slate-200 animate-scaleIn">
                    <div className="px-4 py-2.5 border-b border-slate-800">
                      <p className="text-xs font-bold text-white truncate">{curUser.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">{curUser.email}</p>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                        <ShieldCheck size={11} className="text-emerald-400" />
                        Authorized Admin
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2.5 cursor-pointer transition-colors"
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          triggerCommandPalette();
                        }}
                      >
                        <SlidersHorizontal size={14} className="text-slate-400" />
                        <span>Command Palette</span>
                      </button>
                    </div>

                    <div className="border-t border-slate-800 my-1" />

                    <button
                      type="button"
                      disabled={isLoggingOut}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 flex items-center gap-2.5 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleLogout}
                    >
                      {isLoggingOut ? (
                        <Loader2 size={14} className="animate-spin text-rose-400 shrink-0" />
                      ) : (
                        <LogOut size={14} className="shrink-0" />
                      )}
                      <span>{isLoggingOut ? 'Signing Out...' : 'Sign Out'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="btn-primary text-xs font-semibold px-4 min-h-[38px]"
              onClick={() => openAuthModal('login')}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navigation;
