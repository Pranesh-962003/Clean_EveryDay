import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../../core/context/AppContext';
import {
  LayoutDashboard,
  ShoppingBag,
  MessageSquare,
  PlusCircle,
  Image as ImageIcon,
  Users,
  LogOut,
  Loader2,
  FileText,
  Inbox,
  X,
  Search,
  ArrowRight,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

import Navigation from '../../webpage/components/Navigation';
import DashboardOverview from '../components/DashboardOverview';
import ProductsCatalog from '../components/ProductsCatalog';
import AddProductForm from '../components/AddProductForm';
import BannersManagement from '../components/BannersManagement';
import OrdersRegistry from '../components/OrdersRegistry';
import LeadsCRM from '../components/LeadsCRM';
import ReviewsModeration from '../components/ReviewsModeration';
import StaffAccounts from '../components/StaffAccounts';

type TabName = 'dashboard' | 'products' | 'orders' | 'reviews' | 'add' | 'banners' | 'leads' | 'users';

const AdminPanel: React.FC = () => {
  const { logoutUser, orders, leads, reviews, products, staff, setSearchQuery } = useApp();

  const [activeTab, setActiveTab] = useState<TabName>(() => {
    const saved = sessionStorage.getItem('ce_admin_tab');
    return (saved as TabName) || 'dashboard';
  });
  
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logoutUser();
      setIsMobileSidebarOpen(false);
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };
  
  // Command Palette States
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState('');
  const paletteInputRef = useRef<HTMLInputElement>(null);

  // Preserve scroll position
  useEffect(() => {
    sessionStorage.setItem('ce_admin_tab', activeTab);
    const mainWorkspace = document.getElementById('crm-workspace-main');
    if (mainWorkspace) {
      mainWorkspace.scrollTop = 0;
    }
  }, [activeTab]);

  // Keybindings listener for Command Palette (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-focus input when command palette opens
  useEffect(() => {
    if (isPaletteOpen) {
      setPaletteSearch('');
      setTimeout(() => {
        paletteInputRef.current?.focus();
      }, 50);
    }
  }, [isPaletteOpen]);

  const handleTabChange = (tab: TabName) => {
    setActiveTab(tab);
    setIsMobileSidebarOpen(false);
  };

  // Badge counts
  const pendingReviewsCount = (reviews || []).filter((r) => !r.approved).length;
  const newLeadsCount = (leads || []).filter((l) => l.status === 'New').length;
  const newOrdersCount = (orders || []).filter((o) => o.status === 'Pending').length;

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview onTabChange={handleTabChange} />;
      case 'products':
        return <ProductsCatalog onTabChange={handleTabChange} />;
      case 'add':
        return <AddProductForm onTabChange={handleTabChange} />;
      case 'banners':
        return <BannersManagement />;
      case 'orders':
        return <OrdersRegistry />;
      case 'leads':
        return <LeadsCRM />;
      case 'reviews':
        return <ReviewsModeration />;
      case 'users':
        return <StaffAccounts />;
      default:
        return <DashboardOverview onTabChange={handleTabChange} />;
    }
  };

  // Command palette search matching logic
  const query = paletteSearch.toLowerCase().trim();

  const matchedProducts = query
    ? (products || []).filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.cat.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  const matchedOrders = query
    ? (orders || []).filter(
        (o) =>
          o.id.toLowerCase().includes(query) ||
          (o.customerEmail && o.customerEmail.toLowerCase().includes(query)) ||
          o.status.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  const matchedLeads = query
    ? (leads || []).filter(
        (l) =>
          l.name.toLowerCase().includes(query) ||
          l.email.toLowerCase().includes(query) ||
          (l.service && l.service.toLowerCase().includes(query))
      ).slice(0, 3)
    : [];

  const matchedStaff = query
    ? (staff || []).filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query) ||
          s.role.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  const hasMatches =
    matchedProducts.length > 0 ||
    matchedOrders.length > 0 ||
    matchedLeads.length > 0 ||
    matchedStaff.length > 0;

  const handlePaletteSelect = (tab: TabName, searchVal: string) => {
    setSearchQuery(searchVal);
    setActiveTab(tab);
    setIsPaletteOpen(false);
  };

  interface NavItem {
    id: TabName;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }
  interface NavSection {
    title: string;
    items: NavItem[];
  }

  const navSections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard' as TabName, label: 'Dashboard', icon: <LayoutDashboard size={16} /> }
      ]
    },
    {
      title: 'Store',
      items: [
        { id: 'products' as TabName, label: 'Products', icon: <ShoppingBag size={16} /> },
        { id: 'add' as TabName, label: 'Add Product', icon: <PlusCircle size={16} /> },
        { id: 'banners' as TabName, label: 'Banners', icon: <ImageIcon size={16} /> }
      ]
    },
    {
      title: 'Customers & Sales',
      items: [
        { id: 'orders' as TabName, label: 'Orders', icon: <FileText size={16} />, badge: newOrdersCount },
        { id: 'leads' as TabName, label: 'Leads', icon: <Inbox size={16} />, badge: newLeadsCount },
        { id: 'reviews' as TabName, label: 'Reviews', icon: <MessageSquare size={16} />, badge: pendingReviewsCount }
      ]
    },
    {
      title: 'Team',
      items: [
        { id: 'users' as TabName, label: 'Staff', icon: <Users size={16} /> }
      ]
    }
  ];

  return (
    <div className="w-full h-full flex flex-row overflow-hidden bg-slate-50">
      
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[240] lg:hidden no-print animate-fadeIn"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidenav - From Top: 0, Full Viewport Height */}
      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 select-none transition-all duration-300 z-[250] lg:z-10 no-print flex flex-col bg-slate-950 py-4 border-r border-slate-800/90 shrink-0 h-full overflow-y-auto overflow-x-hidden scrollbar-none ${
          isMobileSidebarOpen
            ? 'translate-x-0 w-[260px]'
            : `-translate-x-full lg:translate-x-0 ${isSidebarCollapsed ? 'lg:w-[72px] px-2' : 'lg:w-[250px]'}`
        }`}
      >
        {/* Sidebar Header with Company Name & Expand/Collapse Toggle */}
        <div className={`flex items-center mb-5 ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-4'}`}>
          {!isSidebarCollapsed ? (
            <>
              <div className="flex items-center gap-2.5 select-none">
                <div className="w-8 h-8 rounded-xl bg-white text-slate-950 flex items-center justify-center font-black text-sm tracking-tight shadow-sm shrink-0">
                  E
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-display text-sm font-extrabold text-white tracking-tight">
                    Ecommerce
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                    Admin
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="hidden lg:flex text-slate-400 hover:text-white p-1.5 cursor-pointer items-center justify-center hover:bg-slate-900 rounded-lg transition-colors"
                onClick={() => setIsSidebarCollapsed(true)}
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
              >
                <PanelLeftClose size={18} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(false)}
              className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-white flex items-center justify-center font-black text-sm shadow-xs cursor-pointer group hover:bg-slate-800 hover:border-slate-700 transition-all relative overflow-hidden"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <span className="group-hover:opacity-0 group-hover:scale-75 transition-all duration-150 absolute font-black text-white">
                E
              </span>
              <PanelLeftOpen size={18} className="opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 text-slate-200" />
            </button>
          )}
          <button 
            type="button"
            className="lg:hidden text-slate-400 hover:text-white p-1.5 cursor-pointer rounded-lg hover:bg-slate-900" 
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className={`flex flex-col gap-4 flex-1 ${isSidebarCollapsed ? 'px-0' : 'px-3'} overflow-x-hidden`}>
          {navSections.map((sec) => (
            <div key={sec.title} className="flex flex-col gap-1">
              {!isSidebarCollapsed && (
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-1 select-none">
                  {sec.title}
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                {sec.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      title={isSidebarCollapsed ? item.label : undefined}
                      className={`flex items-center gap-3 rounded-xl text-xs font-semibold transition-all duration-150 w-full text-left relative cursor-pointer min-h-[42px] overflow-hidden ${
                        isSidebarCollapsed ? 'justify-center px-0 py-2.5' : 'px-3.5 py-2.5'
                      } ${
                        isActive
                          ? 'bg-slate-900 text-white font-bold shadow-xs border-l-2 border-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                      }`}
                      onClick={() => handleTabChange(item.id)}
                    >
                      <span className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                        {item.icon}
                      </span>
                      {!isSidebarCollapsed && (
                        <span className="truncate pr-6">{item.label}</span>
                      )}
                      {!isSidebarCollapsed && !!item.badge && item.badge > 0 && (
                        <span className="absolute right-3 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-200 border border-slate-700">
                          {item.badge}
                        </span>
                      )}
                      {isSidebarCollapsed && !!item.badge && item.badge > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className={`pt-3 mt-3 border-t border-slate-800/80 flex flex-col gap-1.5 ${isSidebarCollapsed ? 'items-center px-1' : 'px-3'}`}>
          <button 
            type="button"
            disabled={isLoggingOut}
            className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer w-full min-h-[38px] border-none outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
              isSidebarCollapsed ? 'justify-center px-0' : ''
            }`}
            onClick={handleLogout}
            title={isSidebarCollapsed ? (isLoggingOut ? 'Signing Out...' : 'Sign Out') : undefined}
          >
            {isLoggingOut ? (
              <Loader2 size={15} className="animate-spin text-rose-400 shrink-0" />
            ) : (
              <LogOut size={15} className="shrink-0" />
            )}
            {!isSidebarCollapsed && <span>{isLoggingOut ? 'Signing Out...' : 'Sign Out'}</span>}
          </button>
        </div>
      </aside>

      {/* Right Column: Top Navigation Bar + Main CRM Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full min-w-0">
        <Navigation onMenuClick={() => setIsMobileSidebarOpen(true)} />

        <main 
          id="crm-workspace-main"
          className="flex-1 h-full overflow-y-auto w-full p-4 sm:p-6 lg:p-8 bg-slate-50/70"
        >
          {/* Tab Module Content (Clean Direct View) */}
          {renderActiveTabContent()}
        </main>
      </div>

      {/* Global Command Palette Overlay Dialog */}
      {isPaletteOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[300] flex items-start justify-center pt-[12vh] px-4 no-print animate-fadeIn select-none">
          <div 
            className="fixed inset-0" 
            onClick={() => setIsPaletteOpen(false)}
          />
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-[640px] flex flex-col overflow-hidden max-h-[75vh] relative z-10 animate-scaleIn">
            
            {/* Search Input field */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 bg-slate-50">
              <Search size={18} className="text-slate-500" />
              <input
                ref={paletteInputRef}
                type="text"
                placeholder="Search products, orders, leads, or staff..."
                className="flex-1 bg-transparent border-none outline-none text-sm font-semibold text-slate-950 placeholder:text-slate-500"
                value={paletteSearch}
                onChange={(e) => setPaletteSearch(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setIsPaletteOpen(false)}
                className="text-xs font-bold text-slate-600 hover:text-slate-950 cursor-pointer border border-slate-300 rounded-lg px-2 py-1 bg-white"
              >
                Esc
              </button>
            </div>

            {/* Results Content */}
            <div className="overflow-y-auto p-4 flex-1">
              {!query ? (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-500 mb-3 uppercase tracking-wider">Quick Navigation</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { id: 'dashboard', label: 'Dashboard Overview', tab: 'dashboard' as TabName },
                      { id: 'products', label: 'Products Catalogue', tab: 'products' as TabName },
                      { id: 'orders', label: 'Orders Registry', tab: 'orders' as TabName },
                      { id: 'leads', label: 'Leads CRM Log', tab: 'leads' as TabName }
                    ].map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(n.tab);
                          setIsPaletteOpen(false);
                        }}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-slate-950 hover:bg-slate-50 text-left text-xs font-bold text-slate-950 cursor-pointer transition-all min-h-[44px]"
                      >
                        <span>{n.label}</span>
                        <ArrowRight size={14} className="text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : !hasMatches ? (
                <div className="text-center py-12 text-sm text-slate-500 font-medium">
                  No matching workspace records found for &ldquo;{paletteSearch}&rdquo;
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {/* Products */}
                  {matchedProducts.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Products Catalogue</h4>
                      <div className="flex flex-col gap-1.5">
                        {matchedProducts.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handlePaletteSelect('products', p.sku)}
                            className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 text-left text-xs text-slate-950 cursor-pointer transition-all"
                          >
                            <div>
                              <span className="font-bold block">{p.name}</span>
                              <span className="text-slate-500 text-[11px] font-mono">SKU: {p.sku} | Category: {p.cat}</span>
                            </div>
                            <span className="text-[11px] font-bold text-slate-950 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
                              View in Catalog
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Orders */}
                  {matchedOrders.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Orders Registry</h4>
                      <div className="flex flex-col gap-1.5">
                        {matchedOrders.map((o) => (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => handlePaletteSelect('orders', o.id)}
                            className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 text-left text-xs text-slate-950 cursor-pointer transition-all"
                          >
                            <div>
                              <span className="font-bold font-mono block">{o.id}</span>
                              <span className="text-slate-500 text-[11px]">{o.customerEmail} | Status: {o.status}</span>
                            </div>
                            <span className="text-[11px] font-bold text-slate-950 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
                              Open Order
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Leads */}
                  {matchedLeads.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Leads CRM</h4>
                      <div className="flex flex-col gap-1.5">
                        {matchedLeads.map((l) => (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => handlePaletteSelect('leads', l.name)}
                            className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 text-left text-xs text-slate-950 cursor-pointer transition-all"
                          >
                            <div>
                              <span className="font-bold block">{l.name}</span>
                              <span className="text-slate-500 text-[11px]">{l.email} | Service: {l.service}</span>
                            </div>
                            <span className="text-[11px] font-bold text-slate-950 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
                              Open Lead
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Staff */}
                  {matchedStaff.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Staff Accounts</h4>
                      <div className="flex flex-col gap-1.5">
                        {matchedStaff.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handlePaletteSelect('users', s.name)}
                            className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 text-left text-xs text-slate-950 cursor-pointer transition-all"
                          >
                            <div>
                              <span className="font-bold block">{s.name}</span>
                              <span className="text-slate-500 text-[11px]">{s.email} | Role: {s.role}</span>
                            </div>
                            <span className="text-[11px] font-bold text-slate-950 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
                              View Staff
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-medium select-none">
              <span>Press <kbd className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">Ctrl+K</kbd> to toggle</span>
              <span>Enterprise Admin Console</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPanel;
