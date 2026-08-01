import React, { useState, useEffect } from 'react';
import { useApp } from '../../../core/context/AppContext';
import type { Banner } from '../../../core/types';
import { Save, AlertCircle, Eye, X } from 'lucide-react';

const BannersManagement: React.FC = () => {
  const { banners, updateBanners } = useApp();

  // Staged state for editing
  const [stagedBanners, setStagedBanners] = useState<Banner[]>(() =>
    banners.map((b) => ({
      img: b.img,
      mobileImg: b.mobileImg || null,
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

  // Convert files to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, slotIndex: number, type: 'desktop' | 'mobile') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setStagedBanners((prev) =>
          prev.map((b, idx) => {
            if (idx === slotIndex) {
              return type === 'desktop'
                ? { ...b, img: reader.result as string }
                : { ...b, mobileImg: reader.result as string };
            }
            return b;
          })
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = (slotIndex: number, type: 'desktop' | 'mobile') => {
    setStagedBanners((prev) =>
      prev.map((b, idx) => {
        if (idx === slotIndex) {
          return type === 'desktop'
            ? { ...b, img: null }
            : { ...b, mobileImg: null };
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

  const handlePublishBanners = () => {
    // Sort before saving
    const sorted = [...stagedBanners].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    updateBanners(sorted);
  };

  return (
    <div className="animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-xl font-semibold text-blk">Homepage hero banners</h2>
          <p className="text-sm text-mut">Customize graphic slides, CTA buttons, and campaigns.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePublishBanners}
            className="bg-primary text-wht rounded px-5 py-2.5 text-sm font-semibold hover:bg-primary-hover transition-colors flex items-center gap-1.5 cursor-pointer shadow-premium-sm"
          >
            <Save size={14} /> Publish banners
          </button>
          <button
            onClick={() => setStagedBanners(banners.map((b) => ({ ...b })))}
            className="text-sm font-semibold px-4 py-2.5 border border-bdr text-mid bg-wht hover:bg-sur rounded cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="bg-primary-soft border border-primary-light rounded p-3.5 flex items-center gap-3 mb-6 text-[0.82rem] text-mid">
        <AlertCircle size={16} className="text-primary-hover shrink-0" />
        <span>
          Homepage slides display full-width graphics. Changes must be published using the <strong>Publish Banners</strong> button to go live on the storefront.
        </span>
      </div>

      {/* Editor layout: Left Slot selectors, Right Slot details */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 items-start">
        {/* Left Side slots selector list */}
        <div className="flex flex-col gap-2">
          {stagedBanners.map((banner, index) => {
            const isActive = activeSlot === index;
            return (
              <button
                key={index}
                type="button"
                onClick={() => setActiveSlot(index)}
                className={`flex items-center justify-between p-4 rounded-md border text-left cursor-pointer transition-all duration-150 ${
                  isActive
                    ? 'border-primary bg-primary/5 text-primary font-bold shadow-sm'
                    : 'border-bdr bg-wht hover:border-mut text-mid'
                }`}
              >
                <div>
                  <span className="text-sm block">Hero slot {index + 1}</span>
                  <span className="text-xs text-mut truncate max-w-[150px] block mt-0.5">
                    {banner.label || `Banner ${index + 1}`}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {!banner.isActive && <span className="w-1.5 h-1.5 rounded-full bg-mut" title="Inactive" />}
                  {banner.isActive && banner.img && <span className="w-1.5 h-1.5 rounded-full bg-primary" title="Active" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Side form controls */}
        <div className="bg-wht border border-bdrl rounded-xl p-6 sm:p-8 shadow-premium-sm">
          <div className="flex justify-between items-center border-b border-bdrl pb-3 mb-5">
            <h3 className="font-display text-sm font-semibold text-blk">Hero slot {activeSlot + 1} configuration</h3>
            <button
              onClick={() => setPreviewBanner(stagedBanners[activeSlot])}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <Eye size={12} /> Live preview
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[0.82rem]">
            {/* Tag label */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-mut">Slot label / tagline</label>
              <input
                type="text"
                placeholder="e.g. Summer Special"
                className="border border-bdr focus:border-primary rounded px-3 py-2 text-sm outline-none"
                value={stagedBanners[activeSlot].label || ''}
                onChange={(e) => handleFieldChange(activeSlot, 'label', e.target.value)}
              />
            </div>

            {/* Display Order */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-mut">Display order</label>
              <input
                type="number"
                min={1}
                className="border border-bdr focus:border-primary rounded px-3 py-2 text-sm outline-none"
                value={stagedBanners[activeSlot].displayOrder || 1}
                onChange={(e) => handleFieldChange(activeSlot, 'displayOrder', parseInt(e.target.value) || 1)}
              />
            </div>

            {/* Campaign Headline Title */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-mut">Hero headline title</label>
              <input
                type="text"
                placeholder="e.g. Organic Cleaning Solutions"
                className="border border-bdr focus:border-primary rounded px-3 py-2 text-sm outline-none w-full"
                value={stagedBanners[activeSlot].title || ''}
                onChange={(e) => handleFieldChange(activeSlot, 'title', e.target.value)}
              />
            </div>

            {/* Hero Subtitle */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-mut">Hero subtitle text</label>
              <textarea
                rows={2}
                placeholder="e.g. Clean living, organic ingredients, safe spaces for kids & pets."
                className="border border-bdr focus:border-primary rounded px-3 py-2 text-sm outline-none w-full resize-none"
                value={stagedBanners[activeSlot].subtitle || ''}
                onChange={(e) => handleFieldChange(activeSlot, 'subtitle', e.target.value)}
              />
            </div>

            {/* CTA action button */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-mut">Button call-to-action (CTA)</label>
              <input
                type="text"
                placeholder="e.g. Shop Collection"
                className="border border-bdr focus:border-primary rounded px-3 py-2 text-sm outline-none"
                value={stagedBanners[activeSlot].ctaText || ''}
                onChange={(e) => handleFieldChange(activeSlot, 'ctaText', e.target.value)}
              />
            </div>

            {/* Link target */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-mut">Button target destination</label>
              <select
                className="border border-bdr focus:border-primary rounded px-3 py-2 text-sm outline-none cursor-pointer bg-wht"
                value={stagedBanners[activeSlot].ctaLink || ''}
                onChange={(e) => handleFieldChange(activeSlot, 'ctaLink', e.target.value)}
              >
                <option value="products">Store catalogue page</option>
                <option value="home">Home / splash page</option>
                <option value="orders">Client order history</option>
              </select>
            </div>

            {/* Date Scheduling start */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-mut">Schedule start date</label>
              <input
                type="date"
                className="border border-bdr focus:border-primary rounded px-3 py-2 text-sm outline-none bg-wht"
                value={stagedBanners[activeSlot].scheduleStart || ''}
                onChange={(e) => handleFieldChange(activeSlot, 'scheduleStart', e.target.value)}
              />
            </div>

            {/* Date Scheduling end */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-mut">Schedule end date</label>
              <input
                type="date"
                className="border border-bdr focus:border-primary rounded px-3 py-2 text-sm outline-none bg-wht"
                value={stagedBanners[activeSlot].scheduleEnd || ''}
                onChange={(e) => handleFieldChange(activeSlot, 'scheduleEnd', e.target.value)}
              />
            </div>

            {/* Active Toggle Status */}
            <div className="sm:col-span-2 py-2 flex items-center justify-between border-t border-bdrl mt-2 select-none">
              <div>
                <span className="text-sm font-semibold text-blk block">Slide active visibility status</span>
                <span className="text-xs text-mut block">Hide banner from slideshow if toggled inactive</span>
              </div>
              <button
                type="button"
                onClick={() => handleFieldChange(activeSlot, 'isActive', !stagedBanners[activeSlot].isActive)}
                className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer border-none outline-none ${
                  stagedBanners[activeSlot].isActive ? 'bg-primary' : 'bg-bdr'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-wht shadow transition-transform ${
                    stagedBanners[activeSlot].isActive ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Image graphics */}
            <div className="sm:col-span-2 border-t border-bdrl pt-4 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Desktop banner */}
              <div>
                <span className="text-xs font-medium text-mut block mb-2">Desktop slide banner (16:5 ratio)</span>
                <div className="w-full aspect-[16/5] bg-sur border border-dashed border-bdr rounded-md overflow-hidden flex items-center justify-center relative group/img mb-3">
                  {stagedBanners[activeSlot].img ? (
                    <>
                      <img src={stagedBanners[activeSlot].img as string} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleClearImage(activeSlot, 'desktop')}
                        className="absolute inset-0 bg-blk/60 text-wht flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity text-xs cursor-pointer"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-fnt font-medium">No desktop image loaded</span>
                  )}
                </div>
                <label className="text-sm font-semibold px-4 py-2 border border-bdr hover:border-primary rounded text-mid bg-wht hover:text-primary cursor-pointer block text-center transition-colors">
                  Upload desktop graphic
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, activeSlot, 'desktop')} />
                </label>
              </div>

              {/* Mobile banner */}
              <div>
                <span className="text-xs font-medium text-mut block mb-2">Mobile slide banner (4:3 ratio)</span>
                <div className="w-full aspect-[4/3] max-w-[200px] mx-auto bg-sur border border-dashed border-bdr rounded-md overflow-hidden flex items-center justify-center relative group/mimg mb-3">
                  {stagedBanners[activeSlot].mobileImg ? (
                    <>
                      <img src={stagedBanners[activeSlot].mobileImg as string} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleClearImage(activeSlot, 'mobile')}
                        className="absolute inset-0 bg-blk/60 text-wht flex items-center justify-center opacity-0 group-hover/mimg:opacity-100 transition-opacity text-xs cursor-pointer"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-fnt font-medium">No mobile image loaded</span>
                  )}
                </div>
                <label className="text-sm font-semibold px-4 py-2 border border-bdr hover:border-primary rounded text-mid bg-wht hover:text-primary cursor-pointer block text-center transition-colors">
                  Upload mobile graphic
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, activeSlot, 'mobile')} />
                </label>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Slide preview dialog */}
      {previewBanner && (
        <div 
          className="fixed inset-0 z-[999] flex items-center justify-center bg-blk/60 p-4 backdrop-blur-xs overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPreviewBanner(null);
            }
          }}
        >
          <div className="bg-wht rounded-xl border border-bdr shadow-premium-lg w-full max-w-[960px] p-6 relative my-auto">
            <button
              className="absolute top-5 right-5 text-mut hover:text-blk transition-colors cursor-pointer border-none bg-transparent"
              onClick={() => setPreviewBanner(null)}
            >
              <X size={18} />
            </button>

            <h3 className="font-display text-lg font-semibold text-blk mb-4 border-b border-bdrl pb-2.5">
              Live banner visual mock preview
            </h3>

            {/* Device Toggles */}
            <div className="flex gap-2 mb-4 text-xs font-semibold select-none">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`px-3 py-1.5 rounded border cursor-pointer ${
                  previewDevice === 'desktop' ? 'bg-primary text-wht border-primary' : 'bg-sur border-bdr text-mid hover:border-primary'
                }`}
              >
                Desktop preview
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`px-3 py-1.5 rounded border cursor-pointer ${
                  previewDevice === 'mobile' ? 'bg-primary text-wht border-primary' : 'bg-sur border-bdr text-mid hover:border-primary'
                }`}
              >
                Mobile preview
              </button>
            </div>

            {/* Preview Viewport Frame */}
            <div className="bg-sur/80 border border-bdr p-4 rounded-md flex items-center justify-center overflow-hidden">
              {previewDevice === 'desktop' ? (
                /* Desktop layout */
                <div 
                  className="w-full bg-blk text-wht relative overflow-hidden rounded shadow-premium-md flex items-center"
                  style={{ aspectRatio: '16/6' }}
                >
                  {previewBanner.img ? (
                    <img src={previewBanner.img} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-deep opacity-60" />
                  )}
                  <div className="relative z-10 px-10 max-w-[500px] flex flex-col items-start select-none">
                    {previewBanner.label && (
                      <span className="text-xs text-accent font-semibold bg-accent-light/10 px-2.5 py-0.5 rounded border border-accent/20 mb-2.5">
                        {previewBanner.label}
                      </span>
                    )}
                    <h1 className="font-display text-2xl font-semibold leading-tight mb-2 text-wht">
                      {previewBanner.title || 'Headline campaign title'}
                    </h1>
                    <p className="text-sm text-fnt mb-5 max-w-[450px]">
                      {previewBanner.subtitle || 'Subheading campaign text detail.'}
                    </p>
                    <button className="bg-primary text-wht px-6 py-2.5 rounded text-xs font-semibold cursor-default">
                      {previewBanner.ctaText || 'CTA Click'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Mobile layout */
                <div 
                  className="w-[300px] bg-blk text-wht relative overflow-hidden rounded shadow-premium-md flex flex-col justify-end p-6 border-4 border-sur-dark"
                  style={{ aspectRatio: '3/4' }}
                >
                  {previewBanner.mobileImg ? (
                    <img src={previewBanner.mobileImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-65" />
                  ) : previewBanner.img ? (
                    <img src={previewBanner.img} alt="" className="absolute inset-0 w-full h-full object-cover opacity-65" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-b from-primary to-primary-deep opacity-65" />
                  )}
                  <div className="relative z-10 flex flex-col items-start select-none">
                    {previewBanner.label && (
                      <span className="text-xs text-accent font-semibold mb-2">
                        {previewBanner.label}
                      </span>
                    )}
                    <h1 className="font-display text-lg font-semibold leading-tight mb-1 text-wht">
                      {previewBanner.title || 'Headline title'}
                    </h1>
                    <p className="text-xs text-fnt mb-4">
                      {previewBanner.subtitle || 'Subheading description text.'}
                    </p>
                    <button className="w-full bg-primary text-wht py-2.5 rounded text-xs font-semibold cursor-default text-center">
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
