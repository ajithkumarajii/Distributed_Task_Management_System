import { z } from "zod";

/**
 * Task validation schemas
 */
export const createTaskSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(3, "Task title must be at least 3 characters")
      .max(200, "Task title cannot exceed 200 characters"),
    description: z
      .string()
      .max(1000, "Description cannot exceed 1000 characters")
      .optional()
      .default(""),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
    assignedTo: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format")
      .optional()
      .nullable(),
    dueDate: z
      .string()
      .datetime()
      .optional()
      .nullable(),
  }),
  params: z.object({
    projectId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid project ID format"),
  }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(3, "Task title must be at least 3 characters")
      .max(200, "Task title cannot exceed 200 characters")
      .optional(),
    description: z
      .string()
      .max(1000, "Description cannot exceed 1000 characters")
      .optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    assignedTo: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format")
      .optional()
      .nullable(),
    dueDate: z
      .string()
      .datetime()
      .optional()
      .nullable(),
  }),
});

export const taskIdSchema = z.object({
  params: z.object({
    taskId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid task ID format"),
  }),
});

export const taskListQuerySchema = z.object({
  query: z.object({
    status: z
      .enum(["TODO", "IN_PROGRESS", "DONE"])
      .optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    assignedTo: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format")
      .optional(),
    page: z
      .string()
      .transform(Number)
      .refine((n) => n >= 1, "Page must be >= 1")
      .optional()
      .default("1"),
    limit: z
      .string()
      .transform(Number)
      .refine((n) => n >= 1 && n <= 100, "Limit must be between 1 and 100")
      .optional()
      .default("10"),
    sortBy: z
      .enum(["createdAt", "dueDate", "priority"])
      .optional()
      .default("createdAt"),
    order: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

export const updateTaskStatusSchema = z.object({
  body: z.object({
    status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
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
