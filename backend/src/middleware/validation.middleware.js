// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Input validation middleware
export const validateEmail = (email) => {
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

export const validateInputs = (req, res, next) => {
  const { name, email, password, confirmPassword } = req.body;

  // Skip validation for login (doesn't require name)
  if (req.path === "/login") {
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
  }

  // Validation for register
  if (req.path === "/register") {
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
  }

  next();
};
