import React from 'react';
import type { Review } from '../../../core/types';
import { Star, CheckCircle } from 'lucide-react';

interface ReviewCardProps {
  review: Review;
  showQuoteIcon?: boolean;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, showQuoteIcon = false }) => {
  const renderStars = (ratingVal: number) => {
    return Array.from({ length: 5 }, (_, i) => {
      const active = i < ratingVal;
      return (
        <Star
          key={i}
          size={13}
          fill={active ? 'var(--gold)' : 'none'}
          stroke={active ? 'var(--gold)' : '#d1d5db'}
          strokeWidth={1.5}
        />
      );
    });
  };

  return (
    <div className="bg-wht border border-bdr rounded-xl overflow-hidden flex flex-col h-full min-h-[220px] justify-between hover:shadow-premium-md transition-all duration-300">
      {/* Photo Review — if customer attached a photo */}
      {review.img && (
        <div className="w-full aspect-[16/9] overflow-hidden bg-primary-soft/40">
          <img
            src={review.img}
            alt={`Review photo by ${review.author}`}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-5 flex flex-col flex-1 justify-between relative">
        {showQuoteIcon && (
          <div className="font-display text-[3rem] text-primary-light/40 leading-none absolute top-2 left-4 select-none italic pointer-events-none">
            "
          </div>
        )}

        <div>
          {/* Stars */}
          <div className="flex gap-0.5 mb-3 relative z-10">
            {renderStars(review.rating)}
          </div>

          {/* Review Body - Clamped to 4 lines max */}
          <p
            className="text-[0.85rem] leading-relaxed text-ink mb-4 relative z-10 line-clamp-4"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            "{review.body}"
          </p>
        </div>

        {/* Author Row */}
        <div className="flex items-center gap-2.5 border-t border-bdrl pt-3.5">
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-primary-light bg-primary-soft flex items-center justify-center">
            {review.img ? (
              <img src={review.img} alt={review.author} className="w-full h-full object-cover" />
            ) : (
              <span className="font-mono font-bold text-[0.65rem] text-primary-hover tracking-wide">
                {review.ini}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[0.78rem] font-bold text-blk truncate">{review.author}</div>
            <div className="text-[0.68rem] text-mut mt-0.5 font-medium truncate">
              {review.role}{review.date && ` • ${review.date}`}
            </div>
          </div>
          <span className="flex items-center gap-1 font-semibold text-[0.6rem] tracking-wide uppercase text-primary-hover shrink-0">
            <CheckCircle size={11} className="text-primary" />
            Verified
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
