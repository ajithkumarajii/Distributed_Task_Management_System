import * as authService from "../services/auth.service.js";
import { validateEmail, validatePassword } from "../middleware/validation.middleware.js";

// POST /auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // Register user (default role is MEMBER)
    const user = await authService.registerUser(name, email, password);

    return res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (err) {
    if (err.message.includes("already exists")) {
      return res.status(409).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
};

// POST /auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Login user
    const { token, user } = await authService.loginUser(email, password);

    return res.status(200).json({
      message: "Login successful",
      token,
      user,
    });
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
};

// GET /auth/me (protected route)
export const getMe = async (req, res) => {
  try {
    // User ID comes from auth middleware (req.user.id)
    const user = await authService.getUserById(req.user.id);

    return res.status(200).json({
      message: "User retrieved successfully",
      user,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// GET /auth/users (admin-only route)
export const getAllUsers = async (req, res) => {
  try {
    const users = await authService.getAllUsers();

    return res.status(200).json({
      message: "Users retrieved successfully",
      users,
      count: users.length,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// PUT /auth/users/:userId/role (admin-only route)
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: "Role is required" });
    }

    const validRoles = ["ADMIN", "MANAGER", "MEMBER"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      });
    }

    const user = await authService.updateUserRole(userId, role);

    return res.status(200).json({
      message: "User role updated successfully",
      user,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};
