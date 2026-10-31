import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db.js';
import { AuthRequest, authenticate, requireRole, validatePassword } from '../middleware/auth.js';

const router = Router();

// GET /api/staff (Admin only)
router.get('/', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staff = await prisma.user.findMany({
      where: { role: { in: ['STAFF', 'ADMIN'] } },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(staff);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch staff' });
  }
});

// POST /api/staff (Admin only)
router.post('/', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and temporary password are required' });
      return;
    }

    const pwdCheck = validatePassword(password);
    if (!pwdCheck.valid) {
      res.status(400).json({ error: pwdCheck.message });
      return;
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existing) {
      res.status(400).json({ error: 'A user with this email address already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        role: role === 'ADMIN' ? 'ADMIN' : 'STAFF',
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    res.status(201).json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create staff account' });
  }
});

// PUT /api/staff/:id (Admin only)
router.put('/:id', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, role, status } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(role && { role }),
        ...(status && { status }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update staff' });
  }
});

// DELETE /api/staff/:id (Admin only)
router.delete('/:id', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.id === req.params.id) {
      res.status(400).json({ error: 'You cannot delete your own admin account.' });
      return;
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'Staff account deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete staff' });
  }
});

export default router;
