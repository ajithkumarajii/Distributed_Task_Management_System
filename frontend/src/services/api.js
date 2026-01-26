// API service for frontend
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Helper function to make API calls
const apiCall = async (endpoint, method = "GET", body = null) => {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  // Add authorization header if token exists
  const token = localStorage.getItem("token");
  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  // Add body for POST/PUT requests
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "An error occurred");
    }

    return data;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Register user
export const registerUser = async (name, email, password, confirmPassword) => {
  return apiCall("/auth/register", "POST", {
    name,
    email,
    password,
    confirmPassword,
  });
};

// Login user
export const loginUser = async (email, password) => {
  return apiCall("/auth/login", "POST", { email, password });
};

// Get current user info (protected)
export const getCurrentUser = async () => {
  return apiCall("/auth/me", "GET");
};

// Logout user (clear token from localStorage)
export const logoutUser = () => {
  localStorage.removeItem("token");
};

// Get token from localStorage
export const getToken = () => {
  return localStorage.getItem("token");
};

// Set token in localStorage
export const setToken = (token) => {
  localStorage.setItem("token", token);
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};
