import Joi from 'joi';
import { ValidationError } from './errors';

/**
 * Common validation schemas and utilities using Joi
 */

/**
 * Validates data against a Joi schema
 * @param schema - Joi schema to validate against
 * @param data - Data to validate
 * @throws {ValidationError} If validation fails
 */
export const validate = <T>(schema: Joi.Schema, data: unknown): T => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors: Record<string, string[]> = {};
    error.details.forEach((detail) => {
      const path = detail.path.join('.');
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(detail.message);
    });

    throw new ValidationError('Validation failed', errors);
  }

  return value as T;
};

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // Email validation
  email: Joi.string().email().lowercase().trim().required(),

  // Password validation (min 8 chars, at least one uppercase, lowercase, number, special char)
  password: Joi.string()
    .min(8)
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
    )
    .required()
    .messages({
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'string.min': 'Password must be at least 8 characters long',
    }),

  // Australian Business Number (ABN) - 11 digits
  abn: Joi.string()
    .pattern(/^\d{11}$/)
    .required()
    .messages({
      'string.pattern.base': 'ABN must be 11 digits',
    }),

  // Australian Company Number (ACN) - 9 digits
  acn: Joi.string()
    .pattern(/^\d{9}$/)
    .messages({
      'string.pattern.base': 'ACN must be 9 digits',
    }),

  // Australian phone number
  phone: Joi.string()
    .pattern(/^(\+61|0)[2-478](?:[ -]?[0-9]){8}$/)
    .messages({
      'string.pattern.base': 'Invalid Australian phone number format',
    }),

  // Postcode (Australian)
  postcode: Joi.string()
    .pattern(/^\d{4}$/)
    .messages({
      'string.pattern.base': 'Postcode must be 4 digits',
    }),

  // UUID validation
  uuid: Joi.string().uuid(),

  // Pagination
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),

  // Date range
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso().min(Joi.ref('dateFrom')),
};

/**
 * User registration validation schema
 */
export const userRegistrationSchema = Joi.object({
  email: commonSchemas.email,
  password: commonSchemas.password,
  firstName: Joi.string().trim().min(2).max(50).required(),
  lastName: Joi.string().trim().min(2).max(50).required(),
  tenantId: commonSchemas.uuid.required(),
});

/**
 * Login validation schema
 */
export const loginSchema = Joi.object({
  email: commonSchemas.email,
  password: Joi.string().required(),
  tenantId: commonSchemas.uuid.optional(),
});

/**
 * Authentication validation schemas
 */
export const authValidation = {
  register: Joi.object({
    email: Joi.string().email().lowercase().trim().required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        'string.min': 'Password must be at least 8 characters long',
        'any.required': 'Password is required',
      }),
    firstName: Joi.string().trim().min(2).max(50).required()
      .messages({
        'string.min': 'First name must be at least 2 characters',
        'string.max': 'First name must not exceed 50 characters',
        'any.required': 'First name is required',
      }),
    lastName: Joi.string().trim().min(2).max(50).required()
      .messages({
        'string.min': 'Last name must be at least 2 characters',
        'string.max': 'Last name must not exceed 50 characters',
        'any.required': 'Last name is required',
      }),
    tenantId: Joi.string().uuid().required()
      .messages({
        'string.guid': 'Invalid tenant ID format',
        'any.required': 'Tenant ID is required',
      }),
  }),

  login: Joi.object({
    email: Joi.string().email().lowercase().trim().required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
    password: Joi.string().required()
      .messages({
        'any.required': 'Password is required',
      }),
    tenantId: Joi.string().uuid().optional()
      .messages({
        'string.guid': 'Invalid tenant ID format',
      }),
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required()
      .messages({
        'any.required': 'Refresh token is required',
      }),
  }),

  verifyEmail: Joi.object({
    token: Joi.string().required()
      .messages({
        'any.required': 'Verification token is required',
      }),
  }),

  requestPasswordReset: Joi.object({
    email: Joi.string().email().lowercase().trim().required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required()
      .messages({
        'any.required': 'Reset token is required',
      }),
    newPassword: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        'string.min': 'Password must be at least 8 characters long',
        'any.required': 'New password is required',
      }),
  }),

  logout: Joi.object({
    refreshToken: Joi.string().required()
      .messages({
        'any.required': 'Refresh token is required',
      }),
  }),
};

