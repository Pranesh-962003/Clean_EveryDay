import React, { useState, useEffect } from 'react';
import { useApp } from '../../../core/context/AppContext';
import { Upload, Info, Check, ArrowRight, ArrowLeft, Package, Star, ShieldCheck } from 'lucide-react';

interface AddProductFormProps {
  onTabChange: (tab: 'dashboard' | 'products' | 'orders' | 'reviews' | 'add' | 'banners' | 'leads' | 'users') => void;
}

const AddProductForm: React.FC<AddProductFormProps> = ({ onTabChange }) => {
  const { addProduct, showToast } = useApp();

  // Active Step (1 to 6)
  const [step, setStep] = useState(1);
  const [isPublishing, setIsPublishing] = useState(false);

  // Form States (matching Product interface specifications)
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [cat, setCat] = useState('Floor Care');
  const [brand, setBrand] = useState('Clean Everyday');
  const [desc, setDesc] = useState('');
  const [tags, setTags] = useState('');
  const [badge, setBadge] = useState('');

  // Pricing
  const [price, setPrice] = useState<number>(299);
  const [discount, setDiscount] = useState<number>(0);

  // Inventory
  const [stock, setStock] = useState<number>(50);
  const [minStockAlert, setMinStockAlert] = useState<number>(5);

  // Images
  const [images, setImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // SEO Metas
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');

  // Specs Basic Staging
  const [specSize, setSpecSize] = useState('500 ml / 1 L');
  const [specUsage, setSpecUsage] = useState('1 cap in half a bucket of water');
  const [specPH, setSpecPH] = useState('7.0');
  const [specSuitable, setSpecSuitable] = useState('All hard floors (tiles, wood, marble)');

  // Load draft from LocalStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('ce_prod_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setName(draft.name || '');
        setSku(draft.sku || '');
        setCat(draft.cat || 'Floor Care');
        setBrand(draft.brand || 'Clean Everyday');
        setDesc(draft.desc || '');
        setTags(draft.tags || '');
        setBadge(draft.badge || '');
        setPrice(draft.price || 299);
        setDiscount(draft.discount || 0);
        setStock(draft.stock || 50);
        setImages(draft.images || []);
        setMetaTitle(draft.metaTitle || '');
        setMetaDesc(draft.metaDesc || '');
        setMetaKeywords(draft.metaKeywords || '');
        setSpecSize(draft.specSize || '500 ml / 1 L');
        setSpecUsage(draft.specUsage || '1 cap in half a bucket of water');
        setSpecPH(draft.specPH || '7.0');
        setSpecSuitable(draft.specSuitable || 'All hard floors');
      } catch (e) {
        console.warn('Failed to restore draft.', e);
      }
    }
  }, []);

  // Autosave to LocalStorage when fields change
  useEffect(() => {
    const draftData = {
      name,
      sku,
      cat,
      brand,
      desc,
      tags,
      badge,
      price,
      discount,
      stock,
      images,
      metaTitle,
      metaDesc,
      metaKeywords,
      specSize,
      specUsage,
      specPH,
      specSuitable
    };
    localStorage.setItem('ce_prod_draft', JSON.stringify(draftData));
  }, [
    name, sku, cat, brand, desc, tags, badge,
    price, discount, stock, images,
    metaTitle, metaDesc, metaKeywords,
    specSize, specUsage, specPH, specSuitable
  ]);

  // File to base64 converter helper
  const processImageFile = (file: File) => {
    if (images.length >= 5) {
      showToast('Maximum 5 images allowed');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setImages((prev) => [...prev, reader.result as string]);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        processImageFile(file);
      }
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => processImageFile(file));
  };

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleClearDraft = () => {
    if (confirm('Are you sure you want to clear your current product draft?')) {
      localStorage.removeItem('ce_prod_draft');
      setName('');
      setSku('');
      setCat('Floor Care');
      setBrand('Clean Everyday');
      setDesc('');
      setTags('');
      setBadge('');
      setPrice(299);
      setDiscount(0);
      setStock(50);
      setImages([]);
      setMetaTitle('');
      setMetaDesc('');
      setMetaKeywords('');
      setSpecSize('500 ml / 1 L');
      setSpecUsage('1 cap in half a bucket of water');
      setSpecPH('7.0');
      setSpecSuitable('All hard floors');
      setStep(1);
      showToast('Draft cleared.');
    }
  };

  // Form submit Publish
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim() || !desc.trim() || !specSize.trim()) {
      showToast('Please check required fields in previous steps.');
      return;
    }

    const tagsArr = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setIsPublishing(true);
    const success = await addProduct({
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      cat,
      brand: brand.trim(),
      desc: desc.trim(),
      tags: tagsArr,
      badge: badge || null,
      imgs: images,
      price,
      discount,
      stock,
      status: 'Active',
      createdDate: new Date().toISOString().split('T')[0],
      specs: {
        Size: specSize.trim(),
        Usage: specUsage.trim(),
        pH: specPH.trim(),
        Suitable: specSuitable.trim()
      },
      seo: {
        metaTitle: metaTitle.trim(),
        metaDescription: metaDesc.trim(),
        metaKeywords: metaKeywords.split(',').map((k) => k.trim()).filter(Boolean)
      }
    });
    setIsPublishing(false);

    if (success) {
      // Clean LocalStorage draft
      localStorage.removeItem('ce_prod_draft');
      
      // Reset Form
      setName('');
      setSku('');
      setDesc('');
      setTags('');
      setBadge('');
      setImages([]);
      setPrice(299);
      setDiscount(0);
      setStock(50);
      setMetaTitle('');
      setMetaDesc('');
      setMetaKeywords('');
      
      // Redirect
      onTabChange('products');
    }
  };

  const stepsHeader = [
    'General Information',
    'Pricing & Margin',
    'Inventory & Specs',
    'Media Assets',
    'SEO & Search',
    'Final Review'
  ];

  return (
    <div className="animate-fadeIn w-full space-y-6">
      {/* Back Button & Step Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onTabChange('products')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs cursor-pointer min-h-[38px]"
          >
            <ArrowLeft size={14} /> Back to Products
          </button>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>/</span>
            <span className="font-semibold text-slate-900">New Product (Step {step} of 6)</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClearDraft}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer bg-transparent border-none py-1.5 px-2"
          >
            Clear Draft
          </button>
        </div>
      </div>

      {/* 2-Column Layout: Left Wizard + Right Live Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-8 space-y-6">
          {/* Step Progression Indicators */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
        <div className="grid grid-cols-6 gap-2 select-none text-xs font-medium text-center">
          {stepsHeader.map((label, idx) => {
            const stepNum = idx + 1;
            const isDone = stepNum < step;
            const isActive = stepNum === step;

            return (
              <button
                key={label}
                type="button"
                onClick={() => setStep(stepNum)}
                className={`flex flex-col items-center py-2 px-1 rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-xs'
                    : isDone
                    ? 'text-slate-900 hover:bg-slate-100'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 font-mono ${
                  isActive
                    ? 'bg-white text-slate-950'
                    : isDone
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {isDone ? <Check size={11} /> : stepNum}
                </div>
                <span className="hidden sm:block text-[11px] truncate w-full px-1">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Form Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
        <form onSubmit={handlePublish} className="space-y-6">
          
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">Step 1: General Product Details</h2>
                <p className="text-xs text-slate-500 mt-0.5">Core identifiers and consumer descriptions</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">Product Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lavender Multi-Surface Sanitizer"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all min-h-[44px]"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">SKU Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CE-LV-500"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm font-mono uppercase text-slate-900 placeholder:text-slate-400 bg-white transition-all min-h-[44px]"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Brand Name</label>
                  <input
                    type="text"
                    placeholder="Clean Everyday"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all min-h-[44px]"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Category *</label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm text-slate-900 bg-white transition-all min-h-[44px] cursor-pointer"
                    value={cat}
                    onChange={(e) => setCat(e.target.value)}
                  >
                    <option>Floor Care</option>
                    <option>Dish Care</option>
                    <option>Laundry Care</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Badge Callout</label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm text-slate-900 bg-white transition-all min-h-[44px] cursor-pointer"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                  >
                    <option value="">None (Standard)</option>
                    <option value="New">New Arrival</option>
                    <option value="Bestseller">Bestseller</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">Search Tags (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Plant-based, Safe for Pets, Antibacterial"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all min-h-[44px]"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">Product Description *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide detailed formulation notes, benefits, and instructions..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all resize-none"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Pricing */}
          {step === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">Step 2: Price Configuration</h2>
                <p className="text-xs text-slate-500 mt-0.5">Determine retail rates, discounts, and real margins</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Base Retail Price (₹ INR) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm font-mono text-slate-900 bg-white transition-all min-h-[44px]"
                    value={price}
                    onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Discount Rate (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm font-mono text-slate-900 bg-white transition-all min-h-[44px]"
                    value={discount}
                    onChange={(e) => setDiscount(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  <span className="font-semibold text-slate-900 block mb-2">Price Breakdown Summary:</span>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Standard Retail Price:</span>
                      <span className="font-mono">₹{price}</span>
                    </div>
                    <div className="flex justify-between text-rose-600">
                      <span>Discount Concession (-{discount}%):</span>
                      <span className="font-mono">-₹{Math.round(price * (discount / 100))}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-950 border-t border-slate-200 pt-2 mt-2">
                      <span>Customer Checkout Price:</span>
                      <span className="font-mono text-sm">₹{Math.round(price - price * (discount / 100))}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Inventory */}
          {step === 3 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">Step 3: Inventory & Specifications</h2>
                <p className="text-xs text-slate-500 mt-0.5">Stock thresholds and technical characteristics</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Initial Stock Quantity *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm font-mono text-slate-900 bg-white transition-all min-h-[44px]"
                    value={stock}
                    onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Low Stock Alert Threshold</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm font-mono text-slate-900 bg-white transition-all min-h-[44px]"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(parseInt(e.target.value) || 0)}
                  />
                </div>

                {/* Specs Section */}
                <div className="sm:col-span-2 border-t border-slate-100 pt-4 mt-2">
                  <h3 className="text-xs font-bold text-slate-900 mb-3">Product Form Specifications</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Unit Volume / Size *</label>
                      <input className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm text-slate-900 bg-white transition-all min-h-[44px]" type="text" required value={specSize} onChange={(e) => setSpecSize(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Usage Instructions *</label>
                      <input className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm text-slate-900 bg-white transition-all min-h-[44px]" type="text" required value={specUsage} onChange={(e) => setSpecUsage(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">pH Formula *</label>
                      <input className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm text-slate-900 bg-white transition-all min-h-[44px]" type="text" required value={specPH} onChange={(e) => setSpecPH(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Compatible Surfaces *</label>
                      <input className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm text-slate-900 bg-white transition-all min-h-[44px]" type="text" required value={specSuitable} onChange={(e) => setSpecSuitable(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Images Drag & Drop */}
          {step === 4 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">Step 4: Media Gallery</h2>
                <p className="text-xs text-slate-500 mt-0.5">High fidelity product photos (Maximum 5 images)</p>
              </div>
              
              {/* Drag Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
                  isDragging
                    ? 'border-slate-950 bg-slate-100'
                    : 'border-slate-300 hover:border-slate-900 bg-slate-50/50'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shadow-xs">
                  <Upload size={22} />
                </div>
                <div className="text-center">
                  <span className="text-sm font-semibold text-slate-900 block">Drag & Drop Product Photography</span>
                  <span className="text-xs text-slate-500 block mt-1">Accepts PNG, JPG, WebP up to 5MB</span>
                </div>
                <label className="bg-slate-950 text-white rounded-lg px-4 py-2 text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer mt-2 shadow-xs">
                  Browse Local Files
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>

              {/* Uploaded Previews */}
              {images.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-slate-700 block">Loaded Assets ({images.length}/5)</span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {images.map((imgSrc, imgIdx) => (
                      <div className="relative aspect-square border border-slate-200 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center group shadow-xs" key={imgIdx}>
                        <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          className="absolute inset-0 bg-slate-950/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium cursor-pointer"
                          onClick={() => handleRemoveImage(imgIdx)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: SEO */}
          {step === 5 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">Step 5: Search Engine Optimization</h2>
                <p className="text-xs text-slate-500 mt-0.5">Optimize search rankings and social share cards</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Meta Title Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Natural Floor Cleaner Concentrate | Clean Everyday"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm text-slate-900 bg-white transition-all min-h-[44px]"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                  />
                  <span className="text-[11px] text-slate-400 text-right font-mono">{metaTitle.length} / 60 optimal</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Meta Description Tag</label>
                  <textarea
                    rows={3}
                    placeholder="Write a concise 150-160 character description of the product for Google search listings..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm text-slate-900 bg-white transition-all resize-none"
                    value={metaDesc}
                    onChange={(e) => setMetaDesc(e.target.value)}
                  />
                  <span className="text-[11px] text-slate-400 text-right font-mono">{metaDesc.length} / 160 optimal</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Search Keywords (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. eco friendly, bio floor cleaner, natural disinfectant"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm text-slate-900 bg-white transition-all min-h-[44px]"
                    value={metaKeywords}
                    onChange={(e) => setMetaKeywords(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Review & Publish */}
          {step === 6 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">Step 6: Review & Verification</h2>
                <p className="text-xs text-slate-500 mt-0.5">Final verification before deploying product into live catalog</p>
              </div>
              
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4 text-xs">
                <div>
                  <span className="text-slate-500 font-medium block">Product Profile</span>
                  <h3 className="text-base font-bold text-slate-950 mt-0.5">{name || 'Untitled Product'}</h3>
                  <p className="text-slate-600 font-mono mt-0.5">SKU: {sku || 'TBD'} • Category: {cat} • Brand: {brand}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-200 pt-3">
                  <div>
                    <span className="text-slate-500 font-medium block">Retail Price:</span>
                    <span className="font-bold text-slate-950 font-mono">₹{price}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Discount Rate:</span>
                    <span className="font-bold text-slate-950 font-mono">{discount}% off</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Initial Stock:</span>
                    <span className="font-bold text-slate-950 font-mono">{stock} units</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Packaging:</span>
                    <span className="font-bold text-slate-950">{specSize}</span>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <span className="text-slate-500 font-medium block">Media Status:</span>
                  <span className="text-slate-900 font-semibold">{images.length} assets ready for upload</span>
                </div>

                <div className="border border-amber-200 bg-amber-50 p-3.5 rounded-lg flex items-start gap-3 text-xs text-amber-900">
                  <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>Please confirm that all ingredients, formulation tags, and product dilution ratios conform to Clean Everyday quality assurance standards.</span>
                </div>
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  type="submit"
                  disabled={isPublishing}
                  className="px-8 py-3 rounded-lg bg-slate-950 text-white hover:bg-slate-800 text-xs font-semibold tracking-wide shadow-xs transition-colors min-h-[44px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPublishing ? 'Deploying to Catalog...' : 'Publish Product to Live Store'}
                </button>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-200 select-none">
            <button
              type="button"
              disabled={step === 1}
              onClick={() => setStep((s) => Math.max(s - 1, 1))}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors bg-white min-h-[40px]"
            >
              <ArrowLeft size={13} /> Back
            </button>

            {step < 6 ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(s + 1, 6))}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-5 py-2 bg-slate-950 text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors shadow-xs min-h-[40px]"
              >
                Next Step <ArrowRight size={13} />
              </button>
            ) : null}
          </div>
        </form>
      </div>
      </div>

      {/* Right Column: Live Customer Storefront Preview */}
      <div className="xl:col-span-4 xl:sticky xl:top-4 space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Customer Preview</span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync
          </span>
        </div>

        {/* Product Card Preview Box */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
          {/* Image Area */}
          <div className="relative aspect-[4/3] bg-slate-100 flex items-center justify-center overflow-hidden">
            {images.length > 0 ? (
              <img src={images[0]} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 p-4">
                <Package size={40} className="stroke-1 text-slate-300 mb-1" />
                <span className="text-xs font-medium">Product Photo Preview</span>
              </div>
            )}
            {badge && (
              <span className="absolute top-3 left-3 bg-slate-950 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-xs">
                {badge}
              </span>
            )}
            {discount > 0 && (
              <span className="absolute top-3 right-3 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                {discount}% OFF
              </span>
            )}
            {images.length > 1 && (
              <span className="absolute bottom-3 right-3 bg-slate-950/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                1 of {images.length} photos
              </span>
            )}
          </div>

          {/* Card Body */}
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{cat}</span>
              <span className="font-mono text-[11px] text-slate-400">{sku || 'SKU-PENDING'}</span>
            </div>

            <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
              {name || 'New Product Formulation'}
            </h3>

            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {desc || 'Botanical, non-toxic household cleaning formula.'}
            </p>

            {/* Rating mockup */}
            <div className="flex items-center gap-1 text-xs">
              <div className="flex text-amber-400">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="font-bold text-slate-800 ml-1">5.0</span>
              <span className="text-slate-400 text-[11px]">(New Release)</span>
            </div>

            {/* Specs Highlights */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Volume</span>
                <span className="font-semibold text-slate-700 truncate block">{specSize || '500 ml'}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Surfaces</span>
                <span className="font-semibold text-slate-700 truncate block">{specSuitable || 'All Floors'}</span>
              </div>
            </div>

            {/* Pricing & Stock Status */}
            <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-slate-950">
                  ₹{discount > 0 ? Math.round(price * (1 - discount / 100)) : price}
                </span>
                {discount > 0 && (
                  <span className="text-xs line-through text-slate-400 font-mono">₹{price}</span>
                )}
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                stock <= 0
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : stock < 10
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {stock <= 0 ? 'Out of Stock' : `${stock} in stock`}
              </span>
            </div>

            {/* Mock Customer CTA */}
            <button
              type="button"
              disabled
              className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-xs font-semibold text-center cursor-default opacity-90 shadow-xs flex items-center justify-center gap-1.5"
            >
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Customer View • Add to Cart (₹{discount > 0 ? Math.round(price * (1 - discount / 100)) : price})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default AddProductForm;
