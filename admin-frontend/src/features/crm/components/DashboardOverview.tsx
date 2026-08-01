import React from 'react';
import { useApp } from '../../../core/context/AppContext';
import { 
  TrendingUp, 
  IndianRupee, 
  ShoppingBag, 
  Inbox, 
  Users, 
  MessageSquare, 
  AlertTriangle,
  PlusCircle,
  FileDown,
  UserPlus,
  ArrowRight
} from 'lucide-react';

interface DashboardOverviewProps {
  onTabChange: (tab: 'dashboard' | 'products' | 'orders' | 'reviews' | 'add' | 'banners' | 'leads' | 'users') => void;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onTabChange }) => {
  const { orders, products, leads, reviews } = useApp();

  // Metrics calculations
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = orders.length;
  
  // Workflow statuses in Order
  const pendingOrders = orders.filter(
    (o) => o.status !== 'Delivered' && o.status !== 'Cancelled' && o.status !== 'Returned' && o.status !== 'Refunded'
  ).length;

  const deliveredOrders = orders.filter((o) => o.status === 'Delivered').length;
  const totalProducts = products.length;
  const totalLeads = leads.length;
  const totalReviews = reviews.length;
  const pendingReviews = reviews.filter((r) => !r.approved).length;

  // Low stock products alert (stock <= 5)
  const lowStockProducts = products.filter((p) => p.stock <= 5);
  const lowStockCount = lowStockProducts.length;

  // Helper: Export to CSV
  const exportCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((item) =>
      Object.values(item)
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fadeIn">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <h2 className="font-display text-3xl font-bold text-blk tracking-tight">Enterprise overview</h2>
          <p className="text-[0.78rem] text-mut mt-0.5">Live store conversions and inquiry dashboard metrics.</p>
        </div>
        <div className="text-[0.72rem] font-mono bg-wht border border-bdr rounded-md px-3 py-1.5 text-mid w-fit">
          Server status: <span className="text-primary font-bold">Online</span>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Gross Revenue */}
        <div className="bg-wht border border-bdrl rounded-xl p-5 shadow-premium-sm flex flex-col justify-between hover:shadow-premium-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-mut font-medium">Gross revenue</span>
              <h3 className="font-display text-[1.5rem] font-semibold text-blk mt-1">₹{totalRevenue.toLocaleString('en-IN')}</h3>
            </div>
            <div className="w-8 h-8 rounded bg-primary-soft flex items-center justify-center text-primary"><IndianRupee size={15} /></div>
          </div>
          <div className="flex items-center gap-1 text-[0.74rem] text-primary mt-4 font-medium">
            <TrendingUp size={12} />
            <span>+12.4% vs last week</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-wht border border-bdrl rounded-xl p-5 shadow-premium-sm flex flex-col justify-between hover:shadow-premium-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-mut font-medium">Total orders</span>
              <h3 className="font-display text-[1.5rem] font-semibold text-blk mt-1">{totalOrders}</h3>
            </div>
            <div className="w-8 h-8 rounded bg-primary-soft flex items-center justify-center text-primary"><ShoppingBag size={15} /></div>
          </div>
          <div className="flex items-center justify-between text-[0.74rem] text-mut mt-4 font-medium">
            <span>Delivered: {deliveredOrders}</span>
            <span className="text-accent">Pending: {pendingOrders}</span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-wht border border-bdrl rounded-xl p-5 shadow-premium-sm flex flex-col justify-between hover:shadow-premium-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-mut font-medium">Low stock alerts</span>
              <h3 className={`font-display text-[1.5rem] font-semibold mt-1 ${lowStockCount > 0 ? 'text-red' : 'text-blk'}`}>{lowStockCount}</h3>
            </div>
            <div className={`w-8 h-8 rounded flex items-center justify-center ${lowStockCount > 0 ? 'bg-red-bg text-red' : 'bg-primary-soft text-primary'}`}>
              <AlertTriangle size={15} />
            </div>
          </div>
          <span className="text-[0.72rem] text-mut block mt-4 font-medium truncate">
            {lowStockCount > 0 ? 'Urgent restocking needed' : 'All stock levels healthy'}
          </span>
        </div>

        {/* Leads */}
        <div className="bg-wht border border-bdrl rounded-xl p-5 shadow-premium-sm flex flex-col justify-between hover:shadow-premium-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-mut font-medium">Active leads</span>
              <h3 className="font-display text-[1.5rem] font-semibold text-blk mt-1">{totalLeads}</h3>
            </div>
            <div className="w-8 h-8 rounded bg-primary-soft flex items-center justify-center text-primary"><Inbox size={15} /></div>
          </div>
          <span className="text-[0.74rem] text-mut mt-4 font-medium">
            From web contacts and custom quotes
          </span>
        </div>
      </div>

      {/* Metrics Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-wht border border-bdrl rounded-xl p-4 shadow-premium-sm flex items-center justify-between hover:shadow-premium-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-primary-soft flex items-center justify-center text-primary"><ShoppingBag size={16} /></div>
            <div>
              <span className="text-xs text-mut font-medium block leading-none mb-1">Products</span>
              <span className="text-lg font-semibold text-blk leading-none">{totalProducts}</span>
            </div>
          </div>
          <button onClick={() => onTabChange('products')} className="text-xs text-primary hover:text-primary-hover flex items-center gap-0.5 font-semibold">
            View <ArrowRight size={12} />
          </button>
        </div>

        <div className="bg-wht border border-bdrl rounded-xl p-4 shadow-premium-sm flex items-center justify-between hover:shadow-premium-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-primary-soft flex items-center justify-center text-primary"><MessageSquare size={16} /></div>
            <div>
              <span className="text-xs text-mut font-medium block leading-none mb-1">Reviews</span>
              <span className="text-lg font-semibold text-blk leading-none">{totalReviews}</span>
            </div>
          </div>
          <button onClick={() => onTabChange('reviews')} className="text-xs text-primary hover:text-primary-hover flex items-center gap-0.5 font-semibold">
            Mod ({pendingReviews}) <ArrowRight size={12} />
          </button>
        </div>

        <div className="bg-wht border border-bdrl rounded-xl p-4 shadow-premium-sm flex items-center justify-between hover:shadow-premium-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-primary-soft flex items-center justify-center text-primary"><Users size={16} /></div>
            <div>
              <span className="text-xs text-mut font-medium block leading-none mb-1">Staff access</span>
              <span className="text-lg font-semibold text-blk leading-none">Admin</span>
            </div>
          </div>
          <button onClick={() => onTabChange('users')} className="text-xs text-primary hover:text-primary-hover flex items-center gap-0.5 font-semibold">
            Manage <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Main Workspace Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 mb-8">
        
        {/* Left Side: Recent Lists (Orders & Leads) */}
        <div className="flex flex-col gap-6">
          {/* Recent Orders */}
          <div className="bg-wht border border-bdrl rounded-xl p-6 shadow-premium-sm">
            <div className="flex justify-between items-center border-b border-bdrl pb-3 mb-4">
              <h4 className="text-xs font-semibold text-mut">Recent orders placed</h4>
              <button onClick={() => onTabChange('orders')} className="text-xs text-primary font-semibold hover:underline">View registry</button>
            </div>
            <div className="flex flex-col divide-y divide-bdrl max-h-[300px] overflow-y-auto pr-1">
              {orders.length > 0 ? (
                orders.slice(0, 5).map((order) => (
                  <div className="flex items-center justify-between py-3 first:pt-0" key={order.id}>
                    <div>
                      <span className="font-semibold text-xs">{order.id}</span>
                      <span className="text-xs text-mut block">{order.address?.name} • {order.date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-blk">₹{order.total}</span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        order.status === 'Delivered'
                          ? 'bg-primary-soft text-primary'
                          : order.status === 'Cancelled' || order.status === 'Returned'
                          ? 'bg-red-bg text-red'
                          : 'bg-yellow-50 text-amber-700'
                      }`}>{order.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-[0.8rem] text-mut">No orders completed yet.</div>
              )}
            </div>
          </div>

          {/* Recent Leads */}
          <div className="bg-wht border border-bdrl rounded-xl p-6 shadow-premium-sm">
            <div className="flex justify-between items-center border-b border-bdrl pb-3 mb-4">
              <h4 className="text-xs font-semibold text-mut">Recent leads and inquiries</h4>
              <button onClick={() => onTabChange('leads')} className="text-xs text-primary font-semibold hover:underline">View CRM pipeline</button>
            </div>
            <div className="flex flex-col divide-y divide-bdrl max-h-[300px] overflow-y-auto pr-1">
              {leads.length > 0 ? (
                leads.slice(0, 5).map((lead) => (
                  <div className="flex items-center justify-between py-3 first:pt-0" key={lead.id}>
                    <div>
                      <span className="text-xs font-semibold text-blk block">{lead.subject}</span>
                      <span className="text-xs text-mut block">{lead.name} • {lead.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-sur border border-bdrl px-2 py-0.5 rounded text-mid">{lead.service}</span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        lead.status === 'New'
                          ? 'bg-red-bg text-red'
                          : lead.status === 'Won'
                          ? 'bg-primary-soft text-primary'
                          : 'bg-yellow-50 text-amber-700'
                      }`}>{lead.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-[0.8rem] text-mut">No leads found.</div>
              )}
            </div>
          </div>
        </div>
 
        {/* Right Side: Quick Actions & Recent Customers */}
        <div className="flex flex-col gap-6">
          {/* Quick Actions */}
          <div className="bg-wht border border-bdrl rounded-xl p-6 shadow-premium-sm">
            <h4 className="text-xs font-semibold text-mut border-b border-bdrl pb-3 mb-4">Quick CRM operations</h4>
            <div className="flex flex-col gap-2.5">
              <button 
                onClick={() => onTabChange('add')}
                className="flex items-center justify-between w-full p-3 rounded-md border border-bdr bg-sur hover:bg-primary-soft hover:border-primary/30 transition-all group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary-soft text-primary flex items-center justify-center"><PlusCircle size={15} /></div>
                  <div>
                    <span className="text-sm font-semibold text-blk block group-hover:text-primary-hover transition-colors">Add new product</span>
                    <span className="text-xs text-mut block">Enter details to catalogue</span>
                  </div>
                </div>
                <ArrowRight size={14} className="text-mut group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={() => onTabChange('users')}
                className="flex items-center justify-between w-full p-3 rounded-md border border-bdr bg-sur hover:bg-primary-soft hover:border-primary/30 transition-all group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary-soft text-primary flex items-center justify-center"><UserPlus size={15} /></div>
                  <div>
                    <span className="text-sm font-semibold text-blk block group-hover:text-primary-hover transition-colors">Invite staff member</span>
                    <span className="text-xs text-mut block">Set roles and permissions</span>
                  </div>
                </div>
                <ArrowRight size={14} className="text-mut group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={() => exportCSV(products, 'products_catalog.csv')}
                className="flex items-center justify-between w-full p-3 rounded-md border border-bdr bg-sur hover:bg-primary-soft hover:border-primary/30 transition-all group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary-soft text-primary flex items-center justify-center"><FileDown size={15} /></div>
                  <div>
                    <span className="text-sm font-semibold text-blk block group-hover:text-primary-hover transition-colors">Export catalogue</span>
                    <span className="text-xs text-mut block">Download inventory details</span>
                  </div>
                </div>
                <ArrowRight size={14} className="text-mut group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={() => exportCSV(leads, 'leads_crm.csv')}
                className="flex items-center justify-between w-full p-3 rounded-md border border-bdr bg-sur hover:bg-primary-soft hover:border-primary/30 transition-all group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary-soft text-primary flex items-center justify-center"><FileDown size={15} /></div>
                  <div>
                    <span className="text-sm font-semibold text-blk block group-hover:text-primary-hover transition-colors">Export CRM leads</span>
                    <span className="text-xs text-mut block">Backup customer inquiries</span>
                  </div>
                </div>
                <ArrowRight size={14} className="text-mut group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Recent Customers */}
          <div className="bg-wht border border-bdrl rounded-xl p-6 shadow-premium-sm">
            <h4 className="text-xs font-semibold text-mut border-b border-bdrl pb-3 mb-4">Recent customers</h4>
            <div className="flex flex-col divide-y divide-bdrl max-h-[220px] overflow-y-auto pr-1">
              {orders.length > 0 ? (
                orders.slice(0, 4).map((order, idx) => {
                  const name = order.address?.name || 'Customer';
                  const initials = name.split(' ').map((w) => w[0]).join('').toUpperCase().substring(0, 2);
                  return (
                    <div className="flex items-center justify-between py-2.5 first:pt-0" key={idx}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary-soft border border-primary-light/50 flex items-center justify-center font-semibold text-xs text-primary shrink-0">
                          {initials}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-blk block">{name}</span>
                          <span className="text-xs text-mut block">{order.customerEmail || 'No email'}</span>
                        </div>
                      </div>
                      <span className="text-xs text-mut">{order.address?.city}</span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-[0.8rem] text-mut">No orders created yet.</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardOverview;