/**
 * Tenant creation validation schema
 * Validates all fields for creating a new tenant/business account
 */
export const tenantSchema = Joi.object({
  name: Joi.string().trim().min(2).max(255).required().messages({
    'string.min': 'Business name must be at least 2 characters',
    'string.max': 'Business name cannot exceed 255 characters',
    'any.required': 'Business name is required',
  }),
  abn: commonSchemas.abn,
  email: commonSchemas.email.messages({
    'string.email': 'Please provide a valid business email address',
    'any.required': 'Business email is required',
  }),
  phone: commonSchemas.phone.optional(),
  address: Joi.string().trim().max(500).optional().allow(null, '').messages({
    'string.max': 'Address cannot exceed 500 characters',
  }),
  subscription_tier: Joi.string()
    .valid('BASIC', 'PRO', 'ENTERPRISE')
    .default('BASIC')
    .optional()
    .messages({
      'any.only': 'Subscription tier must be BASIC, PRO, or ENTERPRISE',
    }),
});

/**
 * Tenant update validation schema
 * All fields optional — only provided fields are updated (PATCH semantics)
 */
export const updateTenantSchema = Joi.object({
  name: Joi.string().trim().min(2).max(255).optional().messages({
    'string.min': 'Business name must be at least 2 characters',
    'string.max': 'Business name cannot exceed 255 characters',
  }),
  abn: commonSchemas.abn.optional(),
  email: commonSchemas.email.optional().messages({
    'string.email': 'Please provide a valid business email address',
  }),
  phone: commonSchemas.phone.optional(),
  address: Joi.string().trim().max(500).optional().allow(null, '').messages({
    'string.max': 'Address cannot exceed 500 characters',
  }),
});

/**
 * Pagination validation schema
 */
export const paginationSchema = Joi.object({
  page: commonSchemas.page,
  limit: commonSchemas.limit,
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
});

/**
 * Sanitizes input by removing potentially dangerous characters
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove inline event handlers
};

/**
 * Validates and sanitizes query parameters
 * @param params - Query parameters object
 * @returns Sanitized parameters
 */
export const sanitizeQueryParams = (
  params: Record<string, unknown>
): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Parts validation schemas
 */
