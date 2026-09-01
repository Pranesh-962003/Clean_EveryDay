import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../../core/context/AppContext';
import {
  User as UserIcon,
  Camera,
  MapPin,
  Star,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Phone,
  Mail,
  Building,
  Home as HomeIcon,
  HelpCircle,
  X,
  Loader2
} from 'lucide-react';
import axios from 'axios';
// @ts-ignore
import { auth } from '../../../../firebase';
import type { User as UserType } from '../../../core/types';
import { getSocket } from '../../../core/socket/socket';
import { SOCKET_EVENTS } from '../../../core/socket/socketEvents';

interface SavedAddress {
  id: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: 'Home' | 'Work' | 'Other';
  isDefault: boolean;
}

type TabType = 'profile' | 'address' | 'reviews';

const Profile: React.FC = () => {
  const { curUser, updateProfile, reviews, products, logoutUser, setCurPage, showToast, fetchCurrentUser, setSelectedProductId } = useApp();

  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  
  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [defaultConfirmAddressId, setDefaultConfirmAddressId] = useState<string | null>(null);
  const [isUpdatingDefault, setIsUpdatingDefault] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [deleteConfirmAddressId, setDeleteConfirmAddressId] = useState<string | null>(null);
  const [isDeletingAddress, setIsDeletingAddress] = useState(false);
  const [deleteConfirmReviewId, setDeleteConfirmReviewId] = useState<string | null>(null);
  const [isDeletingReview, setIsDeletingReview] = useState(false);
  
  // Edit Profile Form state
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState<UserType['gender']>('Prefer not to say');
  
  // Address Form state
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrName, setAddrName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrAltPhone, setAddrAltPhone] = useState('');
  const [addrLine1, setAddrLine1] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [addrLandmark, setAddrLandmark] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrPin, setAddrPin] = useState('');
  const [addrType, setAddrType] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [addrIsDefault, setAddrIsDefault] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize profile edit state
  useEffect(() => {
    if (curUser) {
      setEditFirstName(curUser.firstName || '');
      setEditLastName(curUser.lastName || '');
      setEditPhone(curUser.phoneNumber || '');
      setEditDob(curUser.dateOfBirth ? curUser.dateOfBirth.substring(0, 10) : '');
      setEditGender(curUser.gender || 'Prefer not to say');
    }
  }, [curUser, isEditProfileOpen]);

  // Load and manage addresses from DB or LocalStorage
  useEffect(() => {
    if (curUser) {
      if ((curUser as any).addresses && Array.isArray((curUser as any).addresses) && (curUser as any).addresses.length > 0) {
        const mapped: SavedAddress[] = (curUser as any).addresses.map((item: any) => ({
          id: item._id || `addr_${Date.now()}`,
          name: item.fullName || curUser.name,
          phone: item.phoneNumber || curUser.phoneNumber,
          alternatePhone: item.alternatePhone || '',
          addressLine1: item.addressLine1 || '',
          addressLine2: item.addressLine2 || '',
          landmark: item.landmark || '',
          city: item.city || '',
          state: item.state || '',
          postalCode: item.postalCode || '',
          country: item.country || 'India',
          addressType: item.tag || 'Home',
          isDefault: item.isDefault || false
        }));
        setAddresses(mapped);
      } else {
        const dbAddr = curUser.address;
        if (dbAddr && (dbAddr.addressLine1 || dbAddr.city)) {
          const initialAddress: SavedAddress = {
            id: 'addr_default',
            name: curUser.name || 'Primary Recipient',
            phone: curUser.phoneNumber || '',
            addressLine1: dbAddr.addressLine1 || '',
            addressLine2: dbAddr.addressLine2 || '',
            city: dbAddr.city || '',
            state: dbAddr.state || '',
            postalCode: dbAddr.postalCode || '',
            country: dbAddr.country || 'India',
            addressType: 'Home',
            isDefault: true
          };
          setAddresses([initialAddress]);
        } else {
          setAddresses([]);
        }
      }
    }
  }, [curUser]);

  if (!curUser) {
    return (
      <div className="max-w-[480px] mx-auto text-center py-20 px-6 animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-sur border border-bdr flex items-center justify-center mx-auto mb-5 text-mut">
          <UserIcon size={24} />
        </div>
        <h2 className="font-display text-xl font-semibold mb-3">Please sign in</h2>
        <p className="text-sm text-mut mb-7">Authenticate to view your customer profile dashboard.</p>
        <button
          className="btn-primary"
          onClick={() => setCurPage('home')}
        >
          Go to Home
        </button>
      </div>
    );
  }

  const [myFetchedReviews, setMyFetchedReviews] = useState<any[]>([]);
  const [isReviewsFetched, setIsReviewsFetched] = useState<boolean>(false);

  // Fetch logged in user's reviews from http://localhost:5002/api/reviews/my-reviews
  useEffect(() => {
    const fetchUserReviews = async () => {
      if (!curUser) return;
      try {
        if (!auth.currentUser) {
          await auth.authStateReady();
        }
        const firebaseUser = auth.currentUser;
        let token = '';
        if (firebaseUser) {
          token = await firebaseUser.getIdToken();
        }

        const backendUrl = import.meta.env.VITE_BACKEND_URI || 'http://localhost:5002/api';
        const response = await axios.get(`${backendUrl}/reviews/my-reviews`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true
        });

        if (response.data && response.data.success && Array.isArray(response.data.reviews)) {
          setMyFetchedReviews(response.data.reviews);
          setIsReviewsFetched(true);
        }
      } catch (err) {
        console.error("Error fetching my-reviews:", err);
      }
    };

    fetchUserReviews();
  }, [curUser, activeTab]);

  // Real-time synchronization for review status updates
  useEffect(() => {
    const socket = getSocket();
    const handleStatusUpdate = (data: { review: any; status: string }) => {
      if (!data?.review) return;
      const updatedRev = data.review;
      setMyFetchedReviews((prev) =>
        prev.map((r) => {
          if (String(r._id || r.id) === String(updatedRev._id || updatedRev.id)) {
            return { ...r, ...updatedRev, status: data.status || updatedRev.status };
          }
          return r;
        })
      );
    };

    socket.on(SOCKET_EVENTS.REVIEW_STATUS_UPDATED, handleStatusUpdate);
    return () => {
      socket.off(SOCKET_EVENTS.REVIEW_STATUS_UPDATED, handleStatusUpdate);
    };
  }, []);

  // Combined user reviews list
  const displayReviews = isReviewsFetched 
    ? myFetchedReviews 
    : (myFetchedReviews.length > 0 
        ? myFetchedReviews 
        : reviews.filter(
            (r) => r.author?.toLowerCase() === curUser?.name?.toLowerCase() || 
                   r.author?.toLowerCase() === `${curUser?.firstName} ${curUser?.lastName}`.trim().toLowerCase()
          )
      );

  // Navigate to product detail when clicking a review
  const handleNavigateToProduct = (rev: any) => {
    let targetId = typeof rev.product === 'object' ? (rev.product._id || rev.product.id) : null;
    let targetTitle = typeof rev.product === 'object' && rev.product?.title 
      ? rev.product.title 
      : (typeof rev.product === 'string' ? rev.product : (rev.productName || ''));

    let foundProd = null;
    if (targetId) {
      foundProd = products.find(p => String(p._id) === String(targetId) || String(p.id) === String(targetId));
    }
    if (!foundProd && targetTitle) {
      foundProd = products.find(p => p.name.toLowerCase() === targetTitle.toLowerCase() || (p as any).title?.toLowerCase() === targetTitle.toLowerCase());
    }

    if (foundProd) {
      setSelectedProductId(foundProd.id || (foundProd as any)._id);
      setCurPage('product-detail');
    } else if (targetId) {
      setSelectedProductId(targetId);
      setCurPage('product-detail');
    } else {
      setCurPage('products');
    }
  };

  // Confirm and execute review deletion via API
  const confirmDeleteReview = async () => {
    if (!deleteConfirmReviewId) return;
    const revId = deleteConfirmReviewId;
    setIsDeletingReview(true);

    try {
      if (!auth.currentUser) {
        await auth.authStateReady();
      }
      const firebaseUser = auth.currentUser;
      let token = '';
      if (firebaseUser) {
        token = await firebaseUser.getIdToken();
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URI || 'http://localhost:5002/api';
      await axios.delete(`${backendUrl}/reviews/review-delete/${revId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true
      });

      // Update local reviews state
      setMyFetchedReviews(prev => prev.filter(r => String(r._id || r.id) !== String(revId)));
      showToast("Review deleted successfully.");
    } catch (err: any) {
      console.error("Error deleting review:", err);
      showToast(err.response?.data?.message || err.message || "Failed to delete review.");
    } finally {
      setIsDeletingReview(false);
      setDeleteConfirmReviewId(null);
    }
  };

  // Unread/new review ID-based tracking for badge
  const userKey = curUser ? ((curUser as any)._id || (curUser as any).uid || curUser.email || 'user') : 'guest';
  const seenIdsStorageKey = `seen_review_ids_${userKey}`;

  // Helper to get array of seen IDs from localStorage
  const [seenReviewIds, setSeenReviewIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(seenIdsStorageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // When activeTab becomes 'reviews', mark all current review IDs as seen
  useEffect(() => {
    if (!curUser || activeTab !== 'reviews' || displayReviews.length === 0) return;

    const currentIds = displayReviews.map((r: any) => String(r._id || r.id)).filter(Boolean);
    setSeenReviewIds((prev) => {
      const updatedSet = new Set([...prev, ...currentIds]);
      const updatedArr = Array.from(updatedSet);
      localStorage.setItem(seenIdsStorageKey, JSON.stringify(updatedArr));
      return updatedArr;
    });
  }, [activeTab, displayReviews, curUser, seenIdsStorageKey]);

  // Initial load: If first time user visits profile and seenIdsStorageKey doesn't exist, mark existing initial reviews as seen
  useEffect(() => {
    if (!curUser || displayReviews.length === 0) return;
    const raw = localStorage.getItem(seenIdsStorageKey);
    if (raw === null) {
      const initialIds = displayReviews.map((r: any) => String(r._id || r.id)).filter(Boolean);
      localStorage.setItem(seenIdsStorageKey, JSON.stringify(initialIds));
      setSeenReviewIds(initialIds);
    }
  }, [curUser, displayReviews, seenIdsStorageKey]);

  // Calculate unread/new review count for badge
  const unreadReviewsCount = activeTab === 'reviews' 
    ? 0 
    : displayReviews.filter((r: any) => {
        const idStr = String(r._id || r.id);
        return idStr && !seenReviewIds.includes(idStr);
      }).length;




  // Sync addresses list state and update backend if default changes
  const saveAddresses = (newList: SavedAddress[]) => {
    setAddresses(newList);
    
    // Sync default address to backend
    const defAddr = newList.find(a => a.isDefault);
    if (defAddr) {
      updateProfile({
        address: {
          addressLine1: defAddr.addressLine1,
          addressLine2: defAddr.addressLine2,
          city: defAddr.city,
          state: defAddr.state,
          postalCode: defAddr.postalCode,
          country: defAddr.country
        }
      });
    }
  };

  const handleEditProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: `${editFirstName} ${editLastName}`.trim() || curUser.name,
      firstName: editFirstName.trim(),
      lastName: editLastName.trim(),
      phoneNumber: editPhone.trim(),
      dateOfBirth: editDob,
      gender: editGender
    });
    setIsEditProfileOpen(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        updateProfile({
          avatar: reader.result as string
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Address logic handlers
  const openAddAddress = () => {
    setEditingAddressId(null);
    setAddrName(curUser.name || '');
    setAddrPhone(curUser.phoneNumber || '');
    setAddrAltPhone('');
    setAddrLine1('');
    setAddrLine2('');
    setAddrLandmark('');
    setAddrCity('');
    setAddrState('');
    setAddrPin('');
    setAddrType('Home');
    setAddrIsDefault(addresses.length === 0);
    setIsAddressModalOpen(true);
  };

  const openEditAddress = (addr: SavedAddress) => {
    setEditingAddressId(addr.id);
    setAddrName(addr.name);
    setAddrPhone(addr.phone);
    setAddrAltPhone(addr.alternatePhone || '');
    setAddrLine1(addr.addressLine1);
    setAddrLine2(addr.addressLine2 || '');
    setAddrLandmark(addr.landmark || '');
    setAddrCity(addr.city);
    setAddrState(addr.state);
    setAddrPin(addr.postalCode);
    setAddrType(addr.addressType);
    setAddrIsDefault(addr.isDefault);
    setIsAddressModalOpen(true);
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrName.trim() || !addrPhone.trim() || !addrLine1.trim() || !addrCity.trim() || !addrState.trim() || !addrPin.trim()) {
      alert("Please fill all mandatory fields.");
      return;
    }

    setIsSavingAddress(true);

    const payload = {
      tag: addrType || "Home",
      fullName: addrName.trim(),
      phoneNumber: addrPhone.trim(),
      alternatePhone: addrAltPhone.trim(),
      addressLine1: addrLine1.trim(),
      addressLine2: addrLine2.trim(),
      landmark: addrLandmark.trim(),
      city: addrCity.trim(),
      state: addrState.trim(),
      postalCode: addrPin.trim(),
      country: "India",
      isDefault: addrIsDefault || addresses.length === 0
    };

    try {
      if (!auth.currentUser) {
        await auth.authStateReady();
      }
      const firebaseUser = auth.currentUser;
      let token = '';
      if (firebaseUser) {
        token = await firebaseUser.getIdToken();
      }

      if (!token) {
        alert("Session expired or user not logged in. Please sign in again.");
        setIsSavingAddress(false);
        return;
      }

      let response;
      if (editingAddressId) {
        response = await axios.put(
          `${import.meta.env.VITE_BACKEND_URI}/users/address-update/${editingAddressId}`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true
          }
        );
      } else {
        response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URI}/users/address`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true
          }
        );
      }

      if (response.data && response.data.success) {
        if (fetchCurrentUser) {
          await fetchCurrentUser();
        } else {
          const dbAddresses = response.data.addresses || [];
          if (Array.isArray(dbAddresses) && dbAddresses.length > 0) {
            const mappedList: SavedAddress[] = dbAddresses.map((item: any) => ({
              id: item._id || `addr_${Date.now()}`,
              name: item.fullName || addrName.trim(),
              phone: item.phoneNumber || addrPhone.trim(),
              alternatePhone: item.alternatePhone || '',
              addressLine1: item.addressLine1,
              addressLine2: item.addressLine2 || '',
              landmark: item.landmark || '',
              city: item.city,
              state: item.state,
              postalCode: item.postalCode,
              country: item.country || 'India',
              addressType: item.tag || 'Home',
              isDefault: item.isDefault || false
            }));
            saveAddresses(mappedList);
          }
        }
        setIsAddressModalOpen(false);
      } else {
        alert(response.data?.message || "Failed to save address.");
      }
    } catch (error: any) {
      console.error("Error saving address to backend:", error);
      alert(error.response?.data?.message || "Failed to save address to server.");
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleSetDefaultAddress = (id: string) => {
    setDefaultConfirmAddressId(id);
  };

  const confirmSetDefaultAddress = async () => {
    if (!defaultConfirmAddressId) return;
    const addressId = defaultConfirmAddressId;
    setIsUpdatingDefault(true);

    try {
      if (!auth.currentUser) {
        await auth.authStateReady();
      }
      const firebaseUser = auth.currentUser;
      let token = '';
      if (firebaseUser) {
        token = await firebaseUser.getIdToken();
      }

      if (!token) {
        alert("Session expired or user not logged in.");
        setDefaultConfirmAddressId(null);
        return;
      }

      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URI}/users/address/default/${addressId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );

      if (response.data && response.data.success) {
        const dbAddresses = response.data.addresses || [];
        const mappedList: SavedAddress[] = dbAddresses.map((item: any) => ({
          id: item._id || `addr_${Date.now()}`,
          name: item.fullName || curUser.name,
          phone: item.phoneNumber || curUser.phoneNumber,
          alternatePhone: item.alternatePhone || '',
          addressLine1: item.addressLine1,
          addressLine2: item.addressLine2 || '',
          landmark: item.landmark || '',
          city: item.city,
          state: item.state,
          postalCode: item.postalCode,
          country: item.country || 'India',
          addressType: item.tag || 'Home',
          isDefault: item.isDefault || false
        }));
        saveAddresses(mappedList);
        if (fetchCurrentUser) {
          await fetchCurrentUser();
        }
        setDefaultConfirmAddressId(null);
      } else {
        alert(response.data?.message || "Failed to update default address.");
        setDefaultConfirmAddressId(null);
      }
    } catch (error: any) {
      console.error("Error setting default address:", error);
      alert(error.response?.data?.message || "Failed to update default address.");
      setDefaultConfirmAddressId(null);
    } finally {
      setIsUpdatingDefault(false);
    }
  };

  const handleDeleteAddress = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const addrToDelete = addresses.find(a => a.id === id);
    if (!addrToDelete) return;
    
    if (addrToDelete.isDefault && addresses.length > 1) {
      alert("Please mark another address as default before deleting this one.");
      return;
    }

    setDeleteConfirmAddressId(id);
  };

  const confirmDeleteAddress = async () => {
    if (!deleteConfirmAddressId) return;
    const addressId = deleteConfirmAddressId;
    setIsDeletingAddress(true);

    try {
      if (!auth.currentUser) {
        await auth.authStateReady();
      }
      const firebaseUser = auth.currentUser;
      let token = '';
      if (firebaseUser) {
        token = await firebaseUser.getIdToken();
      }

      if (!token) {
        alert("Session expired or user not logged in.");
        setDeleteConfirmAddressId(null);
        return;
      }

      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URI}/users/address-delete/${addressId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );

      if (response.data && response.data.success) {
        if (fetchCurrentUser) {
          await fetchCurrentUser();
        } else {
          const dbAddresses = response.data.addresses || [];
          const mappedList: SavedAddress[] = dbAddresses.map((item: any) => ({
            id: item._id || `addr_${Date.now()}`,
            name: item.fullName || curUser.name,
            phone: item.phoneNumber || curUser.phoneNumber,
            alternatePhone: item.alternatePhone || '',
            addressLine1: item.addressLine1,
            addressLine2: item.addressLine2 || '',
            landmark: item.landmark || '',
            city: item.city,
            state: item.state,
            postalCode: item.postalCode,
            country: item.country || 'India',
            addressType: item.tag || 'Home',
            isDefault: item.isDefault || false
          }));
          saveAddresses(mappedList);
        }
        setDeleteConfirmAddressId(null);
      } else {
        alert(response.data?.message || "Failed to delete address.");
        setDeleteConfirmAddressId(null);
      }
    } catch (error: any) {
      console.error("Error deleting address:", error);
      alert(error.response?.data?.message || "Failed to delete address.");
      setDeleteConfirmAddressId(null);
    } finally {
      setIsDeletingAddress(false);
    }
  };

  const handleLogoutConfirm = () => {
    logoutUser();
    setIsLogoutModalOpen(false);
    setCurPage('home');
  };

  // Find product thumbnail matching review
  const getProductImage = (prodName: string) => {
    const prod = products.find(p => p.name.toLowerCase() === prodName.toLowerCase());
    return prod?.imgs && prod.imgs.length > 0 ? prod.imgs[0] : null;
  };

  const defaultAddress = addresses.find(a => a.isDefault) || addresses[0];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24 select-none">
      
      {/* 2-Column Flipkart layout wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-7 items-start">
        
        {/* LEFT COLUMN - Sidebar Profile Navigation */}
        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-[90px] w-full">
          
          {/* User Meta Card */}
          <div className="bg-wht border border-bdr rounded-xl p-5 flex items-center gap-4 shadow-premium-sm">
            <div className="relative w-14 h-14 group cursor-pointer" onClick={handleAvatarClick}>
              <div className="w-full h-full rounded-full border-2 border-primary/20 bg-primary-soft text-primary font-bold text-lg flex items-center justify-center overflow-hidden">
                {curUser.avatar ? (
                  <img src={curUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  (curUser.firstName || curUser.name || "U").split(' ').map((w) => w[0]).join('').toUpperCase().substring(0, 2)
                )}
              </div>
              <div className="absolute inset-0 bg-blk/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Camera size={14} className="text-wht" />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            
            <div className="min-w-0">
              <span className="text-[10px] text-mut font-semibold uppercase tracking-wider block">Hello,</span>
              <h2 className="font-display font-bold text-blk truncate leading-tight text-[1rem]">
                {curUser.firstName ? `${curUser.firstName} ${curUser.lastName || ''}`.trim() : curUser.name}
              </h2>
              <span className="text-[10px] text-primary font-mono block mt-0.5 truncate">{curUser.email}</span>
            </div>
          </div>

          {/* Nav Items Panel */}
          <aside className="bg-wht border border-bdr rounded-xl shadow-premium-sm overflow-hidden flex flex-col divide-y divide-bdrl">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 px-5 py-4 text-xs uppercase font-bold tracking-wider transition-all cursor-pointer text-left border-none w-full outline-none ${
                activeTab === 'profile'
                  ? 'bg-primary text-wht font-semibold'
                  : 'text-mut hover:bg-sur hover:text-blk bg-transparent'
              }`}
            >
              <UserIcon size={14} />
              Profile Information
            </button>
            
            <button
              onClick={() => setActiveTab('address')}
              className={`flex items-center gap-3 px-5 py-4 text-xs uppercase font-bold tracking-wider transition-all cursor-pointer text-left border-none w-full outline-none ${
                activeTab === 'address'
                  ? 'bg-primary text-wht font-semibold'
                  : 'text-mut hover:bg-sur hover:text-blk bg-transparent'
              }`}
            >
              <MapPin size={14} />
              Manage Address
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex items-center justify-between px-5 py-4 text-xs uppercase font-bold tracking-wider transition-all cursor-pointer text-left border-none w-full outline-none ${
                activeTab === 'reviews'
                  ? 'bg-primary text-wht font-semibold'
                  : 'text-mut hover:bg-sur hover:text-blk bg-transparent'
              }`}
            >
              <span className="flex items-center gap-3">
                <Star size={14} />
                Reviews & Ratings
              </span>
              {unreadReviewsCount > 0 && (
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full font-mono ${
                  activeTab === 'reviews' ? 'bg-wht text-primary' : 'bg-primary-soft text-primary'
                }`}>
                  {unreadReviewsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="flex items-center gap-3 px-5 py-4 text-xs uppercase font-bold tracking-wider text-red hover:bg-red-bg transition-all cursor-pointer text-left border-none w-full outline-none bg-transparent"
            >
              <LogOut size={14} />
              Logout
            </button>
          </aside>
        </div>

        {/* RIGHT COLUMN - Tab Views */}
        <main className="lg:col-span-3 bg-wht border border-bdr rounded-xl p-6 sm:p-8 shadow-premium-sm min-h-[440px] animate-fadeIn">
          
          {/* TAB 1: Profile Information */}
          {activeTab === 'profile' && (
            <div className="animate-fadeIn space-y-8">
              <div className="flex justify-between items-center pb-4 border-b border-bdrl">
                <div>
                  <h2 className="font-display text-lg font-bold text-blk">Profile Information</h2>
                  <p className="text-xs text-mut mt-0.5">Manage your personal and contact details.</p>
                </div>
                <button
                  onClick={() => setIsEditProfileOpen(true)}
                  className="btn-secondary flex items-center gap-1.5 py-2 px-3 text-xs"
                >
                  <Edit2 size={12} /> Edit Details
                </button>
              </div>

              {/* Information Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Personal Information card */}
                <div className="border border-bdrl rounded-xl p-5 bg-sur/10 flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-primary font-bold text-[0.8rem] uppercase tracking-wider pb-2 border-b border-bdrl">
                    <UserIcon size={14} />
                    Personal Details
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-mut block mb-0.5 uppercase tracking-wide">First Name</span>
                      <span className="font-bold text-blk text-[0.85rem]">{curUser.firstName || <span className="text-fnt font-normal italic">Not set</span>}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-mut block mb-0.5 uppercase tracking-wide">Last Name</span>
                      <span className="font-bold text-blk text-[0.85rem]">{curUser.lastName || <span className="text-fnt font-normal italic">Not set</span>}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-mut block mb-0.5 uppercase tracking-wide">Gender</span>
                      <span className="font-bold text-blk text-[0.85rem]">{curUser.gender || 'Prefer not to say'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-mut block mb-0.5 uppercase tracking-wide">Date of Birth</span>
                      <span className="font-bold text-blk text-[0.85rem]">
                        {curUser.dateOfBirth ? new Date(curUser.dateOfBirth).toLocaleDateString(undefined, { dateStyle: 'medium' }) : <span className="text-fnt font-normal italic">Not set</span>}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information card */}
                <div className="border border-bdrl rounded-xl p-5 bg-sur/10 flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-primary font-bold text-[0.8rem] uppercase tracking-wider pb-2 border-b border-bdrl">
                    <Mail size={14} />
                    Contact Info
                  </div>
                  <div className="flex flex-col gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-mut block mb-0.5 uppercase tracking-wide">Email Address</span>
                      <span className="font-bold text-mid text-[0.85rem] font-mono">{curUser.email}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-mut block mb-0.5 uppercase tracking-wide">Phone Number</span>
                      <span className="font-bold text-blk text-[0.85rem] flex items-center gap-1.5">
                        <Phone size={12} className="text-mut" />
                        {curUser.phoneNumber || <span className="text-fnt font-normal italic">Not set</span>}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-mut block mb-0.5 uppercase tracking-wide">Member Since</span>
                      <span className="font-bold text-mut text-[0.8rem] flex items-center gap-1.5">
                        <Calendar size={12} />
                        {/* @ts-ignore */}
                        {curUser.createdAt ? new Date(curUser.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : "July 2026"}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Primary / default address card */}
              <div className="border border-bdrl rounded-xl p-5 bg-sur/10">
                <div className="flex justify-between items-center text-primary font-bold text-[0.8rem] uppercase tracking-wider pb-2 border-b border-bdrl mb-4">
                  <span className="flex items-center gap-2">
                    <MapPin size={14} />
                    Primary Address
                  </span>
                  {(defaultAddress || curUser.address?.addressLine1) && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-primary-soft text-primary font-mono uppercase">
                      {defaultAddress ? (defaultAddress.addressType || 'Default') : 'Primary'}
                    </span>
                  )}
                </div>
                {defaultAddress ? (
                  <div className="text-xs text-ink leading-relaxed space-y-1">
                    <p className="font-bold text-blk text-[0.85rem]">{defaultAddress.name}</p>
                    <p className="text-mut font-semibold flex items-center gap-1">
                      <Phone size={11} /> {defaultAddress.phone}
                    </p>
                    <p className="mt-1">{defaultAddress.addressLine1}</p>
                    {defaultAddress.addressLine2 && <p>{defaultAddress.addressLine2}</p>}
                    {defaultAddress.landmark && <p className="text-mut">Landmark: {defaultAddress.landmark}</p>}
                    <p className="font-semibold">
                      {defaultAddress.city}, {defaultAddress.state} - <span className="font-mono font-bold text-blk">{defaultAddress.postalCode}</span>
                    </p>
                    <p className="text-mut mt-1">{defaultAddress.country}</p>
                  </div>
                ) : curUser.address?.addressLine1 ? (
                  <div className="text-xs text-ink leading-relaxed">
                    <p className="font-semibold text-blk">{curUser.name}</p>
                    <p className="mt-1">{curUser.address.addressLine1}</p>
                    {curUser.address.addressLine2 && <p>{curUser.address.addressLine2}</p>}
                    <p>{curUser.address.city}, {curUser.address.state} - <span className="font-mono">{curUser.address.postalCode}</span></p>
                    <p className="text-mut mt-1">{curUser.address.country}</p>
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-mut italic">
                    No primary address configured. Go to "Manage Address" to save addresses.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: Manage Address */}
          {activeTab === 'address' && (
            <div className="animate-fadeIn space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-bdrl">
                <div>
                  <h2 className="font-display text-lg font-bold text-blk">Manage Address</h2>
                  <p className="text-xs text-mut mt-0.5">Add or update your delivery destinations.</p>
                </div>
                <button
                  onClick={openAddAddress}
                  className="btn-primary flex items-center gap-1.5 py-2 px-3 text-xs"
                >
                  <Plus size={14} /> Add Address
                </button>
              </div>

              {addresses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => !addr.isDefault && handleSetDefaultAddress(addr.id)}
                      className={`border rounded-xl p-5 relative transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-premium-md ${
                        addr.isDefault
                          ? 'border-primary bg-primary-soft/10 shadow-premium-sm'
                          : 'border-bdrl hover:border-mut bg-wht'
                      }`}
                    >
                      <div>
                        {/* Header badge */}
                        <div className="flex items-center justify-between mb-3.5">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            addr.addressType === 'Home'
                              ? 'bg-primary-soft text-primary'
                              : addr.addressType === 'Work'
                              ? 'bg-blue-50 text-blue-600 border border-blue-100'
                              : 'bg-sur text-mut border border-bdr'
                          }`}>
                            {addr.addressType === 'Home' && <HomeIcon size={9} />}
                            {addr.addressType === 'Work' && <Building size={9} />}
                            {addr.addressType === 'Other' && <HelpCircle size={9} />}
                            {addr.addressType}
                          </span>
                          
                          {addr.isDefault && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-accent-light text-accent-hover font-mono">
                              Default
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="text-xs space-y-1">
                          <p className="font-bold text-blk text-[0.85rem]">{addr.name}</p>
                          <p className="text-mut font-semibold flex items-center gap-1">
                            <Phone size={10} /> {addr.phone}
                          </p>
                          <p className="text-ink leading-relaxed pt-1.5">{addr.addressLine1}</p>
                          {addr.addressLine2 && <p className="text-ink leading-relaxed">{addr.addressLine2}</p>}
                          <p className="text-ink font-semibold">
                            {addr.city}, {addr.state} - <span className="font-mono font-bold text-blk">{addr.postalCode}</span>
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-3 mt-5 pt-3 border-t border-bdrl/60">
                        {!addr.isDefault && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSetDefaultAddress(addr.id); }}
                            className="text-[10px] font-bold text-primary hover:text-primary-hover bg-transparent border-none cursor-pointer outline-none uppercase tracking-wider"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditAddress(addr); }}
                          className="text-mut hover:text-ink w-7 h-7 rounded-full hover:bg-sur flex items-center justify-center cursor-pointer border-none bg-transparent"
                          title="Edit Address"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteAddress(addr.id, e)}
                          className="text-mut hover:text-red w-7 h-7 rounded-full hover:bg-red-bg flex items-center justify-center cursor-pointer border-none bg-transparent"
                          title="Delete Address"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Address Empty State */
                <div className="text-center py-16 px-6">
                  <div className="w-16 h-16 rounded-full bg-primary-soft border border-primary-light flex items-center justify-center mx-auto mb-5 text-primary/50">
                    <MapPin size={24} />
                  </div>
                  <h3 className="font-display font-semibold text-blk mb-2">No addresses saved</h3>
                  <p className="text-xs text-mut max-w-sm mx-auto mb-6">Create saved addresses to fast-track checkout transactions next time.</p>
                  <button onClick={openAddAddress} className="btn-primary py-2 px-4 text-xs font-bold uppercase tracking-wider">
                    Add Address Now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Reviews & Ratings */}
          {activeTab === 'reviews' && (
            <div className="animate-fadeIn space-y-6">
              <div className="pb-4 border-b border-bdrl">
                <h2 className="font-display text-lg font-bold text-blk">My Reviews & Ratings</h2>
                <p className="text-xs text-mut mt-0.5">Feedback and ratings you've shared on formulations.</p>
              </div>

              {displayReviews.length > 0 ? (
                <div className="space-y-4">
                  {displayReviews.map((rev: any) => {
                    const prodTitle = typeof rev.product === 'object' && rev.product?.title ? rev.product.title : (typeof rev.product === 'string' ? rev.product : (rev.productName || 'Product'));
                    const img = (typeof rev.product === 'object' && rev.product?.images?.length > 0) ? rev.product.images[0].url : getProductImage(prodTitle);
                    const revDate = rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : (rev.date || 'Jul 19, 2026');
                    const revRating = Number(rev.rating) || 5;
                    const revBody = rev.review || rev.comment || rev.body || '';
                    const revReply = rev.reply || rev.adminReply || '';
                    const revId = rev._id || rev.id;

                    return (
                      <div
                        key={revId}
                        onClick={() => handleNavigateToProduct(rev)}
                        className="border border-bdrl rounded-xl p-5 hover:border-primary/40 hover:shadow-sm transition-all flex flex-col sm:flex-row gap-5 items-start bg-sur/10 cursor-pointer"
                      >
                        {/* Product Thumbnail */}
                        <div className="w-16 h-16 rounded-lg border border-bdrl bg-wht flex items-center justify-center shrink-0 overflow-hidden select-none">
                          {img ? (
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary-soft flex items-center justify-center text-primary font-bold text-xs select-none">CE</div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                            <h4 className="font-bold text-blk text-[0.85rem] leading-tight truncate hover:text-primary transition-colors">{prodTitle}</h4>
                            <span className="text-[10px] text-mut font-mono shrink-0">{revDate}</span>
                          </div>

                          {/* Star rating block */}
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                className={i < revRating ? "fill-gold text-gold" : "text-fnt"}
                              />
                            ))}
                          </div>

                          {/* Review Body */}
                          <p className="text-xs text-ink leading-relaxed break-words">{revBody}</p>

                          {/* Admin Reply */}
                          {revReply && (
                            <div className="bg-wht border border-bdrl rounded-lg p-3.5 mt-2.5 text-[0.72rem] leading-relaxed relative">
                              <div className="absolute top-3 left-4 w-1.5 h-1.5 bg-accent rounded-full shrink-0" />
                              <p className="font-bold text-blk pl-3.5">Replied by Clean Everyday Support:</p>
                              <p className="text-mut mt-1 pl-3.5 italic">"{revReply}"</p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="self-end sm:self-start shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmReviewId(String(revId));
                            }}
                            className="text-mut hover:text-red hover:bg-red-bg p-2 rounded-full cursor-pointer transition-colors border-none bg-transparent"
                            title="Delete Review"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Reviews Empty State */
                <div className="text-center py-16 px-6">
                  <div className="w-16 h-16 rounded-full bg-primary-soft border border-primary-light flex items-center justify-center mx-auto mb-5 text-primary/50">
                    <Star size={24} />
                  </div>
                  <h3 className="font-display font-semibold text-blk mb-2">No reviews written</h3>
                  <p className="text-xs text-mut max-w-sm mx-auto mb-6">Let other customers know about your experience. Share your thoughts on our formulations.</p>
                  <button onClick={() => setCurPage('products')} className="btn-primary py-2 px-4 text-xs font-bold uppercase tracking-wider">
                    Browse Products
                  </button>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* MODAL 1: Edit Profile Modal Overlay */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 bg-blk/60 backdrop-blur-md z-[9990] flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-wht rounded-2xl w-full max-w-[500px] shadow-premium-xl relative border border-bdrl overflow-hidden my-auto animate-slideUp">
            <button
              className="absolute top-5 right-5 w-8 h-8 rounded-full border border-bdrl flex items-center justify-center text-mut hover:bg-sur hover:text-ink transition-colors cursor-pointer bg-transparent"
              onClick={() => setIsEditProfileOpen(false)}
            >
              <X size={15} />
            </button>
            <div className="p-6 sm:p-8">
              <h3 className="font-display text-xl font-bold text-blk mb-1.5">Edit Profile Info</h3>
              <p className="text-xs text-mut mb-6">Update your basic details for shipping and personalization.</p>
              
              <form onSubmit={handleEditProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 text-xs font-bold text-mut">
                    <label>First Name</label>
                    <input
                      type="text"
                      className="input-field mt-1"
                      required
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs font-bold text-mut">
                    <label>Last Name</label>
                    <input
                      type="text"
                      className="input-field mt-1"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-xs font-bold text-mut">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    className="input-field mt-1"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1 text-xs font-bold text-mut">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    className="input-field mt-1"
                    value={editDob}
                    onChange={(e) => setEditDob(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1 text-xs font-bold text-mut">
                  <label>Gender</label>
                  <select
                    className="select-field mt-1"
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value as any)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-bdrl mt-6">
                  <button type="submit" className="btn-primary py-2 px-4 text-xs font-bold uppercase tracking-wider">
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditProfileOpen(false)}
                    className="btn-secondary py-2 px-4 text-xs font-bold uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Add/Edit Address Modal Overlay */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 bg-blk/60 backdrop-blur-md z-[9990] flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-wht rounded-2xl w-full max-w-[540px] shadow-premium-xl relative border border-bdrl overflow-hidden my-auto animate-slideUp">
            <button
              className="absolute top-5 right-5 w-8 h-8 rounded-full border border-bdrl flex items-center justify-center text-mut hover:bg-sur hover:text-ink transition-colors cursor-pointer bg-transparent"
              onClick={() => setIsAddressModalOpen(false)}
            >
              <X size={15} />
            </button>
            
            <div className="p-6 sm:p-8">
              <h3 className="font-display text-xl font-bold text-blk mb-1.5">
                {editingAddressId ? "Edit Address" : "Add Address"}
              </h3>
              <p className="text-xs text-mut mb-6">Enter details for parcel deliveries and tracking updates.</p>

              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 text-xs font-bold text-mut">
                    <label>Recipient Name <span className="text-red font-mono">*</span></label>
                    <input
                      type="text"
                      className="input-field mt-1"
                      required
                      placeholder="e.g. John Doe"
                      value={addrName}
                      onChange={(e) => setAddrName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs font-bold text-mut">
                    <label>Phone Number <span className="text-red font-mono">*</span></label>
                    <input
                      type="tel"
                      className="input-field mt-1"
                      required
                      placeholder="10-digit number"
                      value={addrPhone}
                      onChange={(e) => setAddrPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-xs font-bold text-mut">
                  <label>Address Line 1 <span className="text-red font-mono">*</span></label>
                  <input
                    type="text"
                    className="input-field mt-1"
                    required
                    placeholder="House/Apt No., Building Name, Street"
                    value={addrLine1}
                    onChange={(e) => setAddrLine1(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 text-xs font-bold text-mut">
                    <label>Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      className="input-field mt-1"
                      placeholder="Area, Colony"
                      value={addrLine2}
                      onChange={(e) => setAddrLine2(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs font-bold text-mut">
                    <label>Landmark (Optional)</label>
                    <input
                      type="text"
                      className="input-field mt-1"
                      placeholder="Near Bus Stand backside"
                      value={addrLandmark}
                      onChange={(e) => setAddrLandmark(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-xs font-bold text-mut">
                  <label>Alternate Phone (Optional)</label>
                  <input
                    type="tel"
                    className="input-field mt-1"
                    placeholder="Alternate phone number"
                    value={addrAltPhone}
                    onChange={(e) => setAddrAltPhone(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1 text-xs font-bold text-mut">
                    <label>City <span className="text-red font-mono">*</span></label>
                    <input
                      type="text"
                      className="input-field mt-1"
                      required
                      value={addrCity}
                      onChange={(e) => setAddrCity(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs font-bold text-mut">
                    <label>State <span className="text-red font-mono">*</span></label>
                    <input
                      type="text"
                      className="input-field mt-1"
                      required
                      value={addrState}
                      onChange={(e) => setAddrState(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs font-bold text-mut">
                    <label>PIN Code <span className="text-red font-mono">*</span></label>
                    <input
                      type="text"
                      className="input-field mt-1"
                      required
                      placeholder="6 digits"
                      value={addrPin}
                      onChange={(e) => setAddrPin(e.target.value)}
                    />
                  </div>
                </div>

                {/* Type & Default controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 border-t border-bdrl mt-6">
                  <div className="flex flex-col gap-1 text-xs font-bold text-mut">
                    <label>Address Type</label>
                    <div className="flex gap-2 mt-1.5">
                      {(['Home', 'Work', 'Other'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setAddrType(type)}
                          className={`py-1.5 px-4 text-xs font-bold rounded-lg border cursor-pointer outline-none transition-colors ${
                            addrType === type
                              ? 'bg-primary text-wht border-primary shadow-premium-sm font-semibold'
                              : 'bg-wht border-bdr text-mut hover:border-mut'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {addresses.length > 0 && (
                    <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer self-end select-none">
                      <input
                        type="checkbox"
                        checked={addrIsDefault}
                        disabled={addresses.length === 1 && editingAddressId === addresses[0].id}
                        onChange={(e) => setAddrIsDefault(e.target.checked)}
                        className="rounded border-bdr text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                      />
                      Set as Default Address
                    </label>
                  )}
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-bdrl mt-6">
                  <button
                    type="submit"
                    disabled={isSavingAddress}
                    className="btn-primary py-2 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                  >
                    {isSavingAddress ? (
                      <>
                        <Loader2 size={14} className="animate-spin text-wht" />
                        <span>Saving...</span>
                      </>
                    ) : editingAddressId ? (
                      "Save Changes"
                    ) : (
                      "Save Address"
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={isSavingAddress}
                    onClick={() => setIsAddressModalOpen(false)}
                    className="btn-secondary py-2 px-4 text-xs font-bold uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Logout Confirmation Modal Overlay */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-blk/60 backdrop-blur-md z-[9990] flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-wht rounded-2xl w-full max-w-[400px] shadow-premium-xl relative border border-bdrl overflow-hidden my-auto animate-slideUp">
            <div className="p-6 sm:p-8 text-center select-none">
              <div className="w-12 h-12 bg-red-bg border border-red/10 text-red rounded-full flex items-center justify-center mx-auto mb-4 animate-bounceIn">
                <LogOut size={20} />
              </div>
              <h3 className="font-display text-lg font-bold text-blk mb-2">Logout</h3>
              <p className="text-xs text-mut leading-relaxed mb-6">Are you sure you want to logout from your account?</p>
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleLogoutConfirm}
                  className="bg-red hover:bg-red/90 text-wht rounded-lg py-2.5 px-6 text-xs font-bold cursor-pointer transition-all duration-150 uppercase tracking-wider border-none"
                >
                  Logout
                </button>
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="btn-secondary py-2.5 px-6 text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Set Default Address Confirmation Modal Overlay */}
      {defaultConfirmAddressId && (
        <div className="fixed inset-0 bg-blk/60 backdrop-blur-md z-[9990] flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-wht rounded-2xl w-full max-w-[420px] shadow-premium-xl relative border border-bdrl overflow-hidden my-auto animate-slideUp">
            <div className="p-6 sm:p-8 text-center select-none">
              {isUpdatingDefault ? (
                <div className="py-6 flex flex-col items-center justify-center">
                  <Loader2 size={38} className="text-primary animate-spin mb-3" />
                  <h4 className="font-display text-sm font-bold text-blk">Updating Default Address...</h4>
                  <p className="text-xs text-mut mt-1">Please wait while your address preference is saved.</p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 bg-primary-soft border border-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin size={22} />
                  </div>
                  <h3 className="font-display text-lg font-bold text-blk mb-2">Set Default Address</h3>
                  <p className="text-xs text-mut leading-relaxed mb-6">
                    Are you sure you want to select this as ur default address?
                  </p>
                  
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={confirmSetDefaultAddress}
                      className="btn-primary py-2.5 px-6 text-xs font-bold uppercase tracking-wider"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setDefaultConfirmAddressId(null)}
                      className="btn-secondary py-2.5 px-6 text-xs font-bold uppercase tracking-wider"
                    >
                      No
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Delete Address Confirmation Modal Overlay */}
      {deleteConfirmAddressId && (
        <div className="fixed inset-0 bg-blk/60 backdrop-blur-md z-[9990] flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-wht rounded-2xl w-full max-w-[420px] shadow-premium-xl relative border border-bdrl overflow-hidden my-auto animate-slideUp">
            <div className="p-6 sm:p-8 text-center select-none">
              {isDeletingAddress ? (
                <div className="py-6 flex flex-col items-center justify-center">
                  <Loader2 size={38} className="text-red animate-spin mb-3" />
                  <h4 className="font-display text-sm font-bold text-blk">Deleting Address...</h4>
                  <p className="text-xs text-mut mt-1">Please wait while your address is being deleted.</p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 bg-red-bg border border-red/10 text-red rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 size={22} />
                  </div>
                  <h3 className="font-display text-lg font-bold text-blk mb-2">Delete Address</h3>
                  <p className="text-xs text-mut leading-relaxed mb-6">
                    Are you sure you want to delete this address?
                  </p>
                  
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={confirmDeleteAddress}
                      className="bg-red hover:bg-red-hover text-wht font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer border-none"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setDeleteConfirmAddressId(null)}
                      className="btn-secondary py-2.5 px-6 text-xs font-bold uppercase tracking-wider"
                    >
                      No
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Delete Review Confirmation Modal Overlay */}
      {deleteConfirmReviewId && (
        <div className="fixed inset-0 bg-blk/60 backdrop-blur-md z-[9990] flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-wht rounded-2xl w-full max-w-[420px] shadow-premium-xl relative border border-bdrl overflow-hidden my-auto animate-slideUp">
            <div className="p-6 sm:p-8 text-center select-none">
              {isDeletingReview ? (
                <div className="py-6 flex flex-col items-center justify-center">
                  <Loader2 size={38} className="text-red animate-spin mb-3" />
                  <h4 className="font-display text-sm font-bold text-blk">Deleting Review...</h4>
                  <p className="text-xs text-mut mt-1">Please wait while your review is being deleted.</p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 bg-red-bg border border-red/10 text-red rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 size={22} />
                  </div>
                  <h3 className="font-display text-lg font-bold text-blk mb-2">Delete Review</h3>
                  <p className="text-xs text-mut leading-relaxed mb-6">
                    Are you sure you want to delete this review?
                  </p>
                  
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={confirmDeleteReview}
                      className="bg-red hover:bg-red-hover text-wht font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer border-none"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setDeleteConfirmReviewId(null)}
                      className="btn-secondary py-2.5 px-6 text-xs font-bold uppercase tracking-wider"
                    >
                      No
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
