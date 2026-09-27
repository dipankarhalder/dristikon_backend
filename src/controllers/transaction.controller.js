const { StatusCodes } = require('http-status-codes');
const Event = require('../models/event.model');
const Transaction = require('../models/transaction.model');
const { msg } = require('../constant');
const { sendErrorResponse, notFoundItem, validateFields, pagination, cache } = require('../utils');

/* create transaction with atomic update preventing race conditions */
const createTransaction = async (req, res) => {
  try {
    const { eventId, customerId, paidAmount } = req.body;

    const numPaid = Number(paidAmount);
    if (isNaN(numPaid) || numPaid <= 0) {
      return validateFields(res, 'Paid amount must be a positive number.');
    }

    // Atomic update: only decrements if event exists and remaining totalAmount >= paidAmount
    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: eventId,
        totalAmount: { $gte: numPaid },
      },
      {
        $inc: { totalAmount: -numPaid },
      },
      { new: true },
    ).lean();

    if (!updatedEvent) {
      // Check if event exists to give precise error
      const eventExists = await Event.findById(eventId).lean();
      if (!eventExists) {
        return notFoundItem(res, msg.eventMsg.eventNotFound);
      }
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: msg.transactionMsg.amountExceeds,
      });
    }

    const newTransaction = new Transaction({
      eventId,
      customerId,
      paidAmount: numPaid,
      pendingAmount: updatedEvent.totalAmount,
      paymentStatus: updatedEvent.totalAmount === 0 ? 'Paid' : 'Pending',
      event: updatedEvent,
    });

    await newTransaction.save();

    // Invalidate cached transactions and events
    await cache.delPattern('cache:transactions:*');
    await cache.delPattern('cache:events:*');

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      transaction: newTransaction,
      message: msg.transactionMsg.newTransactionCreated,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

/* list of transactions with pagination and cache */
const getAllTransaction = async (req, res) => {
  try {
    const { page, limit, skip } = pagination.getPaginationParams(req.query, 50, 100);
    const cacheKey = `cache:transactions:page=${page}:limit=${limit}`;

    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.status(StatusCodes.OK).json(cachedData);
    }

    const [allTransactions, total] = await Promise.all([
      Transaction.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(),
    ]);

    const responsePayload = {
      status: StatusCodes.OK,
      event: allTransactions,
      message: msg.transactionMsg.transactionListRetrieved,
      pagination: pagination.getPaginationMetadata(total, page, limit),
    };

    await cache.set(cacheKey, responsePayload, 60);

    return res.status(StatusCodes.OK).json(responsePayload);
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

/* get transactions by event id */
const getTransaction = async (req, res) => {
  try {
    const eventId = req.params.id;
    const transactionItems = await Transaction.find({ eventId }).sort({ createdAt: -1 }).lean();

    if (!transactionItems || transactionItems.length === 0) {
      return notFoundItem(res, msg.transactionMsg.transactionNotFound);
    }

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      event: transactionItems,
      message: msg.transactionMsg.transactionListRetrieved,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

module.exports = {
  createTransaction,
  getAllTransaction,
  getTransaction,
};
