const { StatusCodes } = require('http-status-codes');
const User = require('../models/user.model');
const Consumer = require('../models/consumer.model');
const { msg } = require('../constant');
const { consumerValidate } = require('../validation');
const { validateFields, sendErrorResponse, notFoundItem } = require('../utils');

/* create consumer */
const createConsumer = async (req, res) => {
  try {
    const decoded = req.user;
    const { error, value } = consumerValidate.consumerInfoSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return validateFields(res, error.details.map((detail) => detail.message).join(', '));
    }
    const existingConsumer = await Consumer.findOne({
      email: value.email,
    });
    if (existingConsumer) {
      return validateFields(res, msg.consumerMsg.consumerAlreadyExist);
    }
    const user = await User.findById(decoded.userid).select('-password');
    const newConsumer = new Consumer({
      name: value.name,
      email: value.email,
      phone: value.phone,
      address: {
        area: value.area,
        landmark: value.landmark,
        city: value.city,
        state: value.state,
        pincode: value.pincode,
      },
      user,
    });
    await newConsumer.save();
    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      category: newConsumer,
      message: msg.consumerMsg.newConsumerCreated,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

/* list of consumers */
const listConsumers = async (req, res) => {
  try {
    const consumers = await Consumer.find().sort({ _id: -1 });
    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      list: consumers,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

/* edit consumer */
const editConsumer = async (req, res) => {
  try {
    const consumerId = req.params.id;
    const { error, value } = consumerValidate.consumerInfoSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return validateFields(res, error.details.map((detail) => detail.message).join(', '));
    }
    const existingConsumer = await Consumer.findById(consumerId);
    if (!existingConsumer) {
      return notFoundItem(res, msg.consumerMsg.consumerNotFound);
    }
    const updatedConsumerData = {
      name: value.name || existingConsumer.name,
      phone: value.phone || existingConsumer.phone,
      address: {
        area: value.area || existingConsumer.address.area,
        landmark: value.landmark || existingConsumer.address.landmark,
        city: value.city || existingConsumer.address.city,
        state: value.state || existingConsumer.address.state,
        pincode: value.pincode || existingConsumer.address.pincode,
      },
    };
    const updatedConsumer = await Consumer.findByIdAndUpdate(consumerId, updatedConsumerData, { new: true });
    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      details: updatedConsumer,
      message: msg.consumerMsg.consumerUpdated,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

/* get consumer */
const getConsumer = async (req, res) => {
  try {
    const consumerId = req.params.id;
    const consumerDetails = await Consumer.findById(consumerId);
    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      details: consumerDetails,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

/* delete consumer */
const deleteConsumer = async (req, res) => {
  try {
    const consumerId = req.params.id;
    const consumer = await Consumer.findById(consumerId);
    if (!consumer) {
      return notFoundItem(res, msg.consumerMsg.consumerNotFound);
    }
    await Consumer.findByIdAndDelete(consumerId);
    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: msg.consumerMsg.consumerDeleted,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

module.exports = {
  createConsumer,
  listConsumers,
  editConsumer,
  getConsumer,
  deleteConsumer,
};
