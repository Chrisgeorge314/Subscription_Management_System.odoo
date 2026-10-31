import React, { useState } from 'react';
import {
  Shield,
  Briefcase,
  User as UserIcon,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Repeat,
  Zap,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';

export const LoginPage: React.FC = () => {
  const { login, register, loginAs } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [resetSentMessage, setResetSentMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [email, setEmail] = useState('admin@brightloop.io');
  const [password, setPassword] = useState('Admin@1234');

  // Register state
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');

  const validatePasswordClient = (pwd: string) => {
    if (pwd.length <= 8) return 'Password must be more than 8 characters';
    if (!/[A-Z]/.test(pwd)) return 'Must contain at least one uppercase letter';
    if (!/[a-z]/.test(pwd)) return 'Must contain at least one lowercase letter';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return 'Must contain at least one special character';
    return null;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const pwdErr = validatePasswordClient(password);
    if (pwdErr) {
      setError(pwdErr);
      return;
    }

    setLoading(true);
    try {
      await register({ name, email, password, company, phone });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = (await api.forgotPassword(email)) as any;
      setResetSentMessage(res.message || 'Reset link generated.');
    } catch (err: any) {
      setError(err.message || 'Failed to request reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-[#0B1120] font-sans select-none">
      {/* Background Digital Network Graphic & Ambient Lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Abstract Dark Navy / Blue Gradient Canvas */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1120] via-[#0F172A] to-[#070D19]" />

        {/* Ambient Teal & Blue Glow Orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-32 right-1/4 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl" />

        {/* High-tech geometric network lines SVG */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.07] stroke-slate-400"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid-pattern" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>

      {/* LEFT SECTION – BRANDING (50% on Desktop) */}
      <div className="relative z-10 w-full lg:w-1/2 flex flex-col justify-between p-8 sm:p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-slate-800/60">
        {/* Brand Header */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 via-teal-400 to-sky-400 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/25">
            <svg className="w-6 h-6 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 0 0-7.07 17.07l1.41-1.41A8 8 0 1 1 12 20v2a10 10 0 0 0 0-20z" />
            </svg>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">Brightloop</span>
            <span className="block text-[11px] font-medium text-[#14B8A6] uppercase tracking-wider">
              Subscription Management
            </span>
          </div>
        </div>

        {/* Central Hero Statement */}
        <div className="my-12 lg:my-0 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-[#14B8A6] text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse" />
            ODOO Kochi Hackathon Edition
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
            Manage Subscriptions. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-sky-300 to-teal-200">
              Effortlessly.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-[#A5B4CC] mt-5 leading-relaxed font-normal">
            Your complete platform for managing subscriptions, recurring billing, invoices and payments.
          </p>

          {/* Three Feature Highlights */}
          <div className="mt-10 space-y-4">
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#172338]/40 border border-slate-700/50 backdrop-blur-sm">
              <div className="w-9 h-9 rounded-lg bg-teal-500/15 border border-teal-500/30 text-[#14B8A6] flex items-center justify-center shrink-0">
                <Repeat className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Subscription Management</h3>
                <p className="text-xs text-[#A5B4CC] mt-0.5">
                  Complete lifecycle control from quotation proposal to active renewals and closures.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#172338]/40 border border-slate-700/50 backdrop-blur-sm">
              <div className="w-9 h-9 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Automated Billing</h3>
                <p className="text-xs text-[#A5B4CC] mt-0.5">
                  Idempotent recurring tax invoices, Indian GST calculations, and payment reconciliation.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#172338]/40 border border-slate-700/50 backdrop-blur-sm">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Revenue Analytics</h3>
                <p className="text-xs text-[#A5B4CC] mt-0.5">
                  Real-time MRR, ARR, overdue tracking, and automated financial CSV reports.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-500 flex items-center justify-between">
          <span>Brightloop Software Platform</span>
          <span>Security • RBAC • GST Engine</span>
        </div>
      </div>

      {/* RIGHT SECTION – LOGIN FORM WITH GLASSMORPHISM (50% on Desktop) */}
      <div className="relative z-10 w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        {/* Glass Card Container */}
        <div className="w-full max-w-md relative">
          {/* Subtle teal glow behind card */}
          <div className="absolute -inset-1.5 bg-gradient-to-r from-teal-500/20 to-sky-500/20 rounded-3xl blur-xl opacity-75" />

          <div className="relative rounded-2xl bg-[#172338]/70 border border-slate-700/80 backdrop-blur-xl p-8 sm:p-10 shadow-2xl">
            {/* Header of Form */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {isForgotPassword ? 'Reset Password' : isRegistering ? 'Create Customer Account' : 'Welcome Back'}
              </h2>
              <p className="text-xs sm:text-sm text-[#A5B4CC] mt-1">
                {isForgotPassword
                  ? 'Enter your email to receive recovery instructions.'
                  : isRegistering
                  ? 'Register your company for self-service subscription portal.'
                  : 'Sign in to your Brightloop account.'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {resetSentMessage && (
              <div className="mb-5 p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#14B8A6]" />
                <span>{resetSentMessage}</span>
              </div>
            )}

            {/* FORGOT PASSWORD FORM */}
            {isForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@brightloop.io"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#0B1120]/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#14B8A6] hover:bg-[#0D9488] text-slate-950 font-bold rounded-xl transition shadow-lg shadow-teal-500/20 text-xs tracking-wide"
                >
                  {loading ? 'Sending Instructions...' : 'Send Reset Instructions'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setError(null);
                      setResetSentMessage(null);
                    }}
                    className="text-[#14B8A6] hover:underline font-semibold"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            ) : isRegistering ? (
              /* REGISTRATION FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rahul Varma"
                    className="w-full px-3.5 py-2.5 bg-[#0B1120]/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] transition"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Technova Solutions Pvt Ltd"
                    className="w-full px-3.5 py-2.5 bg-[#0B1120]/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] transition"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Business Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rahul@technova.com"
                    className="w-full px-3.5 py-2.5 bg-[#0B1120]/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] transition"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 pr-10 bg-[#0B1120]/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    &gt;8 characters with uppercase, lowercase, and special symbol.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#14B8A6] hover:bg-[#0D9488] text-slate-950 font-bold rounded-xl transition shadow-lg shadow-teal-500/20 text-xs tracking-wide"
                >
                  {loading ? 'Creating Account...' : 'Register Customer Account'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(false);
                      setError(null);
                    }}
                    className="text-[#14B8A6] hover:underline font-semibold"
                  >
                    Already have an account? Sign In
                  </button>
                </div>
              </form>
            ) : (
              /* MAIN LOGIN FORM (Matches Exact Request) */
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                {/* Email Input */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@brightloop.io"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#0B1120]/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] transition"
                    />
                  </div>
                </div>

                {/* Password Input with Show/Hide Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-300">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError(null);
                      }}
                      className="text-[11px] text-[#14B8A6] hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-[#0B1120]/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#0B1120] border-slate-700 text-[#14B8A6] focus:ring-[#14B8A6] focus:ring-offset-0"
                    />
                    <span className="text-[11px] text-[#A5B4CC]">Remember me for 30 days</span>
                  </label>
                </div>

                {/* Main Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 bg-[#14B8A6] hover:bg-[#0D9488] text-slate-950 font-bold rounded-xl transition shadow-lg shadow-teal-500/20 text-xs tracking-wide flex items-center justify-center gap-2"
                >
                  <span>{loading ? 'Authenticating...' : 'Sign in as Admin'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Divider */}
                <div className="relative my-5 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700/70" />
                  </div>
                  <span className="relative px-3 bg-[#172338] text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                    Or preview another role
                  </span>
                </div>

                {/* Two Secondary Buttons: Staff and Customer */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => loginAs('STAFF')}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#0B1120]/60 hover:bg-[#0B1120] border border-slate-700/80 text-white text-xs font-semibold hover:border-slate-500 transition shadow-xs"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-sky-400" />
                    <span>Staff</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => loginAs('CUSTOMER')}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#0B1120]/60 hover:bg-[#0B1120] border border-slate-700/80 text-white text-xs font-semibold hover:border-slate-500 transition shadow-xs"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-[#14B8A6]" />
                    <span>Customer</span>
                  </button>
                </div>

                {/* Registration link */}
                <div className="text-center pt-3 border-t border-slate-700/50 mt-4">
                  <span className="text-[11px] text-slate-400">Need a customer account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(true);
                      setError(null);
                    }}
                    className="text-[11px] text-[#14B8A6] hover:underline font-semibold"
                  >
                    Register here
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
