import React, { useState, useMemo } from 'react';
import { useApp } from '../../../core/context/AppContext';
import ProductCard from '../components/ProductCard';
import ProductSkeletonCard from '../components/ProductSkeletonCard';
import { ChevronRight, SlidersHorizontal, X, Check, RotateCcw } from 'lucide-react';

type SortOption = 'default' | 'price-low' | 'price-high' | 'rating' | 'name';

const Products: React.FC = () => {
  const {
    products,
    isProductsLoading,
    curFilter,
    setCurFilter,
    searchQuery,
    setSearchQuery,
    setCurPage
  } = useApp();

  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');

  // Dynamically extract available categories from existing product list
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.cat).filter(Boolean)));
    return ['All', ...cats];
  }, [products]);

  const handleFilterClick = (cat: string) => {
    setSearchQuery('');
    setCurFilter(cat);
    setIsMobileFiltersOpen(false);
  };

  const handleResetFilters = () => {
    setCurFilter('All');
    setSearchQuery('');
    setSelectedPriceRange('all');
    setSortBy('default');
    setIsMobileFiltersOpen(false);
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesCategory = curFilter === 'All' || product.cat === curFilter;
        const matchesSearch =
          !searchQuery ||
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.cat && product.cat.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (product.desc && product.desc.toLowerCase().includes(searchQuery.toLowerCase()));

        let matchesPrice = true;
        if (selectedPriceRange === 'under-250') matchesPrice = product.price < 250;
        else if (selectedPriceRange === '250-500')
          matchesPrice = product.price >= 250 && product.price <= 500;
        else if (selectedPriceRange === 'above-500') matchesPrice = product.price > 500;

        return matchesCategory && matchesSearch && matchesPrice;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [products, curFilter, searchQuery, selectedPriceRange, sortBy]);

  const hasActiveFilters =
    curFilter !== 'All' || selectedPriceRange !== 'all' || Boolean(searchQuery);

  return (
    <div className="w-full min-h-[80vh] bg-slate-50/50">
      {/* Top Header / Breadcrumb Strip */}
      <div className="bg-white border-b border-slate-200 py-7">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-slate-500 mb-3.5" aria-label="Breadcrumb">
            <button
              type="button"
              className="text-slate-600 hover:text-slate-950 font-medium transition-colors cursor-pointer"
              onClick={() => {
                setSearchQuery('');
                setCurFilter('All');
                setCurPage('home');
              }}
            >
              Home
            </button>
            <ChevronRight size={13} className="text-slate-400" />
            <span className="text-slate-950 font-semibold">Catalog</span>
            {curFilter !== 'All' && (
              <>
                <ChevronRight size={13} className="text-slate-400" />
                <span className="text-slate-700 font-medium">{curFilter}</span>
              </>
            )}
            {searchQuery && (
              <>
                <ChevronRight size={13} className="text-slate-400" />
                <span className="text-slate-900 font-semibold italic">"{searchQuery}"</span>
              </>
            )}
          </nav>

          {/* Heading + Count + Sort Control */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                  {searchQuery
                    ? `Results for "${searchQuery}"`
                    : curFilter === 'All'
                    ? 'All Products'
                    : curFilter}
                </h1>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-900 border border-slate-200 shadow-2xs">
                  {filteredProducts.length} items
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-normal">
                Curated premium home essentials designed for quality, longevity, and function.
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Mobile Filter Toggle Button */}
              <button
                type="button"
                className="lg:hidden inline-flex items-center gap-2 border border-slate-300 bg-white text-slate-900 text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs hover:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer min-h-[44px]"
                onClick={() => setIsMobileFiltersOpen(true)}
              >
                <SlidersHorizontal size={15} />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-slate-950" />
                )}
              </button>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 font-semibold hidden sm:inline">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="border border-slate-300 rounded-xl bg-white text-xs font-semibold text-slate-900 py-2.5 px-3.5 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 cursor-pointer shadow-xs min-w-[155px] min-h-[44px]"
                  aria-label="Sort catalog"
                >
                  <option value="default">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="name">Name: A to Z</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 items-start">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block bg-white border border-slate-200/90 rounded-2xl p-6 space-y-6 sticky top-[100px] shadow-2xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-950">
                Filters
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                >
                  Reset all
                </button>
              )}
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Categories
              </h3>
              <div className="space-y-1.5">
                {categories.map((cat) => {
                  const count =
                    cat === 'All'
                      ? products.length
                      : products.filter((p) => p.cat === cat).length;
                  const isSelected = curFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleFilterClick(cat)}
                      className={`w-full text-left text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-between cursor-pointer min-h-[38px] ${
                        isSelected
                          ? 'bg-slate-950 text-white font-bold shadow-xs'
                          : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 font-medium'
                      }`}
                    >
                      <span>{cat}</span>
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-white/20 text-white font-bold' : 'text-slate-500 bg-slate-100'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Range */}
            <div className="pt-5 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Price Range
              </h3>
              <div className="space-y-2.5">
                {[
                  { id: 'all', label: 'All Prices' },
                  { id: 'under-250', label: 'Under ₹250' },
                  { id: '250-500', label: '₹250 to ₹500' },
                  { id: 'above-500', label: 'Above ₹500' }
                ].map((range) => (
                  <label
                    key={range.id}
                    className="flex items-center gap-3 text-xs font-medium text-slate-800 cursor-pointer hover:text-slate-950 select-none py-1"
                  >
                    <input
                      type="radio"
                      name="priceRangeDesktop"
                      value={range.id}
                      checked={selectedPriceRange === range.id}
                      onChange={(e) => setSelectedPriceRange(e.target.value)}
                      className="w-4 h-4 border-slate-300 text-slate-950 focus:ring-slate-950/20 accent-slate-950 cursor-pointer"
                    />
                    <span>{range.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Product Grid Area */}
          <main>
            {/* Active Filters Pill Strip */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2.5 flex-wrap mb-7">
                <span className="text-xs text-slate-500 font-semibold">Applied:</span>
                {curFilter !== 'All' && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-300 text-xs font-semibold text-slate-900 shadow-2xs">
                    <span>Category: {curFilter}</span>
                    <button
                      type="button"
                      onClick={() => setCurFilter('All')}
                      className="text-slate-400 hover:text-slate-950 cursor-pointer p-0.5"
                      aria-label="Remove category filter"
                    >
                      <X size={13} strokeWidth={2.5} />
                    </button>
                  </span>
                )}
                {selectedPriceRange !== 'all' && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-300 text-xs font-semibold text-slate-900 shadow-2xs">
                    <span>Price: {selectedPriceRange}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedPriceRange('all')}
                      className="text-slate-400 hover:text-slate-950 cursor-pointer p-0.5"
                      aria-label="Remove price filter"
                    >
                      <X size={13} strokeWidth={2.5} />
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-300 text-xs font-semibold text-slate-900 shadow-2xs">
                    <span>Keyword: "{searchQuery}"</span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-slate-400 hover:text-slate-950 cursor-pointer p-0.5"
                      aria-label="Clear search"
                    >
                      <X size={13} strokeWidth={2.5} />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-950 underline ml-2 cursor-pointer flex items-center gap-1.5 py-1"
                >
                  <RotateCcw size={13} /> Clear filters
                </button>
              </div>
            )}

            {/* Product Cards Grid */}
            {isProductsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <ProductSkeletonCard key={idx} />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id || product._id} product={product} />
                ))}
              </div>
            ) : (
              /* Minimalist Empty State */
              <div className="bg-white border border-slate-200/90 rounded-2xl p-14 text-center max-w-[500px] mx-auto shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-4 text-slate-500">
                  <SlidersHorizontal size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-950 mb-1.5">No products found</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 max-w-sm mx-auto font-normal">
                  No catalog items matched your current combination of category and price filters.
                </p>
                <button
                  type="button"
                  className="btn-primary text-xs font-semibold min-h-[44px] px-6"
                  onClick={handleResetFilters}
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Slide-over Drawer */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-[300] flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs animate-fadeIn"
            onClick={() => setIsMobileFiltersOpen(false)}
          />

          <div className="relative ml-auto w-full max-w-[340px] bg-white h-full shadow-2xl flex flex-col z-10 animate-slideLeft">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <span className="text-sm font-bold uppercase tracking-wider text-slate-950">
                Filters
              </span>
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              {/* Category */}
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                  Category
                </span>
                <div className="space-y-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleFilterClick(cat)}
                      className={`w-full text-left text-xs py-2.5 px-3.5 rounded-xl flex items-center justify-between cursor-pointer min-h-[44px] transition-colors ${
                        curFilter === cat
                          ? 'bg-slate-950 text-white font-bold shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <span>{cat}</span>
                      {curFilter === cat && <Check size={16} strokeWidth={2.5} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="pt-5 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                  Price
                </span>
                <div className="space-y-2.5">
                  {[
                    { id: 'all', label: 'All Prices' },
                    { id: 'under-250', label: 'Under ₹250' },
                    { id: '250-500', label: '₹250 to ₹500' },
                    { id: 'above-500', label: 'Above ₹500' }
                  ].map((range) => (
                    <label
                      key={range.id}
                      className="flex items-center gap-3 text-xs font-medium text-slate-800 cursor-pointer py-1.5 select-none"
                    >
                      <input
                        type="radio"
                        name="priceRangeMobile"
                        value={range.id}
                        checked={selectedPriceRange === range.id}
                        onChange={(e) => setSelectedPriceRange(e.target.value)}
                        className="w-4 h-4 border-slate-300 text-slate-950 focus:ring-slate-950/20 accent-slate-950 cursor-pointer"
                      />
                      <span>{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-200 flex gap-3 bg-slate-50/50">
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn-secondary flex-1 text-xs font-semibold min-h-[44px]"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="btn-primary flex-1 text-xs font-semibold min-h-[44px]"
              >
                Show {filteredProducts.length} items
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
