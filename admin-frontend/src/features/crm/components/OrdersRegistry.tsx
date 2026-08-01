import React, { useState, useEffect } from 'react';
import { useApp } from '../../../core/context/AppContext';
import type { Order } from '../../../core/types';
import {
  Search,
  FileDown,
  Printer,
  Truck,
  Calendar,
  IndianRupee,
  X,
  CheckSquare
} from 'lucide-react';


const OrdersRegistry: React.FC = () => {
  const {
    orders,
    updateOrderStatus,
    updateOrderDetails,
    addOrderTimelineEvent,
    showToast,
    setInvoiceOrder
  } = useApp();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');

  // Sorting
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
      setSortAsc(true);
    }
  };

  // Filter Orders
  const filteredOrders = orders.filter((o) => {
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

  // Sorted list
  const sortedOrders = [...filteredOrders].sort((a, b) => {
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
      customerEmail: o.customerEmail || 'customer@cleaneveryday.in',
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

  const openDetailsDrawer = (order: Order) => {
    setDetailedOrder(order);
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

  return (
    <div className="animate-fadeIn">
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div>
          <h2 className="font-display text-2xl font-semibold text-blk tracking-tight">Orders registry</h2>
          <p className="text-sm text-mut">Review completed customer checkout sessions and delivery dispatches.</p>
        </div>
        <button
          onClick={handleCSVExport}
          className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 border border-bdr text-mid bg-wht hover:border-primary hover:text-primary rounded shadow-premium-sm cursor-pointer"
        >
          <FileDown size={14} /> Export orders CSV
        </button>
      </div>

      {/* Stats Summary Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-wht border border-bdrl rounded-xl p-4 shadow-premium-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-primary-soft flex items-center justify-center text-primary shrink-0"><Calendar size={16} /></div>
          <div>
            <span className="text-xs text-mut font-medium block leading-none mb-1">Total orders</span>
            <span className="text-xl font-bold text-blk leading-none">{orders.length}</span>
          </div>
        </div>

        <div className="bg-wht border border-bdrl rounded-xl p-4 shadow-premium-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-yellow-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0"><Truck size={16} /></div>
          <div>
            <span className="text-xs text-mut font-medium block leading-none mb-1">Pending dispatch</span>
            <span className="text-xl font-bold text-blk leading-none">
              {orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled').length}
            </span>
          </div>
        </div>

        <div className="bg-wht border border-bdrl rounded-xl p-4 shadow-premium-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-primary-soft flex items-center justify-center text-primary shrink-0"><CheckSquare size={16} /></div>
          <div>
            <span className="text-xs text-mut font-medium block leading-none mb-1">Delivered</span>
            <span className="text-xl font-bold text-blk leading-none">
              {orders.filter((o) => o.status === 'Delivered').length}
            </span>
          </div>
        </div>

        <div className="bg-wht border border-bdrl rounded-xl p-4 shadow-premium-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-primary-soft flex items-center justify-center text-primary shrink-0"><IndianRupee size={16} /></div>
          <div>
            <span className="text-xs text-mut font-medium block leading-none mb-1">Unpaid (COD)</span>
            <span className="text-xl font-bold text-blk leading-none">
              {orders.filter((o) => o.paymentStatus === 'Pending').length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-wht border border-bdrl rounded-xl p-4 shadow-premium-sm mb-6 flex flex-col md:flex-row md:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fnt" size={14} />
          <input
            type="text"
            placeholder="Search orders by ID, customer name, phone, email..."
            className="w-full border border-bdr rounded bg-wht pl-9 pr-4 py-2 text-sm outline-none focus:border-primary placeholder:text-mut/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status dropdown */}
        <div className="flex flex-col gap-1 min-w-[120px]">
          <label className="text-xs font-medium text-mut">Order status</label>
          <select
            className="border border-bdr rounded bg-wht px-3 py-2 text-sm outline-none cursor-pointer focus:border-primary text-mid font-medium"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All statuses</option>
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
 
        {/* Payment dropdown */}
        <div className="flex flex-col gap-1 min-w-[120px]">
          <label className="text-xs font-medium text-mut">Payment status</label>
          <select
            className="border border-bdr rounded bg-wht px-3 py-2 text-sm outline-none cursor-pointer focus:border-primary text-mid font-medium"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="All">All payments</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending / unpaid</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-wht border border-bdrl rounded-xl shadow-premium-sm overflow-hidden mb-6">
        <div className="overflow-x-auto w-full scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-sur border-b border-bdrl text-xs font-medium text-mut select-none sticky top-0 z-10">
                <th className="py-3 px-4 whitespace-nowrap cursor-pointer hover:text-blk" onClick={() => handleSort('id')}>
                  Order ID {sortField === 'id' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 whitespace-nowrap">Customer</th>
                <th className="py-3 px-4 whitespace-nowrap cursor-pointer hover:text-blk" onClick={() => handleSort('date')}>
                  Date {sortField === 'date' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 text-right whitespace-nowrap cursor-pointer hover:text-blk" onClick={() => handleSort('total')}>
                  Amount {sortField === 'total' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Payment</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Status</th>
                <th className="py-3 px-4 whitespace-nowrap">Shipping</th>
                <th className="py-3 px-4 whitespace-nowrap">Tracking</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Invoice</th>
                <th className="py-3 px-5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bdrl text-sm">
              {currentItems.length > 0 ? (
                currentItems.map((o) => (
                  <tr key={o.id} className="hover:bg-sur/10 transition-colors">
                    {/* ID */}
                    <td className="py-3 px-4 font-mono font-semibold text-blk whitespace-nowrap">{o.id}</td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-blk">{o.address?.name || 'Customer'}</div>
                      <div className="text-xs text-mut mt-0.5 leading-normal">
                        {o.customerEmail}<br />
                        {o.address?.phone}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-sm text-mid whitespace-nowrap">{o.date}</td>

                    {/* Total */}
                    <td className="py-3 px-4 text-right font-semibold text-blk whitespace-nowrap">₹{o.total}</td>

                    {/* Payment status */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                        o.paymentStatus === 'Paid'
                          ? 'bg-primary-soft text-primary'
                          : o.paymentStatus === 'Pending'
                          ? 'bg-yellow-50 text-amber-700'
                          : 'bg-red-bg text-red'
                      }`}>
                        {o.paymentStatus}
                      </span>
                    </td>

                    {/* Order status dropdown */}
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <select
                        className={`border rounded px-2 py-1.5 text-sm font-medium outline-none cursor-pointer ${
                          o.status === 'Delivered'
                            ? 'bg-primary-soft border-primary-light text-primary'
                            : o.status === 'Cancelled'
                            ? 'bg-red-bg border-red/10 text-red'
                            : 'bg-wht border-bdr text-mid'
                        }`}
                        value={o.status}
                        onChange={(e) => updateOrderStatus(o.id, e.target.value as any)}
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
                    </td>

                    {/* Shipping Method */}
                    <td className="py-3 px-4 text-mid font-medium whitespace-nowrap">{o.shippingMethod || 'Standard'}</td>

                    {/* Tracking ID */}
                    <td className="py-3 px-4 font-mono text-xs text-mid truncate max-w-[130px] whitespace-nowrap" title={o.trackingId}>
                      {o.trackingId || '—'}
                    </td>

                    {/* Invoice Generator */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setInvoiceOrder(o)}
                        className="p-1 border border-bdr rounded bg-wht text-mid hover:text-primary hover:border-primary cursor-pointer"
                        title="Open Invoice Generator"
                      >
                        <Printer size={13} />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-5 text-right">
                      <button
                        onClick={() => openDetailsDrawer(o)}
                        className="text-sm font-medium px-3 py-1.5 border border-bdr text-mid bg-wht hover:border-primary hover:text-primary rounded cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-14 text-center text-fnt text-xs">
                    <span>No orders found matching the filter.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Row */}
        {totalPages > 1 && (
          <div className="bg-sur border-t border-bdrl px-5 py-4 flex items-center justify-between font-mono text-[0.72rem] select-none">
            <span className="text-mut">
              Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredOrders.length)} of {filteredOrders.length} orders
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setCurrentPage((c) => Math.max(c - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 border border-bdr rounded bg-wht hover:border-primary disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1.5 border rounded cursor-pointer ${
                    currentPage === i + 1
                      ? 'bg-primary text-wht border-primary font-bold'
                      : 'bg-wht border-bdr text-mid hover:border-primary'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((c) => Math.min(c + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 border border-bdr rounded bg-wht hover:border-primary disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>



      {/* Expanded Order Details Drawer Overlay */}
      {detailedOrder && (
        <div 
          className="fixed inset-0 z-[1000] flex justify-end bg-blk/60 backdrop-blur-xs animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDetailedOrder(null);
            }
          }}
        >
          <div
            className="bg-wht border-l border-bdr shadow-premium-xl w-full max-w-[620px] h-full overflow-y-auto p-6 sm:p-8 flex flex-col justify-between"
          >
            {/* Header */}
                <div className="flex justify-between items-center border-b border-bdrl pb-3.5 mb-5 select-none">
                <div>
                  <span className="text-xs font-semibold text-mut">Order registry details</span>
                  <h3 className="font-display text-lg font-semibold text-blk mt-0.5">{detailedOrder.id}</h3>
                </div>
                <button
                  onClick={() => setDetailedOrder(null)}
                  className="p-1 rounded-full hover:bg-sur text-mut hover:text-blk cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
 
              {/* Order Info Summary Details */}
              <div className="flex flex-col gap-5 text-sm">
                {/* General Metadata */}
                <div className="grid grid-cols-2 gap-4 bg-sur/50 p-4 rounded border border-bdrl">
                  <div>
                    <span className="text-mut text-xs block">Order date</span>
                    <span className="font-bold text-blk">{detailedOrder.date}</span>
                  </div>
                  <div>
                    <span className="text-mut text-xs block">Payment method / status</span>
                    <span className="font-bold text-blk uppercase">{detailedOrder.paymentMethod} • {detailedOrder.paymentStatus}</span>
                  </div>
                  <div>
                    <span className="text-mut text-xs block">Shipping method</span>
                    <span className="font-bold text-blk">{detailedOrder.shippingMethod}</span>
                  </div>
                  <div>
                    <span className="text-mut text-xs block">Grand total amount</span>
                    <span className="font-semibold text-primary text-sm">₹{detailedOrder.total}</span>
                  </div>
 
                  <div className="col-span-2 border-t border-bdrl pt-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setInvoiceOrder(detailedOrder)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 border border-bdr hover:border-primary text-mid hover:text-primary bg-wht rounded cursor-pointer transition-colors shadow-premium-sm"
                    >
                      <Printer size={13} /> View & download invoice PDF
                    </button>
                  </div>
                </div>                  {/* Customer Addresses */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-semibold text-mut block mb-1">Shipping destination</span>
                    <p className="text-xs text-mid font-medium">
                      <strong>{detailedOrder.address?.name}</strong><br />
                      {detailedOrder.address?.street}<br />
                      {detailedOrder.address?.city}, {detailedOrder.address?.state} - {detailedOrder.address?.pincode}<br />
                      Phone: {detailedOrder.address?.phone}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-mut block mb-1">Billing destination</span>
                    <p className="text-xs text-mid font-medium">
                      <strong>{detailedOrder.billingAddress?.name || detailedOrder.address?.name}</strong><br />
                      {detailedOrder.billingAddress?.street || detailedOrder.address?.street}<br />
                      {detailedOrder.billingAddress?.city || detailedOrder.address?.city}, {detailedOrder.billingAddress?.state || detailedOrder.address?.state} - {detailedOrder.billingAddress?.pincode || detailedOrder.address?.pincode}
                    </p>
                  </div>
                </div>
 
                {/* Purchased Items List */}
                <div className="border-t border-bdrl pt-4 mt-2">
                  <span className="text-xs font-semibold text-mut block mb-2">Purchased products list</span>
                  <div className="flex flex-col divide-y divide-bdrl border border-bdrl rounded overflow-hidden">
                    {(() => {
                      const items = Array.isArray(detailedOrder.items)
                        ? detailedOrder.items
                        : typeof detailedOrder.items === 'string'
                          ? (() => { try { return JSON.parse(detailedOrder.items); } catch { return []; } })()
                          : [];
                      return items.map((item: any, idx: number) => (
                        <div className="flex justify-between items-center p-3 bg-sur/20 hover:bg-sur/40" key={idx}>
                          <div>
                            <span className="font-bold text-blk block">{item.product?.name}</span>
                            <span className="text-xs text-mut block">SKU: {item.product?.sku} • Qty: {item.quantity}</span>
                          </div>
                          <span className="font-semibold text-sm text-blk">₹{(item.product?.price || 0) * item.quantity}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Tracking & Shipping Details Form */}
                <div className="border-t border-bdrl pt-4 mt-2">
                  <span className="text-xs font-semibold text-mut block mb-3">Courier logistics & tracking configuration</span>
                  
                  <form onSubmit={handleUpdateShipping} className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-mut">Courier Company</label>
                      <input
                        type="text"
                        placeholder="BlueDart / Delhivery"
                        className="border border-bdr rounded px-2.5 py-1.5 text-sm outline-none focus:border-primary"
                        value={courier}
                        onChange={(e) => setCourier(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-mut">Tracking Number</label>
                      <input
                        type="text"
                        placeholder="TRK-10029302"
                        className="border border-bdr rounded px-2.5 py-1.5 text-sm outline-none focus:border-primary"
                        value={trackNum}
                        onChange={(e) => setTrackNum(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="text-xs font-semibold text-mut">Tracking URL</label>
                      <input
                        type="url"
                        placeholder="https://www.delhivery.com/track"
                        className="border border-bdr rounded px-2.5 py-1.5 text-sm outline-none focus:border-primary w-full"
                        value={trackUrl}
                        onChange={(e) => setTrackUrl(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-mut">Estimated Delivery Date</label>
                      <input
                        type="date"
                        className="border border-bdr rounded px-2.5 py-1.5 text-sm outline-none focus:border-primary bg-wht"
                        value={estDelivery}
                        onChange={(e) => setEstDelivery(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="text-xs font-semibold text-mut">Internal Admin Notes</label>
                      <textarea
                        rows={2}
                        placeholder="Warehouse packing remarks, customer phone calls logs..."
                        className="border border-bdr rounded px-2.5 py-1.5 text-sm outline-none focus:border-primary w-full resize-none placeholder:text-mut/50"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                      />
                    </div>

                    <div className="sm:col-span-2 pt-1 flex gap-2">
                      <button
                        type="submit"
                        className="bg-primary text-wht rounded px-4 py-2 text-xs font-semibold hover:bg-primary-hover transition-colors cursor-pointer"
                      >
                        Update logistics
                      </button>
                    </div>
                  </form>
                </div>
                {/* Timeline display & logs additions */}
                <div className="border-t border-bdrl pt-4 mt-2">
                  <span className="text-xs font-semibold text-mut block mb-3">Order progress timeline schedule</span>
                  
                  {/* Timeline listing */}
                  <div className="flex flex-col gap-3 relative pl-4 border-l border-bdr mb-4 ml-2">
                    {(detailedOrder.timeline || []).map((t, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[20px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-wht" />
                        <span className="text-xs text-mut block">{t.date}</span>
                        <span className="text-xs font-semibold text-blk inline-block mt-0.5">{t.status}</span>
                        {t.notes && <p className="text-xs text-mid mt-0.5 italic">{t.notes}</p>}
                      </div>
                    ))}
                  </div>
 
                  {/* Add Event */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add manual event log (e.g. Package dispatched)..."
                      className="border border-bdr rounded px-2.5 py-1 text-sm outline-none focus:border-primary flex-1 placeholder:text-mut/50"
                      value={customEventNote}
                      onChange={(e) => setCustomEventNote(e.target.value)}
                    />
                    <button
                      onClick={() => {
                        handleTimelineEventAdd(customEventNote);
                        setCustomEventNote('');
                      }}
                      className="bg-primary text-wht rounded px-3 py-1 text-xs font-semibold cursor-pointer"
                    >
                      Log
                    </button>
                </div>
              </div>
            </div>


          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersRegistry;
