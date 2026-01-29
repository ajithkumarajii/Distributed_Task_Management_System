import Task from "../models/Task.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import { AppError, errors } from "../utils/errors.js";

/**
 * Task Service Layer
 * Implements business logic with RBAC and status workflow validation
 */

/**
 * Valid status transitions
 */
const validTransitions = {
  TODO: ["IN_PROGRESS"],
  IN_PROGRESS: ["TODO", "DONE"],
  DONE: ["TODO", "IN_PROGRESS"],
};

/**
 * Validate status transition
 */
const validateStatusTransition = (currentStatus, newStatus) => {
  if (!validTransitions[currentStatus]?.includes(newStatus)) {
    throw errors.badRequest(
      `Invalid status transition from ${currentStatus} to ${newStatus}`
    );
  }
};

/**
 * Check user access to task
 */
const checkTaskAccess = async (taskId, userId, userRole) => {
  const task = await Task.findById(taskId).populate("projectId");
  if (!task) throw errors.notFound("Task");

  const project = task.projectId;
  if (!project) throw errors.notFound("Project");

  // Check project access
  const isOwner = project.ownerId.toString() === userId;
  const isMember = project.members?.some(
    (m) => m.userId.toString() === userId
  );
  const isAdmin = userRole === "ADMIN";
  const isAssignee = task.assignedTo?.toString() === userId;

  if (!isOwner && !isMember && !isAdmin && !isAssignee) {
    throw errors.forbidden(
      "You don't have access to this task"
    );
  }

  return { task, project, isOwner, isMember, isAdmin, isAssignee };
};

/**
 * Create a new task
 * Only project members with OWNER/MANAGER roles can create
 */
export const createTask = async (projectId, userId, userRole, data) => {
  // Check project exists and user is member
  const project = await Project.findById(projectId).populate(
    "members.userId"
  );
  if (!project) throw errors.notFound("Project");

  const isOwner = project.ownerId.toString() === userId;
  const memberRole = project.members.find(
    (m) => m.userId._id.toString() === userId
  )?.role;
  const isAdmin = userRole === "ADMIN";

  if (!isOwner && !isAdmin && memberRole !== "OWNER" && memberRole !== "MANAGER") {
    throw errors.forbidden(
      "Only project OWNER/MANAGER can create tasks"
    );
  }

  // Verify assigned user is a project member
  if (data.assignedTo) {
    const assignedUser = await User.findById(data.assignedTo);
    if (!assignedUser) throw errors.notFound("Assigned user");

    const isProjectMember = project.members.some(
      (m) => m.userId._id.toString() === data.assignedTo
    );
    if (!isProjectMember) {
      throw errors.badRequest(
        "Assigned user is not a project member"
      );
    }
  }

  const task = await Task.create({
    ...data,
    projectId,
    createdBy: userId,
    status: "TODO", // Default status
  });

  const populatedTask = await task
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email");

  return populatedTask;
};

/**
 * Get tasks for a project with pagination and filtering
 */
