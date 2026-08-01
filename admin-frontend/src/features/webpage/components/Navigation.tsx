import React, { useState } from 'react';
import { useApp } from '../../../core/context/AppContext';
import { Leaf, Search, LogOut, ShoppingCart, LayoutDashboard, Menu, X, Loader2 } from 'lucide-react';

const Navigation: React.FC = () => {
  const {
    curUser,
    isAuthLoading,
    curPage,
    setCurPage,
    openAuthModal,
    logoutUser,
    cart
  } = useApp();

  const [inputVal, setInputVal] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    window.location.href = `http://localhost:5173/products`;
  };

  const handleLogoClick = () => {
    window.location.href = 'http://localhost:5173/';
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const navLinkClass = (page: string) =>
    `text-sm font-medium transition-colors cursor-pointer hover:text-primary ${
      curPage === page ? 'text-primary font-semibold' : 'text-mid'
    }`;

  const handleNavClick = (page: string, anchorId?: string) => {
    if (page === 'admin') {
      setCurPage('admin');
      setIsMobileMenuOpen(false);
      return;
    }
    const PAGE_TO_PATH: Record<string, string> = {
      'home': '/',
      'products': '/products',
      'product-detail': '/product',
      'checkout': '/checkout',
      'orders': '/orders',
      'profile': '/profile',
    };
    const path = PAGE_TO_PATH[page] || '/';
    const hash = anchorId ? `#${anchorId}` : '';
    window.location.href = `http://localhost:5173${path}${hash}`;
  };

  return (
    <header className="sticky top-0 z-[200] w-full">
      {/* Slim Announcement Ticker */}
      <div className="bg-blk flex items-center overflow-hidden h-[30px] border-b border-white/5">
        <div className="flex whitespace-nowrap animate-tickerLoop">
          <span className="inline-flex items-center gap-2 px-12 font-mono text-[0.62rem] font-medium tracking-[0.15em] uppercase text-mut">
            Free shipping on orders above ₹499 <span className="text-primary text-[0.7rem]">✦</span>
          </span>
          <span className="inline-flex items-center gap-2 px-12 font-mono text-[0.62rem] font-medium tracking-[0.15em] uppercase text-mut">
            Safe, natural, plant-based ingredients <span className="text-primary text-[0.7rem]">✦</span>
          </span>
          <span className="inline-flex items-center gap-2 px-12 font-mono text-[0.62rem] font-medium tracking-[0.15em] uppercase text-mut">
            Gentle on hands, tough on stains <span className="text-primary text-[0.7rem]">✦</span>
          </span>
          <span className="inline-flex items-center gap-2 px-12 font-mono text-[0.62rem] font-medium tracking-[0.15em] uppercase text-mut">
            No harsh chemicals or toxic residues <span className="text-primary text-[0.7rem]">✦</span>
          </span>
          {/* Loop copy */}
          <span className="inline-flex items-center gap-2 px-12 font-mono text-[0.62rem] font-medium tracking-[0.15em] uppercase text-mut">
            Free shipping on orders above ₹499 <span className="text-primary text-[0.7rem]">✦</span>
          </span>
          <span className="inline-flex items-center gap-2 px-12 font-mono text-[0.62rem] font-medium tracking-[0.15em] uppercase text-mut">
            Safe, natural, plant-based ingredients <span className="text-primary text-[0.7rem]">✦</span>
          </span>
          <span className="inline-flex items-center gap-2 px-12 font-mono text-[0.62rem] font-medium tracking-[0.15em] uppercase text-mut">
            Gentle on hands, tough on stains <span className="text-primary text-[0.7rem]">✦</span>
          </span>
          <span className="inline-flex items-center gap-2 px-12 font-mono text-[0.62rem] font-medium tracking-[0.15em] uppercase text-mut">
            No harsh chemicals or toxic residues <span className="text-primary text-[0.7rem]">✦</span>
          </span>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="bg-wht/80 backdrop-blur-lg border-b border-bdrl/80 shadow-premium-sm transition-all duration-200">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-4 md:px-7 h-[62px] gap-4">
          
          {/* Mobile Menu Button + Logo */}
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1 -ml-1 text-ink hover:text-primary transition-colors cursor-pointer"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div className="flex items-center gap-2.5 cursor-pointer select-none group" onClick={handleLogoClick}>
              <div className="w-8 h-8 border border-primary rounded-tr-[50%] rounded-tl-[50%] rounded-bl-[50%] rounded-br-[6px] flex items-center justify-center bg-primary-soft transition-transform duration-300 group-hover:-rotate-6">
                <Leaf className="text-primary" size={15} />
              </div>
              <div>
                <div className="font-display text-[1.2rem] font-bold text-blk tracking-wide leading-none hidden sm:block">
                  Clean <span className="text-primary font-normal italic font-display">Everyday</span>
                </div>
              </div>
            </div>
          </div>

          {/* Nav Links — uniform style, no icons */}
          <div className="hidden lg:flex items-center gap-7">
            <button className={navLinkClass('products')} onClick={() => handleNavClick('products')}>
              Collection
            </button>
            <button
              className={navLinkClass('home')}
              onClick={() => handleNavClick('home', 'about')}
            >
              About
            </button>
            <button
              className={navLinkClass('home')}
              onClick={() => handleNavClick('home', 'contact')}
            >
              Contact
            </button>
            <button className={navLinkClass('orders')} onClick={() => handleNavClick('orders')}>
              My Orders
            </button>

            {/* Admin link — visually separated */}
            {curUser?.isAdmin && (
              <>
                <span className="w-px h-4 bg-bdr" />
                <button
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors cursor-pointer hover:text-primary ${curPage === 'admin' ? 'text-primary font-semibold' : 'text-mid'}`}
                  onClick={() => handleNavClick('admin')}
                  title="Admin Dashboard"
                >
                  <LayoutDashboard size={13} />
                  Dashboard
                </button>
              </>
            )}
          </div>

          {/* Right — Search + Auth + Cart */}
          <div className="flex items-center gap-3.5 flex-1 justify-end max-w-[560px]">
            {/* Search */}
            <form
              className="hidden md:flex items-center border border-bdr rounded-md overflow-hidden bg-sur/50 focus-within:bg-wht focus-within:border-primary transition-all duration-200 h-[34px] w-full max-w-[260px]"
              onSubmit={handleSearchSubmit}
            >
              <input
                className="border-none outline-none px-3 text-sm text-ink flex-1 bg-transparent placeholder:text-mut"
                type="text"
                placeholder="Search products..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
              />
              <button className="px-3 h-full flex items-center justify-center text-mut hover:text-primary bg-transparent cursor-pointer" type="submit" aria-label="Search">
                <Search size={13} />
              </button>
            </form>

            <div className="flex items-center gap-2">
              {/* Cart */}
              <button
                className="relative w-9 h-9 border border-bdr rounded-full flex items-center justify-center text-ink hover:text-primary hover:bg-sur transition-colors cursor-pointer"
                onClick={() => { window.location.href = 'http://localhost:5173/checkout'; }}
                title="View Shopping Cart"
              >
                <ShoppingCart size={15} />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-wht text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-scaleUp">
                    {cartItemsCount}
                  </span>
                )}
              </button>

              {isAuthLoading ? (
                <div className="w-8 h-8 rounded-full border border-bdr bg-sur/50 flex items-center justify-center text-primary" title="Verifying session...">
                  <Loader2 size={15} className="animate-spin" />
                </div>
              ) : curUser ? (
                <>
                  <div
                    className="flex items-center gap-2 bg-bdrl border border-bdr rounded-full py-1 pr-3 pl-1 cursor-pointer transition-all duration-150 hover:bg-bdr/50"
                    onClick={() => {
                      if (curUser.isAdmin) {
                        setCurPage('admin');
                      } else {
                        window.location.href = 'http://localhost:5173/profile';
                      }
                    }}
                  >
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-wht overflow-hidden shrink-0">
                      {curUser.avatar ? (
                        <img src={curUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        getUserInitials(curUser.name)
                      )}
                    </div>
                    <span className="text-xs font-semibold text-ink hidden sm:inline">
                      {curUser.name.split(' ')[0]}
                    </span>
                  </div>
                  <button
                    className="w-8 h-8 rounded-full border border-bdr flex items-center justify-center text-mut hover:bg-red-bg hover:text-red hover:border-red/20 transition-all duration-150 cursor-pointer"
                    onClick={logoutUser}
                    title="Sign Out"
                  >
                    <LogOut size={13} />
                  </button>
                </>
              ) : (
                <button
                  className="text-xs font-semibold text-wht px-4 py-1.5 bg-primary hover:bg-primary-hover transition-colors rounded-md cursor-pointer"
                  onClick={() => openAuthModal('login')}
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-bdrl bg-wht animate-slideDown shadow-premium-md absolute w-full">
            <div className="px-4 py-4 flex flex-col gap-4">
              {/* Mobile Search */}
              <form
                className="flex items-center border border-bdr rounded-md overflow-hidden bg-sur/50 focus-within:bg-wht focus-within:border-primary transition-all duration-200 h-[40px] w-full"
                onSubmit={handleSearchSubmit}
              >
                <input
                  className="border-none outline-none px-3 text-sm text-ink flex-1 bg-transparent placeholder:text-mut"
                  type="text"
                  placeholder="Search products..."
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                />
                <button className="px-3 h-full flex items-center justify-center text-mut hover:text-primary bg-transparent cursor-pointer" type="submit" aria-label="Search">
                  <Search size={16} />
                </button>
              </form>

              <div className="flex flex-col gap-2">
                <button className={`text-left py-2 px-2 rounded-md hover:bg-sur ${navLinkClass('products')}`} onClick={() => handleNavClick('products')}>
                  Collection
                </button>
                <button className={`text-left py-2 px-2 rounded-md hover:bg-sur ${navLinkClass('home')}`} onClick={() => handleNavClick('home', 'about')}>
                  About
                </button>
                <button className={`text-left py-2 px-2 rounded-md hover:bg-sur ${navLinkClass('home')}`} onClick={() => handleNavClick('home', 'contact')}>
                  Contact
                </button>
                <button className={`text-left py-2 px-2 rounded-md hover:bg-sur ${navLinkClass('orders')}`} onClick={() => handleNavClick('orders')}>
                  My Orders
                </button>
                {curUser?.isAdmin && (
                  <button className={`text-left py-2 px-2 rounded-md hover:bg-sur flex items-center gap-2 ${curPage === 'admin' ? 'text-primary font-semibold' : 'text-mid'}`} onClick={() => handleNavClick('admin')}>
                    <LayoutDashboard size={14} /> Admin Dashboard
                  </button>
                )}
                {curUser ? (
                  <button className="text-left py-2 px-2 rounded-md hover:bg-red-bg text-red flex items-center gap-2 font-medium" onClick={() => { logoutUser(); setIsMobileMenuOpen(false); }}>
                    <LogOut size={14} /> Sign Out
                  </button>
                ) : (
                  <button className="text-left py-2 px-2 rounded-md bg-primary text-wht font-semibold text-center" onClick={() => { openAuthModal('login'); setIsMobileMenuOpen(false); }}>
                    Login / Sign Up
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navigation;
