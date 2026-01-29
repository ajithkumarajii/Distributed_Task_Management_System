import Project from "../models/Project.js";
import User from "../models/User.js";
import { AppError, errors } from "../utils/errors.js";

/**
 * Project Service Layer
 * Implements business logic with RBAC
 */

/**
 * Check if user has required permission on project
 */
const checkProjectAccess = (userRole, projectRole, requiredAccess) => {
  const accessMap = {
    ADMIN: ["view", "edit", "delete", "manage_members"],
    OWNER: ["view", "edit", "delete", "manage_members"],
    MANAGER: ["view", "edit", "manage_members"],
    MEMBER: ["view"],
  };

  const userPermissions = accessMap[userRole];
  return userPermissions && userPermissions.includes(requiredAccess);
};

/**
 * Create a new project
 * Only ADMIN and MANAGER can create projects
 */
export const createProject = async (userId, data) => {
  // Check if user has permission to create projects
  const user = await User.findById(userId);
  if (!user) throw errors.notFound("User");

  if (!["ADMIN", "MANAGER"].includes(user.role)) {
    throw errors.forbidden(
      "Only ADMIN and MANAGER can create projects"
    );
  }

  const project = await Project.create({
    ...data,
    ownerId: userId,
    members: [
      {
        userId,
        role: "OWNER",
        addedAt: new Date(),
      },
    ],
  });

  return project.populate("ownerId", "name email role");
};

/**
 * Get all projects for the user
 * Pagination and filtering included
 */
