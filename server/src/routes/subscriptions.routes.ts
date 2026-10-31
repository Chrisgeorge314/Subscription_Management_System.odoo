import { Router, Response } from 'express';
import prisma from '../db.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';
import { BillingService } from '../services/billingService.js';

const router = Router();

// GET /api/subscriptions
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, customerId, search } = req.query;
    const where: any = {};

    if (req.user?.role === 'CUSTOMER') {
      where.customerId = req.user.customerId;
    } else {
      if (customerId) where.customerId = String(customerId);
    }

    if (status && status !== 'ALL') where.status = String(status);

    if (search) {
      where.OR = [
        { subscriptionNumber: { contains: String(search) } },
        { customer: { name: { contains: String(search) } } },
        { plan: { name: { contains: String(search) } } },
      ];
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        customer: true,
        plan: true,
        lines: { include: { product: true, variant: true } },
        _count: { select: { invoices: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(subscriptions);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch subscriptions' });
  }
});

// GET /api/subscriptions/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        plan: { include: { product: true } },
        lines: { include: { product: true, variant: true } },
        invoices: {
          include: { payments: true },
          orderBy: { issueDate: 'desc' },
        },
        history: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!subscription) {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }

    if (req.user?.role === 'CUSTOMER' && subscription.customerId !== req.user.customerId) {
      res.status(403).json({ error: 'Access forbidden. You can only view your own subscriptions.' });
      return;
    }

    res.json(subscription);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch subscription details' });
  }
});

// POST /api/subscriptions (Create new subscription manually)
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role === 'CUSTOMER') {
      res.status(403).json({ error: 'Customers cannot create direct subscriptions without quotation.' });
      return;
    }

    const { customerId, planId, billingFrequency, paymentTerms, startDate, expiryDate, lines } = req.body;

    if (!customerId || !planId) {
      res.status(400).json({ error: 'Customer and Plan are required' });
      return;
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      include: { product: true },
    });
    if (!plan) {
      res.status(400).json({ error: 'Plan not found' });
      return;
    }

    const start = startDate ? new Date(startDate) : new Date();
    const frequency = billingFrequency || plan.billingFrequency;
    const { periodEnd, nextBilling } = BillingService.calculateNextPeriod(start, frequency);

    const count = await prisma.subscription.count();
    const subscriptionNumber = `SUB-2026-${(count + 1050).toString()}`;

    let subtotal = 0;
    let taxAmount = 0;
    const processedLines = (lines || []).map((l: any) => {
      const qty = Number(l.quantity || 1);
      const unitPrice = Number(l.unitPrice || plan.price);
      const disc = Number(l.discountAmount || 0);
      const taxRate = Number(l.taxRate || 18.0);
      const lineSubtotal = qty * unitPrice - disc;
      const lineTax = (lineSubtotal * taxRate) / 100;
      const totalAmount = lineSubtotal + lineTax;

      subtotal += lineSubtotal;
      taxAmount += lineTax;

      return {
        productId: l.productId || plan.productId,
        variantId: l.variantId || null,
        description: l.description || `${plan.name} License`,
        quantity: qty,
        unitPrice,
        discountAmount: disc,
        taxRate,
        taxAmount: lineTax,
        totalAmount,
      };
    });

    if (processedLines.length === 0) {
      const lineSub = plan.price;
      const lineTax = (lineSub * 18.0) / 100;
      subtotal = lineSub;
      taxAmount = lineTax;
      processedLines.push({
        productId: plan.productId,
        variantId: null,
        description: `${plan.name} Standard License`,
        quantity: 1,
        unitPrice: plan.price,
        discountAmount: 0,
        taxRate: 18.0,
        taxAmount: lineTax,
        totalAmount: lineSub + lineTax,
      });
    }

    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    const newSub = await prisma.subscription.create({
      data: {
        subscriptionNumber,
        customerId,
        planId: plan.id,
        status: 'ACTIVE',
        billingFrequency: frequency,
        paymentTerms: paymentTerms || 'Net 15',
        startDate: start,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        currentPeriodStart: start,
        currentPeriodEnd: periodEnd,
        nextBillingDate: nextBilling,
        subtotal,
        taxAmount,
        discountAmount: 0,
        totalAmount,
        lines: { create: processedLines },
        history: {
          create: [
            {
              action: 'CREATED',
              newStatus: 'ACTIVE',
              performedBy: req.user?.name || 'Staff User',
              notes: 'Subscription manually created.',
            },
          ],
        },
      },
      include: {
        customer: true,
        plan: true,
        lines: true,
      },
    });

    res.status(201).json(newSub);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create subscription' });
  }
});

