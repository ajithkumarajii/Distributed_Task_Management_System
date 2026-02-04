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

// ===== Project APIs =====

// Get all projects
export const getProjects = async () => {
  return apiCall("/projects", "GET");
};

// Get a specific project
export const getProject = async (projectId) => {
  return apiCall(`/projects/${projectId}`, "GET");
};

// Get project members (for task assignment)
export const getProjectMembers = async (projectId) => {
  return apiCall(`/projects/${projectId}/members`, "GET");
};

// Create a new project
export const createProject = async (projectData) => {
  return apiCall("/projects", "POST", projectData);
};

// ===== Task APIs =====

// Create a new task
export const createTask = async (projectId, taskData) => {
  return apiCall(`/projects/${projectId}/tasks`, "POST", taskData);
};

// Get tasks for a project
export const getProjectTasks = async (projectId, filters = {}) => {
  const queryString = new URLSearchParams(filters).toString();
  const url = queryString
    ? `/projects/${projectId}/tasks?${queryString}`
    : `/projects/${projectId}/tasks`;
  return apiCall(url, "GET");
};

// Get a specific task
export const getTask = async (taskId) => {
  return apiCall(`/tasks/${taskId}`, "GET");
};

// Update a task
export const updateTask = async (taskId, taskData) => {
  return apiCall(`/tasks/${taskId}`, "PUT", taskData);
};

// Patch a task (can be partial updates including status)
export const patchTask = async (taskId, taskData) => {
  return apiCall(`/tasks/${taskId}`, "PATCH", taskData);
};

// Update task status
export const updateTaskStatus = async (taskId, status) => {
  return apiCall(`/tasks/${taskId}`, "PATCH", { status });
};

// Delete a task
export const deleteTask = async (taskId) => {
  return apiCall(`/tasks/${taskId}`, "DELETE");
};

// Get task statistics
export const getTaskStats = async (projectId) => {
  return apiCall(`/projects/${projectId}/tasks/stats`, "GET");
};
