import express from "express";
import * as projectController from "../controllers/project.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { validateRequest } from "../validators/project.validator.js";
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdSchema,
  addProjectMemberSchema,
  updateProjectMemberSchema,
} from "../validators/project.validator.js";

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

export default router;
