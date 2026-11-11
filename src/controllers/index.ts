import { getHealth } from './health.controller';
import { userSignup, userSignin, userSignout, refreshAccessToken } from './auth.controller';
import { getProfile, getProfileLists, createProfile, updatePassword, updateAddress } from './profile.controller';
import { createCategory, getCategory, listCategories, deleteCategory } from './category.controller';
import { createConsumer, listConsumers, editConsumer, getConsumer, deleteConsumer } from './consumer.controller';
import { createTransaction, getAllTransaction, getTransaction } from './transaction.controller';
import { createEvent, getAllEvents, getEvent } from './event.controller';
import { uploadSingle, uploadMultiple, deleteFile } from './upload.controller';
import { queueBroadcastNotification, getNotifications } from './notification.controller';

export const health = {
  getHealth,
};

export const auth = {
  userSignup,
  userSignin,
  userSignout,
  refreshAccessToken,
};

export const profile = {
  getProfile,
  getProfileLists,
  createProfile,
  updatePassword,
  updateAddress,
};

export const categoryServices = {
  createCategory,
  listCategories,
  getCategory,
  deleteCategory,
};

export const consumer = {
  createConsumer,
  listConsumers,
  editConsumer,
  getConsumer,
  deleteConsumer,
};

export const transactionServices = {
  createTransaction,
  getAllTransaction,
  getTransaction,
};

export const eventServices = {
  createEvent,
  getAllEvents,
  getEvent,
};

export const uploadServices = {
  uploadSingle,
  uploadMultiple,
  deleteFile,
};

export const notificationServices = {
  queueBroadcastNotification,
  getNotifications,
};

export default {
  health,
  auth,
  profile,
  categoryServices,
  consumer,
  transactionServices,
  eventServices,
  uploadServices,
  notificationServices,
};
