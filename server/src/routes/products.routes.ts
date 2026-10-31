import { Router, Response } from 'express';
import prisma from '../db.js';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/products
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, status } = req.query;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: String(search) } },
        { code: { contains: String(search) } },
        { description: { contains: String(search) } },
      ];
    }
    if (status && status !== 'ALL') {
      where.status = String(status);
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        variants: true,
        plans: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch products' });
  }
});

// GET /api/products/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        variants: true,
        plans: true,
      },
    });
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch product' });
  }
});

// POST /api/products (Admin only)
router.post('/', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, code, type, salesPrice, costPrice, description, status, variants } = req.body;

    if (!name || salesPrice === undefined) {
      res.status(400).json({ error: 'Product name and sales price are required' });
      return;
    }

    const productCode = code || `PRD-${Date.now().toString().slice(-6)}`;

    const newProduct = await prisma.product.create({
      data: {
        name,
        code: productCode,
        type: type || 'SERVICE',
        salesPrice: Number(salesPrice),
        costPrice: Number(costPrice || 0),
        description: description || null,
        status: status || 'ACTIVE',
        variants: {
          create: Array.isArray(variants) && variants.length > 0
            ? variants.map((v: any) => ({
                name: v.name,
                sku: v.sku || null,
                additionalPrice: Number(v.additionalPrice || 0),
                isDefault: Boolean(v.isDefault),
              }))
            : [{ name: 'Default Standard', additionalPrice: 0, isDefault: true }],
        },
      },
      include: {
        variants: true,
        plans: true,
      },
    });

    res.status(201).json(newProduct);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create product' });
  }
});

// PUT /api/products/:id (Admin only)
router.put('/:id', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, code, type, salesPrice, costPrice, description, status, variants } = req.body;

    // Update product & manage variants
    const updated = await prisma.$transaction(async (tx) => {
      if (Array.isArray(variants)) {
        await tx.productVariant.deleteMany({
          where: { productId: req.params.id },
        });
        await tx.productVariant.createMany({
          data: variants.map((v: any) => ({
            productId: req.params.id,
            name: v.name,
            sku: v.sku || null,
            additionalPrice: Number(v.additionalPrice || 0),
            isDefault: Boolean(v.isDefault),
          })),
        });
      }

      return await tx.product.update({
        where: { id: req.params.id },
        data: {
          ...(name && { name }),
          ...(code && { code }),
          ...(type && { type }),
          ...(salesPrice !== undefined && { salesPrice: Number(salesPrice) }),
          ...(costPrice !== undefined && { costPrice: Number(costPrice) }),
          ...(description !== undefined && { description }),
          ...(status && { status }),
        },
        include: {
          variants: true,
          plans: true,
        },
      });
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update product' });
  }
});

// DELETE /api/products/:id (Admin only)
router.delete('/:id', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.product.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Product deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete product' });
  }
});

export default router;
