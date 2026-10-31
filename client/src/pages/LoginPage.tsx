import React, { useState } from 'react';
import { Shield, Briefcase, User as UserIcon, Lock, Mail, Building, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';

export const LoginPage: React.FC = () => {
  const { login, register, loginAs } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSentMessage, setResetSentMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register form
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
      setError(err.message || 'Login failed');
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
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand logo */}
        <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-sky-600 via-sky-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-sky-500/20 mb-3">
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 0 0-7.07 17.07l1.41-1.41A8 8 0 1 1 12 20v2a10 10 0 0 0 0-20z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Brightloop</h2>
        <p className="text-xs text-slate-500 mt-0.5">Subscription Management Platform</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Demo Persona Quick-Login Strip for Hackathon Jurors */}
        <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-3.5 mb-5 text-xs">
          <p className="font-semibold text-sky-900 mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
            Hackathon Demo 1-Click Fast Logins:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => loginAs('ADMIN')}
              className="flex flex-col items-center p-2 rounded-lg bg-white border border-sky-100 hover:border-sky-300 hover:shadow-xs transition text-center"
            >
              <Shield className="w-4 h-4 text-sky-600 mb-1" />
              <span className="font-bold text-slate-800 text-[11px]">Admin</span>
              <span className="text-[10px] text-slate-400">Full Access</span>
            </button>

            <button
              onClick={() => loginAs('STAFF')}
              className="flex flex-col items-center p-2 rounded-lg bg-white border border-sky-100 hover:border-sky-300 hover:shadow-xs transition text-center"
            >
              <Briefcase className="w-4 h-4 text-slate-600 mb-1" />
              <span className="font-bold text-slate-800 text-[11px]">Staff</span>
              <span className="text-[10px] text-slate-400">Operations</span>
            </button>

            <button
              onClick={() => loginAs('CUSTOMER')}
              className="flex flex-col items-center p-2 rounded-lg bg-white border border-sky-100 hover:border-sky-300 hover:shadow-xs transition text-center"
            >
              <UserIcon className="w-4 h-4 text-teal-600 mb-1" />
              <span className="font-bold text-slate-800 text-[11px]">Customer</span>
              <span className="text-[10px] text-slate-400">Technova Portal</span>
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/90 rounded-2xl sm:px-8">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {resetSentMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{resetSentMessage}</span>
            </div>
          )}

          {/* Form */}
          {isForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 text-sm">Reset Password</h3>
              <p className="text-slate-500">Enter your account email to receive reset instructions.</p>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@brightloop.io"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs transition"
              >
                {loading ? 'Sending...' : 'Send Reset Instructions'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="text-sky-600 hover:text-sky-700 font-medium"
                >
                  Back to login
                </button>
              </div>
            </form>
          ) : isRegistering ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 text-sm">Create New Account</h3>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rahul Varma"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Company / Organization</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Technova Solutions Pvt Ltd"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Business Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@technova.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Must exceed 8 chars, 1 uppercase, 1 lowercase, 1 symbol"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  &gt;8 characters, 1 uppercase, 1 lowercase, 1 special character required.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs transition"
              >
                {loading ? 'Registering...' : 'Register Account'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="text-sky-600 hover:text-sky-700 font-medium"
                >
                  Already have an account? Sign In
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Email address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@brightloop.io"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-sky-600 hover:text-sky-700 text-[11px] font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs transition"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>

              <div className="text-center pt-2">
                <span className="text-slate-400">Need a customer account? </span>
                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="text-sky-600 hover:text-sky-700 font-medium"
                >
                  Register here
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
