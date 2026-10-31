import { Router, Response } from 'express';
import prisma from '../db.js';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/plans
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { frequency, status } = req.query;
    const where: any = {};
    if (frequency && frequency !== 'ALL') where.billingFrequency = String(frequency);
    if (status && status !== 'ALL') where.status = String(status);

    const plans = await prisma.subscriptionPlan.findMany({
      where,
      include: {
        product: true,
        _count: { select: { subscriptions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(plans);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch plans' });
  }
});

// GET /api/plans/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: req.params.id },
      include: {
        product: { include: { variants: true } },
        subscriptions: { include: { customer: true } },
      },
    });
    if (!plan) {
      res.status(404).json({ error: 'Plan not found' });
      return;
    }
    res.json(plan);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch plan' });
  }
});

// POST /api/plans (Admin only)
router.post('/', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      code,
      productId,
      billingFrequency,
      price,
      minQuantity,
      startDate,
      endDate,
      autoCloseOnEnd,
      allowPause,
      allowEarlyClosure,
      allowRenewal,
      status,
    } = req.body;

    if (!name || !productId || price === undefined) {
      res.status(400).json({ error: 'Name, product, and price are required' });
      return;
    }

    const planCode = code || `PLAN-${name.replace(/\s+/g, '-').toUpperCase().slice(0, 10)}-${Date.now().toString().slice(-4)}`;

    const newPlan = await prisma.subscriptionPlan.create({
      data: {
        name,
        code: planCode,
        productId,
        billingFrequency: billingFrequency || 'MONTHLY',
        price: Number(price),
        minQuantity: Number(minQuantity || 1),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        autoCloseOnEnd: autoCloseOnEnd !== undefined ? Boolean(autoCloseOnEnd) : true,
        allowPause: allowPause !== undefined ? Boolean(allowPause) : true,
        allowEarlyClosure: allowEarlyClosure !== undefined ? Boolean(allowEarlyClosure) : true,
        allowRenewal: allowRenewal !== undefined ? Boolean(allowRenewal) : true,
        status: status || 'ACTIVE',
      },
      include: { product: true },
    });

    res.status(201).json(newPlan);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create plan' });
  }
});

// PUT /api/plans/:id (Admin only)
router.put('/:id', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      code,
      productId,
      billingFrequency,
      price,
      minQuantity,
      startDate,
      endDate,
      autoCloseOnEnd,
      allowPause,
      allowEarlyClosure,
      allowRenewal,
      status,
    } = req.body;

    const updated = await prisma.subscriptionPlan.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(productId && { productId }),
        ...(billingFrequency && { billingFrequency }),
        ...(price !== undefined && { price: Number(price) }),
        ...(minQuantity !== undefined && { minQuantity: Number(minQuantity) }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(autoCloseOnEnd !== undefined && { autoCloseOnEnd: Boolean(autoCloseOnEnd) }),
        ...(allowPause !== undefined && { allowPause: Boolean(allowPause) }),
        ...(allowEarlyClosure !== undefined && { allowEarlyClosure: Boolean(allowEarlyClosure) }),
        ...(allowRenewal !== undefined && { allowRenewal: Boolean(allowRenewal) }),
        ...(status && { status }),
      },
      include: { product: true },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update plan' });
  }
});

// DELETE /api/plans/:id (Admin only)
router.delete('/:id', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.subscriptionPlan.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Plan deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete plan' });
  }
});

export default router;