export const getUserProjects = async (
  userId,
  userRole,
  { page = 1, limit = 10, status = "ACTIVE" } = {}
) => {
  const skip = (page - 1) * limit;

  let query = {};

  if (userRole === "ADMIN") {
    // ADMIN sees all projects
    query = { status };
  } else {
    // Regular users see only their projects or projects they're members of
    query = {
      $or: [
        { ownerId: userId },
        { "members.userId": userId },
      ],
      status,
    };
  }

  const total = await Project.countDocuments(query);
  const projects = await Project.find(query)
    .populate("ownerId", "name email role")
    .populate("members.userId", "name email role")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  return {
    data: projects,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get a single project with authorization check
 */
export const getProjectById = async (projectId, userId, userRole) => {
  const project = await Project.findById(projectId)
    .populate("ownerId", "name email role")
    .populate("members.userId", "name email role");

  if (!project) throw errors.notFound("Project");

  // Check access
  const isOwner = project.ownerId._id.toString() === userId;
  const isMember = project.members.some(
    (m) => m.userId._id.toString() === userId
  );
  const isAdmin = userRole === "ADMIN";

  if (!isOwner && !isMember && !isAdmin) {
    throw errors.forbidden("You don't have access to this project");
  }

  return project;
};

/**
 * Update a project
 * Only owner or ADMIN can update
 */
export const updateProject = async (projectId, userId, userRole, data) => {
  const project = await Project.findById(projectId);
  if (!project) throw errors.notFound("Project");

  const isOwner = project.ownerId.toString() === userId;
  const isAdmin = userRole === "ADMIN";

  if (!isOwner && !isAdmin) {
    throw errors.forbidden(
      "Only project owner or ADMIN can update"
    );
  }

  Object.assign(project, data);
  await project.save();

  return project.populate("ownerId", "name email role");
};

/**
 * Delete a project
 * Only owner or ADMIN can delete
 */
export const deleteProject = async (projectId, userId, userRole) => {
  const project = await Project.findById(projectId);
  if (!project) throw errors.notFound("Project");

  const isOwner = project.ownerId.toString() === userId;
  const isAdmin = userRole === "ADMIN";

  if (!isOwner && !isAdmin) {
    throw errors.forbidden(
      "Only project owner or ADMIN can delete"
    );
  }

  // Cascade delete tasks (in real app, might want soft delete)
  const Task = (await import("../models/Task.js")).default;
  await Task.deleteMany({ projectId });

  await Project.findByIdAndDelete(projectId);
  return { message: "Project deleted successfully" };
};

/**
 * Add member to project
 * Only owner or MANAGER can add members
 */
export const addProjectMember = async (
  projectId,
  userId,
  userRole,
  { userId: newMemberId, role = "MEMBER" }
) => {
  const project = await Project.findById(projectId);
  if (!project) throw errors.notFound("Project");

  // Check authorization
  const isOwner = project.ownerId.toString() === userId;
  const memberRole = project.members.find(
    (m) => m.userId.toString() === userId
  )?.role;
  const canManage =
    userRole === "ADMIN" ||
    isOwner ||
    memberRole === "MANAGER";

  if (!canManage) {
    throw errors.forbidden(
      "You don't have permission to manage project members"
    );
  }

  // Check if user exists
  const newMember = await User.findById(newMemberId);
  if (!newMember) throw errors.notFound("User");

  // Check if already member
  const isMember = project.members.some(
    (m) => m.userId.toString() === newMemberId
  );
  if (isMember) {
    throw errors.conflict("User is already a project member");
  }

  project.members.push({
    userId: newMemberId,
    role,
    addedAt: new Date(),
  });

  await project.save();
  return project.populate("members.userId", "name email role");
};

/**
 * Remove member from project
 * Only owner or MANAGER can remove members
 */
export const removeProjectMember = async (
  projectId,
  userId,
  userRole,
  memberId
) => {
  const project = await Project.findById(projectId);
  if (!project) throw errors.notFound("Project");

  // Check authorization
  const isOwner = project.ownerId.toString() === userId;
  const memberRole = project.members.find(
    (m) => m.userId.toString() === userId
  )?.role;
  const canManage =
    userRole === "ADMIN" ||
    isOwner ||
    memberRole === "MANAGER";

  if (!canManage) {
    throw errors.forbidden(
      "You don't have permission to manage project members"
    );
  }

  // Cannot remove owner
  if (project.ownerId.toString() === memberId) {
    throw errors.badRequest("Cannot remove project owner");
  }

  project.members = project.members.filter(
    (m) => m.userId.toString() !== memberId
  );

  await project.save();
  return project.populate("members.userId", "name email role");
};

/**
 * Update project member role
 */
export const updateProjectMember = async (
  projectId,
  userId,
  userRole,
  memberId,
  { role }
) => {
  const project = await Project.findById(projectId);
  if (!project) throw errors.notFound("Project");

  // Check authorization
  const isOwner = project.ownerId.toString() === userId;
  const memberRole = project.members.find(
    (m) => m.userId.toString() === userId
  )?.role;
  const canManage =
    userRole === "ADMIN" ||
    isOwner ||
    memberRole === "MANAGER";

  if (!canManage) {
    throw errors.forbidden(
      "You don't have permission to manage project members"
    );
  }

  const member = project.members.find(
    (m) => m.userId.toString() === memberId
  );
  if (!member) throw errors.notFound("Project member");

  // Cannot change owner role
  if (project.ownerId.toString() === memberId) {
    throw errors.badRequest("Cannot change owner role");
  }

  member.role = role;
  await project.save();

  return project.populate("members.userId", "name email role");
};

/**
 * Get all users in a project (for task assignment dropdown)
 */
export const getProjectMembers = async (projectId, userId, userRole) => {
  const project = await Project.findById(projectId).populate(
    "members.userId",
    "name email"
  );
  if (!project) throw errors.notFound("Project");

  // Check access
  const isOwner = project.ownerId.toString() === userId;
  const isMember = project.members?.some(
    (m) => m.userId._id.toString() === userId
  );
  const isAdmin = userRole === "ADMIN";

  if (!isOwner && !isMember && !isAdmin) {
    throw errors.forbidden("You don't have access to this project");
  }

  return project.members.map((m) => ({
    id: m.userId._id,
    name: m.userId.name,
    email: m.userId.email,
    role: m.role,
  }));
};