export const getProjectTasks = async (
  projectId,
  userId,
  userRole,
  {
    status,
    priority,
    assignedTo,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    order = "desc",
  }
) => {
  // Check project access
  const project = await Project.findById(projectId);
  if (!project) throw errors.notFound("Project");

  const isOwner = project.ownerId.toString() === userId;
  const isMember = project.members?.some(
    (m) => m.userId.toString() === userId
  );
  const isAdmin = userRole === "ADMIN";

  if (!isOwner && !isMember && !isAdmin) {
    throw errors.forbidden("You don't have access to this project");
  }

  const skip = (page - 1) * limit;

  // Build query
  const query = { projectId };
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (assignedTo) query.assignedTo = assignedTo;

  // Build sort
  const sortOptions = {};
  if (sortBy === "priority") {
    // Custom priority order
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    // For now, just sort by createdAt
    sortOptions.createdAt = order === "asc" ? 1 : -1;
  } else {
    sortOptions[sortBy] = order === "asc" ? 1 : -1;
  }

  const total = await Task.countDocuments(query);
  const tasks = await Task.find(query)
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email")
    .skip(skip)
    .limit(limit)
    .sort(sortOptions);

  return {
    data: tasks,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get a single task with authorization
 */
export const getTaskById = async (taskId, userId, userRole) => {
  const { task } = await checkTaskAccess(
    taskId,
    userId,
    userRole
  );
  return task
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email")
    .populate("projectId", "name");
};

/**
 * Update task
 * Only assigned user, project owner/manager, or ADMIN can update
 * IMPORTANT: Only assigned user can update task status
 */
export const updateTask = async (taskId, userId, userRole, data) => {
  const { task, project, isOwner, isMember, isAdmin, isAssignee } =
    await checkTaskAccess(taskId, userId, userRole);

  const memberRole = project.members?.find(
    (m) => m.userId.toString() === userId
  )?.role;

  const canUpdate =
    isAdmin ||
    isOwner ||
    isAssignee ||
    memberRole === "OWNER" ||
    memberRole === "MANAGER";

  if (!canUpdate) {
    throw errors.forbidden("You don't have permission to update this task");
  }

  // Track if status changed for notifications
  let statusChanged = false;

  // STRICT: Only assigned user or project managers/owner can change status
  if (data.status && data.status !== task.status) {
    const canChangeStatus = isAdmin || isOwner || isAssignee || memberRole === "OWNER" || memberRole === "MANAGER";
    
    if (!canChangeStatus) {
      throw errors.forbidden(
        "Only the assigned user or project manager can change task status"
      );
    }

    validateStatusTransition(task.status, data.status);
    statusChanged = true;

    // Set completedAt when status is DONE
    if (data.status === "DONE") {
      data.completedAt = new Date();
    } else {
      data.completedAt = null;
    }
  }

  // Verify assigned user if changed
  if (data.assignedTo && data.assignedTo !== task.assignedTo?.toString()) {
    const assignedUser = await User.findById(data.assignedTo);
    if (!assignedUser) throw errors.notFound("Assigned user");

    const isProjectMember = project.members.some(
      (m) => m.userId.toString() === data.assignedTo
    );
    if (!isProjectMember) {
      throw errors.badRequest(
        "Assigned user is not a project member"
      );
    }
  }

  Object.assign(task, data);
  await task.save();

  const updatedTask = await task
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email");

  return updatedTask;
};

/**
 * Update task status
 * Shorthand for updating status with validation
 */
export const updateTaskStatus = async (taskId, userId, userRole, { status }) => {
  return updateTask(taskId, userId, userRole, { status });
};

/**
 * Assign task to user
 * Only project owner/manager or ADMIN can assign
 */
export const assignTask = async (taskId, userId, userRole, { assignedTo }) => {
  const { task, project, isOwner, isAdmin } = await checkTaskAccess(
    taskId,
    userId,
    userRole
  );

  const memberRole = project.members?.find(
    (m) => m.userId.toString() === userId
  )?.role;

  const canAssign =
    isAdmin ||
    isOwner ||
    memberRole === "OWNER" ||
    memberRole === "MANAGER";

  if (!canAssign) {
    throw errors.forbidden(
      "You don't have permission to assign tasks"
    );
  }

  // Verify assigned user is a project member
  const newAssignee = await User.findById(assignedTo);
  if (!newAssignee) throw errors.notFound("User");

  const isProjectMember = project.members.some(
    (m) => m.userId.toString() === assignedTo
  );
  if (!isProjectMember) {
    throw errors.badRequest("User is not a project member");
  }

  task.assignedTo = assignedTo;
  await task.save();

  return task
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email");
};

/**
 * Delete task
 * Only project owner, task creator, or ADMIN can delete
 */
export const deleteTask = async (taskId, userId, userRole) => {
  const { task, project, isOwner, isAdmin } = await checkTaskAccess(
    taskId,
    userId,
    userRole
  );

  const isCreator = task.createdBy.toString() === userId;
  const memberRole = project.members?.find(
    (m) => m.userId.toString() === userId
  )?.role;

  const canDelete =
    isAdmin ||
    isOwner ||
    isCreator ||
    memberRole === "OWNER";

  if (!canDelete) {
    throw errors.forbidden("You don't have permission to delete this task");
  }

  await Task.findByIdAndDelete(taskId);
  return { message: "Task deleted successfully" };
};

/**
 * Add comment to task
 */
export const addTaskComment = async (
  taskId,
  userId,
  userRole,
  { text }
) => {
  const { task } = await checkTaskAccess(taskId, userId, userRole);

  task.comments.push({
    userId,
    text,
    createdAt: new Date(),
  });

  await task.save();

  return task
    .populate("comments.userId", "name email")
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email");
};

/**
 * Get task statistics for project
 */
export const getProjectTaskStats = async (projectId, userId, userRole) => {
  const project = await Project.findById(projectId);
  if (!project) throw errors.notFound("Project");

  const isOwner = project.ownerId.toString() === userId;
  const isMember = project.members?.some(
    (m) => m.userId.toString() === userId
  );
  const isAdmin = userRole === "ADMIN";

  if (!isOwner && !isMember && !isAdmin) {
    throw errors.forbidden("You don't have access to this project");
  }

  const tasks = await Task.find({ projectId });

  const stats = {
    total: tasks.length,
    byStatus: {
      TODO: tasks.filter((t) => t.status === "TODO").length,
      IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      DONE: tasks.filter((t) => t.status === "DONE").length,
    },
    byPriority: {
      LOW: tasks.filter((t) => t.priority === "LOW").length,
      MEDIUM: tasks.filter((t) => t.priority === "MEDIUM").length,
      HIGH: tasks.filter((t) => t.priority === "HIGH").length,
    },
    overdue: tasks.filter(
      (t) => t.dueDate && t.dueDate < new Date() && t.status !== "DONE"
    ).length,
  };

  return stats;
};
