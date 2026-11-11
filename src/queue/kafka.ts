import { Kafka, Producer, Consumer, logLevel } from 'kafkajs';
import EventEmitter from 'events';
import { envConfig } from '../config';
import logger from '../utils/logger';
import User from '../models/user.model';
import Notification from '../models/notification.model';
import { BroadcastNotificationPayload } from '../types';

export const TOPIC_NOTIFICATIONS = 'dristikon.notifications';
const BATCH_SIZE = 1000;

let kafka: Kafka | null = null;
let producer: Producer | null = null;
let consumer: Consumer | null = null;
let isKafkaConnected = false;

// Fallback in-process event emitter when Kafka broker is offline or unconfigured
const fallbackBus = new EventEmitter();

export interface QueueMessage {
  action: string;
  payload: BroadcastNotificationPayload;
}

/**
 * Streams users via MongoDB Cursor and bulk-inserts notifications in constant memory boundaries (1,000 chunk size)
 */
export const processBatchBroadcast = async (payload: BroadcastNotificationPayload): Promise<number> => {
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
    const error = err as Error;
    logger.error('Kafka Worker: Error processing batch broadcast:', { error: error.message, stack: error.stack });
    throw err;
  }
};

// Bind fallback listener for local/test execution
fallbackBus.on(TOPIC_NOTIFICATIONS, async (message: QueueMessage) => {
  if (message.action === 'BROADCAST_NOTIFICATION') {
    await processBatchBroadcast(message.payload);
  }
});

/**
 * Initializes Kafka producer and consumer group
 */
export const initKafka = async (): Promise<void> => {
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
      const error = adminErr as Error;
      logger.debug('Kafka admin topic check:', { message: error.message });
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
          if (!message.value) return;
          const parsed = JSON.parse(message.value.toString()) as QueueMessage;
          if (topic === TOPIC_NOTIFICATIONS && parsed.action === 'BROADCAST_NOTIFICATION') {
            await processBatchBroadcast(parsed.payload);
          }
        } catch (err) {
          const error = err as Error;
          logger.error('Kafka consumer message handling error:', { error: error.message });
        }
      },
    });
  } catch (err) {
    const error = err as Error;
    isKafkaConnected = false;
    logger.warn('Kafka connection unavailable. Gracefully bypassing to in-process queue worker:', {
      error: error.message,
    });
  }
};

/**
 * Publishes an event to Kafka topic (or gracefully offloads to in-process bus)
 */
export const publishEvent = async (topic: string, message: unknown, key: string | null = null): Promise<void> => {
  const payloadStr = JSON.stringify(message);

  if (isKafkaConnected && producer) {
    try {
      await producer.send({
        topic,
        messages: [{ key: key || `evt-${Date.now()}`, value: payloadStr }],
      });
      return;
    } catch (err) {
      const error = err as Error;
      logger.warn('Kafka producer failed, falling back to local queue:', { error: error.message });
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
export const closeKafka = async (): Promise<void> => {
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

export default {
  TOPIC_NOTIFICATIONS,
  initKafka,
  publishEvent,
  processBatchBroadcast,
  closeKafka,
};
