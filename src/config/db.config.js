const mongoose = require('mongoose');
const { MONGOURI } = require('./env.config');
const { msg } = require('../constant');

const mongooseOptions = {
  maxPoolSize: 50,
  minPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  autoIndex: true,
};

// Database connection lifecycle event listeners
mongoose.connection.on('connected', () => {
  console.log(`${msg.dbMsg.dbSuccess}`);
});

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Attempting to reconnect...');
});

const dbConnect = async () => {
  try {
    const connect = await mongoose.connect(MONGOURI, mongooseOptions);
    return connect;
  } catch (err) {
    console.error(`${msg.dbMsg.dbFailed} ${err.message}`);
    process.exit(1);
  }
};

const dbDisconnect = async () => {
  try {
    await mongoose.connection.close(false);
    console.log('MongoDB connection cleanly closed.');
  } catch (err) {
    console.error(`Error closing MongoDB connection: ${err.message}`);
  }
};

module.exports = {
  dbConnect,
  dbDisconnect,
};
