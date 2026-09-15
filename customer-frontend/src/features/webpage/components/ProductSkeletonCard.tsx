import React from 'react';

const ProductSkeletonCard: React.FC = () => {
  return (
    <div className="flex flex-col bg-white border border-slate-200/80 rounded-2xl p-2.5 sm:p-3 animate-pulse">
      {/* Image Container Skeleton */}
      <div className="aspect-square w-full bg-slate-100 rounded-xl overflow-hidden" />

      {/* Card Body Skeleton */}
      <div className="pt-2.5 pb-0.5 flex flex-col justify-between flex-1 gap-2">
        <div className="space-y-1.5">
          {/* Category & Star Rating Skeleton */}
          <div className="flex items-center justify-between">
            <div className="w-16 h-2.5 rounded bg-slate-200" />
            <div className="w-12 h-2.5 rounded bg-slate-200" />
          </div>

          {/* Product Name Skeleton */}
          <div className="w-4/5 h-3.5 rounded bg-slate-200" />
        </div>

        {/* Pricing & Action Button Skeleton */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-auto">
          <div className="flex items-baseline gap-1.5">
            <div className="w-12 h-4 rounded bg-slate-200" />
            <div className="w-8 h-3 rounded bg-slate-100" />
          </div>
          <div className="w-14 h-7 rounded-lg bg-slate-200" />
        </div>
      </div>
    </div>
  );
};

export default ProductSkeletonCard;

