import React, { useState, useEffect } from 'react';
import { useApp } from '../../../core/context/AppContext';
import ReviewCard from '../components/ReviewCard';
import ProductCard from '../components/ProductCard';
import {
  Star, ChevronRight, Sparkles, AlertCircle, ArrowLeft,
  CheckCircle, ShieldCheck, Truck, X, MessageSquarePlus, Send, Loader2
} from 'lucide-react';

/* ─── Guest Review Modal ─────────────────────────────────────────── */
interface ReviewModalProps {
  productName: string;
  onClose: () => void;
  onSubmit: (name: string, email: string, stars: number, body: string) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ productName, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const starLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Please enter your name.';
    if (!email.trim() || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) e.email = 'Please enter a valid email.';
    if (stars === 0) e.stars = 'Please select a star rating.';
    if (!body.trim() || body.trim().length < 10) e.body = 'Review must be at least 10 characters.';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit(name.trim(), email.trim(), stars, body.trim());
    setSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-blk/50 backdrop-blur-sm animate-fadeIn" />

      {/* Modal Card */}
      <div className="relative bg-wht rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.18)] w-full max-w-[500px] overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-bdrl">
          <div>
            <h3 className="font-display text-lg font-bold text-blk">Share your experience</h3>
            <p className="text-xs text-mut mt-0.5 font-medium">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-mut hover:bg-bdrl hover:text-blk transition-colors cursor-pointer mt-0.5"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-8 animate-fadeIn">
              <div className="w-14 h-14 rounded-full bg-primary-soft border-2 border-primary flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={26} className="text-primary" />
              </div>
              <h4 className="font-display text-base font-bold text-blk mb-2">Thank you, {name.split(' ')[0]}!</h4>
              <p className="text-sm text-mid max-w-[280px] mx-auto">
                Your review has been submitted and is pending approval. It will appear here once verified.
              </p>
              <button
                onClick={onClose}
                className="mt-6 bg-primary text-wht text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-primary-hover cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
              {/* Name + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-blk mb-1 block">
                    Your Name <span className="text-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
                    placeholder="e.g. Priya Sharma"
                    className={`w-full border rounded-lg px-3.5 py-2.5 text-sm text-ink outline-none transition-all bg-sur focus:bg-wht focus:border-primary focus:ring-2 focus:ring-primary/10 ${errors.name ? 'border-red' : 'border-bdr'}`}
                  />
                  {errors.name && <p className="text-[11px] text-red mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-blk mb-1 block">
                    Email <span className="text-red">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
                    placeholder="you@example.com"
                    className={`w-full border rounded-lg px-3.5 py-2.5 text-sm text-ink outline-none transition-all bg-sur focus:bg-wht focus:border-primary focus:ring-2 focus:ring-primary/10 ${errors.email ? 'border-red' : 'border-bdr'}`}
                  />
                  {errors.email && <p className="text-[11px] text-red mt-1">{errors.email}</p>}
                </div>
              </div>

              {/* Star Rating */}
              <div>
                <label className="text-xs font-semibold text-blk mb-2 block">
                  Your Rating <span className="text-red">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: 5 }, (_, i) => {
                    const val = i + 1;
                    const active = val <= (hoverStars || stars);
                    return (
                      <Star
                        key={i}
                        size={30}
                        className="cursor-pointer transition-transform duration-100 hover:scale-110"
                        fill={active ? 'var(--gold)' : 'none'}
                        stroke={active ? 'var(--gold)' : '#d1d5db'}
                        strokeWidth={1.5}
                        onMouseEnter={() => setHoverStars(val)}
                        onMouseLeave={() => setHoverStars(0)}
                        onClick={() => { setStars(val); setErrors((p) => ({ ...p, stars: '' })); }}
                      />
                    );
                  })}
                  {(hoverStars || stars) > 0 && (
                    <span className="ml-1 text-sm font-bold text-blk">
                      {starLabels[hoverStars || stars]}
                    </span>
                  )}
                </div>
                {errors.stars && <p className="text-[11px] text-red mt-1">{errors.stars}</p>}
              </div>

              {/* Review Text */}
              <div>
                <label className="text-xs font-semibold text-blk mb-1 block">
                  Your Review <span className="text-red">*</span>
                </label>
                <textarea
                  value={body}
                  onChange={(e) => { setBody(e.target.value); setErrors((p) => ({ ...p, body: '' })); }}
                  placeholder={`How was your experience with ${productName}?`}
                  rows={4}
                  className={`w-full border rounded-lg px-3.5 py-3 text-sm text-ink outline-none transition-all bg-sur focus:bg-wht focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none ${errors.body ? 'border-red' : 'border-bdr'}`}
                />
                {errors.body && <p className="text-[11px] text-red mt-1">{errors.body}</p>}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-[11px] text-mut italic flex-1">
                  Your email is only used for verification and will not be published.
                </p>
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2 shrink-0"
                >
                  <Send size={13} /> Submit Review
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── ProductDetail Page ─────────────────────────────────────────── */
const ProductDetail: React.FC = () => {
  const {
    products,
    selectedProductId,
    reviews,
    curUser,
    submitReview,
    fetchProductReviews,
    setCurPage,
    setCurFilter,
    setSelectedProductId,
    addToCart,
    showToast,
    cart,
    updateCartQty,
    removeFromCart,
    addingProductId
  } = useApp();

  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [imgFading, setImgFading] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // For inline review form
  const [rStars, setRStars] = useState(0);
  const [rHoverStars, setRHoverStars] = useState(0);
  const [rBody, setRBody] = useState('');
  const [guestName, setGuestName] = useState('');
  const [ratingError, setRatingError] = useState(false);

  const product = products.find((p) => p.id === selectedProductId);
  const cartItem = product ? cart.find((item) => item.product.id === product.id) : null;
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  if (!product) {
    return (
      <div className="text-center py-20 px-6 max-w-[480px] mx-auto animate-fadeIn">
        <AlertCircle size={36} className="text-red mb-4 mx-auto" />
        <h2 className="font-display text-xl font-semibold mb-2.5">Product not found</h2>
        <p className="text-sm text-mut mb-6">This product does not exist or has been removed.</p>
        <button className="btn-primary" onClick={() => setCurPage('products')}>
          Back to store
        </button>
      </div>
    );
  }

  useEffect(() => {
    if (product) {
      const targetId = product._id || product.sku || product.id;
      fetchProductReviews(targetId, product.name);
    }
  }, [product?.id, product?._id]);

  // Reviews & rating
  const prodReviews = reviews.filter(
    (r) => r.approved && (r.product === product.name || (product._id && (r._id === product._id || r.product === product._id)))
  );
  const rating = prodReviews.length
    ? (prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length).toFixed(1)
    : product.rating.toFixed(1);
  const count = prodReviews.length || product.reviewCount;

  // Pricing
  const discountPct = product.discount > 0 ? product.discount : 15;
  const mrp = product.originalPrice
    ? product.originalPrice
    : Math.round(product.price / (1 - discountPct / 100));
  const savings = mrp - product.price;

  // Suggested products — same category, exclude current
  const suggested = products
    .filter((p) => p.cat === product.cat && p.id !== product.id)
    .slice(0, 4);

  // Image switch with fade
  const handleThumbnailClick = (idx: number) => {
    if (idx === activeImgIdx) return;
    setImgFading(true);
    setTimeout(() => { setActiveImgIdx(idx); setImgFading(false); }, 150);
  };

  const renderStars = (ratingVal: number, size = 14) => {
    const full = Math.floor(ratingVal);
    const hasHalf = ratingVal - full >= 0.4;
    return Array.from({ length: 5 }, (_, i) => {
      const isFull = i < full;
      const isHalf = !isFull && hasHalf && i === full;
      return (
        <Star
          key={i} size={size}
          fill={isFull || isHalf ? 'var(--gold)' : 'none'}
          stroke={isFull || isHalf ? 'var(--gold)' : '#d1d5db'}
          strokeWidth={1.5}
        />
      );
    });
  };

  // Inline review submit for logged in users & guests
  const handleInlineReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rStars === 0) { setRatingError(true); return; }
    if (!rBody.trim()) return;

    const targetId = product._id || product.sku || product.id;
    const authorName = curUser ? curUser.name : (guestName.trim() || 'Customer');
    const res = await submitReview(authorName, rStars, rBody.trim(), product.name, product._id || String(product.id));
    if (res && res.success) {
      setRStars(0); setRBody(''); setGuestName(''); setRatingError(false);
      setTimeout(() => {
        fetchProductReviews(targetId, product.name);
      }, 500);
    }
  };

  // Guest review modal submit
  const handleGuestReview = async (_email: string, name: string, stars: number, body: string) => {
    const targetId = product._id || product.sku || product.id;
    const res = await submitReview(name, stars, body, product.name, product._id || String(product.id));
    if (res && res.success) {
      setTimeout(() => {
        fetchProductReviews(targetId, product.name);
      }, 500);
    }
  };

  return (
    <div className="w-full bg-sur min-h-screen">
      {/* Guest Review Modal */}
      {reviewModalOpen && (
        <ReviewModal
          productName={product.name}
          onClose={() => setReviewModalOpen(false)}
          onSubmit={(name, _email, stars, body) => handleGuestReview(_email, name, stars, body)}
        />
      )}

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 pb-20">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-mut mb-6 select-none">
          <button onClick={() => setCurPage('home')} className="hover:text-primary transition-colors font-medium cursor-pointer bg-transparent border-none">Home</button>
          <ChevronRight size={10} className="text-fnt" />
          <button onClick={() => { setCurFilter('All'); setCurPage('products'); }} className="hover:text-primary transition-colors font-medium cursor-pointer bg-transparent border-none flex items-center gap-1">
            <ArrowLeft size={11} /> All Products
          </button>
          <ChevronRight size={10} className="text-fnt" />
          <span className="text-blk font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* ── Main Product Grid ── */}
        {/* 3-col on desktop: [thumbs strip | main image | details], sticky left + center */}
        <section className="bg-wht rounded-xl border border-bdr shadow-premium-sm mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-[72px_1fr_1fr] items-start">

            {/* Col 1 — Vertical Thumbnail Strip (desktop only, sticky) */}
            {product.imgs && product.imgs.length > 1 && (
              <div className="hidden lg:flex flex-col gap-2 p-3 pt-5 lg:sticky lg:top-[86px] lg:self-start">
                {product.imgs.map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleThumbnailClick(idx)}
                    aria-label={`View image ${idx + 1}`}
                    className={`w-[54px] h-[54px] rounded-lg border-2 overflow-hidden cursor-pointer transition-all duration-200 shrink-0 ${
                      idx === activeImgIdx
                        ? 'border-primary ring-2 ring-primary/25 scale-[1.05]'
                        : 'border-bdrl opacity-55 hover:opacity-100 hover:border-primary/40'
                    }`}
                  >
                    <img src={src} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Col 2 — Main Image (sticky on desktop) */}
            <div className={`p-5 lg:sticky lg:top-[86px] lg:self-start border-r-0 lg:border-r border-bdrl ${!product.imgs || product.imgs.length <= 1 ? 'lg:col-start-2' : ''}`}>
              <div className="aspect-square bg-primary-soft/40 rounded-xl border border-bdrl overflow-hidden flex items-center justify-center relative">
                {product.imgs && product.imgs.length > 0 ? (
                  <img
                    src={product.imgs[activeImgIdx]}
                    alt={product.name}
                    className={`w-full h-full object-cover transition-opacity duration-150 ${imgFading ? 'opacity-0' : 'opacity-100'}`}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-primary-hover">
                    <Sparkles size={36} className="opacity-40 animate-pulse" />
                    <span className="text-xs font-semibold">Premium active</span>
                  </div>
                )}

                {/* Badges */}
                {product.badge && (
                  <span className={`absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded z-10 ${product.badge === 'New' ? 'bg-primary text-wht' : 'bg-blk text-wht'}`}>
                    {product.badge}
                  </span>
                )}
                <span className="absolute top-3 right-3 text-[11px] font-bold bg-red text-wht px-2.5 py-1 rounded z-10">
                  {discountPct}% OFF
                </span>
              </div>

              {/* Mobile thumbnail strip — horizontal below main image */}
              {product.imgs && product.imgs.length > 1 && (
                <div className="flex lg:hidden gap-2 mt-3 overflow-x-auto scrollbar-none">
                  {product.imgs.map((src, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleThumbnailClick(idx)}
                      className={`w-14 h-14 rounded-lg border-2 overflow-hidden cursor-pointer shrink-0 transition-all duration-200 ${
                        idx === activeImgIdx ? 'border-primary ring-2 ring-primary/20' : 'border-bdrl opacity-55 hover:opacity-100'
                      }`}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Image count pill */}
              {product.imgs && product.imgs.length > 1 && (
                <p className="text-center text-[10px] text-mut font-medium mt-2.5 select-none">
                  {activeImgIdx + 1} / {product.imgs.length} photos
                </p>
              )}
            </div>

            {/* Col 3 — Product Details (scrollable) */}
            <div className="p-4 sm:p-6 lg:p-8 flex flex-col border-t lg:border-t-0">
              {/* Category label */}
              <span className="text-[10px] font-bold text-accent uppercase tracking-[0.14em] mb-2">{product.cat}</span>

              {/* Product Name */}
              <h1 className="font-display text-2xl sm:text-[1.75rem] font-bold text-blk leading-tight mb-3">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-5">
                <div className="flex gap-0.5">{renderStars(parseFloat(rating), 15)}</div>
                <span className="text-sm font-bold text-blk">{rating}</span>
                <span className="text-xs text-mut">({count} reviews)</span>
                <button
                  className="ml-auto text-xs text-primary font-semibold underline underline-offset-2 hover:text-primary-hover cursor-pointer bg-transparent border-none"
                  onClick={() => document.getElementById('pd-reviews')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  See all reviews
                </button>
              </div>

              {/* Price block */}
              <div className="bg-gradient-to-br from-primary-soft/60 to-primary-xlight/30 border border-primary-light/70 rounded-xl p-4 mb-6">
                <div className="flex items-baseline gap-3 flex-wrap mb-1.5">
                  <span className="text-[2rem] font-extrabold text-blk leading-none tracking-tight">₹{product.price}</span>
                  <span className="text-base text-mut line-through font-mono">₹{mrp}</span>
                  <span className="text-sm font-bold text-red bg-red/10 border border-red/15 rounded-full px-3 py-0.5">
                    {discountPct}% OFF
                  </span>
                </div>
                <p className="text-sm font-semibold text-primary-hover flex items-center gap-1.5">
                  <CheckCircle size={13} className="shrink-0" />
                  You save ₹{savings} on this order
                </p>
                <p className="text-[11px] text-mut mt-1.5">Inclusive of all taxes · Free delivery above ₹499</p>
              </div>

              {/* Description */}
              <p className="text-[0.88rem] text-mid leading-relaxed mb-5">{product.desc}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {product.tags.map((tag, i) => (
                  <span key={i} className="bg-primary-soft border border-primary-light/60 rounded-full px-3 py-1 text-xs font-medium text-primary-hover">
                    {tag}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <div className="flex gap-3 flex-wrap mb-5">
                <button
                  className="btn-primary-lg flex-1 min-w-[130px] flex items-center justify-center gap-2"
                  disabled={addingProductId === product.id}
                  onClick={async () => {
                    await addToCart(product, 1);
                    setCurPage('checkout');
                  }}
                >
                  {addingProductId === product.id ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-white" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    'Buy Now'
                  )}
                </button>
                {quantityInCart > 0 ? (
                  <div className="flex items-center justify-between border border-primary rounded-md overflow-hidden bg-primary-soft/30 flex-1 min-w-[130px] h-[48px] select-none">
                    <button
                      onClick={() => {
                        if (quantityInCart === 1) {
                          removeFromCart(product.id);
                          showToast(`${product.name} removed from cart.`);
                        } else {
                          updateCartQty(product.id, quantityInCart - 1);
                        }
                      }}
                      className="flex-1 h-full flex items-center justify-center text-primary hover:bg-primary/15 transition-colors font-bold text-lg cursor-pointer border-none bg-transparent"
                    >
                      -
                    </button>
                    <span className="px-4 text-sm font-bold text-primary shrink-0 font-mono">
                      {quantityInCart} in Cart
                    </span>
                    <button
                      onClick={() => {
                        updateCartQty(product.id, quantityInCart + 1);
                      }}
                      className="flex-1 h-full flex items-center justify-center text-primary hover:bg-primary/15 transition-colors font-bold text-lg cursor-pointer border-none bg-transparent"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn-secondary flex-1 min-w-[130px] py-3.5 flex items-center justify-center gap-2"
                    disabled={addingProductId === product.id}
                    onClick={async () => {
                      await addToCart(product, 1);
                    }}
                  >
                    {addingProductId === product.id ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-primary" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      'Add to Cart'
                    )}
                  </button>
                )}
              </div>

              {/* Trust row */}
              <div className="flex flex-wrap gap-4 border-y border-bdrl py-4 mb-6 text-xs text-mid font-semibold">
                <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-primary" /> Secure checkout</span>
                <span className="flex items-center gap-1.5"><Truck size={13} className="text-primary" /> Fast delivery</span>
                <span className="flex items-center gap-1.5"><CheckCircle size={13} className="text-primary" /> Lab tested</span>
              </div>

              {/* Specs Table */}
              <div>
                <h4 className="text-xs font-bold text-blk uppercase tracking-wider mb-3">Formulation Details</h4>
                <div className="divide-y divide-bdrl rounded-lg border border-bdrl overflow-hidden">
                  {Object.entries(product.specs).map(([key, value]) => {
                    if (!value) return null;
                    return (
                      <div className="flex justify-between px-4 py-2.5 text-sm bg-wht even:bg-sur/50" key={key}>
                        <span className="text-mut font-medium">{key}</span>
                        <span className="text-blk font-semibold text-right max-w-[55%]">{value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Reviews Section ── */}
        <section id="pd-reviews" className="bg-wht rounded-xl border border-bdr shadow-premium-sm p-4 sm:p-6 lg:p-8 mb-8">
          {/* Header */}
          <div className="flex items-start justify-between flex-wrap gap-4 border-b border-bdrl pb-5 mb-6">
            <div>
              <h2 className="font-display text-xl font-bold text-blk">Customer Reviews</h2>
              {prodReviews.length > 0 && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex gap-0.5">{renderStars(parseFloat(rating), 14)}</div>
                  <span className="text-sm font-bold text-blk">{rating} out of 5</span>
                  <span className="text-xs text-mut">— {count} reviews</span>
                </div>
              )}
            </div>

            {/* Write review CTA — always visible */}
            <button
              onClick={() => curUser ? document.getElementById('pd-write-review')?.scrollIntoView({ behavior: 'smooth' }) : setReviewModalOpen(true)}
              className="flex items-center gap-2 bg-primary-soft border border-primary-light text-primary-hover text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-primary hover:text-wht hover:border-primary transition-all cursor-pointer"
            >
              <MessageSquarePlus size={15} />
              Write a Review
            </button>
          </div>

          {/* Review Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {prodReviews.length > 0 ? (
              prodReviews.map((review) => (
                <ReviewCard key={review.id} review={review} showQuoteIcon={!review.img} />
              ))
            ) : (
              <div className="col-span-full text-center py-10 px-6">
                <div className="w-12 h-12 rounded-full bg-primary-soft border border-primary-light flex items-center justify-center mx-auto mb-3">
                  <Star size={20} className="text-primary" fill="var(--primary-soft)" />
                </div>
                <h4 className="font-display text-base font-semibold text-blk mb-1">No reviews yet</h4>
                <p className="text-sm text-mut mb-4">Be the first to share your thoughts on {product.name}.</p>
                <button
                  onClick={() => setReviewModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-primary text-wht text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-primary-hover cursor-pointer transition-colors"
                >
                  <MessageSquarePlus size={14} /> Share your thoughts
                </button>
              </div>
            )}
          </div>

          {/* Write a Review — inline for logged-in, CTA for guests */}
          <div id="pd-write-review" className="border-t border-bdrl pt-7">
            <h3 className="font-display text-base font-bold text-blk mb-5">Share your thoughts</h3>

            {curUser ? (
              <form className="flex flex-col gap-4 max-w-[600px]" onSubmit={handleInlineReview}>
                <p className="text-[0.82rem] text-mid">
                  Reviewing as <strong className="text-blk">{curUser.name}</strong>
                </p>

                {/* Stars */}
                <div>
                  <label className="text-sm font-semibold text-blk mb-1.5 block">Rating <span className="text-red">*</span></label>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, i) => {
                      const val = i + 1;
                      const active = val <= (rHoverStars || rStars);
                      return (
                        <Star
                          key={i} size={28}
                          className="cursor-pointer transition-transform hover:scale-110"
                          fill={active ? 'var(--gold)' : 'none'}
                          stroke={active ? 'var(--gold)' : '#d1d5db'}
                          strokeWidth={1.5}
                          onMouseEnter={() => setRHoverStars(val)}
                          onMouseLeave={() => setRHoverStars(0)}
                          onClick={() => { setRStars(val); setRatingError(false); }}
                        />
                      );
                    })}
                    {rStars > 0 && (
                      <span className="ml-2 text-sm font-bold text-blk">
                        {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rStars]}
                      </span>
                    )}
                  </div>
                  {ratingError && <p className="text-xs text-red mt-1">Please select a rating.</p>}
                </div>

                {/* Text */}
                <div>
                  <label className="text-sm font-semibold text-blk mb-1 block">Review <span className="text-red">*</span></label>
                  <textarea
                    className="border border-bdr rounded-xl px-4 py-3 text-sm text-ink outline-none transition-all bg-sur focus:bg-wht focus:border-primary focus:ring-2 focus:ring-primary/10 w-full resize-none"
                    placeholder={`Share your experience with ${product.name}...`}
                    rows={4} value={rBody} onChange={(e) => setRBody(e.target.value)} required
                  />
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <button type="submit" className="flex items-center gap-2 bg-primary text-wht rounded-xl py-3 px-6 text-sm font-bold hover:bg-primary-hover transition-colors cursor-pointer">
                    <Send size={13} /> Post Review
                  </button>
                  <span className="text-xs text-mut italic">Subject to admin moderation.</span>
                </div>
              </form>
            ) : (
              /* Guest CTA — inviting, not gatekeeping */
              <div
                onClick={() => setReviewModalOpen(true)}
                className="group flex items-center gap-4 p-5 bg-gradient-to-r from-primary-soft/60 to-primary-xlight/30 border border-primary-light/60 rounded-xl cursor-pointer hover:border-primary/40 hover:shadow-premium-sm transition-all"
              >
                <div className="w-11 h-11 rounded-full bg-primary-soft border border-primary-light flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors">
                  <MessageSquarePlus size={18} className="text-primary group-hover:text-wht transition-colors" />
                </div>
                <div className="flex-1">
                  <h4 className="font-display text-sm font-bold text-blk mb-0.5 group-hover:text-primary transition-colors">Write a review for {product.name}</h4>
                  <p className="text-xs text-mid">Tap to share your experience — takes under a minute.</p>
                </div>
                <ChevronRight size={16} className="text-mut group-hover:text-primary transition-colors shrink-0" />
              </div>
            )}
          </div>
        </section>

        {/* ── Suggested Products ── */}
        {suggested.length > 0 && (
          <section className="mb-4">
            <div className="flex items-end justify-between mb-5">
              <div>
                <span className="text-[10px] font-bold text-accent uppercase tracking-wider block mb-1">You may also like</span>
                <h3 className="font-display text-xl font-bold text-blk">More from {product.cat}</h3>
              </div>
              <button
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer bg-transparent border-none"
                onClick={() => { setCurFilter(product.cat); setCurPage('products'); }}
              >
                View all <ChevronRight size={13} />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {suggested.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedProductId(p.id);
                    setCurPage('product-detail');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="cursor-pointer"
                >
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
