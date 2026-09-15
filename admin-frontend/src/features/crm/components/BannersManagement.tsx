import React, { useState, useEffect } from 'react';
import { useApp } from '../../../core/context/AppContext';
import type { Banner } from '../../../core/types';
import {
  Save,
  AlertCircle,
  Eye,
  X,
  Loader2,
  Image as ImageIcon,
  UploadCloud,
  Smartphone,
  Laptop,
  RotateCcw
} from 'lucide-react';

const BannersManagement: React.FC = () => {
  const { banners, updateBanners } = useApp();

  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [desktopFiles, setDesktopFiles] = useState<(File | null)[]>([null, null, null, null]);
  const [mobileFiles, setMobileFiles] = useState<(File | null)[]>([null, null, null, null]);

  // Staged state for editing
  const [stagedBanners, setStagedBanners] = useState<Banner[]>(() =>
    banners.map((b) => ({
      _id: b._id,
      img: b.desktopImage || b.img || null,
      mobileImg: b.mobileImage || b.mobileImg || null,
      desktopImage: b.desktopImage || b.img || '',
      mobileImage: b.mobileImage || b.mobileImg || '',
      desktopImagePublicId: b.desktopImagePublicId || '',
      mobileImagePublicId: b.mobileImagePublicId || '',
      label: b.label || '',
      title: b.title || 'Organic Clean Solutions',
      subtitle: b.subtitle || 'Clean living, organic ingredients, safe spaces',
      ctaText: b.ctaText || 'Explore Now',
      ctaLink: b.ctaLink || 'products',
      displayOrder: b.displayOrder || 1,
      scheduleStart: b.scheduleStart || '',
      scheduleEnd: b.scheduleEnd || '',
      isActive: b.isActive !== undefined ? b.isActive : true
    }))
  );

  // Sync stagedBanners when server banners load or update
  useEffect(() => {
    if (banners && banners.length > 0) {
      setStagedBanners(
        banners.map((b) => ({
          _id: b._id,
          img: b.desktopImage || b.img || null,
          mobileImg: b.mobileImage || b.mobileImg || null,
          desktopImage: b.desktopImage || b.img || '',
          mobileImage: b.mobileImage || b.mobileImg || '',
          desktopImagePublicId: b.desktopImagePublicId || '',
          mobileImagePublicId: b.mobileImagePublicId || '',
          label: b.label || '',
          title: b.title || 'Organic Clean Solutions',
          subtitle: b.subtitle || 'Clean living, organic ingredients, safe spaces',
          ctaText: b.ctaText || 'Explore Now',
          ctaLink: b.ctaLink || 'products',
          displayOrder: b.displayOrder || 1,
          scheduleStart: b.scheduleStart || '',
          scheduleEnd: b.scheduleEnd || '',
          isActive: b.isActive !== undefined ? b.isActive : true
        }))
      );
    }
  }, [banners]);

  // Active slot being customized
  const [activeSlot, setActiveSlot] = useState<number>(0);
  
  // Show Desktop vs Mobile preview modal
  const [previewBanner, setPreviewBanner] = useState<Banner | null>(null);

  // Escape key down to close preview modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewBanner(null);
      }
    };
    if (previewBanner) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [previewBanner]);

  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Convert files to preview & track raw File for multipart publish
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, slotIndex: number, type: 'desktop' | 'mobile') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'desktop') {
      setDesktopFiles((prev) => {
        const next = [...prev];
        next[slotIndex] = file;
        return next;
      });
    } else {
      setMobileFiles((prev) => {
        const next = [...prev];
        next[slotIndex] = file;
        return next;
      });
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setStagedBanners((prev) =>
          prev.map((b, idx) => {
            if (idx === slotIndex) {
              return type === 'desktop'
                ? { ...b, img: reader.result as string, desktopImage: reader.result as string }
                : { ...b, mobileImg: reader.result as string, mobileImage: reader.result as string };
            }
            return b;
          })
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = (slotIndex: number, type: 'desktop' | 'mobile') => {
    if (type === 'desktop') {
      setDesktopFiles((prev) => {
        const next = [...prev];
        next[slotIndex] = null;
        return next;
      });
    } else {
      setMobileFiles((prev) => {
        const next = [...prev];
        next[slotIndex] = null;
        return next;
      });
    }

    setStagedBanners((prev) =>
      prev.map((b, idx) => {
        if (idx === slotIndex) {
          return type === 'desktop'
            ? { ...b, img: null, desktopImage: '' }
            : { ...b, mobileImg: null, mobileImage: '' };
        }
        return b;
      })
    );
  };

  const handleFieldChange = (slotIndex: number, field: keyof Banner, value: any) => {
    setStagedBanners((prev) =>
      prev.map((b, idx) => (idx === slotIndex ? { ...b, [field]: value } : b))
    );
  };

  const handlePublishBanners = async () => {
    setIsPublishing(true);
    try {
      // Sort before saving
      const sorted = [...stagedBanners].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      const success = await updateBanners(sorted, desktopFiles, mobileFiles);
      if (success) {
        setDesktopFiles([null, null, null, null]);
        setMobileFiles([null, null, null, null]);
      }
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Homepage Hero Banners</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full border border-slate-200">
              4 Slots Configured
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Design high-converting storefront hero carousels, responsive graphics, and promotional links.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setDesktopFiles([null, null, null, null]);
              setMobileFiles([null, null, null, null]);
              setStagedBanners(banners.map((b) => ({ ...b })));
            }}
            disabled={isPublishing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-xs cursor-pointer min-h-[44px] disabled:opacity-50"
          >
            <RotateCcw size={14} />
            Reset Changes
          </button>
          <button
            type="button"
            onClick={handlePublishBanners}
            disabled={isPublishing}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs cursor-pointer min-h-[44px] disabled:opacity-50"
          >
            {isPublishing ? (
              <>
                <Loader2 size={14} className="animate-spin text-white" />
                <span>Publishing to Storefront...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Publish Banners</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info notice banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-600">
        <AlertCircle size={16} className="text-slate-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          Hero carousel slides support responsive assets. Upload a <strong>16:5 ratio</strong> graphic for desktop displays and a <strong>4:3 ratio</strong> graphic for mobile devices. Remember to click <strong>Publish Banners</strong> to deploy changes to the live client store.
        </div>
      </div>

      {/* Main layout: Left Slot Switcher, Right Editor Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Slot Selector List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Banner Slides
          </div>
          <div className="space-y-2">
            {stagedBanners.map((banner, index) => {
              const isActive = activeSlot === index;
              const hasImage = Boolean(banner.img || banner.desktopImage);
              const isEnabled = banner.isActive;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveSlot(index)}
                  className={`w-full p-4 rounded-xl border text-left cursor-pointer transition-all duration-150 relative overflow-hidden flex items-center gap-3.5 ${
                    isActive
                      ? 'border-slate-900 bg-white shadow-sm ring-2 ring-slate-900/5'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  {/* Thumbnail / Slot indicator */}
                  <div className="w-12 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {hasImage ? (
                      <img
                        src={(banner.img || banner.desktopImage) as string}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon size={16} className="text-slate-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Hero Slot {index + 1}</span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        isEnabled
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {isEnabled ? 'Live' : 'Hidden'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 truncate block mt-0.5">
                      {banner.label || banner.title || 'Untitled Banner'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Slot Form */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Hero Slot {activeSlot + 1} Configuration
              </h2>
              <p className="text-xs text-slate-500">Customize copywriting, action buttons, and responsive assets.</p>
            </div>
            <button
              type="button"
              onClick={() => setPreviewBanner(stagedBanners[activeSlot])}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Eye size={13} />
              Live Preview
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Tagline label */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Slot Tagline / Eyebrow</label>
              <input
                type="text"
                placeholder="e.g. Eco Formula 2026"
                className="w-full border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 rounded-lg px-3 py-2 text-xs outline-none bg-white text-slate-800 transition-all min-h-[42px]"
                value={stagedBanners[activeSlot].label || ''}
                onChange={(e) => handleFieldChange(activeSlot, 'label', e.target.value)}
              />
            </div>

            {/* Display Order */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Display Carousel Sequence</label>
              <input
                type="number"
                min={1}
                className="w-full border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 rounded-lg px-3 py-2 text-xs outline-none bg-white text-slate-800 transition-all min-h-[42px]"
                value={stagedBanners[activeSlot].displayOrder || 1}
                onChange={(e) => handleFieldChange(activeSlot, 'displayOrder', parseInt(e.target.value) || 1)}
              />
            </div>

            {/* Headline Title */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-semibold text-slate-700">Hero Headline Title</label>
              <input
                type="text"
                placeholder="e.g. Pure Botanical Cleaning for Conscious Homes"
                className="w-full border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 rounded-lg px-3 py-2 text-xs outline-none bg-white text-slate-800 transition-all min-h-[42px]"
                value={stagedBanners[activeSlot].title || ''}
                onChange={(e) => handleFieldChange(activeSlot, 'title', e.target.value)}
              />
            </div>

            {/* Subtitle */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-semibold text-slate-700">Hero Subtitle Paragraph</label>
              <textarea
                rows={2}
                placeholder="e.g. Zero toxic residue, plant-powered plant actives, child & pet safe formulations."
                className="w-full border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 rounded-lg px-3 py-2 text-xs outline-none bg-white text-slate-800 resize-none transition-all"
                value={stagedBanners[activeSlot].subtitle || ''}
                onChange={(e) => handleFieldChange(activeSlot, 'subtitle', e.target.value)}
              />
            </div>

            {/* CTA action button */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Call To Action (CTA) Button Text</label>
              <input
                type="text"
                placeholder="e.g. Shop Best Sellers"
                className="w-full border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 rounded-lg px-3 py-2 text-xs outline-none bg-white text-slate-800 transition-all min-h-[42px]"
                value={stagedBanners[activeSlot].ctaText || ''}
                onChange={(e) => handleFieldChange(activeSlot, 'ctaText', e.target.value)}
              />
            </div>

            {/* Link target */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Destination View Target</label>
              <select
                className="w-full border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 rounded-lg px-3 py-2 text-xs outline-none bg-white text-slate-800 cursor-pointer min-h-[42px]"
                value={stagedBanners[activeSlot].ctaLink || ''}
                onChange={(e) => handleFieldChange(activeSlot, 'ctaLink', e.target.value)}
              >
                <option value="products">Store catalogue page</option>
                <option value="home">Home / splash page</option>
                <option value="orders">Client order history</option>
              </select>
            </div>

            {/* Date Scheduling start */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Campaign Schedule Start</label>
              <input
                type="date"
                className="w-full border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 rounded-lg px-3 py-2 text-xs outline-none bg-white text-slate-800 min-h-[42px]"
                value={stagedBanners[activeSlot].scheduleStart || ''}
                onChange={(e) => handleFieldChange(activeSlot, 'scheduleStart', e.target.value)}
              />
            </div>

            {/* Date Scheduling end */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Campaign Schedule End</label>
              <input
                type="date"
                className="w-full border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 rounded-lg px-3 py-2 text-xs outline-none bg-white text-slate-800 min-h-[42px]"
                value={stagedBanners[activeSlot].scheduleEnd || ''}
                onChange={(e) => handleFieldChange(activeSlot, 'scheduleEnd', e.target.value)}
              />
            </div>

            {/* Active Toggle Status */}
            <div className="sm:col-span-2 pt-4 pb-2 flex items-center justify-between border-t border-slate-100 select-none">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Banner Active Visibility</span>
                <span className="text-[11px] text-slate-500 block">Enable or suppress this slide from the customer storefront</span>
              </div>
              <button
                type="button"
                onClick={() => handleFieldChange(activeSlot, 'isActive', !stagedBanners[activeSlot].isActive)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer border-none outline-none relative ${
                  stagedBanners[activeSlot].isActive ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                    stagedBanners[activeSlot].isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Media Upload Dropzones */}
            <div className="sm:col-span-2 border-t border-slate-100 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Desktop banner */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Desktop Slide Banner</span>
                  <span className="text-[10px] font-mono text-slate-400">16:5 ratio (~1920x600)</span>
                </div>
                <div className="w-full aspect-[16/6] bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl overflow-hidden flex items-center justify-center relative group/img">
                  {stagedBanners[activeSlot].img ? (
                    <>
                      <img src={stagedBanners[activeSlot].img as string} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-950/60 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleClearImage(activeSlot, 'desktop')}
                          className="px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-md shadow-xs hover:bg-rose-700 transition-colors cursor-pointer"
                        >
                          Remove Graphic
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                      <UploadCloud size={24} className="mb-1 text-slate-300" />
                      <span className="text-xs font-semibold text-slate-600">No desktop graphic</span>
                      <span className="text-[10px] text-slate-400">Click below to upload</span>
                    </div>
                  )}
                </div>
                <label className="text-xs font-semibold px-4 py-2.5 border border-slate-200 hover:border-slate-400 rounded-lg text-slate-700 bg-white hover:bg-slate-50 cursor-pointer block text-center transition-colors min-h-[44px] flex items-center justify-center shadow-xs">
                  Upload Desktop Graphic
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, activeSlot, 'desktop')} />
                </label>
              </div>

              {/* Mobile banner */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Mobile Slide Banner</span>
                  <span className="text-[10px] font-mono text-slate-400">4:3 ratio (~800x600)</span>
                </div>
                <div className="w-full aspect-[16/6] bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl overflow-hidden flex items-center justify-center relative group/mimg">
                  {stagedBanners[activeSlot].mobileImg ? (
                    <>
                      <img src={stagedBanners[activeSlot].mobileImg as string} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-950/60 text-white flex items-center justify-center opacity-0 group-hover/mimg:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleClearImage(activeSlot, 'mobile')}
                          className="px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-md shadow-xs hover:bg-rose-700 transition-colors cursor-pointer"
                        >
                          Remove Graphic
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                      <Smartphone size={24} className="mb-1 text-slate-300" />
                      <span className="text-xs font-semibold text-slate-600">No mobile graphic</span>
                      <span className="text-[10px] text-slate-400">Click below to upload</span>
                    </div>
                  )}
                </div>
                <label className="text-xs font-semibold px-4 py-2.5 border border-slate-200 hover:border-slate-400 rounded-lg text-slate-700 bg-white hover:bg-slate-50 cursor-pointer block text-center transition-colors min-h-[44px] flex items-center justify-center shadow-xs">
                  Upload Mobile Graphic
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, activeSlot, 'mobile')} />
                </label>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Slide Preview Modal Dialog */}
      {previewBanner && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewBanner(null);
          }}
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-[960px] p-6 relative my-auto animate-slideUp">
            <button
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer border-none bg-transparent"
              onClick={() => setPreviewBanner(null)}
            >
              <X size={18} />
            </button>

            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Storefront Carousel Viewport Simulation
                </h3>
                <p className="text-xs text-slate-500">Preview text readability and button contrast</p>
              </div>

              {/* Device Toggles */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg mr-8">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    previewDevice === 'desktop'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Laptop size={14} /> Desktop
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    previewDevice === 'mobile'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Smartphone size={14} /> Mobile
                </button>
              </div>
            </div>

            {/* Preview Frame */}
            <div className="bg-slate-100 border border-slate-200 p-6 rounded-xl flex items-center justify-center overflow-hidden">
              {previewDevice === 'desktop' ? (
                /* Desktop layout preview */
                <div
                  className="w-full bg-slate-950 text-white relative overflow-hidden rounded-xl shadow-lg flex items-center"
                  style={{ aspectRatio: '16/6' }}
                >
                  {previewBanner.img ? (
                    <img src={previewBanner.img} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 opacity-80" />
                  )}
                  <div className="relative z-10 px-10 max-w-[520px] flex flex-col items-start select-none">
                    {previewBanner.label && (
                      <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30 mb-2.5 uppercase tracking-wider">
                        {previewBanner.label}
                      </span>
                    )}
                    <h1 className="text-2xl font-bold leading-tight mb-2 text-white">
                      {previewBanner.title || 'Organic Clean Solutions'}
                    </h1>
                    <p className="text-xs text-slate-300 mb-5 line-clamp-2 leading-relaxed">
                      {previewBanner.subtitle || 'Pure botanical formulas designed for conscious living.'}
                    </p>
                    <button className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-xs font-semibold cursor-default shadow-sm">
                      {previewBanner.ctaText || 'Shop Collection'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Mobile layout preview */
                <div
                  className="w-[300px] bg-slate-950 text-white relative overflow-hidden rounded-2xl shadow-xl flex flex-col justify-end p-6 border-4 border-slate-800"
                  style={{ aspectRatio: '3/4' }}
                >
                  {previewBanner.mobileImg ? (
                    <img src={previewBanner.mobileImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-65" />
                  ) : previewBanner.img ? (
                    <img src={previewBanner.img} alt="" className="absolute inset-0 w-full h-full object-cover opacity-65" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950 opacity-80" />
                  )}
                  <div className="relative z-10 flex flex-col items-start select-none">
                    {previewBanner.label && (
                      <span className="text-[10px] text-emerald-400 font-bold mb-1.5 uppercase tracking-wider">
                        {previewBanner.label}
                      </span>
                    )}
                    <h1 className="text-lg font-bold leading-tight mb-1 text-white">
                      {previewBanner.title || 'Headline title'}
                    </h1>
                    <p className="text-[11px] text-slate-300 mb-4 line-clamp-2">
                      {previewBanner.subtitle || 'Subheading description text.'}
                    </p>
                    <button className="w-full bg-emerald-600 text-white py-2 rounded-lg text-xs font-semibold cursor-default text-center">
                      {previewBanner.ctaText || 'Shop Now'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannersManagement;
