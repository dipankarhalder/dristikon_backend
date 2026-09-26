const { getHealth } = require('./health.controller');
const { userSignup, userSignin, userSignout, refreshAccessToken } = require('./auth.controller');
const { getProfile, getProfileLists, createProfile, updatePassword, updateAddress } = require('./profile.controller');
const { createCategory, getCategory, listCategories, deleteCategory } = require('./category.controller');
const { createConsumer, listConsumers, editConsumer, getConsumer, deleteConsumer } = require('./consumer.controller');
const { createTransaction, getAllTransaction, getTransaction } = require('./transaction.controller');
const { createEvent, getAllEvents, getEvent } = require('./event.controller');

module.exports = {
  health: {
    getHealth,
  },
  auth: {
    userSignup,
    userSignin,
    userSignout,
    refreshAccessToken,
  },
  profile: {
    getProfile,
    getProfileLists,
    createProfile,
    updatePassword,
    updateAddress,
  },
  categoryServices: {
    createCategory,
    listCategories,
    getCategory,
    deleteCategory,
  },
  consumer: {
    createConsumer,
    listConsumers,
    editConsumer,
    getConsumer,
    deleteConsumer,
  },
  transactionServices: {
    createTransaction,
    getAllTransaction,
    getTransaction,
  },
  eventServices: {
    createEvent,
    getAllEvents,
    getEvent,
  },
};
