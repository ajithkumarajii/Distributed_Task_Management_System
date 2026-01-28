import express from "express";
import * as taskController from "../controllers/task.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  createTaskSchema,
  updateTaskSchema,
  taskIdSchema,
  taskListQuerySchema,
  updateTaskStatusSchema,
  validateRequest,
} from "../validators/task.validator.js";

const router = express.Router();

// All task routes require authentication
router.use(verifyToken);

/**
 * Task CRUD Operations
 */

// POST /projects/:projectId/tasks - Create a new task
router.post(
  "/projects/:projectId/tasks",
  validateRequest(createTaskSchema),
  taskController.createTask
);

// GET /projects/:projectId/tasks - Get tasks for a project
router.get(
  "/projects/:projectId/tasks",
  (req, res, next) => {
    // Validate project ID and query params
    try {
      const schema = taskListQuerySchema.parse({
        params: { projectId: req.params.projectId },
        query: req.query,
        body: {},
      });
      // Also validate projectId exists
      if (!/^[0-9a-fA-F]{24}$/.test(req.params.projectId)) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: "Invalid project ID format",
        });
      }
      req.validated = {
        params: { projectId: req.params.projectId },
        query: schema.query,
      };
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join("; "),
      });
    }
  },
  taskController.getProjectTasks
);

// GET /projects/:projectId/tasks/stats - Get task statistics
router.get(
  "/projects/:projectId/tasks/stats",
  (req, res, next) => {
    // Validate project ID
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(req.params.projectId)) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: "Invalid project ID format",
        });
      }
      req.validated = {
        params: { projectId: req.params.projectId },
      };
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.message,
      });
    }
  },
  taskController.getTaskStats
);

// GET /tasks/:taskId - Get a specific task
router.get(
  "/tasks/:taskId",
  validateRequest(taskIdSchema),
  taskController.getTask
);

// PUT /tasks/:taskId - Update a task
router.put(
  "/tasks/:taskId",
  validateRequest(taskIdSchema),
  validateRequest(updateTaskSchema),
  taskController.updateTask
);

// PATCH /tasks/:taskId/status - Update task status
router.patch(
  "/tasks/:taskId/status",
  validateRequest(taskIdSchema),
  validateRequest(updateTaskStatusSchema),
  taskController.updateTaskStatus
);

// PUT /tasks/:taskId/assign - Assign task to user
router.put(
  "/tasks/:taskId/assign",
  (req, res, next) => {
    // Custom validator for assign endpoint
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(req.params.taskId)) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: "Invalid task ID format",
        });
      }
      if (!req.body.assignedTo || !/^[0-9a-fA-F]{24}$/.test(req.body.assignedTo)) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: "assignedTo: Invalid user ID format",
        });
      }
      req.validated = {
        params: { taskId: req.params.taskId },
        body: { assignedTo: req.body.assignedTo },
      };
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.message,
      });
    }
  },
  taskController.assignTask
);

// DELETE /tasks/:taskId - Delete a task
router.delete(
  "/tasks/:taskId",
  validateRequest(taskIdSchema),
  taskController.deleteTask
);

// POST /tasks/:taskId/comments - Add comment to task
router.post(
  "/tasks/:taskId/comments",
  (req, res, next) => {
    // Custom validator for comments
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(req.params.taskId)) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: "Invalid task ID format",
        });
      }
      if (!req.body.text || typeof req.body.text !== "string") {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: "text: Comment text is required and must be a string",
        });
      }
      req.validated = {
        params: { taskId: req.params.taskId },
        body: { text: req.body.text },
      };
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.message,
      });
    }
  },
  taskController.addTaskComment
);

export default router;
