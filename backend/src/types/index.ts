/**
 * Central export for all TypeScript types and interfaces
 */

// Re-export types from express.d.ts
export type { User, Tenant, PaginationParams, PaginatedResponse, ApiResponse } from './express';

/**
 * Common types used across the application
 */

// Re-export Prisma enums for convenience
export { UserRole, SubscriptionTier, CustomerType, OrderStatus, PaymentStatus, PaymentMethod, PaymentGateway } from '@prisma/client';

/**
 * Sort order type
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Generic ID type
 */
export type ID = string;

/**
 * Timestamp fields for database models
 */
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

/**
 * Base model interface with common fields
 */
export interface BaseModel extends Timestamps {
  id: ID;
}

/**
 * Filter options for list queries
 */
export interface FilterOptions {
  search?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  [key: string]: unknown;
}

/**
 * Query options combining pagination, sorting, and filtering
 */
export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  filters?: FilterOptions;
}

/**
 * Result type for operations that may fail
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Async result type
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

/**
 * Optional type helper
 */
export type Optional<T> = T | null | undefined;

/**
 * Partial with required fields
 */
export type PartialWithRequired<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Configuration for multi-tenant context
 */
export interface TenantContext {
  tenantId: ID;
  subscriptionTier: string;
}

/**
 * Audit log entry type (for future implementation)
 */
export interface AuditLog {
  id: ID;
  tenantId: ID;
  userId: ID;
  action: string;
  resource: string;
  resourceId?: ID;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}