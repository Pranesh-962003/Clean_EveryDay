import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useApp } from '../../../core/context/AppContext';
// @ts-ignore
import { auth } from '../../../../firebase';
import { getSocket } from '../../../core/socket/socket';
import { SOCKET_EVENTS } from '../../../core/socket/socketEvents';
import {
  Search,
  Check,
  X,
  MessageSquare,
  Trash2,
  Star,
  CheckSquare,
  Square,
  Database,
  Monitor,
  Loader2
} from 'lucide-react';

interface ReviewItem {
  id: string;
  _id: string;
  author: string;
  ini: string;
  role: string;
  rating: number;
  body: string;
  product: string;
  status: 'Pending' | 'Approved' | 'Hidden' | 'Rejected';
  approved: boolean;
  date: string;
  reply?: string;
}

// Neat Linear System-to-System Data Transfer Loading Animation Component (Light Blue Theme)
const LinearSystemDataTransferLoader: React.FC = () => (
  <div className="relative flex flex-col items-center justify-center select-none py-4 px-6 w-full max-w-[420px]">
    <style>{`
      @keyframes linearStreamPulse {
        0% { stroke-dashoffset: 60; }
        100% { stroke-dashoffset: 0; }
      }
      @keyframes linearPacketMove {
        0% { transform: translateX(0px); opacity: 0; }
        15% { opacity: 1; }
        85% { opacity: 1; }
        100% { transform: translateX(180px); opacity: 0; }
      }
      @keyframes serverGlow {
        0%, 100% { transform: scale(1); filter: drop-shadow(0 0 3px rgba(2, 132, 199, 0.4)); }
        50% { transform: scale(1.05); filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.85)); }
      }
      @keyframes adminGlow {
        0%, 100% { transform: scale(1); filter: drop-shadow(0 0 3px rgba(2, 132, 199, 0.4)); }
        50% { transform: scale(1.05); filter: drop-shadow(0 0 10px rgba(125, 211, 252, 0.9)); }
      }
    `}</style>

    <div className="relative flex items-center justify-between w-full h-20 px-2">
      {/* SYSTEM A: Backend Database / Server Node */}
      <div 
        className="flex flex-col items-center gap-1 z-10"
        style={{ animation: 'serverGlow 2s ease-in-out infinite' }}
      >
        <div className="w-12 h-12 rounded-xl bg-slate-900 text-sky-400 border border-sky-400/40 flex items-center justify-center shadow-md relative">
          <Database size={22} />
          {/* Active Status Ring */}
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-sky-400 rounded-full border-2 border-wht animate-ping" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-sky-400 rounded-full border-2 border-wht" />
        </div>
        <span className="text-[10px] font-bold text-sky-700/80 tracking-wider uppercase">System A (Server)</span>
      </div>

      {/* LINEAR CONNECTING DATA PIPE */}
      <div className="relative flex-1 mx-4 h-12 flex items-center justify-center">
        {/* Background Track Line */}
        <div className="absolute w-full h-[3px] bg-sky-100/80 rounded-full" />

        {/* Animated Linear Stream Pipeline */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 48" fill="none">
          <defs>
            <linearGradient id="lightBluePipeGrad" x1="0" y1="24" x2="200" y2="24" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0284C7" />
              <stop offset="0.5" stopColor="#38BDF8" />
              <stop offset="1" stopColor="#7DD3FC" />
            </linearGradient>
          </defs>
          <line 
            x1="10" y1="24" x2="190" y2="24" 
            stroke="url(#lightBluePipeGrad)" 
            strokeWidth="3.5" 
            strokeDasharray="10 8" 
            strokeLinecap="round"
            style={{ animation: 'linearStreamPulse 1.2s linear infinite' }}
          />
        </svg>

        {/* Linear Sliding Data Packets (Light Blue Nodes) */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-full flex items-center pointer-events-none">
          <div 
            className="w-3.5 h-3.5 bg-sky-400 rounded-full border-2 border-wht shadow-md shadow-sky-400/50"
            style={{ animation: 'linearPacketMove 1.6s ease-in-out infinite' }}
          />
          <div 
            className="w-3.5 h-3.5 bg-sky-300 rounded-full border-2 border-wht shadow-md shadow-sky-300/50"
            style={{ animation: 'linearPacketMove 1.6s ease-in-out infinite 0.5s' }}
          />
          <div 
            className="w-3.5 h-3.5 bg-sky-200 rounded-full border-2 border-wht shadow-md shadow-sky-200/50"
            style={{ animation: 'linearPacketMove 1.6s ease-in-out infinite 1s' }}
          />
        </div>
      </div>

      {/* SYSTEM B: Admin Console / Dashboard Node */}
      <div 
        className="flex flex-col items-center gap-1 z-10"
        style={{ animation: 'adminGlow 2s ease-in-out infinite 1s' }}
      >
        <div className="w-12 h-12 rounded-xl bg-sky-500 text-wht border border-sky-300 flex items-center justify-center shadow-md relative">
          <Monitor size={22} />
          {/* Receiving Pulse Indicator */}
          <span className="absolute -bottom-1 -left-1 w-3.5 h-3.5 bg-sky-200 rounded-full border-2 border-wht animate-pulse" />
        </div>
        <span className="text-[10px] font-bold text-sky-700/80 tracking-wider uppercase">System B (Admin)</span>
      </div>
    </div>
  </div>
);

const ReviewsModeration: React.FC = () => {
  const { showToast } = useApp();

  const [apiReviews, setApiReviews] = useState<ReviewItem[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const reviews = apiReviews !== null ? apiReviews : [];

  // Load reviews from live backend API
  const loadReviews = useCallback(async (showFullLoader = false) => {
    if (showFullLoader) setIsLoading(true);
    try {
      const firebaseUser = auth.currentUser;
      let token = '';
      if (firebaseUser) {
        token = await firebaseUser.getIdToken();
      }
      const backendUrl = import.meta.env.VITE_BACKEND_URI || 'http://localhost:5002/api';
      const response = await axios.get(`${backendUrl}/auth/admin/admin-reviews`, {
        params: { limit: 1000 },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true
      });

      if (response.data && response.data.success && Array.isArray(response.data.reviews)) {
        const fetched: ReviewItem[] = response.data.reviews.map((r: any, idx: number) => {
          const authorName = r.customer?.name || r.authorName || 'Customer';
          const initials = authorName
            .split(' ')
            .map((w: string) => w[0])
            .join('')
            .toUpperCase()
            .substring(0, 2) || 'C';

          return {
            id: r._id || String(idx + 1),
            _id: r._id,
            author: authorName,
            ini: initials,
            role: r.isVerifiedPurchase ? 'Verified Customer' : 'Customer',
            rating: r.rating || 5,
            body: r.review || r.comment || '',
            product: r.product?.name || r.product?.title || 'HomeCare Product',
            status: r.status || 'Pending',
            approved: r.status === 'Approved',
            date: r.date ? new Date(r.date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
            reply: r.adminReply || ''
          };
        });
        setApiReviews(fetched);
      }
    } catch (err) {
      console.warn('Error fetching admin reviews:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews(true);
    const socket = getSocket();
    const handleReviewEvent = () => {
      loadReviews(false);
    };

    socket.on(SOCKET_EVENTS.REVIEW_CREATED, handleReviewEvent);
    socket.on(SOCKET_EVENTS.REVIEW_UPDATED, handleReviewEvent);
    socket.on(SOCKET_EVENTS.REVIEW_STATUS_UPDATED, handleReviewEvent);
    socket.on(SOCKET_EVENTS.REVIEW_DELETED, handleReviewEvent);

    return () => {
      socket.off(SOCKET_EVENTS.REVIEW_CREATED, handleReviewEvent);
      socket.off(SOCKET_EVENTS.REVIEW_UPDATED, handleReviewEvent);
      socket.off(SOCKET_EVENTS.REVIEW_STATUS_UPDATED, handleReviewEvent);
      socket.off(SOCKET_EVENTS.REVIEW_DELETED, handleReviewEvent);
    };
  }, [loadReviews]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [productFilter, setProductFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Selected for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Reply & Delete Modal State
  const [replyReviewId, setReplyReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);

  // Escape key down to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setReplyReviewId(null);
        setDeleteConfirmId(null);
        setIsBulkDeleteModalOpen(false);
      }
    };
    if (replyReviewId !== null || deleteConfirmId !== null || isBulkDeleteModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [replyReviewId, deleteConfirmId, isBulkDeleteModalOpen]);

  // Products list from reviews
  const productsList = Array.from(new Set(reviews.map((r) => r.product)));

  // Filter Reviews
  const filteredReviews = reviews.filter((r) => {
    const author = r.author || '';
    const body = r.body || '';
    const matchesSearch =
      author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      body.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRating = ratingFilter === 'All' || String(r.rating) === ratingFilter;
    const matchesProduct = productFilter === 'All' || r.product === productFilter;
    
    // Status resolution
    const actualStatus = r.status || (r.approved ? 'Approved' : 'Pending');
    const matchesStatus = statusFilter === 'All' || actualStatus === statusFilter;

    return matchesSearch && matchesRating && matchesProduct && matchesStatus;
  });

  const handleSelectAll = () => {
    if (selectedIds.length === filteredReviews.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredReviews.map((r) => r.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // API Status & Action Handlers
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const firebaseUser = auth.currentUser;
      let token = '';
      if (firebaseUser) {
        token = await firebaseUser.getIdToken();
      }
      const backendUrl = import.meta.env.VITE_BACKEND_URI || 'http://localhost:5002/api';
      await axios.put(
        `${backendUrl}/auth/admin/approve/${id}`,
        { status: newStatus },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true
        }
      );
      showToast(`Review status updated to ${newStatus}.`);
      await loadReviews();
    } catch (err: any) {
      console.error('Error updating review status:', err);
      showToast(err.response?.data?.message || 'Failed to update review status.');
    }
  };

  const handleDeleteReview = async (id: string) => {
    setDeletingIds((prev) => [...prev, id]);
    try {
      const firebaseUser = auth.currentUser;
      let token = '';
      if (firebaseUser) {
        token = await firebaseUser.getIdToken();
      }
      const backendUrl = import.meta.env.VITE_BACKEND_URI || 'http://localhost:5002/api';
      await axios.delete(`${backendUrl}/auth/admin/review-delete/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true
      });
      showToast('Review deleted.');
      await loadReviews();
    } catch (err: any) {
      console.error('Error deleting review:', err);
      showToast(err.response?.data?.message || 'Failed to delete review.');
    } finally {
      setDeletingIds((prev) => prev.filter((x) => x !== id));
    }
  };

  // Bulk Actions
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      await handleUpdateStatus(id, 'Approved');
    }
    setSelectedIds([]);
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      await handleUpdateStatus(id, 'Rejected');
    }
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} selected reviews?`)) {
      for (const id of selectedIds) {
        await handleDeleteReview(id);
      }
      setSelectedIds([]);
    }
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyReviewId === null || !replyText.trim()) return;

    showToast('Reply statement saved.');
    setReplyReviewId(null);
    setReplyText('');
  };

  // Star render
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={12}
        className={i < rating ? 'text-gold fill-gold' : 'text-fnt'}
      />
    ));
  };

  return (
    <div className="animate-fadeIn">
      {/* Title */}
      <div className="mb-7">
        <h2 className="font-display text-xl font-semibold text-blk">Reviews moderation</h2>
        <p className="text-sm text-mut">Moderate customer-submitted store ratings, reject spam, or post reply statements.</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-wht border border-bdrl rounded-xl p-4 shadow-premium-sm mb-6 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fnt" size={14} />
            <input
              type="text"
              placeholder="Search reviews by client or comment text..."
              className="w-full border border-bdr rounded bg-wht pl-9 pr-4 py-2 text-sm outline-none focus:border-primary placeholder:text-mut/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="flex flex-col gap-1 min-w-[120px]">
            <label className="text-xs font-medium text-mut">Status</label>
            <select
              className="border border-bdr rounded bg-wht px-3 py-2 text-sm outline-none cursor-pointer focus:border-primary text-mid font-medium"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All statuses</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
              <option value="Hidden">Hidden</option>
            </select>
          </div>

          {/* Rating Filter */}
          <div className="flex flex-col gap-1 min-w-[120px]">
            <label className="text-xs font-medium text-mut">Rating</label>
            <select
              className="border border-bdr rounded bg-wht px-3 py-2 text-sm outline-none cursor-pointer focus:border-primary text-mid font-medium"
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
            >
              <option value="All">All ratings</option>
              <option value="5">5 stars</option>
              <option value="4">4 stars</option>
              <option value="3">3 stars</option>
              <option value="2">2 stars</option>
              <option value="1">1 star</option>
            </select>
          </div>

          {/* Product Filter */}
          <div className="flex flex-col gap-1 min-w-[120px]">
            <label className="text-xs font-medium text-mut">Product</label>
            <select
              className="border border-bdr rounded bg-wht px-3 py-2 text-sm outline-none cursor-pointer focus:border-primary text-mid font-medium"
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
            >
              <option value="All">All products</option>
              {productsList.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-primary-soft/50 border border-primary-light/50 px-4 py-3 rounded-md animate-slideUp">
            <span className="text-sm font-medium text-primary">
              <strong>{selectedIds.length}</strong> review(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleBulkApprove}
                className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 border border-primary-light/40 text-primary-hover hover:bg-primary-soft rounded cursor-pointer"
              >
                <Check size={12} /> Bulk Approve
              </button>
              <button
                onClick={handleBulkReject}
                className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 border border-transparent bg-sur text-mid hover:bg-sur/80 rounded cursor-pointer"
              >
                <X size={12} /> Bulk Reject
              </button>
              <button
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 border border-transparent bg-red-bg text-red hover:bg-red-bg/85 rounded cursor-pointer"
              >
                <Trash2 size={12} /> Bulk Delete
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="text-sm font-medium px-2 py-1.5 text-mut hover:text-blk cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reviews Moderator Data Table */}
      <div className="bg-wht border border-bdrl rounded-xl shadow-premium-sm overflow-hidden mb-6">
        <div className="overflow-x-auto w-full scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-sur border-b border-bdrl text-xs font-medium text-mut select-none">
                <th className="py-3 px-5 w-[50px] text-center">
                  <button onClick={handleSelectAll} className="text-mid hover:text-primary transition-colors cursor-pointer">
                    {selectedIds.length === filteredReviews.length && filteredReviews.length > 0 ? (
                      <CheckSquare size={15} className="text-primary" />
                    ) : (
                      <Square size={15} />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4 w-[160px] whitespace-nowrap">Customer</th>
                <th className="py-3 px-4 w-[160px] whitespace-nowrap">Product</th>
                <th className="py-3 px-4 w-[100px] text-center whitespace-nowrap">Rating</th>
                <th className="py-3 px-4 whitespace-nowrap">Review</th>
                <th className="py-3 px-4 w-[100px] text-center whitespace-nowrap">Status</th>
                <th className="py-3 px-4 w-[100px] whitespace-nowrap">Date</th>
                <th className="py-3 px-5 text-right w-[150px] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bdrl text-sm leading-relaxed">
              {isLoading || apiReviews === null ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <LinearSystemDataTransferLoader />
                      <p className="text-xs font-semibold text-mut tracking-wide animate-pulse">
                        Syncing Review Data Stream from Backend Server to Admin Console...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredReviews.length > 0 ? (
                filteredReviews.map((r) => {
                  const isSelected = selectedIds.includes(r.id);
                  const isDeleting = deletingIds.includes(r.id);
                  const status = r.status || (r.approved ? 'Approved' : 'Pending');

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-sur/10 transition-colors ${
                        isSelected ? 'bg-primary-soft/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 px-5 text-center">
                        <button onClick={() => handleSelectOne(r.id)} className="text-mid hover:text-primary transition-colors cursor-pointer">
                          {isSelected ? (
                            <CheckSquare size={15} className="text-primary" />
                          ) : (
                            <Square size={15} />
                          )}
                        </button>
                      </td>

                      {/* Author */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-blk">{r.author}</div>
                        <div className="text-xs text-mut">{r.role}</div>
                      </td>

                      {/* Product */}
                      <td className="py-4 px-4 font-semibold text-mid">{r.product}</td>

                      {/* Rating */}
                      <td className="py-4 px-4">
                        <div className="flex gap-0.5 justify-center">{renderStars(r.rating)}</div>
                      </td>

                      {/* Review body */}
                      <td className="py-4 px-4">
                        <p className="text-blk font-medium">"{r.body}"</p>
                        {r.reply && (
                          <div className="bg-sur border-l-2 border-primary p-2.5 rounded-sm mt-2 text-sm text-mid italic">
                            <strong>Reply:</strong> "{r.reply}"
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                          status === 'Approved'
                            ? 'bg-primary-soft text-primary'
                            : status === 'Pending'
                            ? 'bg-yellow-50 text-amber-700'
                            : 'bg-red-bg text-red'
                        }`}>
                          {status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-sm text-mid whitespace-nowrap">{r.date}</td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {status !== 'Approved' && (
                            <button
                              onClick={() => handleUpdateStatus(r.id, 'Approved')}
                              disabled={isDeleting}
                              className="p-1 border border-bdr hover:border-primary text-mid hover:text-primary-hover rounded bg-wht cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Approve Review"
                            >
                              <Check size={12} />
                            </button>
                          )}
                          {status === 'Approved' && (
                            <button
                              onClick={() => handleUpdateStatus(r.id, 'Hidden')}
                              disabled={isDeleting}
                              className="p-1 border border-bdr hover:border-accent text-mid hover:text-accent-hover rounded bg-wht cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Hide Review"
                            >
                              <X size={12} />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setReplyReviewId(r.id);
                              setReplyText(r.reply || '');
                            }}
                            disabled={isDeleting}
                            className="p-1 border border-bdr hover:border-primary text-mid hover:text-primary-hover rounded bg-wht cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Reply to Review"
                          >
                            <MessageSquare size={12} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(r.id)}
                            disabled={isDeleting}
                            className="p-1 border border-bdr hover:border-red text-mid hover:text-red rounded bg-wht cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                            title="Delete Review"
                          >
                            {isDeleting ? (
                              <Loader2 size={12} className="animate-spin text-red" />
                            ) : (
                              <Trash2 size={12} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-mut">
                    No customer testimonials match filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single Review Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div 
          className="fixed inset-0 z-[999] flex items-center justify-center bg-blk/60 p-4 backdrop-blur-xs overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDeleteConfirmId(null);
            }
          }}
        >
          <div className="bg-wht rounded-2xl border border-bdr shadow-premium-lg max-w-[420px] w-full p-6 text-center animate-slideUp relative my-auto">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="absolute top-4 right-4 text-mut hover:text-blk transition-colors cursor-pointer border-none bg-transparent"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 bg-red-bg border border-red/10 text-red rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} />
            </div>

            <h3 className="font-display text-lg font-bold text-blk mb-2">
              Delete Review?
            </h3>

            <p className="text-xs text-mut leading-relaxed mb-6">
              Are you sure you want to delete this review? This action will permanently remove it and update store ratings across admin and customer clients in real-time via Socket.IO.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 px-4 rounded-lg border border-bdr text-xs font-semibold text-mid hover:bg-sur transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const targetId = deleteConfirmId;
                  setDeleteConfirmId(null);
                  if (targetId) {
                    await handleDeleteReview(targetId);
                  }
                }}
                className="flex-1 py-2.5 px-4 rounded-lg bg-red text-wht hover:bg-red/90 text-xs font-semibold shadow-premium-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 size={14} /> Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div 
          className="fixed inset-0 z-[999] flex items-center justify-center bg-blk/60 p-4 backdrop-blur-xs overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsBulkDeleteModalOpen(false);
            }
          }}
        >
          <div className="bg-wht rounded-2xl border border-bdr shadow-premium-lg max-w-[420px] w-full p-6 text-center animate-slideUp relative my-auto">
            <button
              onClick={() => setIsBulkDeleteModalOpen(false)}
              className="absolute top-4 right-4 text-mut hover:text-blk transition-colors cursor-pointer border-none bg-transparent"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 bg-red-bg border border-red/10 text-red rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} />
            </div>

            <h3 className="font-display text-lg font-bold text-blk mb-2">
              Delete Selected Reviews?
            </h3>

            <p className="text-xs text-mut leading-relaxed mb-6">
              Are you sure you want to delete <strong className="text-blk">{selectedIds.length}</strong> selected review(s)? This action will update all clients in real-time.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-lg border border-bdr text-xs font-semibold text-mid hover:bg-sur transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setIsBulkDeleteModalOpen(false);
                  for (const id of selectedIds) {
                    await handleDeleteReview(id);
                  }
                  setSelectedIds([]);
                }}
                className="flex-1 py-2.5 px-4 rounded-lg bg-red text-wht hover:bg-red/90 text-xs font-semibold shadow-premium-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 size={14} /> Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reply Dialog Modal */}
      {replyReviewId !== null && (
        <div 
          className="fixed inset-0 z-[999] flex items-center justify-center bg-blk/60 p-4 backdrop-blur-xs overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setReplyReviewId(null);
            }
          }}
        >
          <div className="bg-wht rounded-xl border border-bdr shadow-premium-lg w-full max-w-[500px] p-6 relative my-auto">
            <button
              onClick={() => setReplyReviewId(null)}
              className="absolute top-5 right-5 text-mut hover:text-blk transition-colors cursor-pointer border-none bg-transparent"
            >
              <X size={18} />
            </button>

            <h3 className="font-display text-[1.1rem] font-bold text-blk mb-4 border-b border-bdrl pb-2.5">
              Reply to Customer Testimonial
            </h3>

            <form onSubmit={handleReplySubmit} className="flex flex-col gap-4 text-[0.82rem]">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-mut">Response statement</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Thank you for your feedback! We have updated our dilution guidelines..."
                  className="border border-bdr focus:border-primary rounded px-3 py-2 outline-none w-full resize-none placeholder:text-mut/50 bg-wht"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="submit"
                  className="bg-primary text-wht rounded px-5 py-2 text-sm font-semibold cursor-pointer"
                >
                  Save Reply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsModeration;
