import { Request, Response } from 'express';
import { NotificationService } from '../../../services/NotificationService';
import { ApiError } from '../../../utils/ApiError';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const limit = parseInt(req.query.limit as string) || 50;

    const notifications = await NotificationService.getUserNotifications(userId, role, limit);

    res.json({
      success: true,
      data: notifications
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    const count = await NotificationService.getUnreadCount(userId, role);

    res.json({
      success: true,
      data: { count }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const notificationId = req.params.id;

    // TODO: Ideally check ownership if needed
    const notification = await NotificationService.markAsRead(notificationId, userId);

    if (!notification) {
      throw new ApiError(404, 'Notification not found');
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    await NotificationService.markAllAsRead(userId, role);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
