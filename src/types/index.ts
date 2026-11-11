import { Request } from 'express';
import { Document, Types } from 'mongoose';

export type UserRole = 'super_admin' | 'collaborator' | 'staff';

export interface IAddress {
  area?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface IUser {
  name: string;
  email: string;
  password?: string;
  phone: string;
  role: UserRole;
  address?: IAddress;
  refreshToken?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserMethods {
  comparePassword(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  generateAuthToken(): string;
}

export type UserDocument = Document<unknown, object, IUser> & IUser & IUserMethods & { _id: Types.ObjectId };

export type NotificationType = 'info' | 'alert' | 'broadcast' | 'event';

export interface INotification {
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export type NotificationDocument = Document<unknown, object, INotification> & INotification & { _id: Types.ObjectId };

export interface IConsumer {
  name: string;
  email: string;
  phone: string;
  address?: IAddress;
  user?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ConsumerDocument = Document<unknown, object, IConsumer> & IConsumer & { _id: Types.ObjectId };

export interface IEvent {
  eventName: string;
  eventDate: string;
  totalAmount: number;
  initialPaid: number;
  consumerId: string;
  consumer: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export type EventDocument = Document<unknown, object, IEvent> & IEvent & { _id: Types.ObjectId };

export interface ICategory {
  categoryName: string;
  description: string;
  user: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CategoryDocument = Document<unknown, object, ICategory> & ICategory & { _id: Types.ObjectId };

export interface ITransaction {
  paidAmount: number;
  pendingAmount: number;
  eventId: string;
  customerId: string;
  paymentStatus: 'Paid' | 'Pending';
  event: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TransactionDocument = Document<unknown, object, ITransaction> & ITransaction & { _id: Types.ObjectId };

export interface AuthUserPayload {
  userid: string;
  email?: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
  token?: string;
}

export interface BroadcastNotificationPayload {
  title: string;
  message: string;
  type?: NotificationType;
  metadata?: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  status: number;
  msg?: string;
  data?: T;
  error?: {
    message: string;
  };
}
