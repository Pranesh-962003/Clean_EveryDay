import React from 'react';

const ProductSkeletonCard: React.FC = () => {
  return (
    <div className="bg-wht border border-bdr overflow-hidden flex flex-col rounded-lg shadow-premium-sm">
      {/* Image Container Skeleton */}
      <div className="aspect-[4/5] bg-bdrl/60 relative overflow-hidden shimmer-bg" />

      {/* Card Body Skeleton */}
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        {/* Category Pill Skeleton */}
        <div className="w-16 h-2.5 rounded bg-bdrl shimmer-bg" />

        {/* Product Name Skeleton (2 lines YouTube skeleton style) */}
        <div className="min-h-[2.4em] flex flex-col gap-1 mt-0.5">
          <div className="w-full h-3.5 rounded bg-bdrl shimmer-bg" />
          <div className="w-3/4 h-3.5 rounded bg-bdrl shimmer-bg" />
        </div>

        {/* Pricing block Skeleton */}
        <div className="mt-1">
          <div className="flex items-center gap-2">
            <div className="w-14 h-5 rounded bg-bdrl shimmer-bg" />
            <div className="w-10 h-3 rounded bg-bdrl shimmer-bg" />
          </div>
          <div className="w-16 h-2.5 rounded bg-bdrl shimmer-bg mt-1" />
        </div>

        {/* Add to Cart button Skeleton */}
        <div className="w-full h-[32px] rounded-md bg-bdrl shimmer-bg mt-1 mb-2" />

        {/* Star Rating row Skeleton */}
        <div className="flex items-center gap-2 pt-2 mt-auto border-t border-bdrl">
          <div className="w-16 h-3 rounded bg-bdrl shimmer-bg" />
          <div className="w-6 h-3 rounded bg-bdrl shimmer-bg" />
          <div className="w-8 h-3 rounded bg-bdrl shimmer-bg" />
        </div>
      </div>
    </div>
  );
};

export default ProductSkeletonCard;
