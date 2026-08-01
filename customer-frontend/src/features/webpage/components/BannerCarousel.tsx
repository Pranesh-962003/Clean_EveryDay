import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../../core/context/AppContext';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

const BannerCarousel: React.FC = () => {
  const { banners, setCurPage } = useApp();
  const [curIndex, setCurIndex] = useState(0);
  const timerRef = useRef<any | null>(null);

  const startSlider = () => {
    stopSlider();
    timerRef.current = setInterval(() => {
      setCurIndex((prev) => (prev + 1) % banners.length);
    }, 5500);
  };

  const stopSlider = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  useEffect(() => {
    startSlider();
    return () => stopSlider();
  }, [banners.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurIndex((prev) => (prev - 1 + banners.length) % banners.length);
    startSlider();
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurIndex((prev) => (prev + 1) % banners.length);
    startSlider();
  };

  const handleDotClick = (index: number) => {
    setCurIndex(index);
    startSlider();
  };

  if (!banners || banners.length === 0) return null;

  return (
    <div
      className="relative w-full aspect-[16/6] max-h-[520px] min-h-[300px] overflow-hidden bg-blk"
      onMouseEnter={stopSlider}
      onMouseLeave={startSlider}
    >
      {/* Background slide track */}
      <div
        className="flex h-full w-full transition-transform duration-[800ms] ease-in-out"
        style={{ transform: `translateX(-${curIndex * 100}%)` }}
      >
        {banners.map((banner, index) => {
          const isActive = index === curIndex;
          return (
            <div className="min-w-full h-full relative overflow-hidden" key={index}>
              {/* Background representation */}
              {banner.img ? (
                <div className="absolute inset-0 w-full h-full">
                  <img
                    src={banner.img}
                    alt={banner.label || `Slide ${index + 1}`}
                    className={`w-full h-full object-cover block transition-transform duration-[6000ms] ease-out ${
                      isActive ? 'scale-105' : 'scale-100'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-blk/80 via-blk/40 to-transparent" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(150,60%,6%)] via-[hsl(150,45%,15%)] to-[hsl(150,30%,24%)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,hsla(150,80%,40%,0.08),transparent_50%)] pointer-events-none" />
                </div>
              )}

              {/* Text overlays (Renders over both image and gradient background) */}
              <div className="absolute inset-0 flex items-center justify-start text-left p-8 sm:p-20 z-10">
                <div className={`max-w-[620px] transition-all duration-700 ease-out transform ${
                  isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}>
                  {banner.label && (
                    <span className="font-mono text-[0.6rem] md:text-[0.74rem] font-semibold tracking-[0.25em] uppercase text-accent mb-3.5 flex items-center gap-2">
                      <Sparkles size={11} className="animate-pulse" />
                      {banner.label}
                    </span>
                  )}
                  <h2 className="font-display text-[1.8rem] sm:text-[3.2rem] font-bold text-wht tracking-wide leading-tight mb-4 drop-shadow-sm">
                    {banner.title || 'Organic Clean Solutions'}
                  </h2>
                  <p className="text-[0.82rem] sm:text-[0.96rem] text-mut/80 max-w-[480px] leading-relaxed mb-6">
                    {banner.subtitle || 'Clean living, organic ingredients, safe spaces'}
                  </p>
                  {banner.ctaText && (
                    <button
                      onClick={() => setCurPage(banner.ctaLink || 'products')}
                      className="bg-primary text-wht border border-transparent px-6 py-3 rounded font-mono text-[0.72rem] uppercase tracking-widest font-semibold cursor-pointer hover:bg-primary-hover transition-colors"
                    >
                      {banner.ctaText}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nav Arrows (slim circles) */}
      <button
        className="absolute top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full border border-white/10 bg-blk/15 text-wht/60 backdrop-blur-[2px] flex items-center justify-center transition-all duration-200 hover:text-primary hover:border-primary hover:bg-wht cursor-pointer left-4"
        onClick={handlePrev}
        aria-label="Previous slide"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        className="absolute top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full border border-white/10 bg-blk/15 text-wht/60 backdrop-blur-[2px] flex items-center justify-center transition-all duration-200 hover:text-primary hover:border-primary hover:bg-wht cursor-pointer right-4"
        onClick={handleNext}
        aria-label="Next slide"
      >
        <ChevronRight size={16} />
      </button>

      {/* Luxury Minimalist Line Indicators */}
      <div className="absolute bottom-5 left-8 flex gap-2 z-10">
        {banners.map((_, index) => (
          <button
            key={index}
            className={`h-[2px] w-6 bg-white/20 cursor-pointer transition-all duration-500 ease-out ${
              index === curIndex ? 'bg-primary w-12' : ''
            }`}
            onClick={() => handleDotClick(index)}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default BannerCarousel;
