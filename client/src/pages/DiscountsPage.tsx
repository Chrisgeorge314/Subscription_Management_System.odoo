import React, { useEffect, useState } from 'react';
import { Plus, Tag, CheckCircle2, Trash2 } from 'lucide-react';
import { api } from '../services/api.js';
import { DiscountRule } from '../types/index.js';
import { Modal } from '../components/common/Modal.js';
import { useAuth } from '../context/AuthContext.js';

export const DiscountsPage: React.FC = () => {
  const { user } = useAuth();
  const [discounts, setDiscounts] = useState<DiscountRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'PERCENTAGE',
    value: 15,
    scope: 'SUBSCRIPTION',
    minPurchaseAmount: 10000,
    maxUsageCount: 100,
    isActive: true,
  });

  const loadDiscounts = async () => {
    try {
      setLoading(true);
      const res = (await api.getDiscounts()) as DiscountRule[];
      setDiscounts(res);
    } catch (err) {
      console.error('Failed to load discounts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiscounts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDiscount(formData);
      setIsModalOpen(false);
      loadDiscounts();
    } catch (err: any) {
      alert(`Error creating discount: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount rule?')) return;
    try {
      await api.deleteDiscount(id);
      loadDiscounts();
    } catch (err: any) {
      alert(`Error deleting discount: ${err.message}`);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Discount Engine</h2>
          <p className="text-xs text-slate-500 mt-0.5">Automated discount coupons, whole-contract incentives, and usage ceilings.</p>
        </div>

        {user?.role === 'ADMIN' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Discount Rule</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Rule Name</th>
              <th className="py-3 px-4">Coupon Code</th>
              <th className="py-3 px-4">Discount Value</th>
              <th className="py-3 px-4">Min Spend</th>
              <th className="py-3 px-4">Usage Limit</th>
              <th className="py-3 px-4">Status</th>
              {user?.role === 'ADMIN' && <th className="py-3 px-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">Loading discount rules...</td>
              </tr>
            ) : (
              discounts.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-sky-600" />
                    {d.name}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-sky-700 bg-sky-50/50 px-2 py-0.5 rounded border border-sky-100 inline-block my-2">
                    {d.code}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800">
                    {d.type === 'PERCENTAGE' ? `${d.value}% Off` : `₹${d.value.toLocaleString('en-IN')} Flat`}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {d.minPurchaseAmount ? `₹${d.minPurchaseAmount.toLocaleString('en-IN')}` : 'None'}
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    <span className="font-semibold">{d.currentUsageCount}</span> / {d.maxUsageCount || '∞'}
                  </td>
                  <td className="py-3 px-4">
                    {d.isActive ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px] font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full text-[10px]">
                        Inactive
                      </span>
                    )}
                  </td>
                  {user?.role === 'ADMIN' && (
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Discount Rule"
        subtitle="Automate promotional or contract discounts on subscription invoices."
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Rule Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Early Adopter 15%"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Coupon Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="EARLY15"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono uppercase focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Discount Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Value *</label>
              <input
                type="number"
                required
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Min Purchase (₹)</label>
              <input
                type="number"
                value={formData.minPurchaseAmount}
                onChange={(e) => setFormData({ ...formData, minPurchaseAmount: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Maximum Usage Count</label>
            <input
              type="number"
              value={formData.maxUsageCount}
              onChange={(e) => setFormData({ ...formData, maxUsageCount: Number(e.target.value) })}
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
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-semibold"
            >
              Save Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
