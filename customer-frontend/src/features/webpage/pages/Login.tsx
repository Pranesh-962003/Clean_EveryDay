import React, { useState, useEffect } from 'react';
import { useApp } from '../../../core/context/AppContext';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Truck,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification
} from 'firebase/auth';
// @ts-ignore
import { auth, googleProvider } from '../../../../firebase';
import axios from 'axios';

interface LoginProps {
  initialTab?: 'signin' | 'signup';
}

const Login: React.FC<LoginProps> = ({ initialTab = 'signin' }) => {
  const { curUser, fetchCurrentUser, updateProfile, setCurPage, showToast } = useApp();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(
    initialTab === 'signup' ? 'signup' : 'signin'
  );
  const [otpStep, setOtpStep] = useState<'send' | 'verify'>('send');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [email, setEmail] = useState('customer@ecommerce.com');
  const [password, setPassword] = useState('customer123');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync mode when switching tabs
  useEffect(() => {
    if (mode === 'signin') {
      setEmail('customer@ecommerce.com');
      setPassword('customer123');
    } else {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFullName('');
      setPhone('');
      setTermsAccepted(false);
    }
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [mode]);

  // If already authenticated, redirect to home
  useEffect(() => {
    if (curUser) {
      setCurPage('home');
    }
  }, [curUser, setCurPage]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URI}/auth/send-otp`,
        { email: email.trim() }
      );
      setSuccessMsg(response.data?.message || '6-digit OTP verification code sent to your email.');
      setOtpStep('verify');
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.response?.data?.message || error.message || 'Failed to send verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtpAndResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      setErrorMsg('Please enter a valid 6-digit verification code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URI}/auth/verify-otp-reset-password`,
        {
          email: email.trim(),
          otp: otp.trim(),
          newPassword
        }
      );
      setSuccessMsg(response.data?.message || 'Password reset successfully! You can now sign in.');
      setTimeout(() => {
        setMode('signin');
        setOtpStep('send');
        setOtp('');
        setNewPassword('');
        setConfirmNewPassword('');
        setErrorMsg(null);
        setSuccessMsg(null);
      }, 1800);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.response?.data?.message || error.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (!email.trim()) {
        setErrorMsg('Please enter your email address.');
        return;
      }
      if (!phone.trim() || !/^\d{10}$/.test(phone.trim())) {
        setErrorMsg('Please enter a valid 10-digit mobile number.');
        return;
      }
      if (!password || password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
      if (!termsAccepted) {
        setErrorMsg('Please accept the Terms of Service & Privacy Policy.');
        return;
      }
    } else {
      if (!email.trim()) {
        setErrorMsg('Please enter your email address.');
        return;
      }
      if (!password) {
        setErrorMsg('Please enter your password.');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (mode === 'signup') {
        const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = result.user;
        const token = await user.getIdToken();

        try {
          await sendEmailVerification(result.user);
        } catch (verifErr) {
          console.warn('Verification email could not be sent', verifErr);
        }

        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URI}/auth/register`,
          {
            name: fullName.trim(),
            phone: phone.trim(),
            email: email.trim()
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            },
            withCredentials: true
          }
        );

        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');

        if (updateProfile) {
          try {
            await updateProfile({
              firstName,
              lastName,
              phoneNumber: phone.trim()
            });
          } catch (profErr) {
            console.warn('Profile update sync skipped:', profErr);
          }
        }

        await fetchCurrentUser(response.data.user);
        showToast('Account registered successfully!');
        setCurPage('home');
      } else {
        const result = await signInWithEmailAndPassword(auth, email.trim(), password);
        const user = result.user;
        const token = await user.getIdToken();

        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URI}/auth/login`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`
            },
            withCredentials: true
          }
        );

        if (!user.emailVerified) {
          try {
            await sendEmailVerification(user);
          } catch (verifErr) {
            console.warn('Verification email limit reached or skipped:', verifErr);
          }
        }

        await fetchCurrentUser(response.data.user);
        showToast('Signed in successfully.');
        setCurPage('home');
      }
    } catch (err: any) {
      console.error(err);
      let msg = err.response?.data?.message || err.message || 'Authentication failed.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'This email address is already in use. Please sign in.';
      } else if (
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/invalid-credential'
      ) {
        msg = 'Invalid email or password. Please check your credentials.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Please try again in a few moments.';
      }
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const token = await user.getIdToken();

      if (mode === 'signup') {
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URI}/auth/register`,
          {
            name: user.displayName || fullName.trim() || 'User',
            email: user.email || '',
            phone: user.phoneNumber || phone.trim() || ''
          },
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true
          }
        );
        await fetchCurrentUser(response.data.user);
      } else {
        try {
          const loginRes = await axios.post(
            `${import.meta.env.VITE_BACKEND_URI}/auth/login`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
              withCredentials: true
            }
          );
          await fetchCurrentUser(loginRes.data.user);
        } catch (loginErr: any) {
          if (loginErr.response?.status === 404) {
            const regRes = await axios.post(
              `${import.meta.env.VITE_BACKEND_URI}/auth/register`,
              {
                name: user.displayName || 'User',
                email: user.email || '',
                phone: user.phoneNumber || ''
              },
              {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true
              }
            );
            await fetchCurrentUser(regRes.data.user);
          } else {
            throw loginErr;
          }
        }
      }
      showToast('Signed in with Google.');
      setCurPage('home');
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err.response?.data?.message || err.message || 'Google sign-in was unsuccessful.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full lg:h-screen flex flex-col lg:flex-row bg-[#FAFAF9] text-slate-900 font-sans selection:bg-slate-900 selection:text-white antialiased overflow-hidden">
      {/* ─── LEFT COLUMN: Fused Static Hero Side (Pinned & Non-scrolling) ─── */}
      <div className="w-full lg:w-[48%] xl:w-[50%] h-[320px] sm:h-[380px] lg:h-full relative overflow-hidden flex flex-col justify-between p-8 sm:p-10 lg:p-12 xl:p-14 select-none shrink-0">
        
        {/* Full-Bleed Background Hero Image */}
        <img
          src="/customer_login_hero.jpg"
          alt="Curated Lifestyle & E-Commerce"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Fused Subtle Cinematic Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-black/15 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-slate-950/30 pointer-events-none" />

        {/* Top Minimal Brand Pill */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-white/80 text-slate-900 text-xs font-bold shadow-md">
            <div className="w-4 h-4 rounded-full bg-slate-950 text-white flex items-center justify-center text-[10px] font-black">
              E
            </div>
            <span>Ecommerce</span>
          </div>
        </div>

        {/* Bottom Reduced & Concise Headline Content */}
        <div className="relative z-10 mt-auto pt-10 space-y-4 max-w-md">
          <h2 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight font-display drop-shadow-md">
            Crafted for intentional living.
          </h2>
          <p className="text-xs sm:text-sm text-slate-100/90 leading-relaxed drop-shadow font-medium">
            Join thousands of happy customers enjoying seamless one-click ordering and express doorstep delivery.
          </p>

          {/* Minimal Frosted Assurance Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-slate-900 text-[11px] font-bold shadow-sm">
              <Truck size={13} className="text-emerald-600" />
              <span>Free Express ₹499+</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-slate-900 text-[11px] font-bold shadow-sm">
              <RotateCcw size={13} className="text-blue-600" />
              <span>7-Day Easy Returns</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-slate-900 text-[11px] font-bold shadow-sm">
              <ShieldCheck size={13} className="text-amber-600" />
              <span>100% Genuine</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── RIGHT COLUMN: Scrollable Form Console (Only Right Column Scrolls) ─── */}
      <div className="w-full lg:w-[52%] xl:w-[50%] h-full flex-1 flex flex-col justify-between px-6 sm:px-12 lg:px-14 xl:px-20 py-8 sm:py-10 lg:py-12 bg-white text-slate-900 overflow-y-auto">
        
        {/* Top Row: Back Navigation Button on the Right Side */}
        <div className="w-full max-w-[420px] mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurPage('home')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-950 transition-all cursor-pointer group py-2 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200/80 shadow-xs"
            aria-label="Back to store"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform text-slate-950" />
            <span>Back to Shopping</span>
          </button>

          <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80">
            Secure Portal
          </span>
        </div>

        {/* Center: Auth Form Container */}
        <div className="max-w-[420px] w-full mx-auto my-auto py-6">
          {/* Form Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 font-display">
              {mode === 'signin' && 'Welcome back'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'forgot' && 'Reset your password'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed font-normal">
              {mode === 'signin' && 'Sign in to access your orders, track shipments, and manage account.'}
              {mode === 'signup' && 'Sign up in seconds for express one-click checkout and exclusive deals.'}
              {mode === 'forgot' && 'Enter your verified email to receive a 6-digit password recovery code.'}
            </p>
          </div>

          {/* Segmented Mode Tabs (Sign In vs Create Account) */}
          {mode !== 'forgot' && (
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-6 select-none border border-slate-200/80">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'signin'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'signup'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>Create Account</span>
              </button>
            </div>
          )}

          {/* Error Alert Box */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-start gap-3 animate-fadeIn">
              <div className="w-2 h-2 rounded-full bg-rose-600 mt-1 shrink-0" />
              <span className="leading-snug font-semibold">{errorMsg}</span>
            </div>
          )}

          {/* Success Alert Box */}
          {successMsg && (
            <div className="mb-5 p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-start gap-3 animate-fadeIn">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-snug font-semibold">{successMsg}</span>
            </div>
          )}

          {/* ── Form: Forgot Password Flow ── */}
          {mode === 'forgot' ? (
            <div className="space-y-4 animate-fadeIn">
              {otpStep === 'send' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full border border-slate-200 bg-slate-50/90 focus:bg-white rounded-xl px-3.5 py-3 pl-10 text-xs sm:text-sm text-slate-900 min-h-[46px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all placeholder:text-slate-400 font-medium"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block font-medium">
                      We will dispatch a secure 6-digit OTP code to verify your account.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full min-h-[46px] bg-slate-950 hover:bg-slate-800 active:scale-[0.99] text-white rounded-xl text-xs sm:text-sm font-bold tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Send Verification OTP'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="w-full text-center text-xs font-bold text-slate-600 hover:text-slate-950 transition-colors pt-2 cursor-pointer inline-flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft size={13} /> Back to Sign In
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtpAndResetPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      6-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      required
                      className="w-full border border-slate-200 bg-slate-50/90 focus:bg-white rounded-xl px-3.5 py-3 text-sm text-slate-900 min-h-[46px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all text-center font-mono text-xl tracking-[0.3em] font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        required
                        className="w-full border border-slate-200 bg-slate-50/90 focus:bg-white rounded-xl px-3.5 py-3 pl-10 pr-10 text-xs sm:text-sm text-slate-900 min-h-[46px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all placeholder:text-slate-400 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Repeat new password"
                      required
                      className="w-full border border-slate-200 bg-slate-50/90 focus:bg-white rounded-xl px-3.5 py-3 text-xs sm:text-sm text-slate-900 min-h-[46px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all placeholder:text-slate-400 font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full min-h-[46px] bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Confirm & Reset Password'}
                  </button>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpStep('send');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="font-bold text-slate-600 hover:text-slate-950 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft size={13} /> Change Email
                    </button>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleSendOtp}
                      className="font-bold text-slate-900 hover:underline cursor-pointer"
                    >
                      Resend OTP Code
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* ── Form: Sign In & Sign Up ── */
            <form onSubmit={handleEmailAuth} className="space-y-4 animate-fadeIn">
              {mode === 'signup' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      Full Name
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Priya Sharma"
                        required
                        className="w-full border border-slate-200 bg-slate-50/90 focus:bg-white rounded-xl px-3.5 py-3 pl-10 text-xs sm:text-sm text-slate-900 min-h-[46px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all placeholder:text-slate-400 font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="tel"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="9876543210"
                        required
                        className="w-full border border-slate-200 bg-slate-50/90 focus:bg-white rounded-xl px-3.5 py-3 pl-10 text-xs sm:text-sm text-slate-900 min-h-[46px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all placeholder:text-slate-400 font-medium font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full border border-slate-200 bg-slate-50/90 focus:bg-white rounded-xl px-3.5 py-3 pl-10 text-xs sm:text-sm text-slate-900 min-h-[46px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 block">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setOtpStep('send');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs font-bold text-slate-600 hover:text-slate-950 transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full border border-slate-200 bg-slate-50/90 focus:bg-white rounded-xl px-3.5 py-3 pl-10 pr-10 text-xs sm:text-sm text-slate-900 min-h-[46px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all placeholder:text-slate-400 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password on Signup */}
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full border border-slate-200 bg-slate-50/90 focus:bg-white rounded-xl px-3.5 py-3 pl-10 pr-10 text-xs sm:text-sm text-slate-900 min-h-[46px] outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all placeholder:text-slate-400 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Checkboxes */}
              {mode === 'signin' ? (
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer accent-slate-900"
                    />
                    <span className="text-xs font-medium text-slate-600">Remember this device</span>
                  </label>
                </div>
              ) : (
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer accent-slate-900"
                    />
                    <span className="text-xs text-slate-600 leading-normal font-medium">
                      I agree to the{' '}
                      <span className="underline text-slate-900 font-bold hover:text-black">
                        Terms of Service
                      </span>{' '}
                      and{' '}
                      <span className="underline text-slate-900 font-bold hover:text-black">
                        Privacy Policy
                      </span>
                      .
                    </span>
                  </label>
                </div>
              )}

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[48px] bg-slate-950 hover:bg-slate-800 active:scale-[0.99] text-white rounded-xl text-xs sm:text-sm font-bold tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'signin' ? 'Sign In to Account' : 'Complete Free Registration'}</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-5 select-none">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase">
                  <span className="bg-white px-3 text-slate-400 font-bold tracking-wider">Or continue with</span>
                </div>
              </div>

              {/* Google Auth Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full min-h-[48px] bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs active:scale-[0.99] disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Demo Notice for Customer */}
              {mode === 'signin' && (
                <div className="pt-2 text-center">
                  <p className="text-[11px] text-slate-400 font-mono">
                    Demo credentials pre-filled for quick testing
                  </p>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Bottom Sub-Footer */}
        <div className="w-full max-w-[420px] mx-auto text-center pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Ecommerce Platform</span>
          <span className="font-medium">256-Bit SSL Encrypted</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
