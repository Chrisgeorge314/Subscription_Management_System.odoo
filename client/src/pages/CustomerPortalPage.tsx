import React, { useEffect, useState } from 'react';
import { Repeat, FileSpreadsheet, CreditCard, RotateCw, Pause, Play, XSquare, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api.js';
import { Customer, Subscription, Invoice, Payment } from '../types/index.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { useAuth } from '../context/AuthContext.js';

export const CustomerPortalPage: React.FC = () => {
  const { user } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'UPI' | 'CARD' | 'BANK_TRANSFER'>('UPI');

  const loadCustomerPortal = async () => {
    try {
      setLoading(true);
      if (user?.customerId) {
        const cust = (await api.getCustomerById(user.customerId)) as Customer;
        setCustomer(cust);
      }
    } catch (err) {
      console.error('Failed to load portal data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerPortal();
  }, [user]);

  const handlePayInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      await api.recordPayment({
        invoiceId: selectedInvoice.id,
        amount: Number(payAmount),
        paymentMethod: payMethod,
        transactionRef: `PORTAL-UPI-${Date.now().toString().slice(-6)}`,
        notes: 'Paid via Customer Self-Service Portal',
      });
      setIsPayOpen(false);
      loadCustomerPortal();
    } catch (err: any) {
      alert(`Payment error: ${err.message}`);
    }
  };

  const handlePauseSub = async (sub: Subscription) => {
    if (!sub.plan.allowPause) {
      alert('This subscription plan does not allow pausing.');
      return;
    }
    const reason = prompt('Reason for pause:');
    if (reason === null) return;
    try {
      await api.pauseSubscription(sub.id, reason);
      loadCustomerPortal();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleResumeSub = async (sub: Subscription) => {
    try {
      await api.resumeSubscription(sub.id);
      loadCustomerPortal();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleRenewSub = async (sub: Subscription) => {
    if (!sub.plan.allowRenewal) {
      alert('This subscription plan does not allow renewal.');
      return;
    }
    if (!confirm('Confirm subscription renewal for the next cycle?')) return;
    try {
      await api.renewSubscription(sub.id);
      loadCustomerPortal();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading || !customer) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading customer portal...</div>;
  }

  const activeSubscriptions = customer.subscriptions?.filter((s) => s.status === 'ACTIVE') || [];
  const totalOutstanding = customer.invoices?.reduce((s, i) => s + i.outstandingAmount, 0) || 0;
  const nextRenewal = activeSubscriptions[0]?.nextBillingDate;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-sky-400">Customer Self-Service Portal</span>
        <h2 className="text-2xl font-bold mt-1">{customer.company || customer.name}</h2>
        <p className="text-xs text-slate-300 mt-1 max-w-xl">
          Welcome to your Brightloop subscription center. Manage active contracts, review GST invoices, and settle outstanding balances securely.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Repeat className="w-3.5 h-3.5 text-sky-600" /> Active Subscriptions
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{activeSubscriptions.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Contracts currently running</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-rose-500" /> Total Outstanding
          </p>
          <p className="text-2xl font-bold text-rose-600 mt-2">₹{totalOutstanding.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-slate-400 mt-1">Pending invoice balance</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" /> Next Upcoming Renewal
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {nextRenewal ? new Date(nextRenewal).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'None'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Automated recurring billing date</p>
        </div>
      </div>

      {/* Subscriptions Section */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4">My Subscriptions</h3>
        <div className="space-y-4">
          {customer.subscriptions?.map((sub) => (
            <div key={sub.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 text-sm">{sub.subscriptionNumber}</span>
                  <Badge status={sub.status} />
                </div>
                <p className="font-semibold text-slate-700 text-xs mt-1">{sub.plan?.name}</p>
                <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-1">
                  <span>Cycle: <strong className="text-slate-600 capitalize">{sub.billingFrequency.toLowerCase()}</strong></span>
                  <span>Renew Date: <strong className="text-slate-600">{new Date(sub.nextBillingDate).toLocaleDateString('en-GB')}</strong></span>
                  <span>Amount: <strong className="text-slate-900">₹{sub.totalAmount.toLocaleString('en-IN')}</strong></span>
                </div>
              </div>

              {/* Actions respecting plan permissions */}
              <div className="flex items-center gap-2 text-xs">
                {sub.status === 'ACTIVE' && (
                  <>
                    {sub.plan?.allowRenewal && (
                      <button
                        onClick={() => handleRenewSub(sub)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg shadow-xs"
                      >
                        <RotateCw className="w-3.5 h-3.5 text-sky-600" /> Renew
                      </button>
                    )}
                    {sub.plan?.allowPause && (
                      <button
                        onClick={() => handlePauseSub(sub)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-amber-700 font-semibold rounded-lg shadow-xs"
                      >
                        <Pause className="w-3.5 h-3.5" /> Pause
                      </button>
                    )}
                  </>
                )}

                {sub.status === 'PAUSED' && (
                  <button
                    onClick={() => handleResumeSub(sub)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5" /> Resume Subscription
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invoices Section */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4">My Invoices & Receipts</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3">Issue Date</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3 text-right">Total</th>
                <th className="py-2.5 px-3 text-right">Outstanding</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customer.invoices?.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                  <td className="py-2.5 px-3 text-slate-500">{new Date(inv.issueDate).toLocaleDateString('en-GB')}</td>
                  <td className="py-2.5 px-3 text-slate-500">{new Date(inv.dueDate).toLocaleDateString('en-GB')}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-rose-600">₹{inv.outstandingAmount.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3">
                    <Badge status={inv.status} />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {inv.outstandingAmount > 0 && (
                      <button
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setPayAmount(inv.outstandingAmount);
                          setIsPayOpen(true);
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md shadow-xs"
                      >
                        Pay Now
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={isPayOpen}
          onClose={() => setIsPayOpen(false)}
          title={`Pay Invoice: ${selectedInvoice.invoiceNumber}`}
          subtitle={`Instant settlement for ₹${selectedInvoice.outstandingAmount.toLocaleString('en-IN')}`}
          maxWidth="md"
        >
          <form onSubmit={handlePayInvoice} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <p className="text-[11px] text-slate-500">Scan UPI QR / Pay to VPA</p>
              <div className="w-32 h-32 mx-auto my-2 bg-white p-2 rounded-lg border border-slate-300 flex items-center justify-center font-mono text-[10px] text-slate-400">
                [ UPI QR CODE ]
              </div>
              <p className="font-mono text-xs font-bold text-slate-800">brightloop.pay@hdfcbank</p>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Payment Method</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="BANK_TRANSFER">NetBanking / NEFT</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Amount to Settle (₹)</label>
              <input
                type="number"
                value={payAmount}
                max={selectedInvoice.outstandingAmount}
                min={1}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPayOpen(false)}
                className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold"
              >
                Complete Payment
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
