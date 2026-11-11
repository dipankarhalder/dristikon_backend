import express, { Router, RequestHandler } from 'express';
import { routers } from '../../constant';
import {
  health,
  auth,
  profile,
  categoryServices,
  consumer,
  transactionServices,
  eventServices,
  uploadServices,
  notificationServices,
} from '../../controllers';
import verifyToken from '../../middleware/verifyAuthToken';
import validateObjectId from '../../middleware/validateObjectId';
import authorizeRole from '../../middleware/authorizeRole';
import { mutationLimiter } from '../../middleware/rateLimiter';
import { uploadSingle, uploadMultiple } from '../../middleware/fileUpload';

const router: Router = express.Router();

const authHandler = verifyToken as unknown as RequestHandler;

/* health check */
router.get(routers.endPoints.health, health.getHealth as unknown as RequestHandler);

/* authentication */
router.post(routers.endPoints.signup, auth.userSignup as unknown as RequestHandler);
router.post(routers.endPoints.signin, auth.userSignin as unknown as RequestHandler);
router.post(routers.endPoints.signout, authHandler, auth.userSignout as unknown as RequestHandler);
router.post(routers.endPoints.refreshToken, auth.refreshAccessToken as unknown as RequestHandler);

/* profile */
router.get(routers.endPoints.getProfile, authHandler, profile.getProfile as unknown as RequestHandler);
router.get(
  routers.endPoints.getProfileLists,
  authHandler,
  authorizeRole('super_admin', 'collaborator') as unknown as RequestHandler,
  profile.getProfileLists as unknown as RequestHandler,
);
router.post(
  routers.endPoints.createProfile,
  authHandler,
  authorizeRole('super_admin') as unknown as RequestHandler,
  mutationLimiter,
  profile.createProfile as unknown as RequestHandler,
);
router.patch(routers.endPoints.updatePassword, authHandler, mutationLimiter, profile.updatePassword as unknown as RequestHandler);
router.patch(routers.endPoints.updateAddress, authHandler, mutationLimiter, profile.updateAddress as unknown as RequestHandler);

/* consumers */
router.post(routers.endPoints.newConsumer, authHandler, mutationLimiter, consumer.createConsumer as unknown as RequestHandler);
router.get(routers.endPoints.listConsumers, authHandler, consumer.listConsumers as unknown as RequestHandler);
router.patch(
  routers.endPoints.consumerItem,
  authHandler,
  validateObjectId('id'),
  mutationLimiter,
  consumer.editConsumer as unknown as RequestHandler,
);
router.get(
  routers.endPoints.consumerItem,
  authHandler,
  validateObjectId('id'),
  consumer.getConsumer as unknown as RequestHandler,
);
router.delete(
  routers.endPoints.consumerItem,
  authHandler,
  validateObjectId('id'),
  authorizeRole('super_admin') as unknown as RequestHandler,
  mutationLimiter,
  consumer.deleteConsumer as unknown as RequestHandler,
);

/* categories */
router.post(
  routers.endPoints.newCategory,
  authHandler,
  mutationLimiter,
  categoryServices.createCategory as unknown as RequestHandler,
);
router.get(routers.endPoints.listCategory, authHandler, categoryServices.listCategories as unknown as RequestHandler);
router.get(
  routers.endPoints.categoryItem,
  authHandler,
  validateObjectId('id'),
  categoryServices.getCategory as unknown as RequestHandler,
);
router.delete(
  routers.endPoints.categoryItem,
  authHandler,
  validateObjectId('id'),
  authorizeRole('super_admin') as unknown as RequestHandler,
  mutationLimiter,
  categoryServices.deleteCategory as unknown as RequestHandler,
);

/* transactions */
router.post(
  routers.endPoints.newTransaction,
  authHandler,
  mutationLimiter,
  transactionServices.createTransaction as unknown as RequestHandler,
);
router.get(routers.endPoints.listTransactions, authHandler, transactionServices.getAllTransaction as unknown as RequestHandler);
router.get(
  routers.endPoints.transactionItem,
  authHandler,
  validateObjectId('id'),
  transactionServices.getTransaction as unknown as RequestHandler,
);

/* events */
router.post(routers.endPoints.newEvent, authHandler, mutationLimiter, eventServices.createEvent as unknown as RequestHandler);
router.get(routers.endPoints.listEvents, authHandler, eventServices.getAllEvents as unknown as RequestHandler);
router.get(routers.endPoints.eventItem, authHandler, validateObjectId('id'), eventServices.getEvent as unknown as RequestHandler);

/* file upload */
router.post(
  routers.endPoints.uploadFile,
  authHandler,
  mutationLimiter,
  uploadSingle,
  uploadServices.uploadSingle as unknown as RequestHandler,
);
router.post(
  routers.endPoints.uploadMultipleFiles,
  authHandler,
  mutationLimiter,
  uploadMultiple,
  uploadServices.uploadMultiple as unknown as RequestHandler,
);
router.delete(
  routers.endPoints.deleteFile,
  authHandler,
  authorizeRole('super_admin', 'collaborator') as unknown as RequestHandler,
  mutationLimiter,
  uploadServices.deleteFile as unknown as RequestHandler,
);

/* notifications (Kafka Async Queue) */
router.post(
  routers.endPoints.broadcastNotification,
  authHandler,
  authorizeRole('super_admin') as unknown as RequestHandler,
  mutationLimiter,
  notificationServices.queueBroadcastNotification as unknown as RequestHandler,
);
router.get(routers.endPoints.listNotifications, authHandler, notificationServices.getNotifications as unknown as RequestHandler);

export const v1Routes = router;
export default {
  v1Routes,
};
