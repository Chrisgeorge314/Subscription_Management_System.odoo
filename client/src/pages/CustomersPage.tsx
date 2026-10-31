import React, { useEffect, useState } from 'react';
import { Plus, Search, Building2, Mail, Phone, MapPin, Receipt, Layers, CreditCard } from 'lucide-react';
import { api } from '../services/api.js';
import { Customer } from '../types/index.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { useAuth } from '../context/AuthContext.js';

export const CustomersPage: React.FC = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    billingAddress: '',
    city: 'Kochi',
    state: 'Kerala',
    postalCode: '682001',
    taxNumber: '',
    notes: '',
  });

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = (await api.getCustomers({ search: searchTerm })) as Customer[];
      setCustomers(res);
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [searchTerm]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCustomer(formData);
      setIsCreateOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        billingAddress: '',
        city: 'Kochi',
        state: 'Kerala',
        postalCode: '682001',
        taxNumber: '',
        notes: '',
      });
      loadCustomers();
    } catch (err: any) {
      alert(`Error creating customer: ${err.message}`);
    }
  };

  const openCustomerDetails = async (id: string) => {
    try {
      const cust = (await api.getCustomerById(id)) as Customer;
      setSelectedCustomer(cust);
      setIsDetailsOpen(true);
    } catch (err: any) {
      alert(`Error loading customer: ${err.message}`);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Customer Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage enterprise accounts, billing info, and view subscription histories.</p>
        </div>

        {user?.role !== 'CUSTOMER' && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by company, customer name, email, or GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
          />
        </div>
        <div className="text-xs text-slate-500">
          Total Customers: <span className="font-semibold text-slate-900">{customers.length}</span>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Customer & Company</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Tax / GSTIN</th>
                <th className="py-3 px-4 text-center">Active Subs</th>
                <th className="py-3 px-4 text-center">Invoices</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">Loading customers...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">No customers found.</td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {c.company || 'Individual Account'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {c.email}
                      </div>
                      {c.phone && (
                        <div className="flex items-center gap-1.5 text-slate-500 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {c.phone}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{c.city ? `${c.city}, ${c.state}` : 'India'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                      {c.taxNumber || '—'}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-800">
                      {c._count?.subscriptions || 0}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600">
                      {c._count?.invoices || 0}
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={c.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openCustomerDetails(c.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-md transition"
                      >
                        View 360°
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Customer Profile"
        subtitle="Add a customer account with complete billing and tax compliance information."
        maxWidth="xl"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Customer / Contact Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Anand Menon"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Company / Business Name</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Technova Pvt Ltd"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="billing@company.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98470 12345"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Billing Street Address</label>
            <input
              type="text"
              value={formData.billingAddress}
              onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
              placeholder="Suite 401, Infopark Phase II, Kakkanad"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Postal Code</label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Tax Identification / GSTIN</label>
            <input
              type="text"
              value={formData.taxNumber}
              onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
              placeholder="32AAACT1234F1Z8"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
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
              Save Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer 360 Details Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          title={`360° Profile: ${selectedCustomer.name}`}
          subtitle={selectedCustomer.company ? `${selectedCustomer.company} • GSTIN: ${selectedCustomer.taxNumber || 'Unregistered'}` : selectedCustomer.email}
          maxWidth="3xl"
        >
          <div className="space-y-6 text-xs">
            {/* Overview Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-600" /> Total Subscriptions
                </p>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {selectedCustomer.subscriptions?.length || 0}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-indigo-600" /> Invoices Issued
                </p>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {selectedCustomer.invoices?.length || 0}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" /> Total Paid
                </p>
                <p className="text-lg font-bold text-emerald-600 mt-1">
                  ₹{(selectedCustomer.payments?.reduce((s, p) => s + p.amount, 0) || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Subscriptions section */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2">Active & Past Subscriptions</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase text-slate-400 font-semibold">
                    <tr>
                      <th className="py-2 px-3">Subscription #</th>
                      <th className="py-2 px-3">Plan</th>
                      <th className="py-2 px-3">Frequency</th>
                      <th className="py-2 px-3">Amount</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedCustomer.subscriptions?.map((s) => (
                      <tr key={s.id}>
                        <td className="py-2 px-3 font-semibold text-slate-800">{s.subscriptionNumber}</td>
                        <td className="py-2 px-3 text-slate-600">{s.plan?.name}</td>
                        <td className="py-2 px-3 capitalize">{s.billingFrequency.toLowerCase()}</td>
                        <td className="py-2 px-3 font-semibold">₹{s.totalAmount.toLocaleString('en-IN')}</td>
                        <td className="py-2 px-3">
                          <Badge status={s.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Invoices */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2">Invoice Ledger</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase text-slate-400 font-semibold">
                    <tr>
                      <th className="py-2 px-3">Invoice #</th>
                      <th className="py-2 px-3">Issue Date</th>
                      <th className="py-2 px-3">Total Amount</th>
                      <th className="py-2 px-3">Outstanding</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedCustomer.invoices?.map((inv) => (
                      <tr key={inv.id}>
                        <td className="py-2 px-3 font-semibold text-slate-800">{inv.invoiceNumber}</td>
                        <td className="py-2 px-3 text-slate-500">
                          {new Date(inv.issueDate).toLocaleDateString('en-GB')}
                        </td>
                        <td className="py-2 px-3 font-semibold">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                        <td className="py-2 px-3 font-semibold text-rose-600">
                          ₹{inv.outstandingAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-3">
                          <Badge status={inv.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
