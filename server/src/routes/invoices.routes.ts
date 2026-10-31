import { Router, Response } from 'express';
import prisma from '../db.js';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth.js';
import { BillingService } from '../services/billingService.js';

const router = Router();

// GET /api/invoices
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
        { invoiceNumber: { contains: String(search) } },
        { customer: { name: { contains: String(search) } } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: true,
        subscription: true,
        payments: true,
      },
      orderBy: { issueDate: 'desc' },
    });

    res.json(invoices);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch invoices' });
  }
});

// GET /api/invoices/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        subscription: { include: { plan: true } },
        lines: {
          include: { product: true, variant: true },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    if (req.user?.role === 'CUSTOMER' && invoice.customerId !== req.user.customerId) {
      res.status(403).json({ error: 'Access forbidden. Customers can only view their own invoices.' });
      return;
    }

    res.json(invoice);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch invoice details' });
  }
});

// POST /api/invoices (Create manual invoice)
router.post('/', authenticate, requireRole(['ADMIN', 'STAFF']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { customerId, subscriptionId, paymentTerms, dueDate, lines, notes } = req.body;

    if (!customerId || !Array.isArray(lines) || lines.length === 0) {
      res.status(400).json({ error: 'Customer and invoice item lines are required' });
      return;
    }

    const count = await prisma.invoice.count();
    const invoiceNumber = `INV-2026-${(count + 1188).toString()}`;

    const now = new Date();
    const due = dueDate ? new Date(dueDate) : new Date(now.getTime() + 15 * 86400000);

    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;

    const processedLines = lines.map((l: any) => {
      const qty = Number(l.quantity || 1);
      const unitPrice = Number(l.unitPrice || 0);
      const disc = Number(l.discountAmount || 0);
      const taxRate = Number(l.taxRate || 18.0);

      const lineSub = Math.max(0, qty * unitPrice - disc);
      const lineTax = (lineSub * taxRate) / 100;
      const lineTotal = lineSub + lineTax;

      subtotal += qty * unitPrice;
      discountAmount += disc;
      taxAmount += lineTax;

      return {
        productId: l.productId || null,
        variantId: l.variantId || null,
        description: l.description || 'Professional SaaS Services',
        quantity: qty,
        unitPrice,
        discountAmount: disc,
        taxRate,
        taxAmount: lineTax,
        totalAmount: lineTotal,
      };
    });

    const totalAmount = Math.round((subtotal - discountAmount + taxAmount) * 100) / 100;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId,
        subscriptionId: subscriptionId || null,
        issueDate: now,
        dueDate: due,
        status: 'CONFIRMED',
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        paidAmount: 0,
        outstandingAmount: totalAmount,
        paymentTerms: paymentTerms || 'Net 15',
        notes: notes || null,
        lines: { create: processedLines },
      },
      include: {
        customer: true,
        lines: true,
      },
    });

    res.status(201).json(invoice);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create invoice' });
  }
});

// POST /api/invoices/:id/confirm
router.post('/:id/confirm', authenticate, requireRole(['ADMIN', 'STAFF']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: 'CONFIRMED' },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to confirm invoice' });
  }
});

// POST /api/invoices/:id/send
router.post('/:id/send', authenticate, requireRole(['ADMIN', 'STAFF']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: 'SENT' },
    });
    res.json({ message: 'Invoice sent to customer email successfully', invoice: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to send invoice' });
  }
});

// POST /api/invoices/:id/cancel
router.post('/:id/cancel', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED', outstandingAmount: 0 },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to cancel invoice' });
  }
});

// POST /api/invoices/trigger-billing (Hackathon feature: run idempotent recurring billing engine)
router.post('/trigger-billing', authenticate, requireRole(['ADMIN', 'STAFF']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await BillingService.runRecurringBilling();
    res.json({
      message: 'Automated recurring billing cycle executed successfully.',
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Billing cycle trigger failed' });
  }
});

export default router;
