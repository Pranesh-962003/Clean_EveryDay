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
  Loader2,
  CheckCircle2,
  AlertCircle,
  EyeOff,
  Filter,
  RefreshCw,
  CornerDownRight,
  ShieldCheck
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
  image?: string;
  images?: string[];
  status: 'Pending' | 'Approved' | 'Hidden' | 'Rejected';
  approved: boolean;
  date: string;
  reply?: string;
}

// Sleek enterprise loader with server-to-client stream animation
const LinearSystemDataTransferLoader: React.FC = () => (
  <div className="relative flex flex-col items-center justify-center select-none py-6 px-4 w-full max-w-[420px] mx-auto">
    <style>{`
      @keyframes linearStreamPulse {
        0% { stroke-dashoffset: 60; }
        100% { stroke-dashoffset: 0; }
      }
      @keyframes linearPacketMove {
        0% { transform: translateX(0px); opacity: 0; }
        20% { opacity: 1; }
        80% { opacity: 1; }
        100% { transform: translateX(180px); opacity: 0; }
      }
    `}</style>

    <div className="relative flex items-center justify-between w-full h-16 px-2">
      {/* Node A: Server Database */}
      <div className="flex flex-col items-center gap-1.5 z-10">
        <div className="w-10 h-10 rounded-xl bg-slate-900 text-slate-100 border border-slate-700 flex items-center justify-center shadow-sm relative">
          <Database size={18} className="text-emerald-400" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-ping" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
        </div>
        <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase">Database Node</span>
      </div>

      {/* Stream track */}
      <div className="relative flex-1 mx-3 h-10 flex items-center justify-center">
        <div className="absolute w-full h-[2px] bg-slate-200 rounded-full" />
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 40" fill="none">
          <line
            x1="10" y1="20" x2="190" y2="20"
            stroke="#10B981"
            strokeWidth="2.5"
            strokeDasharray="8 6"
            strokeLinecap="round"
            style={{ animation: 'linearStreamPulse 1.2s linear infinite' }}
          />
        </svg>

        {/* Sliding packets */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-full flex items-center pointer-events-none">
          <div
            className="w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white shadow-sm"
            style={{ animation: 'linearPacketMove 1.5s ease-in-out infinite' }}
          />
          <div
            className="w-2.5 h-2.5 bg-emerald-400 rounded-full border border-white shadow-sm"
            style={{ animation: 'linearPacketMove 1.5s ease-in-out infinite 0.5s' }}
          />
        </div>
      </div>

      {/* Node B: Admin Console */}
      <div className="flex flex-col items-center gap-1.5 z-10">
        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white border border-slate-700 flex items-center justify-center shadow-sm relative">
          <Monitor size={18} className="text-emerald-400" />
          <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        </div>
        <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase">Admin Stream</span>
      </div>
    </div>
  </div>
);

const ReviewsModeration: React.FC = () => {
  const { showToast } = useApp();

  const [apiReviews, setApiReviews] = useState<ReviewItem[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [updatingStatusIds, setUpdatingStatusIds] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState<boolean>(false);
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
            image: r.image || (Array.isArray(r.images) && r.images.length > 0 ? r.images[0] : ''),
            images: r.images || (r.image ? [r.image] : []),
            status: r.status || 'Pending',
            approved: r.status === 'Approved',
            date: r.date ? new Date(r.date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
            reply: r.adminReply || r.reply || r.responseStatement || ''
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
    socket.on(SOCKET_EVENTS.STORY_CREATED, handleReviewEvent);
    socket.on(SOCKET_EVENTS.STORY_UPDATED, handleReviewEvent);
    socket.on(SOCKET_EVENTS.STORY_DELETED, handleReviewEvent);

    return () => {
      socket.off(SOCKET_EVENTS.REVIEW_CREATED, handleReviewEvent);
      socket.off(SOCKET_EVENTS.REVIEW_UPDATED, handleReviewEvent);
      socket.off(SOCKET_EVENTS.REVIEW_STATUS_UPDATED, handleReviewEvent);
      socket.off(SOCKET_EVENTS.REVIEW_DELETED, handleReviewEvent);
      socket.off(SOCKET_EVENTS.STORY_CREATED, handleReviewEvent);
      socket.off(SOCKET_EVENTS.STORY_UPDATED, handleReviewEvent);
      socket.off(SOCKET_EVENTS.STORY_DELETED, handleReviewEvent);
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

  // Pre-fill previous admin reply when opening reply modal
  useEffect(() => {
    if (replyReviewId !== null) {
      const selected = reviews.find((r) => r.id === replyReviewId || r._id === replyReviewId);
      if (selected && selected.reply) {
        setReplyText(selected.reply);
      }
    }
  }, [replyReviewId, reviews]);

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
    setUpdatingStatusIds((prev) => [...prev, id]);
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
    } finally {
      setUpdatingStatusIds((prev) => prev.filter((x) => x !== id));
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
    setIsBulkUpdating(true);
    try {
      for (const id of selectedIds) {
        await handleUpdateStatus(id, 'Approved');
      }
      setSelectedIds([]);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      for (const id of selectedIds) {
        await handleUpdateStatus(id, 'Rejected');
      }
      setSelectedIds([]);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (replyReviewId === null || !replyText.trim()) return;

    setIsSubmittingReply(true);
    try {
      const firebaseUser = auth.currentUser;
      let token = '';
      if (firebaseUser) {
        token = await firebaseUser.getIdToken();
      }
      const backendUrl = import.meta.env.VITE_BACKEND_URI || 'http://localhost:5002/api';
      await axios.put(
        `${backendUrl}/auth/admin/reply/${replyReviewId}`,
        { responseStatement: replyText },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true
        }
      );

      showToast('Reply statement saved.');
      setReplyReviewId(null);
      setReplyText('');
      await loadReviews();
    } catch (err: any) {
      console.error('Error submitting reply:', err);
      showToast(err.response?.data?.message || 'Failed to save reply statement.');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Star render
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5" title={`${rating} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            size={13}
            className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
          />
        ))}
      </div>
    );
  };

  // Metrics summary
  const approvedCount = reviews.filter((r) => r.status === 'Approved' || r.approved).length;
  const pendingCount = reviews.filter((r) => r.status === 'Pending' || (!r.status && !r.approved)).length;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : '5.0';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Reviews Moderation</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full border border-slate-200">
              {reviews.length} Total
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Moderate customer-submitted store ratings, reject spam, or post public reply statements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadReviews(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-xs cursor-pointer min-h-[44px]"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh Feed
          </button>
        </div>
      </div>

      {/* High-level KPI summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Average Store Rating</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{avgRating}</span>
              <span className="text-xs font-medium text-slate-500">/ 5.0</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
            <Star size={20} className="fill-amber-400 text-amber-400" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Approved Testimonials</p>
            <span className="text-2xl font-bold text-emerald-600">{approvedCount}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Pending Moderation</p>
            <span className="text-2xl font-bold text-amber-600">{pendingCount}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <AlertCircle size={20} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search reviews by customer name, comments, or keywords..."
              className="w-full border border-slate-200 rounded-lg bg-slate-50/50 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all min-h-[44px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 min-w-[130px]">
              <select
                className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none cursor-pointer focus:border-slate-400 focus:ring-1 focus:ring-slate-200 min-h-[44px]"
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
            <div className="flex items-center gap-1.5 min-w-[120px]">
              <select
                className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none cursor-pointer focus:border-slate-400 focus:ring-1 focus:ring-slate-200 min-h-[44px]"
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
            <div className="flex items-center gap-1.5 min-w-[160px]">
              <select
                className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none cursor-pointer focus:border-slate-400 focus:ring-1 focus:ring-slate-200 min-h-[44px] truncate"
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
        </div>

        {/* Bulk Action Banner */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-slate-900 text-white px-4 py-3 rounded-lg animate-fadeIn shadow-sm">
            <span className="text-xs font-medium">
              <strong className="text-emerald-400">{selectedIds.length}</strong> review{selectedIds.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkApprove}
                disabled={isBulkUpdating}
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md cursor-pointer disabled:opacity-50 transition-colors"
              >
                {isBulkUpdating ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                Approve
              </button>
              <button
                onClick={handleBulkReject}
                disabled={isBulkUpdating}
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md cursor-pointer disabled:opacity-50 transition-colors"
              >
                {isBulkUpdating ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                Reject
              </button>
              <button
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-md cursor-pointer transition-colors"
              >
                <Trash2 size={12} />
                Delete
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="text-xs font-medium px-2 py-1.5 text-slate-400 hover:text-white cursor-pointer ml-1"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reviews Data Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto w-full scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 select-none uppercase tracking-wider">
                <th className="py-3 px-4 w-[48px] text-center">
                  <button
                    onClick={handleSelectAll}
                    className="text-slate-400 hover:text-slate-900 transition-colors cursor-pointer inline-flex items-center justify-center p-1"
                  >
                    {selectedIds.length === filteredReviews.length && filteredReviews.length > 0 ? (
                      <CheckSquare size={16} className="text-slate-900" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4 w-[170px]">Customer</th>
                <th className="py-3 px-4 w-[170px]">Product</th>
                <th className="py-3 px-4 w-[110px] text-center">Rating</th>
                <th className="py-3 px-4 min-w-[260px]">Review Content</th>
                <th className="py-3 px-4 w-[100px] text-center">Photo</th>
                <th className="py-3 px-4 w-[110px] text-center">Status</th>
                <th className="py-3 px-4 w-[110px]">Date</th>
                <th className="py-3 px-5 text-right w-[150px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs leading-relaxed">
              {isLoading || apiReviews === null ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <LinearSystemDataTransferLoader />
                      <p className="text-xs font-semibold text-slate-500 animate-pulse">
                        Syncing review stream with database...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredReviews.length > 0 ? (
                filteredReviews.map((r) => {
                  const isSelected = selectedIds.includes(r.id);
                  const isDeleting = deletingIds.includes(r.id);
                  const isUpdatingStatus = updatingStatusIds.includes(r.id);
                  const status = r.status || (r.approved ? 'Approved' : 'Pending');

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isSelected ? 'bg-slate-50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleSelectOne(r.id)}
                          className="text-slate-400 hover:text-slate-900 transition-colors cursor-pointer inline-flex items-center justify-center p-1"
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-slate-900" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>

                      {/* Author */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
                            {r.ini}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate">{r.author}</div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500">
                              {r.role.includes('Verified') && (
                                <ShieldCheck size={11} className="text-emerald-600 shrink-0" />
                              )}
                              <span className="truncate">{r.role}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Product */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800 line-clamp-1" title={r.product}>
                          {r.product}
                        </span>
                      </td>

                      {/* Rating */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          {renderStars(r.rating)}
                          <span className="text-[10px] font-bold text-slate-500 mt-0.5">{r.rating}.0</span>
                        </div>
                      </td>

                      {/* Review body */}
                      <td className="py-3.5 px-4 min-w-[260px]">
                        <p className="text-slate-700 leading-normal line-clamp-2">
                          "{r.body}"
                        </p>
                        {r.reply && (
                          <div className="mt-1.5 flex items-start gap-1 text-[11px] text-slate-500 bg-slate-50 border border-slate-200/80 rounded p-1.5">
                            <CornerDownRight size={12} className="text-emerald-600 shrink-0 mt-0.5" />
                            <span className="line-clamp-1 italic text-slate-600">
                              Reply: {r.reply}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Attached Photo */}
                      <td className="py-3.5 px-4 text-center">
                        {r.image || (Array.isArray((r as any).images) && (r as any).images.length > 0) ? (
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {(Array.isArray((r as any).images) && (r as any).images.length > 0 ? (r as any).images : [r.image])
                              .filter(Boolean)
                              .map((imgUrl: string, imgIdx: number) => (
                                <a
                                  key={imgIdx}
                                  href={imgUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-block relative group/thumb overflow-hidden rounded-lg border border-slate-200 hover:border-slate-800 bg-slate-50 transition-all shadow-2xs"
                                  title="Click to view full photo in new tab"
                                >
                                  <img
                                    src={imgUrl}
                                    alt="Customer attachment"
                                    className="w-12 h-12 object-cover transition-transform group-hover/thumb:scale-110"
                                  />
                                </a>
                              ))}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs font-mono font-medium">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border ${
                          status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : status === 'Pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : status === 'Hidden'
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {r.date}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {status !== 'Approved' && (
                            <button
                              onClick={() => handleUpdateStatus(r.id, 'Approved')}
                              disabled={isDeleting || isUpdatingStatus}
                              className="p-1.5 border border-slate-200 hover:border-emerald-500 text-slate-600 hover:text-emerald-700 rounded-md bg-white cursor-pointer disabled:opacity-50 transition-colors min-h-[32px] min-w-[32px] inline-flex items-center justify-center"
                              title="Approve Review"
                            >
                              {isUpdatingStatus ? (
                                <Loader2 size={13} className="animate-spin text-emerald-600" />
                              ) : (
                                <Check size={13} />
                              )}
                            </button>
                          )}
                          {status === 'Approved' && (
                            <button
                              onClick={() => handleUpdateStatus(r.id, 'Hidden')}
                              disabled={isDeleting || isUpdatingStatus}
                              className="p-1.5 border border-slate-200 hover:border-slate-400 text-slate-600 hover:text-slate-900 rounded-md bg-white cursor-pointer disabled:opacity-50 transition-colors min-h-[32px] min-w-[32px] inline-flex items-center justify-center"
                              title="Hide Review"
                            >
                              {isUpdatingStatus ? (
                                <Loader2 size={13} className="animate-spin text-slate-600" />
                              ) : (
                                <EyeOff size={13} />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setReplyReviewId(r.id);
                              setReplyText(r.reply || '');
                            }}
                            disabled={isDeleting}
                            className="p-1.5 border border-slate-200 hover:border-slate-400 text-slate-600 hover:text-slate-900 rounded-md bg-white cursor-pointer disabled:opacity-50 transition-colors min-h-[32px] min-w-[32px] inline-flex items-center justify-center"
                            title="Reply to Customer"
                          >
                            <MessageSquare size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(r.id)}
                            disabled={isDeleting}
                            className="p-1.5 border border-slate-200 hover:border-rose-500 text-slate-600 hover:text-rose-600 rounded-md bg-white cursor-pointer disabled:opacity-50 transition-colors min-h-[32px] min-w-[32px] inline-flex items-center justify-center"
                            title="Delete Review"
                          >
                            {isDeleting ? (
                              <Loader2 size={13} className="animate-spin text-rose-600" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Filter size={32} className="mb-2 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-600">No customer testimonials match filters</p>
                      <p className="text-xs text-slate-400 mt-1">Try resetting the status, rating, or search queries.</p>
                    </div>
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
          className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteConfirmId(null);
          }}
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-[420px] w-full p-6 text-center animate-slideUp relative my-auto">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer border-none bg-transparent"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-2">
              Delete Customer Review?
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Are you sure you want to delete this review? This action will permanently remove it from store rating metrics across all clients in real-time.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 px-4 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer min-h-[44px]"
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
                className="flex-1 py-2.5 px-4 rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
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
          className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsBulkDeleteModalOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-[420px] w-full p-6 text-center animate-slideUp relative my-auto">
            <button
              onClick={() => setIsBulkDeleteModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer border-none bg-transparent"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-2">
              Delete Selected Reviews?
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Are you sure you want to delete <strong className="text-slate-900">{selectedIds.length}</strong> selected review(s)? This action will update store metrics across all client views in real-time.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer min-h-[44px]"
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
                className="flex-1 py-2.5 px-4 rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
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
          className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setReplyReviewId(null);
          }}
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-[500px] p-6 relative my-auto animate-slideUp">
            <button
              onClick={() => setReplyReviewId(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer border-none bg-transparent"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">
              Reply to Customer Testimonial
            </h3>

            <form onSubmit={handleReplySubmit} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Official Response Statement</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Thank you for your feedback! We have updated our dilution guidelines to assist..."
                  className="border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 rounded-lg p-3 outline-none w-full resize-none placeholder:text-slate-400 bg-white text-slate-800 text-xs leading-relaxed transition-all"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReplyReviewId(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReply}
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-5 py-2 text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors shadow-xs min-h-[40px]"
                >
                  {isSubmittingReply ? 'Saving Statement...' : 'Save Public Reply'}
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
