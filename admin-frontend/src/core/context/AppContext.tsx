import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import type { Product, Review, User, Lead, Banner, CartItem, Order, Staff, LeadActivity } from '../types';
// @ts-ignore
import { auth } from '../../../firebase';

interface AppContextType {
  products: Product[];
  reviews: Review[];
  users: User[];
  leads: Lead[];
  banners: Banner[];
  staff: Staff[];
  curUser: User | null;
  isAuthLoading: boolean;
  curPage: string;
  curFilter: string;
  searchQuery: string;
  toastMessage: string | null;
  selectedProductId: number | null;
  authModalOpen: boolean;
  authModalTab: 'login' | 'signup';
  setCurPage: (page: string) => void;
  setCurFilter: (filter: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedProductId: (id: number | null) => void;
  openAuthModal: (tab?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  loginUser: (email: string, pass: string) => { success: boolean; message: string };
  registerUser: (name: string, email: string, pass: string) => { success: boolean; message: string };
  logoutUser: () => void;
  addProduct: (product: Omit<Product, 'id' | 'rating' | 'reviewCount'>) => Promise<boolean>;
  updateProductImages: (id: number, updatedImgs: string[]) => void;
  deleteProduct: (id: number) => Promise<boolean>;
  duplicateProduct: (id: number) => void;
  submitReview: (authorName: string, rating: number, body: string, productName: string) => void;
  approveReview: (id: number) => void;
  deleteReview: (id: number) => void;
  updateReviewStatus: (id: number, status: NonNullable<Review['status']>) => void;
  replyToReview: (id: number, replyText: string) => void;
  addLead: (
    name: string,
    email: string,
    phoneOrSubject: string,
    companyOrService?: string,
    sourceOrMessage?: string,
    subject?: string,
    service?: string,
    message?: string,
    priority?: Lead['priority']
  ) => void;
  updateLeadStatus: (id: number, status: Lead['status']) => void;
  updateLeadNotes: (id: number, notes: string) => void;
  addLeadComment: (id: number, author: string, body: string) => void;
  addLeadTask: (id: number, title: string) => void;
  toggleLeadTask: (id: number, taskId: string) => void;
  addLeadReminder: (id: number, title: string, date: string) => void;
  addLeadActivity: (id: number, type: LeadActivity['type'], title: string, content: string) => void;
  updateBanners: (banners: Banner[]) => void;
  showToast: (msg: string) => void;
  updateProduct: (product: Product, localDeletedImagePublicIds?: string[]) => Promise<boolean>;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  updateOrderDetails: (id: string, details: Partial<Order>) => void;
  addOrderTimelineEvent: (id: string, status: string, notes?: string) => void;
  
  // Shopping Cart & Checkout States
  cart: CartItem[];
  orders: Order[];
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQty: (productId: number, qty: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  placeOrder: (address: Order['address'], paymentMethod: string, customerNotes?: string) => void;

  // Staff Account Settings
  inviteStaff: (name: string, email: string, role: Staff['role']) => void;
  updateStaffStatus: (id: string, status: Staff['status']) => void;
  resetStaffPassword: (id: string) => void;
  deleteStaff: (id: string) => void;

  // Global Invoice Overlay State
  invoiceOrder: Order | null;
  setInvoiceOrder: (order: Order | null) => void;
  fetchCurrentUser: (preFetchedUser?: User) => Promise<void>;
  updateProfile: (updatedUser: Partial<User>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEF_PRODS: Product[] = [
  {
    id: 1,
    name: 'Fresh Floor Cleaner',
    cat: 'Floor Care',
    desc: 'A natural, plant-based floor cleaner suitable for marble, tiles, and wood. Just one cap in half a bucket of water leaves your floors shiny, streak-free, and clean with a mild eucalyptus fragrance.',
    tags: ['Safe for kids & pets', 'Streak-free shine', 'Natural fragrance', 'All Hard Floors'],
    badge: 'Bestseller',
    imgs: [],
    price: 299,
    sku: 'CE-FL-01',
    brand: 'Clean Everyday',
    discount: 10,
    stock: 45,
    status: 'Active',
    createdDate: '2026-05-12',
    specs: {
      Size: '500 ml / 1 L / 5 L',
      Usage: '1 cap in half a bucket of water',
      Fragrance: 'Eucalyptus & Tea Tree',
      Suitable: 'All hard floors (marble, wood, tiles)',
      pH: '7.0',
      Dilution: '1:50'
    },
    rating: 4.8,
    reviewCount: 124
  },
  {
    id: 2,
    name: 'Gentle Dishwashing Liquid',
    cat: 'Dish Care',
    desc: 'A powerful dishwashing liquid that cuts grease and food residues from all pots and pans. Infused with natural aloe vera, it is very gentle on hands and keeps them soft even after long washes.',
    tags: ['Aloe Vera Infused', 'Cuts grease easily', 'Soft on hands', 'Concentrated formula'],
    badge: null,
    imgs: [],
    price: 199,
    sku: 'CE-DH-02',
    brand: 'Clean Everyday',
    discount: 0,
    stock: 5,
    status: 'Active',
    createdDate: '2026-05-20',
    specs: {
      Size: '500 ml / 1 L',
      Usage: 'A few drops on a wet sponge',
      Fragrance: 'Natural Citrus',
      Suitable: 'All cooking utensils and plates',
      pH: '6.5',
      Dilution: 'Ready to use'
    },
    rating: 4.6,
    reviewCount: 87
  },
  {
    id: 3,
    name: 'Safe Laundry Wash',
    cat: 'Laundry Care',
    desc: 'A gentle laundry wash that removes dirt and stains while protecting fabric colors and fibers. Safe for both top-load and front-load washing machines, and suitable for all types of clothing.',
    tags: ['Protects colors', 'Removes tough stains', 'Machine & hand wash', 'Clean scent'],
    badge: 'New',
    imgs: [],
    price: 349,
    sku: 'CE-LD-03',
    brand: 'Clean Everyday',
    discount: 5,
    stock: 120,
    status: 'Active',
    createdDate: '2026-06-01',
    specs: {
      Size: '1 L / 3 L Refill',
      Usage: '1 cap for a normal load',
      Fragrance: 'Fresh Linen',
      Suitable: 'All washing machines and hand wash',
      pH: '7.5',
      Dilution: 'Ready to use'
    },
    rating: 4.7,
    reviewCount: 62
  },
  {
    id: 4,
    name: 'Kitchen Surface Sanitizer',
    cat: 'Dish Care',
    desc: 'A food-safe kitchen surface spray for cleaning countertops, dining tables, cutting boards, and kitchen tiles. Cleans effectively without leaving chemical residues or toxic fumes, making it safe for food preparation areas.',
    tags: ['Food-contact safe', 'No rinsing needed', 'Clean kitchen surfaces', 'Ready to use'],
    badge: null,
    imgs: [],
    price: 249,
    sku: 'CE-DH-04',
    brand: 'Clean Everyday',
    discount: 15,
    stock: 2,
    status: 'Active',
    createdDate: '2026-06-18',
    specs: {
      Size: '500 ml Spray',
      Usage: 'Spray and wipe with a clean cloth',
      Fragrance: 'Green Lime',
      Suitable: 'All kitchen countertops and tables',
      pH: '6.8',
      Dilution: 'Ready to use'
    },
    rating: 4.5,
    reviewCount: 43
  }
];

const DEF_REVS: Review[] = [
  {
    id: 1,
    author: 'Priya Mehta',
    ini: 'PM',
    role: 'Mumbai, Home User',
    img: null,
    rating: 5,
    body: 'I have tried many floor cleaners over the years. This floor concentrate is the first one that really works — my marble floors look clean and shiny, and there is no strong chemical smell.',
    product: 'Fresh Floor Cleaner',
    approved: true,
    status: 'Approved',
    date: 'Mar 2026'
  },
  {
    id: 2,
    author: 'Rajan Tiwari',
    ini: 'RT',
    role: 'Pune, Restaurant Owner',
    img: null,
    rating: 5,
    body: 'We transitioned our entire café to Clean Everyday for all dish washing and surface cleaning. The grease-cutting on our cookware is extraordinary, and our kitchen staff have commented that their hands are in markedly better condition since switching.',
    product: 'Gentle Dishwashing Liquid',
    approved: true,
    status: 'Approved',
    date: 'Apr 2026'
  },
  {
    id: 3,
    author: 'Sneha Krishnan',
    ini: 'SK',
    role: 'Bangalore, Parent',
    img: null,
    rating: 5,
    body: 'With two young children and a dog, the safety of every cleaning product in our home is non-negotiable. Clean Everyday is the first brand I have trusted without reservation. The ingredients are simple, the performance is real, and there are no unpleasant chemical odours.',
    product: 'Fresh Floor Cleaner',
    approved: true,
    status: 'Approved',
    date: 'May 2026'
  }
];

const DEF_USERS: User[] = [
  {
    name: 'Admin User',
    email: 'admin@cleaneveryday.in',
    password: 'admin123',
    isAdmin: true
  },
  {
    name: 'Global Customer',
    email: 'customer@cleaneveryday.in',
    password: 'customer123',
    isAdmin: false
  }
];

const DEF_LEADS: Lead[] = [
  {
    id: 1,
    name: 'Priya Sharma',
    email: 'priya.sharma@gmail.com',
    phone: '+91 98112 34567',
    company: 'Sharma Garments',
    source: 'Google Search',
    subject: 'Wholesale inquiry for floor care products',
    service: 'Floor Care',
    message: 'Hi, I am looking to purchase the Fresh Floor Cleaner in bulk (5L) for our office premises. Do you offer commercial discounts?',
    status: 'New',
    priority: 'High',
    assignedTo: 'Rahul Sen',
    followUpDate: '2026-07-10',
    date: '12 Jun 2026',
    internalNotes: 'Awaiting pricing sheet approval.',
    attachments: [],
    activities: [
      { type: 'Note', title: 'Lead created', content: 'Inquiry received via web form', date: '2026-06-12 10:14' }
    ],
    tasks: [
      { id: 't1', title: 'Prepare commercial proposal', done: false, date: '2026-07-09' }
    ],
    reminders: [],
    comments: []
  },
  {
    id: 2,
    name: 'Amit Verma',
    email: 'amit.verma@outlook.com',
    phone: '+91 99887 76655',
    company: 'Verma Tech Solutions',
    source: 'Reference',
    subject: 'Eco laundry liquid questions',
    service: 'Laundry Care',
    message: 'Hello, is the Safe Laundry Wash safe for silk and delicate woolen garments? Let me know.',
    status: 'Contacted',
    priority: 'Medium',
    assignedTo: 'Nisha Patil',
    followUpDate: '2026-07-15',
    date: '20 Jun 2026',
    internalNotes: 'Sent fabric safety details email.',
    attachments: [],
    activities: [
      { type: 'Note', title: 'Lead created', content: 'Inquiry received via web form', date: '2026-06-20 14:02' },
      { type: 'Email', title: 'Fabric safety details sent', content: 'Emailed user details on pH levels and fabric testing guidelines.', date: '2026-06-21 09:45' }
    ],
    tasks: [
      { id: 't2', title: 'Send follow up email', done: true, date: '2026-06-25' }
    ],
    reminders: [],
    comments: []
  }
];

const DEF_BANNERS: Banner[] = Array.from({ length: 4 }, (_, i) => ({
  img: null,
  mobileImg: null,
  label: `Banner ${i + 1}`,
  title: 'Organic Cleaning Solutions',
  subtitle: 'Clean living, organic ingredients, safe spaces',
  ctaText: 'Explore Now',
  ctaLink: 'products',
  displayOrder: i + 1,
  isActive: true
}));

const DEF_STAFF: Staff[] = [
  { id: 'ST-001', name: 'Alok Sharma', email: 'alok@cleaneveryday.in', role: 'Super Admin', status: 'Active', lastLogin: '2026-07-06 18:30' },
  { id: 'ST-002', name: 'Nisha Patil', email: 'nisha@cleaneveryday.in', role: 'Manager', status: 'Active', lastLogin: '2026-07-07 08:15' },
  { id: 'ST-003', name: 'Rahul Sen', email: 'rahul@cleaneveryday.in', role: 'Sales', status: 'Active', lastLogin: '2026-07-05 14:22' },
  { id: 'ST-004', name: 'Pooja Iyer', email: 'pooja@cleaneveryday.in', role: 'Support', status: 'Inactive', lastLogin: '2026-06-30 11:05' }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Purge any existing legacy localStorage keys from browser
  useEffect(() => {
    try {
      localStorage.clear();
    } catch (e) {
      // Ignore
    }
  }, []);

  const [products, setProducts] = useState<Product[]>(DEF_PRODS);
  const [reviews, setReviews] = useState<Review[]>(DEF_REVS);
  const [users, setUsers] = useState<User[]>(DEF_USERS);
  const [leads, setLeads] = useState<Lead[]>(DEF_LEADS);
  const [banners, setBanners] = useState<Banner[]>(DEF_BANNERS);
  const [staff, setStaff] = useState<Staff[]>(DEF_STAFF);
  const [curUser, setCurUser] = useState<User | null>(null);

  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  const [curPage, setCurPage] = useState<string>('home');
  const [curFilter, setCurFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup'>('login');
  
  // Global Invoice Modal overlay state
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  // Shopping Cart & Orders state init
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchCurrentUser = async (preFetchedUser?: User) => {
    setIsAuthLoading(true);
    if (preFetchedUser) {
      if (preFetchedUser.photoURL) {
        preFetchedUser.avatar = preFetchedUser.photoURL;
      }
      if (preFetchedUser.isAdmin) {
        setCurUser(preFetchedUser);
        setIsAuthLoading(false);
        return;
      }
    }
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URI;
      let response;
      if (backendUrl) {
        try {
          response = await axios.get(`${backendUrl}/auth/me`, { withCredentials: true });
        } catch {
          response = await axios.get(`${backendUrl}/users/current-user`, { withCredentials: true });
        }
      }
      if (response && response.data && response.data.success && response.data.user) {
        const dbUser = response.data.user;
        if (dbUser.photoURL) {
          dbUser.avatar = dbUser.photoURL;
        }
        setCurUser(dbUser);
      } else {
        const savedUserStr = localStorage.getItem('ce_cur_user');
        const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
        setCurUser(savedUser);
      }
    } catch (error: any) {
      const savedUserStr = localStorage.getItem('ce_cur_user');
      const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
      if (error.response?.status === 401) {
        setCurUser(null);
      } else {
        console.error("Error fetching current user session:", error);
        setCurUser(savedUser);
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URI}/products`, {
        params: { limit: 1000 }
      });
      if (response.data && response.data.success && Array.isArray(response.data.products)) {
        const mappedProducts: Product[] = response.data.products.map((backendProd: any, idx: number) => {
          const nextId = idx + 1;
          return {
            id: nextId,
            _id: backendProd._id,
            name: backendProd.title,
            cat: backendProd.category,
            desc: backendProd.description,
            tags: backendProd.tags || [],
            badge: backendProd.badge === 'None' ? null : backendProd.badge,
            imgs: backendProd.images ? backendProd.images.map((im: any) => im.url) : [],
            images: backendProd.images || [],
            price: backendProd.sellingPrice || backendProd.retailPrice,
            originalPrice: backendProd.retailPrice,
            sku: backendProd.sku,
            brand: backendProd.brand,
            discount: backendProd.discountPercentage,
            stock: backendProd.stock,
            status: backendProd.isActive ? 'Active' : 'Draft',
            createdDate: backendProd.createdAt ? backendProd.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
            specs: {
              Size: backendProd.specifications?.containerSize || '',
              Usage: backendProd.specifications?.usageInstructions || '',
              pH: backendProd.specifications?.phLevel || '',
              Suitable: backendProd.specifications?.suitableSurfaces || ''
            },
            rating: backendProd.averageRating || 0,
            reviewCount: backendProd.totalReviews || 0
          };
        });
        setProducts(mappedProducts);
      }
    } catch (error) {
      console.error('Error fetching products from API:', error);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchProducts();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const openAuthModal = (tab: 'login' | 'signup' = 'login') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  // Helper check for admin procedures
  const checkAdminPermission = (): boolean => {
    if (!curUser || !curUser.isAdmin) {
      showToast('Access Denied: Administrative privileges required.');
      return false;
    }
    if (auth.currentUser) {
      return true;
    }
    const token = sessionStorage.getItem('ce_access_token');
    if (!token || !token.startsWith('mock-jwt-')) {
      showToast('Session Expired: Please log in again.');
      return false;
    }
    return true;
  };

  // Helper helper to convert base64 image data to Blob
  const dataURLtoBlob = (dataurl: string): Blob => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // Validate email address format
  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const loginUser = (email: string, pass: string) => {
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
    if (user) {
      const mockToken = `mock-jwt-${btoa(user.email)}-${Date.now()}`;
      sessionStorage.setItem('ce_access_token', mockToken);
      
      setCurUser({ name: user.name, email: user.email, isAdmin: user.isAdmin });
      showToast(`Welcome back, ${user.name}!`);
      return { success: true, message: 'Logged in successfully' };
    }
    return { success: false, message: 'Invalid email or password' };
  };

  const registerUser = (name: string, email: string, pass: string) => {
    if (!validateEmail(email)) {
      return { success: false, message: 'Please enter a valid email address.' };
    }
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, message: 'An account with this email already exists' };
    }
    const newUser: User = { name, email, password: pass, isAdmin: false };
    setUsers((prev) => [...prev, newUser]);
    
    const mockToken = `mock-jwt-${btoa(email)}-${Date.now()}`;
    sessionStorage.setItem('ce_access_token', mockToken);
    
    setCurUser({ name, email, isAdmin: false });
    showToast(`Welcome to Clean Everyday, ${name}!`);
    return { success: true, message: 'Registered successfully' };
  };

  const logoutUser = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URI;
      if (backendUrl) {
        await axios.post(`${backendUrl}/auth/logout`, {}, { withCredentials: true });
      }
    } catch (err) {
      console.warn('Backend logout API call failed:', err);
    }
    try {
      if (auth.currentUser) {
        await auth.signOut();
      }
    } catch (err) {
      console.warn('Firebase signOut failed:', err);
    }

    // Expire any client-accessible cookies
    document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    sessionStorage.removeItem('ce_access_token');
    // Clear user-specific data from localStorage on logout
    localStorage.removeItem('ce_cart');
    localStorage.removeItem('ce_orders');
    localStorage.removeItem('ce_checkout_addresses');
    setCart([]);
    setOrders([]);
    setCurUser(null);
    setCurPage('home');
    showToast('Signed out successfully.');
  };

  const addProduct = async (p: Omit<Product, 'id' | 'rating' | 'reviewCount'>): Promise<boolean> => {
    if (!checkAdminPermission()) return false;
    
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      showToast('Error: System Admin Firebase session not active.');
      return false;
    }

    try {
      const token = await firebaseUser.getIdToken();
      const formData = new FormData();
      
      formData.append('title', p.name);
      formData.append('sku', p.sku.toUpperCase());
      formData.append('brand', p.brand);
      formData.append('category', p.cat);
      formData.append('badge', p.badge || 'None');
      formData.append('tags', p.tags.join(','));
      formData.append('description', p.desc);
      formData.append('retailPrice', String(p.price));
      formData.append('discountPercentage', String(p.discount));
      formData.append('stock', String(p.stock));
      formData.append('minStockAlert', String(p.specs.minStockAlert || 5));
      formData.append('status', p.status === 'Active' ? 'Active' : 'Draft');
      formData.append('isActive', String(p.status === 'Active'));
      formData.append('containerSize', p.specs.Size || '');
      formData.append('usageInstructions', p.specs.Usage || '');
      formData.append('phLevel', p.specs.pH || '');
      formData.append('suitableSurfaces', p.specs.Suitable || '');

      if (p.seo) {
        formData.append('metaTitle', p.seo.metaTitle || '');
        formData.append('metaDescription', p.seo.metaDescription || '');
        if (p.seo.metaKeywords) {
          formData.append('metaKeywords', p.seo.metaKeywords.join(','));
        }
      }

      if (p.imgs && p.imgs.length > 0) {
        p.imgs.forEach((img, idx) => {
          if (img.startsWith('data:')) {
            try {
              const blob = dataURLtoBlob(img);
              const mime = img.split(',')[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
              const ext = mime.split('/')[1] || 'jpg';
              formData.append('images', blob, `image-${idx}.${ext}`);
            } catch (err) {
              console.warn('Failed to parse base64 image data', err);
            }
          }
        });
      }

      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URI}/admin/add-product`, formData, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true
      });

      if (response.data && response.data.success) {
        const backendProd = response.data.product;
        const nextId = products.length > 0 ? Math.max(...products.map((pr) => pr.id)) + 1 : 1;
        const newProduct: Product = {
          id: nextId,
          _id: backendProd._id,
          name: backendProd.title,
          cat: backendProd.category,
          desc: backendProd.description,
          tags: backendProd.tags || [],
          badge: backendProd.badge === 'None' ? null : backendProd.badge,
          imgs: backendProd.images ? backendProd.images.map((im: any) => im.url) : [],
          images: backendProd.images || [],
          price: backendProd.sellingPrice || backendProd.retailPrice,
          originalPrice: backendProd.retailPrice,
          sku: backendProd.sku,
          brand: backendProd.brand,
          discount: backendProd.discountPercentage,
          stock: backendProd.stock,
          status: backendProd.isActive ? 'Active' : 'Draft',
          createdDate: backendProd.createdAt ? backendProd.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
          specs: {
            Size: backendProd.specifications?.containerSize || '',
            Usage: backendProd.specifications?.usageInstructions || '',
            pH: backendProd.specifications?.phLevel || '',
            Suitable: backendProd.specifications?.suitableSurfaces || ''
          },
          rating: backendProd.averageRating || 0,
          reviewCount: backendProd.totalReviews || 0
        };

        setProducts((prev) => [...prev, newProduct]);
        showToast(`Product "${p.name}" has been added.`);
        return true;
      } else {
        showToast(response.data.message || 'Failed to add product.');
        return false;
      }
    } catch (error: any) {
      console.error('Error adding product:', error);
      const errMsg = error.response?.data?.message || 'Error occurred while adding product.';
      showToast(errMsg);
      return false;
    }
  };

  const updateProductImages = (id: number, updatedImgs: string[]) => {
    if (!checkAdminPermission()) return;
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, imgs: updatedImgs } : p))
    );
    showToast('Product images updated.');
  };

  const deleteProduct = async (id: number): Promise<boolean> => {
    if (!checkAdminPermission()) return false;
    const prod = products.find((p) => p.id === id);
    if (!prod) return false;

    if (prod._id) {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        showToast('Error: System Admin Firebase session not active.');
        return false;
      }
      try {
        const token = await firebaseUser.getIdToken();
        const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URI}/admin/delete-product/${prod._id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          withCredentials: true
        });
        if (response.data && response.data.success) {
          showToast(`Product "${prod.name}" deleted successfully.`);
          await fetchProducts();
          return true;
        } else {
          showToast(response.data.message || 'Failed to delete product.');
          return false;
        }
      } catch (error: any) {
        console.error('Error deleting product:', error);
        const errMsg = error.response?.data?.message || 'Error occurred while deleting product.';
        showToast(errMsg);
        return false;
      }
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast('Product removed locally.');
      return true;
    }
  };

  const duplicateProduct = (id: number) => {
    if (!checkAdminPermission()) return;
    const prod = products.find((p) => p.id === id);
    if (!prod) return;
    const nextId = products.length > 0 ? Math.max(...products.map((pr) => pr.id)) + 1 : 1;
    const duplicated: Product = {
      ...prod,
      id: nextId,
      name: `${prod.name} (Copy)`,
      sku: `${prod.sku}-COPY`,
      createdDate: new Date().toISOString().split('T')[0]
    };
    setProducts((prev) => [...prev, duplicated]);
    showToast(`Duplicated "${prod.name}" successfully.`);
  };



  const updateProduct = async (p: Product, localDeletedImagePublicIds: string[] = []): Promise<boolean> => {
    if (!checkAdminPermission()) return false;
    
    if (!p._id) {
      showToast('Error: Product database reference id not found.');
      return false;
    }

    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      showToast('Error: System Admin Firebase session not active.');
      return false;
    }

    try {
      const token = await firebaseUser.getIdToken();
      const formData = new FormData();
      
      formData.append('title', p.name);
      formData.append('sku', p.sku.toUpperCase());
      formData.append('brand', p.brand);
      formData.append('category', p.cat);
      formData.append('badge', p.badge || 'None');
      formData.append('tags', p.tags.join(','));
      formData.append('description', p.desc);
      formData.append('retailPrice', String(p.price));
      formData.append('discountPercentage', String(p.discount));
      formData.append('stock', String(p.stock));
      formData.append('minStockAlert', String(p.specs.minStockAlert || 5));
      formData.append('status', p.status === 'Active' ? 'Active' : 'Draft');
      formData.append('isActive', String(p.status === 'Active'));
      formData.append('containerSize', p.specs.Size || '');
      formData.append('usageInstructions', p.specs.Usage || '');
      formData.append('phLevel', p.specs.pH || '');
      formData.append('suitableSurfaces', p.specs.Suitable || '');

      if (p.seo) {
        formData.append('metaTitle', p.seo.metaTitle || '');
        formData.append('metaDescription', p.seo.metaDescription || '');
        if (p.seo.metaKeywords) {
          formData.append('metaKeywords', p.seo.metaKeywords.join(','));
        }
      }

      if (localDeletedImagePublicIds.length > 0) {
        formData.append('deletedImages', JSON.stringify(localDeletedImagePublicIds));
      }

      if (p.imgs && p.imgs.length > 0) {
        p.imgs.forEach((img, idx) => {
          if (img.startsWith('data:')) {
            try {
              const blob = dataURLtoBlob(img);
              const mime = img.split(',')[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
              const ext = mime.split('/')[1] || 'jpg';
              formData.append('images', blob, `image-${idx}.${ext}`);
            } catch (err) {
              console.warn('Failed to parse base64 image data', err);
            }
          }
        });
      }

      const response = await axios.put(`${import.meta.env.VITE_BACKEND_URI}/admin/update-product/${p._id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true
      });

      if (response.data && response.data.success) {
        const backendProd = response.data.product;
        setProducts((prev) =>
          prev.map((item) => {
            if (item.id === p.id) {
              return {
                id: p.id,
                _id: backendProd._id,
                name: backendProd.title,
                cat: backendProd.category,
                desc: backendProd.description,
                tags: backendProd.tags || [],
                badge: backendProd.badge === 'None' ? null : backendProd.badge,
                imgs: backendProd.images ? backendProd.images.map((im: any) => im.url) : [],
                images: backendProd.images || [],
                price: backendProd.sellingPrice || backendProd.retailPrice,
                originalPrice: backendProd.retailPrice,
                sku: backendProd.sku,
                brand: backendProd.brand,
                discount: backendProd.discountPercentage,
                stock: backendProd.stock,
                status: backendProd.isActive ? 'Active' : 'Draft',
                createdDate: backendProd.createdAt ? backendProd.createdAt.split('T')[0] : p.createdDate,
                specs: {
                  Size: backendProd.specifications?.containerSize || '',
                  Usage: backendProd.specifications?.usageInstructions || '',
                  pH: backendProd.specifications?.phLevel || '',
                  Suitable: backendProd.specifications?.suitableSurfaces || ''
                },
                rating: backendProd.averageRating || 0,
                reviewCount: backendProd.totalReviews || 0
              };
            }
            return item;
          })
        );
        showToast(`Product "${p.name}" updated successfully.`);
        return true;
      } else {
        showToast(response.data.message || 'Failed to update product.');
        return false;
      }
    } catch (error: any) {
      console.error('Error updating product:', error);
      const errMsg = error.response?.data?.message || 'Error occurred while updating product.';
      showToast(errMsg);
      return false;
    }
  };

  const submitReview = (authorName: string, rating: number, body: string, productName: string) => {
    if (!curUser) {
      showToast('Please log in to submit a review.');
      return;
    }
    const initials = authorName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    const newReview: Review = {
      id: Date.now(),
      author: authorName,
      ini: initials || 'C',
      role: 'Verified Customer',
      img: null,
      rating,
      body,
      product: productName,
      approved: false,
      status: 'Pending',
      date: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    };

    setReviews((prev) => [...prev, newReview]);
    showToast('Your review has been submitted for approval.');
  };

  const approveReview = (id: number) => {
    if (!checkAdminPermission()) return;
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, approved: true, status: 'Approved' as const } : r))
    );
    showToast('Review approved.');
  };

  const deleteReview = (id: number) => {
    if (!checkAdminPermission()) return;
    setReviews((prev) => prev.filter((r) => r.id !== id));
    showToast('Review deleted.');
  };

  const updateReviewStatus = (id: number, status: NonNullable<Review['status']>) => {
    if (!checkAdminPermission()) return;
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, approved: status === 'Approved' } : r))
    );
    showToast(`Review status updated to ${status}.`);
  };

  const replyToReview = (id: number, replyText: string) => {
    if (!checkAdminPermission()) return;
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, reply: replyText } : r))
    );
    showToast('Reply saved.');
  };

  const addLead = (
    name: string,
    email: string,
    phoneOrSubject: string,
    companyOrService?: string,
    sourceOrMessage?: string,
    subject?: string,
    service?: string,
    message?: string,
    priority: Lead['priority'] = 'Medium'
  ) => {
    let finalPhone = '';
    let finalCompany = '';
    let finalSource = 'Web Inquiry';
    let finalSubject = '';
    let finalService = '';
    let finalMessage = '';
    let finalPriority = priority;

    if (subject === undefined) {
      // 5 arguments call (from client Home.tsx page)
      finalPhone = '';
      finalCompany = '';
      finalSource = 'Web Inquiry';
      finalSubject = phoneOrSubject;
      finalService = companyOrService || 'General';
      finalMessage = sourceOrMessage || '';
      finalPriority = 'Medium';
    } else {
      // 9 arguments call (from LeadsCRM.tsx wizard)
      finalPhone = phoneOrSubject || '';
      finalCompany = companyOrService || '';
      finalSource = sourceOrMessage || 'Web Inquiry';
      finalSubject = subject || '';
      finalService = service || '';
      finalMessage = message || '';
      finalPriority = priority;
    }

    const newLead: Lead = {
      id: Date.now(),
      name,
      email,
      phone: finalPhone,
      company: finalCompany,
      source: finalSource,
      subject: finalSubject,
      service: finalService,
      message: finalMessage,
      status: 'New',
      priority: finalPriority,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      internalNotes: '',
      attachments: [],
      activities: [
        { type: 'Note', title: 'Inquiry received', content: 'Lead submitted web inquiry form.', date: new Date().toLocaleString('en-IN') }
      ],
      tasks: [],
      reminders: [],
      comments: []
    };
    setLeads((prev) => [newLead, ...prev]);
    showToast('Message sent! We will contact you soon.');
  };

  const updateLeadStatus = (id: number, status: Lead['status']) => {
    if (!checkAdminPermission()) return;
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          const nextActs = l.activities ? [...l.activities] : [];
          nextActs.push({
            type: 'Note',
            title: `Status changed to ${status}`,
            content: `Internal lead status updated by admin.`,
            date: new Date().toLocaleString('en-IN')
          });
          return { ...l, status, activities: nextActs };
        }
        return l;
      })
    );
    showToast(`Lead status updated to ${status}.`);
  };

  const updateLeadNotes = (id: number, notes: string) => {
    if (!checkAdminPermission()) return;
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, internalNotes: notes } : l))
    );
  };

  const addLeadComment = (id: number, author: string, body: string) => {
    if (!checkAdminPermission()) return;
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          const nextComments = l.comments ? [...l.comments] : [];
          nextComments.push({
            id: `c-${Date.now()}`,
            author,
            body,
            date: new Date().toLocaleString('en-IN')
          });
          const nextActs = l.activities ? [...l.activities] : [];
          nextActs.push({
            type: 'Comment',
            title: `New internal comment`,
            content: `${author} commented: "${body.substring(0, 40)}${body.length > 40 ? '...' : ''}"`,
            date: new Date().toLocaleString('en-IN')
          });
          return { ...l, comments: nextComments, activities: nextActs };
        }
        return l;
      })
    );
    showToast('Comment added.');
  };

  const addLeadTask = (id: number, title: string) => {
    if (!checkAdminPermission()) return;
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          const nextTasks = l.tasks ? [...l.tasks] : [];
          nextTasks.push({
            id: `t-${Date.now()}`,
            title,
            done: false
          });
          const nextActs = l.activities ? [...l.activities] : [];
          nextActs.push({
            type: 'Task',
            title: `Task created`,
            content: `New task added: "${title}"`,
            date: new Date().toLocaleString('en-IN')
          });
          return { ...l, tasks: nextTasks, activities: nextActs };
        }
        return l;
      })
    );
    showToast('Task added.');
  };

  const toggleLeadTask = (id: number, taskId: string) => {
    if (!checkAdminPermission()) return;
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === id && l.tasks) {
          const updatedTasks = l.tasks.map((t) =>
            t.id === taskId ? { ...t, done: !t.done } : t
          );
          const toggledTask = l.tasks.find((t) => t.id === taskId);
          const nextActs = l.activities ? [...l.activities] : [];
          if (toggledTask) {
            nextActs.push({
              type: 'Task',
              title: `Task marked ${!toggledTask.done ? 'done' : 'undone'}`,
              content: `Task: "${toggledTask.title}" status changed.`,
              date: new Date().toLocaleString('en-IN')
            });
          }
          return { ...l, tasks: updatedTasks, activities: nextActs };
        }
        return l;
      })
    );
  };

  const addLeadReminder = (id: number, title: string, date: string) => {
    if (!checkAdminPermission()) return;
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          const nextReminders = l.reminders ? [...l.reminders] : [];
          nextReminders.push({
            id: `rem-${Date.now()}`,
            title,
            date
          });
          return { ...l, reminders: nextReminders };
        }
        return l;
      })
    );
    showToast('Reminder scheduled.');
  };

  const addLeadActivity = (id: number, type: LeadActivity['type'], title: string, content: string) => {
    if (!checkAdminPermission()) return;
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          const nextActs = l.activities ? [...l.activities] : [];
          nextActs.push({
            type,
            title,
            content,
            date: new Date().toLocaleString('en-IN')
          });
          return { ...l, activities: nextActs };
        }
        return l;
      })
    );
  };

  const updateBanners = (updatedBanners: Banner[]) => {
    if (!checkAdminPermission()) return;
    setBanners(updatedBanners);
    showToast('Homepage hero banners published.');
  };

  // E-commerce Cart Operations
  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
        return next;
      }
      return [...prev, { product, quantity }];
    });
    showToast(`Added ${product.name} to cart.`);
  };

  const updateCartQty = (productId: number, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: qty } : item
      )
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('Removed item from cart.');
  };

  const clearCart = () => {
    setCart([]);
  };

  const mapBackendOrderToFrontend = (b: any): Order => {
    return {
      id: b.orderNumber,
      date: b.createdAt
        ? new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      items: b.items.map((item: any) => {
        const matchedProduct = products.find((p) => p._id === item.product || p.sku === item.sku);
        return {
          product: matchedProduct || {
            id: Math.floor(Math.random() * 100000),
            _id: item.product,
            name: item.title,
            cat: 'General',
            desc: '',
            tags: [],
            badge: null,
            imgs: item.image ? [item.image] : [],
            price: item.unitPrice,
            sku: item.sku,
            brand: 'Clean Everyday',
            discount: 0,
            stock: 0,
            status: 'Active',
            createdDate: '',
            specs: {},
            rating: 0,
            reviewCount: 0
          },
          quantity: item.quantity
        };
      }),
      total: b.grandTotal,
      customerEmail: curUser?.email || 'customer@cleaneveryday.in',
      shippingMethod: 'Standard Delivery',
      taxes: b.tax || 0,
      discount: b.discount || 0,
      address: {
        name: b.shippingAddress?.fullName || '',
        phone: b.shippingAddress?.phone || '',
        alternatePhone: b.shippingAddress?.alternatePhone || '',
        addressLine1: b.shippingAddress?.addressLine1 || '',
        addressLine2: b.shippingAddress?.addressLine2 || '',
        pincode: b.shippingAddress?.pincode || '',
        city: b.shippingAddress?.city || '',
        state: b.shippingAddress?.state || ''
      },
      billingAddress: {
        name: b.billingAddress?.fullName || '',
        phone: b.billingAddress?.phone || '',
        alternatePhone: b.billingAddress?.alternatePhone || '',
        addressLine1: b.billingAddress?.addressLine1 || '',
        addressLine2: b.billingAddress?.addressLine2 || '',
        pincode: b.billingAddress?.pincode || '',
        city: b.billingAddress?.city || '',
        state: b.billingAddress?.state || ''
      },
      paymentMethod: b.payment?.method || 'UPI',
      paymentStatus: b.payment?.status || 'Pending',
      status: b.status || 'Pending'
    };
  };

  const placeOrder = async (address: Order['address'], paymentMethod: string, customerNotes?: string) => {
    try {
      if (paymentMethod !== 'Cash on delivery') {
        // Fallback for non-COD payment modes (GPay/UPI/Card) - mock locally
        const mockOrder: Order = {
          id: `CE${Date.now()}`,
          date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          items: cart.map((item) => ({ ...item })),
          total: cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
          customerEmail: curUser?.email || 'customer@cleaneveryday.in',
          shippingMethod: 'Standard Delivery',
          taxes: 0,
          discount: 0,
          address,
          billingAddress: address,
          paymentMethod: paymentMethod === 'Credit or debit card' ? 'Card' : 'UPI',
          paymentStatus: 'Pending',
          status: 'Pending'
        };
        setOrders((prev) => [mockOrder, ...prev]);
        clearCart();
        setCurPage('orders');
        showToast(`Mock order placed successfully using ${paymentMethod}!`);
        return;
      }

      const firebaseUser = auth.currentUser;
      let token = '';
      if (firebaseUser) {
        token = await firebaseUser.getIdToken();
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URI}/orders/place-order`,
        {
          shippingAddress: {
            fullName: address.name,
            phone: address.phone,
            alternatePhone: address.alternatePhone || '',
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2 || '',
            city: address.city,
            state: address.state,
            country: 'India',
            pincode: address.pincode
          },
          items: cart.map((item) => ({
            product: item.product._id || item.product.id.toString(),
            quantity: item.quantity
          })),
          paymentMethod: 'COD',
          couponCode: '',
          customerNotes: customerNotes || ''
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          withCredentials: true
        }
      );

      if (response.data && response.data.success) {
        const backendOrder = response.data.order;
        const mappedOrder = mapBackendOrderToFrontend(backendOrder);
        setOrders((prev) => [mappedOrder, ...prev]);
        clearCart();
        setCurPage('orders');
        showToast(`Order ${mappedOrder.id} placed successfully!`);
      } else {
        showToast(response.data.message || 'Failed to place order.');
      }
    } catch (error: any) {
      console.error('Failed to place order:', error);
      const errorMsg = error.response?.data?.message || 'Failed to place order. Please try again.';
      showToast(errorMsg);
    }
  };

  const updateOrderStatus = (id: string, status: Order['status']) => {
    const isAllowedSelfAction = status === 'Cancelled' || status === 'Returned';

    if (!isAllowedSelfAction && !checkAdminPermission()) return;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          const nextTimeline = o.timeline ? [...o.timeline] : [];
          nextTimeline.push({
            status,
            date: new Date().toLocaleString('en-IN'),
            notes: isAllowedSelfAction ? `Status updated to ${status} by customer.` : `Status updated to ${status} by admin.`
          });
          return { ...o, status, timeline: nextTimeline };
        }
        return o;
      })
    );
    showToast(`Order status updated to ${status}.`);
  };

  const updateOrderDetails = (id: string, details: Partial<Order>) => {
    if (!checkAdminPermission()) return;
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...details } : o))
    );
    showToast('Order details updated.');
  };

  const addOrderTimelineEvent = (id: string, status: string, notes?: string) => {
    const isAllowedSelfAction = status === 'Cancelled' || status === 'Returned';

    if (!isAllowedSelfAction && !checkAdminPermission()) return;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          const nextTimeline = o.timeline ? [...o.timeline] : [];
          nextTimeline.push({
            status,
            date: new Date().toLocaleString('en-IN'),
            notes
          });
          return { ...o, timeline: nextTimeline };
        }
        return o;
      })
    );
  };

  // Staff Account Management Operations
  const inviteStaff = (name: string, email: string, role: Staff['role']) => {
    if (!checkAdminPermission()) return;
    const nextId = `ST-00${staff.length + 1}`;
    const newStaff: Staff = {
      id: nextId,
      name,
      email,
      role,
      status: 'Active',
      lastLogin: 'Never logged in'
    };
    setStaff((prev) => [...prev, newStaff]);
    showToast(`Staff invitation sent to ${email}.`);
  };

  const updateStaffStatus = (id: string, status: Staff['status']) => {
    if (!checkAdminPermission()) return;
    setStaff((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
    showToast(`Staff account ${status === 'Active' ? 'activated' : 'deactivated'}.`);
  };

  const resetStaffPassword = (_id: string) => {
    if (!checkAdminPermission()) return;
    showToast('Password reset link has been generated and emailed.');
  };

  const deleteStaff = (id: string) => {
    if (!checkAdminPermission()) return;
    setStaff((prev) => prev.filter((s) => s.id !== id));
    showToast('Staff profile deleted.');
  };

  const updateProfile = async (updated: Partial<User>) => {
    if (!curUser) return;
    
    // Optimistically update local state first
    const localUpdated = { ...updated };
    if (updated.avatar) {
      localUpdated.photoURL = updated.avatar;
    }
    const updatedUser = { ...curUser, ...localUpdated };
    setCurUser(updatedUser);

    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      try {
        const token = await firebaseUser.getIdToken();
        const formData = new FormData();
        
        if (updated.firstName !== undefined) formData.append('firstName', updated.firstName);
        if (updated.lastName !== undefined) formData.append('lastName', updated.lastName);
        if (updated.gender !== undefined) formData.append('gender', updated.gender);
        if (updated.dateOfBirth !== undefined) formData.append('dateOfBirth', updated.dateOfBirth);
        if (updated.phoneNumber !== undefined) formData.append('phoneNumber', updated.phoneNumber);
        
        if (updated.address) {
          if (updated.address.addressLine1 !== undefined) formData.append('addressLine1', updated.address.addressLine1);
          if (updated.address.addressLine2 !== undefined) formData.append('addressLine2', updated.address.addressLine2);
          if (updated.address.city !== undefined) formData.append('city', updated.address.city);
          if (updated.address.state !== undefined) formData.append('state', updated.address.state);
          if (updated.address.postalCode !== undefined) formData.append('postalCode', updated.address.postalCode);
          if (updated.address.country !== undefined) formData.append('country', updated.address.country);
        }
        
        // If there's a new base64 image uploaded, append as a Blob under the field "photo"
        if (updated.avatar && updated.avatar.startsWith('data:')) {
          try {
            const blob = dataURLtoBlob(updated.avatar);
            const mime = updated.avatar.split(',')[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
            const ext = mime.split('/')[1] || 'jpg';
            formData.append('photo', blob, `photo-${Date.now()}.${ext}`);
          } catch (err) {
            console.warn('Failed to parse base64 avatar data', err);
          }
        }
        
        const response = await axios.put(`${import.meta.env.VITE_BACKEND_URI}/users/update-profile`, formData, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          withCredentials: true
        });
        
        if (response.data && response.data.success) {
          await fetchCurrentUser();
        }
      } catch (error) {
        console.error('Failed to sync profile update with backend api:', error);
      }
    }
    showToast('Profile updated successfully.');
  };

  return (
    <AppContext.Provider
      value={{
        products,
        reviews,
        users,
        leads,
        banners,
        staff,
        curUser,
        isAuthLoading,
        curPage,
        curFilter,
        searchQuery,
        toastMessage,
        selectedProductId,
        authModalOpen,
        authModalTab,
        setCurPage,
        setCurFilter,
        setSearchQuery,
        setSelectedProductId,
        openAuthModal,
        closeAuthModal,
        loginUser,
        registerUser,
        logoutUser,
        addProduct,
        updateProductImages,
        deleteProduct,
        duplicateProduct,
        submitReview,
        approveReview,
        deleteReview,
        updateReviewStatus,
        replyToReview,
        addLead,
        updateLeadStatus,
        updateLeadNotes,
        addLeadComment,
        addLeadTask,
        toggleLeadTask,
        addLeadReminder,
        addLeadActivity,
        updateBanners,
        showToast,
        cart,
        orders,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        placeOrder,
        updateProduct,
        updateOrderStatus,
        updateOrderDetails,
        addOrderTimelineEvent,
        inviteStaff,
        updateStaffStatus,
        resetStaffPassword,
        deleteStaff,
        invoiceOrder,
        setInvoiceOrder,
        fetchCurrentUser,
        updateProfile
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
