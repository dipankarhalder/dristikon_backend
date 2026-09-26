const express = require('express');
const router = express.Router();

const { routers } = require('../../constant');
const { health, auth, profile, categoryServices, consumer, transactionServices, eventServices } = require('../../controllers');
const verifyToken = require('../../middleware/verifyAuthToken');

/* health check */
router.get(routers.endPoints.health, health.getHealth);

/* authentication */
router.post(routers.endPoints.signup, auth.userSignup);
router.post(routers.endPoints.signin, auth.userSignin);
router.post(routers.endPoints.signout, auth.userSignout);
router.post(routers.endPoints.refreshToken, auth.refreshAccessToken);

/* profile */
router.get(routers.endPoints.getProfile, verifyToken, profile.getProfile);
router.get(routers.endPoints.getProfileLists, verifyToken, profile.getProfileLists);
router.post(routers.endPoints.createProfile, verifyToken, profile.createProfile);
router.patch(routers.endPoints.updatePassword, verifyToken, profile.updatePassword);
router.patch(routers.endPoints.updateAddress, verifyToken, profile.updateAddress);

/* consumers */
router.post(routers.endPoints.newConsumer, verifyToken, consumer.createConsumer);
router.get(routers.endPoints.listConsumers, verifyToken, consumer.listConsumers);
router.patch(routers.endPoints.consumerItem, verifyToken, consumer.editConsumer);
router.get(routers.endPoints.consumerItem, verifyToken, consumer.getConsumer);
router.delete(routers.endPoints.consumerItem, verifyToken, consumer.deleteConsumer);

/* catagories */
router.post(routers.endPoints.newCategory, verifyToken, categoryServices.createCategory);
router.get(routers.endPoints.listCategory, verifyToken, categoryServices.listCategories);
router.get(routers.endPoints.categoryItem, verifyToken, categoryServices.getCategory);
router.delete(routers.endPoints.categoryItem, verifyToken, categoryServices.deleteCategory);

/* transaction */
router.post(routers.endPoints.newTransaction, verifyToken, transactionServices.createTransaction);
router.get(routers.endPoints.listTransactions, verifyToken, transactionServices.getAllTransaction);
router.get(routers.endPoints.transactionItem, verifyToken, transactionServices.getTransaction);

/* event */
router.post(routers.endPoints.newEvent, verifyToken, eventServices.createEvent);
router.get(routers.endPoints.listEvents, verifyToken, eventServices.getAllEvents);
router.get(routers.endPoints.eventItem, verifyToken, eventServices.getEvent);

module.exports = {
  v1Routes: router,
};
