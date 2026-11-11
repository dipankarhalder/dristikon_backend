import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import Notification from '../models/notification.model';
import { publishEvent, TOPIC_NOTIFICATIONS } from '../queue/kafka';
import { sendErrorResponse, validateFields, pagination } from '../utils';
import { AuthenticatedRequest } from '../types';

/* queue a broadcast notification across users via Kafka */
export const queueBroadcastNotification = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const { title, message, type } = req.body;

    if (!title || !message) {
      return validateFields(res, 'Both title and message are required for broadcast notification.');
    }

    if (!req.user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        message: 'Authentication required.',
      });
    }

    // Offload heavy write operation to Kafka event broker
    await publishEvent(TOPIC_NOTIFICATIONS, {
      action: 'BROADCAST_NOTIFICATION',
      payload: {
        title,
        message,
        type: type || 'broadcast',
        metadata: {
          initiatedBy: req.user.userid,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return res.status(StatusCodes.ACCEPTED).json({
      status: StatusCodes.ACCEPTED,
      message: 'Notification broadcast has been accepted and queued for asynchronous Kafka stream processing.',
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

/* get notifications for the authenticated user */
export const getNotifications = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        message: 'Authentication required.',
      });
    }

    const userId = req.user.userid;
    const { page, limit, skip } = pagination.getPaginationParams(req.query, 20, 50);

    const [notifications, total] = await Promise.all([
      Notification.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments({ userId }),
    ]);

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      data: notifications,
      pagination: pagination.getPaginationMetadata(total, page, limit),
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

export default {
  queueBroadcastNotification,
  getNotifications,
};
