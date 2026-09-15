import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useApp } from '../../../core/context/AppContext';
import type { Order } from '../../../core/types';
// @ts-ignore
import { auth } from '../../../../firebase';
import { getSocket } from '../../../core/socket/socket';
import { SOCKET_EVENTS } from '../../../core/socket/socketEvents';
import {
  Search,
  FileDown,
  Printer,
  Truck,
  Calendar,
  IndianRupee,
  CheckSquare,
  ArrowLeft,
  Package,
  Clock,
  User,
  CreditCard,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

const RunningTruckParcel: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'sm' }) => (
  <div className={`relative overflow-hidden flex items-center justify-center mx-auto ${size === 'sm' ? 'w-20 h-4 mb-0.5' : 'w-28 h-8'}`}>
    <style>{`
      @keyframes truckParcelRunVanish {
        0% { transform: translateX(-24px); opacity: 0; }
        25% { opacity: 1; }
        75% { opacity: 1; }
        100% { transform: translateX(24px); opacity: 0; }
      }
    `}</style>
    <div 
      className="relative flex items-center text-primary"
      style={{ animation: 'truckParcelRunVanish 0.85s linear infinite' }}
    >
      <div className="relative flex items-center">
        <Truck size={size === 'sm' ? 14 : 24} className="text-primary stroke-[2.2]" />
        <div className={size === 'sm' ? "absolute -top-[2px] left-[2px] w-[6px] h-[5px] bg-amber-500 rounded-[1px] border border-amber-700 shadow-xs" : "absolute -top-[4px] left-[3px] w-[10px] h-[8px] bg-amber-500 rounded-[1px] border border-amber-700 shadow-xs"} />
      </div>
    </div>
  </div>
);

const STORAGE_ORDERS_KEY = 'ce_admin_orders_registry_cache';

