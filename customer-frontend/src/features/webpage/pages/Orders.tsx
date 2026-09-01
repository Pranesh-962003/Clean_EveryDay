import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  MapPin,
  Truck,
  Printer,
  ArrowLeft,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw,
  ShoppingBag,
  ChevronRight,
  CheckSquare,
  Search,
  SlidersHorizontal,
  X,
  AlertTriangle,
  Undo,
  Info,
  Check,
  Loader2,
  MessageSquare,
  User as UserIcon,
  Home
} from 'lucide-react';
import type { Order } from '../../../core/types';
import { useApp } from '../../../core/context/AppContext';

/* ─── Confetti Particle ─── */
const ConfettiParticle: React.FC<{ index: number }> = ({ index }) => {
  const colors = ['#287850', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#f97316', '#06b6d4', '#84cc16', '#ef4444'];
  const color = colors[index % colors.length];
  const left = `${(index * 9.3 + 5) % 95}%`;
  const delay = `${(index * 0.18) % 1.4}s`;
  const duration = `${1.4 + (index * 0.15) % 0.8}s`;
  const size = 6 + (index % 4);
  return (
    <div style={{ position: 'fixed', left, top: '-20px', width: size, height: size, borderRadius: index % 3 === 0 ? '50%' : '2px', background: color, animation: `confettiFall ${duration} ${delay} ease-in forwards`, transform: `rotate(${index * 37}deg)`, zIndex: 9998, pointerEvents: 'none' }} />
  );
};

/* ─── Order Success Overlay ─── */
const OrderSuccessOverlay: React.FC<{
  method: string;
  total: number;
  onDismiss: () => void;
}> = ({ method, total, onDismiss }) => {
  const [countdown, setCountdown] = useState(6);

  useEffect(() => {
    const t = setInterval(() => setCountdown(c => {
      if (c <= 1) { clearInterval(t); onDismiss(); return 0; }
      return c - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-5 bg-blk/60 backdrop-blur-md">
      {Array.from({ length: 18 }).map((_, i) => <ConfettiParticle key={i} index={i} />)}
      <div className="bg-wht rounded-2xl shadow-premium-xl max-w-[480px] w-full p-8 text-center animate-scaleIn relative overflow-hidden border border-bdr">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary/30 via-primary to-primary/30" />
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-primary-soft border-4 border-primary/10 flex items-center justify-center animate-pulseRing">
            <svg width="40" height="40" viewBox="0 0 60 60" fill="none">
              <circle cx="30" cy="30" r="28" stroke="var(--primary)" strokeWidth="3" opacity="0.15" />
              <path d="M17 30 L25 38 L43 22" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="animate-checkmarkDraw" fill="none" />
            </svg>
          </div>
        </div>
        <span className="badge-tag bg-primary-soft text-primary px-3 py-1 mb-4">Order Confirmed</span>
        <h2 className="font-display text-2xl font-bold text-blk mb-2">Order Confirmed! 🎉</h2>
        <p className="text-sm text-mut mb-6 leading-relaxed">
          Your order has been placed successfully. You will receive real-time updates as your eco-clean package gets processed and shipped.
        </p>
        <div className="grid grid-cols-2 gap-3.5 bg-sur/80 border border-bdrl rounded-xl p-4 mb-6 text-left">
          <div>
            <p className="text-[10px] font-bold text-mut uppercase tracking-wider mb-0.5">Amount Paid</p>
            <p className="text-sm font-bold text-blk font-mono">₹{total}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-mut uppercase tracking-wider mb-0.5">Payment Method</p>
            <p className="text-xs font-semibold text-mid">{method}</p>
          </div>
        </div>
        <button onClick={onDismiss} className="btn-primary w-full py-3.5">
          View My Orders <ChevronRight size={14} />
        </button>
        <p className="text-[11px] text-mut mt-3">Redirecting automatically in {countdown}s...</p>
      </div>
    </div>
  );
};

/* ─── Status Design System ─── */
const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.FC<any> }> = {
  Pending:             { color: 'text-amber-700',   bg: 'bg-amber-50/70',   border: 'border-amber-200/60',  icon: Clock },
  Confirmed:           { color: 'text-blue-700',    bg: 'bg-blue-50/70',    border: 'border-blue-200/60',   icon: CheckSquare },
  Packed:              { color: 'text-blue-700',    bg: 'bg-blue-50/70',    border: 'border-blue-200/60',   icon: Package },
  'Ready for Dispatch':{ color: 'text-indigo-700',  bg: 'bg-indigo-50/70',  border: 'border-indigo-200/60', icon: Package },
  Shipped:             { color: 'text-indigo-700',  bg: 'bg-indigo-50/70',  border: 'border-indigo-200/60', icon: Truck },
  'Out for Delivery':  { color: 'text-violet-700',  bg: 'bg-violet-50/70',  border: 'border-violet-200/60', icon: MapPin },
  Delivered:           { color: 'text-emerald-700', bg: 'bg-emerald-50/70', border: 'border-emerald-200/60',icon: CheckCircle },
  Cancelled:           { color: 'text-red-700',     bg: 'bg-red-50/70',     border: 'border-red-200/60',    icon: XCircle },
  'Return Requested':  { color: 'text-rose-700',    bg: 'bg-rose-50/70',    border: 'border-rose-200/60',   icon: RotateCcw },
  Returned:            { color: 'text-rose-700',    bg: 'bg-rose-50/70',    border: 'border-rose-200/60',   icon: RotateCcw },
  Refunded:            { color: 'text-rose-700',    bg: 'bg-rose-50/70',    border: 'border-rose-200/60',   icon: RotateCcw },
};

const getStatusConfig = (status: string) =>
  STATUS_CONFIG[status] || { color: 'text-mid', bg: 'bg-sur', border: 'border-bdr', icon: Package };



/* ─── Skeleton Loader Component ─── */
const SkeletonLoader = () => (
  <div className="flex flex-col gap-6 w-full animate-fadeIn">
    {[1, 2].map(i => (
      <div key={i} className="card p-6 flex flex-col gap-4 animate-pulse">
        <div className="flex justify-between items-center pb-4 border-b border-bdrl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sur shimmer-bg" />
            <div className="flex flex-col gap-2">
              <div className="h-3 w-24 bg-sur shimmer-bg rounded" />
              <div className="h-2 w-16 bg-sur shimmer-bg rounded" />
            </div>
          </div>
          <div className="h-6 w-20 bg-sur shimmer-bg rounded-full" />
        </div>
        <div className="flex gap-4 items-center">
          <div className="w-16 h-16 rounded bg-sur shimmer-bg animate-pulse" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-3 w-40 bg-sur shimmer-bg rounded" />
            <div className="h-2.5 w-64 bg-sur shimmer-bg rounded" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

/* ─── Main Redesigned Orders Page ─── */

/* ─── Timeline Events Generator ─── */
const getTimelineEvents = (order: any) => {
  if (order.timeline && order.timeline.length > 0) {
    return [...order.timeline].reverse(); // Newest first
  }

  const orderDate = new Date(order.date);
  const events = [];

  // Placed event
  events.push({
    status: 'Order Placed',
    date: orderDate.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    notes: 'Your order was successfully placed.'
  });

  // Confirmed event
  if (['Confirmed', 'Packed', 'Ready for Dispatch', 'Shipped', 'Out for Delivery', 'Delivered', 'Returned', 'Refunded'].includes(order.status)) {
    const confirmDate = new Date(orderDate);
    confirmDate.setMinutes(orderDate.getMinutes() + 15);
    events.push({
      status: 'Order Confirmed',
      date: confirmDate.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      notes: 'Clean Everyday approved and confirmed the receipt of payment.'
    });
  }

  // Packed event
  if (['Packed', 'Ready for Dispatch', 'Shipped', 'Out for Delivery', 'Delivered', 'Returned', 'Refunded'].includes(order.status)) {
    const packDate = new Date(orderDate);
    packDate.setHours(orderDate.getHours() + 12);
    events.push({
      status: 'Packed & Processed',
      date: packDate.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      notes: 'Your items have been carefully packaged and sealed.'
    });
  }

  // Dispatched/Ready event
  if (['Ready for Dispatch', 'Shipped', 'Out for Delivery', 'Delivered', 'Returned', 'Refunded'].includes(order.status)) {
    const readyDate = new Date(orderDate);
    readyDate.setHours(orderDate.getHours() + 18);
    events.push({
      status: 'Ready for Dispatch',
      date: readyDate.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      notes: 'Order transferred to logistics carrier hub.'
    });
  }

  // Shipped event
  if (['Shipped', 'Out for Delivery', 'Delivered', 'Returned', 'Refunded'].includes(order.status)) {
    const shipDate = new Date(orderDate);
    shipDate.setDate(orderDate.getDate() + 2);
    events.push({
      status: 'Shipped',
      date: shipDate.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      notes: `In transit via ${order.courierCompany || 'Delhivery Logistics'} (Tracking: ${order.trackingId || 'TRK92841029'}).`
    });
  }

  // Out for Delivery event
  if (['Out for Delivery', 'Delivered', 'Returned', 'Refunded'].includes(order.status)) {
    const outDate = new Date(orderDate);
    outDate.setDate(orderDate.getDate() + 4);
    outDate.setHours(9, 30, 0);
    events.push({
      status: 'Out for Delivery',
      date: outDate.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      notes: 'Our local delivery agent is out with your package.'
    });
  }

  // Delivered event
  if (['Delivered', 'Returned', 'Refunded'].includes(order.status)) {
    const delDate = new Date(orderDate);
    delDate.setDate(orderDate.getDate() + 4);
    delDate.setHours(14, 15, 0);
    events.push({
      status: 'Delivered',
      date: delDate.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      notes: 'Order successfully handed over to the customer.'
    });
  }

  // Cancelled event
  if (order.status === 'Cancelled') {
    const cancelDate = new Date(orderDate);
    cancelDate.setHours(orderDate.getHours() + 1);
    events.push({
      status: 'Order Cancelled',
      date: cancelDate.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      notes: 'Order cancelled by customer. Refund process initiated.'
    });
  }

  // Returned/Refunded event
  if (['Returned', 'Refunded'].includes(order.status)) {
    const retDate = new Date(orderDate);
    retDate.setDate(orderDate.getDate() + 5);
    events.push({
      status: order.status,
      date: retDate.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      notes: order.status === 'Returned' ? 'Item picked up by return shipment courier.' : 'Refund successfully issued to UPI account.'
    });
  }

  return events.reverse(); // Newest updates first!
};

const Orders: React.FC = () => {
  const { orders, setCurPage, setInvoiceOrder, addToCart, showToast, updateOrderStatus, cancelOrder, addOrderTimelineEvent, fetchMyOrders, curUser } = useApp();

  const [successOverlay, setSuccessOverlay] = useState<{ method: string; total: number } | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  
  // Cancellation Modal States
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancellationOtherText, setCancellationOtherText] = useState('');
  const [cancellationStatus, setCancellationStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [cancellationErrorMessage, setCancellationErrorMessage] = useState('');

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState<'All' | 'Progress' | 'Delivered' | 'Cancelled'>('All');
  const [dateFilter, setDateFilter] = useState<'30days' | '6months' | '2026' | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [isLoading, setIsLoading] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);

  useEffect(() => {
    if (fetchMyOrders) {
      fetchMyOrders();
    }
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem('ce_order_just_placed');
    if (raw) {
      try {
        const data = JSON.parse(raw);
        const age = Date.now() - (data.ts || 0);
        if (age < 30000) {
          setSuccessOverlay({ method: data.method, total: data.total });
        }
      } catch { /* ignore */ }
      sessionStorage.removeItem('ce_order_just_placed');
    }
  }, []);

  // Simulate short loading state on filters changes for clean UX
  useEffect(() => {
    setIsLoading(true);
    const t = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(t);
  }, [searchQuery, statusTab, dateFilter, sortBy]);

  // Handle re-ordering
  const handleReorder = (order: Order) => {
    const items = Array.isArray(order.items)
      ? order.items
      : typeof order.items === 'string'
      ? (() => { try { return JSON.parse(order.items); } catch { return []; } })()
      : [];

    if (items.length === 0) return;
    
    items.forEach((item: any) => {
      if (item.product) {
        addToCart(item.product, item.quantity);
      }
    });
    showToast("Formulations re-added to cart! Redirecting to checkout...");
    setCurPage('checkout');
    setActiveOrder(null);
  };

  // Open Cancel Modal
  const handleOpenCancelModal = (order: Order) => {
    setCancellingOrder(order);
    setCancellationReason('');
    setCancellationOtherText('');
    setCancellationStatus('idle');
    setCancellationErrorMessage('');
  };

  // Confirm cancellation action (with loader and success states)
  const handleConfirmCancellation = async () => {
    if (!cancellingOrder) return;
    if (!cancellationReason) {
      showToast("Please choose a reason for cancellation.");
      return;
    }

    setCancellationStatus('processing');
    const finalReason = cancellationReason === 'Other' ? cancellationOtherText : cancellationReason;

    try {
      const orderIdToCancel = cancellingOrder._id || cancellingOrder.id;
      const res = await cancelOrder(orderIdToCancel, finalReason);

      if (res && res.success) {
        addOrderTimelineEvent(cancellingOrder.id, 'Cancelled', `Cancelled by customer. Reason: ${finalReason}`);
        
        // Update local activeOrder state if open
        if (activeOrder && (activeOrder.id === cancellingOrder.id || activeOrder._id === cancellingOrder._id)) {
          setActiveOrder(prev => prev ? { ...prev, status: 'Cancelled' } : null);
        }

        setCancellationStatus('success');
      } else {
        setCancellationStatus('error');
        setCancellationErrorMessage(res?.message || "Unable to process cancellation request. Please try again later.");
      }
    } catch (err: any) {
      setCancellationStatus('error');
      setCancellationErrorMessage(err?.response?.data?.message || err?.message || "Unable to process cancellation request. Please try again later.");
    }
  };

  // Handle Return
  const handleReturnOrder = async (orderId: string, _id?: string) => {
    if (window.confirm("Are you sure you want to request a return for this order?")) {
      const targetId = _id || orderId;
      await updateOrderStatus(orderId, 'Returned', targetId);
      addOrderTimelineEvent(orderId, 'Returned', 'Return requested by customer');
      if (activeOrder && (activeOrder.id === orderId || activeOrder._id === _id)) {
        setActiveOrder(prev => prev ? { ...prev, status: 'Returned' } : null);
      }
    }
  };

  // Date filtering logic
  const matchDate = (orderDateStr: string) => {
    if (dateFilter === 'all') return true;
    const orderDate = new Date(orderDateStr);
    if (isNaN(orderDate.getTime())) return true;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - orderDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (dateFilter === '30days') return diffDays <= 30;
    if (dateFilter === '6months') return diffDays <= 180;
    if (dateFilter === '2026') return orderDate.getFullYear() === 2026;
    return true;
  };

  // Status mapping logic
  const matchStatus = (orderStatus: string) => {
    if (statusTab === 'All') return true;
    if (statusTab === 'Progress') {
      return ['Pending', 'Confirmed', 'Packed', 'Ready for Dispatch', 'Shipped', 'Out for Delivery'].includes(orderStatus);
    }
    if (statusTab === 'Delivered') {
      return orderStatus === 'Delivered';
    }
    if (statusTab === 'Cancelled') {
      return ['Cancelled', 'Return Requested', 'Returned', 'Refunded'].includes(orderStatus);
    }
    return true;
  };

  // Search logic
  const matchSearch = (order: Order) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchId = order.id.toLowerCase().includes(q);
    const items = Array.isArray(order.items)
      ? order.items
      : typeof order.items === 'string'
      ? (() => { try { return JSON.parse(order.items); } catch { return []; } })()
      : [];
    const matchProducts = items.some((i: any) => i?.product?.name?.toLowerCase().includes(q));
    return matchId || matchProducts;
  };

  const getOrderTime = (o: any) => {
    if (o.createdAt) {
      const t = new Date(o.createdAt).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    if (o.date) {
      const t = new Date(o.date).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    return 0;
  };

  // Process list
  const processedOrders = (orders || [])
    .filter((o: any) => matchDate(o.createdAt || o.date) && matchStatus(o.status) && matchSearch(o))
    .sort((a: any, b: any) => {
      const timeA = getOrderTime(a);
      const timeB = getOrderTime(b);

      if (timeA !== timeB) {
        return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
      }

      const idA = String(a.id || a._id || '');
      const idB = String(b.id || b._id || '');
      return sortBy === 'newest'
        ? idB.localeCompare(idA, undefined, { numeric: true })
        : idA.localeCompare(idB, undefined, { numeric: true });
    });

  // Timeline Index calculation
  /* const getTimelineStepIndex = (status: string) => {
    switch (status) {
      case 'Pending': return 0;
      case 'Confirmed': return 1;
      case 'Packed':
      case 'Ready for Dispatch': return 2;
      case 'Shipped': return 3;
      case 'Out for Delivery': return 4;
      case 'Delivered': return 5;
      default: return -1;
    }
  };

  */ // Compact inline timeline helper for order cards
  const renderCompactTimeline = (status: string) => {
    const steps = ['Placed', 'Packed', 'Shipped', 'Delivered'];
    const activeIdx = status === 'Pending' || status === 'Confirmed' ? 0 
                    : status === 'Packed' || status === 'Ready for Dispatch' ? 1
                    : status === 'Shipped' || status === 'Out for Delivery' ? 2
                    : status === 'Delivered' ? 3 : -1;

    if (activeIdx === -1) return null; // Muted if cancelled or returned

    return (
      <div className="flex items-center gap-1 text-[10px] font-semibold text-mut">
        {steps.map((step, idx) => {
          const isDone = idx <= activeIdx;
          const isLast = idx === steps.length - 1;
          return (
            <React.Fragment key={step}>
              <span className={isDone ? 'text-primary font-bold' : 'text-mut/40'}>{step}</span>
              {!isLast && <span className="text-mut/30 font-normal">→</span>}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  /* ─── DEDICATED SEPARATE DETAILS PAGE VIEW ─── */
  if (activeOrder) {


    const items = Array.isArray(activeOrder.items)
      ? activeOrder.items
      : typeof activeOrder.items === 'string'
      ? (() => { try { return JSON.parse(activeOrder.items); } catch { return []; } })()
      : [];

    const isCancelled = ['Cancelled', 'Return Requested', 'Returned', 'Refunded'].includes(activeOrder.status);

    return (
      <>
        {/* Confetti confirmation overlay */}
        {successOverlay && (
          <OrderSuccessOverlay
            method={successOverlay.method}
            total={successOverlay.total}
            onDismiss={() => setSuccessOverlay(null)}
          />
        )}

        {/* ─── Cancel Order confirmation modal experience ─── */}
        {cancellingOrder && (
          <div 
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-blk/60 backdrop-blur-xs select-none"
            onClick={() => {
              if (cancellationStatus !== 'processing') {
                setCancellingOrder(null);
              }
            }}
          >
            <div 
              className="bg-wht rounded-2xl shadow-premium-xl max-w-[500px] w-full border border-bdr p-6 animate-scaleIn relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-red/30" />

              {/* Cancel IDLE State */}
              {cancellationStatus === 'idle' && (
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-red">
                      <XCircle size={18} />
                      <h3 className="font-display text-sm font-bold text-blk">Cancel Order Confirmation</h3>
                    </div>
                    <button 
                      onClick={() => setCancellingOrder(null)} 
                      className="w-7 h-7 rounded-full hover:bg-sur flex items-center justify-center text-mut hover:text-blk"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <p className="text-xs text-mid mb-5 leading-normal">
                    Are you sure you want to request cancellation for this order? Below is a summary of the formulation package items:
                  </p>

                  {/* Compact Product Preview */}
                  {(() => {
                    const cancellingItems = Array.isArray(cancellingOrder.items)
                      ? cancellingOrder.items
                      : typeof cancellingOrder.items === 'string'
                      ? (() => { try { return JSON.parse(cancellingOrder.items); } catch { return []; } })()
                      : [];
                    const pItem = cancellingItems[0];
                    return (
                      <div className="flex items-center gap-4 bg-sur/50 border border-bdrl rounded-xl p-3.5 mb-5 text-xs text-mid">
                        <div className="w-12 h-12 rounded-lg border border-bdrl bg-wht overflow-hidden shrink-0 flex items-center justify-center">
                          {pItem?.product?.imgs?.length > 0 ? (
                            <img src={pItem.product.imgs[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package size={16} className="text-primary/20" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-blk truncate">{pItem?.product?.name || 'Organic formulation'}</h4>
                          <p className="text-[10px] text-mut mt-0.5">Order Reference: {cancellingOrder.id}</p>
                          <p className="text-[10px] text-mut">Quantity: {pItem?.quantity || 1} item(s)</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-blk font-mono">₹{cancellingOrder.total}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Cancellation Reason Dropdown */}
                  <div className="flex flex-col gap-1.5 mb-5 text-xs">
                    <label className="text-[10px] font-bold text-mut uppercase">Reason for Cancellation</label>
                    <select 
                      value={cancellationReason}
                      onChange={e => setCancellationReason(e.target.value)}
                      className="input-field py-2"
                    >
                      <option value="">Select a reason for cancellation...</option>
                      <option value="Ordered by mistake">Ordered by mistake</option>
                      <option value="Found a better price">Found a better price</option>
                      <option value="Delivery taking too long">Delivery taking too long</option>
                      <option value="Changed my mind">Changed my mind</option>
                      <option value="Incorrect product selected">Incorrect product selected</option>
                      <option value="Payment issue">Payment issue</option>
                      <option value="Other">Other (Please specify)</option>
                    </select>

                    {cancellationReason === 'Other' && (
                      <textarea 
                        placeholder="Please elaborate on your cancellation request..."
                        value={cancellationOtherText}
                        onChange={e => setCancellationOtherText(e.target.value)}
                        rows={2}
                        className="textarea-field mt-2"
                        required
                      />
                    )}
                  </div>

                  {/* Warning notification message banner */}
                  <div className="bg-red-bg border border-red/15 rounded-lg p-3 text-[11px] leading-relaxed text-rose-800 mb-6 flex gap-2">
                    <AlertTriangle size={14} className="text-red shrink-0 mt-0.5" />
                    <span>
                      Once cancelled, this order cannot be restored. If you have already made a payment, any applicable refund will be processed according to the refund policy.
                    </span>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex gap-3 justify-end">
                    <button 
                      onClick={() => setCancellingOrder(null)} 
                      className="btn-secondary text-xs px-4"
                    >
                      Keep Order
                    </button>
                    <button 
                      onClick={handleConfirmCancellation}
                      disabled={!cancellationReason}
                      className={`text-xs px-4 py-2 bg-red text-wht font-bold rounded-lg focus:outline-none transition-all shadow-premium-sm ${
                        !cancellationReason ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-red/90'
                      }`}
                    >
                      Cancel Order
                    </button>
                  </div>
                </div>
              )}

              {/* Cancel PROCESSING State */}
              {cancellationStatus === 'processing' && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Loader2 size={36} className="text-red animate-spin mb-4" />
                  <h4 className="font-display font-bold text-blk mb-2">Cancelling Order...</h4>
                  <p className="text-xs text-mut max-w-[280px]">Communicating cancellation coordinates to server ledger. Please wait.</p>
                </div>
              )}

              {/* Cancel SUCCESS State */}
              {cancellationStatus === 'success' && (
                <div className="flex flex-col items-center justify-center py-6 text-center animate-scaleIn">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4 text-emerald-600">
                    <CheckCircle size={28} className="animate-scaleIn" />
                  </div>
                  <h4 className="font-display text-base font-bold text-blk mb-1">✓ Order Cancelled Successfully</h4>
                  <p className="text-xs text-mut mb-6">Your order has been cancelled.</p>
                  
                  {cancellingOrder.paymentStatus === 'Paid' && (
                    <p className="text-[11px] text-primary bg-primary-soft/30 border border-primary/10 rounded-lg p-2.5 max-w-[340px] leading-relaxed mb-6">
                      Your refund will be processed according to the original payment method. Refund times range between 3-5 banking business days.
                    </p>
                  )}

                  <button 
                    onClick={() => {
                      setCancellingOrder(null);
                      setCancellationStatus('idle');
                      setCancellationReason('');
                      setCancellationOtherText('');
                    }}
                    className="btn-primary text-xs px-6 py-2.5 shadow-premium-sm"
                  >
                    Okay, Done
                  </button>
                </div>
              )}

              {/* Cancel ERROR State */}
              {cancellationStatus === 'error' && (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <AlertTriangle size={32} className="text-red mb-3" />
                  <h4 className="font-display font-bold text-blk mb-1">Cancellation Failed</h4>
                  <p className="text-xs text-mut mb-6">{cancellationErrorMessage}</p>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        setCancellingOrder(null);
                        setCancellationStatus('idle');
                      }}
                      className="btn-secondary text-xs px-4"
                    >
                      Close
                    </button>
                    <button 
                      onClick={handleConfirmCancellation}
                      className="btn-primary text-xs px-4 bg-red hover:bg-red/90"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-6 pb-24 animate-fadeIn">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-1 text-[11px] text-mut mb-6 select-none font-semibold">
            <span className="hover:text-primary cursor-pointer" onClick={() => setCurPage('home')}>Home</span>
            <span>&gt;</span>
            <span className="hover:text-primary cursor-pointer" onClick={() => setActiveOrder(null)}>My Account</span>
            <span>&gt;</span>
            <span className="hover:text-primary cursor-pointer" onClick={() => setActiveOrder(null)}>My Orders</span>
            <span>&gt;</span>
            <span className="text-blk font-mono">{activeOrder.id}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Column (Main items and timelines) */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Product Cards + Timelines */}
              {items.map((item: any, idx: number) => {
                // Formulate policy dates based on order date
                const orderDate = new Date(activeOrder.date);
                
                const deliveryDate = new Date(orderDate);
                deliveryDate.setDate(orderDate.getDate() + 4);
                
                const policyEndedDate = new Date(deliveryDate);
                policyEndedDate.setDate(deliveryDate.getDate() + 7);
                const formattedPolicyEndedDate = policyEndedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

                return (
                  <div key={item.product?.id || idx} className="card p-6 bg-wht border border-bdrl rounded-xl flex flex-col gap-5">
                    
                    {/* Header Item Row */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-mut font-semibold block mb-0.5 select-none font-mono">
                          Seller: Clean Everyday India
                        </span>
                        <h4 className="text-sm font-bold text-blk leading-normal hover:text-primary cursor-pointer transition-colors select-none">
                          {item.product?.name || 'Clean Everyday Botanical Formulation'}
                        </h4>
                        <div className="flex items-center gap-3 mt-1.5 select-none">
                          <span className="text-sm font-extrabold text-blk font-mono">₹{item.product?.price || 0}</span>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">1 offer</span>
                        </div>
                      </div>
                      
                      {/* Product Image on Right */}
                      <div className="w-16 h-20 rounded-lg border border-bdrl bg-sur/50 p-1 shrink-0 overflow-hidden flex items-center justify-center">
                        {item.product?.imgs?.length > 0 ? (
                          <img src={item.product.imgs[0]} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <Package size={20} className="text-primary/20" />
                        )}
                      </div>
                    </div>

                    <div className="border-t border-bdrl my-1" />

                    {/* Timeline progress section */}
                    <div className="flex flex-col select-none gap-0">
                      {getTimelineEvents(activeOrder).slice(0, 3).map((ev: any, evIdx: number, evArr: any[]) => {
                        const isLatest = evIdx === 0;
                        const isLastItem = evIdx === evArr.length - 1;
                        const isCancelEvent = ev.status.toLowerCase().includes('cancel');

                        return (
                          <div key={evIdx} className="flex gap-4.5 text-xs">
                            {/* Left column: indicator circle & connector line */}
                            <div className="flex flex-col items-center shrink-0 w-4 relative">
                              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 z-10 ${
                                isLatest 
                                  ? (isCancelEvent ? 'bg-red text-wht ring-4 ring-red/10' : 'bg-emerald-600 text-wht ring-4 ring-emerald-50')
                                  : (isCancelEvent ? 'bg-red text-wht' : 'bg-emerald-500 text-wht')
                              }`}>
                                {isCancelEvent ? <X size={8} /> : <Check size={8} />}
                              </div>
                              {!isLastItem && <div className="w-[1.5px] flex-grow bg-bdr my-1" />}
                            </div>

                            {/* Right column: text updates */}
                            <div className="flex-1 pb-5">
                              <p className={`font-bold leading-normal ${isLatest ? 'text-blk' : 'text-mut'}`}>
                                {ev.status}
                              </p>
                              <p className="text-[10px] text-mut mt-0.5">{ev.date}</p>
                              {ev.notes && <p className="text-[10px] text-mut/70 mt-1 italic">{ev.notes}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Timeline Updates Actions */}
                    <div className="flex items-center justify-between text-[11px] font-bold text-primary mt-2 select-none">
                      <button 
                        onClick={() => setShowTimelineModal(true)}
                        className="hover:underline flex items-center gap-0.5 cursor-pointer hover:text-primary transition-colors"
                      >
                        See All Updates &gt;
                      </button>
                      
                      {activeOrder.status === 'Delivered' && (
                        <span className="text-mut font-semibold">
                          Return policy ended on {formattedPolicyEndedDate}
                        </span>
                      )}
                    </div>

                    {/* Chat with support bar */}
                    <div className="border-t border-bdrl pt-4 flex justify-center">
                      <button
                        onClick={() => showToast('Opening customer support live chat...')}
                        className="flex items-center justify-center gap-2 py-2 px-6 rounded-lg border border-bdr hover:bg-sur/40 text-xs font-bold text-mid cursor-pointer transition-all w-full"
                      >
                        <MessageSquare className="text-mut shrink-0" size={14} />
                        <span>Chat with us</span>
                      </button>
                    </div>

                  </div>
                );
              })}

              {/* Rate Experience card */}
              <div className="card p-5 bg-wht border border-bdrl rounded-xl select-none">
                <h4 className="text-xs font-bold text-mut uppercase tracking-wider mb-4">Rate your experience</h4>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => showToast(`Thanks for giving ${star} stars!`)}
                        className="w-8 h-8 rounded-lg hover:bg-sur flex items-center justify-center text-mut hover:text-primary transition-all cursor-pointer border border-bdr text-base"
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-mid select-none">Rate the products package</span>
                </div>
              </div>

              {/* Back CTA actions row */}
              <div className="flex items-center justify-between pt-4 select-none">
                <button
                  onClick={() => setActiveOrder(null)}
                  className="btn-secondary text-xs flex items-center gap-1 hover:text-primary transition-all cursor-pointer"
                >
                  <ArrowLeft size={12} /> Back to Dashboard
                </button>
              </div>

            </div>

            {/* Right Column (Sidebar metrics, address, invoice) */}
            <div className="lg:col-span-1 space-y-4">
              
              {/* Order Actions Menu Card */}
              <div className="card p-5 bg-wht border border-bdrl rounded-xl flex flex-col gap-3 select-none">
                <h4 className="text-xs font-bold text-mut uppercase tracking-wider mb-2 font-mono">Order Actions</h4>
                
                {/* Reorder Products */}
                <button
                  onClick={() => handleReorder(activeOrder)}
                  className="btn-secondary text-xs flex items-center justify-center gap-1.5 w-full py-2.5 font-bold cursor-pointer hover:text-primary hover:border-primary transition-all bg-wht"
                >
                  <RotateCcw size={13} /> Reorder Products
                </button>

                {/* Cancel Order */}
                {!isCancelled && ['Pending', 'Confirmed', 'Packed', 'Ready for Dispatch'].includes(activeOrder.status) && (
                  <button
                    onClick={() => handleOpenCancelModal(activeOrder)}
                    className="btn-secondary text-xs border-red/20 text-red hover:bg-red-bg flex items-center justify-center gap-1.5 w-full py-2.5 font-bold cursor-pointer transition-all bg-wht"
                  >
                    <XCircle size={13} /> Cancel Order
                  </button>
                )}

                {/* Return Product */}
                {!isCancelled && activeOrder.status === 'Delivered' && (
                  <button
                    onClick={() => handleReturnOrder(activeOrder.id)}
                    className="btn-secondary text-xs border-red/20 text-red hover:bg-red-bg flex items-center justify-center gap-1.5 w-full py-2.5 font-bold cursor-pointer transition-all bg-wht"
                  >
                    <Undo size={13} /> Return Product
                  </button>
                )}

                {/* Support Query */}
                <button
                  onClick={() => showToast(`Contacting support for Order ${activeOrder.id}...`)}
                  className="btn-secondary text-xs flex items-center justify-center gap-1.5 w-full py-2.5 font-bold cursor-pointer hover:text-primary hover:border-primary transition-all bg-wht"
                >
                  <MessageSquare size={13} /> Support Query
                </button>
              </div>
              
              {/* Delivery Address Card */}
              <div className="card p-5 bg-wht border border-bdrl rounded-xl flex flex-col gap-4">
                <div className="flex items-start gap-3 text-xs text-blk">
                  <Home className="text-mut shrink-0 mt-0.5" size={16} />
                  <div>
                    <h5 className="font-bold">Home</h5>
                    <p className="text-[11px] text-mut leading-relaxed mt-1">
                      {(() => {
                        const addr = activeOrder.address;
                        const parts = [];
                        if (addr?.addressLine1) parts.push(addr.addressLine1);
                        if (addr?.addressLine2) parts.push(addr.addressLine2);
                        if (addr?.city) parts.push(addr.city);
                        if (addr?.state) parts.push(addr.state);
                        let formattedStr = parts.join(', ');
                        if (addr?.pincode) {
                          formattedStr += formattedStr ? ` - ${addr.pincode}` : addr.pincode;
                        }
                        return formattedStr || 'Address details not specified';
                      })()}
                    </p>
                  </div>
                </div>

                <div className="border-t border-bdrl my-0.5" />

                <div className="flex items-start gap-3 text-xs text-blk">
                  <UserIcon className="text-mut shrink-0 mt-0.5" size={16} />
                  <div>
                    <h5 className="font-bold font-mono">
                      {activeOrder.address?.name || curUser?.name || 'Customer'}
                    </h5>
                    <p className="text-[11px] text-mut font-mono mt-0.5">
                      {activeOrder.address?.phone || curUser?.phoneNumber || curUser?.phone || ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Price Details summary card */}
              <div className="card p-5 bg-wht border border-bdrl rounded-xl flex flex-col">
                <h4 className="text-xs font-bold text-mut uppercase tracking-wider mb-4 font-mono">Price Details</h4>
                
                {/* Math Calculations variables mapping */}
                {(() => {
                  const totalFees = activeOrder.total >= 499 ? 0 : 50;
                  const specialPrice = activeOrder.total - totalFees;
                  const listingPrice = Math.round(specialPrice * 1.25);
                  const discountFees = listingPrice - specialPrice;
                  
                  // Fees and specific discounts
                  const couponDiscount = activeOrder.discount || 0;
                  const finalOtherDiscount = discountFees + couponDiscount;
                  const grandTotal = activeOrder.total;

                  return (
                    <div className="text-xs space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-mut">Listing price</span>
                        <span className="font-semibold text-blk font-mono">₹{listingPrice}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-mut flex items-center gap-1">
                          Special price <Info size={11} className="text-mut/60 cursor-pointer" />
                        </span>
                        <span className="font-semibold text-blk font-mono">₹{specialPrice}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-mut flex items-center gap-1">Total fees</span>
                        <span className="font-semibold text-blk font-mono">₹{totalFees}</span>
                      </div>

                      {finalOtherDiscount > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-mut">Other discount</span>
                          <span className="font-bold text-emerald-600 font-mono">-₹{finalOtherDiscount}</span>
                        </div>
                      )}

                      <div className="border-t border-dashed border-bdrl my-4" />

                      <div className="flex justify-between items-center text-sm font-extrabold text-blk">
                        <span>Total amount</span>
                        <span className="font-mono">₹{grandTotal}</span>
                      </div>

                      {/* Payment details */}
                      <div className="bg-sur/40 rounded-xl p-3 border border-bdrl flex justify-between items-center text-[10px] mt-4 select-none">
                        <span className="font-semibold text-mut">Paid By</span>
                        <span className="font-bold text-blk flex items-center gap-1">
                          <span className="px-1.5 py-0.5 bg-wht border border-bdr rounded font-mono text-[9px] text-mid uppercase font-extrabold tracking-wider shadow-premium-sm">
                            {activeOrder.paymentMethod || 'UPI'}
                          </span>
                          <span>{activeOrder.paymentMethod || 'UPI'}</span>
                        </span>
                      </div>

                      {/* Download Invoice Button */}
                      <button
                        onClick={() => setInvoiceOrder(activeOrder)}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-bdr hover:bg-sur/40 text-xs font-bold text-mid cursor-pointer transition-all w-full mt-4 bg-wht"
                      >
                        <Printer className="text-mut shrink-0" size={13} />
                        <span>Download Invoice</span>
                      </button>

                    </div>
                  );
                })()}

              </div>

              {/* Offers Earned block */}
              <div className="card p-5 bg-wht border border-bdrl rounded-xl">
                <div className="flex items-center justify-between text-xs text-blk font-bold select-none cursor-pointer">
                  <span>Offers earned</span>
                  <span className="text-mut text-[10px] font-normal">1 Offer &gt;</span>
                </div>
              </div>

            </div>
          </div>
        </div>
        
        {/* Shipment Tracker Modal */}
        {showTimelineModal && activeOrder && ReactDOM.createPortal(
          <div className="fixed inset-0 bg-blk/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fadeIn">
            <div className="bg-wht w-full max-w-[460px] rounded-2xl shadow-premium border border-bdr p-6 relative animate-scaleIn">
              <button
                onClick={() => setShowTimelineModal(false)}
                className="absolute right-4 top-4 w-7 h-7 rounded-full bg-sur hover:bg-bdr/50 flex items-center justify-center text-mut hover:text-blk transition-all cursor-pointer border-none"
              >
                <X size={14} />
              </button>

              <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-bdrl">
                <Truck className="text-primary" size={20} />
                <div>
                  <h3 className="font-display text-sm font-bold text-blk">Shipment Tracking Details</h3>
                  <p className="text-[10px] text-mut mt-0.5">Order ID: {(activeOrder as any).id} • Registered to {(activeOrder as any).address?.name}</p>
                </div>
              </div>

              {/* Modal Timeline Content */}
              <div className="max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex flex-col">
                  {getTimelineEvents(activeOrder as any).map((ev: any, evIdx: number, evArr: any[]) => {
                    const isLatest = evIdx === 0;
                    const isLastItem = evIdx === evArr.length - 1;
                    const isCancelEvent = ev.status.toLowerCase().includes('cancel');

                    return (
                      <div key={evIdx} className="flex gap-4 text-xs">
                        {/* Left column: indicator circle & connector line */}
                        <div className="flex flex-col items-center shrink-0 w-5 relative">
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 z-10 ${
                            isLatest 
                              ? (isCancelEvent ? 'bg-red text-wht ring-4 ring-red/10' : 'bg-emerald-600 text-wht ring-4 ring-emerald-50')
                              : (isCancelEvent ? 'bg-red text-wht' : 'bg-emerald-500 text-wht')
                          }`}>
                            {isCancelEvent ? <X size={8} /> : <Check size={8} />}
                          </div>
                          {!isLastItem && <div className="w-[1.5px] flex-grow bg-bdr my-1" />}
                        </div>

                        {/* Right column: text updates */}
                        <div className="flex-1 pb-5">
                          <p className={`font-bold leading-normal ${isLatest ? 'text-blk' : 'text-mut'}`}>
                            {ev.status}
                          </p>
                          <p className="text-[10px] text-mut mt-0.5">{ev.date}</p>
                          {ev.notes && (
                            <div className="bg-sur/40 border border-bdrl rounded-lg p-2.5 mt-1.5 text-[10px] text-mid">
                              {ev.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-bdrl mt-4 flex justify-end">
                <button
                  onClick={() => setShowTimelineModal(false)}
                  className="btn-primary text-xs px-5 py-2 shadow-premium-sm"
                >
                  Close Tracking
                </button>
              </div>

            </div>
          </div>
        , document.body)}
      </>
    );
  }

  return (
    <>
      {/* Confetti confirmation overlay */}
      {successOverlay && (
        <OrderSuccessOverlay
          method={successOverlay.method}
          total={successOverlay.total}
          onDismiss={() => setSuccessOverlay(null)}
        />
      )}

      {/* ─── Cancel Order confirmation modal experience ─── */}
      {cancellingOrder && (
        <div 
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-blk/60 backdrop-blur-xs select-none"
          onClick={() => {
            // Prevent close on outside click when processing cancellation
            if (cancellationStatus !== 'processing') {
              setCancellingOrder(null);
            }
          }}
        >
          <div 
            className="bg-wht rounded-2xl shadow-premium-xl max-w-[500px] w-full border border-bdr p-6 animate-scaleIn relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-red/30" />

            {/* Cancel IDLE State */}
            {cancellationStatus === 'idle' && (
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-red">
                    <XCircle size={18} />
                    <h3 className="font-display text-sm font-bold text-blk">Cancel Order Confirmation</h3>
                  </div>
                  <button 
                    onClick={() => setCancellingOrder(null)} 
                    className="w-7 h-7 rounded-full hover:bg-sur flex items-center justify-center text-mut hover:text-blk"
                  >
                    <X size={14} />
                  </button>
                </div>

                <p className="text-xs text-mid mb-5 leading-normal">
                  Are you sure you want to request cancellation for this order? Below is a summary of the formulation package items:
                </p>

                {/* Compact Product Preview */}
                {(() => {
                  const items = Array.isArray(cancellingOrder.items)
                    ? cancellingOrder.items
                    : typeof cancellingOrder.items === 'string'
                    ? (() => { try { return JSON.parse(cancellingOrder.items); } catch { return []; } })()
                    : [];
                  const pItem = items[0];
                  return (
                    <div className="flex items-center gap-4 bg-sur/50 border border-bdrl rounded-xl p-3.5 mb-5 text-xs text-mid">
                      <div className="w-12 h-12 rounded-lg border border-bdrl bg-wht overflow-hidden shrink-0 flex items-center justify-center">
                        {pItem?.product?.imgs?.length > 0 ? (
                          <img src={pItem.product.imgs[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package size={16} className="text-primary/20" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-blk truncate">{pItem?.product?.name || 'Organic formulation'}</h4>
                        <p className="text-[10px] text-mut mt-0.5">Order Reference: {cancellingOrder.id}</p>
                        <p className="text-[10px] text-mut">Quantity: {pItem?.quantity || 1} item(s)</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-blk font-mono">₹{cancellingOrder.total}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Cancellation Reason Dropdown */}
                <div className="flex flex-col gap-1.5 mb-5 text-xs">
                  <label className="text-[10px] font-bold text-mut uppercase">Reason for Cancellation</label>
                  <select 
                    value={cancellationReason}
                    onChange={e => setCancellationReason(e.target.value)}
                    className="input-field py-2"
                  >
                    <option value="">Select a reason for cancellation...</option>
                    <option value="Ordered by mistake">Ordered by mistake</option>
                    <option value="Found a better price">Found a better price</option>
                    <option value="Delivery taking too long">Delivery taking too long</option>
                    <option value="Changed my mind">Changed my mind</option>
                    <option value="Incorrect product selected">Incorrect product selected</option>
                    <option value="Payment issue">Payment issue</option>
                    <option value="Other">Other (Please specify)</option>
                  </select>

                  {cancellationReason === 'Other' && (
                    <textarea 
                      placeholder="Please elaborate on your cancellation request..."
                      value={cancellationOtherText}
                      onChange={e => setCancellationOtherText(e.target.value)}
                      rows={2}
                      className="textarea-field mt-2"
                      required
                    />
                  )}
                </div>

                {/* Warning notification message banner */}
                <div className="bg-red-bg border border-red/15 rounded-lg p-3 text-[11px] leading-relaxed text-rose-800 mb-6 flex gap-2">
                  <AlertTriangle size={14} className="text-red shrink-0 mt-0.5" />
                  <span>
                    Once cancelled, this order cannot be restored. If you have already made a payment, any applicable refund will be processed according to the refund policy.
                  </span>
                </div>

                {/* Actions Footer */}
                <div className="flex gap-3 justify-end">
                  <button 
                    onClick={() => setCancellingOrder(null)} 
                    className="btn-secondary text-xs px-4"
                  >
                    Keep Order
                  </button>
                  <button 
                    onClick={handleConfirmCancellation}
                    disabled={!cancellationReason}
                    className={`text-xs px-4 py-2 bg-red text-wht font-bold rounded-lg focus:outline-none transition-all shadow-premium-sm ${
                      !cancellationReason ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-red/90'
                    }`}
                  >
                    Cancel Order
                  </button>
                </div>
              </div>
            )}

            {/* Cancel PROCESSING State */}
            {cancellationStatus === 'processing' && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Loader2 size={36} className="text-red animate-spin mb-4" />
                <h4 className="font-display font-bold text-blk mb-2">Cancelling Order...</h4>
                <p className="text-xs text-mut max-w-[280px]">Communicating cancellation coordinates to server ledger. Please wait.</p>
              </div>
            )}

            {/* Cancel SUCCESS State */}
            {cancellationStatus === 'success' && (
              <div className="flex flex-col items-center justify-center py-6 text-center animate-scaleIn">
                <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4 text-emerald-600">
                  <CheckCircle size={28} className="animate-scaleIn" />
                </div>
                <h4 className="font-display text-base font-bold text-blk mb-1">✓ Order Cancelled Successfully</h4>
                <p className="text-xs text-mut mb-6">Your order has been cancelled.</p>
                
                {cancellingOrder.paymentStatus === 'Paid' && (
                  <p className="text-[11px] text-primary bg-primary-soft/30 border border-primary/10 rounded-lg p-2.5 max-w-[340px] leading-relaxed mb-6">
                    Your refund will be processed according to the original payment method. Refund times range between 3-5 banking business days.
                  </p>
                )}

                <button 
                  onClick={() => setCancellingOrder(null)}
                  className="btn-primary text-xs px-6 py-2.5 shadow-premium-sm"
                >
                  Okay, Done
                </button>
              </div>
            )}

            {/* Cancel ERROR State */}
            {cancellationStatus === 'error' && (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <AlertTriangle size={32} className="text-red mb-3" />
                <h4 className="font-display font-bold text-blk mb-1">Cancellation Failed</h4>
                <p className="text-xs text-mut mb-6">{cancellationErrorMessage}</p>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setCancellingOrder(null)} 
                    className="btn-secondary text-xs px-4"
                  >
                    Close
                  </button>
                  <button 
                    onClick={handleConfirmCancellation}
                    className="btn-primary text-xs px-4 bg-red hover:bg-red/90"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}




      {/* Main dashboard space */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-10 pb-24 animate-fadeIn">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-bdrl pb-6">
          <div>
            <h1 className="page-title text-3xl font-extrabold tracking-tight">Order Dashboard</h1>
            <p className="text-sm text-mut mt-1">Monitor shipment logs, check delivery tracking, print invoices, and request returns.</p>
          </div>
          <button
            onClick={() => setCurPage('products')}
            className="btn-secondary text-xs shrink-0 self-start sm:self-center"
          >
            <ArrowLeft size={13} /> Continue Shopping
          </button>
        </div>

        {/* Empty state conditional view */}
        {!orders || orders.length === 0 ? (
          <div className="empty-state max-w-[500px] mx-auto py-16">
            <div className="empty-state-icon animate-float">
              <ShoppingBag size={32} className="text-primary" />
            </div>
            <h2 className="font-display text-xl font-bold text-blk mb-2">No purchases yet</h2>
            <p className="text-sm text-mut mb-6">
              You haven't logged any eco formulations orders. Start exploring our homecare catalog to purchase botanical solutions.
            </p>
            <button onClick={() => setCurPage('products')} className="btn-primary-lg mx-auto">
              Browse Formulations
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            
            {/* Filter and Command Toolbar */}
            <div className="card p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between select-none">
              
              {/* Category tabs */}
              <div className="flex gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                {(['All', 'Progress', 'Delivered', 'Cancelled'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setStatusTab(tab)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      statusTab === tab
                        ? 'bg-primary text-wht font-bold shadow-premium-sm'
                        : 'text-mut hover:text-blk hover:bg-sur'
                    }`}
                  >
                    {tab === 'Progress' ? 'In Transit' : tab === 'Cancelled' ? 'Cancelled / Returned' : tab}
                  </button>
                ))}
              </div>

              {/* Action filters */}
              <div className="flex flex-wrap items-center gap-3.5">
                
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-[280px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mut" />
                  <input
                    type="text"
                    placeholder="Search by ID or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs border border-bdr rounded-lg bg-sur/30 focus:bg-wht outline-none focus:border-primary transition-all placeholder:text-mut"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mut hover:text-blk">
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Date Dropdown */}
                <div className="flex items-center gap-1.5 border border-bdr rounded-lg bg-wht px-3 py-2 cursor-pointer relative hover:border-mut transition-all">
                  <SlidersHorizontal size={12} className="text-mut" />
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as any)}
                    className="bg-transparent text-xs font-semibold text-mid outline-none border-none cursor-pointer pr-1"
                  >
                    <option value="all">All Dates</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="6months">Last 6 Months</option>
                    <option value="2026">Year 2026</option>
                  </select>
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center gap-1.5 border border-bdr rounded-lg bg-wht px-3 py-2 cursor-pointer relative hover:border-mut transition-all">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-xs font-semibold text-mid outline-none border-none cursor-pointer pr-1"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Main Orders Display Listing */}
            {isLoading ? (
              <SkeletonLoader />
            ) : processedOrders.length === 0 ? (
              <div className="text-center py-16 bg-wht border border-bdr rounded-xl shadow-premium-sm max-w-[480px] mx-auto p-6">
                <AlertTriangle size={24} className="text-accent mx-auto mb-3" />
                <h3 className="font-display font-semibold text-blk mb-1">No orders found</h3>
                <p className="text-xs text-mut mb-4">No logged deliveries match your search query or selected category filter options.</p>
                <button onClick={() => { setSearchQuery(''); setStatusTab('All'); setDateFilter('all'); }} className="btn-secondary text-xs">
                  Reset Active Filters
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {processedOrders.map((order: any) => {
                  const cfg = getStatusConfig(order.status);
                  const StatusIcon = cfg.icon;

                  const items = Array.isArray(order.items)
                    ? order.items
                    : typeof order.items === 'string'
                    ? (() => { try { return JSON.parse(order.items); } catch { return []; } })()
                    : [];

                  const primaryItem = items[0];
                  const totalQuantity = items.reduce((sum: number, it: any) => sum + (it.quantity || 0), 0);
                  const isCancelled = ['Cancelled', 'Return Requested', 'Returned', 'Refunded'].includes(order.status);
                  const isDelivered = order.status === 'Delivered';

                  return (
                    <div
                      key={order.id}
                      className="card p-5 sm:p-6 transition-all duration-200 flex flex-col gap-4 relative overflow-hidden group"
                    >
                      {/* Left highlights color strip */}
                      <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${isCancelled ? 'bg-red' : isDelivered ? 'bg-emerald-600' : 'bg-primary'}`} />

                      {/* Clean Desktop horizontal order card layout */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 w-full">
                        
                        {/* 1. Product Image & Product Info */}
                        <div className="flex items-center gap-4 min-w-0 md:w-[45%]">
                          <div className="w-16 h-16 rounded-xl border border-bdrl overflow-hidden bg-primary-soft/30 flex items-center justify-center shrink-0 shadow-premium-sm relative">
                            {primaryItem?.product?.imgs?.length > 0 ? (
                              <img src={primaryItem.product.imgs[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package size={20} className="text-primary/30" />
                            )}
                            {items.length > 1 && (
                              <span className="absolute bottom-1 right-1 bg-ink/80 backdrop-blur-xs text-wht text-[9px] font-bold px-1.5 py-0.5 rounded">
                                +{items.length - 1}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                              <span className="text-[10px] font-bold text-mut font-mono">{order.id}</span>
                              <span className="text-[10px] text-fnt font-bold">•</span>
                              <span className="text-[10px] font-medium text-mut">{order.date}</span>
                            </div>
                            <h3 className="text-sm font-bold text-blk truncate leading-snug group-hover:text-primary transition-colors">
                              {primaryItem?.product?.name || 'Botanical formulation order'}
                            </h3>
                            <div className="flex flex-wrap gap-x-3 text-[10px] text-mut font-semibold mt-1">
                              <span>Variant: <span className="text-mid">500ml Bottled</span></span>
                              <span>Qty: <span className="text-mid">{totalQuantity}</span></span>
                            </div>
                          </div>
                        </div>

                        {/* 2. Order Status (subtle badges + compact timeline) */}
                        <div className="flex flex-col gap-1.5 justify-center md:w-[25%] select-none">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                              <StatusIcon size={10} />
                              {order.status}
                            </span>
                            {isDelivered && (
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5 uppercase tracking-wider font-extrabold">
                                Delivered
                              </span>
                            )}
                          </div>
                          {!isCancelled && renderCompactTimeline(order.status)}
                          {isCancelled && (
                            <span className="text-[10px] text-red/80 font-medium">Inactive Order</span>
                          )}
                        </div>

                        {/* 3. Price Summary */}
                        <div className="flex flex-col justify-center items-start md:items-end shrink-0 md:w-[12%] select-none">
                          <span className="text-[10px] text-mut font-semibold block leading-none mb-1">Paid Total</span>
                          <span className="text-sm font-bold text-blk font-mono">₹{order.total}</span>
                        </div>

                        {/* 4. Primary & Secondary Actions */}
                        <div className="flex flex-row md:flex-col justify-end items-center md:items-end gap-2.5 shrink-0 md:w-[15%]">
                          <button
                            onClick={() => setActiveOrder(order)}
                            className="btn-primary text-xs w-full py-1.5 text-center flex items-center justify-center gap-1 shadow-premium-sm cursor-pointer"
                          >
                            View Details
                          </button>
                        </div>

                      </div>

                      {/* Optional secondary actions row */}
                      <div className="flex flex-wrap items-center gap-4 border-t border-bdrl pt-3 text-[11px] font-bold text-mid select-none w-full">
                        <button
                          onClick={() => setInvoiceOrder(order)}
                          className="hover:text-primary cursor-pointer"
                        >
                          Download Invoice
                        </button>
                        <span className="text-bdrl">|</span>
                        <button
                          onClick={() => handleReorder(order)}
                          className="hover:text-primary cursor-pointer"
                        >
                          Reorder Items
                        </button>
                        <span className="text-bdrl">|</span>
                        <button
                          onClick={() => showToast(`Contacting support for Order ${order.id}...`)}
                          className="hover:text-primary cursor-pointer"
                        >
                          Support Query
                        </button>
                        {isDelivered && (
                          <span className="text-emerald-700 ml-auto font-bold">
                            Completed on {order.estimatedDelivery || order.date}
                          </span>
                        )}
                        {!isDelivered && order.estimatedDelivery && (
                          <span className="text-primary ml-auto font-bold">
                            Delivery Est: {order.estimatedDelivery}
                          </span>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
            
          </div>
        )}
      </div>

    </>
  );
};

export default Orders;
