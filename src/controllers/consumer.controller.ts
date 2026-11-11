import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import User from '../models/user.model';
import Consumer from '../models/consumer.model';
import { msg } from '../constant';
import { consumerValidate } from '../validation';
import { validateFields, sendErrorResponse, notFoundItem, pagination, cache } from '../utils';
import { AuthenticatedRequest } from '../types';

/* create consumer */
export const createConsumer = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const decoded = req.user;
    if (!decoded) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        message: 'Authentication required.',
      });
    }

    const { error, value } = consumerValidate.consumerInfoSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return validateFields(res, error.details.map((detail) => detail.message).join(', '));
    }
    const existingConsumer = await Consumer.findOne({
      email: value.email,
    });
    if (existingConsumer) {
      return validateFields(res, msg.consumerMsg.consumerAlreadyExist);
    }
    const user = await User.findById(decoded.userid).select('-password -refreshToken').lean();
    if (!user) {
      return notFoundItem(res, msg.userMsg.userNotFound);
    }
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
      user: decoded.userid,
    });
    await newConsumer.save();

    // Invalidate cached consumer lists
    await cache.delPattern('cache:consumers:*');

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      consumer: newConsumer,
      message: msg.consumerMsg.newConsumerCreated,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

/* list of consumers with pagination and cache */
export const listConsumers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { page, limit, skip } = pagination.getPaginationParams(req.query, 50, 100);
    const cacheKey = `cache:consumers:page=${page}:limit=${limit}`;

    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.status(StatusCodes.OK).json(cachedData);
    }

    const [consumers, total] = await Promise.all([
      Consumer.find().sort({ _id: -1 }).skip(skip).limit(limit).lean(),
      Consumer.countDocuments(),
    ]);

    const responsePayload = {
      status: StatusCodes.OK,
      list: consumers,
      pagination: pagination.getPaginationMetadata(total, page, limit),
    };

    await cache.set(cacheKey, responsePayload, 60);

    return res.status(StatusCodes.OK).json(responsePayload);
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

/* edit consumer */
export const editConsumer = async (req: Request, res: Response): Promise<Response> => {
  try {
    const consumerId = req.params.id;
    const { error, value } = consumerValidate.consumerInfoSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return validateFields(res, error.details.map((detail) => detail.message).join(', '));
    }

    const updatedConsumer = await Consumer.findByIdAndUpdate(
      consumerId,
      {
        $set: {
          name: value.name,
          phone: value.phone,
          address: {
            area: value.area,
            landmark: value.landmark,
            city: value.city,
            state: value.state,
            pincode: value.pincode,
          },
        },
      },
      { new: true, runValidators: true },
    ).lean();

    if (!updatedConsumer) {
      return notFoundItem(res, msg.consumerMsg.consumerNotFound);
    }

    // Invalidate cached consumer lists
    await cache.delPattern('cache:consumers:*');

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
export const getConsumer = async (req: Request, res: Response): Promise<Response> => {
  try {
    const consumerId = req.params.id;
    const consumerDetails = await Consumer.findById(consumerId).lean();
    if (!consumerDetails) {
      return notFoundItem(res, msg.consumerMsg.consumerNotFound);
    }
    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      details: consumerDetails,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

/* delete consumer */
export const deleteConsumer = async (req: Request, res: Response): Promise<Response> => {
  try {
    const consumerId = req.params.id;
    const consumer = await Consumer.findByIdAndDelete(consumerId);
    if (!consumer) {
      return notFoundItem(res, msg.consumerMsg.consumerNotFound);
    }

    // Invalidate cached consumer lists
    await cache.delPattern('cache:consumers:*');

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: msg.consumerMsg.consumerDeleted,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

export default {
  createConsumer,
  listConsumers,
  editConsumer,
  getConsumer,
  deleteConsumer,
};
