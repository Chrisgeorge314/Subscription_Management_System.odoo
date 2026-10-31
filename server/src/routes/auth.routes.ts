import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db.js';
import { AuthRequest, authenticate, validatePassword } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'brightloop_jwt_secret_default_key_2026';

// POST /api/auth/login
router.post('/login', async (req, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { customer: true },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({ error: 'Your account is deactivated. Contact an administrator.' });
      return;
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        customerId: user.customerId,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        customerId: user.customerId,
        customer: user.customer,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server login error' });
  }
});

// POST /api/auth/register (For Customer self-registration or demo)
router.post('/register', async (req, res: Response): Promise<void> => {
  try {
    const { name, email, password, company, phone } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    // Password validation rule
    const pwdCheck = validatePassword(password);
    if (!pwdCheck.valid) {
      res.status(400).json({ error: pwdCheck.message });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existingUser) {
      res.status(400).json({ error: 'An account with this email address already exists.' });
      return;
    }

    // Create or find customer profile
    let customer = await prisma.customer.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name,
          email: email.toLowerCase().trim(),
          company: company || `${name}'s Organization`,
          phone: phone || null,
        },
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'CUSTOMER',
        customerId: customer.id,
      },
      include: { customer: true },
    });

    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        customerId: newUser.customerId,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        customerId: newUser.customerId,
        customer: newUser.customer,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      // Don't leak user existence in production, but confirm acceptance
      res.json({ message: 'If that email exists in our system, password reset instructions have been generated.' });
      return;
    }

    const resetToken = `reset_${Math.random().toString(36).substring(2)}_${Date.now()}`;
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetExpires },
    });

    res.json({
      message: 'Password reset link generated successfully.',
      resetToken, // for demo display and easy testing
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Forgot password failed' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ error: 'Token and new password are required' });
      return;
    }

    const pwdCheck = validatePassword(newPassword);
    if (!pwdCheck.valid) {
      res.status(400).json({ error: pwdCheck.message });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired password reset token' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetExpires: null,
      },
    });

    res.json({ message: 'Password has been successfully updated. You may now login.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Reset password failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      include: { customer: true },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      customerId: user.customerId,
      customer: user.customer,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch user' });
  }
});

export default router;
