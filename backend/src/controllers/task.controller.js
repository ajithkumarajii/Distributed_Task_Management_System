import * as taskService from "../services/task.service.js";
import { asyncHandler, errors } from "../utils/errors.js";

/**
 * Create a new task in a project
 * POST /projects/:projectId/tasks
 */
export const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(
    req.validated.params.projectId,
    req.user.id,
    req.user.role,
    req.validated.body
  );

  res.status(201).json({
    success: true,
    message: "Task created successfully",
    data: task,
  });
});

/**
 * Get tasks for a project
 * GET /projects/:projectId/tasks
 */
export const getProjectTasks = asyncHandler(async (req, res) => {
  const validated = req.validated.query;

  const result = await taskService.getProjectTasks(
    req.validated.params.projectId,
    req.user.id,
    req.user.role,
    {
      status: validated.status,
      priority: validated.priority,
      assignedTo: validated.assignedTo,
      page: validated.page,
      limit: validated.limit,
      sortBy: validated.sortBy,
      order: validated.order,
    }
  );

  res.status(200).json({
    success: true,
    message: "Tasks retrieved successfully",
    ...result,
  });
});

/**
 * Get task statistics for a project
 * GET /projects/:projectId/tasks/stats
 */
export const getTaskStats = asyncHandler(async (req, res) => {
  const stats = await taskService.getProjectTaskStats(
    req.validated.params.projectId,
    req.user.id,
    req.user.role
  );

  res.status(200).json({
    success: true,
    message: "Task statistics retrieved successfully",
    data: stats,
  });
});

/**
 * Get a specific task
 * GET /tasks/:taskId
 */
export const getTask = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(
    req.validated.params.taskId,
    req.user.id,
    req.user.role
  );

  res.status(200).json({
    success: true,
    message: "Task retrieved successfully",
    data: task,
  });
});

/**
 * Update a task
 * PUT /tasks/:taskId
 */
export const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(
    req.validated.params.taskId,
    req.user.id,
    req.user.role,
    req.validated.body
  );

  res.status(200).json({
    success: true,
    message: "Task updated successfully",
    data: task,
  });
});

/**
 * Update task status
 * PATCH /tasks/:taskId/status
 */
export const updateTaskStatus = asyncHandler(async (req, res) => {
  const task = await taskService.updateTaskStatus(
    req.validated.params.taskId,
    req.user.id,
    req.user.role,
    req.validated.body
  );

  res.status(200).json({
    success: true,
    message: "Task status updated successfully",
    data: task,
  });
});

/**
 * Assign task to user
 * PUT /tasks/:taskId/assign
 */
export const assignTask = asyncHandler(async (req, res) => {
  const task = await taskService.assignTask(
    req.validated.params.taskId,
    req.user.id,
    req.user.role,
    req.validated.body
  );

  res.status(200).json({
    success: true,
    message: "Task assigned successfully",
    data: task,
  });
});

/**
 * Delete a task
 * DELETE /tasks/:taskId
 */
export const deleteTask = asyncHandler(async (req, res) => {
  await taskService.deleteTask(
    req.validated.params.taskId,
    req.user.id,
    req.user.role
  );

  res.status(200).json({
    success: true,
    message: "Task deleted successfully",
  });
});

/**
 * Add comment to task
 * POST /tasks/:taskId/comments
 */
export const addTaskComment = asyncHandler(async (req, res) => {
  const task = await taskService.addTaskComment(
    req.validated.params.taskId,
    req.user.id,
    req.user.role,
    { text: req.body.text }
  );

  res.status(201).json({
    success: true,
    message: "Comment added successfully",
    data: task,
  });
});
