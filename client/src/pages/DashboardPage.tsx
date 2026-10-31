import React, { useEffect, useState } from 'react';
import {
  IndianRupee,
  TrendingUp,
  Users,
  FileSpreadsheet,
  ArrowUpRight,
  MoreHorizontal,
  ChevronDown,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../services/api.js';
import { DashboardSummary } from '../types/index.js';
import { Badge } from '../components/common/Badge.js';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
  dateRange: string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, dateRange }) => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      try {
        setLoading(true);
        const res = (await api.getDashboardSummary(dateRange)) as DashboardSummary;
        setData(res);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, [dateRange]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatCompactCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(0)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

  if (loading || !data) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200/60 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 h-72 bg-slate-200/60 rounded-xl" />
          <div className="h-72 bg-slate-200/60 rounded-xl" />
        </div>
      </div>
    );
  }

  const { metrics, chartTimeline, statusDistribution, recentSubscriptions, recentTransactions, upcomingRenewals, topCustomers } = data;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* 1. KPI Cards Row (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
              <IndianRupee className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Total Revenue</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {formatCurrency(metrics.totalRevenue)}
            </span>
            <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
              12.5%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">+12.5% from previous period</p>
        </div>

        {/* Monthly Recurring Revenue */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Monthly Recurring Revenue</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {formatCurrency(metrics.mrr)}
            </span>
            <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
              8.3%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">+8.3% from last month</p>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Active Subscriptions</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {metrics.activeSubscriptions.toLocaleString('en-IN')}
            </span>
            <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
              6.1%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">+{metrics.newSubscriptions} new subscriptions</p>
        </div>

        {/* Outstanding Payments */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Outstanding Payments</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {formatCurrency(metrics.outstandingPayments)}
            </span>
            <span className="inline-flex items-center text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
              5.4%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">{metrics.overdueCount} overdue invoices</p>
        </div>
      </div>

      {/* 2. Middle Row: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Dual Line & Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Revenue & Subscription Growth</h3>
              <p className="text-xs text-slate-400 mt-0.5">Monthly revenue and active subscriptions over time</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Revenue (₹)
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                  Active Subscriptions
                </span>
              </div>
              <button className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-md">
                <span>Monthly</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartTimeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="subsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="month"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatCompactCurrency}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const rev = payload.find((p) => p.dataKey === 'revenue')?.value as number;
                      const subs = payload.find((p) => p.dataKey === 'activeSubscriptions')?.value as number;
                      return (
                        <div className="bg-slate-900 text-white rounded-lg p-3 text-xs shadow-xl border border-slate-800">
                          <p className="font-semibold text-slate-300 mb-1.5">{label} 2026</p>
                          <div className="flex items-center justify-between gap-4 py-0.5">
                            <span className="flex items-center gap-1.5 text-blue-400">
                              <span className="w-2 h-2 rounded-full bg-blue-400" /> Revenue
                            </span>
                            <span className="font-bold">{formatCurrency(rev)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 py-0.5">
                            <span className="flex items-center gap-1.5 text-teal-400">
                              <span className="w-2 h-2 rounded-full bg-teal-400" /> Subscriptions
                            </span>
                            <span className="font-bold">{subs}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="activeSubscriptions"
                  stroke="#0D9488"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#0D9488' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Donut Chart - Subscription Status */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Subscription Status</h3>
            <p className="text-xs text-slate-400 mt-0.5">Current state of all active contracts</p>
          </div>

          <div className="relative flex items-center justify-center my-3">
            <div className="h-44 w-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    innerRadius={50}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold text-slate-900">1,247</span>
              <span className="text-[10px] text-slate-400 uppercase font-medium">Total</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {statusDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-semibold text-slate-800">
                  {item.count} <span className="text-slate-400 font-normal">({item.percentage}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: 2x2 Grid of Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table 1: Recent Subscriptions */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Subscriptions</h3>
              <p className="text-xs text-slate-400 mt-0.5">Latest subscription created in your system</p>
            </div>
            <button
              onClick={() => onNavigate('subscriptions')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 transition"
            >
              View all →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase">
                  <th className="pb-2.5 font-medium">#</th>
                  <th className="pb-2.5 font-medium">Customer</th>
                  <th className="pb-2.5 font-medium">Plan</th>
                  <th className="pb-2.5 font-medium">Start Date</th>
                  <th className="pb-2.5 font-medium">Status</th>
                  <th className="pb-2.5 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {recentSubscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 font-medium text-slate-900">{sub.number}</td>
                    <td className="py-2.5">
                      <button
                        onClick={() => onNavigate('subscriptions')}
                        className="font-medium text-sky-600 hover:underline"
                      >
                        {sub.customer}
                      </button>
                    </td>
                    <td className="py-2.5 text-slate-600">{sub.plan}</td>
                    <td className="py-2.5 text-slate-500">
                      {new Date(sub.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-2.5">
                      <Badge status={sub.status} />
                    </td>
                    <td className="py-2.5 text-right text-slate-400">
                      <MoreHorizontal className="w-4 h-4 inline cursor-pointer hover:text-slate-600" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Recent Transactions */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Transactions</h3>
              <p className="text-xs text-slate-400 mt-0.5">Latest payments and invoices</p>
            </div>
            <button
              onClick={() => onNavigate('payments')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 transition"
            >
              View all →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase">
                  <th className="pb-2.5 font-medium">#</th>
                  <th className="pb-2.5 font-medium">Type</th>
                  <th className="pb-2.5 font-medium">Customer</th>
                  <th className="pb-2.5 font-medium">Amount</th>
                  <th className="pb-2.5 font-medium">Date</th>
                  <th className="pb-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 font-medium text-slate-900">{tx.number}</td>
                    <td className="py-2.5">
                      <Badge status={tx.type} />
                    </td>
                    <td className="py-2.5 text-slate-700 font-medium">{tx.customer}</td>
                    <td className="py-2.5 font-semibold text-slate-900">{formatCurrency(tx.amount)}</td>
                    <td className="py-2.5 text-slate-500">
                      {new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-2.5">
                      <Badge status={tx.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 3: Upcoming Renewals */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Upcoming Renewals</h3>
              <p className="text-xs text-slate-400 mt-0.5">Subscriptions renewing in the next 30 days</p>
            </div>
            <button
              onClick={() => onNavigate('subscriptions')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 transition"
            >
              View all →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase">
                  <th className="pb-2.5 font-medium">Customer</th>
                  <th className="pb-2.5 font-medium">Plan</th>
                  <th className="pb-2.5 font-medium">Renewal Date</th>
                  <th className="pb-2.5 font-medium">Amount</th>
                  <th className="pb-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {upcomingRenewals.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 font-medium text-sky-600">{r.customer}</td>
                    <td className="py-2.5 text-slate-600">{r.plan}</td>
                    <td className="py-2.5 text-slate-500">
                      {new Date(r.renewalDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-2.5 font-semibold text-slate-900">{formatCurrency(r.amount)}</td>
                    <td className="py-2.5">
                      <Badge status="UPCOMING" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 4: Top Customers */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Top Customers</h3>
              <p className="text-xs text-slate-400 mt-0.5">Top customers by revenue</p>
            </div>
            <button
              onClick={() => onNavigate('customers')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 transition"
            >
              View all →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase">
                  <th className="pb-2.5 font-medium">#</th>
                  <th className="pb-2.5 font-medium">Customer</th>
                  <th className="pb-2.5 font-medium">Total Revenue</th>
                  <th className="pb-2.5 font-medium">Active Subs</th>
                  <th className="pb-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {topCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 font-medium text-slate-400">{c.rank}</td>
                    <td className="py-2.5 font-medium text-sky-600">{c.customer}</td>
                    <td className="py-2.5 font-semibold text-slate-900">{formatCurrency(c.totalRevenue)}</td>
                    <td className="py-2.5 text-slate-600">{c.activeSubs}</td>
                    <td className="py-2.5">
                      <Badge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
