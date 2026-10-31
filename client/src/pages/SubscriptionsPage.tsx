import React, { useEffect, useState } from 'react';
import { Plus, Search, Repeat, Play, Pause, RotateCw, XSquare, CheckCircle, Clock, FileSpreadsheet } from 'lucide-react';
import { api } from '../services/api.js';
import { Subscription, Customer, SubscriptionPlan } from '../types/index.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { useAuth } from '../context/AuthContext.js';

export const SubscriptionsPage: React.FC = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New sub form
  const [newSubForm, setNewSubForm] = useState({
    customerId: '',
    planId: '',
    paymentTerms: 'Net 15',
  });

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const [subs, custs, plns] = await Promise.all([
        api.getSubscriptions({ status: statusFilter, search: searchTerm }),
        api.getCustomers(),
        api.getPlans(),
      ]);
      setSubscriptions(subs as Subscription[]);
      setCustomers(custs as Customer[]);
      setPlans(plns as SubscriptionPlan[]);
      if ((custs as Customer[]).length > 0 && !newSubForm.customerId) {
        setNewSubForm((prev) => ({
          ...prev,
          customerId: (custs as Customer[])[0].id,
          planId: (plns as SubscriptionPlan[])[0]?.id || '',
        }));
      }
    } catch (err) {
      console.error('Failed to load subscriptions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, [searchTerm, statusFilter]);

  const openDetails = async (id: string) => {
    try {
      const sub = (await api.getSubscriptionById(id)) as Subscription;
      setSelectedSub(sub);
      setIsDetailsOpen(true);
    } catch (err: any) {
      alert(`Error loading subscription: ${err.message}`);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await api.activateSubscription(id);
      loadSubscriptions();
      if (selectedSub?.id === id) openDetails(id);
    } catch (err: any) {
      alert(`Error activating: ${err.message}`);
    }
  };

  const handlePause = async (id: string) => {
    const reason = prompt('Reason for pausing subscription:');
    if (reason === null) return;
    try {
      await api.pauseSubscription(id, reason);
      loadSubscriptions();
      if (selectedSub?.id === id) openDetails(id);
    } catch (err: any) {
      alert(`Error pausing: ${err.message}`);
    }
  };

  const handleResume = async (id: string) => {
    try {
      await api.resumeSubscription(id);
      loadSubscriptions();
      if (selectedSub?.id === id) openDetails(id);
    } catch (err: any) {
      alert(`Error resuming: ${err.message}`);
    }
  };

  const handleRenew = async (id: string) => {
    if (!confirm('Renew this subscription for the next billing cycle?')) return;
    try {
      await api.renewSubscription(id);
      loadSubscriptions();
      if (selectedSub?.id === id) openDetails(id);
    } catch (err: any) {
      alert(`Error renewing: ${err.message}`);
    }
  };

  const handleClose = async (id: string) => {
    const reason = prompt('Reason for closing subscription:');
    if (reason === null) return;
    try {
      await api.closeSubscription(id, reason);
      loadSubscriptions();
      if (selectedSub?.id === id) openDetails(id);
    } catch (err: any) {
      alert(`Error closing: ${err.message}`);
    }
  };

  const handleCreateSub = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSubscription(newSubForm);
      setIsCreateOpen(false);
      loadSubscriptions();
    } catch (err: any) {
      alert(`Error creating subscription: ${err.message}`);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Subscription Lifecycle Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Control recurring contracts, audit billing intervals, and manage state transitions.</p>
        </div>

        {user?.role !== 'CUSTOMER' && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Subscription</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by subscription #, customer name, or plan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'ACTIVE', 'PAUSED', 'CLOSED', 'DRAFT'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                statusFilter === s
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {s === 'ALL' ? 'All Statuses' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4"># Subscription</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Plan & Frequency</th>
                <th className="py-3 px-4">Current Period End</th>
                <th className="py-3 px-4">Next Billing Date</th>
                <th className="py-3 px-4">Recurring Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">Loading subscriptions...</td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">No subscriptions matching criteria.</td>
                </tr>
              ) : (
                subscriptions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.subscriptionNumber}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-sky-600">{s.customer?.name}</div>
                      <div className="text-[11px] text-slate-400">{s.customer?.company}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <span className="font-medium">{s.plan?.name}</span>
                      <span className="text-[10px] text-slate-400 ml-1">({s.billingFrequency})</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(s.currentPeriodEnd).toLocaleDateString('en-GB')}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {new Date(s.nextBillingDate).toLocaleDateString('en-GB')}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ₹{s.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={s.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => openDetails(s.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition"
                      >
                        Details
                      </button>

                      {s.status === 'PAUSED' ? (
                        <button
                          onClick={() => handleResume(s.id)}
                          title="Resume Subscription"
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <Play className="w-3.5 h-3.5 inline" />
                        </button>
                      ) : s.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handlePause(s.id)}
                          title="Pause Subscription"
                          className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                        >
                          <Pause className="w-3.5 h-3.5 inline" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(s.id)}
                          title="Activate Subscription"
                          className="p-1 text-sky-600 hover:bg-sky-50 rounded"
                        >
                          <Play className="w-3.5 h-3.5 inline" />
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

      {/* Subscription Details Modal */}
      {selectedSub && (
        <Modal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          title={`Subscription: ${selectedSub.subscriptionNumber}`}
          subtitle={`${selectedSub.customer?.name} • ${selectedSub.plan?.name}`}
          maxWidth="3xl"
        >
          <div className="space-y-6 text-xs">
            {/* Status & Action Bar */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Badge status={selectedSub.status} />
                <span className="text-slate-600">
                  Billing cycle: <strong className="capitalize">{selectedSub.billingFrequency.toLowerCase()}</strong>
                </span>
                <span className="text-slate-600">
                  Next Invoice Date: <strong>{new Date(selectedSub.nextBillingDate).toLocaleDateString('en-GB')}</strong>
                </span>
              </div>

              {/* Action Buttons respecting permissions */}
              <div className="flex items-center gap-2">
                {selectedSub.status === 'ACTIVE' && (
                  <>
                    <button
                      onClick={() => handleRenew(selectedSub.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded shadow-xs"
                    >
                      <RotateCw className="w-3 h-3 text-sky-600" /> Renew
                    </button>
                    <button
                      onClick={() => handlePause(selectedSub.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-amber-700 rounded shadow-xs"
                    >
                      <Pause className="w-3 h-3" /> Pause
                    </button>
                    <button
                      onClick={() => handleClose(selectedSub.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded shadow-xs"
                    >
                      <XSquare className="w-3 h-3" /> Close Early
                    </button>
                  </>
                )}

                {selectedSub.status === 'PAUSED' && (
                  <button
                    onClick={() => handleResume(selectedSub.id)}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-xs"
                  >
                    <Play className="w-3 h-3" /> Resume Subscription
                  </button>
                )}

                {['DRAFT', 'QUOTATION', 'CONFIRMED'].includes(selectedSub.status) && (
                  <button
                    onClick={() => handleActivate(selectedSub.id)}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded shadow-xs"
                  >
                    <Play className="w-3 h-3" /> Activate Subscription
                  </button>
                )}
              </div>
            </div>

            {/* Product Lines */}
            <div>
              <h4 className="font-bold text-slate-800 mb-2">Subscribed Products & Licenses</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase text-slate-400 font-semibold">
                    <tr>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Price</th>
                      <th className="py-2 px-3 text-right">GST Rate</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedSub.lines.map((l, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-medium text-slate-800">{l.description}</td>
                        <td className="py-2 px-3 text-center">{l.quantity}</td>
                        <td className="py-2 px-3 text-right">₹{l.unitPrice.toLocaleString('en-IN')}</td>
                        <td className="py-2 px-3 text-right">{l.taxRate}%</td>
                        <td className="py-2 px-3 text-right font-semibold">₹{l.totalAmount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Generated Invoices */}
            <div>
              <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-sky-600" />
                Recurring Invoices Generated ({selectedSub.invoices?.length || 0})
              </h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase text-slate-400 font-semibold">
                    <tr>
                      <th className="py-2 px-3">Invoice #</th>
                      <th className="py-2 px-3">Issue Date</th>
                      <th className="py-2 px-3">Due Date</th>
                      <th className="py-2 px-3">Amount</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedSub.invoices?.map((inv) => (
                      <tr key={inv.id}>
                        <td className="py-2 px-3 font-mono font-semibold text-slate-800">{inv.invoiceNumber}</td>
                        <td className="py-2 px-3 text-slate-500">{new Date(inv.issueDate).toLocaleDateString('en-GB')}</td>
                        <td className="py-2 px-3 text-slate-500">{new Date(inv.dueDate).toLocaleDateString('en-GB')}</td>
                        <td className="py-2 px-3 font-semibold">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                        <td className="py-2 px-3">
                          <Badge status={inv.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Audit History Timeline */}
            <div>
              <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> Complete Audit Trail
              </h4>
              <div className="space-y-2 border-l-2 border-slate-200 pl-4 ml-1">
                {selectedSub.history?.map((h) => (
                  <div key={h.id} className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-sky-500 ring-2 ring-white" />
                    <p className="font-semibold text-slate-800">
                      {h.action} <span className="text-slate-400 font-normal">by {h.performedBy || 'System'}</span>
                    </p>
                    {h.notes && <p className="text-slate-600 mt-0.5">{h.notes}</p>}
                    <span className="text-[10px] text-slate-400">
                      {new Date(h.createdAt).toLocaleString('en-GB')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Subscription Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Subscription"
        subtitle="Initiate a recurring subscription directly for an enterprise customer."
        maxWidth="md"
      >
        <form onSubmit={handleCreateSub} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Customer *</label>
            <select
              value={newSubForm.customerId}
              onChange={(e) => setNewSubForm({ ...newSubForm, customerId: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Subscription Plan *</label>
            <select
              value={newSubForm.planId}
              onChange={(e) => setNewSubForm({ ...newSubForm, planId: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ₹{p.price.toLocaleString('en-IN')} / {p.billingFrequency.toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Payment Terms</label>
            <select
              value={newSubForm.paymentTerms}
              onChange={(e) => setNewSubForm({ ...newSubForm, paymentTerms: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            >
              <option value="Net 15">Net 15 Days</option>
              <option value="Net 30">Net 30 Days</option>
              <option value="Immediate">Immediate on Due</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-semibold"
            >
              Confirm Subscription
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
