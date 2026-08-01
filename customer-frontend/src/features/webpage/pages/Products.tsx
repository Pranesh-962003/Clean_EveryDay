import React from 'react';
import { useApp } from '../../../core/context/AppContext';
import ProductCard from '../components/ProductCard';
import { ChevronRight } from 'lucide-react';

const Products: React.FC = () => {
  const {
    products,
    curFilter,
    setCurFilter,
    searchQuery,
    setSearchQuery,
    setCurPage
  } = useApp();

  const handleFilterClick = (cat: string) => {
    setSearchQuery('');
    setCurFilter(cat);
  };

  // Filter logic
  const filteredProducts = products.filter((product) => {
    const matchesCategory = curFilter === 'All' || product.cat === curFilter;
    const matchesSearch =
      !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.cat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full min-h-[70vh] bg-sur">
      {/* Banner */}
      <div className="bg-wht border-b border-bdr/50 py-10">
        <div className="max-w-[1400px] mx-auto px-4 md:px-7">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-mut mb-4">
            <span
              className="cursor-pointer text-primary hover:underline"
              onClick={() => {
                setSearchQuery('');
                setCurFilter('All');
                setCurPage('home');
              }}
            >
              Home
            </span>
            <ChevronRight size={10} className="text-fnt" />
            <span className="text-mid font-semibold">Store collection</span>
          </div>

          <h1 className="font-display text-2xl font-bold text-blk leading-none mb-6">
            {searchQuery ? `Search: "${searchQuery}"` : `${curFilter} formulations`}
          </h1>

          {/* Filter Chips */}
          <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-none">
            {['All', 'Floor Care', 'Dish Care', 'Laundry Care'].map((cat) => (
              <button
                key={cat}
                className={`shrink-0 text-xs font-semibold px-4 py-2 rounded border border-bdr text-mut bg-wht cursor-pointer transition-all duration-200 hover:border-primary hover:text-primary hover:bg-primary-soft/40 ${
                  curFilter === cat ? 'border-primary text-primary bg-primary-soft shadow-premium-sm font-bold' : ''
                }`}
                onClick={() => handleFilterClick(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid listing */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-7 py-10 pb-24">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-6 bg-wht border border-bdr rounded-xl max-w-[500px] mx-auto shadow-premium-sm">
            <h3 className="font-display text-xl font-semibold text-blk mb-2.5">No formulations found</h3>
            <p className="text-sm text-mut leading-relaxed mb-6">
              We couldn't find any eco home care products matching your criteria. Try adjusting your category filter.
            </p>
            <button
              className="btn-primary"
              onClick={() => {
                setCurFilter('All');
                setSearchQuery('');
              }}
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
