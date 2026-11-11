import mongoose, { Schema, Model } from 'mongoose';
import { IEvent } from '../types';

export type EventModel = Model<IEvent>;

const EventSchema = new Schema<IEvent, EventModel>(
  {
    eventName: {
      type: String,
      required: true,
      trim: true,
    },
    eventDate: {
      type: String,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    initialPaid: {
      type: Number,
      required: true,
      min: 0,
    },
    consumerId: {
      type: String,
      required: true,
    },
    consumer: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true },
);

/* performance indexes */
EventSchema.index({ consumerId: 1, createdAt: -1 });
EventSchema.index({ createdAt: -1 });

export const Event = mongoose.model<IEvent, EventModel>('Event', EventSchema);
export default Event;
