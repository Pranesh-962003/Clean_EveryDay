import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../../core/context/AppContext';
import {
  LayoutDashboard,
  ShoppingBag,
  MessageSquare,
  PlusCircle,
  Image as ImageIcon,
  Users,
  Home,
  LogOut,
  FileText,
  Inbox,
  Menu,
  X,
  Search,
  ArrowRight
} from 'lucide-react';

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
  const pendingReviewsCount = reviews.filter((r) => !r.approved).length;
  const newLeadsCount = leads.filter((l) => l.status === 'New').length;
  const newOrdersCount = orders.filter((o) => o.status === 'Pending').length;

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
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.cat.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  const matchedOrders = query
    ? orders.filter(
        (o) =>
          o.id.toLowerCase().includes(query) ||
          o.customerEmail.toLowerCase().includes(query) ||
          o.status.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  const matchedLeads = query
    ? leads.filter(
        (l) =>
          l.name.toLowerCase().includes(query) ||
          l.email.toLowerCase().includes(query) ||
          l.service.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  const matchedStaff = query
    ? staff.filter(
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

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-92px)] bg-sur">
      
      {/* Mobile Top Header Bar (Sticky) */}
      <div className="lg:hidden w-full bg-blk text-wht px-6 py-4 flex items-center justify-between sticky top-[92px] z-30 border-b border-white/5 select-none no-print">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-[11px] text-wht font-semibold">C</div>
          <span className="font-display font-semibold text-[15px]">Clean CRM</span>
          <span className="text-[11px] text-primary bg-primary-soft/10 px-2.5 py-0.5 rounded-full font-medium border border-primary/20 capitalize">
            {activeTab}
          </span>
        </div>
        <button
          className="p-1 text-fnt hover:text-wht transition-colors cursor-pointer"
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          aria-label="Toggle Navigation Sidebar"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[240] lg:hidden no-print"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Persistent/Collapsible on Desktop, Drawer on Mobile */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[92px] left-0 bottom-0 lg:bottom-auto select-none transition-all duration-300 z-[250] lg:z-10 no-print flex flex-col bg-blk py-8 border-r border-white/5 shrink-0 h-full lg:h-[calc(100vh-92px)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 ${
          isMobileSidebarOpen
            ? 'translate-x-0 w-[270px]'
            : `-translate-x-full lg:translate-x-0 ${isSidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-[260px]'}`
        }`}
      >
        {/* Logo and Close Controls inside Drawer */}
        <div className="flex items-center justify-between px-6 mb-2 lg:mb-1">
          <div className="flex items-center gap-2.5 font-display text-[1.15rem] font-bold text-wht">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-[0.62rem] text-wht font-mono">C</div>
            {!isSidebarCollapsed && <span>Clean CRM</span>}
          </div>
          <button
            className="hidden lg:flex text-mut hover:text-wht p-1 cursor-pointer items-center justify-center hover:bg-white/5 rounded"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu size={16} />
          </button>
          <button 
            className="lg:hidden text-mut hover:text-wht p-1 cursor-pointer" 
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        {!isSidebarCollapsed && (
          <div className="text-[11px] font-medium text-white/40 px-6 py-2 pb-5 border-b border-white/5 mb-4">
            Administration
          </div>
        )}

        <nav className="flex flex-col gap-4 flex-1 mt-4">
          {(
            [
              {
                title: 'Overview',
                items: [
                  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14} /> }
                ]
              },
              {
                title: 'Catalog & Marketing',
                items: [
                  { id: 'products', label: 'Products Catalogue', icon: <ShoppingBag size={14} /> },
                  { id: 'add', label: 'Add Product', icon: <PlusCircle size={14} /> },
                  { id: 'banners', label: 'Hero Banners', icon: <ImageIcon size={14} /> }
                ]
              },
              {
                title: 'Operations & Sales',
                items: [
                  { id: 'orders', label: 'Orders Registry', icon: <FileText size={14} />, badge: newOrdersCount },
                  { id: 'leads', label: 'Leads CRM', icon: <Inbox size={14} />, badge: newLeadsCount },
                  { id: 'reviews', label: 'Reviews Moderation', icon: <MessageSquare size={14} />, badge: pendingReviewsCount }
                ]
              },
              {
                title: 'System Settings',
                items: [
                  { id: 'users', label: 'Staff Accounts', icon: <Users size={14} /> }
                ]
              }
            ] as { title: string; items: { id: TabName; label: string; icon: React.ReactNode; badge?: number }[] }[]
          ).map((sec) => (
            <div key={sec.title} className="flex flex-col gap-0.5">
              {!isSidebarCollapsed && (
                <div className="text-[11px] font-medium text-white/40 px-6 mb-1.5 mt-1 select-none">
                  {sec.title}
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                {sec.items.map((item) => (
                  <button
                    key={item.id}
                    title={isSidebarCollapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-6 py-2.5 text-[13px] font-medium text-white/60 hover:bg-white/5 hover:text-wht border-l-3 border-transparent transition-all duration-150 w-full text-left relative cursor-pointer ${
                      activeTab === item.id ? 'text-wht border-l-primary bg-white/5 font-semibold' : ''
                    } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                    onClick={() => handleTabChange(item.id as TabName)}
                  >
                    {item.icon}
                    {!isSidebarCollapsed && <span className="truncate pr-8">{item.label}</span>}
                    {!isSidebarCollapsed && !!item.badge && (
                      <span className="absolute right-5 text-[11px] font-semibold text-wht bg-primary px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                    {isSidebarCollapsed && !!item.badge && (
                      <span className="absolute top-1 right-3 text-[9px] font-semibold text-wht bg-primary w-4 h-4 rounded-full flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className={`px-6 pt-6 border-t border-white/5 flex flex-col gap-2 ${isSidebarCollapsed ? 'items-center px-0' : ''}`}>
          <button 
            className="flex items-center gap-2.5 text-[13px] font-medium text-white/60 hover:text-wht cursor-pointer bg-transparent border-none outline-none" 
            onClick={() => { window.location.href = 'http://localhost:5173/'; }}
            title={isSidebarCollapsed ? 'Webpage view' : undefined}
          >
            <Home size={14} />
            {!isSidebarCollapsed && <span>Webpage view</span>}
          </button>
          <button 
            className="flex items-center gap-2.5 text-[13px] font-medium text-red/80 hover:text-red cursor-pointer bg-transparent border-none outline-none" 
            onClick={() => { logoutUser(); setIsMobileSidebarOpen(false); }}
            title={isSidebarCollapsed ? 'Sign Out' : undefined}
          >
            <LogOut size={14} />
            {!isSidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main CRM workspace content (Independent scroll) */}
      <main 
        id="crm-workspace-main"
        className="flex-1 p-6 sm:p-10 overflow-y-auto w-full"
      >
        {/* Workspace Quick Header Bar */}
        <div className="flex items-center justify-between border-b border-bdrl pb-4 mb-6 select-none no-print">
          <div className="flex items-center gap-2 text-xs font-semibold text-mut">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-blk capitalize">{activeTab}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPaletteOpen(true)}
              className="flex items-center gap-2 border border-bdr hover:border-mut rounded-md px-3 py-1.5 text-xs text-mut bg-wht cursor-pointer shadow-premium-sm transition-all duration-150"
              title="Search workspace (Ctrl + K)"
            >
              <Search size={13} />
              <span>Search workspace...</span>
              <kbd className="bg-sur border border-bdr rounded px-1.5 py-0.5 text-[9px] font-mono select-none">Ctrl K</kbd>
            </button>
          </div>
        </div>

        {renderActiveTabContent()}
      </main>

      {/* Global Command Palette Overlay Dialog */}
      {isPaletteOpen && (
        <div className="fixed inset-0 bg-blk/40 backdrop-blur-xs z-[300] flex items-start justify-center pt-[15vh] px-4 no-print animate-fadeIn">
          <div 
            className="fixed inset-0" 
            onClick={() => setIsPaletteOpen(false)}
          />
          <div className="bg-wht border border-bdr rounded-lg shadow-premium-xl w-full max-w-[640px] flex flex-col overflow-hidden max-h-[70vh] relative z-10 animate-slideUp">
            {/* Search Input field */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-bdrl bg-sur">
              <Search size={16} className="text-mut" />
              <input
                ref={paletteInputRef}
                type="text"
                placeholder="Search products, orders, leads, or staff..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-blk placeholder:text-mut"
                value={paletteSearch}
                onChange={(e) => setPaletteSearch(e.target.value)}
              />
              <button 
                onClick={() => setIsPaletteOpen(false)}
                className="text-xs font-semibold text-mut hover:text-blk cursor-pointer border border-bdr rounded-md px-2 py-0.5 bg-wht"
              >
                Esc
              </button>
            </div>

            {/* Results Content */}
            <div className="overflow-y-auto p-4 flex-1">
              {!query ? (
                <div>
                  <h4 className="text-xs font-semibold text-mut mb-3 uppercase tracking-wider">Quick navigation</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'dashboard', label: 'Dashboard Overview', tab: 'dashboard' },
                      { id: 'products', label: 'Products Catalogue', tab: 'products' },
                      { id: 'orders', label: 'Orders Registry', tab: 'orders' },
                      { id: 'leads', label: 'Leads CRM Log', tab: 'leads' }
                    ].map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          setActiveTab(n.tab as TabName);
                          setIsPaletteOpen(false);
                        }}
                        className="flex items-center justify-between p-3 rounded border border-bdr hover:border-primary hover:bg-primary-soft text-left text-xs font-semibold text-blk cursor-pointer transition-all duration-150"
                      >
                        <span>{n.label}</span>
                        <ArrowRight size={12} className="text-mut" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : !hasMatches ? (
                <div className="text-center py-8 text-sm text-mut">
                  No matching workspace results found for &ldquo;{paletteSearch}&rdquo;
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Products */}
                  {matchedProducts.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-mut mb-2 uppercase tracking-wider">Products Catalogue</h4>
                      <div className="flex flex-col gap-1">
                        {matchedProducts.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => handlePaletteSelect('products', p.sku)}
                            className="flex justify-between items-center p-2.5 rounded hover:bg-sur border border-transparent hover:border-bdrl text-left text-xs text-blk cursor-pointer transition-all"
                          >
                            <div>
                              <span className="font-semibold block">{p.name}</span>
                              <span className="text-mut text-[10px]">SKU: {p.sku} | Category: {p.cat}</span>
                            </div>
                            <span className="text-[10px] font-semibold text-primary px-2 py-0.5 rounded bg-primary-soft">
                              View catalogue
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Orders */}
                  {matchedOrders.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-mut mb-2 uppercase tracking-wider">Orders Registry</h4>
                      <div className="flex flex-col gap-1">
                        {matchedOrders.map((o) => (
                          <button
                            key={o.id}
                            onClick={() => handlePaletteSelect('orders', o.id)}
                            className="flex justify-between items-center p-2.5 rounded hover:bg-sur border border-transparent hover:border-bdrl text-left text-xs text-blk cursor-pointer transition-all"
                          >
                            <div>
                              <span className="font-semibold block">{o.id}</span>
                              <span className="text-mut text-[10px]">{o.customerEmail} | Status: {o.status}</span>
                            </div>
                            <span className="text-[10px] font-semibold text-primary px-2 py-0.5 rounded bg-primary-soft">
                              View registry
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Leads */}
                  {matchedLeads.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-mut mb-2 uppercase tracking-wider">Leads CRM</h4>
                      <div className="flex flex-col gap-1">
                        {matchedLeads.map((l) => (
                          <button
                            key={l.id}
                            onClick={() => handlePaletteSelect('leads', l.name)}
                            className="flex justify-between items-center p-2.5 rounded hover:bg-sur border border-transparent hover:border-bdrl text-left text-xs text-blk cursor-pointer transition-all"
                          >
                            <div>
                              <span className="font-semibold block">{l.name}</span>
                              <span className="text-mut text-[10px]">{l.email} | Service: {l.service}</span>
                            </div>
                            <span className="text-[10px] font-semibold text-primary px-2 py-0.5 rounded bg-primary-soft">
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
                      <h4 className="text-xs font-semibold text-mut mb-2 uppercase tracking-wider">Staff Accounts</h4>
                      <div className="flex flex-col gap-1">
                        {matchedStaff.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => handlePaletteSelect('users', s.name)}
                            className="flex justify-between items-center p-2.5 rounded hover:bg-sur border border-transparent hover:border-bdrl text-left text-xs text-blk cursor-pointer transition-all"
                          >
                            <div>
                              <span className="font-semibold block">{s.name}</span>
                              <span className="text-mut text-[10px]">{s.email} | Role: {s.role}</span>
                            </div>
                            <span className="text-[10px] font-semibold text-primary px-2 py-0.5 rounded bg-primary-soft">
                              View profile
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer hints */}
            <div className="px-4 py-2 border-t border-bdrl bg-sur flex items-center justify-between text-[10px] text-mut select-none">
              <span>Use Ctrl+K to toggle anywhere in clean CRM</span>
              <span>Clean Everyday Admin Platform</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPanel;
