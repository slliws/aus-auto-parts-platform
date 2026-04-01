import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import {
  AppError,
  isAppError,
  isOperationalError,
  ValidationError,
} from '../utils/errors';
import { ApiResponse } from '../types';

/**
 * Global error handling middleware
 * Catches all errors and formats them for consistent API responses
 */

/**
 * Formats error response based on error type
 */
const formatErrorResponse = (err: Error): ApiResponse => {
  if (err instanceof ValidationError) {
    return {
      success: false,
      message: err.message,
      errors: err.errors,
    };
  }

  if (isAppError(err)) {
    return {
      success: false,
      message: err.message,
    };
  }

  // Generic error response (don't expose internal details in production)
  return {
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
  };
};

/**
 * Logs error with appropriate level based on error type
 */
const logError = (err: Error, req: Request): void => {
  const errorInfo = {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    tenantId: req.tenant?.id,
  };

  if (isOperationalError(err)) {
    logger.warn('Operational error occurred', errorInfo);
  } else {
    logger.error('Unexpected error occurred', errorInfo);
  }
};

/**
 * Main error handling middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  // Log the error
  logError(err, req);

  // Determine status code
  const statusCode = isAppError(err) ? err.statusCode : 500;

  // Format and send error response
  const errorResponse = formatErrorResponse(err);

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    (errorResponse as unknown as { stack: string }).stack = err.stack || '';
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Handles 404 Not Found errors
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error: ApiResponse = {
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  };

  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  res.status(404).json(error);
};

/**
 * Async error wrapper for route handlers
 * Catches async errors and passes them to error handling middleware
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Handles unhandled promise rejections
 */
export const handleUnhandledRejection = (reason: Error): void => {
  logger.error('Unhandled Promise Rejection', {
    message: reason.message,
    stack: reason.stack,
  });

  // Exit process in production for unhandled rejections
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
};

/**
 * Handles uncaught exceptions
 */
export const handleUncaughtException = (error: Error): void => {
  logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack,
  });

  // Exit process for uncaught exceptions
  process.exit(1);
};

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  handleUnhandledRejection,
  handleUncaughtException,
};