import React, { useState, useEffect, useRef } from 'react';
import type { Story } from '../../../core/types';
import ReviewCard from './ReviewCard';
import { ChevronLeft, ChevronRight, Sparkles, MessageSquareHeart } from 'lucide-react';

interface HorizontalStoryCarouselProps {
  stories: Story[];
}

const HorizontalStoryCarousel: React.FC<HorizontalStoryCarouselProps> = ({ stories }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [itemsPerView, setItemsPerView] = useState(3);
  const touchStartX = useRef<number | null>(null);

  const totalStories = stories.length;

  // Responsive itemsPerView listener
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsPerView(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2);
      } else {
        setItemsPerView(3);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, totalStories - itemsPerView);

  // Auto-slide liquid flow timer when totalStories > itemsPerView
  useEffect(() => {
    if (totalStories <= itemsPerView || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 3800);

    return () => clearInterval(timer);
  }, [totalStories, itemsPerView, isPaused, maxIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  // Touch Swipe Handlers for mobile & touch screen smooth flow
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
  };

  // Empty State
  if (totalStories === 0) {
    return (
      <div className="bg-wht border border-bdr rounded-xl p-8 text-center flex flex-col items-center justify-center my-6 min-h-[200px] shadow-premium-sm">
        <div className="w-12 h-12 rounded-full bg-primary-soft border border-primary-light flex items-center justify-center text-primary mb-3">
          <MessageSquareHeart size={22} />
        </div>
        <h4 className="font-display text-base font-semibold text-blk mb-1">
          No customer stories yet
        </h4>
        <p className="text-sm text-mut max-w-[420px]">
          Be the first to share your experience! Write your review below to feature under Clean Everyday stories.
        </p>
      </div>
    );
  }

  // If 3 or fewer stories, render clean grid
  if (totalStories <= itemsPerView) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
        {stories.map((story, idx) => (
          <ReviewCard key={story._id || story.id || idx} review={story as any} showQuoteIcon={true} />
        ))}
      </div>
    );
  }

  // Calculation for smooth liquid sliding transform
  // For 3 items: calc(-1 * currentIndex * (100% + 1.5rem) / 3)
  const gapRem = 1.5; // 1.5rem = 24px (gap-6)
  const slideTransform = `calc(-${currentIndex} * (100% + ${gapRem}rem) / ${itemsPerView})`;

  return (
    <div
      className="mb-8 relative group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Controls Header Bar */}
      <div className="flex items-center justify-between bg-primary-soft/50 border border-bdr rounded-t-xl px-4 py-2.5 text-xs text-mid mb-4">
        <div className="flex items-center gap-2 font-semibold text-primary">
          <Sparkles size={14} className="animate-pulse" />
          <span>Liquid story stream ({currentIndex + 1} of {totalStories})</span>
          {isPaused && (
            <span className="text-[0.68rem] bg-wht text-mut px-2 py-0.5 rounded border border-bdr">
              Paused on hover
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="w-8 h-8 rounded-full bg-wht border border-bdr flex items-center justify-center text-blk hover:text-primary hover:border-primary transition-all duration-200 cursor-pointer shadow-xs active:scale-95"
            title="Previous Story"
            type="button"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleNext}
            className="w-8 h-8 rounded-full bg-wht border border-bdr flex items-center justify-center text-blk hover:text-primary hover:border-primary transition-all duration-200 cursor-pointer shadow-xs active:scale-95"
            title="Next Story"
            type="button"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Silky Liquid Flow Horizontal Track Viewport */}
      <div className="overflow-hidden p-1 rounded-xl">
        <div
          className="flex gap-6 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ transform: `translateX(${slideTransform})` }}
        >
          {stories.map((story, idx) => (
            <div
              key={story._id || story.id || idx}
              className="shrink-0 w-full sm:w-[calc((100%-1.5rem)/2)] md:w-[calc((100%-3rem)/3)] flex flex-col h-full transition-all duration-500"
            >
              <ReviewCard review={story as any} showQuoteIcon={true} />
            </div>
          ))}
        </div>
      </div>

      {/* Smooth Liquid Dots Bar */}
      <div className="flex justify-center items-center gap-1.5 mt-5">
        {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer ${
              currentIndex === idx
                ? 'w-7 bg-primary shadow-sm'
                : 'w-2 bg-bdr hover:bg-mid/50'
            }`}
            title={`Slide to index ${idx + 1}`}
            type="button"
          />
        ))}
      </div>
    </div>
  );
};

export default HorizontalStoryCarousel;
