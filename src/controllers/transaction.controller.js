const { StatusCodes } = require('http-status-codes');
const Event = require('../models/event.model');
const Transaction = require('../models/transaction.model');
const { msg } = require('../constant');
// const { categoryValidate } = require('../validation');
const { sendErrorResponse } = require('../utils');

/* create transaction */
const createTransaction = async (req, res) => {
  try {
    const { eventId, customerId, paidAmount } = req.body;
    const eventInfo = await Event.findById(eventId).select('-consumer');
    if (eventInfo.totalAmount < paidAmount) {
      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        transaction: 'Can not allow',
      });
    }

    const pendingAmount = eventInfo.totalAmount - paidAmount;
    const newUpdate = await Event.findByIdAndUpdate(eventId, { $set: { totalAmount: pendingAmount } }, { new: true });
    const newTransaction = new Transaction({
      eventId,
      customerId,
      paidAmount,
      pendingAmount: pendingAmount,
      paymentStatus: pendingAmount === 0 ? 'Paid' : 'Pending',
      event: newUpdate,
    });

    await newTransaction.save();
    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      transaction: newTransaction,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

/* list of event */
const getAllTransaction = async (req, res) => {
  try {
    const allTransaction = await Transaction.find();
    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      event: allTransaction,
      message: msg.categoryMsg.newCategoryCreated,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

/* get event */
const getTransaction = async (req, res) => {
  try {
    const eventId = req.params.id;
    const transactionItem = await Transaction.find({ eventId });
    if (!transactionItem) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: StatusCodes.NOT_FOUND,
        message: 'Event not found for this consumer.',
      });
    }

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      event: transactionItem,
      message: msg.categoryMsg.newCategoryCreated,
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
