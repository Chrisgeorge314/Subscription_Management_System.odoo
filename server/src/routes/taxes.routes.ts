import { Router, Response } from 'express';
import prisma from '../db.js';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/taxes
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const taxes = await prisma.taxRule.findMany({
      orderBy: { rate: 'asc' },
    });
    res.json(taxes);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch tax rules' });
  }
});

// POST /api/taxes (Admin only)
router.post('/', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, code, rate, type, applicableProductTypes, isCompound, isActive } = req.body;
    if (!name || rate === undefined) {
      res.status(400).json({ error: 'Name and rate are required' });
      return;
    }

    const taxCode = code || `TAX-${rate}-${Date.now().toString().slice(-4)}`;

    const newTax = await prisma.taxRule.create({
      data: {
        name,
        code: taxCode,
        rate: Number(rate),
        type: type || 'PERCENTAGE',
        applicableProductTypes: applicableProductTypes || 'ALL',
        isCompound: Boolean(isCompound),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    res.status(201).json(newTax);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create tax rule' });
  }
});

// PUT /api/taxes/:id (Admin only)
router.put('/:id', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, code, rate, type, applicableProductTypes, isCompound, isActive } = req.body;
    const updated = await prisma.taxRule.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(rate !== undefined && { rate: Number(rate) }),
        ...(type && { type }),
        ...(applicableProductTypes && { applicableProductTypes }),
        ...(isCompound !== undefined && { isCompound: Boolean(isCompound) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update tax rule' });
  }
});

// DELETE /api/taxes/:id (Admin only)
router.delete('/:id', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.taxRule.delete({ where: { id: req.params.id } });
    res.json({ message: 'Tax rule deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete tax rule' });
  }
});

export default router;
