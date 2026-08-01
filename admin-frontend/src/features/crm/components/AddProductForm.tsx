import React, { useState, useEffect } from 'react';
import { useApp } from '../../../core/context/AppContext';
import { Upload, Info, Check, ArrowRight, ArrowLeft, X } from 'lucide-react';

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
    'Basic information',
    'Pricing settings',
    'Inventory control',
    'Media gallery',
    'SEO metadata',
    'Review and publish'
  ];

  return (
    <div className="animate-fadeIn max-w-[760px] mx-auto">
      {/* Title */}
      <div className="flex justify-between items-start mb-6 gap-4 select-none">
        <div>
          <h2 className="font-display text-xl font-semibold text-blk">Add new product</h2>
          <p className="text-sm text-mut mt-0.5">Wizard step-by-step form process with autosaved background drafting.</p>
        </div>
        <div className="flex items-center gap-4 mt-2 shrink-0">
          <button
            onClick={handleClearDraft}
            className="text-xs font-semibold text-red hover:underline bg-transparent border-none cursor-pointer"
          >
            Clear draft
          </button>
          <button
            type="button"
            onClick={() => onTabChange('products')}
            className="flex items-center gap-1 text-xs font-semibold text-mut hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
            title="Cancel and exit form"
          >
            <X size={12} /> Cancel and exit
          </button>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-6 gap-2 mb-8 select-none text-xs font-semibold text-center">
        {stepsHeader.map((label, idx) => {
          const stepNum = idx + 1;
          const isDone = stepNum < step;
          const isActive = stepNum === step;

          return (
            <div key={label} className="flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border font-bold ${
                  isDone
                    ? 'bg-primary text-wht border-primary'
                    : isActive
                    ? 'border-primary text-primary bg-primary-soft ring-3 ring-primary/10'
                    : 'border-bdr text-fnt bg-sur'
                }`}
              >
                {isDone ? <Check size={11} /> : stepNum}
              </div>
              <span className={`hidden md:block mt-1.5 truncate max-w-[90px] ${isActive ? 'text-primary-hover' : 'text-mut'}`}>
                {label.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step Contents */}
      <div className="bg-wht border border-bdrl rounded-xl p-6 sm:p-8 shadow-premium-sm mb-6">
        <form onSubmit={handlePublish}>
          
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <h3 className="font-display text-sm font-semibold text-blk border-b border-bdrl pb-2.5 mb-2">Step 1: General product details</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-mut">Product Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lavender Multi-Surface Sanitizer"
                    className="border border-bdr focus:border-primary rounded px-3.5 py-2.5 text-sm outline-none bg-wht w-full"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-mut">SKU Identifier <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CE-LV-500"
                    className="border border-bdr focus:border-primary rounded px-3.5 py-2.5 text-[0.86rem] outline-none bg-wht w-full font-mono uppercase"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-mut">Brand Supplier</label>
                  <input
                    type="text"
                    placeholder="Clean Everyday"
                    className="border border-bdr focus:border-primary rounded px-3.5 py-2.5 text-sm outline-none bg-wht w-full"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-mut">Category <span className="text-red-500">*</span></label>
                  <select
                    className="border border-bdr focus:border-primary rounded px-3.5 py-2.5 text-[0.86rem] outline-none bg-wht w-full cursor-pointer"
                    value={cat}
                    onChange={(e) => setCat(e.target.value)}
                  >
                    <option>Floor Care</option>
                    <option>Dish Care</option>
                    <option>Laundry Care</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-mut">Badge Label</label>
                  <select
                    className="border border-bdr focus:border-primary rounded px-3.5 py-2.5 text-sm outline-none bg-wht w-full cursor-pointer"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                  >
                    <option value="">None</option>
                    <option value="New">New</option>
                    <option value="Bestseller">Bestseller</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-mut">Tags / Highlights (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Plant-based, Safe for Pets, Antibacterial"
                    className="border border-bdr focus:border-primary rounded px-3.5 py-2.5 text-sm outline-none bg-wht w-full"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-mut">Description <span className="text-red-500">*</span></label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide a detailed, rich description for the ecommerce catalog..."
                    className="border border-bdr focus:border-primary rounded px-3.5 py-2.5 text-[0.86rem] outline-none bg-wht w-full resize-none"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Pricing */}
          {step === 2 && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <h3 className="font-display text-sm font-semibold text-blk border-b border-bdrl pb-2.5 mb-2">Step 2: Price configuration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-mut">Base retail price (INR) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    className="border border-bdr focus:border-primary rounded px-3.5 py-2.5 text-sm outline-none"
                    value={price}
                    onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-mut">Discount rate (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="border border-bdr focus:border-primary rounded px-3.5 py-2.5 text-sm outline-none"
                    value={discount}
                    onChange={(e) => setDiscount(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="sm:col-span-2 bg-sur p-4 rounded-md border border-bdr mt-2 text-sm">
                  <span className="font-semibold text-mid block mb-1 text-xs">Pricing math:</span>
                  <div className="flex justify-between py-1 text-mut">
                    <span>Retail price:</span>
                    <span>₹{price}</span>
                  </div>
                  <div className="flex justify-between py-1 text-red font-semibold">
                    <span>Discount deduction (-{discount}%):</span>
                    <span>-₹{Math.round(price * (discount / 100))}</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-blk font-semibold border-t border-bdrl mt-2">
                    <span>Final selling price:</span>
                    <span>₹{Math.round(price - price * (discount / 100))}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Inventory */}
          {step === 3 && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <h3 className="font-display text-sm font-semibold text-blk border-b border-bdrl pb-2.5 mb-2">Step 3: Inventory & specs settings</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-mut">Initial stock count *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    className="border border-bdr focus:border-primary rounded px-3.5 py-2.5 text-sm outline-none"
                    value={stock}
                    onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-mut">Min stock alert threshold</label>
                  <input
                    type="number"
                    min={1}
                    className="border border-bdr focus:border-primary rounded px-3.5 py-2.5 text-sm outline-none"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(parseInt(e.target.value) || 0)}
                  />
                </div>

                {/* Specs Section */}
                <div className="sm:col-span-2 border-t border-bdrl pt-4 mt-2">
                  <span className="text-xs font-semibold text-mid block mb-4">Product technical specifications</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-mut">Container Size *</label>
                      <input className="border border-bdr rounded px-3 py-2 text-sm outline-none focus:border-primary" type="text" required value={specSize} onChange={(e) => setSpecSize(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-mut">Usage Instructions *</label>
                      <input className="border border-bdr rounded px-3 py-2 text-sm outline-none focus:border-primary" type="text" required value={specUsage} onChange={(e) => setSpecUsage(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-mut">pH Level *</label>
                      <input className="border border-bdr rounded px-3 py-2 text-sm outline-none focus:border-primary" type="text" required value={specPH} onChange={(e) => setSpecPH(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-mut">Suitable Surfaces *</label>
                      <input className="border border-bdr rounded px-3 py-2 text-sm outline-none focus:border-primary" type="text" required value={specSuitable} onChange={(e) => setSpecSuitable(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Images Drag & Drop */}
          {step === 4 && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <h3 className="font-display text-sm font-semibold text-blk border-b border-bdrl pb-2.5 mb-2">Step 4: Media gallery upload</h3>
              
              {/* Drag Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
                  isDragging
                    ? 'border-primary bg-primary-soft/50'
                    : 'border-bdr hover:border-primary bg-sur/50'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-primary-soft text-primary flex items-center justify-center">
                  <Upload size={20} />
                </div>
                <div className="text-center">
                  <span className="text-sm font-semibold text-blk block">Drag & Drop Product Images</span>
                  <span className="text-xs text-mut block mt-1">Accepts images only. Max file size 2MB.</span>
                </div>
                <label className="bg-primary text-wht rounded px-4 py-2 text-xs font-semibold hover:bg-primary-hover transition-colors cursor-pointer mt-2">
                  Browse Files
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
                <div className="mt-4">
                  <span className="text-xs font-semibold text-mut block mb-3">Uploaded Previews ({images.length}/5)</span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                    {images.map((imgSrc, imgIdx) => (
                      <div className="relative aspect-square border border-bdr rounded bg-sur overflow-hidden flex items-center justify-center group" key={imgIdx}>
                        <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          className="absolute inset-0 bg-blk/60 text-wht flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs cursor-pointer"
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
            <div className="flex flex-col gap-4 animate-fadeIn">
              <h3 className="font-display text-sm font-semibold text-blk border-b border-bdrl pb-2.5 mb-2">Step 5: Search engine optimization</h3>
              
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-mut">Meta Title Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Natural Floor Cleaner Concentrate | Clean Everyday"
                    className="border border-bdr focus:border-primary rounded px-3.5 py-2.5 text-sm outline-none w-full"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                  />
                  <span className="text-xs text-mut text-right">Characters: {metaTitle.length}/60</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-mut">Meta Description Tag</label>
                  <textarea
                    rows={3}
                    placeholder="Write a catchy 150-160 character description of the product for google search listing..."
                    className="border border-bdr focus:border-primary rounded px-3.5 py-2.5 text-sm outline-none w-full resize-none"
                    value={metaDesc}
                    onChange={(e) => setMetaDesc(e.target.value)}
                  />
                  <span className="text-xs text-mut text-right">Characters: {metaDesc.length}/160</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-mut">Meta Keywords (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. eco friendly, bio floor cleaner, natural disinfectant"
                    className="border border-bdr focus:border-primary rounded px-3.5 py-2.5 text-sm outline-none w-full"
                    value={metaKeywords}
                    onChange={(e) => setMetaKeywords(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Review & Publish */}
          {step === 6 && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <h3 className="font-display text-sm font-semibold text-blk border-b border-bdrl pb-2.5 mb-2">Step 6: Review specifications</h3>
              
              <div className="border border-bdr rounded-md p-5 bg-sur/50 flex flex-col gap-4 text-sm leading-relaxed">
                <div>
                  <strong className="text-mid text-xs block">Product profile:</strong>
                  <span className="text-base font-semibold text-blk block mt-0.5">{name || 'Untitled Product'}</span>
                  <span className="text-xs text-mut block mt-0.5">SKU: {sku || 'TBD'} • Category: {cat} • Brand: {brand}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-bdrl pt-3 mt-1">
                  <div>
                    <strong className="text-mut text-xs block">Retail price:</strong>
                    <span className="font-semibold text-blk">₹{price} (INR)</span>
                  </div>
                  <div>
                    <strong className="text-mut text-xs block">Discount rate:</strong>
                    <span className="font-semibold text-blk">{discount}% off</span>
                  </div>
                  <div>
                    <strong className="text-mut text-xs block">Stock level:</strong>
                    <span className="font-semibold text-blk">{stock} items</span>
                  </div>
                  <div>
                    <strong className="text-mut text-xs block">Container size:</strong>
                    <span className="font-semibold text-blk">{specSize}</span>
                  </div>
                </div>

                <div className="border-t border-bdrl pt-3 mt-1">
                  <strong className="text-mut text-xs block">Media uploads:</strong>
                  <span className="text-blk font-medium">{images.length} images added</span>
                </div>

                <div className="border-t border-bdrl pt-3 mt-1 bg-yellow-50/50 border border-amber-200/50 p-3 rounded-md flex items-center gap-3 text-xs text-amber-800">
                  <Info size={16} className="text-amber-600 shrink-0" />
                  <span>Please review that all product description and specifications tags match Clean Everyday safety rules before publishing catalog item.</span>
                </div>
              </div>

              <div className="mt-4 flex justify-center">
                <button
                  type="submit"
                  disabled={isPublishing}
                  className="bg-primary text-wht rounded py-3 px-8 text-sm font-semibold hover:bg-primary-hover cursor-pointer active:scale-95 transition-all shadow-premium-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPublishing ? 'Publishing...' : 'Publish catalogue item'}
                </button>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex justify-between items-center mt-8 pt-5 border-t border-bdrl select-none">
            <button
              type="button"
              disabled={step === 1}
              onClick={() => setStep((s) => Math.max(s - 1, 1))}
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 border border-bdr text-mid hover:border-primary hover:text-primary rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors bg-wht"
            >
              <ArrowLeft size={13} /> Back
            </button>

            {step < 6 ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(s + 1, 6))}
                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 bg-primary text-wht hover:bg-primary-hover rounded cursor-pointer transition-colors"
              >
                Next <ArrowRight size={13} />
              </button>
            ) : null}
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddProductForm;
