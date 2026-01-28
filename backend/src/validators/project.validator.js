import { z } from "zod";

/**
 * Project validation schemas
 */
export const createProjectSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, "Project name must be at least 3 characters")
      .max(100, "Project name cannot exceed 100 characters"),
    description: z
      .string()
      .max(500, "Description cannot exceed 500 characters")
      .optional()
      .default(""),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, "Project name must be at least 3 characters")
      .max(100, "Project name cannot exceed 100 characters")
      .optional(),
    description: z
      .string()
      .max(500, "Description cannot exceed 500 characters")
      .optional(),
    status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
  }),
});

export const projectIdSchema = z.object({
  params: z.object({
    projectId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid project ID format"),
  }),
});

export const addProjectMemberSchema = z.object({
  body: z.object({
    userId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format"),
    role: z.enum(["OWNER", "MANAGER", "MEMBER"]).default("MEMBER"),
  }),
});

export const updateProjectMemberSchema = z.object({
  body: z.object({
    role: z.enum(["OWNER", "MANAGER", "MEMBER"]),
  }),
});

/**
 * Validator middleware factory
 */
export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      req.validated = validated;
      next();
    } catch (error) {
      if (error.name === "ZodError") {
        const message = error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join("; ");
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: message,
        });
      }
      next(error);
    }
  };
};
