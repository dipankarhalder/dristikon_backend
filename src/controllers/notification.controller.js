const { StatusCodes } = require('http-status-codes');
const Notification = require('../models/notification.model');
const { publishEvent, TOPIC_NOTIFICATIONS } = require('../queue/kafka');
const { sendErrorResponse, validateFields, pagination } = require('../utils');

/* queue a broadcast notification across users via Kafka */
const queueBroadcastNotification = async (req, res) => {
  try {
    const { title, message, type } = req.body;

    if (!title || !message) {
      return validateFields(res, 'Both title and message are required for broadcast notification.');
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
const getNotifications = async (req, res) => {
  try {
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

module.exports = {
  queueBroadcastNotification,
  getNotifications,
};
