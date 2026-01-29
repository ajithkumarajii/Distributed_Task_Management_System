import express from "express";
import * as projectController from "../controllers/project.controller.js";
import * as taskController from "../controllers/task.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { validateRequest } from "../validators/project.validator.js";
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdSchema,
  addProjectMemberSchema,
  updateProjectMemberSchema,
} from "../validators/project.validator.js";
import {
  createTaskSchema,
  updateTaskSchema,
  taskIdSchema,
  taskListQuerySchema,
  updateTaskStatusSchema,
} from "../validators/task.validator.js";

const router = express.Router();

// All project routes require authentication
router.use(verifyToken);

/**
 * Project CRUD Operations
 */

// POST /projects - Create a new project
router.post("/", validateRequest(createProjectSchema), projectController.createProject);

// GET /projects - Get all projects
router.get("/", projectController.getProjects);

// GET /projects/:projectId - Get a specific project
router.get(
  "/:projectId",
  validateRequest(projectIdSchema),
  projectController.getProject
);

// PUT /projects/:projectId - Update a project
router.put(
  "/:projectId",
  validateRequest(projectIdSchema),
  validateRequest(updateProjectSchema),
  projectController.updateProject
);

// DELETE /projects/:projectId - Delete a project
router.delete(
  "/:projectId",
  validateRequest(projectIdSchema),
  projectController.deleteProject
);

/**
 * Project Member Management
 */

// GET /projects/:projectId/members - Get project members for task assignment
router.get(
  "/:projectId/members",
  validateRequest(projectIdSchema),
  projectController.getProjectMembers
);

// POST /projects/:projectId/members - Add member
router.post(
  "/:projectId/members",
  validateRequest(projectIdSchema),
  validateRequest(addProjectMemberSchema),
  projectController.addMember
);

// DELETE /projects/:projectId/members/:memberId - Remove member
router.delete(
  "/:projectId/members/:memberId",
  (req, res, next) => {
    // Validate both IDs
    try {
      const projectSchema = projectIdSchema.parse({
        params: { projectId: req.params.projectId },
      });
      if (!/^[0-9a-fA-F]{24}$/.test(req.params.memberId)) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: "Invalid member ID format",
        });
      }
      req.validated = {
        params: {
          projectId: req.params.projectId,
          memberId: req.params.memberId,
        },
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
  projectController.removeMember
);

// PUT /projects/:projectId/members/:memberId - Update member role
router.put(
  "/:projectId/members/:memberId",
  (req, res, next) => {
    // Validate IDs and body
    try {
      const projectSchema = projectIdSchema.parse({
        params: { projectId: req.params.projectId },
      });
      if (!/^[0-9a-fA-F]{24}$/.test(req.params.memberId)) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: "Invalid member ID format",
        });
      }
      updateProjectMemberSchema.parse({
        body: req.body,
        params: {},
        query: {},
      });
      req.validated = {
        params: {
          projectId: req.params.projectId,
          memberId: req.params.memberId,
        },
        body: req.body,
      };
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors
          ?.map((e) => `${e.path.join(".")}: ${e.message}`)
          .join("; ") || error.message,
      });
    }
  },
  projectController.updateMemberRole
);

/**
 * Task Management Routes (nested under projects)
 */

// POST /projects/:projectId/tasks - Create a new task
router.post(
  "/:projectId/tasks",
  validateRequest(createTaskSchema),
  taskController.createTask
);

// GET /projects/:projectId/tasks - Get tasks for a project
router.get(
  "/:projectId/tasks",
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

// PUT /projects/:projectId/tasks/:taskId - Update a task
router.put(
  "/:projectId/tasks/:taskId",
  (req, res, next) => {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(req.params.taskId)) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: "Invalid task ID format",
        });
      }
      updateTaskSchema.parse({
        body: req.body,
        params: {},
        query: {},
      });
      req.validated = {
        params: { taskId: req.params.taskId },
        body: req.body,
      };
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors
          ?.map((e) => `${e.path.join(".")}: ${e.message}`)
          .join("; ") || error.message,
      });
    }
  },
  taskController.updateTask
);

// DELETE /projects/:projectId/tasks/:taskId - Delete a task
router.delete(
  "/:projectId/tasks/:taskId",
  (req, res, next) => {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(req.params.taskId)) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: "Invalid task ID format",
        });
      }
      req.validated = {
        params: { taskId: req.params.taskId },
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
  taskController.deleteTask
);

export default router;
