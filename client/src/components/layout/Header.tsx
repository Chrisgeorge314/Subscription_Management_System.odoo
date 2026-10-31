import React, { useState } from 'react';
import { Search, Bell, Calendar, Zap, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';

interface HeaderProps {
  title: string;
  subtitle?: string;
  dateRange: string;
  onChangeDateRange: (range: string) => void;
  onSearch?: (term: string) => void;
  onBillingTriggered?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  dateRange,
  onChangeDateRange,
  onSearch,
  onBillingTriggered,
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState<string | null>(null);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AD';

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  const handleTriggerBilling = async () => {
    setIsTriggering(true);
    try {
      const res = (await api.triggerRecurringBilling()) as any;
      setTriggerMessage(`Billing Run: ${res.generated} invoices generated, ${res.autoClosed} closed.`);
      setTimeout(() => setTriggerMessage(null), 4000);
      if (onBillingTriggered) onBillingTriggered();
    } catch (err: any) {
      alert(`Error triggering billing: ${err.message}`);
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200/90 px-8 py-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20">
      {/* Title & Subtitle */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative w-64 md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search customers, invoices, subscriptions..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs text-slate-800 placeholder-slate-400 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
          />
        </div>

        {/* Live Recurring Billing Trigger (For Hackathon Demo) */}
        {user?.role !== 'CUSTOMER' && (
          <button
            onClick={handleTriggerBilling}
            disabled={isTriggering}
            title="Execute automated recurring billing cycle right now"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold rounded-lg border border-sky-200/80 transition"
          >
            <Zap className={`w-3.5 h-3.5 ${isTriggering ? 'animate-spin text-amber-500' : 'text-sky-600'}`} />
            <span>{isTriggering ? 'Billing...' : 'Run Billing'}</span>
          </button>
        )}

        {/* Notification Bell */}
        <button
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
          title="3 Unread Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
        </button>

        {/* User Avatar Circle */}
        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold ring-1 ring-slate-300">
          {initials}
        </div>

        {/* Date Range Selector */}
        <div className="relative">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={dateRange}
              onChange={(e) => onChangeDateRange(e.target.value)}
              className="bg-transparent border-none text-xs font-medium text-slate-700 focus:outline-none cursor-pointer pr-1"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="6m">Last 6 months</option>
              <option value="1y">This year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Floating alert for billing runner feedback */}
      {triggerMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 z-50 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{triggerMessage}</span>
        </div>
      )}
    </header>
  );
};
