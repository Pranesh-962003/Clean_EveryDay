import React from 'react';
import { useApp } from '../../../core/context/AppContext';
import { Leaf, ArrowUp } from 'lucide-react';

const Footer: React.FC = () => {
  const { setCurPage, setCurFilter } = useApp();

  const handleCategoryClick = (cat: string) => {
    setCurFilter(cat);
    setCurPage('products');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-blk text-mut border-t border-white/5">
      <div className="max-w-[1400px] mx-auto px-4 md:px-7">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 py-16 border-b border-white/5">
          {/* Brand Column */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-4 cursor-pointer" onClick={() => setCurPage('home')}>
              <div className="w-7 h-7 border border-primary rounded-tr-[50%] rounded-tl-[50%] rounded-bl-[50%] rounded-br-[6px] flex items-center justify-center bg-white/5">
                <Leaf size={12} className="text-primary" />
              </div>
              <span className="font-display text-[1.05rem] font-bold text-wht tracking-wide">Clean Everyday</span>
            </div>
            <p className="text-[0.78rem] leading-relaxed text-mut/80 max-w-[240px] mb-5">
              Premium home care products formulated with high-quality natural active ingredients and enzymes.
            </p>
            <div className="inline-flex items-center gap-2 border border-white/8 rounded px-3 py-1.5 font-mono text-[0.58rem] tracking-wider text-mut w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Quality Batch Certified
            </div>
          </div>

          {/* Links Column 1: Shop */}
          <div>
            <h4 className="font-mono text-[0.62rem] font-bold tracking-[0.2em] uppercase text-wht mb-4.5">Shop Actives</h4>
            <ul className="list-none flex flex-col gap-2.5">
              <li>
                <button className="text-left text-[0.78rem] text-mut hover:text-primary transition-colors duration-200 p-0 cursor-pointer" onClick={() => handleCategoryClick('All')}>
                  All Products
                </button>
              </li>
              <li>
                <button className="text-left text-[0.78rem] text-mut hover:text-primary transition-colors duration-200 p-0 cursor-pointer" onClick={() => handleCategoryClick('Floor Care')}>
                  Floor Care
                </button>
              </li>
              <li>
                <button className="text-left text-[0.78rem] text-mut hover:text-primary transition-colors duration-200 p-0 cursor-pointer" onClick={() => handleCategoryClick('Dish Care')}>
                  Dish Care
                </button>
              </li>
              <li>
                <button className="text-left text-[0.78rem] text-mut hover:text-primary transition-colors duration-200 p-0 cursor-pointer" onClick={() => handleCategoryClick('Laundry Care')}>
                  Laundry Care
                </button>
              </li>
            </ul>
          </div>

          {/* Links Column 2: Customer Care */}
          <div>
            <h4 className="font-mono text-[0.62rem] font-bold tracking-[0.2em] uppercase text-wht mb-4.5">Customer Care</h4>
            <ul className="list-none flex flex-col gap-2.5">
              <li>
                <button
                  className="text-left text-[0.78rem] text-mut hover:text-primary transition-colors duration-200 p-0 cursor-pointer"
                  onClick={() => {
                    setCurPage('home');
                    setTimeout(() => {
                      document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                >
                  Our Story
                </button>
              </li>
              <li>
                <button
                  className="text-left text-[0.78rem] text-mut hover:text-primary transition-colors duration-200 p-0 cursor-pointer"
                  onClick={() => {
                    setCurPage('home');
                    setTimeout(() => {
                      document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                >
                  Customer Reviews
                </button>
              </li>
              <li>
                <button
                  className="text-left text-[0.78rem] text-mut hover:text-primary transition-colors duration-200 p-0 cursor-pointer"
                  onClick={() => {
                    setCurPage('home');
                    setTimeout(() => {
                      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                >
                  Contact Support
                </button>
              </li>
            </ul>
          </div>

          {/* Links Column 3: Corporate info */}
          <div>
            <h4 className="font-mono text-[0.62rem] font-bold tracking-[0.2em] uppercase text-wht mb-4.5">Enquiries</h4>
            <p className="text-[0.78rem] leading-relaxed text-mut">
              Clean Everyday India Corp.<br />
              Whitefield, Bangalore, KA<br />
              <span className="block mt-2 text-[0.74rem] text-mut/90 font-medium">Support: support@cleaneveryday.in</span>
              <span className="block mt-0.5 text-[0.74rem] text-mut/90 font-medium">Partnership: partner@cleaneveryday.in</span>
            </p>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="flex justify-between items-center py-6 text-[0.72rem] text-mut/50 flex-wrap gap-3 font-medium">
          <span>&copy; {new Date().getFullYear()} Clean Everyday. All rights reserved.</span>
          <button
            className="inline-flex items-center text-[0.72rem] font-mono tracking-wider uppercase font-semibold text-mut px-3.5 py-1.5 rounded border border-white/8 transition-all duration-200 hover:border-primary hover:text-primary hover:bg-white/2 cursor-pointer"
            onClick={scrollToTop}
            aria-label="Scroll to top"
          >
            Scroll to Top
            <ArrowUp size={12} style={{ marginLeft: '6px' }} />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
