import React, { useState, useEffect } from 'react';
import { useApp } from '../../../core/context/AppContext';
import {
  Search,
  Check,
  X,
  MessageSquare,
  Trash2,
  Star,
  CheckSquare,
  Square
} from 'lucide-react';

const ReviewsModeration: React.FC = () => {
  const {
    reviews,
    updateReviewStatus,
    replyToReview,
    deleteReview,
    showToast
  } = useApp();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [productFilter, setProductFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Selected for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Reply Modal State
  const [replyReviewId, setReplyReviewId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  // Escape key down to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setReplyReviewId(null);
      }
    };
    if (replyReviewId !== null) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [replyReviewId]);

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

  const handleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Bulk Actions
  const handleBulkApprove = () => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach((id) => updateReviewStatus(id, 'Approved'));
    setSelectedIds([]);
    showToast('Selected reviews approved.');
  };

  const handleBulkReject = () => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach((id) => updateReviewStatus(id, 'Rejected'));
    setSelectedIds([]);
    showToast('Selected reviews rejected.');
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} selected reviews?`)) {
      selectedIds.forEach((id) => deleteReview(id));
      setSelectedIds([]);
      showToast('Selected reviews deleted.');
    }
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyReviewId === null || !replyText.trim()) return;

    replyToReview(replyReviewId, replyText.trim());
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
                onClick={handleBulkDelete}
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
              {filteredReviews.length > 0 ? (
                filteredReviews.map((r) => {
                  const isSelected = selectedIds.includes(r.id);
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
                              onClick={() => updateReviewStatus(r.id, 'Approved')}
                              className="p-1 border border-bdr hover:border-primary text-mid hover:text-primary-hover rounded bg-wht cursor-pointer"
                              title="Approve Review"
                            >
                              <Check size={12} />
                            </button>
                          )}
                          {status === 'Approved' && (
                            <button
                              onClick={() => updateReviewStatus(r.id, 'Hidden')}
                              className="p-1 border border-bdr hover:border-accent text-mid hover:text-accent-hover rounded bg-wht cursor-pointer"
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
                            className="p-1 border border-bdr hover:border-primary text-mid hover:text-primary-hover rounded bg-wht cursor-pointer"
                            title="Reply to Review"
                          >
                            <MessageSquare size={12} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this review?')) {
                                deleteReview(r.id);
                              }
                            }}
                            className="p-1 border border-bdr hover:border-red text-mid hover:text-red rounded bg-wht cursor-pointer"
                            title="Delete Review"
                          >
                            <Trash2 size={12} />
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
                {/* No separate cancel button, top close button and click backdrop close is enough */}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsModeration;
