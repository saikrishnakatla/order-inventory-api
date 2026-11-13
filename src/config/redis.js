import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy(times) {
    if (times > 3) return null; // Stop retrying if Redis is not running
    return Math.min(times * 100, 2000);
  },
});

redis.on('connect', () => {
  console.log('[REDIS] Connected to Redis server successfully!');
});

redis.on('error', (err) => {
  console.warn('[REDIS WARNING] Redis error:', err.message);
});

// Connect lazily
redis.connect().catch((err) => {
  console.warn('[REDIS WARNING] Could not connect to Redis on port 6379. Falling back to direct DB queries.');
});

export default redis;