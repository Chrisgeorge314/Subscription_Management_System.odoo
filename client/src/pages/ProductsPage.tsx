import React, { useEffect, useState } from 'react';
import { Plus, Search, Package, Trash2, Edit3, Tag } from 'lucide-react';
import { api } from '../services/api.js';
import { Product } from '../types/index.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { useAuth } from '../context/AuthContext.js';

export const ProductsPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'SERVICE',
    salesPrice: 15000,
    costPrice: 5000,
    description: '',
    status: 'ACTIVE',
    variants: [
      { name: 'Standard Edition', sku: 'STD', additionalPrice: 0, isDefault: true },
      { name: 'ODOO Brand Integration Tier', sku: 'ODOO', additionalPrice: 560, isDefault: false },
    ],
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = (await api.getProducts({ search: searchTerm })) as Product[];
      setProducts(res);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [searchTerm]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      code: '',
      type: 'SERVICE',
      salesPrice: 20000,
      costPrice: 5000,
      description: '',
      status: 'ACTIVE',
      variants: [
        { name: 'Standard Edition', sku: 'STD', additionalPrice: 0, isDefault: true },
        { name: 'ODOO Brand Integration Tier', sku: 'ODOO', additionalPrice: 560, isDefault: false },
      ],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      code: p.code,
      type: p.type,
      salesPrice: p.salesPrice,
      costPrice: p.costPrice,
      description: p.description || '',
      status: p.status,
      variants: p.variants.map((v) => ({
        name: v.name,
        sku: v.sku || '',
        additionalPrice: v.additionalPrice,
        isDefault: v.isDefault,
      })),
    });
    setIsModalOpen(true);
  };

  const handleAddVariant = () => {
    setFormData({
      ...formData,
      variants: [
        ...formData.variants,
        { name: '', sku: '', additionalPrice: 0, isDefault: false },
      ],
    });
  };

  const handleRemoveVariant = (index: number) => {
    if (formData.variants.length === 1) return;
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index),
    });
  };

  const handleVariantChange = (index: number, field: string, val: any) => {
    const updated = [...formData.variants];
    updated[index] = { ...updated[index], [field]: val };
    setFormData({ ...formData, variants: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, formData);
      } else {
        await api.createProduct(formData);
      }
      setIsModalOpen(false);
      loadProducts();
    } catch (err: any) {
      alert(`Error saving product: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.deleteProduct(id);
      loadProducts();
    } catch (err: any) {
      alert(`Error deleting product: ${err.message}`);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Products & Variants</h2>
          <p className="text-xs text-slate-500 mt-0.5">Define your software catalogs, recurring licenses, and price-adjusting variants.</p>
        </div>

        {user?.role === 'ADMIN' && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Product</span>
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search products by title, SKU, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
          />
        </div>
        <div className="text-xs text-slate-500">
          Total Products: <span className="font-semibold text-slate-900">{products.length}</span>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">Loading product catalog...</div>
        ) : products.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">No products found.</div>
        ) : (
          products.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                      <span className="font-mono text-[10px] text-slate-400">{p.code}</span>
                    </div>
                  </div>
                  <Badge status={p.status} />
                </div>

                <p className="text-xs text-slate-500 mt-3 line-clamp-2">{p.description || 'Enterprise subscription service.'}</p>

                {/* Base Price */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Base Price</span>
                  <span className="text-lg font-bold text-slate-900">
                    ₹{p.salesPrice.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Variants List with dynamic price increase display */}
                <div className="mt-3">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Available Variants ({p.variants.length})
                  </p>
                  <div className="space-y-1.5">
                    {p.variants.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-100"
                      >
                        <span className="text-slate-700 font-medium">
                          {v.name} {v.isDefault && <span className="text-[10px] text-sky-600 font-semibold">(Default)</span>}
                        </span>
                        <span className="font-bold text-slate-900">
                          {v.additionalPrice > 0 ? (
                            <span className="text-teal-600">+₹{v.additionalPrice.toLocaleString('en-IN')}</span>
                          ) : (
                            <span className="text-slate-400 font-normal">Included</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {user?.role === 'ADMIN' && (
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-md transition"
                    title="Edit Product"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition"
                    title="Delete Product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? `Edit Product: ${editingProduct.name}` : 'Create New Product'}
        subtitle="Configure product parameters and configure multi-variant additional pricing."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Brightloop ERP Suite"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Product Code / SKU</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="PRD-ERP-01"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Product Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              >
                <option value="SERVICE">Service (SaaS)</option>
                <option value="DIGITAL">Digital Addon</option>
                <option value="PHYSICAL">Physical Terminal</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Sales Base Price (₹) *</label>
              <input
                type="number"
                required
                value={formData.salesPrice}
                onChange={(e) => setFormData({ ...formData, salesPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Cost Price (₹)</label>
              <input
                type="number"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Description / Notes</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enterprise subscription features and scope..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          {/* Variants Configuration Section */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-bold text-slate-800">Product Variants & Additional Pricing</h4>
                <p className="text-[11px] text-slate-400">e.g. ODOO Brand Tier adds +₹560 to base price.</p>
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
              >
                <Plus className="w-3.5 h-3.5" /> Add Variant
              </button>
            </div>

            <div className="space-y-2">
              {formData.variants.map((v, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Variant Name (e.g. ODOO Brand)"
                      value={v.name}
                      onChange={(e) => handleVariantChange(idx, 'name', e.target.value)}
                      required
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="text"
                      placeholder="SKU"
                      value={v.sku}
                      onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      placeholder="+ Price (₹)"
                      value={v.additionalPrice}
                      onChange={(e) => handleVariantChange(idx, 'additionalPrice', Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-900"
                    />
                  </div>
                  {formData.variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
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
              Save Product
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
