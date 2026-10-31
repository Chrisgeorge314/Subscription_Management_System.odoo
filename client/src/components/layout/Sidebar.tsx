import React, { useState } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Package,
  Layers,
  FileText,
  Repeat,
  FileSpreadsheet,
  CreditCard,
  Tag,
  Percent,
  UserCheck,
  Bell,
  Settings,
  HelpCircle,
  ChevronRight,
  LogOut,
  Shield,
  Briefcase,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  unreadCount?: number;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, unreadCount = 3 }) => {
  const { user, logout, loginAs } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'STAFF';
  const isCustomer = user?.role === 'CUSTOMER';

  const navSections: NavSection[] = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      ],
    },
    {
      title: 'CUSTOMERS',
      items: [{ id: 'customers', label: 'Customers', icon: Users }],
    },
    {
      title: 'PRODUCTS',
      items: [
        { id: 'products', label: 'Products', icon: Package },
        { id: 'plans', label: 'Plans', icon: Layers },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { id: 'quotations', label: 'Quotations', icon: FileText },
        { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
        { id: 'invoices', label: 'Invoices', icon: FileSpreadsheet },
        { id: 'payments', label: 'Payments', icon: CreditCard },
        { id: 'discounts', label: 'Discounts', icon: Tag },
        { id: 'taxes', label: 'Taxes', icon: Percent },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        ...(isAdmin ? [{ id: 'staff', label: 'Staff Management', icon: UserCheck }] : []),
        { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
        { id: 'settings', label: 'Settings', icon: Settings },
        { id: 'support', label: 'Support', icon: HelpCircle },
      ],
    },
  ];

  // If customer is logged in, show customer-specific navigation
  const customerSections: NavSection[] = [
    {
      title: 'CUSTOMER PORTAL',
      items: [
        { id: 'portal', label: 'Overview', icon: LayoutDashboard },
        { id: 'subscriptions', label: 'My Subscriptions', icon: Repeat },
        { id: 'invoices', label: 'My Invoices', icon: FileSpreadsheet },
        { id: 'payments', label: 'Payment History', icon: CreditCard },
        { id: 'support', label: 'Help & Support', icon: HelpCircle },
      ],
    },
  ];

  const sectionsToRender = isCustomer ? customerSections : navSections;

  // Initials for avatar
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AD';

  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-teal-400 flex items-center justify-center text-white shadow-sm shadow-sky-500/20">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 0 0-7.07 17.07l1.41-1.41A8 8 0 1 1 12 20v2a10 10 0 0 0 0-20z" />
          </svg>
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">Brightloop</h1>
          <p className="text-[11px] text-slate-400 font-medium">Subscription Management</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {sectionsToRender.map((section) => (
          <div key={section.title}>
            <p className="px-3 text-[10px] font-semibold text-slate-400 tracking-wider uppercase mb-1.5">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? 'bg-sky-50 text-sky-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-sky-500 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-100 relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold ring-1 ring-slate-300">
              {initials}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-800 truncate">{user?.name || 'Admin'}</p>
              <p className="text-[10px] text-slate-400 truncate capitalize">
                {user?.role === 'ADMIN' ? 'Administrator' : user?.role === 'STAFF' ? 'Staff Member' : 'Customer Account'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Dropdown Role Switcher & Logout */}
        {showUserMenu && (
          <div className="absolute bottom-16 left-3 right-3 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 text-xs">
            <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
              <p className="font-semibold text-slate-700">Quick Switch Demo Persona</p>
              <p className="text-[10px] text-slate-400">Instantly test roles for hackathon demo</p>
            </div>

            <button
              onClick={() => {
                loginAs('ADMIN');
                setShowUserMenu(false);
              }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 ${
                isAdmin ? 'text-sky-700 font-semibold bg-sky-50' : 'text-slate-600'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-sky-600" />
              <span>Admin (Full Control)</span>
            </button>

            <button
              onClick={() => {
                loginAs('STAFF');
                setShowUserMenu(false);
              }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 ${
                isStaff ? 'text-sky-700 font-semibold bg-sky-50' : 'text-slate-600'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-slate-500" />
              <span>Staff (Operations Only)</span>
            </button>

            <button
              onClick={() => {
                loginAs('CUSTOMER');
                setShowUserMenu(false);
              }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 ${
                isCustomer ? 'text-sky-700 font-semibold bg-sky-50' : 'text-slate-600'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5 text-teal-600" />
              <span>Customer (Self-service Portal)</span>
            </button>

            <div className="border-t border-slate-100 mt-1 pt-1">
              <button
                onClick={() => {
                  logout();
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