export const partsValidation = {
  createPart: Joi.object({
    vehicleId: commonSchemas.uuid.optional(),
    partNumber: Joi.string().trim().min(1).max(100).required()
      .messages({
        'string.min': 'Part number is required',
        'string.max': 'Part number must not exceed 100 characters',
        'any.required': 'Part number is required',
      }),
    name: Joi.string().trim().min(1).max(255).required()
      .messages({
        'string.min': 'Part name is required',
        'string.max': 'Part name must not exceed 255 characters',
        'any.required': 'Part name is required',
      }),
    description: Joi.string().trim().max(5000).optional().allow(null, ''),
    category: Joi.string().trim().min(1).max(100).required()
      .messages({
        'string.min': 'Category is required',
        'string.max': 'Category must not exceed 100 characters',
        'any.required': 'Category is required',
      }),
    condition: Joi.string()
      .valid('NEW', 'USED_EXCELLENT', 'USED_GOOD', 'USED_FAIR', 'RECONDITIONED', 'DAMAGED')
      .optional(),
    costPrice: Joi.number().min(0).precision(2).required()
      .messages({
        'number.min': 'Cost price must be a positive number',
        'any.required': 'Cost price is required',
      }),
    sellPrice: Joi.number().min(0).precision(2).required()
      .messages({
        'number.min': 'Sell price must be a positive number',
        'any.required': 'Sell price is required',
      }),
    gstInclusive: Joi.boolean().optional(),
    stockQuantity: Joi.number().integer().min(0).optional(),
    location: Joi.string().trim().max(100).optional().allow(null, ''),
    barcode: Joi.string().trim().max(100).optional().allow(null, ''),
    weight: Joi.number().min(0).precision(2).optional().allow(null),
    dimensions: Joi.string().trim().max(100).optional().allow(null, ''),
    imageUrl: Joi.string().uri().max(500).optional().allow(null, ''),
    notes: Joi.string().trim().max(5000).optional().allow(null, ''),
  }),

  updatePart: Joi.object({
    vehicleId: commonSchemas.uuid.optional().allow(null),
    partNumber: Joi.string().trim().min(1).max(100).optional(),
    name: Joi.string().trim().min(1).max(255).optional(),
    description: Joi.string().trim().max(5000).optional().allow(null, ''),
    category: Joi.string().trim().min(1).max(100).optional(),
    condition: Joi.string()
      .valid('NEW', 'USED_EXCELLENT', 'USED_GOOD', 'USED_FAIR', 'RECONDITIONED', 'DAMAGED')
      .optional(),
    costPrice: Joi.number().min(0).precision(2).optional(),
    sellPrice: Joi.number().min(0).precision(2).optional(),
    gstInclusive: Joi.boolean().optional(),
    stockQuantity: Joi.number().integer().min(0).optional(),
    location: Joi.string().trim().max(100).optional().allow(null, ''),
    barcode: Joi.string().trim().max(100).optional().allow(null, ''),
    weight: Joi.number().min(0).precision(2).optional().allow(null),
    dimensions: Joi.string().trim().max(100).optional().allow(null, ''),
    imageUrl: Joi.string().uri().max(500).optional().allow(null, ''),
    notes: Joi.string().trim().max(5000).optional().allow(null, ''),
    isAvailable: Joi.boolean().optional(),
  }).min(1), // At least one field must be provided
};

/**
 * Customers validation schemas
 */
export const customersValidation = {
  createCustomer: Joi.object({
    customerType: Joi.string()
      .valid('RETAIL', 'TRADE', 'WHOLESALE')
      .required()
      .messages({
        'any.only': 'Customer type must be RETAIL, TRADE, or WHOLESALE',
        'any.required': 'Customer type is required',
      }),
    firstName: Joi.string().trim().min(2).max(100).required()
      .messages({
        'string.min': 'First name must be at least 2 characters',
        'string.max': 'First name must not exceed 100 characters',
        'any.required': 'First name is required',
      }),
    lastName: Joi.string().trim().min(2).max(100).required()
      .messages({
        'string.min': 'Last name must be at least 2 characters',
        'string.max': 'Last name must not exceed 100 characters',
        'any.required': 'Last name is required',
      }),
    email: commonSchemas.email,
    phone: Joi.string().trim().min(10).max(20).required()
      .messages({
        'string.min': 'Phone number must be at least 10 characters',
        'string.max': 'Phone number must not exceed 20 characters',
        'any.required': 'Phone number is required',
      }),
    mobile: Joi.string().trim().min(10).max(20).optional().allow(null, ''),
    abn: Joi.string()
      .pattern(/^\d{11}$/)
      .optional()
      .allow(null, '')
      .messages({
        'string.pattern.base': 'ABN must be 11 digits',
      }),
    companyName: Joi.string().trim().max(255).optional().allow(null, ''),
    address: Joi.string().trim().max(500).optional().allow(null, ''),
    suburb: Joi.string().trim().max(100).optional().allow(null, ''),
    state: Joi.string()
      .valid('NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT')
      .optional()
      .allow(null, '')
      .messages({
        'any.only': 'State must be a valid Australian state or territory',
      }),
    postcode: Joi.string()
      .pattern(/^\d{4}$/)
      .optional()
      .allow(null, '')
      .messages({
        'string.pattern.base': 'Postcode must be 4 digits',
      }),
    notes: Joi.string().trim().max(5000).optional().allow(null, ''),
  }),

  updateCustomer: Joi.object({
    customerType: Joi.string()
      .valid('RETAIL', 'TRADE', 'WHOLESALE')
      .optional()
      .messages({
        'any.only': 'Customer type must be RETAIL, TRADE, or WHOLESALE',
      }),
    firstName: Joi.string().trim().min(2).max(100).optional(),
    lastName: Joi.string().trim().min(2).max(100).optional(),
    email: Joi.string().email().lowercase().trim().optional(),
    phone: Joi.string().trim().min(10).max(20).optional(),
    mobile: Joi.string().trim().min(10).max(20).optional().allow(null, ''),
    abn: Joi.string()
      .pattern(/^\d{11}$/)
      .optional()
      .allow(null, '')
      .messages({
        'string.pattern.base': 'ABN must be 11 digits',
      }),
    companyName: Joi.string().trim().max(255).optional().allow(null, ''),
    address: Joi.string().trim().max(500).optional().allow(null, ''),
    suburb: Joi.string().trim().max(100).optional().allow(null, ''),
    state: Joi.string()
      .valid('NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT')
      .optional()
      .allow(null, '')
      .messages({
        'any.only': 'State must be a valid Australian state or territory',
      }),
    postcode: Joi.string()
      .pattern(/^\d{4}$/)
      .optional()
      .allow(null, '')
      .messages({
        'string.pattern.base': 'Postcode must be 4 digits',
      }),
    notes: Joi.string().trim().max(5000).optional().allow(null, ''),
    isActive: Joi.boolean().optional(),
  }),
};

