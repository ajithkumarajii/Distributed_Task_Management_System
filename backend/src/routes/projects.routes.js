import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { authorizeRole } from "../middleware/role.middleware.js";

const router = express.Router();

// Protect all project routes with authentication
router.use(verifyToken);

// GET /projects - viewable by all authenticated users
router.get("/", (req, res) => {
  res.status(200).json({
    message: "Projects retrieved successfully",
    projects: [],
    user: req.user,
  });
});

// POST /projects - creatable by ADMIN and MANAGER
router.post("/", authorizeRole("ADMIN", "MANAGER"), (req, res) => {
  res.status(201).json({
    message: "Project created successfully",
    project: { id: 1, name: req.body.name, createdBy: req.user.id },
  });
});

// GET /projects/:id - viewable by all authenticated users
router.get("/:id", (req, res) => {
  res.status(200).json({
    message: "Project retrieved successfully",
    project: { id: req.params.id },
    user: req.user,
  });
});

// PUT /projects/:id - updatable by ADMIN and MANAGER
router.put("/:id", authorizeRole("ADMIN", "MANAGER"), (req, res) => {
  res.status(200).json({
    message: "Project updated successfully",
    project: { id: req.params.id, ...req.body },
  });
});

// DELETE /projects/:id - deletable by ADMIN only
router.delete("/:id", authorizeRole("ADMIN"), (req, res) => {
  res.status(200).json({
    message: "Project deleted successfully",
    projectId: req.params.id,
  });
});

export default router;
