import { Router, Response } from 'express';
import prisma from '../db.js';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth.js';
import { BillingService } from '../services/billingService.js';

const router = Router();

// GET /api/quotations
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, customerId } = req.query;
    const where: any = {};

    if (req.user?.role === 'CUSTOMER') {
      where.customerId = req.user.customerId;
    } else {
      if (customerId) where.customerId = String(customerId);
    }

    if (status && status !== 'ALL') where.status = String(status);

    const quotations = await prisma.quotation.findMany({
      where,
      include: {
        customer: true,
        lines: {
          include: {
            product: true,
            variant: true,
            plan: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(quotations);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch quotations' });
  }
});

// GET /api/quotations/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        template: true,
        lines: {
          include: {
            product: true,
            variant: true,
            plan: true,
          },
        },
      },
    });

    if (!quotation) {
      res.status(404).json({ error: 'Quotation not found' });
      return;
    }

    if (req.user?.role === 'CUSTOMER' && quotation.customerId !== req.user.customerId) {
      res.status(403).json({ error: 'Access forbidden' });
      return;
    }

    res.json(quotation);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch quotation' });
  }
});

// POST /api/quotations (Staff or Admin)
router.post('/', authenticate, requireRole(['ADMIN', 'STAFF']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { customerId, templateId, validityDays, lines, terms, notes } = req.body;

    if (!customerId || !Array.isArray(lines) || lines.length === 0) {
      res.status(400).json({ error: 'Customer and at least one item line are required' });
      return;
    }

    const count = await prisma.quotation.count();
    const quotationNumber = `QT-2026-${(count + 1042).toString().padStart(4, '0')}`;

    const days = validityDays ? Number(validityDays) : 30;
    const issueDate = new Date();
    const validUntil = new Date(issueDate);
    validUntil.setDate(validUntil.getDate() + days);

    // Calculate line items, taxes, totals
    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;

    const processedLines = lines.map((line: any) => {
      const qty = Number(line.quantity || 1);
      const unitPrice = Number(line.unitPrice || 0);
      const disc = Number(line.discountAmount || 0);
      const taxRate = Number(line.taxRate || 18.0);

      const lineSubtotal = Math.max(0, qty * unitPrice - disc);
      const lineTax = (lineSubtotal * taxRate) / 100;
      const lineTotal = lineSubtotal + lineTax;

      subtotal += qty * unitPrice;
      discountAmount += disc;
      taxAmount += lineTax;

      return {
        productId: line.productId,
        variantId: line.variantId || null,
        planId: line.planId || null,
        description: line.description || 'Service subscription line item',
        quantity: qty,
        unitPrice,
        discountAmount: disc,
        taxRate,
        taxAmount: lineTax,
        totalAmount: lineTotal,
      };
    });

    const totalAmount = Math.round((subtotal - discountAmount + taxAmount) * 100) / 100;

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        customerId,
        templateId: templateId || null,
        status: 'SENT',
        issueDate,
        validUntil,
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        terms: terms || 'Standard 15-day Net payment terms apply. Prices inclusive of applicable GST.',
        notes: notes || null,
        lines: {
          create: processedLines,
        },
      },
      include: {
        customer: true,
        lines: { include: { product: true, variant: true, plan: true } },
      },
    });

    res.status(201).json(quotation);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create quotation' });
  }
});

