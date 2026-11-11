const { Kafka, logLevel } = require('kafkajs');
const EventEmitter = require('events');
const { envConfig } = require('../config');
const logger = require('../utils/logger');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');

const TOPIC_NOTIFICATIONS = 'dristikon.notifications';
const BATCH_SIZE = 1000;

let kafka = null;
let producer = null;
let consumer = null;
let isKafkaConnected = false;

// Fallback in-process event emitter when Kafka broker is offline or unconfigured
const fallbackBus = new EventEmitter();

/**
 * Streams users via MongoDB Cursor and bulk-inserts notifications in constant memory boundaries (1,000 chunk size)
 */
const processBatchBroadcast = async (payload) => {
  try {
    logger.info('Kafka Worker: Processing batch broadcast notification via MongoDB cursor stream...');
    let batch = [];
    let totalProcessed = 0;

    // Stream users cursor (constant memory overhead, 10M scale safe)
    const cursor = User.find().select('_id').lean().cursor();

    for await (const user of cursor) {
      batch.push({
        userId: user._id,
        title: payload.title,
        message: payload.message,
        type: payload.type || 'broadcast',
        metadata: payload.metadata || {},
      });

      if (batch.length >= BATCH_SIZE) {
        await Notification.insertMany(batch, { ordered: false });
        totalProcessed += batch.length;
        logger.debug(`Kafka Worker: Flushed batch of ${batch.length} notifications (total: ${totalProcessed}).`);
        batch = [];
      }
    }

    if (batch.length > 0) {
      await Notification.insertMany(batch, { ordered: false });
      totalProcessed += batch.length;
    }

    logger.info(`Kafka Worker: Successfully processed ${totalProcessed} notifications in constant memory.`);
    return totalProcessed;
  } catch (err) {
    logger.error('Kafka Worker: Error processing batch broadcast:', { error: err.message, stack: err.stack });
    throw err;
  }
};

// Bind fallback listener for local/test execution
fallbackBus.on(TOPIC_NOTIFICATIONS, async (message) => {
  if (message.action === 'BROADCAST_NOTIFICATION') {
    await processBatchBroadcast(message.payload);
  }
});

/**
 * Initializes Kafka producer and consumer group
 */
const initKafka = async () => {
  if (!envConfig.KAFKA_BROKERS) {
    logger.info('Kafka brokers not configured. Using resilient in-process queue worker.');
    return;
  }

  try {
    const brokers = envConfig.KAFKA_BROKERS.split(',').map((b) => b.trim());
    kafka = new Kafka({
      clientId: envConfig.KAFKA_CLIENT_ID,
      brokers,
      logLevel: logLevel.NOTHING,
      retry: {
        initialRetryTime: 300,
        retries: 3,
      },
    });

    producer = kafka.producer();
    consumer = kafka.consumer({ groupId: envConfig.KAFKA_GROUP_ID });

    // Ensure topic exists prior to subscription
    const admin = kafka.admin();
    try {
      await admin.connect();
      const existingTopics = await admin.listTopics();
      if (!existingTopics.includes(TOPIC_NOTIFICATIONS)) {
        await admin.createTopics({
          topics: [{ topic: TOPIC_NOTIFICATIONS, numPartitions: 1, replicationFactor: 1 }],
        });
      }
    } catch (adminErr) {
      logger.debug('Kafka admin topic check:', { message: adminErr.message });
    } finally {
      await admin.disconnect().catch(() => {});
    }

    await producer.connect();
    await consumer.connect();
    await consumer.subscribe({ topic: TOPIC_NOTIFICATIONS, fromBeginning: false });

    isKafkaConnected = true;
    logger.info('Connected to Kafka cluster. Background consumer group worker started.');

    consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const parsed = JSON.parse(message.value.toString());
          if (topic === TOPIC_NOTIFICATIONS && parsed.action === 'BROADCAST_NOTIFICATION') {
            await processBatchBroadcast(parsed.payload);
          }
        } catch (err) {
          logger.error('Kafka consumer message handling error:', { error: err.message });
        }
      },
    });
  } catch (err) {
    isKafkaConnected = false;
    logger.warn('Kafka connection unavailable. Gracefully bypassing to in-process queue worker:', {
      error: err.message,
    });
  }
};

/**
 * Publishes an event to Kafka topic (or gracefully offloads to in-process bus)
 */
const publishEvent = async (topic, message, key = null) => {
  const payloadStr = JSON.stringify(message);

  if (isKafkaConnected && producer) {
    try {
      await producer.send({
        topic,
        messages: [{ key: key || `evt-${Date.now()}`, value: payloadStr }],
      });
      return;
    } catch (err) {
      logger.warn('Kafka producer failed, falling back to local queue:', { error: err.message });
    }
  }

  // Fallback: asynchronous dispatch
  setImmediate(() => {
    fallbackBus.emit(topic, message);
  });
};

/**
 * Graceful shutdown for Kafka connections
 */
const closeKafka = async () => {
  if (consumer) {
    try {
      await consumer.disconnect();
      logger.info('Kafka consumer cleanly disconnected.');
    } catch {
      // Ignored
    }
  }
  if (producer) {
    try {
      await producer.disconnect();
      logger.info('Kafka producer cleanly disconnected.');
    } catch {
      // Ignored
    }
  }
};

module.exports = {
  TOPIC_NOTIFICATIONS,
  initKafka,
  publishEvent,
  processBatchBroadcast,
  closeKafka,
};