/**
 * Quotes validation schemas
 */
export const quotesValidation = {
  createQuote: Joi.object({
    customerId: commonSchemas.uuid.required()
      .messages({
        'any.required': 'Customer ID is required',
      }),
    userId: commonSchemas.uuid.optional(), // Will be set from authenticated user if not provided
    status: Joi.string()
      .valid('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED')
      .default('DRAFT'),
    expiresAt: Joi.date().iso().optional().allow(null), // Default to 7 days if not provided
    notes: Joi.string().trim().max(5000).optional().allow(null, ''),
    terms: Joi.string().trim().max(5000).optional().allow(null, ''),
    quoteItems: Joi.array().items(
      Joi.object({
        partId: commonSchemas.uuid.required()
          .messages({
            'any.required': 'Part ID is required for quote item',
          }),
        quantity: Joi.number().integer().min(1).required()
          .messages({
            'number.min': 'Quantity must be at least 1',
            'any.required': 'Quantity is required',
          }),
        unitPrice: Joi.number().min(0).precision(2).required()
          .messages({
            'number.min': 'Unit price must be a positive number',
            'any.required': 'Unit price is required',
          }),
        notes: Joi.string().trim().max(500).optional().allow(null, ''),
      })
    ).min(1).required()
      .messages({
        'array.min': 'At least one quote item is required',
        'any.required': 'Quote items are required',
      }),
  }),

  updateQuote: Joi.object({
    status: Joi.string()
      .valid('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED')
      .optional(),
    expiresAt: Joi.date().iso().optional().allow(null),
    notes: Joi.string().trim().max(5000).optional().allow(null, ''),
    terms: Joi.string().trim().max(5000).optional().allow(null, ''),
    quoteItems: Joi.array().items(
      Joi.object({
        id: commonSchemas.uuid.optional(), // For existing items
        partId: commonSchemas.uuid.required()
          .messages({
            'any.required': 'Part ID is required for quote item',
          }),
        quantity: Joi.number().integer().min(1).required()
          .messages({
            'number.min': 'Quantity must be at least 1',
            'any.required': 'Quantity is required',
          }),
        unitPrice: Joi.number().min(0).precision(2).required()
          .messages({
            'number.min': 'Unit price must be a positive number',
            'any.required': 'Unit price is required',
          }),
        notes: Joi.string().trim().max(500).optional().allow(null, ''),
      })
    ).optional(),
  }).min(1), // At least one field must be provided

  sendQuote: Joi.object({
    notes: Joi.string().trim().max(5000).optional().allow(null, ''),
    terms: Joi.string().trim().max(5000).optional().allow(null, ''),
  }),
};

