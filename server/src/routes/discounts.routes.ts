import { Router, Response } from 'express';
import prisma from '../db.js';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/discounts
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const discounts = await prisma.discountRule.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(discounts);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch discounts' });
  }
});

// POST /api/discounts (Admin only)
router.post('/', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, code, type, value, scope, minPurchaseAmount, minQuantity, maxUsageCount, startDate, endDate, isActive } = req.body;

    if (!name || !code || value === undefined) {
      res.status(400).json({ error: 'Name, code, and value are required' });
      return;
    }

    const newDiscount = await prisma.discountRule.create({
      data: {
        name,
        code: String(code).toUpperCase().trim(),
        type: type || 'PERCENTAGE',
        value: Number(value),
        scope: scope || 'SUBSCRIPTION',
        minPurchaseAmount: minPurchaseAmount ? Number(minPurchaseAmount) : null,
        minQuantity: minQuantity ? Number(minQuantity) : null,
        maxUsageCount: maxUsageCount ? Number(maxUsageCount) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    res.status(201).json(newDiscount);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create discount' });
  }
});

// PUT /api/discounts/:id (Admin only)
router.put('/:id', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, code, type, value, scope, minPurchaseAmount, minQuantity, maxUsageCount, startDate, endDate, isActive } = req.body;
    const updated = await prisma.discountRule.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(code && { code: String(code).toUpperCase().trim() }),
        ...(type && { type }),
        ...(value !== undefined && { value: Number(value) }),
        ...(scope && { scope }),
        ...(minPurchaseAmount !== undefined && { minPurchaseAmount: minPurchaseAmount ? Number(minPurchaseAmount) : null }),
        ...(minQuantity !== undefined && { minQuantity: minQuantity ? Number(minQuantity) : null }),
        ...(maxUsageCount !== undefined && { maxUsageCount: maxUsageCount ? Number(maxUsageCount) : null }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update discount rule' });
  }
});

// DELETE /api/discounts/:id (Admin only)
router.delete('/:id', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.discountRule.delete({ where: { id: req.params.id } });
    res.json({ message: 'Discount rule deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete discount rule' });
  }
});

export default router;
