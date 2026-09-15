import React, { useState } from 'react';
import type { Review } from '../../../core/types';
import { Star, X, ZoomIn, ShieldCheck, CornerDownRight } from 'lucide-react';

interface ReviewCardProps {
  review: Review;
  showQuoteIcon?: boolean;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const attachedImg = review.image || (Array.isArray(review.images) && review.images.length > 0 ? review.images[0] : null) || review.img;

  const renderStars = (ratingVal: number) => {
    return Array.from({ length: 5 }, (_, i) => {
      const active = i < ratingVal;
      return (
        <Star
          key={i}
          size={13}
          fill={active ? '#F59E0B' : 'none'}
          stroke={active ? '#F59E0B' : '#CBD5E1'}
          strokeWidth={1.5}
        />
      );
    });
  };

  const isVerified =
    review.verifiedPurchase ||
    review.isVerifiedPurchase ||
    (review.role && review.role.toLowerCase().includes('verified'));

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs hover:shadow-sm transition-all duration-200 w-full">
        {/* Top Header: Author + Verified + Rating */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-900 border border-slate-200/80 flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
              {review.ini || (review.author ? review.author[0].toUpperCase() : 'C')}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-950 font-manrope">{review.author}</span>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
                    <ShieldCheck size={12} className="text-emerald-600" />
                    <span>Verified Purchase</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {review.date ? review.date : 'Verified Buyer'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 bg-slate-50 border border-slate-200/70 px-2.5 py-1 rounded-lg">
            <div className="flex gap-0.5">
              {renderStars(review.rating)}
            </div>
            <span className="text-xs font-bold text-slate-900 ml-1 font-stat">{review.rating}.0</span>
          </div>
        </div>

        {/* Review Body */}
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pt-1">
          {review.body}
        </p>

        {/* Attached Customer Product Photo */}
        {attachedImg && (
          <div className="mt-4 pt-3.5 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Attached Product Photo
            </span>
            <div
              className="relative inline-block w-24 h-24 sm:w-28 sm:h-28 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 cursor-pointer group/img shadow-2xs"
              onClick={() => setLightboxOpen(true)}
              title="Click to view full photo"
            >
              <img
                src={attachedImg}
                alt={`Customer review attachment for ${review.product || 'product'}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-slate-950/0 group-hover/img:bg-slate-950/30 transition-colors flex items-center justify-center">
                <ZoomIn size={18} className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity drop-shadow-sm" />
              </div>
            </div>
          </div>
        )}

        {/* Staff / Admin Reply */}
        {review.reply && (
          <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
              <CornerDownRight size={13} className="text-emerald-600" />
              <span>Response from Customer Support</span>
            </div>
            <p className="text-slate-600 leading-relaxed pl-4">{review.reply}</p>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && attachedImg && (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-4 sm:p-6 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-950 font-manrope">Photo by {review.author}</h4>
                <p className="text-xs text-slate-500 font-medium">{review.product}</p>
              </div>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                aria-label="Close photo preview"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[70vh] flex items-center justify-center bg-slate-50 rounded-xl overflow-hidden p-2">
              <img
                src={attachedImg}
                alt={`Full view by ${review.author}`}
                className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-sm"
              />
            </div>
            <p className="text-xs text-slate-600 mt-3 italic leading-relaxed">"{review.body}"</p>
          </div>
        </div>
      )}
    </>
  );
};

export default ReviewCard;

