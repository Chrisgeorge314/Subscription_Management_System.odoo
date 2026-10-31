import React, { useEffect, useState } from 'react';
import { Plus, Search, FileText, ArrowRight, Printer, CheckCircle2, Trash2, Download } from 'lucide-react';
import { api } from '../services/api.js';
import { Quotation, Customer, Product, SubscriptionPlan } from '../types/index.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { useAuth } from '../context/AuthContext.js';
import { downloadElementAsPdf } from '../utils/pdfExport.js';

export const QuotationsPage: React.FC<{ onNavigateToSub?: () => void }> = ({ onNavigateToSub }) => {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);

  const handleDownloadPdf = async (number: string) => {
    setIsPdfDownloading(true);
    try {
      await downloadElementAsPdf('printable-quote', `Quotation_${number}`);
    } finally {
      setIsPdfDownloading(false);
    }
  };

  // Form
  const [customerId, setCustomerId] = useState('');
  const [validityDays, setValidityDays] = useState(30);
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<any[]>([
    {
      productId: '',
      variantId: '',
      planId: '',
      quantity: 1,
      unitPrice: 45000,
      discountAmount: 0,
      taxRate: 18.0,
      description: '',
    },
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [quotes, custs, prods, plns] = await Promise.all([
        api.getQuotations(),
        api.getCustomers(),
        api.getProducts(),
        api.getPlans(),
      ]);
      setQuotations(quotes as Quotation[]);
      setCustomers(custs as Customer[]);
      setProducts(prods as Product[]);
      setPlans(plns as SubscriptionPlan[]);

      if ((custs as Customer[]).length > 0 && !customerId) {
        setCustomerId((custs as Customer[])[0].id);
      }
      if ((prods as Product[]).length > 0) {
        setLines([
          {
            productId: (prods as Product[])[0].id,
            variantId: (prods as Product[])[0].variants[0]?.id || '',
            planId: (plns as SubscriptionPlan[])[0]?.id || '',
            quantity: 1,
            unitPrice: (prods as Product[])[0].salesPrice,
            discountAmount: 0,
            taxRate: 18.0,
            description: `${(prods as Product[])[0].name} - Standard Tier`,
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to load quotation data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProductSelect = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    const updated = [...lines];
    updated[index].productId = prod.id;
    updated[index].variantId = prod.variants[0]?.id || '';
    updated[index].unitPrice = prod.salesPrice;
    updated[index].description = `${prod.name} Licensing`;
    setLines(updated);
  };

  const handleVariantSelect = (index: number, varId: string) => {
    const updated = [...lines];
    const currentProd = products.find((p) => p.id === updated[index].productId);
    const variant = currentProd?.variants.find((v) => v.id === varId);

    updated[index].variantId = varId;
    if (variant && currentProd) {
      updated[index].unitPrice = currentProd.salesPrice + variant.additionalPrice;
      updated[index].description = `${currentProd.name} - ${variant.name}`;
    }
    setLines(updated);
  };

  const handleAddLine = () => {
    const firstProd = products[0];
    setLines([
      ...lines,
      {
        productId: firstProd?.id || '',
        variantId: firstProd?.variants[0]?.id || '',
        planId: plans[0]?.id || '',
        quantity: 1,
        unitPrice: firstProd?.salesPrice || 10000,
        discountAmount: 0,
        taxRate: 18.0,
        description: firstProd?.name || 'Software Line Item',
      },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length === 1) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;

    lines.forEach((l) => {
      const q = Number(l.quantity || 1);
      const p = Number(l.unitPrice || 0);
      const d = Number(l.discountAmount || 0);
      const rate = Number(l.taxRate || 18);

      const net = Math.max(0, q * p - d);
      const tax = (net * rate) / 100;

      subtotal += q * p;
      discountAmount += d;
      taxAmount += tax;
    });

    return {
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount: subtotal - discountAmount + taxAmount,
    };
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createQuotation({
        customerId,
        validityDays,
        lines,
        notes,
      });
      setIsCreateOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error creating quotation: ${err.message}`);
    }
  };

  const handleConvertToSubscription = async (quoteId: string) => {
    if (!confirm('Convert this quotation into an Active Subscription and generate the first billing invoice?')) return;
    try {
      setIsConverting(true);
      await api.convertQuotation(quoteId);
      setIsPreviewOpen(false);
      loadData();
      if (onNavigateToSub) onNavigateToSub();
    } catch (err: any) {
      alert(`Error converting quotation: ${err.message}`);
    } finally {
      setIsConverting(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Quotation Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Generate formal enterprise proposals, apply GST rates, and convert to active subscriptions in 1-click.</p>
        </div>

        {user?.role !== 'CUSTOMER' && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Quotation</span>
          </button>
        )}
      </div>

      {/* Quotation Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Quotation #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Valid Until</th>
                <th className="py-3 px-4">Subtotal</th>
                <th className="py-3 px-4">Tax (GST)</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">Loading quotations...</td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">No quotations found.</td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{q.quotationNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">{q.customer?.name}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(q.issueDate).toLocaleDateString('en-GB')}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(q.validUntil).toLocaleDateString('en-GB')}</td>
                    <td className="py-3 px-4">₹{q.subtotal.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-slate-600">₹{q.taxAmount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">₹{q.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4">
                      <Badge status={q.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedQuotation(q);
                          setIsPreviewOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition"
                      >
                        Preview / Print
                      </button>
                      {q.status !== 'CONVERTED' && user?.role !== 'CUSTOMER' && (
                        <button
                          onClick={() => handleConvertToSubscription(q.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition"
                        >
                          Convert →
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

      {/* New Quotation Builder Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Professional Quotation"
        subtitle="Select customer, add products and variants, and calculate automated GST taxes."
        maxWidth="3xl"
      >
        <form onSubmit={handleCreateQuotation} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Select Customer *</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
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
              <label className="block font-medium text-slate-700 mb-1">Quotation Validity (Days) *</label>
              <input
                type="number"
                value={validityDays}
                onChange={(e) => setValidityDays(Number(e.target.value))}
                min={1}
                max={90}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Line items */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800">Quotation Line Items</span>
              <button
                type="button"
                onClick={handleAddLine}
                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product Line
              </button>
            </div>

            <div className="space-y-3">
              {lines.map((line, idx) => {
                const currentProd = products.find((p) => p.id === line.productId);
                return (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4">
                        <label className="block text-[10px] text-slate-400 font-medium mb-0.5">Product</label>
                        <select
                          value={line.productId}
                          onChange={(e) => handleProductSelect(idx, e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <label className="block text-[10px] text-slate-400 font-medium mb-0.5">Variant</label>
                        <select
                          value={line.variantId}
                          onChange={(e) => handleVariantSelect(idx, e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs"
                        >
                          {currentProd?.variants.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name} (+₹{v.additionalPrice})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] text-slate-400 font-medium mb-0.5">Quantity</label>
                        <input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) => {
                            const updated = [...lines];
                            updated[idx].quantity = Number(e.target.value);
                            setLines(updated);
                          }}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] text-slate-400 font-medium mb-0.5">Unit Price (₹)</label>
                        <input
                          type="number"
                          value={line.unitPrice}
                          onChange={(e) => {
                            const updated = [...lines];
                            updated[idx].unitPrice = Number(e.target.value);
                            setLines(updated);
                          }}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold"
                        />
                      </div>

                      <div className="col-span-1 text-right pt-4">
                        {lines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Financial summary */}
          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-800">₹{totals.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>GST (18% Standard):</span>
                <span className="font-semibold text-slate-800">₹{totals.taxAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>Total Amount:</span>
                <span>₹{totals.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
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
              Generate Quotation
            </button>
          </div>
        </form>
      </Modal>

      {/* Quotation Preview Modal */}
      {selectedQuotation && (
        <Modal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={`Quotation: ${selectedQuotation.quotationNumber}`}
          subtitle={`Issued on ${new Date(selectedQuotation.issueDate).toLocaleDateString('en-GB')} • Valid until ${new Date(selectedQuotation.validUntil).toLocaleDateString('en-GB')}`}
          maxWidth="3xl"
        >
          <div className="space-y-6 text-xs bg-white p-6 border border-slate-200 rounded-xl" id="printable-quote">
            {/* Header branding */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Brightloop Software</h3>
                <p className="text-slate-500 text-[11px] mt-0.5">Infopark Technology Campus, Kakkanad, Kochi, Kerala</p>
                <p className="text-slate-500 text-[11px]">GSTIN: 32AABCB1234F1Z9 • billing@brightloop.io</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold font-mono text-slate-900">{selectedQuotation.quotationNumber}</span>
                <p className="text-[11px] text-slate-400 mt-1">Status: {selectedQuotation.status}</p>
              </div>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-slate-400 uppercase text-[10px]">Prepared For</p>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedQuotation.customer.name}</p>
                <p className="text-slate-600">{selectedQuotation.customer.company}</p>
                <p className="text-slate-500">{selectedQuotation.customer.billingAddress || selectedQuotation.customer.email}</p>
                <p className="text-slate-500 font-mono mt-0.5">GSTIN: {selectedQuotation.customer.taxNumber || 'Unregistered'}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-400 uppercase text-[10px]">Payment Terms</p>
                <p className="text-slate-700 font-medium mt-0.5">Net 15 Days</p>
                <p className="text-slate-500 mt-1">Currency: INR (₹)</p>
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
                  {selectedQuotation.lines.map((line, i) => (
                    <tr key={i}>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {line.description}
                        {line.variant && <span className="block text-[11px] text-slate-400 font-normal">Variant: {line.variant.name}</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center">{line.quantity}</td>
                      <td className="py-2.5 px-3 text-right">₹{line.unitPrice.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right">{line.taxRate}%</td>
                      <td className="py-2.5 px-3 text-right font-semibold">₹{line.totalAmount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-800">₹{selectedQuotation.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tax (GST 18%):</span>
                  <span className="font-semibold text-slate-800">₹{selectedQuotation.taxAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span>₹{selectedQuotation.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isPdfDownloading}
                  onClick={() => handleDownloadPdf(selectedQuotation.quotationNumber)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-teal-400" />
                  <span>{isPdfDownloading ? 'Generating PDF...' : 'Download PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
              </div>

              {selectedQuotation.status !== 'CONVERTED' && user?.role !== 'CUSTOMER' && (
                <button
                  disabled={isConverting}
                  onClick={() => handleConvertToSubscription(selectedQuotation.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isConverting ? 'Converting...' : 'Convert to Active Subscription →'}</span>
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
