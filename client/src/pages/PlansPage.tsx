import React, { useEffect, useState } from 'react';
import { Plus, Layers, CheckCircle2, XCircle, Calendar, Edit3, Trash2 } from 'lucide-react';
import { api } from '../services/api.js';
import { SubscriptionPlan, Product } from '../types/index.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { useAuth } from '../context/AuthContext.js';

export const PlansPage: React.FC = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    productId: '',
    billingFrequency: 'MONTHLY',
    price: 32000,
    minQuantity: 1,
    autoCloseOnEnd: true,
    allowPause: true,
    allowEarlyClosure: true,
    allowRenewal: true,
    status: 'ACTIVE',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, prodsData] = await Promise.all([
        api.getPlans(),
        api.getProducts(),
      ]);
      setPlans(plansData as SubscriptionPlan[]);
      setProducts(prodsData as Product[]);
      if ((prodsData as Product[]).length > 0 && !formData.productId) {
        setFormData((prev) => ({ ...prev, productId: (prodsData as Product[])[0].id }));
      }
    } catch (err) {
      console.error('Failed to load plans', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      code: '',
      productId: products[0]?.id || '',
      billingFrequency: 'MONTHLY',
      price: 45000,
      minQuantity: 1,
      autoCloseOnEnd: true,
      allowPause: true,
      allowEarlyClosure: true,
      allowRenewal: true,
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      code: plan.code,
      productId: plan.productId,
      billingFrequency: plan.billingFrequency,
      price: plan.price,
      minQuantity: plan.minQuantity,
      autoCloseOnEnd: plan.autoCloseOnEnd,
      allowPause: plan.allowPause,
      allowEarlyClosure: plan.allowEarlyClosure,
      allowRenewal: plan.allowRenewal,
      status: plan.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await api.updatePlan(editingPlan.id, formData);
      } else {
        await api.createPlan(formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error saving plan: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscription plan?')) return;
    try {
      await api.deletePlan(id);
      loadData();
    } catch (err: any) {
      alert(`Error deleting plan: ${err.message}`);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Subscription Plans</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage recurring terms, billing frequencies, and lifecycle automation permissions.</p>
        </div>

        {user?.role === 'ADMIN' && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Plan</span>
          </button>
        )}
      </div>

      {/* Plans Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">Loading plans...</div>
        ) : plans.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">No plans configured.</div>
        ) : (
          plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{plan.name}</h3>
                      <p className="text-[11px] text-slate-400">{plan.product?.name || 'Base Software'}</p>
                    </div>
                  </div>
                  <Badge status={plan.status} />
                </div>

                {/* Price and Frequency */}
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-bold text-slate-900">
                      ₹{plan.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-slate-400 text-xs ml-1 font-medium capitalize">
                      / {plan.billingFrequency.toLowerCase()}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                    {plan.billingFrequency}
                  </span>
                </div>

                {/* Permissions checklist */}
                <div className="mt-4 space-y-2 text-xs">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Plan Permissions & Lifecycle
                  </p>

                  <div className="flex items-center justify-between text-slate-700">
                    <span className="flex items-center gap-1.5">
                      {plan.allowPause ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      )}
                      Pause Subscription Allowed
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">{plan.allowPause ? 'Yes' : 'No'}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-700">
                    <span className="flex items-center gap-1.5">
                      {plan.allowRenewal ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      )}
                      Auto-Renewal Allowed
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">{plan.allowRenewal ? 'Yes' : 'No'}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-700">
                    <span className="flex items-center gap-1.5">
                      {plan.allowEarlyClosure ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      )}
                      Early Closure Allowed
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">{plan.allowEarlyClosure ? 'Yes' : 'No'}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-700">
                    <span className="flex items-center gap-1.5">
                      {plan.autoCloseOnEnd ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-slate-300" />
                      )}
                      Auto-close when availability ends
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">{plan.autoCloseOnEnd ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {user?.role === 'ADMIN' && (
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                  <button
                    onClick={() => handleOpenEdit(plan)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-md transition"
                    title="Edit Plan"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition"
                    title="Delete Plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? `Edit Plan: ${editingPlan.name}` : 'Create Subscription Plan'}
        subtitle="Configure billing cadence, base pricing, and customer action permissions."
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Plan Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enterprise Monthly"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Associated Product *</label>
              <select
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Billing Frequency *</label>
              <select
                value={formData.billingFrequency}
                onChange={(e) => setFormData({ ...formData, billingFrequency: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Price per Cycle (₹) *</label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Permissions toggles */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <p className="font-semibold text-slate-800">Permissions & Lifecycle Settings</p>
            <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowPause}
                onChange={(e) => setFormData({ ...formData, allowPause: e.target.checked })}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
              <span>Allow Customer to Pause Subscription</span>
            </label>
            <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowRenewal}
                onChange={(e) => setFormData({ ...formData, allowRenewal: e.target.checked })}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
              <span>Allow Subscription Renewal</span>
            </label>
            <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowEarlyClosure}
                onChange={(e) => setFormData({ ...formData, allowEarlyClosure: e.target.checked })}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
              <span>Allow Early Cancellation / Closure</span>
            </label>
            <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoCloseOnEnd}
                onChange={(e) => setFormData({ ...formData, autoCloseOnEnd: e.target.checked })}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
              <span>Auto-close subscription when expiry date arrives</span>
            </label>
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
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-semibold"
            >
              Save Plan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
