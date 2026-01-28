import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { authorizeRole } from "../middleware/role.middleware.js";

const router = express.Router();

// Protect all task routes with authentication
router.use(verifyToken);

// GET /tasks - viewable by all authenticated users
router.get("/", (req, res) => {
  res.status(200).json({
    message: "Tasks retrieved successfully",
    tasks: [],
    user: req.user,
  });
});

// POST /tasks - creatable by ADMIN and MANAGER
router.post("/", authorizeRole("ADMIN", "MANAGER"), (req, res) => {
  res.status(201).json({
    message: "Task created successfully",
    task: { id: 1, title: req.body.title, createdBy: req.user.id },
  });
});

// GET /tasks/:id - viewable by all authenticated users
router.get("/:id", (req, res) => {
  res.status(200).json({
    message: "Task retrieved successfully",
    task: { id: req.params.id },
    user: req.user,
  });
});

// PUT /tasks/:id - updatable by ADMIN, MANAGER, and MEMBER (task owner)
router.put("/:id", authorizeRole("ADMIN", "MANAGER", "MEMBER"), (req, res) => {
  res.status(200).json({
    message: "Task updated successfully",
    task: { id: req.params.id, ...req.body },
  });
});

// DELETE /tasks/:id - deletable by ADMIN and MANAGER
router.delete("/:id", authorizeRole("ADMIN", "MANAGER"), (req, res) => {
  res.status(200).json({
    message: "Task deleted successfully",
    taskId: req.params.id,
  });
});

export default router;
