import { Router, Response } from 'express';
import prisma from '../db.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/notifications
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    const unreadCount = await prisma.notification.count({ where: { isRead: false } });
    res.json({ notifications, unreadCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch notifications' });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to mark notification as read' });
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to mark all as read' });
  }
});

export default router;