// POST /api/quotations/:id/convert (Convert Quotation into Active Subscription!)
router.post('/:id/convert', authenticate, requireRole(['ADMIN', 'STAFF']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: {
        lines: { include: { product: true, variant: true, plan: true } },
        customer: true,
      },
    });

    if (!quotation) {
      res.status(404).json({ error: 'Quotation not found' });
      return;
    }

    if (quotation.status === 'CONVERTED') {
      res.status(400).json({ error: 'This quotation has already been converted into a subscription.' });
      return;
    }

    // Determine plan
    let planId = quotation.lines[0]?.planId;
    if (!planId) {
      const defaultPlan = await prisma.subscriptionPlan.findFirst({
        where: { productId: quotation.lines[0]?.productId },
      });
      planId = defaultPlan?.id;
    }

    if (!planId) {
      res.status(400).json({ error: 'Could not resolve an associated subscription plan for this quotation.' });
      return;
    }

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      res.status(400).json({ error: 'Plan not found' });
      return;
    }

    const now = new Date();
    const { periodEnd, nextBilling } = BillingService.calculateNextPeriod(now, plan.billingFrequency);

    const subCount = await prisma.subscription.count();
    const subscriptionNumber = `SUB-2026-${(subCount + 1049).toString()}`;

    // Perform transaction: Create subscription, initial invoice, update quotation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create subscription
      const subscription = await tx.subscription.create({
        data: {
          subscriptionNumber,
          customerId: quotation.customerId,
          planId: plan.id,
          status: 'ACTIVE',
          billingFrequency: plan.billingFrequency,
          paymentTerms: 'Net 15',
          startDate: now,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          nextBillingDate: nextBilling,
          subtotal: quotation.subtotal,
          taxAmount: quotation.taxAmount,
          discountAmount: quotation.discountAmount,
          totalAmount: quotation.totalAmount,
          autoRenew: true,
          lines: {
            create: quotation.lines.map((l) => ({
              productId: l.productId,
              variantId: l.variantId,
              description: l.description || `${l.product.name}`,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              discountAmount: l.discountAmount,
              taxRate: l.taxRate,
              taxAmount: l.taxAmount,
              totalAmount: l.totalAmount,
            })),
          },
          history: {
            create: [
              {
                action: 'CREATED',
                previousStatus: 'QUOTATION',
                newStatus: 'ACTIVE',
                performedBy: req.user?.name || 'Staff User',
                notes: `Converted from Quotation ${quotation.quotationNumber}`,
              },
            ],
          },
        },
      });

      // 2. Generate Initial Invoice
      const invCount = await tx.invoice.count();
      const invoiceNumber = `INV-2026-${(invCount + 1188).toString()}`;
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + 15);

      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          customerId: quotation.customerId,
          subscriptionId: subscription.id,
          billingPeriodStart: now,
          billingPeriodEnd: periodEnd,
          issueDate: now,
          dueDate,
          status: 'SENT',
          subtotal: quotation.subtotal,
          taxAmount: quotation.taxAmount,
          discountAmount: quotation.discountAmount,
          totalAmount: quotation.totalAmount,
          paidAmount: 0,
          outstandingAmount: quotation.totalAmount,
          paymentTerms: 'Net 15',
          notes: `First billing cycle generated from converted quotation ${quotation.quotationNumber}`,
          lines: {
            create: quotation.lines.map((l) => ({
              productId: l.productId,
              variantId: l.variantId,
              description: `${l.description || l.product.name} (Billing Cycle: ${now.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]})`,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              discountAmount: l.discountAmount,
              taxRate: l.taxRate,
              taxAmount: l.taxAmount,
              totalAmount: l.totalAmount,
            })),
          },
        },
      });

      // 3. Mark quotation as converted
      await tx.quotation.update({
        where: { id: quotation.id },
        data: {
          status: 'CONVERTED',
          convertedSubscriptionId: subscription.id,
        },
      });

      // 4. Notification
      await tx.notification.create({
        data: {
          type: 'SUCCESS',
          title: 'Quotation Converted to Subscription',
          message: `Quotation ${quotation.quotationNumber} successfully converted into active subscription ${subscriptionNumber}.`,
          link: '/subscriptions',
        },
      });

      return { subscription, invoice };
    });

    res.json({
      message: 'Quotation successfully converted to active subscription and invoice generated!',
      subscription: result.subscription,
      invoice: result.invoice,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to convert quotation' });
  }
});

export default router;
