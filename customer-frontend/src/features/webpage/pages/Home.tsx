import React, { useState } from 'react';
import { useApp } from '../../../core/context/AppContext';
import BannerCarousel from '../components/BannerCarousel';
import ProductCard from '../components/ProductCard';
import ProductSkeletonCard from '../components/ProductSkeletonCard';
import ReviewCard from '../components/ReviewCard';
import {
  ShieldCheck,
  Truck,
  Heart,
  Mail,
  Phone,
  MapPin,
  Send,
  Star,
  ChevronRight
} from 'lucide-react';

const Home: React.FC = () => {
  const {
    products,
    isProductsLoading,
    reviews,
    curUser,
    openAuthModal,
    submitReview,
    addLead,
    setCurPage,
    setCurFilter
  } = useApp();

  // Contact Form State
  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cSubject, setCSubject] = useState('');
  const [cService, setCService] = useState('General Support');
  const [cMessage, setCMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Review Form State
  const [rStars, setRStars] = useState(0);
  const [rHoverStars, setRHoverStars] = useState(0);
  const [rBody, setRBody] = useState('');

  // Filter & Go to Products Page
  const handleFilterGo = (cat: string) => {
    setCurFilter(cat);
    setCurPage('products');
  };

  // Submit Contact Inquiry
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim() || !cEmail.trim() || !cMessage.trim()) {
      return;
    }
    const res = await addLead(
      cName.trim(),
      cEmail.trim(),
      cSubject.trim() || 'General Inquiry',
      cService,
      cMessage.trim()
    );
    if (res && res.success === false) {
      return;
    }
    setContactSubmitted(true);
    setCName('');
    setCEmail('');
    setCSubject('');
    setCMessage('');
  };

  // Submit Testimonial Review
  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!curUser) {
      openAuthModal('login');
      return;
    }
    if (rStars === 0 || !rBody.trim()) {
      return;
    }
    submitReview(curUser.name, rStars, rBody.trim(), 'General');
    setRStars(0);
    setRBody('');
  };

  // Get featured products & reviews
  const featuredProducts = products.slice(0, 4);
  const approvedReviews = reviews.filter((r) => r.approved).slice(0, 3);

  return (
    <div className="w-full">
      {/* Editorial Hero Carousel */}
      <BannerCarousel />

      <div className="max-w-[1400px] mx-auto px-4 md:px-7 pb-24">
        {/* Category Navigation Chips */}
        <section className="flex gap-2.5 py-10 overflow-x-auto scrollbar-none border-b border-bdr/50 mb-10">
          <button
            className="shrink-0 text-xs font-semibold px-4 py-2 rounded border border-primary text-primary hover:bg-primary-soft cursor-pointer transition-all duration-200"
            onClick={() => handleFilterGo('All')}
          >
            All products
          </button>
          {['Floor Care', 'Dish Care', 'Laundry Care'].map((cat) => (
            <button
              key={cat}
              className="shrink-0 text-xs font-semibold px-4 py-2 rounded border border-bdr text-mid bg-wht cursor-pointer transition-all duration-200 hover:border-primary hover:text-primary"
              onClick={() => handleFilterGo(cat)}
            >
              {cat}
            </button>
          ))}
        </section>

        {/* Dynamic Product Showcase */}
        <section className="mb-20">
          <div className="flex items-end justify-between border-b border-bdrl pb-4.5 mb-8">
            <div>
              <span className="text-xs font-semibold text-accent mb-1.5 block">
                Storefront catalog
              </span>
              <h3 className="font-display text-2xl font-semibold text-blk leading-none">
                Featured botanical collection
              </h3>
            </div>
            <button
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
              onClick={() => handleFilterGo('All')}
            >
              Explore all <ChevronRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {isProductsLoading
              ? Array.from({ length: 4 }).map((_, idx) => (
                  <ProductSkeletonCard key={idx} />
                ))
              : featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
          </div>
        </section>

        {/* Bento Grid of Trust Indicators */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          {/* Card 1: Main active bento panel (Wide span) */}
          <div className="md:col-span-2 bg-gradient-to-br from-primary-soft to-primary-xlight/50 border border-bdr rounded-xl p-6 sm:p-8 lg:p-10 flex flex-col justify-between min-h-[220px] transition-all duration-200 hover:shadow-premium-md">
            <div>
              <span className="text-xs font-semibold text-accent mb-2 block">
                Pure natural standards
              </span>
              <h4 className="font-display text-xl font-semibold text-primary-hover leading-tight max-w-[480px]">
                Natural, plant-based cleaning. Free from harsh chemicals, synthetic colors, and toxic residues.
              </h4>
            </div>
            <p className="text-sm text-mid/80 max-w-[420px] mt-4">
              We use gentle, plant-derived ingredients like coconut and corn extracts that clean surfaces safely and break down naturally in the environment.
            </p>
          </div>

          {/* Card 2: Lab safety block */}
          <div className="bg-wht border border-bdr rounded-xl p-6 sm:p-8 flex flex-col justify-between min-h-[220px] transition-all duration-200 hover:shadow-premium-md group">
            <div className="w-10 h-10 rounded bg-primary-soft border border-primary-light flex items-center justify-center text-primary shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h5 className="font-display text-base font-semibold text-blk mb-1.5">Lab tested safety</h5>
              <p className="text-sm text-mut leading-relaxed">
                Every single cleaning batch is thoroughly tested to make sure it is completely safe for skin contact and cleans effectively.
              </p>
            </div>
          </div>
 
          {/* Card 3: Family safety block */}
          <div className="bg-wht border border-bdr rounded-xl p-6 sm:p-8 flex flex-col justify-between min-h-[220px] transition-all duration-200 hover:shadow-premium-md group">
            <div className="w-10 h-10 rounded bg-primary-soft border border-primary-light flex items-center justify-center text-primary shrink-0">
              <Heart size={18} />
            </div>
            <div>
              <h5 className="font-display text-base font-semibold text-blk mb-1.5">Baby &amp; pet safe</h5>
              <p className="text-sm text-mut leading-relaxed">
                Our formulas are balanced to be gentle on sensitive skin and safe for pets and children playing on cleaned surfaces.
              </p>
            </div>
          </div>
 
          {/* Card 4: Dispatched shipment block */}
          <div className="md:col-span-2 bg-wht border border-bdr rounded-xl p-6 sm:p-8 lg:p-10 flex flex-row items-center gap-6 min-h-[140px] transition-all duration-200 hover:shadow-premium-md group">
            <div className="w-11 h-11 rounded-full bg-primary-soft border border-primary-light flex items-center justify-center text-primary shrink-0">
              <Truck size={18} />
            </div>
            <div>
              <h5 className="font-display text-base font-semibold text-blk mb-1 animate-fadeIn">Safe shipping</h5>
              <p className="text-sm text-mut leading-relaxed">
                Packed carefully in recyclable bottles and shipped directly to your doorstep. All packaging materials are fully recyclable.
              </p>
            </div>
          </div>
        </section>

        {/* Brand Spread Section */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] bg-wht rounded-xl border border-bdr overflow-hidden mb-16 shadow-premium-sm" id="about">
          <div className="p-6 sm:p-10 lg:p-16 flex flex-col justify-center">
            <div className="text-xs font-semibold text-accent mb-4 flex items-center gap-2 before:content-[''] before:w-6 before:h-[1px] before:bg-accent">
              Natural cleaning
            </div>
            <h2 className="font-display text-[1.7rem] sm:text-3xl font-semibold text-blk tracking-wide leading-tight mb-5">
              Made with <span className="italic text-primary font-normal font-display">natural power</span>,<br />backed by care.
            </h2>
            <p className="text-sm text-mid leading-relaxed mb-8 max-w-[480px]">
              At Clean Everyday, we make our cleaning products with natural, safe ingredients. Our products clean your home effectively without leaving harsh chemical residues or fumes.
            </p>
            <div className="grid grid-cols-3 gap-8 py-6 border-t border-b border-bdrl mb-8 w-fit">
              <div>
                <div className="font-display text-3xl font-semibold text-primary-hover leading-none">99.8%</div>
                <div className="text-xs text-mut mt-2">Natural</div>
              </div>
              <div>
                <div className="font-display text-3xl font-semibold text-primary-hover leading-none">12k+</div>
                <div className="text-xs text-mut mt-2">Homes</div>
              </div>
              <div>
                <div className="font-display text-3xl font-semibold text-primary-hover leading-none">0%</div>
                <div className="text-xs text-mut mt-2">Toxins</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-semibold bg-primary-soft border border-primary-light rounded px-3 py-1.5 text-primary">
                Natural ingredients
              </span>
              <span className="text-xs font-semibold bg-primary-soft border border-primary-light rounded px-3 py-1.5 text-primary">
                Cruelty-free
              </span>
              <span className="text-xs font-semibold bg-primary-soft border border-primary-light rounded px-3 py-1.5 text-primary">
                Safe for homes
              </span>
            </div>
          </div>
          <div
            className="bg-primary-xlight bg-cover bg-center relative min-h-[380px]"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1000')` }}
          >
            <div className="absolute inset-0 bg-blk/10" />
          </div>
        </section>

        {/* Customer Testimonials Grid */}
        <section className="mb-20" id="reviews">
          <div className="flex items-end justify-between border-b border-bdrl pb-4.5 mb-8">
            <div>
              <span className="text-xs font-semibold text-accent mb-1.5 block">
                Verified reviews
              </span>
              <h3 className="font-display text-2xl font-semibold text-blk leading-none">
                Clean Everyday stories
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
            {approvedReviews.map((review) => (
              <ReviewCard key={review.id} review={review} showQuoteIcon={true} />
            ))}
          </div>

          {/* Testimonial Writer Form */}
          <div className="bg-wht border border-bdr rounded-xl p-6 sm:p-8 shadow-premium-sm animate-fadeIn">
            {curUser ? (
              <form className="flex flex-col gap-4" onSubmit={handleReviewSubmit}>
                <div className="text-sm text-mid">
                  Logged in as <strong className="text-blk">{curUser.name}</strong>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-mid">
                  <span>Product rating:</span>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }, (_, i) => {
                      const value = i + 1;
                      const active = value <= (rHoverStars || rStars);
                      return (
                        <Star
                          key={i}
                          size={18}
                          className="cursor-pointer transition-transform duration-100 ease-out hover:scale-120 animate-fadeIn"
                          fill={active ? 'var(--gold)' : 'none'}
                          stroke={active ? 'var(--gold)' : 'var(--fnt)'}
                          onMouseEnter={() => setRHoverStars(value)}
                          onMouseLeave={() => setRHoverStars(0)}
                          onClick={() => setRStars(value)}
                        />
                      );
                    })}
                  </div>
                </div>
                <textarea
                  className="textarea-field"
                  placeholder="Share details of your experience using our botanical solutions..."
                  rows={4}
                  value={rBody}
                  onChange={(e) => setRBody(e.target.value)}
                  required
                />
                <div className="flex items-center gap-4 flex-wrap justify-between">
                  <button
                    className="btn-primary"
                    type="submit"
                  >
                    Publish review
                  </button>
                  <span className="text-xs text-mut italic">
                    All reviews undergo standard administrative verification.
                  </span>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between gap-5 flex-wrap">
                <div className="flex-1 min-w-[240px]">
                  <h4 className="font-display text-base font-semibold text-blk mb-1">Write a review</h4>
                  <p className="text-sm text-mut">Have you used our eco-friendly products? Log in to leave a review.</p>
                </div>
                <button
                  className="text-xs font-semibold text-wht px-4 py-2 rounded bg-primary hover:bg-primary-hover transition-all cursor-pointer"
                  onClick={() => openAuthModal('login')}
                >
                  Sign in to review
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Bento contact panel */}
        <section className="mb-5 rounded-xl overflow-hidden border border-bdr shadow-premium-lg" id="contact">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.35fr]">
            {/* Info panel */}
            <div className="bg-blk p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden after:absolute after:-top-[20%] after:-right-[20%] after:w-[240px] after:h-[240px] after:rounded-full after:bg-[radial-gradient(circle,hsla(150,48%,24%,0.15),transparent_70%)] after:pointer-events-none">
              <div>
                <span className="text-xs font-semibold text-accent mb-4 block">
                  Enquiries desk
                </span>
                <h2 className="font-display text-[1.7rem] sm:text-3xl font-semibold text-wht tracking-wide leading-tight mb-4">
                  Request custom<br />
                  specifications.
                </h2>
                <p className="text-sm text-mut/70 leading-relaxed mb-10 max-w-[280px]">
                  Our botanical support specialists will follow up with complete formulation specs.
                </p>
              </div>
 
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3.5 text-sm text-mut/80">
                  <div className="w-8 h-8 rounded bg-primary/8 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Mail size={14} />
                  </div>
                  <span>support@cleaneveryday.in</span>
                </div>
                <div className="flex items-center gap-3.5 text-sm text-mut/80">
                  <div className="w-8 h-8 rounded bg-primary/8 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Phone size={14} />
                  </div>
                  <span>+91 80 4991 2000 (Mon - Sat)</span>
                </div>
                <div className="flex items-center gap-3.5 text-sm text-mut/80">
                  <div className="w-8 h-8 rounded bg-primary/8 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <MapPin size={14} />
                  </div>
                  <span>Whitefield Main Rd, Bengaluru, KA</span>
                </div>
              </div>
            </div>

            {/* Form panel */}
            <div className="bg-wht p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
              {!contactSubmitted ? (
                <form onSubmit={handleContactSubmit}>
                  <h3 className="font-display text-lg font-semibold text-blk mb-1.5">Enquiry intake sheet</h3>
                  <p className="text-sm text-mut mb-8">All enquiries are logged directly into our active CRM panel for review.</p>
 
                  {/* minimal bottom underline input styles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-mut">Full Name <span className="text-red-500">*</span></label>
                      <input
                        className="border-b border-bdr focus:border-primary px-1 py-2 text-sm text-ink outline-none transition-all bg-transparent w-full"
                        type="text"
                        placeholder="e.g. Priyasheel"
                        required
                        value={cName}
                        onChange={(e) => setCName(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-mut">Email Address <span className="text-red-500">*</span></label>
                      <input
                        className="border-b border-bdr focus:border-primary px-1 py-2 text-sm text-ink outline-none transition-all bg-transparent w-full"
                        type="email"
                        placeholder="e.g. priya@corp.in"
                        required
                        value={cEmail}
                        onChange={(e) => setCEmail(e.target.value)}
                      />
                    </div>
                  </div>
 
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-mut">Subject</label>
                      <input
                        className="border-b border-bdr focus:border-primary px-1 py-2 text-sm text-ink outline-none transition-all bg-transparent w-full"
                        type="text"
                        placeholder="e.g. Bulk sample orders"
                        value={cSubject}
                        onChange={(e) => setCSubject(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-mut">Category Focus</label>
                      <select
                        className="border-b border-bdr focus:border-primary px-1 py-2 text-sm text-ink outline-none transition-all bg-transparent w-full cursor-pointer"
                        value={cService}
                        onChange={(e) => setCService(e.target.value)}
                      >
                        <option>General Support</option>
                        <option>Floor Care</option>
                        <option>Dish Care</option>
                        <option>Laundry Care</option>
                        <option>Partner Enquiries</option>
                      </select>
                    </div>
                  </div>
 
                  <div className="flex flex-col gap-1 mb-6">
                    <label className="text-xs font-medium text-mut">Enquiry Description <span className="text-red-500">*</span></label>
                    <textarea
                      className="border-b border-bdr focus:border-primary px-1 py-2 text-sm text-ink outline-none transition-all bg-transparent w-full resize-y min-h-[72px]"
                      placeholder="Please specify dilution parameters or delivery coordinates..."
                      required
                      value={cMessage}
                      onChange={(e) => setCMessage(e.target.value)}
                    />
                  </div>
 
                  <button
                    className="btn-primary"
                    type="submit"
                  >
                    Submit enquiry form
                    <Send size={12} />
                  </button>
                </form>
              ) : (
                <div className="text-center py-10 px-4 animate-fadeIn">
                  <div className="w-14 h-14 rounded bg-primary-soft border border-primary flex items-center justify-center mx-auto mb-5 text-primary">
                    <Send size={20} className="translate-x-0.5 -translate-y-0.5" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-blk mb-2">Message sent successfully</h3>
                  <p className="text-sm text-mut leading-relaxed max-w-[340px] mx-auto mb-6">
                    The enquiry has been logged successfully. Our corporate support team will review this in the CRM shortly.
                  </p>
                  <button
                    className="btn-primary"
                    onClick={() => setContactSubmitted(false)}
                  >
                    Send another message
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
