import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';

import authRoutes from './routes/auth.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import productsRoutes from './routes/products.routes.js';
import plansRoutes from './routes/plans.routes.js';
import customersRoutes from './routes/customers.routes.js';
import quotationsRoutes from './routes/quotations.routes.js';
import subscriptionsRoutes from './routes/subscriptions.routes.js';
import invoicesRoutes from './routes/invoices.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import taxesRoutes from './routes/taxes.routes.js';
import discountsRoutes from './routes/discounts.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import staffRoutes from './routes/staff.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import { BillingService } from './services/billingService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/quotations', quotationsRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/taxes', taxesRoutes);
app.use('/api/discounts', discountsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/notifications', notificationsRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Brightloop Subscription Management Platform',
    timestamp: new Date().toISOString(),
  });
});

// Scheduled Recurring Billing Cron Job (Runs every night at 00:00)
cron.schedule('0 0 * * *', async () => {
  console.log('[Cron] Running scheduled automated recurring billing cycle...');
  try {
    const result = await BillingService.runRecurringBilling();
    console.log('[Cron] Billing cycle completed:', result);
  } catch (err) {
    console.error('[Cron] Recurring billing cycle error:', err);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Brightloop Server running on http://localhost:${PORT}`);
});
