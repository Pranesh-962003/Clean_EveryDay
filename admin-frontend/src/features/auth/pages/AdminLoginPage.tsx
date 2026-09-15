import React, { useState } from 'react';
import { useApp } from '../../../core/context/AppContext';
import { 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  ShieldCheck, 
  Loader2, 
  ArrowLeft, 
  CheckCircle2,
  KeyRound
} from 'lucide-react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
// @ts-ignore
import { auth } from '../../../../firebase';
import axios from 'axios';

const AdminLoginPage: React.FC = () => {
  const { fetchCurrentUser, showToast } = useApp();

  const [authMode, setAuthMode] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('admin@ecommerce.com');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleAdminEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your work email and password.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = result.user;
      const token = await user.getIdToken();
      
      const backendUrl = import.meta.env.VITE_BACKEND_URI || 'http://localhost:5002/api';
      const response = await axios.post(
        `${backendUrl}/auth/admin/login`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      if (response.data && response.data.user) {
        await fetchCurrentUser(response.data.user);
        showToast('Successfully authenticated as Administrator.');
      } else {
        setErrorMsg('User account does not have administrative privileges.');
      }
      setIsLoading(false);
    } catch (error: any) {
      console.error('Admin login error:', error);
      let friendlyMessage = error.message;
      if (
        error.code === 'auth/invalid-credential' || 
        error.code === 'auth/wrong-password' || 
        error.code === 'auth/user-not-found'
      ) {
        friendlyMessage = 'Invalid administrative email or password. Please verify and try again.';
      } else if (error.response?.data?.message) {
        friendlyMessage = error.response.data.message;
      }
      setErrorMsg(friendlyMessage);
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your registered admin email address.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
      setIsLoading(false);
      showToast('Password reset link sent to your email.');
    } catch (error: any) {
      console.error('Password reset error:', error);
      let friendlyMessage = error.message;
      if (error.code === 'auth/user-not-found') {
        friendlyMessage = 'No registered administrator account found with this email.';
      }
      setErrorMsg(friendlyMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden select-none">
      {/* Left Pane: Form Container */}
      <div className="w-full lg:w-[48%] xl:w-[42%] flex flex-col justify-between p-6 sm:p-10 lg:p-14 z-10 bg-slate-950 overflow-y-auto">
        {/* Top Header Branding */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-slate-950 flex items-center justify-center font-black text-base shadow-sm">
              E
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-base font-extrabold text-white tracking-tight">
                Ecommerce
              </span>
              <span className="text-[11px] text-slate-400 font-medium mt-0.5">
                Admin Console
              </span>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900 border border-slate-800 text-slate-300">
            <ShieldCheck size={12} className="text-emerald-400" />
            <span>Secure Portal</span>
          </div>
        </div>

        {/* Center: Auth Card Content */}
        <div className="my-auto py-8 max-w-[420px] w-full mx-auto animate-fadeIn">
          {authMode === 'login' ? (
            <div>
              {/* Form Title */}
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display mb-2">
                  Administrator Sign In
                </h1>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your verified administrative credentials to access store operations, analytics, and CRM.
                </p>
              </div>

              {/* Error Alert Box */}
              {errorMsg && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-3 animate-fadeIn">
                  <ShieldAlert size={16} className="text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{errorMsg}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleAdminEmailLogin} className="space-y-4">
                {/* Work Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Work Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="admin@ecommerce.com"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all min-h-[44px]"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg(null);
                        setAuthMode('forgot');
                        setResetSent(false);
                      }}
                      className="text-xs text-slate-400 hover:text-white cursor-pointer transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all min-h-[44px]"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer p-0.5"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-slate-100 focus:ring-0 cursor-pointer w-4 h-4"
                    />
                    <span>Remember this session</span>
                  </label>
                </div>

                {/* Submit Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-white text-slate-950 hover:bg-slate-200 text-xs font-bold tracking-wide shadow-md transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <span>Sign In to Admin Console</span>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* Forgot Password View */
            <div className="animate-fadeIn">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setAuthMode('login');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer mb-6 transition-colors"
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>

              <div className="mb-6">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-200 mb-3">
                  <KeyRound size={20} />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white font-display mb-2">
                  Reset Admin Password
                </h1>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your registered work email address and we will dispatch a secure password reset link to your inbox.
                </p>
              </div>

              {resetSent ? (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2 font-bold text-emerald-200">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <span>Reset Link Dispatched</span>
                  </div>
                  <p className="text-emerald-300/90 leading-relaxed">
                    A password reset email has been sent to <strong className="text-white font-mono">{email}</strong>. Please check your inbox and spam folder.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setResetSent(false);
                    }}
                    className="w-full mt-2 py-2.5 px-4 bg-emerald-900/60 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors text-center"
                  >
                    Return to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  {errorMsg && (
                    <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-3 animate-fadeIn">
                      <ShieldAlert size={16} className="text-rose-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{errorMsg}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Work Email Address
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      <input
                        type="email"
                        required
                        placeholder="admin@ecommerce.com"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all min-h-[44px]"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl bg-white text-slate-950 hover:bg-slate-200 text-xs font-bold tracking-wide shadow-md transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Sending Reset Link...</span>
                      </>
                    ) : (
                      <span>Send Password Reset Link</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer Security Note */}
        <div className="pt-4 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
          <span>© {new Date().getFullYear()} Ecommerce Platform</span>
          <span className="font-mono">256-Bit SSL Encrypted</span>
        </div>
      </div>

      {/* Right Pane: Hero Image Banner */}
      <div className="hidden lg:block lg:w-[52%] xl:w-[58%] relative overflow-hidden bg-slate-900">
        {/* Background Hero Image */}
        <img
          src="/admin_login_hero.jpg"
          alt="Ecommerce Operations Center"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-70"
        />

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/50" />

        {/* Floating Telemetry & Insight Cards */}
        <div className="absolute bottom-12 left-12 right-12 z-20 space-y-4 max-w-[500px]">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-slate-200 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Operational Command Center • Live Telemetry</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight font-display leading-tight drop-shadow-sm">
            Enterprise E-Commerce Management System
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed drop-shadow-sm">
            Unified multi-channel catalog indexing, automated dispatch logistics, and high-frequency real-time CRM analytics.
          </p>

          {/* Quick Metrics Badges */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-950/75 backdrop-blur-md border border-slate-800/80 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Fulfillment</span>
              <span className="text-base font-bold text-white font-mono mt-0.5 block">99.8%</span>
            </div>
            <div className="bg-slate-950/75 backdrop-blur-md border border-slate-800/80 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Security</span>
              <span className="text-base font-bold text-emerald-400 font-mono mt-0.5 block">SOC2 / SSL</span>
            </div>
            <div className="bg-slate-950/75 backdrop-blur-md border border-slate-800/80 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Sync Latency</span>
              <span className="text-base font-bold text-amber-400 font-mono mt-0.5 block">&lt; 15ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
