import React, { useEffect, useState } from 'react';
import { Search, CreditCard, Plus, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api.js';
import { Payment, Invoice } from '../types/index.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { useAuth } from '../context/AuthContext.js';

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<'UPI' | 'BANK_TRANSFER' | 'CARD' | 'CASH'>('UPI');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [payData, invData] = await Promise.all([
        api.getPayments({ method: methodFilter }),
        api.getInvoices({ status: 'ALL' }),
      ]);
      setPayments(payData as Payment[]);

      const outstanding = (invData as Invoice[]).filter(
        (i) => i.outstandingAmount > 0 && i.status !== 'CANCELLED'
      );
      setUnpaidInvoices(outstanding);

      if (outstanding.length > 0 && !selectedInvoiceId) {
        setSelectedInvoiceId(outstanding[0].id);
        setAmount(outstanding[0].outstandingAmount);
      }
    } catch (err) {
      console.error('Failed to load payments data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [methodFilter]);

  const handleInvoiceSelect = (id: string) => {
    setSelectedInvoiceId(id);
    const inv = unpaidInvoices.find((i) => i.id === id);
    if (inv) setAmount(inv.outstandingAmount);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const inv = unpaidInvoices.find((i) => i.id === selectedInvoiceId);
    if (!inv) return;

    if (amount > inv.outstandingAmount) {
      alert(`Payment cannot exceed outstanding invoice balance of ₹${inv.outstandingAmount.toLocaleString('en-IN')}`);
      return;
    }

    try {
      await api.recordPayment({
        invoiceId: selectedInvoiceId,
        amount: Number(amount),
        paymentMethod: method,
        transactionRef: reference,
        notes,
      });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error recording payment: ${err.message}`);
    }
  };

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Payment Collections & Ledger</h2>
          <p className="text-xs text-slate-500 mt-0.5">Track multi-channel payment receipts, UPI settlements, and reconcile invoices.</p>
        </div>

        {user?.role !== 'CUSTOMER' && unpaidInvoices.length > 0 && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-400">Total Collected</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">₹{totalCollected.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-slate-400 mt-1">{payments.length} successful transactions</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-400">Invoices Awaiting Payment</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{unpaidInvoices.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Outstanding pending reconciliation</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-400">Primary Payment Gateway</p>
          <p className="text-2xl font-bold text-teal-600 mt-1">UPI / Direct NetBanking</p>
          <p className="text-[11px] text-slate-400 mt-1">Instant real-time verification</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          {['ALL', 'UPI', 'BANK_TRANSFER', 'CARD', 'CASH'].map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                methodFilter === m
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {m === 'ALL' ? 'All Channels' : m.replace('_', ' ')}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Showing {payments.length} transactions
        </span>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Transaction Ref</th>
                <th className="py-3 px-4">Payment Date</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">Loading transactions...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">No payment records found.</td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.paymentNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{p.customer?.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{p.invoice?.invoiceNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">{p.paymentMethod}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{p.transactionRef || '—'}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(p.paymentDate).toLocaleDateString('en-GB')}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">₹{p.amount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4">
                      <Badge status={p.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Customer Payment"
        subtitle="Select outstanding invoice and record verified settlement."
        maxWidth="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Select Outstanding Invoice *</label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => handleInvoiceSelect(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            >
              {unpaidInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} — {inv.customer?.name} (Outstanding: ₹{inv.outstandingAmount.toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Amount to Pay (₹) *</label>
            <input
              type="number"
              step="any"
              min={1}
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Payment Method *</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            >
              <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
              <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS)</option>
              <option value="CARD">Corporate Credit / Debit Card</option>
              <option value="CASH">Cash Settlement</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Transaction Reference / UTR Number</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. UPI-HDFC-99882244"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Settlement notes"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold"
            >
              Record Payment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
