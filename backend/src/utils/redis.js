import redis from "redis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let redisClient = null;
let isRedisConnected = false;

/**
 * Get or create Redis client
 * Gracefully handles Redis unavailability (development mode)
 */
export const getRedisClient = async () => {
  if (redisClient && isRedisConnected) {
    return redisClient;
  }

  try {
    redisClient = redis.createClient({
      url: REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.warn("⚠️  Max Redis reconnect attempts reached. Continuing without Redis.");
            return false;
          }
          return retries * 100;
        },
      },
    });

    redisClient.on("error", (err) => {
      console.warn("⚠️  Redis Error:", err.message);
      isRedisConnected = false;
    });

    redisClient.on("connect", () => {
      console.log("✓ Redis Connected");
      isRedisConnected = true;
    });

    await redisClient.connect();
    isRedisConnected = true;
    return redisClient;
  } catch (error) {
    console.warn("⚠️  Redis connection failed. Running in development mode without cache.");
    console.warn("   To enable Redis: docker run -d -p 6379:6379 redis:latest");
    isRedisConnected = false;
    return null;
  }
};

/**
 * Check if Redis is connected
 */
export const isRedisAvailable = () => {
  return isRedisConnected && redisClient !== null;
};

/**
 * Cache key generators
 */
export const cacheKeys = {
  projectTasks: (projectId) => `tasks:project:${projectId}`,
  projectTasksPage: (projectId, page, limit) =>
    `tasks:project:${projectId}:page:${page}:limit:${limit}`,
  task: (taskId) => `task:${taskId}`,
  projectStats: (projectId) => `stats:project:${projectId}`,
  projectList: (userId) => `projects:user:${userId}`,
  projectUsers: (projectId) => `users:project:${projectId}`,
};

/**
 * Get cached value
 */
export const getCached = async (key) => {
  try {
    if (!isRedisAvailable()) return null;
    const client = await getRedisClient();
    if (!client) return null;
    
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn("Redis GET error:", error.message);
    return null;
  }
};

/**
 * Set cached value with TTL (default 1 hour)
 */
export const setCached = async (key, value, ttl = 3600) => {
  try {
    if (!isRedisAvailable()) return;
    const client = await getRedisClient();
    if (!client) return;
    
    await client.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.warn("Redis SET error:", error.message);
  }
};

/**
 * Delete cached value
 */
export const deleteCached = async (key) => {
  try {
    if (!isRedisAvailable()) return;
    const client = await getRedisClient();
    if (!client) return;
    
    await client.del(key);
  } catch (error) {
    console.warn("Redis DEL error:", error.message);
  }
};

/**
 * Delete multiple cached values
 */
export const deleteMultipleCached = async (keys) => {
  try {
    if (!isRedisAvailable()) return;
    const client = await getRedisClient();
    if (!client || keys.length === 0) return;
    
    await client.del(keys);
  } catch (error) {
    console.warn("Redis DEL multiple error:", error.message);
  }
};

/**
 * Invalidate project-related caches
 */
export const invalidateProjectCaches = async (projectId) => {
  try {
    if (!isRedisAvailable()) return;
    const client = await getRedisClient();
    if (!client) return;
    
    const keys = await client.keys(`tasks:project:${projectId}*`);
    keys.push(cacheKeys.projectStats(projectId));
    if (keys.length > 0) {
      await deleteMultipleCached(keys);
    }
  } catch (error) {
    console.warn("Error invalidating project caches:", error.message);
  }
};

/**
 * Flush all caches
 */
export const flushAllCaches = async () => {
  try {
    if (!isRedisAvailable()) return;
    const client = await getRedisClient();
    if (!client) return;
    
    await client.flushAll();
  } catch (error) {
    console.warn("Error flushing caches:", error.message);
  }
};
