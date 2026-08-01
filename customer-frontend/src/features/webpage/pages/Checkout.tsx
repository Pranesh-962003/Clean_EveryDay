import React, { useState, useEffect } from 'react';
import axios from 'axios';
// @ts-ignore
import { auth } from '../../../../firebase';
import { useApp } from '../../../core/context/AppContext';
import {
  CreditCard,
  Truck,
  ShieldCheck,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  Check,
  Lock,
  Zap,
  Package,
  MapPin,
  Smartphone,
  Banknote,
  ArrowRight,
  Star,
  Gift,
  RefreshCw,
  X,
  Edit2,
  Trash,
  CheckCircle,
  AlertCircle,
  CheckSquare,
  Loader2
} from 'lucide-react';

/* ─── Confetti Particle (Success Page) ─── */
const ConfettiParticle: React.FC<{ index: number }> = ({ index }) => {
  const colors = ['#287850', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#f97316', '#06b6d4'];
  const color = colors[index % colors.length];
  const left = `${(index * 11 + 5) % 95}%`;
  const delay = `${(index * 0.12) % 1.2}s`;
  const duration = `${1.2 + (index * 0.1) % 0.6}s`;
  return (
    <div style={{ position: 'fixed', left, top: '-10px', width: '8px', height: '8px', borderRadius: index % 2 === 0 ? '50%' : '1px', background: color, animation: `confettiFall ${duration} ${delay} ease-in forwards`, zIndex: 9999, pointerEvents: 'none' }} />
  );
};

/* ─── Checkout Progress Wizard Header ─── */
const WizardHeader: React.FC<{
  currentStep: 'cart' | 'address' | 'delivery' | 'review' | 'payment' | 'processing' | 'success';
  onNavigateBack: (step: 'cart' | 'address' | 'delivery' | 'review' | 'payment') => void;
}> = ({ currentStep, onNavigateBack }) => {
  const steps = [
    { key: 'cart', label: 'Cart' },
    { key: 'address', label: 'Address' },
    { key: 'delivery', label: 'Delivery' },
    { key: 'review', label: 'Review' },
    { key: 'payment', label: 'Payment' }
  ] as const;

  const order = ['cart', 'address', 'delivery', 'review', 'payment', 'processing', 'success'];
  const currentIdx = order.indexOf(currentStep);

  if (currentStep === 'processing' || currentStep === 'success') return null;

  return (
    <div className="w-full bg-wht border border-bdr rounded-xl p-5 shadow-premium-sm mb-8 select-none">
      <div className="max-w-[700px] mx-auto relative flex justify-between">
        
        {/* Background connector line, aligned to the vertical center of the h-8 circles (i.e. top-4) */}
        <div className="absolute left-4 right-4 top-4 h-[2px] bg-bdrl z-0" />
        
        {/* Active colored connector line */}
        <div 
          className="absolute left-4 top-4 h-[2px] bg-primary transition-all duration-500 z-0" 
          style={{ width: `${(Math.min(currentIdx, 4) / 4) * 92}%` }}
        />

        {steps.map((s, idx) => {
          const isDone = idx < currentIdx;
          const isActive = idx === currentIdx;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => { if (isDone) onNavigateBack(s.key); }}
              disabled={!isDone}
              className={`flex flex-col items-center gap-1.5 relative z-10 focus:outline-none transition-all ${
                isDone ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              {/* Circle is h-8, so its center is exactly at y = 16px (top-4) */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                isDone ? 'bg-primary text-wht shadow-[0_0_0_4px_var(--primary-soft)]'
                : isActive ? 'bg-primary text-wht shadow-[0_0_0_4px_var(--primary-soft)] scale-110'
                : 'bg-sur border border-bdr text-mut'
              }`}>
                {isDone ? <Check size={13} strokeWidth={3} /> : idx + 1}
              </div>
              <span className={`text-[10px] sm:text-xs font-bold tracking-wider uppercase transition-colors ${
                isActive ? 'text-primary font-extrabold' : isDone ? 'text-mid' : 'text-fnt'
              }`}>
                {s.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Redesigned Checkout Component ─── */
const Checkout: React.FC = () => {
  const { cart, placeOrder, updateCartQty, removeFromCart, setCurPage, curUser, showToast, openAuthModal, deletingProductId, updatingProductId } = useApp();

  // Wizard Step State
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'address' | 'delivery' | 'review' | 'payment' | 'processing' | 'success'>('cart');
  
  // Reset step if user logs out
  useEffect(() => {
    if (!curUser && checkoutStep !== 'cart') {
      setCheckoutStep('cart');
    }
  }, [curUser, checkoutStep]);

  
  // Construct address list using actual logged-in user details from curUser
  const buildUserAddressList = (user: any) => {
    if (!user) return [];
    
    // Check if user has an addresses array from backend
    if (user.addresses && Array.isArray(user.addresses) && user.addresses.length > 0) {
      return user.addresses.map((item: any, idx: number) => ({
        id: item._id || `addr-user-${idx}`,
        name: item.fullName || user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Valued Customer',
        phone: item.phoneNumber || user.phoneNumber || '',
        alternatePhone: item.alternatePhone || '',
        addressLine1: item.addressLine1 || '',
        addressLine2: item.addressLine2 || '',
        landmark: item.landmark || '',
        city: item.city || '',
        state: item.state || '',
        pincode: item.postalCode || '',
        country: item.country || 'India',
        type: item.tag || 'Home',
        isDefault: item.isDefault ?? idx === 0,
        instructions: ''
      }));
    }

    const dbAddr = user.address;
    const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Valued Customer';
    const userPhone = user.phoneNumber || '';

    if (dbAddr && (dbAddr.addressLine1 || dbAddr.city || dbAddr.postalCode)) {
      return [{
        id: 'addr-user-primary',
        name: userName,
        phone: userPhone,
        alternatePhone: '',
        addressLine1: dbAddr.addressLine1 || '',
        addressLine2: dbAddr.addressLine2 || '',
        landmark: dbAddr.landmark || '',
        city: dbAddr.city || '',
        state: dbAddr.state || '',
        pincode: dbAddr.postalCode || '',
        country: dbAddr.country || 'India',
        type: 'Home',
        isDefault: true,
        instructions: ''
      }];
    }

    return [];
  };

  const [addresses, setAddresses] = useState<any[]>(() => buildUserAddressList(curUser));

  const [selectedAddressId, setSelectedAddressId] = useState<string>(() => {
    const list = buildUserAddressList(curUser);
    const def = list.find((a: any) => a.isDefault);
    return def ? def.id : (list[0]?.id || '');
  });

  useEffect(() => {
    const list = buildUserAddressList(curUser);
    if (list.length > 0) {
      setAddresses(list);
      const def = list.find((a: any) => a.isDefault);
      setSelectedAddressId(def ? def.id : list[0].id);
    }
  }, [curUser]);

  // Address Form States (for Add & Edit address modes)
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAltPhone, setFormAltPhone] = useState('');
  const [formLine1, setFormLine1] = useState('');
  const [formLine2, setFormLine2] = useState('');
  const [formLandmark, setFormLandmark] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formPincode, setFormPincode] = useState('');
  const [formCountry, setFormCountry] = useState('India');
  const [formType, setFormType] = useState<'Home' | 'Office' | 'Other'>('Home');
  const [formInstructions, setFormInstructions] = useState('');

  // Delivery Method Selection (mapped to backend enum: FREE [₹0, 7 days], STANDARD [₹99, 4 days], EXPRESS [₹199, 2 days])
  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'express' | 'priority'>('standard');

  const deliveryMethods = {
    standard: { label: 'Free Delivery', time: '5-7 business days', price: 0, desc: 'Free standard surface transport (₹0)', icon: Truck },
    express: { label: 'Standard Delivery', time: '3-4 business days', price: 99, desc: 'Standard accelerated shipment (₹99)', icon: Zap },
    priority: { label: 'Express Delivery', time: '1-2 business days', price: 199, desc: 'Priority express dispatch (₹199)', icon: Package }
  };

  // Promo Code coupon system
  const [couponCode, setCouponCode] = useState('');
  const [activeCoupon, setActiveCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  // Payments selection
  const [paymentOption, setPaymentOption] = useState<'UPI' | 'Card' | 'NetBanking' | 'Wallet' | 'COD'>('UPI');
  
  // UPI payment options
  const [upiApp, setUpiApp] = useState<'GPay' | 'PhonePe' | 'Paytm' | 'BHIM' | ''>('');
  const [upiId, setUpiId] = useState('');
  const mockRecentUpi = ['amit.patel@okaxis', 'sharma.rohan@paytm'];

  // Card payment options
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [saveCard, setSaveCard] = useState(false);

  // Customer additional checkout comments notes
  const [customerNotes, setCustomerNotes] = useState('');

  // Payment simulated processing states
  const [processingIndex, setProcessingIndex] = useState(0);
  const [placedOrderSummary, setPlacedOrderSummary] = useState<{ id: string; total: number; method: string; date: string; transactionId?: string; paymentStatus?: string; expectedArrival?: string } | null>(null);

  // Single Product Checkout ("Buy This Alone") State
  const [aloneProductId, setAloneProductId] = useState<number | null>(null);

  // Edit Quantity State for Cart items
  const [editingQtyMap, setEditingQtyMap] = useState<Record<number, number>>({});

  const handleStartEditQty = (productId: number, currentQty: number) => {
    setEditingQtyMap((prev) => ({ ...prev, [productId]: currentQty }));
  };

  const handleAdjustDraftQty = (productId: number, delta: number) => {
    setEditingQtyMap((prev) => {
      const currentDraft = prev[productId] ?? 1;
      const nextDraft = Math.max(1, currentDraft + delta);
      return { ...prev, [productId]: nextDraft };
    });
  };

  const handleSaveQty = async (productId: number) => {
    const draftQty = editingQtyMap[productId];
    if (draftQty !== undefined) {
      await updateCartQty(productId, draftQty);
    }
    setEditingQtyMap((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const handleCancelEditQty = (productId: number) => {
    setEditingQtyMap((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  // Auto-reset aloneProductId if the item is removed from cart
  useEffect(() => {
    if (aloneProductId !== null && !cart.some(item => item.product.id === aloneProductId)) {
      setAloneProductId(null);
    }
  }, [cart, aloneProductId]);

  // Target checkout items (all cart items or single product selected to buy alone)
  const checkoutItems = aloneProductId !== null 
    ? cart.filter(item => item.product.id === aloneProductId) 
    : cart;
  
  const aloneItem = aloneProductId !== null ? cart.find(item => item.product.id === aloneProductId) : null;

  // Computations based on checkoutItems
  const subtotal = checkoutItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalItemQty = checkoutItems.reduce((sum, item) => sum + item.quantity, 0);
  
  // Promo Coupon deduction
  const discountDeduction = activeCoupon 
    ? Math.round(subtotal * (activeCoupon.discount / 100)) 
    : 0;

  // Taxes
  const taxesGst = Math.round((subtotal - discountDeduction) * 0.18);
  
  // Shipping
  const rawShippingFee = deliveryMethods[deliveryMethod].price;
  const shippingFee = (subtotal - discountDeduction) >= 499 && deliveryMethod === 'standard' ? 0 : rawShippingFee;
  
  // Grand total
  const grandTotal = subtotal - discountDeduction + taxesGst + shippingFee;

  // Formatting helpers
  const formatCardNumber = (v: string) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  
  const formatExpiry = (v: string) => {
    const raw = v.replace(/\D/g, '').slice(0, 4);
    return raw.length > 2 ? raw.slice(0, 2) + '/' + raw.slice(2) : raw;
  };

  // Set default address helper
  const handleSetDefaultAddress = (addrId: string) => {
    setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === addrId })));
    showToast('Default address updated.');
  };

  // Add / Edit address save trigger
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim() || !formLine1.trim() || !formCity.trim() || !formState.trim() || !formPincode.trim()) {
      showToast('Please fill out all mandatory address fields.');
      return;
    }

    setIsSavingAddress(true);

    const payload = {
      tag: formType || "Home",
      fullName: formName.trim(),
      phoneNumber: formPhone.trim(),
      alternatePhone: formAltPhone.trim(),
      addressLine1: formLine1.trim(),
      addressLine2: formLine2.trim(),
      landmark: formLandmark.trim(),
      city: formCity.trim(),
      state: formState.trim(),
      postalCode: formPincode.trim(),
      country: formCountry || "India",
      isDefault: addresses.length === 0
    };

    let serverSaved = false;

    try {
      if (!auth.currentUser) {
        await auth.authStateReady();
      }
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        if (token) {
          const apiRes = await axios.post(
            `${import.meta.env.VITE_BACKEND_URI}/users/address`,
            payload,
            {
              headers: { Authorization: `Bearer ${token}` },
              withCredentials: true
            }
          );
          if (apiRes.data && apiRes.data.success && Array.isArray(apiRes.data.addresses)) {
            serverSaved = true;
            const updatedList = apiRes.data.addresses.map((item: any, idx: number) => ({
              id: item._id || `addr-user-${idx}`,
              name: item.fullName || curUser?.name || 'Valued Customer',
              phone: item.phoneNumber || curUser?.phoneNumber || '',
              alternatePhone: item.alternatePhone || '',
              addressLine1: item.addressLine1 || '',
              addressLine2: item.addressLine2 || '',
              landmark: item.landmark || '',
              city: item.city || '',
              state: item.state || '',
              pincode: item.postalCode || '',
              country: item.country || 'India',
              type: item.tag || 'Home',
              isDefault: item.isDefault ?? idx === 0,
              instructions: ''
            }));
            setAddresses(updatedList);
            const latest = updatedList[updatedList.length - 1];
            if (latest) {
              setSelectedAddressId(latest.id);
            }
          }
        }
      }
    } catch (error) {
      console.warn("Could not sync address to server:", error);
    }

    if (!serverSaved) {
      if (editingAddressId) {
        // Update
        setAddresses(prev => prev.map(a => a.id === editingAddressId ? {
          ...a,
          name: formName.trim(),
          phone: formPhone.trim(),
          alternatePhone: formAltPhone.trim(),
          addressLine1: formLine1.trim(),
          addressLine2: formLine2.trim(),
          landmark: formLandmark.trim(),
          city: formCity.trim(),
          state: formState.trim(),
          pincode: formPincode.trim(),
          country: formCountry,
          type: formType,
          instructions: formInstructions.trim()
        } : a));
        showToast('Delivery address updated.');
      } else {
        // Create new
        const newAddr = {
          id: `addr-${Date.now()}`,
          name: formName.trim(),
          phone: formPhone.trim(),
          alternatePhone: formAltPhone.trim(),
          addressLine1: formLine1.trim(),
          addressLine2: formLine2.trim(),
          landmark: formLandmark.trim(),
          city: formCity.trim(),
          state: formState.trim(),
          pincode: formPincode.trim(),
          country: formCountry,
          type: formType,
          isDefault: addresses.length === 0,
          instructions: formInstructions.trim()
        };
        setAddresses(prev => [...prev, newAddr]);
        setSelectedAddressId(newAddr.id);
        showToast('New address registered.');
      }
    } else {
      showToast(editingAddressId ? 'Delivery address updated.' : 'New address registered.');
    }

    setIsSavingAddress(false);

    // Reset Form
    resetAddressForm();
  };

  const resetAddressForm = () => {
    setEditingAddressId(null);
    setAddressFormOpen(false);
    setFormName('');
    setFormPhone('');
    setFormAltPhone('');
    setFormLine1('');
    setFormLine2('');
    setFormLandmark('');
    setFormCity('');
    setFormState('');
    setFormPincode('');
    setFormCountry('India');
    setFormType('Home');
    setFormInstructions('');
  };

  const handleEditAddress = (addr: any) => {
    setEditingAddressId(addr.id);
    setFormName(addr.name);
    setFormPhone(addr.phone);
    setFormAltPhone(addr.alternatePhone || '');
    setFormLine1(addr.addressLine1);
    setFormLine2(addr.addressLine2 || '');
    setFormLandmark(addr.landmark || '');
    setFormCity(addr.city);
    setFormState(addr.state);
    setFormPincode(addr.pincode);
    setFormCountry(addr.country || 'India');
    setFormType(addr.type || 'Home');
    setFormInstructions(addr.instructions || '');
    setAddressFormOpen(true);
  };

  const handleDeleteAddress = (addrId: string) => {
    if (confirm('Delete this delivery coordinate?')) {
      setAddresses(prev => prev.filter(a => a.id !== addrId));
      showToast('Address removed.');
      if (selectedAddressId === addrId) {
        setSelectedAddressId('');
      }
    }
  };

  // Coupon promo evaluation
  const handleApplyCoupon = () => {
    setCouponError('');
    const c = couponCode.trim().toUpperCase();
    if (c === 'CLEAN10') {
      setActiveCoupon({ code: 'CLEAN10', discount: 10 });
      showToast('10% promo coupon successfully applied!');
    } else if (c === 'ECO15') {
      setActiveCoupon({ code: 'ECO15', discount: 15 });
      showToast('15% organic formulation discount applied!');
    } else {
      setCouponError('Invalid coupon code. Try CLEAN10 or ECO15.');
    }
    setCouponCode('');
  };

  const handleRemoveCoupon = () => {
    setActiveCoupon(null);
    showToast('Promo coupon removed.');
  };

  // Payment Simulated processing workflow
  const triggerPaymentSimulation = () => {
    setCheckoutStep('processing');
    setProcessingIndex(0);

    const stepsTimeline = [
      'Initializing secure payment gateway node...',
      'Validating merchant accounts token...',
      'Confirming ledger allocation with banking hub...',
      'Securing final order details log...'
    ];

    let stepIndex = 0;
    const timer = setInterval(async () => {
      stepIndex += 1;
      if (stepIndex >= stepsTimeline.length) {
        clearInterval(timer);

        const currentAddr = addresses.find(a => a.id === selectedAddressId) || addresses[0];
        const finalAddress = {
          _id: currentAddr?.id || currentAddr?._id,
          id: currentAddr?.id || currentAddr?._id,
          name: currentAddr?.name || 'Valued Customer',
          phone: currentAddr?.phone || '',
          alternatePhone: currentAddr?.alternatePhone || '',
          addressLine1: currentAddr?.addressLine1 || '',
          addressLine2: currentAddr?.addressLine2 || '',
          pincode: currentAddr?.pincode || '',
          city: currentAddr?.city || '',
          state: currentAddr?.state || ''
        };

        // Determine deliveryOption enum ("FREE" | "STANDARD" | "EXPRESS")
        let backendDeliveryOption: 'FREE' | 'STANDARD' | 'EXPRESS' = 'FREE';
        if (deliveryMethod === 'standard') {
          backendDeliveryOption = 'FREE';
        } else if (deliveryMethod === 'express') {
          backendDeliveryOption = 'STANDARD';
        } else if (deliveryMethod === 'priority') {
          backendDeliveryOption = 'EXPRESS';
        }

        // Determine orderType enum ("BUY_NOW" | "CART")
        const orderTypeEnum: 'BUY_NOW' | 'CART' = aloneProductId !== null ? 'BUY_NOW' : 'CART';

        let resData: any = null;
        try {
          resData = await placeOrder(
            finalAddress,
            paymentOption,
            customerNotes + ' | ' + (currentAddr?.instructions || ''),
            checkoutItems,
            backendDeliveryOption,
            orderTypeEnum
          );
        } catch (err) {
          console.error("Order placement error:", err);
        } finally {
          const backendOrderData = resData?.order;
          const innerOrder = backendOrderData?.order;

          const orderId = backendOrderData?.orderIdReference || innerOrder?.orderNumber || '';
          const totalPaid = backendOrderData?.grandTotalPaid ?? innerOrder?.grandTotal ?? grandTotal;
          const mode = backendOrderData?.paymentMode || innerOrder?.payment?.method || paymentOption;
          const arrival = backendOrderData?.expectedArrival || (innerOrder?.delivery?.estimatedDays ? `${innerOrder.delivery.estimatedDays} business days` : deliveryMethods[deliveryMethod].time);
          const payStatus = innerOrder?.payment?.status || 'Pending';
          const txnId = innerOrder?.payment?.transactionId || backendOrderData?.transactionId || '';

          setPlacedOrderSummary({
            id: orderId,
            total: totalPaid,
            method: mode,
            date: new Date().toLocaleDateString(undefined, { dateStyle: 'long' }),
            transactionId: txnId,
            paymentStatus: payStatus,
            expectedArrival: arrival
          });

          setCheckoutStep('success');
        }

        sessionStorage.setItem('ce_order_just_placed', JSON.stringify({
          method: paymentOption,
          total: grandTotal,
          ts: Date.now()
        }));
      } else {
        setProcessingIndex(stepIndex);
      }
    }, 600);
  };

  // Back button helper
  const handleWizardBack = (target: typeof checkoutStep) => {
    if (target === 'processing' || target === 'success') return;
    setCheckoutStep(target as any);
  };

  /* ─── Empty Cart State fallback ─── */
  if (cart.length === 0 && checkoutStep === 'cart') {
    return (
      <div className="max-w-[480px] mx-auto text-center py-24 px-6 animate-scaleIn select-none">
        <div className="w-20 h-20 bg-primary-soft rounded-full flex items-center justify-center mx-auto mb-6 animate-float">
          <ShoppingCart size={32} className="text-primary/60" />
        </div>
        <h2 className="font-display text-2xl font-bold mb-3 text-blk">Your cart is empty</h2>
        <p className="text-sm text-mut mb-8 leading-relaxed">
          Start adding botanical formulations and eco household solutions to your cart before proceeding to check out.
        </p>
        <button
          className="btn-primary-lg flex items-center gap-2 mx-auto shadow-premium-sm"
          onClick={() => setCurPage('products')}
        >
          <Star size={14} /> Explore catalog
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-7 py-10 pb-24 animate-fadeIn relative">

      {/* Address Processing Loading Overlay */}
      {isSavingAddress && (
        <div className="fixed inset-0 bg-blk/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fadeIn">
          <div className="bg-wht p-6 rounded-2xl shadow-premium flex flex-col items-center gap-3 border border-bdr max-w-xs w-full text-center">
            <Loader2 size={36} className="text-primary animate-spin" />
            <h4 className="text-sm font-bold text-blk">Registering Address</h4>
            <p className="text-xs text-mut font-medium">Please wait while your delivery coordinates are being registered to your profile...</p>
          </div>
        </div>
      )}
      
      {/* 6-Step Header Progress */}
      <WizardHeader currentStep={checkoutStep} onNavigateBack={handleWizardBack} />

      {/* Main double column container layout */}
      {checkoutStep !== 'processing' && checkoutStep !== 'success' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.65fr_1fr] gap-8 items-start">
          
          {/* Left Column Content panels */}
          <div className="flex flex-col gap-6">
            
            {/* ══════════════════ STEP 1: SHOPPING CART ══════════════════ */}
            {checkoutStep === 'cart' && (
              <div className="bg-wht border border-bdr rounded-xl shadow-premium-sm overflow-hidden animate-scaleIn">
                <div className="flex justify-between items-center px-6 py-4.5 border-b border-bdrl select-none">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-primary-soft rounded-lg flex items-center justify-center text-primary">
                      <ShoppingCart size={15} />
                    </div>
                    <div>
                      <h2 className="font-display text-sm font-bold text-blk">Review Cart Items</h2>
                      <p className="text-[10px] text-mut mt-0.5">{totalItemQty} formulated cleaning agent{totalItemQty !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary-soft px-2.5 py-1 rounded-full">
                    Subtotal: ₹{subtotal}
                  </span>
                </div>

                {/* Banner when a single item is selected to buy alone */}
                {aloneProductId !== null && aloneItem && (
                  <div className="bg-primary-soft/50 border-b border-primary/20 px-6 py-3 flex items-center justify-between gap-3 text-xs select-none animate-fadeIn">
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <Zap size={14} className="fill-primary" />
                      <span>Buying <strong>"{aloneItem.product.name}"</strong> alone. Right-side total is updated for this item only.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAloneProductId(null);
                        showToast('Switched to checkout all items in cart.');
                      }}
                      className="text-xs font-extrabold text-primary hover:underline cursor-pointer bg-wht px-3 py-1 rounded-md border border-primary/30 shadow-xs"
                    >
                      Buy All Items ({cart.length})
                    </button>
                  </div>
                )}

                <div className="divide-y divide-bdrl">
                  {cart.map((item, idx) => {
                    const discountPct = item.product.discount > 0 ? item.product.discount : 15;
                    const mrp = item.product.originalPrice || Math.round(item.product.price / (1 - discountPct / 100));
                    const savings = mrp - item.product.price;
                    const isAloneSelected = aloneProductId === item.product.id;
                    return (
                      <div 
                        key={item.product.id} 
                        className={`p-5 sm:p-6 transition-colors duration-150 relative ${
                          isAloneSelected ? 'bg-primary-soft/30 border-l-4 border-l-primary' : 'hover:bg-sur/20'
                        }`}
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        <div className="flex gap-4 sm:gap-5 items-start sm:items-center">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-bdrl overflow-hidden bg-primary-soft/30 flex items-center justify-center shrink-0 shadow-premium-sm">
                            {item.product.imgs?.length > 0 ? (
                              <img src={item.product.imgs[0]} alt={item.product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package size={22} className="text-primary/30" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-1 flex-wrap">
                              <span className="text-[9px] font-bold text-accent uppercase tracking-wider bg-accent-light/50 px-1.5 py-0.5 rounded">
                                {item.product.cat}
                              </span>
                              <span className="text-[9px] font-bold text-red bg-red-bg px-1.5 py-0.5 rounded">
                                {discountPct}% OFF
                              </span>
                            </div>
                            
                            <h4 className="text-sm font-bold text-blk leading-snug mb-0.5 line-clamp-1">{item.product.name}</h4>
                            <p className="text-[10px] text-mut">Seller: <span className="font-semibold text-mid">Clean Everyday India</span></p>
                            <p className="text-[10px] text-mut mt-0.5">Est. Delivery: <span className="font-semibold text-primary">In 3-5 days</span></p>
                            
                            <div className="flex items-baseline gap-2 flex-wrap mt-2">
                              <span className="text-base font-extrabold text-blk">₹{item.product.price}</span>
                              <span className="text-xs text-mut line-through">₹{mrp}</span>
                              <span className="text-[10px] font-bold text-primary">Save ₹{savings}</span>
                            </div>

                            {/* Quantity Management & Pencil Edit Controls */}
                            {(() => {
                              const draftQty = editingQtyMap[item.product.id];
                              const isEditingQty = draftQty !== undefined;
                              const activeQty = isEditingQty ? draftQty : item.quantity;

                              return (
                                <div className="mt-3 flex items-center justify-between flex-wrap gap-3">
                                  {isEditingQty ? (
                                    /* Editing Mode: + / - controls with OK and Cancel buttons */
                                    <div className="flex items-center gap-2 flex-wrap animate-fadeIn">
                                      <div className="flex items-center border border-primary/40 rounded-lg bg-wht shadow-sm overflow-hidden">
                                        <button 
                                          type="button" 
                                          className="w-8 h-8 flex items-center justify-center hover:bg-primary-soft hover:text-primary transition-colors cursor-pointer text-mid" 
                                          onClick={() => handleAdjustDraftQty(item.product.id, -1)}
                                          title="Decrease quantity"
                                        >
                                          <Minus size={11} strokeWidth={2.5} />
                                        </button>
                                        <span className="text-xs font-bold text-primary px-3 select-none min-w-[28px] text-center">
                                          {draftQty}
                                        </span>
                                        <button 
                                          type="button" 
                                          className="w-8 h-8 flex items-center justify-center hover:bg-primary-soft hover:text-primary transition-colors cursor-pointer text-mid" 
                                          onClick={() => handleAdjustDraftQty(item.product.id, 1)}
                                          title="Increase quantity"
                                        >
                                          <Plus size={11} strokeWidth={2.5} />
                                        </button>
                                      </div>

                                      <button
                                         type="button"
                                         disabled={updatingProductId === item.product.id}
                                         onClick={() => handleSaveQty(item.product.id)}
                                         className="px-3 py-1.5 bg-primary text-wht text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm hover:bg-primary-hover transition-all cursor-pointer border-none disabled:opacity-70"
                                         title="Save quantity changes"
                                       >
                                         {updatingProductId === item.product.id ? (
                                           <>
                                             <Loader2 size={13} className="animate-spin" />
                                             <span>Updating...</span>
                                           </>
                                         ) : (
                                           <>
                                             <Check size={13} strokeWidth={3} />
                                             <span>OK</span>
                                           </>
                                         )}
                                       </button>

                                      <button
                                        type="button"
                                        onClick={() => handleCancelEditQty(item.product.id)}
                                        className="px-2.5 py-1.5 bg-sur border border-bdr text-mut text-xs font-bold rounded-lg flex items-center gap-1 hover:text-blk hover:border-mid transition-all cursor-pointer"
                                        title="Cancel editing"
                                      >
                                        <X size={13} strokeWidth={2.5} />
                                        <span>Cancel</span>
                                      </button>
                                    </div>
                                  ) : (
                                    /* Normal Mode: Display Quantity Badge + Pencil Icon */
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-mid bg-sur border border-bdr px-2.5 py-1 rounded-md select-none">
                                        Qty: {item.quantity}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleStartEditQty(item.product.id, item.quantity)}
                                        className="text-xs text-primary font-bold hover:bg-primary-soft/80 flex items-center gap-1.5 cursor-pointer bg-primary-soft px-2.5 py-1 rounded-md border border-primary/20 transition-all select-none"
                                        title="Edit product quantity"
                                      >
                                        <Edit2 size={12} />
                                        <span>Edit Qty</span>
                                      </button>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-3 ml-auto">
                                    <span className="text-sm font-bold text-blk">₹{item.product.price * activeQty}</span>
                                    <button 
                                      type="button" 
                                      disabled={deletingProductId === item.product.id}
                                      className="w-7 h-7 text-mut hover:text-red hover:bg-red-bg rounded-md flex items-center justify-center cursor-pointer transition-all" 
                                      onClick={() => removeFromCart(item.product.id)} 
                                      title="Remove item from cart"
                                    >
                                      {deletingProductId === item.product.id ? (
                                        <Loader2 size={12} className="animate-spin text-red" />
                                      ) : (
                                        <Trash2 size={12} />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Option below the cart card to Buy This Alone */}
                        <div className="mt-3 pt-2.5 border-t border-bdrl/80 flex items-center justify-between flex-wrap gap-2 select-none">
                          <button
                            type="button"
                            onClick={() => {
                              if (isAloneSelected) {
                                setAloneProductId(null);
                                showToast('Switched to checkout all items in cart.');
                              } else {
                                setAloneProductId(item.product.id);
                                showToast(`Selected "${item.product.name}" to buy alone.`);
                              }
                            }}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                              isAloneSelected
                                ? 'bg-primary text-wht shadow-sm'
                                : 'bg-sur border border-bdr text-blk hover:bg-primary-soft hover:text-primary hover:border-primary/30'
                            }`}
                          >
                            <Zap size={13} className={isAloneSelected ? 'fill-wht text-wht' : 'text-accent'} />
                            {isAloneSelected ? 'Buying This Alone (Selected)' : 'Buy this item alone'}
                          </button>

                          {isAloneSelected ? (
                            <span className="text-[11px] font-semibold text-primary flex items-center gap-1">
                              <Check size={12} strokeWidth={3} /> Total cost on right updated for this item only
                            </span>
                          ) : (
                            <span className="text-[11px] text-mut">
                              Order this product individually without removing other cart items
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══════════════════ STEP 2: DELIVERY ADDRESS ══════════════════ */}
            {checkoutStep === 'address' && (
              <div className="flex flex-col gap-5 animate-scaleIn">
                <div className="bg-wht border border-bdr rounded-xl shadow-premium-sm p-5 select-none">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-display text-sm font-bold text-blk">Select Delivery Coordinates</h3>
                      <p className="text-[10px] text-mut mt-0.5">Pick a saved location or register a new one</p>
                    </div>
                    {!addressFormOpen && (
                      <button
                        onClick={() => setAddressFormOpen(true)}
                        className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 shadow-premium-sm"
                      >
                        <Plus size={12} /> Register Address
                      </button>
                    )}
                  </div>

                  {/* If no addresses present */}
                  {!addressFormOpen && addresses.length === 0 && (
                    <div className="border border-dashed border-bdr rounded-xl p-8 text-center flex flex-col items-center justify-center my-2">
                      <div className="w-12 h-12 rounded-full bg-primary-soft/30 flex items-center justify-center mb-3">
                        <MapPin size={22} className="text-primary" />
                      </div>
                      <h4 className="text-xs font-bold text-blk">No Address Registered</h4>
                      <p className="text-[11px] text-mut max-w-sm mt-1 mb-4">You have no saved delivery coordinates on your account. Register a new address to continue with your order.</p>
                      <button
                        onClick={() => setAddressFormOpen(true)}
                        className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-premium-sm"
                      >
                        <Plus size={14} /> Register Address
                      </button>
                    </div>
                  )}

                  {/* Saved Addresses list */}
                  {!addressFormOpen && addresses.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map(addr => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`border rounded-xl p-4.5 cursor-pointer relative transition-all flex flex-col justify-between ${
                              isSelected 
                                ? 'border-primary bg-primary-soft/10 shadow-premium-sm ring-1 ring-primary' 
                                : 'border-bdr hover:border-mut/40 hover:bg-sur/15'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name="selectedAddress"
                                    checked={isSelected}
                                    onChange={() => setSelectedAddressId(addr.id)}
                                    className="accent-primary h-3.5 w-3.5 cursor-pointer"
                                  />
                                  <span className={`badge-tag px-2 py-0.5 text-[9px] font-bold ${
                                    addr.type === 'Office' ? 'bg-indigo-50 text-indigo-700' : 'bg-primary-soft text-primary'
                                  }`}>
                                    {addr.type}
                                  </span>
                                  {addr.isDefault && (
                                    <span className="bg-amber-50 text-amber-700 border border-amber-150 px-2 py-0.5 text-[9px] font-bold rounded">
                                      Default
                                    </span>
                                  )}
                                </div>
                              </div>

                              <h4 className="text-xs font-bold text-blk mt-1">{addr.name || curUser?.name || 'Valued Customer'}</h4>
                              <p className="text-[11px] font-medium text-mut font-mono mt-0.5">{addr.phone || curUser?.phoneNumber || 'No phone number'}</p>
                              {addr.addressLine1 ? (
                                <>
                                  <p className="text-xs text-mid mt-2 leading-relaxed">
                                    {addr.addressLine1}
                                    {addr.addressLine2 && `, ${addr.addressLine2}`}
                                  </p>
                                  <p className="text-xs text-mid">{addr.city}{addr.city && addr.state ? ', ' : ''}{addr.state} {addr.pincode ? `— ${addr.pincode}` : ''}</p>
                                </>
                              ) : (
                                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mt-2 font-medium">
                                  No street address saved on profile. Click "Edit" below to specify your delivery coordinates.
                                </p>
                              )}
                              {addr.instructions && (
                                <p className="text-[9px] text-accent italic mt-2.5 border-l border-accent/20 pl-2">
                                  &ldquo;{addr.instructions}&rdquo;
                                </p>
                              )}
                            </div>

                            {/* Actions block */}
                            <div className="flex items-center justify-between border-t border-bdrl mt-4 pt-3.5" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => handleEditAddress(addr)}
                                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                              >
                                <Edit2 size={10} /> Edit
                              </button>
                              
                              {!addr.isDefault && (
                                <button
                                  onClick={() => handleSetDefaultAddress(addr.id)}
                                  className="text-[10px] font-semibold text-mut hover:text-blk"
                                >
                                  Make Default
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="text-[10px] font-bold text-red hover:underline flex items-center gap-1"
                              >
                                <Trash size={10} /> Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add / Edit address Form */}
                  {addressFormOpen && (
                    <form onSubmit={handleSaveAddress} className="border border-bdr rounded-xl p-5 bg-sur/10 animate-slideRight">
                      <div className="flex items-center justify-between mb-4 border-b border-bdrl pb-2.5">
                        <h4 className="text-xs font-bold text-blk uppercase tracking-wider">
                          {editingAddressId ? 'Edit Address Parameters' : 'Add New Shipping Coordinate'}
                        </h4>
                        <button type="button" onClick={resetAddressForm} className="text-mut hover:text-blk">
                          <X size={15} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-mut uppercase">Full Recipient Name <span className="text-red">*</span></label>
                          <input type="text" placeholder="E.g., Amit Patel" value={formName} onChange={e => setFormName(e.target.value)} className="input-field" required />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-mut uppercase">Mobile Number <span className="text-red">*</span></label>
                          <input type="tel" placeholder="E.g., 9876543210" value={formPhone} onChange={e => setFormPhone(e.target.value)} className="input-field" required />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-mut uppercase">Alternative Mobile <span className="text-mut/50">(Optional)</span></label>
                          <input type="tel" placeholder="Alternative contact code" value={formAltPhone} onChange={e => setFormAltPhone(e.target.value)} className="input-field" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-mut uppercase">Address Type</label>
                          <select value={formType} onChange={e => setFormType(e.target.value as any)} className="input-field py-2">
                            <option value="Home">Home (All Day Delivery)</option>
                            <option value="Office">Office (9 AM - 6 PM)</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 mb-4">
                        <label className="text-[10px] font-bold text-mut uppercase">Address Line 1 <span className="text-red">*</span></label>
                        <input type="text" placeholder="E.g., Flat 301, Silver Crest Apartments" value={formLine1} onChange={e => setFormLine1(e.target.value)} className="input-field" required />
                      </div>

                      <div className="flex flex-col gap-1 mb-4">
                        <label className="text-[10px] font-bold text-mut uppercase">Address Line 2 <span className="text-mut/50">(Optional)</span></label>
                        <input type="text" placeholder="E.g., Landmark, Street, Sector" value={formLine2} onChange={e => setFormLine2(e.target.value)} className="input-field" />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-mut uppercase">Landmark</label>
                          <input type="text" placeholder="E.g., Near Park" value={formLandmark} onChange={e => setFormLandmark(e.target.value)} className="input-field" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-mut uppercase">City <span className="text-red">*</span></label>
                          <input type="text" placeholder="E.g., Bengaluru" value={formCity} onChange={e => setFormCity(e.target.value)} className="input-field" required />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-mut uppercase">State <span className="text-red">*</span></label>
                          <input type="text" placeholder="E.g., Karnataka" value={formState} onChange={e => setFormState(e.target.value)} className="input-field" required />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-mut uppercase">PIN Code <span className="text-red">*</span></label>
                          <input type="text" placeholder="E.g., 560066" value={formPincode} onChange={e => setFormPincode(e.target.value)} className="input-field" required />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 mb-5">
                        <label className="text-[10px] font-bold text-mut uppercase">Instructions for Delivery Rider</label>
                        <textarea placeholder="E.g., Leave package next door, ring bell twice..." value={formInstructions} onChange={e => setFormInstructions(e.target.value)} rows={2} className="textarea-field" />
                      </div>

                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={resetAddressForm} className="btn-secondary text-xs">
                          Cancel
                        </button>
                        <button type="submit" disabled={isSavingAddress} className="btn-primary text-xs shadow-premium-sm flex items-center gap-1.5 disabled:opacity-50">
                          {isSavingAddress ? (
                            <>
                              <Loader2 size={13} className="animate-spin" /> Registering Address...
                            </>
                          ) : (
                            'Save Coordinates'
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Back button (Next is now in sidebar) */}
                {!addressFormOpen && (
                  <div className="flex justify-between items-center select-none">
                    <button onClick={() => setCheckoutStep('cart')} className="btn-secondary text-xs flex items-center gap-1">
                      <ArrowLeft size={13} /> Back to Cart
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════ STEP 3: DELIVERY METHOD ══════════════════ */}
            {checkoutStep === 'delivery' && (
              <div className="flex flex-col gap-6 animate-scaleIn select-none">
                <div className="bg-wht border border-bdr rounded-xl shadow-premium-sm p-5">
                  <h3 className="font-display text-sm font-bold text-blk mb-1">Choose Shipment Speed</h3>
                  <p className="text-[10px] text-mut mb-4">Select how quickly you want your botanical packages dispatched</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(Object.keys(deliveryMethods) as Array<keyof typeof deliveryMethods>).map(key => {
                      const m = deliveryMethods[key];
                      const isSelected = deliveryMethod === key;
                      const Icon = m.icon;
                      
                      // Calculate method fee
                      const fee = key === 'standard' && (subtotal - discountDeduction) >= 499 ? 0 : m.price;

                      return (
                        <div
                          key={key}
                          onClick={() => setDeliveryMethod(key)}
                          className={`border rounded-xl p-4.5 cursor-pointer relative transition-all flex flex-col justify-between items-start gap-4 ${
                            isSelected 
                              ? 'border-primary bg-primary-soft/10 shadow-premium-sm ring-1 ring-primary' 
                              : 'border-bdr hover:border-mut/40 hover:bg-sur/10'
                          }`}
                        >
                          <div className="flex justify-between items-start w-full">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isSelected ? 'bg-primary text-wht' : 'bg-sur text-mut'
                            }`}>
                              <Icon size={16} />
                            </div>
                            <span className="text-xs font-bold text-blk font-mono">
                              {fee === 0 ? 'FREE' : `₹${fee}`}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-xs font-bold text-blk leading-tight">{m.label}</h4>
                            <p className="text-[10px] text-primary font-semibold mt-1">{m.time}</p>
                            <p className="text-[10px] text-mut mt-1 leading-normal">{m.desc}</p>
                          </div>

                          <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center self-end ${
                            isSelected ? 'border-primary bg-primary text-wht' : 'border-bdr bg-wht text-transparent'
                          }`}>
                            <Check size={10} strokeWidth={3} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <button onClick={() => setCheckoutStep('address')} className="btn-secondary text-xs flex items-center gap-1">
                    <ArrowLeft size={13} /> Back to Address
                  </button>
                </div>
              </div>
            )}

            {/* ══════════════════ STEP 4: ORDER REVIEW ══════════════════ */}
            {checkoutStep === 'review' && (
              <div className="flex flex-col gap-6 animate-scaleIn">
                
                {/* Coordinates review */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Selected Address card */}
                  <div className="bg-wht border border-bdr rounded-xl p-5 shadow-premium-sm flex flex-col justify-between select-none">
                    <div>
                      <div className="flex items-center justify-between mb-3 border-b border-bdrl pb-2">
                        <span className="text-[10px] font-bold text-mut uppercase flex items-center gap-1">
                          <MapPin size={11} className="text-primary" /> Delivery Destination
                        </span>
                        <button
                          onClick={() => setCheckoutStep('address')}
                          className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
                        >
                          Change
                        </button>
                      </div>
                      
                      {(() => {
                        const addr = addresses.find(a => a.id === selectedAddressId) || addresses[0];
                        if (!addr) return <p className="text-xs text-mut font-semibold">No address registered</p>;
                        return (
                          <div>
                            <h4 className="text-xs font-bold text-blk">{addr.name}</h4>
                            <p className="text-[11px] font-semibold text-mut mt-0.5 font-mono">{addr.phone}</p>
                            <p className="text-xs text-mid mt-1.5 leading-relaxed">
                              {addr.addressLine1}
                              {addr.addressLine2 && `, ${addr.addressLine2}`}
                            </p>
                            <p className="text-xs text-mid">{addr.city}, {addr.state} — {addr.pincode}</p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Selected Delivery Method card */}
                  <div className="bg-wht border border-bdr rounded-xl p-5 shadow-premium-sm flex flex-col justify-between select-none">
                    <div>
                      <div className="flex items-center justify-between mb-3 border-b border-bdrl pb-2">
                        <span className="text-[10px] font-bold text-mut uppercase flex items-center gap-1">
                          <Truck size={11} className="text-primary" /> Shipment Method
                        </span>
                        <button
                          onClick={() => setCheckoutStep('delivery')}
                          className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
                        >
                          Change
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary-soft rounded-lg flex items-center justify-center text-primary">
                          {React.createElement(deliveryMethods[deliveryMethod].icon, { size: 16 })}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-blk">{deliveryMethods[deliveryMethod].label}</h4>
                          <p className="text-[10px] text-primary font-semibold mt-0.5">{deliveryMethods[deliveryMethod].time}</p>
                          <p className="text-[10px] text-mut mt-0.5 font-semibold">Shipping Cost: {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Products card list review */}
                <div className="bg-wht border border-bdr rounded-xl shadow-premium-sm p-5">
                  <div className="flex justify-between items-center mb-4 border-b border-bdrl pb-2 select-none">
                    <span className="text-[10px] font-bold text-mut uppercase flex items-center gap-1">
                      <ShoppingCart size={11} className="text-primary" /> Packaged Products ({totalItemQty})
                    </span>
                    <button
                      onClick={() => setCheckoutStep('cart')}
                      className="text-[10px] font-bold text-primary hover:underline"
                    >
                      Modify Cart
                    </button>
                  </div>

                  <div className="divide-y divide-bdrl">
                    {checkoutItems.map((item) => (
                      <div key={item.product.id} className="flex gap-4 items-center py-3 first:pt-0 last:pb-0">
                        <div className="w-12 h-12 rounded-lg border border-bdrl overflow-hidden bg-primary-soft/30 flex items-center justify-center shrink-0">
                          {item.product.imgs?.length > 0 ? (
                            <img src={item.product.imgs[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package size={14} className="text-primary/30" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-blk truncate">{item.product.name}</h4>
                          <p className="text-[10px] text-mut mt-0.5">Qty: {item.quantity} × ₹{item.product.price}</p>
                        </div>
                        <span className="text-xs font-bold text-blk font-mono shrink-0">
                          ₹{item.product.price * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional instructions note option */}
                <div className="bg-wht border border-bdr rounded-xl shadow-premium-sm p-4">
                  <label className="text-[10px] font-bold text-mut uppercase block mb-1.5 select-none">Add checkout remarks or comments</label>
                  <input
                    type="text"
                    placeholder="E.g., Call before delivery, ring bell twice..."
                    value={customerNotes}
                    onChange={e => setCustomerNotes(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="flex justify-between items-center select-none">
                  <button onClick={() => setCheckoutStep('delivery')} className="btn-secondary text-xs flex items-center gap-1">
                    <ArrowLeft size={13} /> Back to Delivery
                  </button>
                </div>
              </div>
            )}

            {/* ══════════════════ STEP 5: SECURE PAYMENT METHOD ══════════════════ */}
            {checkoutStep === 'payment' && (
              <div className="flex flex-col gap-6 animate-scaleIn">
                <div className="bg-wht border border-bdr rounded-xl shadow-premium-sm p-5">
                  <h3 className="font-display text-sm font-bold text-blk mb-1 select-none">Secure Payment Options</h3>
                  <p className="text-[10px] text-mut mb-5 select-none">All information remains protected via PCI-DSS standards</p>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5 mb-6 select-none">
                    {[
                      { key: 'UPI', label: 'UPI apps', icon: Smartphone },
                      { key: 'Card', label: 'Card Payment', icon: CreditCard },
                      { key: 'COD', label: 'Cash / COD', icon: Banknote }
                    ].map(opt => {
                      const isSelected = paymentOption === opt.key;
                      const Icon = opt.icon;
                      return (
                        <div
                          key={opt.key}
                          onClick={() => setPaymentOption(opt.key as any)}
                          className={`border rounded-xl p-3.5 cursor-pointer text-center flex flex-col items-center justify-center gap-2 transition-all ${
                            isSelected 
                              ? 'border-primary bg-primary-soft/10 shadow-premium-sm ring-1 ring-primary font-bold' 
                              : 'border-bdr hover:border-mut/30 hover:bg-sur/10'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-primary text-wht' : 'bg-sur text-mut'
                          }`}>
                            <Icon size={15} />
                          </div>
                          <span className="text-[10px] font-bold text-blk">{opt.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Selected payment content panels */}
                  
                  {/* UPI */}
                  {paymentOption === 'UPI' && (
                    <div className="border border-bdr rounded-xl p-4.5 bg-sur/10 animate-slideRight">
                      <span className="text-[9px] font-bold text-mut uppercase block mb-3">Preferred App Handover</span>
                      <div className="flex gap-2 flex-wrap mb-4">
                        {(['GPay', 'PhonePe', 'Paytm', 'BHIM'] as const).map(app => (
                          <button
                            key={app}
                            type="button"
                            onClick={() => { setUpiApp(app); setUpiId(''); }}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                              upiApp === app ? 'bg-primary text-wht border-primary shadow-premium-sm' : 'bg-wht border-bdr text-mid hover:border-primary/30'
                            }`}
                          >
                            {app}
                          </button>
                        ))}
                      </div>

                      <div className="flex flex-col gap-1.5 mb-4">
                        <label className="text-[10px] font-bold text-mut uppercase">Or Enter VPA (UPI ID)</label>
                        <input
                          type="text"
                          placeholder="yourname@okaxis"
                          value={upiId}
                          onChange={e => { setUpiId(e.target.value); setUpiApp(''); }}
                          className="input-field bg-wht"
                        />
                      </div>

                      <div className="border-t border-bdrl mt-4 pt-3">
                        <span className="text-[9px] font-bold text-mut uppercase block mb-2">Recent Handles</span>
                        <div className="flex flex-col gap-2">
                          {mockRecentUpi.map(handle => (
                            <div
                              key={handle}
                              onClick={() => { setUpiId(handle); setUpiApp(''); }}
                              className="text-xs font-mono font-semibold text-mid hover:text-primary cursor-pointer flex items-center gap-1.5"
                            >
                              <CheckCircle size={10} className="text-primary/60" /> {handle}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CARD */}
                  {paymentOption === 'Card' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border border-bdr rounded-xl p-4.5 bg-sur/10 animate-slideRight">
                      
                      {/* Premium Card Preview */}
                      <div className="bg-gradient-to-br from-primary-deep to-primary rounded-xl p-5 text-wht shadow-premium-lg relative overflow-hidden flex flex-col justify-between min-h-[170px]">
                        <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-wht/5 -translate-y-8 translate-x-8" />
                        <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full bg-wht/5 translate-y-8 -translate-x-4" />
                        
                        <div className="flex justify-between items-start relative z-10">
                          <div className="w-9 h-7 bg-amber-200/90 rounded-md shadow-premium-sm" />
                          <span className="text-[9px] font-extrabold tracking-widest bg-wht/20 px-2 py-0.5 rounded">
                            DEBIT CARD
                          </span>
                        </div>

                        <div className="relative z-10">
                          <p className="font-mono text-base tracking-[0.25em] mb-4 text-center text-wht/90">
                            {cardNumber || '•••• •••• •••• ••••'}
                          </p>
                          
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-[8px] opacity-60 uppercase tracking-wider">Cardholder</p>
                              <p className="text-xs font-bold font-mono tracking-wide">{cardHolder || 'AMIT PATEL'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[8px] opacity-60 uppercase tracking-wider">Expiry</p>
                              <p className="text-xs font-bold font-mono">{cardExpiry || 'MM/YY'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Inputs block */}
                      <div className="flex flex-col gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-mut uppercase mb-1 block">Card Number</label>
                          <input
                            type="text"
                            placeholder="1234 5678 9101 1121"
                            value={cardNumber}
                            onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                            maxLength={19}
                            className="input-field bg-wht font-mono tracking-wider"
                          />
                        </div>
                        
                        <div>
                          <label className="text-[10px] font-bold text-mut uppercase mb-1 block">Cardholder Name</label>
                          <input
                            type="text"
                            placeholder="As printed on card"
                            value={cardHolder}
                            onChange={e => setCardHolder(e.target.value.toUpperCase())}
                            className="input-field bg-wht"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-mut uppercase mb-1 block">Expiry Date</label>
                            <input
                              type="text"
                              placeholder="MM/YY"
                              value={cardExpiry}
                              onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                              maxLength={5}
                              className="input-field bg-wht font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-mut uppercase mb-1 block">CVV Secure</label>
                            <input
                              type="password"
                              placeholder="•••"
                              value={cardCvv}
                              onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                              maxLength={3}
                              className="input-field bg-wht font-mono"
                            />
                          </div>
                        </div>

                        <label className="flex items-center gap-2 mt-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={saveCard}
                            onChange={e => setSaveCard(e.target.checked)}
                            className="accent-primary h-3.5 w-3.5 rounded cursor-pointer"
                          />
                          <span className="text-[10px] font-bold text-mid">Securely save card for future checkouts</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* COD */}
                  {paymentOption === 'COD' && (
                    <div className="border border-bdr rounded-xl p-5 bg-sur/10 animate-slideRight">
                      <div className="flex gap-3 items-start">
                        <AlertCircle size={18} className="text-primary mt-0.5 shrink-0" />
                        <div>
                          <h4 className="text-xs font-bold text-blk">Cash on Delivery details</h4>
                          <p className="text-xs text-mid mt-1.5 leading-relaxed">
                            Our shipping logistics representative will handover the eco formulations package and accept **cash payments** on delivery. Please ensure exact change of **₹{grandTotal}** is ready at delivery coordinates.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                <div className="flex justify-between items-center select-none">
                  <button onClick={() => setCheckoutStep('review')} className="btn-secondary text-xs flex items-center gap-1">
                    <ArrowLeft size={13} /> Back to Review
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Right Column Sticky Summary details panel */}
          <aside className="bg-wht border border-bdr rounded-xl p-5.5 shadow-premium-md flex flex-col gap-0 sticky top-[90px]">
            <h4 className="text-[10px] font-bold text-mut uppercase tracking-widest mb-4 border-b border-bdrl pb-2 select-none">
              Checkout Ledger
            </h4>

            {/* Coupons section - Optional input */}
            <div className="pb-4 select-none">
              {activeCoupon ? (
                <div className="flex justify-between items-center bg-primary-soft/40 border border-primary/20 rounded-lg px-3 py-2 animate-scaleIn">
                  <div className="flex items-center gap-2">
                    <Gift size={13} className="text-primary" />
                    <div>
                      <p className="text-xs font-bold text-blk">{activeCoupon.code}</p>
                      <p className="text-[9px] text-primary font-semibold">{activeCoupon.discount}% discount active</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-xs text-mut hover:text-red font-bold font-mono focus:outline-none cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-mut uppercase">Promo Coupon <span className="text-[9px] text-mut/50 font-normal lowercase">(optional)</span></label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="E.g., CLEAN10"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                      className="input-field text-xs uppercase"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="btn-primary text-xs py-1.5 px-3.5 shrink-0 shadow-premium-sm"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-[9px] text-red font-semibold mt-0.5">{couponError}</p>}
                </div>
              )}
            </div>

            {/* Calculation breakdowns */}
            <div className="flex flex-col gap-2.5 border-t border-bdrl pt-4 select-none">
              <div className="flex justify-between text-xs text-mid">
                <span>Subtotal ({totalItemQty} items)</span>
                <span className="font-mono">₹{subtotal}</span>
              </div>
              
              {activeCoupon && (
                <div className="flex justify-between text-xs text-primary font-semibold">
                  <span>Coupon Discount ({activeCoupon.discount}%)</span>
                  <span className="font-mono">−₹{discountDeduction}</span>
                </div>
              )}

              <div className="flex justify-between text-xs text-mid">
                <span>GST Taxes (18%)</span>
                <span className="font-mono">₹{taxesGst}</span>
              </div>

              <div className="flex justify-between text-xs text-mid">
                <span>Shipment & Dispatch Fee</span>
                {shippingFee === 0 ? (
                  <span className="text-xs font-bold text-primary">FREE</span>
                ) : (
                  <span className="font-mono">₹{shippingFee}</span>
                )}
              </div>

              {shippingFee > 0 && deliveryMethod === 'standard' && (
                <p className="text-[9px] text-accent font-bold bg-accent-light/30 rounded p-2 mt-1 leading-normal">
                  🎁 Add ₹{499 - (subtotal - discountDeduction)} more for free delivery
                </p>
              )}
            </div>

            {/* Grand Total */}
            <div className="flex justify-between items-center text-sm font-bold text-blk border-t border-bdr mt-4 pt-4 select-none">
              <span>Grand Total</span>
              <span className="text-lg font-mono text-primary font-black">₹{grandTotal}</span>
            </div>

            {/* Dynamic Step Action Buttons placed in Sticky Sidebar for clean SaaS guidance */}
            {checkoutStep === 'cart' && (
              <button
                type="button"
                onClick={() => {
                  if (!curUser) {
                    showToast('Authentication required. Please sign in to proceed to address selection.');
                    openAuthModal('login');
                  } else {
                    setCheckoutStep('address');
                  }
                }}
                className="btn-primary-lg mt-5 w-full flex items-center justify-center gap-2 group cursor-pointer shadow-premium-sm"
              >
                {aloneProductId !== null ? 'Proceed to Buy This Alone' : 'Proceed to Address Selection'}
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {checkoutStep === 'address' && !addressFormOpen && (
              <button
                type="button"
                disabled={!selectedAddressId}
                onClick={() => setCheckoutStep('delivery')}
                className={`btn-primary-lg mt-5 w-full flex items-center justify-center gap-2 group cursor-pointer shadow-premium-sm ${
                  !selectedAddressId ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Deliver to this Address
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {checkoutStep === 'delivery' && (
              <button
                type="button"
                onClick={() => setCheckoutStep('review')}
                className="btn-primary-lg mt-5 w-full flex items-center justify-center gap-2 group cursor-pointer shadow-premium-sm"
              >
                Proceed to Order Review
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {checkoutStep === 'review' && (
              <button
                type="button"
                onClick={() => setCheckoutStep('payment')}
                className="btn-primary-lg mt-5 w-full flex items-center justify-center gap-2 group cursor-pointer shadow-premium-sm"
              >
                Proceed to Secure Payment
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {checkoutStep === 'payment' && (
              <button
                type="button"
                onClick={triggerPaymentSimulation}
                className="btn-primary-lg mt-5 w-full flex items-center justify-center gap-2 group cursor-pointer shadow-premium-sm animate-pulseRing"
              >
                <Lock size={13} /> Pay & Confirm Order
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            <div className="mt-5 flex flex-col gap-2.5 select-none border-t border-bdrl pt-4.5">
              {[
                { icon: Lock, text: 'Secure PCI-DSS compliant checkout' },
                { icon: Zap, text: 'Direct same-day formulation packaging' },
                { icon: ShieldCheck, text: 'Clean Everyday quality warranty coverage' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-[10px] text-mut font-medium">
                  <Icon size={12} className="text-primary shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </aside>

        </div>
      )}

      {/* ══════════════════ STEP 6: PAYMENT SECURE PROCESSING OVERLAY ══════════════════ */}
      {checkoutStep === 'processing' && (
        <div className="max-w-[480px] mx-auto text-center py-20 px-6 bg-wht border border-bdr rounded-2xl shadow-premium-xl select-none animate-scaleIn mt-10 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary/30 via-primary to-primary/30" />
          
          <div className="w-24 h-24 rounded-full bg-primary-soft/50 border border-primary/20 flex items-center justify-center mx-auto mb-8 relative animate-pulseRing">
            <Lock size={32} className="text-primary animate-float" />
          </div>

          <h3 className="font-display text-lg font-bold text-blk mb-2">Securing Transactions</h3>
          <p className="text-xs text-mut mb-6">Communicating with the payment gateway. Do not click refresh or page back triggers.</p>

          <div className="flex flex-col gap-3.5 max-w-[320px] mx-auto text-left border border-bdrl rounded-xl p-4 bg-sur/40 font-mono">
            {[
              'Establishing secure payment gateway handshake...',
              'Authenticating 3D-Secure transaction coordinates...',
              'Validating merchant accounts token...',
              'Confirming ledger allocation with banking hub...',
              'Securing final order details log...'
            ].map((stepDesc, idx) => {
              const isActive = idx === processingIndex;
              const isDone = idx < processingIndex;

              return (
                <div key={idx} className="flex items-center gap-2.5">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${
                    isDone ? 'bg-primary border-primary text-wht' : isActive ? 'border-primary text-primary animate-spin' : 'border-bdr text-transparent'
                  }`}>
                    {isDone ? (
                      <Check size={9} strokeWidth={4} />
                    ) : isActive ? (
                      <RefreshCw size={9} />
                    ) : null}
                  </div>
                  <span className={`text-[10px] font-bold ${
                    isDone ? 'text-mid font-semibold' : isActive ? 'text-primary font-black' : 'text-mut'
                  }`}>
                    {stepDesc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════ STEP 7: ORDER CONFIRMATION SUCCESS ══════════════════ */}
      {checkoutStep === 'success' && placedOrderSummary && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-5 bg-blk/60 backdrop-blur-md">
          {/* Confetti particles */}
          {Array.from({ length: 24 }).map((_, i) => (
            <ConfettiParticle key={i} index={i} />
          ))}

          <div className="bg-wht rounded-2xl shadow-premium-xl max-w-[500px] w-full p-8 text-center animate-scaleIn relative overflow-hidden border border-bdr">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary/30 via-primary to-primary/30" />
            
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-primary-soft border-4 border-primary/10 flex items-center justify-center animate-pulseRing">
                <svg width="40" height="40" viewBox="0 0 60 60" fill="none">
                  <circle cx="30" cy="30" r="28" stroke="var(--primary)" strokeWidth="3" opacity="0.15" />
                  <path d="M17 30 L25 38 L43 22" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="animate-checkmarkDraw" fill="none" />
                </svg>
              </div>
            </div>

            <span className="badge-tag bg-primary-soft text-primary px-3 py-1 mb-4 select-none">
              Transaction Secured
            </span>
            
            <h2 className="font-display text-2xl font-black text-blk mb-2">Purchase Placed successfully! 🎉</h2>
            <p className="text-xs text-mut mb-6 leading-relaxed">
              Your botanical household packaging orders have been registered. You can review details inside the profile dashboard.
            </p>

            <div className="flex flex-col gap-2.5 bg-sur/80 border border-bdrl rounded-xl p-4.5 mb-6 text-left text-xs">
              <div className="flex justify-between">
                <span className="text-mut font-semibold">Order ID Reference</span>
                <span className="font-mono font-bold text-blk">{placedOrderSummary.id}</span>
              </div>
              <div className="flex justify-between">
                {placedOrderSummary.method === 'COD' || placedOrderSummary.method === 'Cash on Delivery' ? (
                  <>
                    <span className="text-mut font-semibold">Payment Status</span>
                    <span className="font-mono font-bold text-blk">{placedOrderSummary.paymentStatus || 'Pending'}</span>
                  </>
                ) : (
                  <>
                    <span className="text-mut font-semibold">Transaction ID</span>
                    <span className="font-mono font-bold text-blk">{placedOrderSummary.transactionId}</span>
                  </>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-mut font-semibold">Grand Total Paid</span>
                <span className="font-mono font-bold text-primary">₹{placedOrderSummary.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mut font-semibold">Payment Mode</span>
                <span className="font-semibold text-mid">{placedOrderSummary.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mut font-semibold">Expected Arrival</span>
                <span className="font-semibold text-primary">{placedOrderSummary.expectedArrival || deliveryMethods[deliveryMethod].time}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setCheckoutStep('cart');
                  setCurPage('orders');
                }}
                className="btn-primary w-full py-3 flex items-center justify-center gap-1.5 shadow-premium-sm"
              >
                <CheckSquare size={14} /> View My Orders
              </button>
              
              <button
                onClick={() => {
                  setCheckoutStep('cart');
                  setCurPage('products');
                }}
                className="btn-secondary w-full py-3 flex items-center justify-center gap-1.5"
              >
                Continue Shopping <ArrowRight size={14} />
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
};

export default Checkout;
