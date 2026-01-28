import express from "express";
import * as authController from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { authorizeRole } from "../middleware/role.middleware.js";

const router = express.Router();

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected routes
router.get("/me", verifyToken, authController.getMe);

// Admin-only routes
router.get(
  "/users",
  verifyToken,
  authorizeRole("ADMIN"),
  authController.getAllUsers
);

router.put(
  "/users/:userId/role",
  verifyToken,
  authorizeRole("ADMIN"),
  authController.updateUserRole
);

export default router;
