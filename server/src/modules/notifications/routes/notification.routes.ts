import { Router } from 'express';
import { authenticate } from '../../auth/middleware/auth.middleware';
import * as notificationController from '../controllers/notification.controller';

const router = Router();

// Apply auth middleware to all notification routes
router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/mark-all-read', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

export default router;
