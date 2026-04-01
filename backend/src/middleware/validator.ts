import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { validate } from '../utils/validators';
import { ValidationError } from '../utils/errors';

/**
 * Validation middleware factory
 * Creates middleware to validate request body, query, or params against a Joi schema
 */

/**
 * Request validation target
 */
export type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Creates validation middleware for request body
 */
export const validateBody = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = validate(schema, req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Creates validation middleware for query parameters
 */
export const validateQuery = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = validate(schema, req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Creates validation middleware for URL parameters
 */
export const validateParams = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = validate(schema, req.params);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Generic validation middleware factory
 * Validates specified part of the request
 */
export const validateRequest = (
  schema: Joi.Schema,
  target: ValidationTarget = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      switch (target) {
        case 'body':
          req.body = validate(schema, req.body);
          break;
        case 'query':
          req.query = validate(schema, req.query);
          break;
        case 'params':
          req.params = validate(schema, req.params);
          break;
        default:
          throw new ValidationError(`Invalid validation target: ${target}`);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validates multiple parts of the request
 */
export const validateMultiple = (schemas: {
  body?: Joi.Schema;
  query?: Joi.Schema;
  params?: Joi.Schema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = validate(schemas.body, req.body);
      }
      if (schemas.query) {
        req.query = validate(schemas.query, req.query);
      }
      if (schemas.params) {
        req.params = validate(schemas.params, req.params);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default {
  validateBody,
  validateQuery,
  validateParams,
  validateRequest,
  validateMultiple,
};