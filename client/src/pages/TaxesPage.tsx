import React, { useEffect, useState } from 'react';
import { Plus, Percent, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { api } from '../services/api.js';
import { TaxRule } from '../types/index.js';
import { Modal } from '../components/common/Modal.js';
import { useAuth } from '../context/AuthContext.js';

export const TaxesPage: React.FC = () => {
  const { user } = useAuth();
  const [taxes, setTaxes] = useState<TaxRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    rate: 18,
    type: 'PERCENTAGE',
    applicableProductTypes: 'ALL',
    isActive: true,
  });

  const loadTaxes = async () => {
    try {
      setLoading(true);
      const res = (await api.getTaxes()) as TaxRule[];
      setTaxes(res);
    } catch (err) {
      console.error('Failed to load taxes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTaxes();
  }, []);

  const handleCreateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTax(formData);
      setIsModalOpen(false);
      loadTaxes();
    } catch (err: any) {
      alert(`Error creating tax: ${err.message}`);
    }
  };

  const handleDeleteTax = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tax rule?')) return;
    try {
      await api.deleteTax(id);
      loadTaxes();
    } catch (err: any) {
      alert(`Error deleting tax: ${err.message}`);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Tax Configuration (GST Engine)</h2>
          <p className="text-xs text-slate-500 mt-0.5">Automated GST calculations, tax schedules, and export compliance.</p>
        </div>

        {user?.role === 'ADMIN' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Tax Rule</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Tax Name</th>
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Rate (%)</th>
              <th className="py-3 px-4">Scope</th>
              <th className="py-3 px-4">Status</th>
              {user?.role === 'ADMIN' && <th className="py-3 px-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">Loading taxes...</td>
              </tr>
            ) : (
              taxes.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs">
                      %
                    </div>
                    {t.name}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{t.code}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{t.rate}%</td>
                  <td className="py-3 px-4 text-slate-600 uppercase text-[11px]">{t.applicableProductTypes}</td>
                  <td className="py-3 px-4">
                    {t.isActive ? (
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
                        onClick={() => handleDeleteTax(t.id)}
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
        title="Add Tax Rule"
        subtitle="Configure Indian GST rate or specialized tax rate for invoices."
        maxWidth="md"
      >
        <form onSubmit={handleCreateTax} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Tax Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. GST 18% (Standard)"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Tax Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="GST-18"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Percentage Rate (%) *</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
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
              Save Tax Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
