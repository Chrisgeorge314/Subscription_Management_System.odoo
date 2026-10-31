import { Router, Response } from 'express';
import prisma from '../db.js';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/customers
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // If Customer role, only return their own profile
    if (req.user?.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { id: req.user.customerId || '' },
        include: {
          subscriptions: { include: { plan: true } },
          invoices: true,
          payments: true,
        },
      });
      res.json(customer ? [customer] : []);
      return;
    }

    const { search, status } = req.query;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: String(search) } },
        { email: { contains: String(search) } },
        { company: { contains: String(search) } },
        { phone: { contains: String(search) } },
        { taxNumber: { contains: String(search) } },
      ];
    }
    if (status && status !== 'ALL') where.status = String(status);

    const customers = await prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: {
            subscriptions: true,
            invoices: true,
            payments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(customers);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch customers' });
  }
});

// GET /api/customers/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // If Customer role, verify they are only requesting their own id
    if (req.user?.role === 'CUSTOMER' && req.user.customerId !== req.params.id) {
      res.status(403).json({ error: 'Access forbidden. Customers may only view their own profile.' });
      return;
    }

    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        subscriptions: {
          include: {
            plan: true,
            lines: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          include: { lines: true, payments: true },
          orderBy: { issueDate: 'desc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        quotations: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    res.json(customer);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch customer profile' });
  }
});

// POST /api/customers (Staff or Admin)
router.post('/', authenticate, requireRole(['ADMIN', 'STAFF']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, company, billingAddress, city, state, postalCode, country, taxNumber, notes } = req.body;

    if (!name || !email) {
      res.status(400).json({ error: 'Customer name and email are required' });
      return;
    }

    const existing = await prisma.customer.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existing) {
      res.status(400).json({ error: 'A customer with this email already exists' });
      return;
    }

    const newCustomer = await prisma.customer.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        phone: phone || null,
        company: company || null,
        billingAddress: billingAddress || null,
        city: city || null,
        state: state || null,
        postalCode: postalCode || null,
        country: country || 'India',
        taxNumber: taxNumber || null,
        notes: notes || null,
      },
    });

    res.status(201).json(newCustomer);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create customer' });
  }
});

// PUT /api/customers/:id
router.put('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role === 'CUSTOMER' && req.user.customerId !== req.params.id) {
      res.status(403).json({ error: 'Access forbidden. Customers may only edit their own profile.' });
      return;
    }

    const { name, phone, company, billingAddress, city, state, postalCode, country, taxNumber, notes, status } = req.body;

    const updated = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(company !== undefined && { company }),
        ...(billingAddress !== undefined && { billingAddress }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(postalCode !== undefined && { postalCode }),
        ...(country !== undefined && { country }),
        ...(taxNumber !== undefined && { taxNumber }),
        ...(notes !== undefined && { notes }),
        ...(status && req.user?.role !== 'CUSTOMER' && { status }),
      },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update customer' });
  }
});

// DELETE /api/customers/:id (Admin only)
router.delete('/:id', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.customer.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Customer deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete customer' });
  }
});

export default router;
