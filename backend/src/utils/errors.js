/**
 * Custom AppError class for consistent error handling
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common error factory functions
 */
export const errors = {
  notFound: (resource) => new AppError(`${resource} not found`, 404),
  unauthorized: (message = "Unauthorized") =>
    new AppError(message, 401),
  forbidden: (message = "Access forbidden") =>
    new AppError(message, 403),
  badRequest: (message = "Bad request") =>
    new AppError(message, 400),
  conflict: (message = "Resource already exists") =>
    new AppError(message, 409),
  validation: (message = "Validation failed") =>
    new AppError(message, 400),
  internal: (message = "Internal server error") =>
    new AppError(message, 500),
};

/**
 * Express error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    err = new AppError(message, 400);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    err = new AppError(
      `Duplicate value for field: ${field}`,
      409
    );
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    err = new AppError("Invalid ID format", 400);
  }

  // Zod validation error
  if (err.name === "ZodError") {
    const message = err.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; ");
    err = new AppError(message, 400);
  }

  res.status(err.statusCode).json({
    success: false,
    error: err.message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      details: err,
    }),
  });
};

/**
 * Async handler wrapper to catch errors in route handlers
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
