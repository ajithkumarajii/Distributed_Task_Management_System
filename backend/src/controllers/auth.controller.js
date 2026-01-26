import * as authService from "../services/auth.service.js";

// POST /auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Register user (default role is USER)
    const user = await authService.registerUser(name, email, password);

    return res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (err) {
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
