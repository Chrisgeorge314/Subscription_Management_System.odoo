import { Router, Response } from 'express';
import prisma from '../db.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/payments
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { customerId, invoiceId, method } = req.query;
    const where: any = {};

    if (req.user?.role === 'CUSTOMER') {
      where.customerId = req.user.customerId;
    } else {
      if (customerId) where.customerId = String(customerId);
    }

    if (invoiceId) where.invoiceId = String(invoiceId);
    if (method && method !== 'ALL') where.paymentMethod = String(method);

    const payments = await prisma.payment.findMany({
      where,
      include: {
        customer: true,
        invoice: true,
      },
      orderBy: { paymentDate: 'desc' },
    });

    res.json(payments);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch payments' });
  }
});

// POST /api/payments (Record payment against invoice)
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { invoiceId, amount, paymentMethod, paymentDate, transactionRef, notes } = req.body;

    if (!invoiceId || amount === undefined || Number(amount) <= 0) {
      res.status(400).json({ error: 'Valid invoice and positive payment amount are required' });
      return;
    }

    const payAmount = Number(amount);

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true },
    });

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    // Role check: Customers can only pay their own invoices
    if (req.user?.role === 'CUSTOMER' && invoice.customerId !== req.user.customerId) {
      res.status(403).json({ error: 'Access forbidden. Customers may only pay for their own invoices.' });
      return;
    }

    // Requirement: Prevent recording payments exceeding the outstanding invoice amount
    if (payAmount > invoice.outstandingAmount + 0.01) {
      res.status(400).json({
        error: `Payment amount (₹${payAmount.toLocaleString('en-IN')}) cannot exceed the outstanding invoice balance of ₹${invoice.outstandingAmount.toLocaleString('en-IN')}.`,
      });
      return;
    }

    const count = await prisma.payment.count();
    const paymentNumber = `PAY-2026-${(count + 3022).toString()}`;

    // Transactional settlement
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Payment
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          customerId: invoice.customerId,
          invoiceId: invoice.id,
          amount: payAmount,
          paymentMethod: paymentMethod || 'UPI',
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          transactionRef: transactionRef || `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          status: 'COMPLETED',
          notes: notes || null,
          recordedBy: req.user?.name || 'System',
        },
      });

      // 2. Update Invoice
      const newPaidAmount = invoice.paidAmount + payAmount;
      const newOutstanding = Math.max(0, invoice.totalAmount - newPaidAmount);
      const isFullyPaid = newOutstanding <= 0.01;

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          outstandingAmount: newOutstanding,
          status: isFullyPaid ? 'PAID' : 'PARTIALLY_PAID',
        },
      });

      // 3. Notification
      await tx.notification.create({
        data: {
          type: 'SUCCESS',
          title: `Payment Received: ₹${payAmount.toLocaleString('en-IN')}`,
          message: `Payment ${paymentNumber} recorded for ${invoice.customer.name} on Invoice ${invoice.invoiceNumber}. Balance: ₹${newOutstanding.toLocaleString('en-IN')}`,
          link: '/invoices',
        },
      });

      return { payment, invoice: updatedInvoice };
    });

    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to record payment' });
  }
});

export default router;
