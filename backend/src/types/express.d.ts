/**
 * TypeScript type extensions for Express
 * Extends Express Request and Response objects with custom properties
 */

import { User as PrismaUser, Tenant as PrismaTenant } from '@prisma/client';

/**
 * User object structure (from Prisma, excluding password_hash)
 */
export type User = Omit<PrismaUser, 'password_hash'>;

/**
 * Tenant object structure (from Prisma)
 */
export type Tenant = PrismaTenant;

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * API response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

/**
 * Extend Express Request interface with custom properties
 */
declare global {
  namespace Express {
    interface Request {
      /**
       * Authenticated user information (set by auth middleware)
       * Excludes password_hash for security
       */
      user?: User;

      /**
       * Current tenant context (set by auth middleware)
       */
      tenant?: Tenant;

      /**
       * Tenant ID for multi-tenant filtering
       */
      tenantId?: string;

      /**
       * Request ID for tracing
       */
      requestId?: string;

      /**
       * Pagination parameters (set by pagination middleware)
       */
      pagination?: PaginationParams;
    }
  }
}

export {};