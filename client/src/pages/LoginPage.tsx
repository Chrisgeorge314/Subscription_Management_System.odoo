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
  CheckCheck,
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

  /* ─── Input class helper ─────────────────────────────────────────────────── */
  const inputCls =
    'w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 ' +
    'placeholder-slate-400 text-sm focus:outline-none focus:border-teal-500 ' +
    'focus:ring-2 focus:ring-teal-500/20 transition-all duration-150';

  const iconInputCls =
    'w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 ' +
    'placeholder-slate-400 text-sm focus:outline-none focus:border-teal-500 ' +
    'focus:ring-2 focus:ring-teal-500/20 transition-all duration-150';

  const labelCls = 'block text-xs font-semibold text-slate-600 mb-1.5 tracking-wide';

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row font-sans select-none bg-[#F8F9FA]">

      {/* ══════════════════════════════════════════════════════════════════
          LEFT SECTION — Brand panel (deep navy, similar to sidebar)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="relative w-full lg:w-[46%] xl:w-[42%] flex flex-col justify-between bg-[#18243A] overflow-hidden">

        {/* Subtle geometric pattern overlay */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.04] stroke-white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="dot-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-grid)" />
        </svg>

        {/* Subtle teal accent blob — top left */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        {/* Subtle accent blob — bottom right */}
        <div className="absolute -bottom-20 -right-10 w-64 h-64 bg-sky-500/8 rounded-full blur-3xl pointer-events-none" />

        {/* ── TOP: Logo ── */}
        <div className="relative z-10 p-8 sm:p-10 lg:p-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
              <svg className="w-5 h-5 stroke-[2.5] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 0 0-7.07 17.07l1.41-1.41A8 8 0 1 1 12 20v2a10 10 0 0 0 0-20z" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white leading-none">Brightloop</span>
              <span className="block text-[10px] font-semibold text-teal-400 uppercase tracking-widest mt-0.5">
                Subscription Management
              </span>
            </div>
          </div>
        </div>

        {/* ── MIDDLE: Hero content ── */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-8 sm:px-10 lg:px-12 pb-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/25 text-teal-400 text-[11px] font-semibold mb-7 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            ODOO Kochi Hackathon Edition
          </div>

          <h1 className="text-3xl sm:text-4xl xl:text-[2.6rem] font-extrabold text-white tracking-tight leading-[1.15] max-w-sm">
            Manage Subscriptions.{' '}
            <span className="text-teal-400">Effortlessly.</span>
          </h1>

          <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-sm">
            Your complete platform for managing subscriptions, recurring billing, invoices and payments — all in one place.
          </p>

          {/* Feature cards */}
          <div className="mt-8 space-y-3 max-w-sm">
            {[
              {
                icon: <Repeat className="w-4 h-4" />,
                color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
                title: 'Subscription Management',
                desc: 'Complete lifecycle from quotation to active renewals and closures.',
              },
              {
                icon: <Zap className="w-4 h-4" />,
                color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
                title: 'Automated Billing',
                desc: 'Recurring invoices, Indian GST calculations, and reconciliation.',
              },
              {
                icon: <BarChart3 className="w-4 h-4" />,
                color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                title: 'Revenue Analytics',
                desc: 'Real-time MRR, ARR, overdue tracking, and CSV export reports.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.04] border border-white/8 hover:bg-white/[0.06] transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${f.color}`}>
                  {f.icon}
                </div>
                <div>
                  <h3 className="text-[13px] font-semibold text-white leading-tight">{f.title}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── BOTTOM: Footer ── */}
        <div className="relative z-10 px-8 sm:px-10 lg:px-12 py-6 flex items-center justify-between border-t border-white/8">
          <span className="text-[11px] text-slate-500">© 2026 Brightloop Software</span>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <CheckCheck className="w-3.5 h-3.5 text-teal-500" />
            <span>RBAC · GST · JWT Auth</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          RIGHT SECTION — Login form (light, matches app theme)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-[#F8F9FA]">
        <div className="w-full max-w-md">

          {/* Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10">

            {/* Form Header */}
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {isForgotPassword
                  ? 'Reset your password'
                  : isRegistering
                  ? 'Create an account'
                  : 'Welcome back'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {isForgotPassword
                  ? 'Enter your email to receive recovery instructions.'
                  : isRegistering
                  ? 'Register your company for the self-service portal.'
                  : 'Sign in to your Brightloop account.'}
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Banner */}
            {resetSentMessage && (
              <div className="mb-5 p-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-500 mt-0.5" />
                <span>{resetSentMessage}</span>
              </div>
            )}

            {/* ── FORGOT PASSWORD ── */}
            {isForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className={labelCls}>Email address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@brightloop.io"
                      className={iconInputCls}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#18243A] hover:bg-slate-700 text-white font-semibold rounded-lg transition text-sm flex items-center justify-center gap-2"
                >
                  {loading ? 'Sending...' : 'Send Reset Instructions'}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setError(null);
                    setResetSentMessage(null);
                  }}
                  className="w-full text-center text-sm text-teal-600 hover:text-teal-700 font-medium transition"
                >
                  ← Back to Sign In
                </button>
              </form>

            ) : isRegistering ? (
              /* ── REGISTRATION FORM ── */
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className={labelCls}>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rahul Varma"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Company Name</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Technova Solutions Pvt Ltd"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Business Email *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rahul@technova.com"
                      className={iconInputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 chars, uppercase, special"
                      className={`${iconInputCls} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    &gt;8 characters with uppercase, lowercase, and special symbol.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#18243A] hover:bg-slate-700 text-white font-semibold rounded-lg transition text-sm flex items-center justify-center gap-2"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(false);
                    setError(null);
                  }}
                  className="w-full text-center text-sm text-slate-500 hover:text-slate-700 font-medium transition"
                >
                  Already have an account? <span className="text-teal-600">Sign In</span>
                </button>
              </form>

            ) : (
              /* ── MAIN LOGIN FORM ── */
              <form onSubmit={handleLoginSubmit} className="space-y-5">

                {/* Email */}
                <div>
                  <label className={labelCls}>Email address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@brightloop.io"
                      className={iconInputCls}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={labelCls.replace('mb-1.5', '')}>Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError(null);
                      }}
                      className="text-xs text-teal-600 hover:text-teal-700 font-medium transition"
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
                      className={`${iconInputCls} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-teal-500 focus:ring-teal-500 focus:ring-offset-0"
                  />
                  <label htmlFor="remember" className="text-xs text-slate-500 cursor-pointer select-none">
                    Remember me for 30 days
                  </label>
                </div>

                {/* Primary CTA — Sign in as Admin */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#18243A] hover:bg-slate-700 text-white font-semibold rounded-lg transition-all text-sm flex items-center justify-center gap-2 shadow-sm"
                >
                  <Shield className="w-4 h-4" />
                  <span>{loading ? 'Authenticating...' : 'Sign in as Admin'}</span>
                  {!loading && <ArrowRight className="w-4 h-4 ml-auto" />}
                </button>

                {/* Divider */}
                <div className="relative my-1 flex items-center gap-3">
                  <div className="flex-1 border-t border-slate-200" />
                  <span className="text-[11px] uppercase font-semibold tracking-wider text-slate-400 whitespace-nowrap">
                    Or preview another role
                  </span>
                  <div className="flex-1 border-t border-slate-200" />
                </div>

                {/* Quick role buttons — Staff & Customer */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => loginAs('STAFF')}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-semibold transition-all"
                  >
                    <Briefcase className="w-4 h-4 text-sky-500" />
                    <span>Staff</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => loginAs('CUSTOMER')}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-semibold transition-all"
                  >
                    <UserIcon className="w-4 h-4 text-teal-500" />
                    <span>Customer</span>
                  </button>
                </div>

                {/* Register link */}
                <p className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                  Need a customer account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(true);
                      setError(null);
                    }}
                    className="text-teal-600 hover:text-teal-700 font-semibold transition"
                  >
                    Register here
                  </button>
                </p>
              </form>
            )}
          </div>

          {/* Below-card footer note */}
          <p className="text-center text-[11px] text-slate-400 mt-5">
            Secured with JWT · RBAC role isolation · Passwords hashed with bcrypt
          </p>
        </div>
      </div>
    </div>
  );
};
