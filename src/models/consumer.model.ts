import mongoose, { Schema, Model } from 'mongoose';
import { IConsumer } from '../types';

export type ConsumerModel = Model<IConsumer>;

const ConsumerSchema = new Schema<IConsumer, ConsumerModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      area: {
        type: String,
      },
      landmark: {
        type: String,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      pincode: {
        type: String,
      },
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  },
);

/* performance indexes */
ConsumerSchema.index({ phone: 1 });
ConsumerSchema.index({ createdAt: -1 });
ConsumerSchema.index({ user: 1 });

export const Consumer = mongoose.model<IConsumer, ConsumerModel>('Consumer', ConsumerSchema);
export default Consumer;