const OrdersRegistry: React.FC = () => {
  const {
    orders,
    updateOrderStatus,
    updateOrderDetails,
    addOrderTimelineEvent,
    showToast,
    setInvoiceOrder
  } = useApp();

  // Instant SWR cache initialization for low network & fast load
  const [apiOrders, setApiOrders] = useState<Order[] | null>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_ORDERS_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Orders cache load note:', e);
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_ORDERS_KEY);
      return !cached;
    } catch {
      return true;
    }
  });

  const isMountedRef = useRef<boolean>(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadOrders = useCallback(async (silent: boolean = false) => {
    if (!silent && !localStorage.getItem(STORAGE_ORDERS_KEY)) {
      setIsLoading(true);
    }
    try {
      const firebaseUser = auth.currentUser;
      let token = '';
      if (firebaseUser) {
        token = await firebaseUser.getIdToken();
      }
      const backendUrl = import.meta.env.VITE_BACKEND_URI || 'http://localhost:5002/api';
      const response = await axios.get(`${backendUrl}/auth/admin/orders`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
        timeout: 10000
      });

      if (response.data && response.data.success && Array.isArray(response.data.orders)) {
        const fetchedOrders: Order[] = response.data.orders.map((o: any) => ({
          id: o.id || o.orderNumber || o._id,
          _id: o._id,
          createdAt: o.createdAt || o._id,
          date: o.date ? new Date(o.date).toLocaleDateString('en-IN') : (o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')),
          total: o.total || o.grandTotal || 0,
          customerEmail: o.customerEmail || o.customer?.email || '',
          paymentStatus: o.paymentStatus || o.payment?.status || 'Pending',
          status: o.status || 'Pending',
          address: {
            name: o.address?.name || o.shippingAddress?.fullName || 'Customer',
            phone: o.address?.phone || o.shippingAddress?.phoneNumber || o.shippingAddress?.phone || o.customer?.phoneNumber || 'N/A',
            city: o.address?.city || o.shippingAddress?.city || 'N/A',
            street: o.address?.street || o.shippingAddress?.addressLine1 || 'N/A',
            state: o.address?.state || o.shippingAddress?.state || 'N/A',
            pincode: (o.address?.pincode && o.address.pincode !== 'N/A') ? o.address.pincode : (o.shippingAddress?.postalCode || o.shippingAddress?.pincode || o.billingAddress?.pincode || o.billingAddress?.postalCode || o.billingAddressRaw?.postalCode || o.customer?.address?.postalCode || o.customer?.addresses?.[0]?.postalCode || 'N/A')
          },
          billingAddress: (o.billingAddress || o.billingAddressRaw) ? {
            name: o.billingAddress?.name || o.billingAddress?.fullName || o.billingAddressRaw?.fullName || o.address?.name || o.shippingAddress?.fullName || 'Customer',
            street: o.billingAddress?.street || o.billingAddress?.addressLine1 || o.billingAddressRaw?.addressLine1 || o.address?.street || o.shippingAddress?.addressLine1 || 'N/A',
            city: o.billingAddress?.city || o.billingAddressRaw?.city || o.address?.city || o.shippingAddress?.city || 'N/A',
            state: o.billingAddress?.state || o.billingAddressRaw?.state || o.address?.state || o.shippingAddress?.state || 'N/A',
            pincode: (o.billingAddress?.pincode && o.billingAddress.pincode !== 'N/A') ? o.billingAddress.pincode : (o.billingAddress?.postalCode || o.billingAddressRaw?.postalCode || o.address?.pincode || o.shippingAddress?.postalCode || o.shippingAddress?.pincode || o.customer?.address?.postalCode || o.customer?.addresses?.[0]?.postalCode || 'N/A')
          } : undefined,
          paymentMethod: o.paymentMethod || o.payment?.method || 'COD',
          shippingMethod: o.shippingMethod || o.delivery?.title || 'Standard Delivery',
          subtotal: typeof o.subtotal === 'number' && o.subtotal > 0 ? o.subtotal : undefined,
          shippingCharge: typeof o.shippingCharge === 'number' ? o.shippingCharge : (o.delivery?.charge || o.shippingFee || 0),
          taxes: typeof o.taxes === 'number' ? o.taxes : (o.tax?.amount || o.taxes?.amount || 0),
          discount: o.discount || 0,
          courierCompany: o.courierCompany || o.shipping?.courier || '',
          trackingId: o.trackingId || o.shipping?.trackingId || '',
          trackingUrl: o.trackingUrl || o.shipping?.trackingUrl || '',
          estimatedDelivery: o.estimatedDelivery || o.shipping?.estimatedDelivery || '',
          adminNotes: o.adminNotes || '',
          items: (o.items || []).map((item: any, idx: number) => {
            const priceVal = item.product?.price || item.unitPrice || item.sellingPrice || item.retailPrice || (item.totalPrice && item.quantity ? Math.round(item.totalPrice / item.quantity) : 0);
            return {
              product: {
                id: item.product?.id || idx + 1,
                name: item.product?.name || item.title || 'Product',
                sku: item.product?.sku || item.sku || 'N/A',
                price: priceVal,
                imgs: item.image ? [item.image] : []
              },
              unitPrice: priceVal,
              sellingPrice: item.sellingPrice || priceVal,
              retailPrice: item.retailPrice || priceVal,
              quantity: item.quantity || 1
            };
          })
        }));

        if (isMountedRef.current) {
          setApiOrders(fetchedOrders);
          try {
            localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(fetchedOrders));
          } catch (e) {
            console.warn('Orders cache write note:', e);
          }
        }
      }
    } catch (err) {
      console.warn('Orders Registry API note (using cache/context fallback):', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadOrders(Boolean(apiOrders && apiOrders.length > 0));

    const debouncedLoad = () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          loadOrders(true);
        }
      }, 300);
    };

    const socket = getSocket();
    socket.on(SOCKET_EVENTS.ORDER_CREATED, debouncedLoad);
    socket.on(SOCKET_EVENTS.ORDER_STATUS_UPDATED, debouncedLoad);
    socket.on(SOCKET_EVENTS.ORDER_CANCELLED, debouncedLoad);

    const handleFocusSync = () => {
      if (isMountedRef.current && document.visibilityState === 'visible') {
        loadOrders(true);
      }
    };

    window.addEventListener('focus', handleFocusSync);
    document.addEventListener('visibilitychange', handleFocusSync);

    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      socket.off(SOCKET_EVENTS.ORDER_CREATED, debouncedLoad);
      socket.off(SOCKET_EVENTS.ORDER_STATUS_UPDATED, debouncedLoad);
      socket.off(SOCKET_EVENTS.ORDER_CANCELLED, debouncedLoad);
      window.removeEventListener('focus', handleFocusSync);
      document.removeEventListener('visibilitychange', handleFocusSync);
    };
  }, [loadOrders]);

  const activeOrders = apiOrders !== null ? apiOrders : orders;

  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const handleStatusChange = async (orderId: string, _id: string | undefined, newStatus: any) => {
    setUpdatingOrderId(orderId);
    try {
      // Optimistically update local state for instant feedback
      setApiOrders((prev) =>
        prev
          ? prev.map((o) => (o.id === orderId || o._id === _id ? { ...o, status: newStatus } : o))
          : null
      );
      await updateOrderStatus(orderId, newStatus, _id);
      // Automatically re-fetch API silently to sync latest data without table loading overlay
      await loadOrders(true);
      // Show notification toast ONLY AFTER whole loading completes!
      showToast(`Order #${orderId} status updated to ${newStatus}`);
    } catch (err) {
      console.warn('Status change error:', err);
      showToast(`Failed to update status for order #${orderId}`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');

  // Sorting - Newest orders first by default
  const [sortField, setSortField] = useState<keyof Order>('date');
  const [sortAsc, setSortAsc] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected Order for details drawer
  const [detailedOrder, setDetailedOrder] = useState<Order | null>(null);

  // Escape key down to close detailed order drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDetailedOrder(null);
      }
    };
    if (detailedOrder) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [detailedOrder]);

  // Sorting handler
  const handleSort = (field: keyof Order) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Filter Orders
  const filteredOrders = activeOrders.filter((o) => {
    const custName = o.address?.name || 'Customer';
    const email = o.customerEmail || '';
    const phone = o.address?.phone || '';
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      custName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    const matchesPayment = paymentFilter === 'All' || o.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Precise timestamp extractor so newest orders are ALWAYS first at the top
  const getOrderTimestamp = (o: any): number => {
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

  // Sorted list with newest orders first by default
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortField === 'date') {
      const timeA = getOrderTimestamp(a);
      const timeB = getOrderTimestamp(b);
      if (timeA !== timeB) {
        return sortAsc ? timeA - timeB : timeB - timeA;
      }
      const idA = String(a._id || a.id);
      const idB = String(b._id || b.id);
      return sortAsc ? idA.localeCompare(idB) : idB.localeCompare(idA);
    }

    let valA = a[sortField];
    let valB = b[sortField];

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    return 0;
  });

  // Paginated list
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);

  // CSV Export
  const handleCSVExport = () => {
    const flatOrders = sortedOrders.map((o) => ({
      orderId: o.id,
      customerName: o.address?.name || 'Customer',
      customerEmail: o.customerEmail || 'customer@ecommerce.com',
      phone: o.address?.phone || 'N/A',
      date: o.date,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      orderStatus: o.status,
      shippingMethod: o.shippingMethod,
      trackingId: o.trackingId || '',
      courierCompany: o.courierCompany || '',
      totalAmount: o.total
    }));

    if (flatOrders.length === 0) {
      showToast('No orders available to export.');
      return;
    }

    const headers = Object.keys(flatOrders[0]).join(',');
    const rows = flatOrders.map((item) =>
      Object.values(item)
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CE_orders_registry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Drawer forms staging states
  const [courier, setCourier] = useState('');
  const [trackNum, setTrackNum] = useState('');
  const [trackUrl, setTrackUrl] = useState('');
  const [estDelivery, setEstDelivery] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedItemIdx, setSelectedItemIdx] = useState<number>(0);
  const [selectedImgIdx, setSelectedImgIdx] = useState<number>(0);
  const [isImgZoomed, setIsImgZoomed] = useState<boolean>(false);

  const openDetailsDrawer = (order: Order) => {
    setDetailedOrder(order);
    setSelectedItemIdx(0);
    setSelectedImgIdx(0);
    setIsImgZoomed(false);
    setCourier(order.courierCompany || '');
    setTrackNum(order.trackingId || '');
    setTrackUrl(order.trackingUrl || '');
    setEstDelivery(order.estimatedDelivery || '');
    setAdminNotes(order.adminNotes || '');
  };

  const handleUpdateShipping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailedOrder) return;

    updateOrderDetails(detailedOrder.id, {
      courierCompany: courier.trim(),
      trackingId: trackNum.trim(),
      trackingUrl: trackUrl.trim(),
      estimatedDelivery: estDelivery,
      adminNotes: adminNotes.trim()
    });

    addOrderTimelineEvent(
      detailedOrder.id,
      detailedOrder.status,
      `Shipping details updated: ${courier || 'N/A'} - ${trackNum || 'N/A'}`
    );

    // Refresh state in drawer
    const refreshed = {
      ...detailedOrder,
      courierCompany: courier.trim(),
      trackingId: trackNum.trim(),
      trackingUrl: trackUrl.trim(),
      estimatedDelivery: estDelivery,
      adminNotes: adminNotes.trim()
    };
    setDetailedOrder(refreshed);
    showToast('Shipping tracking updated successfully.');
  };

  const handleTimelineEventAdd = (notesText: string) => {
    if (!detailedOrder || !notesText.trim()) return;
    addOrderTimelineEvent(detailedOrder.id, detailedOrder.status, notesText.trim());
    
    // Refresh timeline list
    const updatedTimeline = detailedOrder.timeline ? [...detailedOrder.timeline] : [];
    updatedTimeline.push({
      status: detailedOrder.status,
      date: new Date().toLocaleString('en-IN'),
      notes: notesText.trim()
    });
    setDetailedOrder({ ...detailedOrder, timeline: updatedTimeline });
  };

  const [customEventNote, setCustomEventNote] = useState('');

  // RENDER DEDICATED FULL-PAGE ORDER DETAILS VIEW WHEN AN ORDER IS SELECTED
  if (detailedOrder) {
    const items = Array.isArray(detailedOrder.items)
      ? detailedOrder.items
      : typeof detailedOrder.items === 'string'
        ? (() => { try { return JSON.parse(detailedOrder.items); } catch { return []; } })()
        : [];

    const selectedItem = items[selectedItemIdx] || items[0] || {};
    const selectedProd = selectedItem.product || selectedItem || {};
    const rawImgs: string[] = Array.isArray(selectedProd.imgs) && selectedProd.imgs.length > 0
      ? selectedProd.imgs
      : selectedProd.img
      ? [selectedProd.img]
      : selectedItem.img
      ? [selectedItem.img]
      : [];
    const activeImg = rawImgs[selectedImgIdx] || rawImgs[0] || '';

    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setDetailedOrder(null);
                setSelectedItemIdx(0);
                setSelectedImgIdx(0);
                setIsImgZoomed(false);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs cursor-pointer min-h-[38px]"
            >
              <ArrowLeft size={14} /> Back to Orders Registry
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">/</span>
              <span className="font-mono font-bold text-slate-900">{detailedOrder.id}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setInvoiceOrder(detailedOrder)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs cursor-pointer min-h-[38px]"
            >
              <Printer size={14} /> View &amp; Print Tax Invoice
            </button>
          </div>
        </div>

        {/* Order Header Summary Banner */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 font-display">
                Order #{detailedOrder.id}
              </h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                detailedOrder.status === 'Delivered'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : detailedOrder.status === 'Cancelled'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : (detailedOrder.status === 'Shipped' || (detailedOrder.status as any) === 'Dispatched')
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {detailedOrder.status}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Placed on {detailedOrder.date} • Payment Method: {detailedOrder.paymentMethod} ({detailedOrder.paymentStatus})
            </p>
          </div>

          {/* Quick status updater dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Update Status:</span>
            <select
              value={detailedOrder.status}
              disabled={updatingOrderId === detailedOrder.id}
              onChange={(e) => handleStatusChange(detailedOrder.id, detailedOrder._id, e.target.value)}
              className="border border-slate-200 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 outline-none cursor-pointer focus:border-slate-400 min-h-[38px] shadow-xs"
            >
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Processing">Processing</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* 2-Column Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── LEFT COLUMN: STICKY PRODUCT HERO & VERTICAL THUMBNAILS (50% Width) ── */}
          <div className="lg:col-span-6 xl:col-span-6 lg:sticky lg:top-4 self-start space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              
              {/* Gallery Header Bar */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Product Visualizer
                  </span>
                  {rawImgs.length > 1 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                      {Math.min(selectedImgIdx + 1, rawImgs.length)} / {rawImgs.length}
                    </span>
                  )}
                </div>
                {rawImgs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsImgZoomed(!isImgZoomed)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-950 flex items-center gap-1 cursor-pointer py-1 px-2.5 rounded-lg hover:bg-slate-100 transition-colors"
                    title={isImgZoomed ? "Reset view" : "Zoom view"}
                  >
                    {isImgZoomed ? <ZoomOut size={14} /> : <ZoomIn size={14} />}
                    <span className="text-[11px] font-bold">{isImgZoomed ? 'Reset' : 'Zoom'}</span>
                  </button>
                )}
              </div>

              {/* Gallery Stage: Left-most Vertical Thumbnails + Right Full Hero View */}
              <div className="flex gap-3 items-start">
                {/* Left-most Vertical Thumbnails Stacked One Below the Other */}
                {(rawImgs.length > 1 || items.length > 1) && (
                  <div className="flex flex-col gap-2 overflow-y-auto max-h-[340px] sm:max-h-[400px] scrollbar-thin pr-1.5 shrink-0">
                    {/* Product multiple images */}
                    {rawImgs.map((imgUrl, imgIdx) => {
                      const isSelected = imgIdx === selectedImgIdx;
                      return (
                        <button
                          key={imgIdx}
                          type="button"
                          onClick={() => {
                            setSelectedImgIdx(imgIdx);
                            setIsImgZoomed(false);
                          }}
                          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-slate-50 border p-1 flex items-center justify-center transition-all cursor-pointer relative overflow-hidden group ${
                            isSelected
                              ? 'border-slate-950 ring-2 ring-slate-950/20 shadow-xs'
                              : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                          }`}
                          aria-label={`View image ${imgIdx + 1}`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Thumbnail ${imgIdx + 1}`}
                            className="w-full h-full object-contain mix-blend-multiply transition-transform group-hover:scale-105"
                          />
                        </button>
                      );
                    })}

                    {/* Multi-item order other products */}
                    {items.length > 1 && (
                      <>
                        <div className="h-px bg-slate-200 my-1 w-full" />
                        {items.map((it: any, itIdx: number) => {
                          if (itIdx === selectedItemIdx) return null;
                          const itProd = it.product || it || {};
                          const itImg = itProd.imgs?.[0] || itProd.img || it.img;
                          return (
                            <button
                              key={`item-${itIdx}`}
                              type="button"
                              title={`Switch to ${itProd.name || `Item ${itIdx + 1}`}`}
                              onClick={() => {
                                setSelectedItemIdx(itIdx);
                                setSelectedImgIdx(0);
                                setIsImgZoomed(false);
                              }}
                              className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-slate-50 border border-dashed border-slate-300 hover:border-slate-950 p-1 flex items-center justify-center transition-all cursor-pointer relative overflow-hidden group opacity-60 hover:opacity-100"
                            >
                              {itImg ? (
                                <img
                                  src={itImg}
                                  alt={itProd.name}
                                  className="w-full h-full object-contain mix-blend-multiply transition-transform group-hover:scale-105"
                                />
                              ) : (
                                <Package size={16} className="text-slate-400" />
                              )}
                              <span className="absolute bottom-0.5 right-0.5 bg-slate-900 text-white text-[8px] font-bold px-0.5 rounded">
                                #{itIdx + 1}
                              </span>
                            </button>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}

                {/* Main Full View Stage */}
                <div className="flex-1 min-w-0">
                  <div className="aspect-square bg-slate-50/80 border border-slate-200 rounded-xl flex items-center justify-center p-4 relative overflow-hidden group select-none">
                    {activeImg ? (
                      <img
                        src={activeImg}
                        alt={selectedProd.name || 'Product Image'}
                        className={`w-full h-full object-contain mix-blend-multiply transition-all duration-300 ${
                          isImgZoomed ? 'scale-135 cursor-zoom-out' : 'scale-100 group-hover:scale-105 cursor-zoom-in'
                        }`}
                        onClick={() => setIsImgZoomed(!isImgZoomed)}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                        <Package size={40} strokeWidth={1.5} />
                        <span className="text-xs font-medium">No Image</span>
                      </div>
                    )}

                    {/* Category Badge */}
                    {selectedProd.cat && (
                      <span className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-xs border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-700 shadow-2xs">
                        {selectedProd.cat}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Selected Item Information Strip */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2.5">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Focused Product SKU: {selectedProd.sku || selectedItem.sku || 'N/A'}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {selectedProd.name || selectedItem.title || 'Product Item'}
                  </h3>
                </div>

                <div className="flex items-center justify-between bg-slate-50 rounded-lg p-2.5 border border-slate-100 text-xs">
                  <div className="text-slate-600">
                    <span>Qty: <strong className="text-slate-900 font-bold">{selectedItem.quantity || 1}</strong></span>
                    <span className="mx-2">•</span>
                    <span>Unit: <strong className="text-slate-900 font-bold font-mono">₹{selectedProd.price || selectedItem.unitPrice || selectedItem.price || 0}</strong></span>
                  </div>
                  <span className="text-sm font-black font-mono text-slate-950">
                    ₹{((selectedItem.quantity || 1) * (selectedProd.price || selectedItem.unitPrice || selectedItem.price || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* ── RIGHT COLUMN: ALL ORDER DETAILS & FULFILLMENT (50% Width) ── */}
          <div className="lg:col-span-6 xl:col-span-6 space-y-6 flex flex-col">
            {/* Ordered Products Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Ordered Items ({items.length})</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Click any row to view product photos on the left</p>
                </div>
                <span className="text-xs font-mono text-slate-500">Order Ref: {detailedOrder.id}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-4">Item Details</th>
                      <th className="py-2.5 px-4 w-[110px]">SKU</th>
                      <th className="py-2.5 px-4 text-center w-[70px]">Qty</th>
                      <th className="py-2.5 px-4 text-right w-[100px]">Unit Price</th>
                      <th className="py-2.5 px-4 text-right w-[110px]">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item: any, idx: number) => {
                      const prod = item.product || item || {};
                      const unitPrice = prod.price || item.unitPrice || (item.totalPrice && item.quantity ? Math.round(item.totalPrice / item.quantity) : 0);
                      const qty = item.quantity || 1;
                      const lineTotal = item.totalPrice || (unitPrice * qty);
                      const isFocus = idx === selectedItemIdx;

                      return (
                        <tr
                          key={idx}
                          onClick={() => {
                            setSelectedItemIdx(idx);
                            setSelectedImgIdx(0);
                            setIsImgZoomed(false);
                          }}
                          className={`transition-colors cursor-pointer ${
                            isFocus ? 'bg-slate-50/90 font-medium ring-1 ring-inset ring-slate-950/10' : 'hover:bg-slate-50/50'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                {prod.imgs && prod.imgs.length > 0 ? (
                                  <img src={prod.imgs[0]} alt="" className="w-full h-full object-cover" />
                                ) : prod.img || item.img ? (
                                  <img src={prod.img || item.img} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Package size={18} className="text-slate-400" />
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block">{prod.name || item.title || 'Product'}</span>
                                <span className="text-[11px] text-slate-500">{prod.cat || 'Home Care'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500">{prod.sku || item.sku || 'CE-SKU'}</td>
                          <td className="py-3 px-4 text-center font-bold text-slate-900">{qty}</td>
                          <td className="py-3 px-4 text-right font-mono text-slate-700">₹{unitPrice}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">₹{lineTotal}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Shipping & Delivery Fulfillment Form Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Fulfillment &amp; Tracking Configuration</h3>
                  <p className="text-xs text-slate-500">Assign courier logistics and dispatch tracking identifiers</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-md text-slate-700 border border-slate-200">
                  {detailedOrder.shippingMethod || 'Standard Delivery'}
                </span>
              </div>

              <form onSubmit={handleUpdateShipping} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Courier Company / Partner</label>
                  <select
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-200 outline-none bg-white text-slate-900 min-h-[40px] cursor-pointer"
                  >
                    <option value="">Select Courier Partner</option>
                    <option value="Delhivery">Delhivery Logistics</option>
                    <option value="Blue Dart">Blue Dart Express</option>
                    <option value="DTDC">DTDC Courier</option>
                    <option value="Shadowfax">Shadowfax Prime</option>
                    <option value="Standard Courier">Standard In-House Fleet</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Consignment / Tracking Number (AWB)</label>
                  <input
                    type="text"
                    placeholder="e.g. DEL-982347102"
                    value={trackNum}
                    onChange={(e) => setTrackNum(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-200 outline-none font-mono bg-white text-slate-900 min-h-[40px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Tracking Web URL</label>
                  <input
                    type="text"
                    placeholder="https://track.courier.in/..."
                    value={trackUrl}
                    onChange={(e) => setTrackUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-200 outline-none font-mono bg-white text-slate-900 min-h-[40px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Estimated Delivery Date</label>
                  <input
                    type="date"
                    value={estDelivery}
                    onChange={(e) => setEstDelivery(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-200 outline-none bg-white text-slate-900 min-h-[40px]"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-semibold text-slate-700">Internal Operational Notes</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Packed in reinforced eco box. Customer requested doorstep call."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-200 outline-none bg-white text-slate-900 resize-none"
                  />
                </div>

                <div className="sm:col-span-2 flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-slate-950 text-white rounded-lg hover:bg-slate-800 transition-colors font-semibold text-xs shadow-xs min-h-[40px] cursor-pointer"
                  >
                    Save Logistics &amp; Notify Customer
                  </button>
                </div>
              </form>
            </div>

            {/* Customer Information & Address Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 text-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <User size={16} className="text-slate-500" />
                <h4 className="font-bold text-slate-900">Customer &amp; Shipping Destination</h4>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Recipient Name</span>
                <span className="font-bold text-slate-900 text-sm block mt-0.5">{detailedOrder.address?.name || 'Customer'}</span>
              </div>

              <div className="space-y-1 text-slate-600">
                <p>{detailedOrder.address?.street || detailedOrder.address?.addressLine1}</p>
                <p>{detailedOrder.address?.city}, {detailedOrder.address?.state} - {detailedOrder.address?.pincode}</p>
                <p className="font-mono text-slate-700 pt-1">Phone: {detailedOrder.address?.phone || 'N/A'}</p>
                <p className="font-mono text-slate-700">Email: {detailedOrder.customerEmail || 'customer@ecommerce.com'}</p>
              </div>
            </div>

            {/* Financial Breakdown Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 text-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <CreditCard size={16} className="text-slate-500" />
                <h4 className="font-bold text-slate-900">Financial Breakdown</h4>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Items Subtotal</span>
                  <span className="font-mono font-semibold text-slate-900">₹{detailedOrder.subtotal || detailedOrder.total}</span>
                </div>
                {detailedOrder.discount && detailedOrder.discount > 0 ? (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount Deduction</span>
                    <span className="font-mono font-semibold">-₹{detailedOrder.discount}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-slate-600">
                  <span>Taxes (GST 18%)</span>
                  <span className="font-mono font-semibold text-slate-900">₹{detailedOrder.taxes || Math.round((detailedOrder.subtotal || detailedOrder.total) * 0.18)}</span>
                </div>
                <div className="flex justify-between text-slate-600 border-b border-slate-100 pb-2">
                  <span>Shipping &amp; Logistics</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {detailedOrder.shippingCharge && detailedOrder.shippingCharge > 0 ? `₹${detailedOrder.shippingCharge}` : 'Free'}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="font-bold text-slate-900 text-sm">Grand Total</span>
                  <span className="font-mono font-extrabold text-slate-950 text-xl">₹{detailedOrder.total}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-2.5 rounded-lg mt-2">
                  <span className="text-slate-600 font-medium">Payment Settlement:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {detailedOrder.paymentStatus} ({detailedOrder.paymentMethod})
                  </span>
                </div>
              </div>
            </div>

            {/* Order Timeline & Audit Trail Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 text-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Clock size={16} className="text-slate-500" />
                <h4 className="font-bold text-slate-900">Order Audit Timeline</h4>
              </div>

              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                {detailedOrder.timeline && detailedOrder.timeline.length > 0 ? (
                  detailedOrder.timeline.map((event: any, idx: number) => (
                    <div key={idx} className="relative pl-5 border-l-2 border-slate-200 pb-3 last:border-none last:pb-0">
                      <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-slate-900" />
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 capitalize">{event.status}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{event.date}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{event.notes}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-xs italic">No timeline entries logged.</p>
                )}
              </div>

              {/* Add Custom Timeline Note */}
              <div className="pt-2 border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  placeholder="Add operational note..."
                  value={customEventNote}
                  onChange={(e) => setCustomEventNote(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-slate-400 bg-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customEventNote.trim()) {
                      handleTimelineEventAdd(customEventNote);
                      setCustomEventNote('');
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                >
                  Post Note
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fulfillment & Operations</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            <span className="text-xs text-slate-400">{activeOrders.length} Recorded Orders</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 font-display">
            Orders Fulfillment Registry
          </h1>
        </div>
        <button
          onClick={handleCSVExport}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-xs transition-colors min-h-[38px] cursor-pointer"
        >
          <FileDown size={14} />
          <span>Export Orders CSV</span>
        </button>
      </div>

      {/* Stats Summary Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
            <Calendar size={16} />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block leading-tight">Total Volume</span>
            <span className="text-xl font-bold text-slate-950 leading-none mt-1 block">{activeOrders.length}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
            <Truck size={16} />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block leading-tight">Pending Dispatch</span>
            <span className="text-xl font-bold text-slate-950 leading-none mt-1 block">
              {activeOrders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled' && o.status !== 'Returned' && o.status !== 'Refunded').length}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckSquare size={16} />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block leading-tight">Delivered Orders</span>
            <span className="text-xl font-bold text-slate-950 leading-none mt-1 block">
              {activeOrders.filter((o) => o.status === 'Delivered').length}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
            <IndianRupee size={16} />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block leading-tight">Unsettled / COD</span>
            <span className="text-xl font-bold text-slate-950 leading-none mt-1 block">
              {activeOrders.filter((o) => o.paymentStatus === 'Pending' || (o.paymentMethod === 'COD' && o.paymentStatus !== 'Paid')).length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Search orders by ID, customer name, phone, email..."
            className="w-full border border-slate-200 rounded-lg bg-white pl-10 pr-4 py-2 text-xs outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 placeholder:text-slate-400 min-h-[40px] text-slate-900"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status dropdown */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            className="border border-slate-200 rounded-lg bg-white px-3 py-2 text-xs outline-none cursor-pointer focus:border-slate-900 text-slate-700 font-medium min-h-[40px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All fulfillment statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Packed">Packed</option>
            <option value="Ready for Dispatch">Ready for dispatch</option>
            <option value="Shipped">Shipped</option>
            <option value="Out for Delivery">Out for delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Returned">Returned</option>
            <option value="Refunded">Refunded</option>
          </select>
 
          {/* Payment dropdown */}
          <select
            className="border border-slate-200 rounded-lg bg-white px-3 py-2 text-xs outline-none cursor-pointer focus:border-slate-900 text-slate-700 font-medium min-h-[40px]"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="All">All payment states</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending / Unpaid</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto w-full scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 select-none sticky top-0 z-10">
                <th className="py-3 px-4 whitespace-nowrap cursor-pointer hover:text-slate-950" onClick={() => handleSort('id')}>
                  Order Ref {sortField === 'id' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 whitespace-nowrap">Customer Info</th>
                <th className="py-3 px-4 whitespace-nowrap cursor-pointer hover:text-slate-950" onClick={() => handleSort('date')}>
                  Date {sortField === 'date' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 text-right whitespace-nowrap cursor-pointer hover:text-slate-950" onClick={() => handleSort('total')}>
                  Amount {sortField === 'total' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Payment</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Fulfillment Status</th>
                <th className="py-3 px-4 whitespace-nowrap">Shipping</th>
                <th className="py-3 px-4 whitespace-nowrap">Tracking ID</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Invoice</th>
                <th className="py-3 px-5 text-right whitespace-nowrap">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 select-none">
                      <RunningTruckParcel size="md" />
                      <p className="text-xs font-semibold text-slate-500 tracking-wide">Syncing order registry records...</p>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length > 0 ? (
                currentItems.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/75 transition-colors">
                    {/* ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-950 whitespace-nowrap">{o.id}</td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{o.address?.name || 'Customer'}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                        {o.customerEmail}<br />
                        {o.address?.phone}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">{o.date}</td>

                    {/* Total */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-950 whitespace-nowrap">
                      ₹{o.total.toLocaleString('en-IN')}
                    </td>

                    {/* Payment status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                        o.paymentStatus === 'Paid'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : o.paymentStatus === 'Pending'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        {o.paymentStatus}
                      </span>
                    </td>

                    {/* Order status dropdown */}
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col items-center justify-center min-w-[130px]">
                        {Boolean(updatingOrderId && (updatingOrderId === o.id || updatingOrderId === o._id)) ? (
                          <RunningTruckParcel size="sm" />
                        ) : null}
                        <select
                          disabled={Boolean(updatingOrderId && (updatingOrderId === o.id || updatingOrderId === o._id))}
                          className={`border rounded-lg px-2.5 py-1 text-xs font-semibold outline-none cursor-pointer shadow-xs transition-colors ${
                            o.status === 'Delivered'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : o.status === 'Cancelled' || o.status === 'Returned' || o.status === 'Refunded'
                              ? 'bg-rose-50 border-rose-200 text-rose-800'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                          value={o.status}
                          onChange={(e) => handleStatusChange(o.id, o._id, e.target.value as any)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Packed">Packed</option>
                          <option value="Ready for Dispatch">Ready for dispatch</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Out for Delivery">Out for delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Returned">Returned</option>
                          <option value="Refunded">Refunded</option>
                        </select>
                      </div>
                    </td>

                    {/* Shipping Method */}
                    <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">{o.shippingMethod || 'Standard'}</td>

                    {/* Tracking ID */}
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600 truncate max-w-[130px] whitespace-nowrap" title={o.trackingId}>
                      {o.trackingId || '—'}
                    </td>

                    {/* Invoice Generator */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setInvoiceOrder(o)}
                        className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-xs cursor-pointer min-h-[30px] min-w-[30px] inline-flex items-center justify-center transition-colors"
                        title="Print Executive Invoice"
                      >
                        <Printer size={14} />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <button
                        onClick={() => openDetailsDrawer(o)}
                        className="text-xs font-semibold px-3 py-1.5 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 rounded-lg shadow-xs transition-colors cursor-pointer min-h-[30px]"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-500 text-xs">
                    <span>No orders found matching the filter criteria.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Row */}
        {totalPages > 1 && (
          <div className="bg-slate-50/50 border-t border-slate-200 px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs select-none">
            <span className="text-slate-500">
              Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredOrders.length)} of {filteredOrders.length} orders
            </span>
            <div className="flex items-center gap-1.5 font-mono">
              <button
                onClick={() => setCurrentPage((c) => Math.max(c - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed shadow-xs"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1.5 border rounded-lg cursor-pointer shadow-xs transition-colors ${
                    currentPage === i + 1
                      ? 'bg-slate-950 text-white border-slate-950 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((c) => Math.min(c + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed shadow-xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersRegistry;