// POST /api/subscriptions/:id/activate
router.post('/:id/activate', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { id: req.params.id },
      include: { plan: true },
    });
    if (!sub) {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }

    const updated = await prisma.subscription.update({
      where: { id: req.params.id },
      data: { status: 'ACTIVE' },
    });

    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId: sub.id,
        action: 'ACTIVATED',
        previousStatus: sub.status,
        newStatus: 'ACTIVE',
        performedBy: req.user?.name || 'User',
        notes: 'Subscription activated.',
      },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Activation failed' });
  }
});

// POST /api/subscriptions/:id/pause (Respects plan.allowPause)
router.post('/:id/pause', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { id: req.params.id },
      include: { plan: true },
    });
    if (!sub) {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }

    if (!sub.plan.allowPause) {
      res.status(400).json({ error: 'This subscription plan does not allow pausing.' });
      return;
    }

    const now = new Date();
    const updated = await prisma.subscription.update({
      where: { id: req.params.id },
      data: {
        status: 'PAUSED',
        pauseDate: now,
      },
    });

    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId: sub.id,
        action: 'PAUSED',
        previousStatus: sub.status,
        newStatus: 'PAUSED',
        performedBy: req.user?.name || 'User',
        notes: req.body.reason || 'Subscription paused by user request.',
      },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Pause failed' });
  }
});

// POST /api/subscriptions/:id/resume
router.post('/:id/resume', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { id: req.params.id },
      include: { plan: true },
    });
    if (!sub) {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }

    const now = new Date();
    const updated = await prisma.subscription.update({
      where: { id: req.params.id },
      data: {
        status: 'ACTIVE',
        resumeDate: now,
      },
    });

    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId: sub.id,
        action: 'RESUMED',
        previousStatus: sub.status,
        newStatus: 'ACTIVE',
        performedBy: req.user?.name || 'User',
        notes: 'Subscription resumed to active status.',
      },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Resume failed' });
  }
});

// POST /api/subscriptions/:id/renew (Respects plan.allowRenewal)
router.post('/:id/renew', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { id: req.params.id },
      include: { plan: true },
    });
    if (!sub) {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }

    if (!sub.plan.allowRenewal) {
      res.status(400).json({ error: 'This subscription plan does not permit renewals.' });
      return;
    }

    const { periodEnd, nextBilling } = BillingService.calculateNextPeriod(sub.currentPeriodEnd, sub.billingFrequency);

    const updated = await prisma.subscription.update({
      where: { id: req.params.id },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: sub.currentPeriodEnd,
        currentPeriodEnd: periodEnd,
        nextBillingDate: nextBilling,
      },
    });

    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId: sub.id,
        action: 'RENEWED',
        previousStatus: sub.status,
        newStatus: 'ACTIVE',
        performedBy: req.user?.name || 'User',
        notes: `Subscription renewed for another ${sub.billingFrequency.toLowerCase()} period until ${periodEnd.toISOString().split('T')[0]}.`,
      },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Renewal failed' });
  }
});

// POST /api/subscriptions/:id/close (Early closure - Respects plan.allowEarlyClosure)
router.post('/:id/close', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { id: req.params.id },
      include: { plan: true },
    });
    if (!sub) {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }

    if (!sub.plan.allowEarlyClosure && req.user?.role !== 'ADMIN') {
      res.status(400).json({ error: 'This subscription plan does not allow early closure.' });
      return;
    }

    const now = new Date();
    const updated = await prisma.subscription.update({
      where: { id: req.params.id },
      data: {
        status: 'CLOSED',
        closedDate: now,
        cancelReason: req.body.reason || 'Closed upon user request.',
      },
    });

    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId: sub.id,
        action: 'CLOSED',
        previousStatus: sub.status,
        newStatus: 'CLOSED',
        performedBy: req.user?.name || 'User',
        notes: req.body.reason || 'Subscription closed early.',
      },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Closure failed' });
  }
});

export default router;
