const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('brightloop_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  // Auth
  login: (credentials: any) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    }).then(handleResponse),

  register: (data: any) =>
    fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),

  forgotPassword: (email: string) =>
    fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).then(handleResponse),

  resetPassword: (data: any) =>
    fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),

  getCurrentUser: () =>
    fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    }).then(handleResponse),

  // Dashboard
  getDashboardSummary: (range: string = '6m') =>
    fetch(`${API_BASE}/dashboard/summary?range=${range}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse),

  // Products
  getProducts: (params?: { search?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetch(`${API_BASE}/products?${query}`, { headers: getAuthHeaders() }).then(handleResponse);
  },
  getProductById: (id: string) =>
    fetch(`${API_BASE}/products/${id}`, { headers: getAuthHeaders() }).then(handleResponse),
  createProduct: (data: any) =>
    fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),
  updateProduct: (id: string, data: any) =>
    fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),
  deleteProduct: (id: string) =>
    fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then(handleResponse),

  // Plans
  getPlans: (params?: { frequency?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetch(`${API_BASE}/plans?${query}`, { headers: getAuthHeaders() }).then(handleResponse);
  },
  getPlanById: (id: string) =>
    fetch(`${API_BASE}/plans/${id}`, { headers: getAuthHeaders() }).then(handleResponse),
  createPlan: (data: any) =>
    fetch(`${API_BASE}/plans`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),
  updatePlan: (id: string, data: any) =>
    fetch(`${API_BASE}/plans/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),
  deletePlan: (id: string) =>
    fetch(`${API_BASE}/plans/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then(handleResponse),

  // Customers
  getCustomers: (params?: { search?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetch(`${API_BASE}/customers?${query}`, { headers: getAuthHeaders() }).then(handleResponse);
  },
  getCustomerById: (id: string) =>
    fetch(`${API_BASE}/customers/${id}`, { headers: getAuthHeaders() }).then(handleResponse),
  createCustomer: (data: any) =>
    fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),
  updateCustomer: (id: string, data: any) =>
    fetch(`${API_BASE}/customers/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),
  deleteCustomer: (id: string) =>
    fetch(`${API_BASE}/customers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then(handleResponse),

  // Quotations
  getQuotations: (params?: { status?: string; customerId?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetch(`${API_BASE}/quotations?${query}`, { headers: getAuthHeaders() }).then(handleResponse);
  },
  getQuotationById: (id: string) =>
    fetch(`${API_BASE}/quotations/${id}`, { headers: getAuthHeaders() }).then(handleResponse),
  createQuotation: (data: any) =>
    fetch(`${API_BASE}/quotations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),
  convertQuotation: (id: string) =>
    fetch(`${API_BASE}/quotations/${id}/convert`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(handleResponse),

  // Subscriptions
  getSubscriptions: (params?: { status?: string; customerId?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetch(`${API_BASE}/subscriptions?${query}`, { headers: getAuthHeaders() }).then(handleResponse);
  },
  getSubscriptionById: (id: string) =>
    fetch(`${API_BASE}/subscriptions/${id}`, { headers: getAuthHeaders() }).then(handleResponse),
  createSubscription: (data: any) =>
    fetch(`${API_BASE}/subscriptions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),
  activateSubscription: (id: string) =>
    fetch(`${API_BASE}/subscriptions/${id}/activate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(handleResponse),
  pauseSubscription: (id: string, reason?: string) =>
    fetch(`${API_BASE}/subscriptions/${id}/pause`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    }).then(handleResponse),
  resumeSubscription: (id: string) =>
    fetch(`${API_BASE}/subscriptions/${id}/resume`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(handleResponse),
  renewSubscription: (id: string) =>
    fetch(`${API_BASE}/subscriptions/${id}/renew`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(handleResponse),
  closeSubscription: (id: string, reason?: string) =>
    fetch(`${API_BASE}/subscriptions/${id}/close`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    }).then(handleResponse),

  // Invoices
  getInvoices: (params?: { status?: string; customerId?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetch(`${API_BASE}/invoices?${query}`, { headers: getAuthHeaders() }).then(handleResponse);
  },
  getInvoiceById: (id: string) =>
    fetch(`${API_BASE}/invoices/${id}`, { headers: getAuthHeaders() }).then(handleResponse),
  createInvoice: (data: any) =>
    fetch(`${API_BASE}/invoices`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),
  confirmInvoice: (id: string) =>
    fetch(`${API_BASE}/invoices/${id}/confirm`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(handleResponse),
  sendInvoice: (id: string) =>
    fetch(`${API_BASE}/invoices/${id}/send`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(handleResponse),
  cancelInvoice: (id: string) =>
    fetch(`${API_BASE}/invoices/${id}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(handleResponse),
  triggerRecurringBilling: () =>
    fetch(`${API_BASE}/invoices/trigger-billing`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(handleResponse),

  // Payments
  getPayments: (params?: { customerId?: string; invoiceId?: string; method?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetch(`${API_BASE}/payments?${query}`, { headers: getAuthHeaders() }).then(handleResponse);
  },
  recordPayment: (data: any) =>
    fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  // Taxes
  getTaxes: () =>
    fetch(`${API_BASE}/taxes`, { headers: getAuthHeaders() }).then(handleResponse),
  createTax: (data: any) =>
    fetch(`${API_BASE}/taxes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),
  updateTax: (id: string, data: any) =>
    fetch(`${API_BASE}/taxes/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),
  deleteTax: (id: string) =>
    fetch(`${API_BASE}/taxes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then(handleResponse),

  // Discounts
  getDiscounts: () =>
    fetch(`${API_BASE}/discounts`, { headers: getAuthHeaders() }).then(handleResponse),
  createDiscount: (data: any) =>
    fetch(`${API_BASE}/discounts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),
  updateDiscount: (id: string, data: any) =>
    fetch(`${API_BASE}/discounts/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),
  deleteDiscount: (id: string) =>
    fetch(`${API_BASE}/discounts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then(handleResponse),

  // Reports
  getAnalyticsReport: (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetch(`${API_BASE}/reports/analytics?${query}`, { headers: getAuthHeaders() }).then(handleResponse);
  },
  getExportUrl: (type: 'subscriptions' | 'invoices' | 'payments') =>
    `${API_BASE}/reports/export/${type}`,

  // Staff
  getStaff: () =>
    fetch(`${API_BASE}/staff`, { headers: getAuthHeaders() }).then(handleResponse),
  createStaff: (data: any) =>
    fetch(`${API_BASE}/staff`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),
  updateStaff: (id: string, data: any) =>
    fetch(`${API_BASE}/staff/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),
  deleteStaff: (id: string) =>
    fetch(`${API_BASE}/staff/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then(handleResponse),

  // Notifications
  getNotifications: () =>
    fetch(`${API_BASE}/notifications`, { headers: getAuthHeaders() }).then(handleResponse),
  markNotificationRead: (id: string) =>
    fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    }).then(handleResponse),
  markAllNotificationsRead: () =>
    fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    }).then(handleResponse),
};
