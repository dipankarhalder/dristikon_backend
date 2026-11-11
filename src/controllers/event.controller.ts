import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import Consumer from '../models/consumer.model';
import Event from '../models/event.model';
import { msg } from '../constant';
import { sendErrorResponse, notFoundItem, pagination, cache } from '../utils';

/* create event */
export const createEvent = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { eventName, eventDate, totalAmount, initialPaid, consumerId } = req.body;
    const findConsumer = await Consumer.findById(consumerId).lean();
    if (!findConsumer) {
      return notFoundItem(res, msg.consumerMsg.consumerNotFound);
    }

    const newEvent = new Event({
      eventName,
      eventDate,
      totalAmount,
      initialPaid,
      consumerId,
      consumer: findConsumer,
    });

    await newEvent.save();

    // Invalidate cached events
    await cache.delPattern('cache:events:*');

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      event: newEvent,
      message: msg.eventMsg.newEventCreated,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

/* list of events with pagination and cache */
export const getAllEvents = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { page, limit, skip } = pagination.getPaginationParams(req.query, 50, 100);
    const cacheKey = `cache:events:page=${page}:limit=${limit}`;

    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.status(StatusCodes.OK).json(cachedData);
    }

    const [allEvents, total] = await Promise.all([
      Event.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Event.countDocuments(),
    ]);

    const responsePayload = {
      status: StatusCodes.OK,
      event: allEvents,
      message: msg.eventMsg.eventListRetrieved,
      pagination: pagination.getPaginationMetadata(total, page, limit),
    };

    await cache.set(cacheKey, responsePayload, 60);

    return res.status(StatusCodes.OK).json(responsePayload);
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

/* get events by consumer id */
export const getEvent = async (req: Request, res: Response): Promise<Response> => {
  try {
    const consumerId = req.params.id;
    const eventItems = await Event.find({ consumerId }).sort({ createdAt: -1 }).lean();

    if (!eventItems || eventItems.length === 0) {
      return notFoundItem(res, msg.eventMsg.eventNotFound);
    }

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      event: eventItems,
      message: msg.eventMsg.eventListRetrieved,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

export default {
  createEvent,
  getAllEvents,
  getEvent,
};
