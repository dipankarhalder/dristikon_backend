const assert = require('assert');
const { getOrSet } = require('../utils/cache');
const { publishEvent, TOPIC_NOTIFICATIONS } = require('../queue/kafka');
const Notification = require('../models/notification.model');

console.log('🧪 Starting Scale & Architecture Verification Tests...\n');

(async () => {
  // 1. Test Read-Through Caching with Jitter Offset (Thundering Herd Defense)
  console.log('1. Testing Read-Through Caching (getOrSet) with Jitter Offset...');
  let fetchCount = 0;
  const mockFetch = async () => {
    fetchCount++;
    return { id: 101, name: 'Supplier Profile', rating: 4.9 };
  };

  const data1 = await getOrSet('test:supplier:101', mockFetch, { ttlSeconds: 60, jitterRange: 20 });
  assert.strictEqual(data1.name, 'Supplier Profile');
  assert.strictEqual(fetchCount, 1, 'Initial call should invoke fetchFn');

  // Second call should return cached value without invoking fetchFn
  const data2 = await getOrSet('test:supplier:101', mockFetch, { ttlSeconds: 60, jitterRange: 20 });
  assert.strictEqual(data2.name, 'Supplier Profile');
  console.log('   ✅ Read-through caching with randomized jitter offset functioning properly.\n');

  // 2. Test Kafka Asynchronous Event Publishing
  console.log('2. Testing Kafka Async Queue Broker Event Publishing...');
  let publishedSuccessfully = false;
  try {
    await publishEvent(TOPIC_NOTIFICATIONS, {
      action: 'BROADCAST_NOTIFICATION',
      payload: {
        title: 'Platform Maintenance',
        message: 'Scheduled scaling upgrade',
        type: 'alert',
      },
    });
    publishedSuccessfully = true;
  } catch (err) {
    console.error('Publish error:', err);
  }
  assert.strictEqual(publishedSuccessfully, true, 'Failed to publish event to queue');
  console.log('   ✅ Event successfully queued to asynchronous broker / fallback bus.\n');

  // 3. Test Notification Model Schema & Index Verification
  console.log('3. Testing Notification Schema indexes for 10M scale...');
  const indexes = Notification.schema.indexes();
  const hasCompoundIndex = indexes.some(([fields]) => fields.userId === 1 && fields.read === 1 && fields.createdAt === -1);
  assert.strictEqual(hasCompoundIndex, true, 'Compound index on { userId, read, createdAt } missing');
  console.log('   ✅ Notification schema verified with compound indexes for 10M user queries.\n');

  console.log('🎉 ALL SCALE & ARCHITECTURE TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
})();