/**
 * Vehicle validation schemas
 */
export const vehiclesValidation = {
  createVehicle: Joi.object({
    customerId: commonSchemas.uuid.optional().allow(null, ''),
    vin: Joi.string().trim().length(17).required()
      .pattern(/^[A-HJ-NPR-Z0-9]{17}$/i)
      .messages({
        'string.length': 'VIN must be exactly 17 characters',
        'string.pattern.base': 'VIN must contain only alphanumeric characters (excluding I, O, Q)',
        'any.required': 'VIN is required',
      }),
    registrationNumber: Joi.string().trim().max(10).optional().allow(null, '')
      .messages({
        'string.max': 'Registration number must not exceed 10 characters',
      }),
    make: Joi.string().trim().min(1).max(100).required()
      .messages({
        'string.min': 'Make is required',
        'string.max': 'Make must not exceed 100 characters',
        'any.required': 'Make is required',
      }),
    model: Joi.string().trim().min(1).max(100).required()
      .messages({
        'string.min': 'Model is required',
        'string.max': 'Model must not exceed 100 characters',
        'any.required': 'Model is required',
      }),
    year: Joi.number().integer().min(1900).max(2050).required()
      .messages({
        'number.min': 'Year must be 1900 or later',
        'number.max': 'Year must be 2050 or earlier',
        'any.required': 'Year is required',
      }),
    engine: Joi.string().trim().max(100).optional().allow(null, ''),
    transmission: Joi.string().trim().max(100).optional().allow(null, ''),
    color: Joi.string().trim().max(50).optional().allow(null, ''),
    bodyType: Joi.string().trim().max(50).optional().allow(null, ''),
    fuelType: Joi.string().trim().max(50).optional().allow(null, ''),
    notes: Joi.string().trim().max(5000).optional().allow(null, ''),
  }),

  updateVehicle: Joi.object({
    customerId: commonSchemas.uuid.optional().allow(null, ''),
    registrationNumber: Joi.string().trim().max(10).optional().allow(null, ''),
    make: Joi.string().trim().min(1).max(100).optional(),
    model: Joi.string().trim().min(1).max(100).optional(),
    year: Joi.number().integer().min(1900).max(2050).optional(),
    engine: Joi.string().trim().max(100).optional().allow(null, ''),
    transmission: Joi.string().trim().max(100).optional().allow(null, ''),
    color: Joi.string().trim().max(50).optional().allow(null, ''),
    bodyType: Joi.string().trim().max(50).optional().allow(null, ''),
    fuelType: Joi.string().trim().max(50).optional().allow(null, ''),
    notes: Joi.string().trim().max(5000).optional().allow(null, ''),
    isActive: Joi.boolean().optional(),
  }).min(1), // At least one field must be provided

  decodeVin: Joi.object({
    vin: Joi.string().trim().length(17).required()
      .pattern(/^[A-HJ-NPR-Z0-9]{17}$/i)
      .messages({
        'string.length': 'VIN must be exactly 17 characters',
        'string.pattern.base': 'VIN must contain only alphanumeric characters (excluding I, O, Q)',
        'any.required': 'VIN is required',
      }),
  }),
};

export default {
  validate,
  commonSchemas,
  userRegistrationSchema,
  loginSchema,
  tenantSchema,
  updateTenantSchema,
  paginationSchema,
  partsValidation,
  customersValidation,
  quotesValidation,
  vehiclesValidation,
  sanitizeInput,
  sanitizeQueryParams,
};