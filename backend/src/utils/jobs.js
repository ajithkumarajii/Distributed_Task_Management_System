import { Queue, Worker } from "bullmq";
import { getRedisClient } from "./redis.js";

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
};

// Job queues
let notificationQueue = null;
let taskQueue = null;
let isInitialized = false;

/**
 * Initialize job queues
 * Gracefully handles Redis unavailability
 */
export const initializeQueues = async () => {
  try {
    // Notification queue for sending notifications
    notificationQueue = new Queue("notifications", {
      connection: REDIS_CONFIG,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      },
    });

    // Task queue for task-related operations
    taskQueue = new Queue("tasks", {
      connection: REDIS_CONFIG,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      },
    });

    // Set up workers
    setupNotificationWorker();
    setupTaskWorker();

    isInitialized = true;
    console.log("✓ Job queues initialized");
  } catch (error) {
    console.warn("⚠️  Background job queue unavailable (Redis not running)");
    console.warn("   To enable: docker run -d -p 6379:6379 redis:latest");
    isInitialized = false;
  }
};

/**
 * Notification worker
 */
const setupNotificationWorker = () => {
  const worker = new Worker("notifications", async (job) => {
    console.log(`Processing notification job: ${job.id}`, job.data);

    const { type, userId, message, taskId } = job.data;

    switch (type) {
      case "TASK_ASSIGNED":
        // In production, send email/SMS/push notification
        console.log(`📧 Notifying user ${userId}: Task assigned - ${message}`);
        break;

      case "TASK_STATUS_CHANGED":
        // Notify task assignee of status change
        console.log(
          `📧 Notifying user ${userId}: Task status changed - ${message}`
        );
        break;

      case "TASK_CREATED":
        // Notify team of new task
        console.log(
          `📧 Notifying user ${userId}: New task created - ${message}`
        );
        break;

      default:
        console.log(`Unknown notification type: ${type}`);
    }

    return { success: true, jobId: job.id };
  }, { connection: REDIS_CONFIG });

  worker.on("failed", (job, err) => {
    console.error(`Notification job ${job.id} failed:`, err.message);
  });

  worker.on("completed", (job) => {
    console.log(`✅ Notification job ${job.id} completed`);
  });
};

/**
 * Task worker for async task operations
 */
const setupTaskWorker = () => {
  const worker = new Worker("tasks", async (job) => {
    console.log(`Processing task job: ${job.id}`, job.data);

    const { type, taskId, userId } = job.data;

    switch (type) {
      case "INDEX_TASK":
        // Index task for search/analytics
        console.log(`🔍 Indexing task ${taskId} for user ${userId}`);
        break;

      case "GENERATE_ANALYTICS":
        // Generate task analytics
        console.log(`📊 Generating analytics for task ${taskId}`);
        break;

      default:
        console.log(`Unknown task job type: ${type}`);
    }

    return { success: true, jobId: job.id };
  }, { connection: REDIS_CONFIG });

  worker.on("failed", (job, err) => {
    console.error(`Task job ${job.id} failed:`, err.message);
  });

  worker.on("completed", (job) => {
    console.log(`✅ Task job ${job.id} completed`);
  });
};

/**
 * Add notification job
 * Gracefully handles queue unavailability
 */
export const addNotificationJob = async (type, data) => {
  try {
    if (!notificationQueue || !isInitialized) {
      console.log(`📧 [DEV MODE] Notification queued: ${type}`);
      return;
    }

    await notificationQueue.add(`${type}_${Date.now()}`, {
      type,
      ...data,
      createdAt: new Date(),
    });
  } catch (error) {
    console.warn("Failed to queue notification job:", error.message);
  }
};

/**
 * Add task job
 * Gracefully handles queue unavailability
 */
export const addTaskJob = async (type, data) => {
  try {
    if (!taskQueue || !isInitialized) {
      console.log(`🔍 [DEV MODE] Task job queued: ${type}`);
      return;
    }

    await taskQueue.add(`${type}_${Date.now()}`, {
      type,
      ...data,
      createdAt: new Date(),
    });
  } catch (error) {
    console.warn("Failed to queue task job:", error.message);
  }
};

/**
 * Notify user of task assignment
 */
export const notifyTaskAssignment = async (userId, taskTitle) => {
  return addNotificationJob("TASK_ASSIGNED", {
    userId,
    message: `You have been assigned to task: ${taskTitle}`,
  });
};

/**
 * Notify user of task status change
 */
export const notifyTaskStatusChange = async (userId, taskTitle, status) => {
  return addNotificationJob("TASK_STATUS_CHANGED", {
    userId,
    message: `Task "${taskTitle}" status changed to ${status}`,
  });
};

/**
 * Notify team of task creation
 */
export const notifyTaskCreation = async (userId, taskTitle) => {
  return addNotificationJob("TASK_CREATED", {
    userId,
    message: `New task created: ${taskTitle}`,
  });
};

/**
 * Get notification queue stats
 */
export const getQueueStats = async () => {
  try {
    const notificationStats = await notificationQueue?.getJobCounts();
    const taskStats = await taskQueue?.getJobCounts();

    return {
      notifications: notificationStats,
      tasks: taskStats,
    };
  } catch (error) {
    console.error("Error getting queue stats:", error);
    return null;
  }
};

/**
 * Close queues
 */
export const closeQueues = async () => {
  try {
    if (notificationQueue) await notificationQueue.close();
    if (taskQueue) await taskQueue.close();
  } catch (error) {
    console.error("Error closing queues:", error);
  }
};
