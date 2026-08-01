import React from 'react';
import type { Product } from '../../../core/types';
import { useApp } from '../../../core/context/AppContext';
import { Star, ShoppingCart, Loader2 } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { setCurPage, setSelectedProductId, reviews, cart, addToCart, updateCartQty, removeFromCart, addingProductId } = useApp();

  const cartItem = cart.find((item) => item.product.id === product.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  const prodReviews = reviews.filter((r) => r.approved && r.product === product.name);
  const rating = prodReviews.length
    ? (prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length).toFixed(1)
    : product.rating.toFixed(1);
  const count = prodReviews.length || product.reviewCount;

  const handleClick = () => {
    setSelectedProductId(product.id);
    setCurPage('product-detail');
  };

  const renderStars = (ratingVal: number) => {
    const full = Math.floor(ratingVal);
    const hasHalf = ratingVal - full >= 0.4;
    return Array.from({ length: 5 }, (_, i) => {
      const isFull = i < full;
      const isHalf = !isFull && hasHalf && i === full;
      return (
        <Star
          key={i}
          size={11}
          fill={isFull || isHalf ? 'var(--gold)' : 'none'}
          stroke={isFull || isHalf ? 'var(--gold)' : '#d1d5db'}
          strokeWidth={1.5}
        />
      );
    });
  };

  // Always show a relative MRP — use actual or generate a realistic one
  const discountPct = product.discount > 0 ? product.discount : Math.floor(Math.random() * 8 + 12); // 12–20% dummy
  const mrp = product.originalPrice
    ? product.originalPrice
    : Math.round(product.price / (1 - discountPct / 100));

  const savings = mrp - product.price;

  return (
    <div
      className="bg-wht border border-bdr overflow-hidden cursor-pointer transition-all duration-300 flex flex-col group rounded-lg hover:shadow-premium-md hover:-translate-y-1"
      onClick={handleClick}
    >
      {/* Image Container */}
      <div className="aspect-[4/5] bg-primary-soft/50 relative overflow-hidden">
        {product.imgs && product.imgs.length > 0 ? (
          <img
            src={product.imgs[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-106"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-soft to-primary-xlight/40 flex items-center justify-center">
            <span className="font-display italic text-xl text-primary-hover opacity-30 font-light">Clean</span>
          </div>
        )}

        {/* Top-left badge */}
        {product.badge && (
          <span className={`absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded z-[5] tracking-wide ${
            product.badge === 'New' ? 'bg-primary text-wht' : 'bg-blk text-wht'
          }`}>
            {product.badge}
          </span>
        )}

        {/* Discount badge — top right */}
        <span className="absolute top-2.5 right-2.5 text-[10px] font-bold bg-red text-wht px-2 py-0.5 rounded z-[5]">
          {discountPct}% OFF
        </span>

        {/* Hover overlay — quick add */}
        <div className="absolute inset-0 bg-blk/0 group-hover:bg-blk/10 transition-all duration-300 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100">
          <span className="flex items-center gap-1.5 bg-wht text-blk text-xs font-bold px-4 py-2 rounded-full shadow-premium-md translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <ShoppingCart size={12} /> Quick View
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        {/* Category */}
        <span className="text-[9px] font-bold text-accent uppercase tracking-[0.12em]">
          {product.cat}
        </span>

        {/* Product Name */}
        <h4 className="font-display text-[0.87rem] font-semibold text-blk leading-snug group-hover:text-primary transition-colors line-clamp-2 min-h-[2.4em]">
          {product.name}
        </h4>

        {/* Pricing block */}
        <div className="mt-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[1.05rem] font-extrabold text-blk tracking-tight">₹{product.price}</span>
            <span className="text-xs text-mut line-through font-mono">₹{mrp}</span>
          </div>
          <p className="text-[10px] text-primary-hover font-semibold mt-0.5">
            Save ₹{savings}
          </p>
        </div>

        {/* Dynamic Add to Cart / Quantity selection controls */}
        {quantityInCart > 0 ? (
          <div 
            className="flex items-center justify-between border border-primary rounded-md overflow-hidden bg-primary-soft/50 h-[32px] mt-1 mb-2 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (quantityInCart === 1) {
                  removeFromCart(product.id);
                } else {
                  updateCartQty(product.id, quantityInCart - 1);
                }
              }}
              className="flex-1 h-full flex items-center justify-center text-primary hover:bg-primary-hover hover:text-white transition-all font-bold text-base cursor-pointer border-none bg-transparent"
            >
              -
            </button>
            <span className="px-2 text-[11px] font-bold text-primary shrink-0 font-mono">
              {quantityInCart} in Cart
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateCartQty(product.id, quantityInCart + 1);
              }}
              className="flex-1 h-full flex items-center justify-center text-primary hover:bg-primary-hover hover:text-white transition-all font-bold text-base cursor-pointer border-none bg-transparent"
            >
              +
            </button>
          </div>
        ) : (
          <button
            disabled={addingProductId === product.id}
            onClick={async (e) => {
              e.stopPropagation();
              await addToCart(product, 1);
            }}
            className="w-full border border-bdr text-mid hover:border-primary hover:text-primary hover:bg-primary-soft/30 rounded-md py-1.5 mt-1 mb-2 text-xs font-semibold cursor-pointer transition-colors shadow-premium-sm text-center bg-transparent flex items-center justify-center gap-1.5"
          >
            {addingProductId === product.id ? (
              <>
                <Loader2 size={13} className="animate-spin text-primary" />
                <span>Adding...</span>
              </>
            ) : (
              'Add to Cart'
            )}
          </button>
        )}

        {/* Star Rating row */}
        <div className="flex items-center gap-1.5 pt-2 mt-auto border-t border-bdrl">
          <div className="flex gap-0.5">{renderStars(parseFloat(rating))}</div>
          <span className="text-[11px] font-bold text-mid">{rating}</span>
          <span className="text-[10px] text-mut">({count})</span>
          {count >= 10 && (
            <span className="ml-auto text-[9px] font-bold text-primary-hover bg-primary-soft px-1.5 py-0.5 rounded-full">Popular</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
