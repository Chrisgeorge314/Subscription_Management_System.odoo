import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Sidebar } from './components/layout/Sidebar.js';
import { Header } from './components/layout/Header.js';
import { LoginPage } from './pages/LoginPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { CustomersPage } from './pages/CustomersPage.js';
import { ProductsPage } from './pages/ProductsPage.js';
import { PlansPage } from './pages/PlansPage.js';
import { QuotationsPage } from './pages/QuotationsPage.js';
import { SubscriptionsPage } from './pages/SubscriptionsPage.js';
import { InvoicesPage } from './pages/InvoicesPage.js';
import { PaymentsPage } from './pages/PaymentsPage.js';
import { TaxesPage } from './pages/TaxesPage.js';
import { DiscountsPage } from './pages/DiscountsPage.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { StaffPage } from './pages/StaffPage.js';
import { CustomerPortalPage } from './pages/CustomerPortalPage.js';

function MainApp() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>(
    user?.role === 'CUSTOMER' ? 'portal' : 'dashboard'
  );
  const [dateRange, setDateRange] = useState<string>('6m');
  const [billingRefreshKey, setBillingRefreshKey] = useState<number>(0);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading Brightloop platform...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Get active page titles
  const getHeaderInfo = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: 'Executive Dashboard',
          subtitle: `Welcome back, ${user?.name || 'Admin'}. Here's your subscription business overview.`,
        };
      case 'analytics':
        return {
          title: 'Analytics & Financial Reports',
          subtitle: 'Audit revenue streams, ARR, MRR, and churn analysis.',
        };
      case 'customers':
        return {
          title: 'Customer Directory',
          subtitle: 'Manage client accounts, GST profiles, and billing histories.',
        };
      case 'products':
        return {
          title: 'Products & Multi-Variant Catalog',
          subtitle: 'Define base products and price-adjusting variants.',
        };
      case 'plans':
        return {
          title: 'Subscription Plans',
          subtitle: 'Configure billing cadences, pause rules, and renewal terms.',
        };
      case 'quotations':
        return {
          title: 'Quotations & Proposals',
          subtitle: 'Generate formal pricing proposals and convert to subscriptions in 1-click.',
        };
      case 'subscriptions':
        return {
          title: 'Subscription Lifecycle',
          subtitle: 'Manage active, paused, confirmed, and closed subscriptions.',
        };
      case 'invoices':
        return {
          title: 'Invoices & Recurring Billing',
          subtitle: 'Tax invoices, automated billing cycles, and overdue payment tracking.',
        };
      case 'payments':
        return {
          title: 'Payment Receipts',
          subtitle: 'Multi-channel payment collections and reconciliation ledger.',
        };
      case 'discounts':
        return {
          title: 'Discount Rules Engine',
          subtitle: 'Manage percentage and fixed promotional discounts.',
        };
      case 'taxes':
        return {
          title: 'Tax Configuration',
          subtitle: 'GST rules and tax rate schedules for India.',
        };
      case 'staff':
        return {
          title: 'Staff Management',
          subtitle: 'Role-based access control and operator user management.',
        };
      case 'portal':
        return {
          title: 'Customer Portal',
          subtitle: 'Self-service subscription and invoice dashboard.',
        };
      case 'notifications':
        return {
          title: 'Notifications & Alerts',
          subtitle: 'System alerts, upcoming renewals, and invoice notifications.',
        };
      case 'settings':
        return {
          title: 'System Settings',
          subtitle: 'Platform parameters, default currency (INR ₹), and security controls.',
        };
      case 'support':
        return {
          title: 'Hackathon Demo Guide & Support',
          subtitle: 'Live demonstration cheat sheet and feature reference.',
        };
      default:
        return { title: 'Brightloop', subtitle: 'Subscription Management System' };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden text-slate-800 antialiased font-sans">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <Header
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          dateRange={dateRange}
          onChangeDateRange={(range) => setDateRange(range)}
          onBillingTriggered={() => setBillingRefreshKey((prev) => prev + 1)}
        />

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardPage
              key={billingRefreshKey}
              onNavigate={(tab) => setCurrentTab(tab)}
              dateRange={dateRange}
            />
          )}
          {currentTab === 'portal' && <CustomerPortalPage />}
          {currentTab === 'customers' && <CustomersPage />}
          {currentTab === 'products' && <ProductsPage />}
          {currentTab === 'plans' && <PlansPage />}
          {currentTab === 'quotations' && (
            <QuotationsPage onNavigateToSub={() => setCurrentTab('subscriptions')} />
          )}
          {currentTab === 'subscriptions' && <SubscriptionsPage key={billingRefreshKey} />}
          {currentTab === 'invoices' && <InvoicesPage key={billingRefreshKey} />}
          {currentTab === 'payments' && <PaymentsPage />}
          {currentTab === 'taxes' && <TaxesPage />}
          {currentTab === 'discounts' && <DiscountsPage />}
          {currentTab === 'analytics' && <ReportsPage />}
          {currentTab === 'staff' && <StaffPage />}

          {/* Simple Settings Page */}
          {currentTab === 'settings' && (
            <div className="p-8 max-w-4xl mx-auto space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Platform Configuration</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-slate-400 font-medium">Default Currency</p>
                    <p className="text-base font-bold text-slate-900 mt-1">Indian Rupee (INR ₹)</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-slate-400 font-medium">Default Payment Terms</p>
                    <p className="text-base font-bold text-slate-900 mt-1">Net 15 Days</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-slate-400 font-medium">Recurring Billing Engine</p>
                    <p className="text-base font-bold text-emerald-600 mt-1">Active (Daily Cron at 00:00)</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-slate-400 font-medium">Database Engine</p>
                    <p className="text-base font-bold text-slate-900 mt-1">SQLite via Prisma ORM</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Support / Hackathon Demo Cheat Sheet */}
          {currentTab === 'support' && (
            <div className="p-8 max-w-4xl mx-auto space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h3 className="font-bold text-slate-900 text-base">ODOO Kochi Hackathon Demo Guide</h3>
                <p className="text-xs text-slate-600">
                  Brightloop is a complete, unified Subscription Management System engineered for modern SaaS enterprises.
                </p>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-800">1. End-to-End Workflow Demonstration</p>
                    <p className="text-slate-600 mt-1">
                      Customers → Quotations (Select Products & Variants) → 1-Click Convert to Subscription → Automated Initial Invoice → Settle via Payments → Real-time Revenue & MRR updates on Dashboard.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-800">2. Persona Roles Switcher</p>
                    <p className="text-slate-600 mt-1">
                      Click the bottom-left profile avatar to instantly toggle between <strong>Admin</strong>, <strong>Staff</strong>, and <strong>Customer</strong> view.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-800">3. Automated Recurring Invoicing Engine</p>
                    <p className="text-slate-600 mt-1">
                      Click the <strong>⚡ Run Billing</strong> button in the top navigation bar at any time to demonstrate idempotent recurring billing and auto-closure of expired subscriptions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
