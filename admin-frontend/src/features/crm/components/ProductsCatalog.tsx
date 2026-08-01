import React, { useState } from 'react';
import { useApp } from '../../../core/context/AppContext';
import type { Product } from '../../../core/types';
import {
  Search,
  PlusCircle,
  FileDown,
  FileUp,
  Edit2,
  Copy,
  Trash2,
  Package,
  Layers,
  CheckSquare,
  Square,
  AlertTriangle,
  X,
  Upload
} from 'lucide-react';

interface ProductsCatalogProps {
  onTabChange: (tab: 'dashboard' | 'products' | 'orders' | 'reviews' | 'add' | 'banners' | 'leads' | 'users') => void;
}

const ProductsCatalog: React.FC<ProductsCatalogProps> = ({ onTabChange }) => {
  const {
    products,
    deleteProduct,
    duplicateProduct,
    updateProduct,
    addProduct,
    showToast
  } = useApp();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [brandFilter, setBrandFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Sorting
  const [sortField, setSortField] = useState<keyof Product>('id');
  const [sortAsc, setSortAsc] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Editing Product State (replaces modal, renders full editing page view when active)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletedImagePublicIds, setDeletedImagePublicIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Specifications panel toggle in Edit
  const [editSpecsTab, setEditSpecsTab] = useState<'basic' | 'specs' | 'gallery'>('basic');

  // Brand Options derived from active products
  const brands = Array.from(new Set(products.map((p) => p.brand || 'Clean Everyday')));
  // Categories derived
  const categories = Array.from(new Set(products.map((p) => p.cat)));

  // Sorting helper
  const handleSort = (field: keyof Product) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Filter products list (Removing concept of Archived)
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.cat.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat = catFilter === 'All' || p.cat === catFilter;
    const matchesBrand = brandFilter === 'All' || (p.brand || 'Clean Everyday') === brandFilter;

    let matchesStock = true;
    if (stockFilter === 'In Stock') matchesStock = p.stock > 5;
    else if (stockFilter === 'Low Stock') matchesStock = p.stock > 0 && p.stock <= 5;
    else if (stockFilter === 'Out of Stock') matchesStock = p.stock === 0;

    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;

    return matchesSearch && matchesCat && matchesBrand && matchesStock && matchesStatus;
  });

  // Sorted list
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    return 0;
  });

  // Paginated list
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.length === currentItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentItems.map((item) => item.id));
    }
  };

  const handleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Bulk Actions
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} selected products?`)) {
      for (const id of selectedIds) {
        await deleteProduct(id);
      }
      setSelectedIds([]);
    }
  };

  // CSV Import Parser
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
        if (lines.length <= 1) throw new Error('CSV is empty or lacks headers');

        // Extract headers
        const headers = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim());

        let importCount = 0;
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
          if (cols.length < headers.length) continue;

          // Assemble a product
          const rowData: Record<string, string> = {};
          headers.forEach((h, idx) => {
            rowData[h] = cols[idx];
          });

          const price = parseFloat(rowData['price']) || 299;
          const stock = parseInt(rowData['stock']) || 20;
          const discount = parseFloat(rowData['discount']) || 0;

          addProduct({
            name: rowData['name'] || 'Unnamed Imported Product',
            cat: rowData['cat'] || 'Floor Care',
            desc: rowData['desc'] || 'No description provided.',
            tags: (rowData['tags'] || '').split(';').map((t) => t.trim()).filter(Boolean),
            badge: rowData['badge'] || null,
            imgs: [],
            price,
            sku: rowData['sku'] || `CE-IMP-${Math.floor(Math.random() * 90000)}`,
            brand: rowData['brand'] || 'Clean Everyday',
            discount,
            stock,
            status: (rowData['status'] as any) || 'Active',
            createdDate: rowData['createdDate'] || new Date().toISOString().split('T')[0],
            specs: {
              Size: rowData['specSize'] || '500 ml',
              Usage: rowData['specUsage'] || 'Standard dilution',
              pH: rowData['specPH'] || '7.0',
              Suitable: rowData['specSuitable'] || 'All Surfaces'
            }
          });
          importCount++;
        }
        showToast(`Successfully imported ${importCount} products.`);
      } catch (err: any) {
        showToast(`Import error: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // clear input
  };

  // CSV Export
  const handleCSVExport = () => {
    const flatProducts = sortedProducts.map((p) => ({
      sku: p.sku,
      name: p.name,
      cat: p.cat,
      brand: p.brand || 'Clean Everyday',
      price: p.price,
      discount: p.discount,
      stock: p.stock,
      status: p.status,
      createdDate: p.createdDate,
      badge: p.badge || '',
      tags: p.tags.join(';'),
      desc: p.desc,
      specSize: p.specs.Size || '',
      specUsage: p.specs.Usage || '',
      specPH: p.specs.pH || '',
      specSuitable: p.specs.Suitable || ''
    }));

    if (flatProducts.length === 0) {
      showToast('No products available to export.');
      return;
    }

    const headers = Object.keys(flatProducts[0]).join(',');
    const rows = flatProducts.map((item) =>
      Object.values(item)
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CE_products_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Edit Form submit handler
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsSaving(true);
    const success = await updateProduct(editingProduct, deletedImagePublicIds);
    setIsSaving(false);
    if (success) {
      setEditingProduct(null);
      setDeletedImagePublicIds([]);
    }
  };

  // File to base64 gallery helper
  const handleAddEditGalleryImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result && editingProduct.imgs.length < 5) {
        const nextImgs = [...editingProduct.imgs, reader.result as string];
        setEditingProduct({ ...editingProduct, imgs: nextImgs });
      }
    };
    reader.readAsDataURL(file);
  };

  // IF EDITING MODE IS ACTIVE: RENDER EDITING PAGE LAYOUT INSTEAD OF TABLE LIST
  if (editingProduct) {
    return (
      <div className="bg-wht border border-bdrl rounded-xl shadow-premium-sm p-6 sm:p-8 animate-fadeIn">
        <div className="flex justify-between items-center border-b border-bdrl pb-3 mb-6 select-none">
          <div>
          <span className="text-xs font-medium text-mut">Products catalogue editor</span>
            <h3 className="font-display text-xl font-semibold text-blk mt-0.5">Edit product: {editingProduct.name}</h3>
          </div>
          <button
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 border border-bdr hover:border-primary text-mid hover:text-primary bg-wht rounded cursor-pointer"
            onClick={() => {
              setEditingProduct(null);
              setDeletedImagePublicIds([]);
            }}
            disabled={isSaving}
          >
            <X size={14} /> Back to catalog
          </button>
        </div>

        {/* Tabs selector */}
        <div className="flex gap-4 border-b border-bdrl pb-2 mb-5 select-none text-sm font-medium">
          <button
            className={`pb-1 cursor-pointer transition-colors ${
              editSpecsTab === 'basic' ? 'text-primary border-b-2 border-primary font-bold' : 'text-mut hover:text-blk'
            }`}
            onClick={() => setEditSpecsTab('basic')}
          >
            1. Basic Info
          </button>
          <button
            className={`pb-1 cursor-pointer transition-colors ${
              editSpecsTab === 'specs' ? 'text-primary border-b-2 border-primary font-bold' : 'text-mut hover:text-blk'
            }`}
            onClick={() => setEditSpecsTab('specs')}
          >
            2. Technical Specs
          </button>
          <button
            className={`pb-1 cursor-pointer transition-colors ${
              editSpecsTab === 'gallery' ? 'text-primary border-b-2 border-primary font-bold' : 'text-mut hover:text-blk'
            }`}
            onClick={() => setEditSpecsTab('gallery')}
          >
            3. Gallery ({editingProduct.imgs.length}/5)
          </button>
        </div>

        <form onSubmit={handleEditSubmit} className="text-[0.84rem]">
          {editSpecsTab === 'basic' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-xs font-medium text-mid">Product Name *</label>
                <input
                  className="border border-bdr focus:border-primary rounded px-3 py-2 text-[0.86rem] outline-none"
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-mid">SKU Reference *</label>
                <input
                  className="border border-bdr focus:border-primary rounded px-3 py-2 text-[0.86rem] outline-none font-mono"
                  type="text"
                  required
                  value={editingProduct.sku}
                  onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-mid">Brand *</label>
                <input
                  className="border border-bdr focus:border-primary rounded px-3 py-2 text-[0.86rem] outline-none"
                  type="text"
                  required
                  value={editingProduct.brand || 'Clean Everyday'}
                  onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-mid">Category *</label>
                <select
                  className="border border-bdr focus:border-primary rounded px-3 py-2 text-[0.86rem] outline-none cursor-pointer bg-wht"
                  value={editingProduct.cat}
                  onChange={(e) => setEditingProduct({ ...editingProduct, cat: e.target.value })}
                >
                  <option>Floor Care</option>
                  <option>Dish Care</option>
                  <option>Laundry Care</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-mid">Badge highlight</label>
                <select
                  className="border border-bdr focus:border-primary rounded px-3 py-2 text-[0.86rem] outline-none cursor-pointer bg-wht"
                  value={editingProduct.badge || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value || null })}
                >
                  <option value="">None</option>
                  <option value="New">New</option>
                  <option value="Bestseller">Bestseller</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 font-mono">
                <label className="text-xs font-medium text-mid">Price (INR) *</label>
                <input
                  className="border border-bdr focus:border-primary rounded px-3 py-2 text-[0.86rem] outline-none"
                  type="number"
                  required
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex flex-col gap-1 font-mono">
                <label className="text-xs font-medium text-mid">Discount (%)</label>
                <input
                  className="border border-bdr focus:border-primary rounded px-3 py-2 text-[0.86rem] outline-none"
                  type="number"
                  min={0}
                  max={100}
                  value={editingProduct.discount}
                  onChange={(e) => setEditingProduct({ ...editingProduct, discount: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex flex-col gap-1 font-mono">
                <label className="text-xs font-medium text-mid">Stock level *</label>
                <input
                  className="border border-bdr focus:border-primary rounded px-3 py-2 text-[0.86rem] outline-none"
                  type="number"
                  required
                  value={editingProduct.stock}
                  onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-mid">Status *</label>
                <select
                  className="border border-bdr focus:border-primary rounded px-3 py-2 text-[0.86rem] outline-none cursor-pointer bg-wht"
                  value={editingProduct.status}
                  onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value as any })}
                >
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-xs font-medium text-mid">Tags (Comma Separated)</label>
                <input
                  className="border border-bdr focus:border-primary rounded px-3 py-2 text-[0.86rem] outline-none"
                  type="text"
                  value={editingProduct.tags.join(', ')}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                    })
                  }
                />
              </div>

              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-xs font-medium text-mid">Product Description</label>
                <textarea
                  className="border border-bdr focus:border-primary rounded px-3 py-2 text-[0.86rem] outline-none resize-none"
                  rows={4}
                  value={editingProduct.desc}
                  onChange={(e) => setEditingProduct({ ...editingProduct, desc: e.target.value })}
                />
              </div>
            </div>
          )}

          {editSpecsTab === 'specs' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-mid">Pack Size / Volume</label>
                <input
                  className="border border-bdr focus:border-primary rounded px-3 py-2 text-[0.86rem] outline-none"
                  type="text"
                  placeholder="e.g. 500 ml / 5 Litres"
                  value={editingProduct.specs.Size || ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      specs: { ...editingProduct.specs, Size: e.target.value }
                    })
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-mid">pH Level (Acidity/Alkalinity)</label>
                <input
                  className="border border-bdr focus:border-primary rounded px-3 py-2 text-[0.86rem] outline-none"
                  type="text"
                  placeholder="e.g. 7.0 - Neutral"
                  value={editingProduct.specs.pH || ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      specs: { ...editingProduct.specs, pH: e.target.value }
                    })
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-mid">Suitable Surfaces</label>
                <input
                  className="border border-bdr focus:border-primary rounded px-3 py-2 text-[0.86rem] outline-none"
                  type="text"
                  placeholder="e.g. Marble, Granite, Ceramic"
                  value={editingProduct.specs.Suitable || ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      specs: { ...editingProduct.specs, Suitable: e.target.value }
                    })
                  }
                />
              </div>

              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-xs font-medium text-mid">Usage / Dilution Instructions</label>
                <textarea
                  className="border border-bdr focus:border-primary rounded px-3 py-2 text-[0.86rem] outline-none resize-none"
                  rows={3}
                  placeholder="e.g. Dilute 20ml in 5 Litres of lukewarm water..."
                  value={editingProduct.specs.Usage || ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      specs: { ...editingProduct.specs, Usage: e.target.value }
                    })
                  }
                />
              </div>
            </div>
          )}

          {editSpecsTab === 'gallery' && (
            <div className="flex flex-col gap-5">
              <span className="text-xs font-medium text-mid">Manage product media (Maximum 5 images)</span>

              <div className="grid grid-cols-5 gap-3">
                {editingProduct.imgs.map((img, idx) => (
                  <div key={idx} className="relative aspect-square border border-bdr rounded overflow-hidden bg-sur flex items-center justify-center group">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        const imgUrl = img;
                        const matchingBackendImage = editingProduct.images?.find((item) => item.url === imgUrl);
                        if (matchingBackendImage && matchingBackendImage.public_id) {
                          setDeletedImagePublicIds((prev) => [...prev, matchingBackendImage.public_id]);
                        }
                        
                        const nextImgs = editingProduct.imgs.filter((_, i) => i !== idx);
                        const nextImages = editingProduct.images?.filter((item) => item.url !== imgUrl) || [];
                        setEditingProduct({
                          ...editingProduct,
                          imgs: nextImgs,
                          images: nextImages
                        });
                      }}
                      className="absolute inset-0 bg-blk/60 text-wht flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[0.62rem] font-bold cursor-pointer"
                      disabled={isSaving}
                    >
                      Delete
                    </button>
                  </div>
                ))}

                {editingProduct.imgs.length < 5 && (
                  <label className="aspect-square border border-dashed border-bdr rounded hover:border-primary flex flex-col items-center justify-center text-mut hover:text-primary cursor-pointer transition-colors relative">
                    <Upload size={18} />
                    <span className="text-xs font-medium mt-1">Upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAddEditGalleryImage} />
                  </label>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-6 border-t border-bdrl mt-8">
              <button
              type="submit"
              disabled={isSaving}
              className="bg-primary text-wht rounded px-6 py-2.5 text-sm font-semibold hover:bg-primary-hover cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving modifications...' : 'Save modifications'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setDeletedImagePublicIds([]);
              }}
              disabled={isSaving}
              className="border border-bdr text-mid rounded px-6 py-2.5 text-sm font-semibold hover:bg-sur cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // STANDARD PRODUCT LISTINGS CATALOG TAB VIEW
  return (
    <div className="animate-fadeIn">
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div>
          <h2 className="font-display text-xl font-semibold text-blk">Products catalog</h2>
          <p className="text-sm text-mut">Add, remove, or customize active store items.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* Export button */}
            <button
            onClick={handleCSVExport}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 border border-bdr text-mid bg-wht hover:border-primary hover:text-primary rounded cursor-pointer transition-colors shadow-premium-sm"
          >
            <FileDown size={14} /> Export CSV
          </button>

          {/* Import file input */}
          <label className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 border border-bdr text-mid bg-wht hover:border-primary hover:text-primary rounded cursor-pointer transition-colors shadow-premium-sm">
            <FileUp size={14} /> Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
          </label>

          <button
            className="bg-primary text-wht rounded px-5 py-2 text-sm font-semibold hover:bg-primary-hover transition-colors flex items-center gap-1.5 cursor-pointer"
            onClick={() => onTabChange('add')}
          >
            <PlusCircle size={14} /> New Product
          </button>
        </div>
      </div>

      {/* Stats Summary Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-wht border border-bdrl rounded-xl p-4 shadow-premium-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-primary-soft flex items-center justify-center text-primary shrink-0"><Package size={16} /></div>
          <div>
            <span className="text-xs text-mut font-medium block leading-none mb-1">Total catalog</span>
            <span className="text-xl font-bold text-blk leading-none">{products.length}</span>
          </div>
        </div>

        <div className="bg-wht border border-bdrl rounded-xl p-4 shadow-premium-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-primary-soft flex items-center justify-center text-primary shrink-0"><Layers size={16} /></div>
          <div>
            <span className="text-xs text-mut font-medium block leading-none mb-1">Categories</span>
            <span className="text-xl font-bold text-blk leading-none">{categories.length}</span>
          </div>
        </div>

        <div className="bg-wht border border-bdrl rounded-xl p-4 shadow-premium-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-yellow-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0"><AlertTriangle size={16} /></div>
          <div>
            <span className="text-xs text-mut font-medium block leading-none mb-1">Low stock alerts</span>
            <span className="text-xl font-bold text-blk leading-none">
              {products.filter((p) => p.stock > 0 && p.stock <= 5).length}
            </span>
          </div>
        </div>

        <div className="bg-wht border border-bdrl rounded-xl p-4 shadow-premium-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-primary-soft flex items-center justify-center text-primary shrink-0"><PlusCircle size={16} /></div>
          <div>
            <span className="text-xs text-mut font-medium block leading-none mb-1">Out of stock</span>
            <span className="text-xl font-bold text-blk leading-none">
              {products.filter((p) => p.stock === 0).length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-wht border border-bdrl rounded-xl p-4 shadow-premium-sm mb-6 flex flex-col md:flex-row md:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fnt" size={14} />
          <input
            type="text"
            placeholder="Search products by name, SKU, category..."
            className="w-full border border-bdr rounded bg-wht pl-9 pr-4 py-2 text-sm outline-none focus:border-primary placeholder:text-mut/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-col gap-1 min-w-[120px]">
          <label className="text-xs font-medium text-mut">Category</label>
          <select
            className="border border-bdr rounded bg-wht px-3 py-2 text-sm outline-none cursor-pointer focus:border-primary text-mid font-medium"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
          >
            <option value="All">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Brand Filter */}
        <div className="flex flex-col gap-1 min-w-[120px]">
          <label className="text-xs font-medium text-mut">Brand</label>
          <select
            className="border border-bdr rounded bg-wht px-3 py-2 text-sm outline-none cursor-pointer focus:border-primary text-mid font-medium"
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
          >
            <option value="All">All brands</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Stock Filter */}
        <div className="flex flex-col gap-1 min-w-[120px]">
          <label className="text-xs font-medium text-mut">Inventory</label>
          <select
            className="border border-bdr rounded bg-wht px-3 py-2 text-sm outline-none cursor-pointer focus:border-primary text-mid font-medium"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
          >
            <option value="All">All inventory</option>
            <option value="In Stock">In stock</option>
            <option value="Low Stock">Low stock (≤5)</option>
            <option value="Out of Stock">Out of stock</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex flex-col gap-1 min-w-[120px]">
          <label className="text-xs font-medium text-mut">Status</label>
          <select
            className="border border-bdr rounded bg-wht px-3 py-2 text-sm outline-none cursor-pointer focus:border-primary text-mid font-medium"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All statuses</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Controls */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-primary-soft/50 border border-primary-light/50 px-4 py-3 rounded-md animate-slideUp mb-4">
          <span className="text-sm font-medium text-primary">
            <strong>{selectedIds.length}</strong> product(s) selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 border border-transparent bg-red-bg text-red hover:bg-red-bg/80 rounded cursor-pointer"
            >
              <Trash2 size={12} /> Bulk delete
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-sm font-medium px-2 py-1.5 text-mut hover:text-blk cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Products Table Container */}
      <div className="bg-wht border border-bdrl rounded-xl shadow-premium-sm overflow-hidden mb-6">
        <div className="overflow-x-auto w-full scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-sur border-b border-bdrl text-xs font-medium text-mut select-none sticky top-0 z-10">
                <th className="py-3 px-5 w-[50px] text-center">
                  <button onClick={handleSelectAll} className="text-mid hover:text-primary transition-colors cursor-pointer">
                    {selectedIds.length === currentItems.length && currentItems.length > 0 ? (
                      <CheckSquare size={15} className="text-primary" />
                    ) : (
                      <Square size={15} />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3 w-[70px] whitespace-nowrap">Image</th>
                <th className="py-3 px-4 whitespace-nowrap cursor-pointer hover:text-blk" onClick={() => handleSort('name')}>
                  Product {sortField === 'name' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 whitespace-nowrap cursor-pointer hover:text-blk" onClick={() => handleSort('sku')}>
                  SKU {sortField === 'sku' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 whitespace-nowrap cursor-pointer hover:text-blk" onClick={() => handleSort('cat')}>
                  Category {sortField === 'cat' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 whitespace-nowrap cursor-pointer hover:text-blk" onClick={() => handleSort('brand')}>
                  Brand {sortField === 'brand' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 whitespace-nowrap cursor-pointer hover:text-blk text-right" onClick={() => handleSort('price')}>
                  Price {sortField === 'price' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 text-center whitespace-nowrap cursor-pointer hover:text-blk" onClick={() => handleSort('stock')}>
                  Stock {sortField === 'stock' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 text-center whitespace-nowrap cursor-pointer hover:text-blk" onClick={() => handleSort('status')}>
                  Status {sortField === 'status' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-5 text-right w-[120px] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bdrl">
              {currentItems.length > 0 ? (
                currentItems.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  const isLowStock = p.stock > 0 && p.stock <= 5;
                  const isOutOfStock = p.stock === 0;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-sur/10 transition-colors ${
                        isSelected ? 'bg-primary-soft/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-5 text-center">
                        <button onClick={() => handleSelectOne(p.id)} className="text-mid hover:text-primary transition-colors cursor-pointer">
                          {isSelected ? (
                            <CheckSquare size={15} className="text-primary" />
                          ) : (
                            <Square size={15} />
                          )}
                        </button>
                      </td>

                      {/* Image Thumbnail */}
                      <td className="py-3 px-3">
                        <div className="w-12 h-12 rounded bg-sur border border-bdr overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                          {p.imgs && p.imgs.length > 0 ? (
                            <img src={p.imgs[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-[11px] font-semibold text-primary">
                              {p.cat.substring(0, 3).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Name Details */}
                      <td className="py-3 px-4 min-w-[200px]">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-sm font-semibold text-blk truncate max-w-[250px]">{p.name}</span>
                          {p.badge && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blk text-wht">
                              {p.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-mut block">Created: {p.createdDate}</span>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-4 font-mono text-xs text-mid whitespace-nowrap">{p.sku}</td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="bg-primary-soft text-primary-hover border border-primary-light/40 px-2.5 py-1 rounded-full text-xs font-medium">
                          {p.cat}
                        </span>
                      </td>

                      {/* Brand */}
                      <td className="py-3 px-4 text-sm text-mid font-medium">{p.brand || 'Clean Everyday'}</td>

                      {/* Price */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-semibold text-blk text-sm">₹{p.price}</div>
                        {p.discount > 0 && (
                          <span className="text-xs text-red font-medium">-{p.discount}% off</span>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-sm font-semibold px-2.5 py-0.5 rounded ${
                            isOutOfStock
                              ? 'bg-red-bg text-red'
                              : isLowStock
                              ? 'bg-yellow-50 text-amber-700'
                              : 'text-blk bg-sur'
                          }`}
                        >
                          {p.stock}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                            p.status === 'Active'
                              ? 'bg-primary-soft text-primary'
                              : 'bg-yellow-50 text-amber-700'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Edit Product"
                            className="p-1.5 border border-bdr hover:border-primary hover:text-primary-hover rounded text-mid bg-wht transition-colors cursor-pointer"
                            onClick={() => setEditingProduct({ ...p })}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            title="Duplicate Product"
                            className="p-1.5 border border-bdr hover:border-primary hover:text-primary-hover rounded text-mid bg-wht transition-colors cursor-pointer"
                            onClick={() => duplicateProduct(p.id)}
                          >
                            <Copy size={12} />
                          </button>
                          <button
                            title="Delete Product"
                            className="p-1.5 border border-bdr hover:border-red hover:text-red hover:bg-red-bg rounded text-mid bg-wht transition-colors cursor-pointer"
                            onClick={async () => {
                              if (confirm(`Are you sure you want to permanently delete the product ${p.name}?`)) {
                                await deleteProduct(p.id);
                              }
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-14 text-center text-fnt text-[0.82rem]">
                    <div className="flex flex-col items-center gap-3">
                      <Package size={28} className="opacity-60" />
                      <span>No products found matching the filters.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Row */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-bdrl select-none">
            <span className="text-[0.74rem] text-mut font-medium">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> (<strong>{sortedProducts.length}</strong> products)
            </span>
            <div className="flex gap-1.5 font-mono text-[0.74rem]">
              <button
                onClick={() => setCurrentPage((c) => Math.max(c - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 border border-bdr rounded bg-wht hover:border-primary disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1.5 border rounded cursor-pointer transition-all ${
                    currentPage === i + 1
                      ? 'bg-primary text-wht border-primary font-bold'
                      : 'bg-wht border-bdr text-mid hover:border-primary'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((c) => Math.min(c + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 border border-bdr rounded bg-wht hover:border-primary disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsCatalog;
