import * as projectService from "../services/project.service.js";
import { asyncHandler, errors } from "../utils/errors.js";

/**
 * Create a new project
 * POST /projects
 */
export const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(
    req.user.id,
    req.validated.body
  );

  res.status(201).json({
    success: true,
    message: "Project created successfully",
    data: project,
  });
});

/**
 * Get all projects for the user
 * GET /projects
 */
export const getProjects = asyncHandler(async (req, res) => {
  const { page = "1", limit = "10", status = "ACTIVE" } = req.query;

  const result = await projectService.getUserProjects(
    req.user.id,
    req.user.role,
    {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
    }
  );

  res.status(200).json({
    success: true,
    message: "Projects retrieved successfully",
    ...result,
  });
});

/**
 * Get a specific project
 * GET /projects/:projectId
 */
export const getProject = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById(
    req.validated.params.projectId,
    req.user.id,
    req.user.role
  );

  res.status(200).json({
    success: true,
    message: "Project retrieved successfully",
    data: project,
  });
});

/**
 * Update a project
 * PUT /projects/:projectId
 */
export const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(
    req.validated.params.projectId,
    req.user.id,
    req.user.role,
    req.validated.body
  );

  res.status(200).json({
    success: true,
    message: "Project updated successfully",
    data: project,
  });
});

/**
 * Delete a project
 * DELETE /projects/:projectId
 */
export const deleteProject = asyncHandler(async (req, res) => {
  await projectService.deleteProject(
    req.validated.params.projectId,
    req.user.id,
    req.user.role
  );

  res.status(200).json({
    success: true,
    message: "Project deleted successfully",
  });
});

/**
 * Add member to project
 * POST /projects/:projectId/members
 */
export const addMember = asyncHandler(async (req, res) => {
  const project = await projectService.addProjectMember(
    req.validated.params.projectId,
    req.user.id,
    req.user.role,
    req.validated.body
  );

  res.status(201).json({
    success: true,
    message: "Member added to project successfully",
    data: project,
  });
});

/**
 * Remove member from project
 * DELETE /projects/:projectId/members/:memberId
 */
export const removeMember = asyncHandler(async (req, res) => {
  const project = await projectService.removeProjectMember(
    req.validated.params.projectId,
    req.user.id,
    req.user.role,
    req.validated.params.memberId
  );

  res.status(200).json({
    success: true,
    message: "Member removed from project successfully",
    data: project,
  });
});

/**
 * Update member role in project
 * PUT /projects/:projectId/members/:memberId
 */
export const updateMemberRole = asyncHandler(async (req, res) => {
  const project = await projectService.updateProjectMember(
    req.validated.params.projectId,
    req.user.id,
    req.user.role,
    req.validated.params.memberId,
    req.validated.body
  );

  res.status(200).json({
    success: true,
    message: "Member role updated successfully",
    data: project,
  });
});
