import React, { useEffect, useState } from 'react';
import { Search, Plus, Printer, CreditCard, Zap, CheckCircle2, Send, XCircle } from 'lucide-react';
import { api } from '../services/api.js';
import { Invoice, Customer } from '../types/index.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { useAuth } from '../context/AuthContext.js';

export const InvoicesPage: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'UPI' | 'CARD' | 'CASH'>('UPI');
  const [paymentNotes, setPaymentNotes] = useState('');

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = (await api.getInvoices({ status: statusFilter, search: searchTerm })) as Invoice[];
      setInvoices(res);
    } catch (err) {
      console.error('Failed to load invoices', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [searchTerm, statusFilter]);

  const openInvoiceDetails = async (id: string) => {
    try {
      const inv = (await api.getInvoiceById(id)) as Invoice;
      setSelectedInvoice(inv);
      setIsDetailsOpen(true);
    } catch (err: any) {
      alert(`Error loading invoice: ${err.message}`);
    }
  };

  const openPaymentModal = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPaymentAmount(inv.outstandingAmount);
    setIsPaymentOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      await api.recordPayment({
        invoiceId: selectedInvoice.id,
        amount: Number(paymentAmount),
        paymentMethod,
        notes: paymentNotes || 'Settlement against invoice balance',
      });
      setIsPaymentOpen(false);
      setIsDetailsOpen(false);
      loadInvoices();
    } catch (err: any) {
      alert(`Payment error: ${err.message}`);
    }
  };

  const handleTriggerRecurringBilling = async () => {
    try {
      setIsTriggering(true);
      const res = (await api.triggerRecurringBilling()) as any;
      alert(`Automated Recurring Billing Completed!\n• Invoices Generated: ${res.generated}\n• Periods Skipped (Idempotent): ${res.skipped}\n• Auto-Closed Expired: ${res.autoClosed}`);
      loadInvoices();
    } catch (err: any) {
      alert(`Error running recurring billing: ${err.message}`);
    } finally {
      setIsTriggering(false);
    }
  };

  const handleSendInvoice = async (id: string) => {
    try {
      await api.sendInvoice(id);
      loadInvoices();
      if (selectedInvoice?.id === id) openInvoiceDetails(id);
    } catch (err: any) {
      alert(`Error sending invoice: ${err.message}`);
    }
  };

  const handleCancelInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this invoice?')) return;
    try {
      await api.cancelInvoice(id);
      loadInvoices();
      if (selectedInvoice?.id === id) openInvoiceDetails(id);
    } catch (err: any) {
      alert(`Error cancelling invoice: ${err.message}`);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Invoice Management & Billing</h2>
          <p className="text-xs text-slate-500 mt-0.5">Automated recurring billing, GST invoices, and collection reconciliation.</p>
        </div>

        {user?.role !== 'CUSTOMER' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerRecurringBilling}
              disabled={isTriggering}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold rounded-lg border border-sky-200 transition"
            >
              <Zap className={`w-3.5 h-3.5 ${isTriggering ? 'animate-spin' : ''}`} />
              <span>{isTriggering ? 'Processing Billing...' : '⚡ Run Recurring Billing Engine'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by invoice # (e.g. INV-2026-1187) or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'SENT', 'CONFIRMED', 'PAID', 'PARTIALLY_PAID', 'OVERDUE'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition ${
                statusFilter === s
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {s === 'ALL' ? 'All Invoices' : s.charAt(0) + s.slice(1).toLowerCase().replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Outstanding</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">Loading invoices...</td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">No invoices found.</td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{inv.customer?.name}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(inv.issueDate).toLocaleDateString('en-GB')}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(inv.dueDate).toLocaleDateString('en-GB')}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-semibold">₹{inv.paidAmount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">
                      ₹{inv.outstandingAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={inv.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => openInvoiceDetails(inv.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition"
                      >
                        View / PDF
                      </button>

                      {inv.outstandingAmount > 0 && inv.status !== 'CANCELLED' && (
                        <button
                          onClick={() => openPaymentModal(inv)}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition"
                        >
                          Record Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details / Printable View Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          title={`Tax Invoice: ${selectedInvoice.invoiceNumber}`}
          subtitle={`Issued: ${new Date(selectedInvoice.issueDate).toLocaleDateString('en-GB')} • Due: ${new Date(selectedInvoice.dueDate).toLocaleDateString('en-GB')}`}
          maxWidth="3xl"
        >
          <div className="space-y-6 text-xs bg-white p-6 border border-slate-200 rounded-xl" id="printable-invoice">
            {/* Header branding */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Brightloop Software</h3>
                <p className="text-slate-500 text-[11px] mt-0.5">Infopark Technology Campus, Kakkanad, Kochi, Kerala</p>
                <p className="text-slate-500 text-[11px]">GSTIN: 32AABCB1234F1Z9 • billing@brightloop.io</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold font-mono text-slate-900">{selectedInvoice.invoiceNumber}</span>
                <div className="mt-1">
                  <Badge status={selectedInvoice.status} />
                </div>
              </div>
            </div>

            {/* Billed To */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-slate-400 uppercase text-[10px]">Billed To</p>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedInvoice.customer.name}</p>
                <p className="text-slate-600">{selectedInvoice.customer.company}</p>
                <p className="text-slate-500">{selectedInvoice.customer.billingAddress || selectedInvoice.customer.email}</p>
                <p className="text-slate-500 font-mono mt-0.5">GSTIN: {selectedInvoice.customer.taxNumber || 'Unregistered'}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-400 uppercase text-[10px]">Payment Terms</p>
                <p className="text-slate-700 font-medium mt-0.5">{selectedInvoice.paymentTerms || 'Net 15 Days'}</p>
                {selectedInvoice.subscription && (
                  <p className="text-slate-500 mt-1 font-mono">Sub Ref: {selectedInvoice.subscription.subscriptionNumber}</p>
                )}
              </div>
            </div>

            {/* Line items table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase text-slate-500 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">GST Rate</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoice.lines.map((line, i) => (
                    <tr key={i}>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{line.description}</td>
                      <td className="py-2.5 px-3 text-center">{line.quantity}</td>
                      <td className="py-2.5 px-3 text-right">₹{line.unitPrice.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right">{line.taxRate}%</td>
                      <td className="py-2.5 px-3 text-right font-semibold">₹{line.totalAmount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial summary breakdown */}
            <div className="flex justify-end pt-2">
              <div className="w-72 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-800">₹{selectedInvoice.subtotal.toLocaleString('en-IN')}</span>
                </div>
                {selectedInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount Applied:</span>
                    <span>-₹{selectedInvoice.discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>GST (18% Standard):</span>
                  <span className="font-semibold text-slate-800">₹{selectedInvoice.taxAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Invoice Total:</span>
                  <span>₹{selectedInvoice.totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Amount Paid:</span>
                  <span>₹{selectedInvoice.paidAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-rose-600 pt-1 border-t border-dashed border-slate-200">
                  <span>Balance Outstanding:</span>
                  <span>₹{selectedInvoice.outstandingAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Payment history on this invoice */}
            {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
              <div>
                <p className="font-bold text-slate-800 mb-1.5">Recorded Payments</p>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-semibold">
                      <tr>
                        <th className="py-1.5 px-3">Receipt #</th>
                        <th className="py-1.5 px-3">Method</th>
                        <th className="py-1.5 px-3">Date</th>
                        <th className="py-1.5 px-3">Reference</th>
                        <th className="py-1.5 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedInvoice.payments.map((p) => (
                        <tr key={p.id}>
                          <td className="py-1.5 px-3 font-semibold text-slate-800">{p.paymentNumber}</td>
                          <td className="py-1.5 px-3">{p.paymentMethod}</td>
                          <td className="py-1.5 px-3 text-slate-500">{new Date(p.paymentDate).toLocaleDateString('en-GB')}</td>
                          <td className="py-1.5 px-3 font-mono text-[11px]">{p.transactionRef}</td>
                          <td className="py-1.5 px-3 text-right font-bold text-emerald-600">₹{p.amount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Bottom action buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition"
              >
                <Printer className="w-3.5 h-3.5" /> Print / PDF
              </button>

              <div className="flex items-center gap-2">
                {user?.role !== 'CUSTOMER' && selectedInvoice.status === 'DRAFT' && (
                  <button
                    onClick={() => handleSendInvoice(selectedInvoice.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold transition"
                  >
                    <Send className="w-3.5 h-3.5" /> Confirm & Send
                  </button>
                )}

                {selectedInvoice.outstandingAmount > 0 && selectedInvoice.status !== 'CANCELLED' && (
                  <button
                    onClick={() => {
                      setIsDetailsOpen(false);
                      openPaymentModal(selectedInvoice);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition shadow-xs"
                  >
                    <CreditCard className="w-4 h-4" /> Record Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Record Payment Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          title={`Record Payment for ${selectedInvoice.invoiceNumber}`}
          subtitle={`Customer: ${selectedInvoice.customer?.name} • Total Outstanding: ₹${selectedInvoice.outstandingAmount.toLocaleString('en-IN')}`}
          maxWidth="md"
        >
          <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Payment Amount (₹) *</label>
              <input
                type="number"
                step="any"
                max={selectedInvoice.outstandingAmount}
                min={1}
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Must not exceed outstanding amount of ₹{selectedInvoice.outstandingAmount.toLocaleString('en-IN')}.
              </p>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Payment Method *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              >
                <option value="UPI">UPI (GooglePay / PhonePe / QR)</option>
                <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="CASH">Cash Settlement</option>
                <option value="OTHER">Other Remittance</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Transaction Reference / UTR</label>
              <input
                type="text"
                placeholder="e.g. UTR-HDFC-99887711"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Notes</label>
              <input
                type="text"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Optional payment notes"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPaymentOpen(false)}
                className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold"
              >
                Confirm Payment
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
