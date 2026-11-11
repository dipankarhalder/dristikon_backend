const express = require('express');
const router = express.Router();

const { routers } = require('../../constant');
const { health, auth, profile, categoryServices, consumer, transactionServices, eventServices } = require('../../controllers');
const verifyToken = require('../../middleware/verifyAuthToken');
const validateObjectId = require('../../middleware/validateObjectId');
const authorizeRole = require('../../middleware/authorizeRole');
const { mutationLimiter } = require('../../middleware/rateLimiter');

/* health check */
router.get(routers.endPoints.health, health.getHealth);

/* authentication */
router.post(routers.endPoints.signup, auth.userSignup);
router.post(routers.endPoints.signin, auth.userSignin);
router.post(routers.endPoints.signout, auth.userSignout);
router.post(routers.endPoints.refreshToken, auth.refreshAccessToken);

/* profile */
router.get(routers.endPoints.getProfile, verifyToken, profile.getProfile);
router.get(routers.endPoints.getProfileLists, verifyToken, authorizeRole('super_admin', 'collaborator'), profile.getProfileLists);
router.post(routers.endPoints.createProfile, verifyToken, authorizeRole('super_admin'), mutationLimiter, profile.createProfile);
router.patch(routers.endPoints.updatePassword, verifyToken, mutationLimiter, profile.updatePassword);
router.patch(routers.endPoints.updateAddress, verifyToken, mutationLimiter, profile.updateAddress);

/* consumers */
router.post(routers.endPoints.newConsumer, verifyToken, mutationLimiter, consumer.createConsumer);
router.get(routers.endPoints.listConsumers, verifyToken, consumer.listConsumers);
router.patch(routers.endPoints.consumerItem, verifyToken, validateObjectId('id'), mutationLimiter, consumer.editConsumer);
router.get(routers.endPoints.consumerItem, verifyToken, validateObjectId('id'), consumer.getConsumer);
router.delete(
  routers.endPoints.consumerItem,
  verifyToken,
  validateObjectId('id'),
  authorizeRole('super_admin'),
  mutationLimiter,
  consumer.deleteConsumer,
);

/* categories */
router.post(routers.endPoints.newCategory, verifyToken, mutationLimiter, categoryServices.createCategory);
router.get(routers.endPoints.listCategory, verifyToken, categoryServices.listCategories);
router.get(routers.endPoints.categoryItem, verifyToken, validateObjectId('id'), categoryServices.getCategory);
router.delete(
  routers.endPoints.categoryItem,
  verifyToken,
  validateObjectId('id'),
  authorizeRole('super_admin'),
  mutationLimiter,
  categoryServices.deleteCategory,
);

/* transactions */
router.post(routers.endPoints.newTransaction, verifyToken, mutationLimiter, transactionServices.createTransaction);
router.get(routers.endPoints.listTransactions, verifyToken, transactionServices.getAllTransaction);
router.get(routers.endPoints.transactionItem, verifyToken, validateObjectId('id'), transactionServices.getTransaction);

/* events */
router.post(routers.endPoints.newEvent, verifyToken, mutationLimiter, eventServices.createEvent);
router.get(routers.endPoints.listEvents, verifyToken, eventServices.getAllEvents);
router.get(routers.endPoints.eventItem, verifyToken, validateObjectId('id'), eventServices.getEvent);

module.exports = {
  v1Routes: router,
};
