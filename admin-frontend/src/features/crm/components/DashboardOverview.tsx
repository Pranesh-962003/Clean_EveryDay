import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useApp } from '../../../core/context/AppContext';
// @ts-ignore
import { auth } from '../../../../firebase';
import { getSocket } from '../../../core/socket/socket';
import { SOCKET_EVENTS } from '../../../core/socket/socketEvents';
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

const STORAGE_CACHE_KEY = 'ce_admin_dashboard_cache';

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onTabChange }) => {
  const { orders, products, leads, reviews } = useApp();

  // Instant SWR cache initialization for low network & fast load
  const [apiDashboardData, setApiDashboardData] = useState<any>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(() => {
    try {
      const socket = getSocket();
      return socket?.connected || false;
    } catch {
      return false;
    }
  });

  const isMountedRef = useRef<boolean>(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    const fetchDashboard = async () => {
      try {
        const firebaseUser = auth.currentUser;
        let token = '';
        if (firebaseUser) {
          token = await firebaseUser.getIdToken();
        }
        const backendUrl = import.meta.env.VITE_BACKEND_URI || 'http://localhost:5002/api';
        const response = await axios.get(`${backendUrl}/auth/admin/dashboard`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
          timeout: 10000
        });

        if (isMountedRef.current && response.data && response.data.success) {
          setApiDashboardData(response.data);
          try {
            localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(response.data));
          } catch (e) {
            console.warn('Cache write note:', e);
          }
        }
      } catch (err) {
        console.warn('Admin dashboard API note (using cache/context fallback):', err);
      }
    };

    // Debounced fetch to avoid multi-trigger lag when rapid events occur
    const debouncedFetch = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          fetchDashboard();
        }
      }, 300);
    };

    // Initial fetch on mount
    fetchDashboard();

    // Background interval sync every 30 seconds for resiliency in poor networks
    const intervalId = setInterval(() => {
      if (isMountedRef.current && document.visibilityState === 'visible') {
        fetchDashboard();
      }
    }, 30000);

    const socket = getSocket();

    const handleConnect = () => {
      if (isMountedRef.current) {
        setIsSocketConnected(true);
        debouncedFetch();
      }
    };

    const handleDisconnect = () => {
      if (isMountedRef.current) {
        setIsSocketConnected(false);
      }
    };

    const handleSyncEvent = () => {
      if (isMountedRef.current) {
        debouncedFetch();
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Subscribe to all entity update events (both mapped constants and raw event strings)
    const socketEventsList = Array.from(new Set([
      SOCKET_EVENTS.ORDER_CREATED,
      SOCKET_EVENTS.ORDER_STATUS_UPDATED,
      SOCKET_EVENTS.ORDER_CANCELLED,
      SOCKET_EVENTS.PRODUCT_CREATED,
      SOCKET_EVENTS.PRODUCT_UPDATED,
      SOCKET_EVENTS.PRODUCT_DELETED,
      SOCKET_EVENTS.INVENTORY_UPDATED,
      SOCKET_EVENTS.REVIEW_CREATED,
      SOCKET_EVENTS.REVIEW_STATUS_UPDATED,
      SOCKET_EVENTS.REVIEW_UPDATED,
      SOCKET_EVENTS.REVIEW_DELETED,
      SOCKET_EVENTS.LEAD_CREATED,
      SOCKET_EVENTS.LEAD_UPDATED,
      SOCKET_EVENTS.LEAD_ACTIVITY_ADDED,
      SOCKET_EVENTS.LEAD_TASK_UPDATED,
      SOCKET_EVENTS.LEAD_REMINDER_ADDED,
      SOCKET_EVENTS.USER_UPDATED,
      SOCKET_EVENTS.BANNERS_UPDATED,
      'order:created',
      'order:statusUpdated',
      'order:cancelled',
      'product:created',
      'product:updated',
      'product:deleted',
      'inventory:updated',
      'review:created',
      'review:statusUpdated',
      'review:updated',
      'review:deleted',
      'lead:created',
      'lead:updated',
      'lead:activityAdded',
      'lead:taskUpdated',
      'lead:reminderAdded',
      'user:updated',
      'banners:updated'
    ].filter(Boolean)));

    socketEventsList.forEach((evt) => {
      socket.on(evt, handleSyncEvent);
    });

    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      clearInterval(intervalId);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);

      socketEventsList.forEach((evt) => {
        if (evt) socket.off(evt, handleSyncEvent);
      });
    };
  }, []);

  const stats = apiDashboardData?.stats;

  // Metrics calculations
  const totalRevenue = stats ? stats.grossRevenue : orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = stats ? stats.totalOrders : orders.length;
  
  // Helper to parse order timestamps safely
  const parseOrderTime = (o: any): number => {
    if (o?.createdAt) {
      const t = new Date(o.createdAt).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    if (o?._id && typeof o._id === 'string' && o._id.length >= 8) {
      const hex = o._id.substring(0, 8);
      const ts = parseInt(hex, 16);
      if (!isNaN(ts) && ts > 0) return ts * 1000;
    }
    if (o?.date) {
      const parts = String(o.date).split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) return d.getTime();
      }
      const t = new Date(o.date).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    return 0;
  };

  // Gross revenue growth calculation from backend stats or context fallback
  const rawGrowth = stats?.grossRevenueGrowth !== undefined ? stats.grossRevenueGrowth : (() => {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const fourteenDays = 14 * 24 * 60 * 60 * 1000;

    const currRev = orders
      .filter((o) => {
        const t = parseOrderTime(o);
        return t > 0 && t >= now - sevenDays && o.status !== 'Cancelled' && o.status !== 'Returned' && o.status !== 'Refunded';
      })
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const prevRev = orders
      .filter((o) => {
        const t = parseOrderTime(o);
        return t > 0 && t >= now - fourteenDays && t < now - sevenDays && o.status !== 'Cancelled' && o.status !== 'Returned' && o.status !== 'Refunded';
      })
      .reduce((sum, o) => sum + (o.total || 0), 0);

    if (prevRev > 0) {
      return Number((((currRev - prevRev) / prevRev) * 100).toFixed(1));
    }
    return currRev > 0 ? 100.0 : 0.0;
  })();

  const isGrowthPositive = rawGrowth >= 0;
  const growthText = `${isGrowthPositive ? '+' : ''}${Number(rawGrowth).toFixed(1)}%`;

  // Workflow statuses in Order
  const pendingOrders = stats ? stats.pendingOrders : orders.filter(
    (o) => o.status !== 'Delivered' && o.status !== 'Cancelled' && o.status !== 'Returned' && o.status !== 'Refunded'
  ).length;

  const deliveredOrders = stats ? stats.deliveredOrders : orders.filter((o) => o.status === 'Delivered').length;
  const totalProducts = stats ? stats.totalProducts : products.length;
  const totalLeads = stats ? stats.activeLeads : leads.length;
  const totalReviews = stats ? stats.totalReviews : reviews.length;
  const pendingReviews = stats ? stats.pendingReviews : reviews.filter((r) => !r.approved).length;

  // Low stock products alert (stock <= 5)
  const lowStockCount = stats ? stats.lowStockAlerts : products.filter((p) => p.stock <= 5).length;

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

  // Derived recent lists from API or fallback to context state
  const recentOrdersList = apiDashboardData?.recentOrders?.length
    ? apiDashboardData.recentOrders.map((o: any) => ({
        id: o.orderNumber || o._id,
        name: o.customer ? `${o.customer.firstName || ''} ${o.customer.lastName || ''}`.trim() : (o.billingAddress?.fullName || 'Customer'),
        date: new Date(o.createdAt).toLocaleDateString('en-IN'),
        total: o.grandTotal || 0,
        status: o.status || 'Pending'
      }))
    : orders.slice(0, 5).map((o) => ({
        id: o.id,
        name: o.address?.name || 'Customer',
        date: o.date,
        total: o.total,
        status: o.status
      }));

  const recentLeadsList = apiDashboardData?.recentLeads?.length
    ? apiDashboardData.recentLeads.map((l: any) => ({
        id: l._id,
        subject: l.subject || 'Inquiry',
        name: l.fullName || l.name || 'Lead',
        email: l.email || '',
        service: l.service || 'General',
        status: l.status || 'New'
      }))
    : leads.slice(0, 5);

  const recentCustomersList = apiDashboardData?.recentCustomers?.length
    ? apiDashboardData.recentCustomers.map((c: any) => ({
        name: c.customer ? `${c.customer.firstName || ''} ${c.customer.lastName || ''}`.trim() : (c.billingAddress?.fullName || 'Customer'),
        email: c.customer?.email || 'No email',
        city: c.shippingAddress?.city || c.billingAddress?.city || 'India'
      }))
    : orders.slice(0, 4).map((o) => ({
        name: o.address?.name || 'Customer',
        email: o.customerEmail || 'No email',
        city: o.address?.city || 'India'
      }));

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Executive Overview</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            <span className="text-xs text-slate-400">Store Performance & Inquiries</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 font-display">
            Operational Command Center
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white shadow-xs text-xs font-mono text-slate-600">
            <span className="relative flex h-2 w-2">
              {isSocketConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isSocketConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="text-slate-500 font-sans text-xs">Socket:</span>
            <span className={`font-semibold ${isSocketConnected ? 'text-slate-900' : 'text-amber-600'}`}>
              {isSocketConnected ? 'Live Sync' : 'Reconnecting...'}
            </span>
          </div>
          <button
            onClick={() => onTabChange('add')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-950 text-white hover:bg-slate-800 text-xs font-medium tracking-wide shadow-xs transition-colors min-h-[38px] cursor-pointer"
          >
            <PlusCircle size={15} />
            <span>Create Product</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="group bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Gross Revenue</p>
              <h3 className="text-2xl font-bold text-slate-950 mt-1.5 tracking-tight font-display">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700">
              <IndianRupee size={16} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className={`inline-flex items-center gap-1 font-semibold ${isGrowthPositive ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded' : 'text-rose-700 bg-rose-50 px-2 py-0.5 rounded'}`}>
              <TrendingUp size={12} className={isGrowthPositive ? '' : 'rotate-180'} />
              {growthText}
            </span>
            <span className="text-slate-400">vs. last 7 days</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="group bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Orders Volume</p>
              <h3 className="text-2xl font-bold text-slate-950 mt-1.5 tracking-tight font-display">
                {totalOrders}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700">
              <ShoppingBag size={16} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              <strong className="text-slate-900 font-semibold">{deliveredOrders}</strong> delivered
            </span>
            <span className="inline-flex items-center gap-1 text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded">
              {pendingOrders} active
            </span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="group bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Inventory Health</p>
              <h3 className={`text-2xl font-bold mt-1.5 tracking-tight font-display ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-950'}`}>
                {lowStockCount}
              </h3>
            </div>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
              lowStockCount > 0 
                ? 'bg-rose-50 border-rose-200 text-rose-600' 
                : 'bg-slate-100 border-slate-200/80 text-slate-700'
            }`}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className={`font-medium ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
              {lowStockCount > 0 ? 'Urgent replenishment' : 'All SKUs optimal'}
            </span>
            <button onClick={() => onTabChange('products')} className="text-slate-700 hover:text-slate-950 font-semibold inline-flex items-center gap-0.5">
              Check <ArrowRight size={11} />
            </button>
          </div>
        </div>

        {/* Active CRM Leads */}
        <div className="group bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Pipeline</p>
              <h3 className="text-2xl font-bold text-slate-950 mt-1.5 tracking-tight font-display">
                {totalLeads}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700">
              <Inbox size={16} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 truncate">Web queries & quotes</span>
            <button onClick={() => onTabChange('leads')} className="text-slate-700 hover:text-slate-950 font-semibold inline-flex items-center gap-0.5">
              Pipeline <ArrowRight size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200/70 flex items-center justify-center text-slate-700">
              <ShoppingBag size={18} />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 block leading-tight">Live Products</span>
              <span className="text-lg font-bold text-slate-950 leading-none mt-1 block">{totalProducts} SKUs</span>
            </div>
          </div>
          <button 
            onClick={() => onTabChange('products')}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1"
          >
            Catalog <ArrowRight size={12} />
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200/70 flex items-center justify-center text-slate-700">
              <MessageSquare size={18} />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 block leading-tight">Customer Reviews</span>
              <span className="text-lg font-bold text-slate-950 leading-none mt-1 block">{totalReviews} Ratings</span>
            </div>
          </div>
          <button 
            onClick={() => onTabChange('reviews')}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1"
          >
            Moderation ({pendingReviews}) <ArrowRight size={12} />
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200/70 flex items-center justify-center text-slate-700">
              <Users size={18} />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 block leading-tight">Staff & Permissions</span>
              <span className="text-lg font-bold text-slate-950 leading-none mt-1 block">Role Admin</span>
            </div>
          </div>
          <button 
            onClick={() => onTabChange('users')}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1"
          >
            Directory <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        {/* Left Column: Recent Orders & Leads */}
        <div className="space-y-6">
          {/* Recent Orders Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">Recent Orders</h2>
                <p className="text-xs text-slate-500 mt-0.5">Latest transactions processed across all channels</p>
              </div>
              <button 
                onClick={() => onTabChange('orders')}
                className="text-xs font-semibold text-slate-700 hover:text-slate-950 inline-flex items-center gap-1"
              >
                View all <ArrowRight size={12} />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentOrdersList.length > 0 ? (
                recentOrdersList.map((order: any, idx: number) => {
                  const isDelivered = order.status === 'Delivered';
                  const isCancelled = order.status === 'Cancelled' || order.status === 'Returned' || order.status === 'Refunded';
                  return (
                    <div key={order.id || idx} className="p-4 flex items-center justify-between hover:bg-slate-50/75 transition-colors">
                      <div className="min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-slate-900">{order.id}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs font-medium text-slate-700 truncate">{order.name}</span>
                        </div>
                        <span className="text-xs text-slate-400 mt-0.5 block">{order.date}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-bold text-slate-950 font-price">₹{order.total.toLocaleString('en-IN')}</span>
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                          isDelivered
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isCancelled
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  No orders recorded yet.
                </div>
              )}
            </div>
          </div>

          {/* Recent Leads Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">Recent Inquiries & Quotes</h2>
                <p className="text-xs text-slate-500 mt-0.5">Prospects converted from storefront lead forms</p>
              </div>
              <button 
                onClick={() => onTabChange('leads')}
                className="text-xs font-semibold text-slate-700 hover:text-slate-950 inline-flex items-center gap-1"
              >
                View pipeline <ArrowRight size={12} />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentLeadsList.length > 0 ? (
                recentLeadsList.map((lead: any, idx: number) => {
                  const isWon = lead.status === 'Won';
                  const isNew = lead.status === 'New';
                  return (
                    <div key={lead.id || idx} className="p-4 flex items-center justify-between hover:bg-slate-50/75 transition-colors">
                      <div className="min-w-0 pr-4">
                        <span className="text-xs font-semibold text-slate-900 block truncate">{lead.subject}</span>
                        <span className="text-xs text-slate-500 mt-0.5 block truncate">{lead.name} {lead.email ? `• ${lead.email}` : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="hidden sm:inline-block text-[11px] font-medium bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded">
                          {lead.service}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                          isWon 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : isNew 
                            ? 'bg-rose-50 text-rose-800 border-rose-200' 
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {lead.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  No incoming leads logged.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Quick Operations & Recent Customers */}
        <div className="space-y-6">
          {/* Quick Operations Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight mb-1">Administrative Shortcuts</h2>
            <p className="text-xs text-slate-500 mb-4 pb-3 border-b border-slate-100">Direct operational routines and bulk data exports</p>
            
            <div className="space-y-2.5">
              <button 
                onClick={() => onTabChange('add')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-left group min-h-[44px] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    <PlusCircle size={15} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block group-hover:text-black">Add New Product</span>
                    <span className="text-[11px] text-slate-500 block">Create item with pricing, images & specs</span>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button 
                onClick={() => onTabChange('users')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-left group min-h-[44px] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    <UserPlus size={15} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block group-hover:text-black">Manage Staff</span>
                    <span className="text-[11px] text-slate-500 block">Invite managers or assign privileges</span>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button 
                onClick={() => exportCSV(products, 'products_catalog.csv')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-left group min-h-[44px] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    <FileDown size={15} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block group-hover:text-black">Export Products CSV</span>
                    <span className="text-[11px] text-slate-500 block">Download active stock & pricing registry</span>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button 
                onClick={() => exportCSV(leads, 'leads_crm.csv')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-left group min-h-[44px] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    <FileDown size={15} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block group-hover:text-black">Export Leads CSV</span>
                    <span className="text-[11px] text-slate-500 block">Archive CRM prospect history</span>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          {/* Recent Customers Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight mb-1">Recent Customers</h2>
            <p className="text-xs text-slate-500 mb-4 pb-3 border-b border-slate-100">Direct buyers from store checkout</p>
            
            <div className="divide-y divide-slate-100">
              {recentCustomersList.length > 0 ? (
                recentCustomersList.map((cust: any, idx: number) => {
                  const name = cust.name || 'Customer';
                  const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().substring(0, 2) || 'C';
                  return (
                    <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-semibold text-xs flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-slate-900 block truncate">{name}</span>
                          <span className="text-[11px] text-slate-400 block truncate">{cust.email || 'No email'}</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                        {cust.city}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-slate-500">
                  No customer records available.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
