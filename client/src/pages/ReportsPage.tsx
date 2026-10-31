import React, { useEffect, useState } from 'react';
import { Download, BarChart2, TrendingUp, IndianRupee, Users, FileSpreadsheet } from 'lucide-react';
import { api } from '../services/api.js';

export const ReportsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.getAnalyticsReport();
        setAnalytics(res);
      } catch (err) {
        console.error('Failed to load report analytics', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const downloadCsv = (type: 'subscriptions' | 'invoices' | 'payments') => {
    const url = api.getExportUrl(type);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brightloop_${type}.csv`;
    // Add auth token if needed, or trigger fetch download
    fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('brightloop_token')}`,
      },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `brightloop_${type}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      });
  };

  if (loading || !analytics) {
    return <div className="p-8 text-center text-slate-400 text-xs">Generating report data...</div>;
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Revenue & Business Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">Comprehensive audit reports and CSV exports for accountants and management.</p>
        </div>

        {/* CSV Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadCsv('subscriptions')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-sky-600" />
            <span>Export Subscriptions CSV</span>
          </button>
          <button
            onClick={() => downloadCsv('invoices')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Export Invoices CSV</span>
          </button>
          <button
            onClick={() => downloadCsv('payments')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Payments CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-400">Total Settled Revenue</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">₹{analytics.totalRevenue.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-slate-400 mt-1">Net collections in INR</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-400">Annual Run Rate (ARR)</p>
          <p className="text-2xl font-bold text-sky-600 mt-1">₹{analytics.arr.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-slate-400 mt-1">12 × Current Monthly Recurring</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-400">Collection Efficiency</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{analytics.collectionRate}%</p>
          <p className="text-[11px] text-slate-400 mt-1">Paid invoices vs total billed</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-400">Overdue Invoices</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{analytics.overdueInvoices}</p>
          <p className="text-[11px] text-slate-400 mt-1">Past scheduled payment terms</p>
        </div>
      </div>

      {/* Breakdown tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Channels */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Payment Collections by Channel</h3>
          <div className="space-y-3 text-xs">
            {analytics.paymentMethods.map((pm: any) => (
              <div key={pm.method} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <p className="font-semibold text-slate-800">{pm.method}</p>
                  <p className="text-[11px] text-slate-400">{pm.transactions} verified transactions</p>
                </div>
                <p className="font-bold text-slate-900 text-sm">₹{pm.amount.toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Subscription Plan Popularity</h3>
          <div className="space-y-3 text-xs">
            {analytics.planBreakdown.map((pb: any) => (
              <div key={pb.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-800">{pb.name}</span>
                <span className="font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
                  {pb.count} Subscriptions
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
