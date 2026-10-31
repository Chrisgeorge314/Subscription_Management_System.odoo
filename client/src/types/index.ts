export type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string | null;
  customerId?: string | null;
  customer?: Customer | null;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  billingAddress?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country: string;
  taxNumber?: string | null;
  currency: string;
  status: string;
  notes?: string | null;
  createdAt: string;
  subscriptions?: Subscription[];
  invoices?: Invoice[];
  payments?: Payment[];
  quotations?: Quotation[];
  _count?: {
    subscriptions: number;
    invoices: number;
    payments: number;
  };
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku?: string | null;
  additionalPrice: number;
  isDefault: boolean;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  type: string;
  salesPrice: number;
  costPrice: number;
  description?: string | null;
  status: string;
  variants: ProductVariant[];
  plans?: SubscriptionPlan[];
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  productId: string;
  product?: Product;
  billingFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  price: number;
  minQuantity: number;
  startDate?: string | null;
  endDate?: string | null;
  autoCloseOnEnd: boolean;
  allowPause: boolean;
  allowEarlyClosure: boolean;
  allowRenewal: boolean;
  status: string;
  createdAt: string;
  _count?: {
    subscriptions: number;
  };
}

export interface QuotationLine {
  id?: string;
  productId: string;
  product?: Product;
  variantId?: string | null;
  variant?: ProductVariant | null;
  planId?: string | null;
  plan?: SubscriptionPlan | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  customer: Customer;
  templateId?: string | null;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'CONVERTED' | 'EXPIRED' | 'CANCELLED';
  issueDate: string;
  validUntil: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  terms?: string | null;
  notes?: string | null;
  convertedSubscriptionId?: string | null;
  lines: QuotationLine[];
  createdAt: string;
}

export interface SubscriptionLine {
  id?: string;
  productId: string;
  product?: Product;
  variantId?: string | null;
  variant?: ProductVariant | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

export interface SubscriptionHistory {
  id: string;
  subscriptionId: string;
  action: string;
  previousStatus?: string | null;
  newStatus: string;
  performedBy?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface Subscription {
  id: string;
  subscriptionNumber: string;
  customerId: string;
  customer: Customer;
  planId: string;
  plan: SubscriptionPlan;
  status: 'DRAFT' | 'QUOTATION' | 'CONFIRMED' | 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'EXPIRED';
  billingFrequency: string;
  paymentTerms: string;
  startDate: string;
  expiryDate?: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingDate: string;
  pauseDate?: string | null;
  resumeDate?: string | null;
  closedDate?: string | null;
  cancelReason?: string | null;
  autoRenew: boolean;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  lines: SubscriptionLine[];
  invoices?: Invoice[];
  history?: SubscriptionHistory[];
  _count?: {
    invoices: number;
  };
  createdAt: string;
}

export interface InvoiceLine {
  id?: string;
  productId?: string | null;
  product?: Product | null;
  variantId?: string | null;
  variant?: ProductVariant | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer: Customer;
  subscriptionId?: string | null;
  subscription?: Subscription | null;
  billingPeriodStart?: string | null;
  billingPeriodEnd?: string | null;
  issueDate: string;
  dueDate: string;
  status: 'DRAFT' | 'CONFIRMED' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentTerms: string;
  notes?: string | null;
  lines: InvoiceLine[];
  payments?: Payment[];
  createdAt: string;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  customerId: string;
  customer: Customer;
  invoiceId: string;
  invoice: Invoice;
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CARD' | 'OTHER';
  paymentDate: string;
  transactionRef?: string | null;
  status: string;
  notes?: string | null;
  recordedBy?: string | null;
  createdAt: string;
}

export interface TaxRule {
  id: string;
  name: string;
  code: string;
  rate: number;
  type: string;
  applicableProductTypes: string;
  isCompound: boolean;
  isActive: boolean;
}

export interface DiscountRule {
  id: string;
  name: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  scope: 'SUBSCRIPTION' | 'PRODUCT';
  minPurchaseAmount?: number | null;
  minQuantity?: number | null;
  maxUsageCount?: number | null;
  currentUsageCount: number;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardSummary {
  metrics: {
    totalRevenue: number;
    revenueGrowth: string;
    mrr: number;
    mrrGrowth: string;
    arr: number;
    activeSubscriptions: number;
    activeSubscriptionsGrowth: string;
    newSubscriptions: number;
    outstandingPayments: number;
    outstandingGrowth: string;
    overdueCount: number;
  };
  chartTimeline: Array<{
    month: string;
    revenue: number;
    activeSubscriptions: number;
  }>;
  statusDistribution: Array<{
    name: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  recentSubscriptions: Array<{
    id: string;
    number: string;
    customer: string;
    plan: string;
    startDate: string;
    status: string;
  }>;
  recentTransactions: Array<{
    id: string;
    number: string;
    type: 'Payment' | 'Invoice';
    customer: string;
    amount: number;
    date: string;
    status: string;
  }>;
  upcomingRenewals: Array<{
    id: string;
    customer: string;
    plan: string;
    renewalDate: string;
    amount: number;
    status: string;
  }>;
  topCustomers: Array<{
    rank: number;
    id: string;
    customer: string;
    totalRevenue: number;
    activeSubs: number;
    status: string;
  }>;
}
