# Australian Auto Parts Sales Platform - API Documentation

## Table of Contents

1. [API Overview](#1-api-overview)
2. [Authentication & Security](#2-authentication--security)
3. [Core Resources & Endpoints](#3-core-resources--endpoints)
4. [Data Models](#4-data-models)
5. [Error Handling](#5-error-handling)
6. [Rate Limiting & Quotas](#6-rate-limiting--quotas)
7. [Webhooks](#7-webhooks)
8. [Third-Party Integrations](#8-third-party-integrations)
9. [Mobile API Considerations](#9-mobile-api-considerations)
10. [Development & Testing Guidelines](#10-development--testing-guidelines)
11. [Australian Compliance Requirements](#11-australian-compliance-requirements)

---

## 1. API Overview

### 1.1 Introduction

The Australian Auto Parts Sales Platform API provides RESTful endpoints for managing inventory, customer relationships, orders, and reporting for the second-hand auto parts industry in Australia. The API is designed with multi-tenant SaaS architecture to support businesses of all sizes.

### 1.2 Base URL

```
https://api.autopartsplatform.com.au/api/v1
```

### 1.3 API Versioning

The API uses URI path versioning. The current version is `v1`. All endpoints include the version in the URL path:

```
/api/v1/...
```

For backward compatibility, older versions may be maintained. Version deprecation will follow:
- 12-month notification period before deprecation
- Sunset date clearly communicated in API responses via `Deprecation` header
- Migration guides provided for all deprecated endpoints

### 1.4 RESTful Design Principles

- **Resource-Based URLs**: Each endpoint represents a resource (e.g., `/customers`, `/orders`)
- **HTTP Methods**: Standard HTTP methods (GET, POST, PUT, PATCH, DELETE) represent operations
- **JSON Payloads**: All request and response bodies use JSON format
- **Status Codes**: HTTP status codes indicate success or failure of requests
- **Idempotency**: POST/PUT/PATCH operations are designed to be idempotent where applicable

### 1.5 Supported HTTP Methods

| Method | Purpose | Idempotent |
|--------|---------|------------|
| GET | Retrieve resource(s) | Yes |
| POST | Create new resource | No |
| PUT | Replace entire resource | Yes |
| PATCH | Update specific fields | Yes |
| DELETE | Remove resource | Yes |

---

## 2. Authentication & Security

### 2.1 Authentication Mechanism: JWT (JSON Web Tokens)

All API requests require authentication via JWT tokens in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

### 2.2 Login Endpoint

**POST** `/auth/login`

Request Body:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Smith",
      "role": "admin",
      "tenant_id": "550e8400-e29b-41d4-a716-446655440001"
    }
  },
  "meta": {
    "timestamp": "2025-10-23T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

### 2.3 Token Management

- **Access Token Expiry**: 1 hour
- **Refresh Token Expiry**: 30 days
- **Token Rotation**: New refresh tokens issued on token refresh

**POST** `/auth/refresh`

Request Body:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600
  }
}
```

### 2.4 Logout Endpoint

**POST** `/auth/logout`

Headers:
```
Authorization: Bearer <access_token>
```

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

### 2.5 Password Reset

**POST** `/auth/forgot-password`

Request Body:
```json
{
  "email": "user@example.com"
}
```

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Password reset link sent to email"
  }
}
```

**POST** `/auth/reset-password`

Request Body:
```json
{
  "token": "reset_token_from_email",
  "new_password": "newsecurepassword123"
}
```

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully"
  }
}
```

### 2.6 Security Features

#### HTTPS/TLS
- All API requests must use HTTPS (TLS 1.3)
- Unencrypted HTTP requests are rejected

#### Password Hashing
- Passwords hashed using bcrypt (cost factor 12)
- Never transmitted in plain text

#### Role-Based Access Control (RBAC)
- **Owner**: Full access, billing management
- **Admin**: All operations except billing
- **Sales**: CRM, orders, quotes, limited inventory
- **Inventory**: Full inventory, vehicle processing, parts catalog
- **Accountant**: Read-only, reports, export data
- **Customer**: Self-service portal, order history

#### Multi-Tenant Isolation
- Row-Level Security (RLS) at database level
- All responses filtered by authenticated user's tenant_id
- Cross-tenant data access prevented via middleware

#### Rate Limiting
See Section 6 for detailed rate limiting information.

---

## 3. Core Resources & Endpoints

### 3.1 User Management

#### List Users
**GET** `/users`

Query Parameters:
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Results per page (default: 20, max: 100)
- `role` (optional): Filter by role
- `is_active` (optional): Filter by active status (true/false)

Response (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Smith",
      "role": "admin",
      "is_active": true,
      "last_login_at": "2025-10-23T08:15:00Z",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_pages": 5,
    "total_items": 95
  },
  "meta": {
    "timestamp": "2025-10-23T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### Get User Details
**GET** `/users/{id}`

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Smith",
    "phone": "0412345678",
    "role": "admin",
    "is_active": true,
    "email_verified": true,
    "avatar_url": "https://cdn.autopartsplatform.com.au/avatars/user_123.jpg",
    "last_login_at": "2025-10-23T08:15:00Z",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-10-23T09:00:00Z"
  },
  "meta": {
    "timestamp": "2025-10-23T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### Create User
**POST** `/users`

Request Body:
```json
{
  "email": "newuser@example.com",
  "first_name": "Jane",
  "last_name": "Doe",
  "phone": "0412345678",
  "role": "sales",
  "password": "initialpassword123"
}
```

Response (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "email": "newuser@example.com",
    "first_name": "Jane",
    "last_name": "Doe",
    "role": "sales",
    "is_active": true,
    "created_at": "2025-10-23T10:30:00Z"
  },
  "meta": {
    "timestamp": "2025-10-23T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### Update User
**PATCH** `/users/{id}`

Request Body:
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "0412345678",
  "role": "admin"
}
```

Response (200 OK): Returns updated user object

#### Delete User
**DELETE** `/users/{id}`

Response (204 No Content)

---

### 3.2 Customer Management

#### List Customers
**GET** `/customers`

Query Parameters:
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Results per page (default: 20, max: 100)
- `search` (optional): Search by name, email, or phone
- `customer_type` (optional): Filter by type (individual/business)
- `classification` (optional): Filter by classification (retail/trade/wholesale)

Response (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "customer_type": "business",
      "first_name": "John",
      "last_name": "Smith",
      "business_name": "Smith's Repairs",
      "abn": "12345678901",
      "email": "john@smithsrepairs.com.au",
      "phone": "0212345678",
      "mobile": "0412345678",
      "address": {
        "street": "123 Main Street",
        "suburb": "Richmond",
        "state": "VIC",
        "postcode": "3121",
        "country": "AU"
      },
      "customer_classification": "trade",
      "credit_limit": 50000.00,
      "payment_terms": 30,
      "preferred_contact": "email",
      "lifetime_value": 125000.00,
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_pages": 3,
    "total_items": 52
  },
  "meta": {
    "timestamp": "2025-10-23T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### Get Customer Details
**GET** `/customers/{id}`

Response (200 OK): Returns single customer object with full details

#### Create Customer
**POST** `/customers`

Request Body:
```json
{
  "customer_type": "business",
  "first_name": "John",
  "last_name": "Smith",
  "business_name": "Smith's Repairs",
  "abn": "12345678901",
  "email": "john@smithsrepairs.com.au",
  "phone": "0212345678",
  "mobile": "0412345678",
  "address": {
    "street": "123 Main Street",
    "suburb": "Richmond",
    "state": "VIC",
    "postcode": "3121"
  },
  "customer_classification": "trade",
  "payment_terms": 30,
  "preferred_contact": "email"
}
```

Response (201 Created): Returns created customer object

#### Update Customer
**PATCH** `/customers/{id}`

Request Body:
```json
{
  "phone": "0212345679",
  "customer_classification": "wholesale",
  "credit_limit": 75000.00
}
```

Response (200 OK): Returns updated customer object

#### Delete Customer
**DELETE** `/customers/{id}`

Response (204 No Content)

#### Get Customer Order History
**GET** `/customers/{id}/orders`

Query Parameters:
- `page` (optional): Page number
- `per_page` (optional): Results per page
- `status` (optional): Filter by order status

Response (200 OK): Returns paginated list of orders for customer

#### Get Customer Communications
**GET** `/customers/{id}/communications`

Query Parameters:
- `page` (optional): Page number
- `type` (optional): Filter by communication type (email/sms/phone/in_app)
- `date_from` (optional): Start date (ISO 8601)
- `date_to` (optional): End date (ISO 8601)

Response (200 OK): Returns paginated list of communications

---

### 3.3 Vehicle Management

#### List Vehicles
**GET** `/vehicles`

Query Parameters:
- `page` (optional): Page number
- `per_page` (optional): Results per page
- `status` (optional): Filter by status (pending/in_progress/completed/disposed)
- `make` (optional): Filter by make
- `model` (optional): Filter by model
- `year_from` (optional): Filter by year minimum
- `year_to` (optional): Filter by year maximum

Response (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440004",
      "vin": "JTHBP5C19A5031345",
      "make": "Toyota",
      "model": "Hilux",
      "year": 2015,
      "body_type": "Dual Cab",
      "engine": "2.4L Petrol",
      "transmission": "Manual",
      "color": "Silver",
      "odometer": 125000,
      "acquisition_date": "2025-10-15",
      "acquisition_source": "auction",
      "acquisition_cost": 15000.00,
      "vehicle_status": "in_progress",
      "storage_location": "Yard A - Row 3",
      "dismantler_user_id": "550e8400-e29b-41d4-a716-446655440000",
      "photos": [
        "https://cdn.autopartsplatform.com.au/vehicles/vin_001/exterior_1.jpg",
        "https://cdn.autopartsplatform.com.au/vehicles/vin_001/interior_1.jpg"
      ],
      "created_at": "2025-10-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_pages": 2,
    "total_items": 25
  },
  "meta": {
    "timestamp": "2025-10-23T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### Get Vehicle Details
**GET** `/vehicles/{id}`

Response (200 OK): Returns single vehicle with full details

#### Create Vehicle
**POST** `/vehicles`

Request Body:
```json
{
  "vin": "JTHBP5C19A5031345",
  "acquisition_date": "2025-10-15",
  "acquisition_source": "auction",
  "acquisition_cost": 15000.00,
  "odometer": 125000,
  "storage_location": "Yard A - Row 3"
}
```

Response (201 Created): Returns created vehicle with decoded VIN data

#### Update Vehicle
**PATCH** `/vehicles/{id}`

Request Body:
```json
{
  "vehicle_status": "completed",
  "storage_location": "Yard B - Row 1",
  "notes": "Vehicle fully dismantled"
}
```

Response (200 OK): Returns updated vehicle object

#### VIN Decoder
**POST** `/vehicles/decode-vin`

Request Body:
```json
{
  "vin": "JTHBP5C19A5031345"
}
```

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "vin": "JTHBP5C19A5031345",
    "make": "Toyota",
    "model": "Hilux",
    "year": 2015,
    "body_type": "Dual Cab",
    "engine": "2.4L Petrol",
    "transmission": "Manual",
    "drive_type": "4WD",
    "market": "Australia",
    "is_stolen": false
  },
  "meta": {
    "timestamp": "2025-10-23T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### Get Vehicle Parts
**GET** `/vehicles/{id}/parts`

Query Parameters:
- `page` (optional): Page number
- `per_page` (optional): Results per page
- `status` (optional): Filter by status (available/reserved/sold/returned)

Response (200 OK): Returns paginated list of parts from vehicle

---

### 3.4 Parts/Inventory Management

#### List Parts
**GET** `/parts`

Query Parameters:
- `page` (optional): Page number
- `per_page` (optional): Results per page
- `category` (optional): Filter by category
- `condition` (optional): Filter by condition
- `status` (optional): Filter by status
- `min_price` (optional): Minimum price
- `max_price` (optional): Maximum price
- `location` (optional): Filter by storage location

Response (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440005",
      "vehicle_id": "550e8400-e29b-41d4-a716-446655440004",
      "part_type": "Engine",
      "part_category": "engine_components",
      "oem_part_number": "1900011090",
      "aftermarket_part_number": null,
      "description": "2.4L Petrol Engine - Toyota Hilux 2015",
      "condition_grade": "excellent",
      "warranty_months": 6,
      "quantity": 1,
      "location": "Row B, Shelf 3",
      "cost_price": 12000.00,
      "sell_price": 1850.00,
      "status": "available",
      "compatibility": [
        "Toyota Hilux 2015-2020",
        "Toyota Fortuner 2016-2021"
      ],
      "extended_attributes": {
        "color": "Silver",
        "tested": true,
        "testing_notes": "Compression tested, all cylinders within spec"
      },
      "photos": [
        "https://cdn.autopartsplatform.com.au/parts/EN_001/front.jpg",
        "https://cdn.autopartsplatform.com.au/parts/EN_001/side.jpg"
      ],
      "weight_kg": 215.5,
      "dimensions": {
        "length_cm": 65,
        "width_cm": 45,
        "height_cm": 55
      },
      "date_cataloged": "2025-10-15",
      "created_at": "2025-10-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_pages": 5,
    "total_items": 87
  },
  "meta": {
    "timestamp": "2025-10-23T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### Get Part Details
**GET** `/parts/{id}`

Response (200 OK): Returns single part with full details

#### Create Part
**POST** `/parts`

Request Body:
```json
{
  "vehicle_id": "550e8400-e29b-41d4-a716-446655440004",
  "part_type": "Engine",
  "part_category": "engine_components",
  "oem_part_number": "1900011090",
  "description": "2.4L Petrol Engine - Toyota Hilux 2015",
  "condition_grade": "excellent",
  "warranty_months": 6,
  "location": "Row B, Shelf 3",
  "cost_price": 12000.00,
  "sell_price": 1850.00,
  "extended_attributes": {
    "tested": true,
    "testing_notes": "Compression tested, all cylinders within spec"
  },
  "weight_kg": 215.5,
  "dimensions": {
    "length_cm": 65,
    "width_cm": 45,
    "height_cm": 55
  }
}
```

Response (201 Created): Returns created part object

#### Update Part
**PATCH** `/parts/{id}`

Request Body:
```json
{
  "sell_price": 1950.00,
  "location": "Row C, Shelf 1",
  "status": "available"
}
```

Response (200 OK): Returns updated part object

#### Delete Part
**DELETE** `/parts/{id}`

Response (204 No Content)

#### Advanced Parts Search
**POST** `/parts/search`

Request Body:
```json
{
  "query": "engine hilux",
  "filters": {
    "make": "Toyota",
    "model": "Hilux",
    "condition": ["excellent", "good"],
    "price_range": {
      "min": 1500,
      "max": 2500
    },
    "warranty_min_months": 6
  },
  "sort": "price_asc",
  "page": 1,
  "per_page": 20
}
```

Response (200 OK): Returns search results with relevance scoring

#### Bulk Update Parts
**PATCH** `/parts/bulk-update`

Request Body:
```json
{
  "part_ids": [
    "550e8400-e29b-41d4-a716-446655440005",
    "550e8400-e29b-41d4-a716-446655440006"
  ],
  "updates": {
    "location": "Row D, Shelf 2",
    "warranty_months": 12
  }
}
```

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "updated_count": 2
  }
}
```

#### Get Part Compatibility
**GET** `/parts/{id}/compatibility`

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "part_id": "550e8400-e29b-41d4-a716-446655440005",
    "compatible_vehicles": [
      {
        "make": "Toyota",
        "model": "Hilux",
        "year_from": 2015,
        "year_to": 2020,
        "body_types": ["Dual Cab", "Single Cab"]
      },
      {
        "make": "Toyota",
        "model": "Fortuner",
        "year_from": 2016,
        "year_to": 2021,
        "body_types": ["5-seater", "7-seater"]
      }
    ],
    "similar_parts": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440006",
        "description": "2.4L Petrol Engine - Toyota Hilux 2017",
        "condition": "good",
        "price": 1750.00
      }
    ]
  },
  "meta": {
    "timestamp": "2025-10-23T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### Upload Part Photos
**POST** `/parts/{id}/photos`

Request (multipart/form-data):
- `photos`: Array of image files (max 10 per part)
- `annotations`: JSON array of photo annotations (optional)

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "part_id": "550e8400-e29b-41d4-a716-446655440005",
    "photos": [
      {
        "url": "https://cdn.autopartsplatform.com.au/parts/EN_001/photo_1.jpg",
        "thumbnail_url": "https://cdn.autopartsplatform.com.au/parts/EN_001/photo_1_thumb.jpg",
        "annotation": "Front view showing condition"
      }
    ]
  }
}
```

---

### 3.5 Quote Management

#### List Quotes
**GET** `/quotes`

Query Parameters:
- `page` (optional): Page number
- `per_page` (optional): Results per page
- `status` (optional): Filter by status
- `customer_id` (optional): Filter by customer
- `date_from` (optional): Start date
- `date_to` (optional): End date

Response (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440007",
      "quote_number": "QUO-2025-001",
      "customer_id": "550e8400-e29b-41d4-a716-446655440003",
      "sales_user_id": "550e8400-e29b-41d4-a716-446655440000",
      "quote_date": "2025-10-23",
      "expiry_date": "2025-10-30",
      "subtotal": 1935.00,
      "discount_amount": 0.00,
      "shipping_cost": 0.00,
      "gst_amount": 193.50,
      "total_amount": 2128.50,
      "status": "sent",
      "items": [
        {
          "part_id": "550e8400-e29b-41d4-a716-446655440005",
          "quantity": 1,
          "unit_price": 1850.00,
          "discount_percentage": 0,
          "line_total": 1850.00
        }
      ],
      "notes": "Quote for Smith's Repairs",
      "created_at": "2025-10-23T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_pages": 2,
    "total_items": 35
  },
  "meta": {
    "timestamp": "2025-10-23T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### Get Quote Details
**GET** `/quotes/{id}`

Response (200 OK): Returns single quote with full details including items

#### Create Quote
**POST** `/quotes`

Request Body:
```json
{
  "customer_id": "550e8400-e29b-41d4-a716-446655440003",
  "items": [
    {
      "part_id": "550e8400-e29b-41d4-a716-446655440005",
      "quantity": 1
    },
    {
      "part_id": "550e8400-e29b-41d4-a716-446655440006",
      "quantity": 1
    }
  ],
  "discount_amount": 0,
  "shipping_cost": 0,
  "expiry_days": 7,
  "notes": "Quote for Smith's Repairs"
}
```

Response (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440007",
    "quote_number": "QUO-2025-001",
    "customer_id": "550e8400-e29b-41d4-a716-446655440003",
    "subtotal": 1935.00,
    "gst_amount": 193.50,
    "total_amount": 2128.50,
    "status": "draft",
    "created_at": "2025-10-23T10:30:00Z"
  },
  "meta": {
    "timestamp": "2025-10-23T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### Update Quote
**PATCH** `/quotes/{id}`

Request Body:
```json
{
  "discount_amount": 100,
  "notes": "Updated quote with discount"
}
```

Response (200 OK): Returns updated quote object

#### Convert Quote to Order
**POST** `/quotes/{id}/convert`

Request Body:
```json
{
  "fulfillment_method": "courier",
  "shipping_address": {
    "street": "456 Oak Street",
    "suburb": "Fitzroy",
    "state": "VIC",
    "postcode": "3065"
  }
}
```

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "order_id": "550e8400-e29b-41d4-a716-446655440008",
    "order_number": "ORD-2025-001",
    "quote_id": "550e8400-e29b-41d4-a716-446655440007",
    "status": "pending"
  }
}
```

#### Send Quote to Customer
**POST** `/quotes/{id}/send`

Request Body:
```json
{
  "send_via": ["email", "sms"],
  "custom_message": "Please review the attached quote"
}
```

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Quote sent successfully",
    "sent_via": ["email", "sms"]
  }
}
```

#### Generate Quote PDF
**GET** `/quotes/{id}/pdf`

Response (200 OK): Returns PDF file with Content-Type: application/pdf

---

### 3.6 Order Processing

#### List Orders
**GET** `/orders`

Query Parameters:
- `page` (optional): Page number
- `per_page` (optional): Results per page
- `status` (optional): Filter by status
- `payment_status` (optional): Filter by payment status
- `fulfillment_status` (optional): Filter by fulfillment status
- `customer_id` (optional): Filter by customer
- `date_from` (optional): Start date
- `date_to` (optional): End date

Response (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440008",
      "order_number": "ORD-2025-001",
      "quote_id": "550e8400-e29b-41d4-a716-446655440007",
      "customer_id": "550e8400-e29b-41d4-a716-446655440003",
      "sales_user_id": "550e8400-e29b-41d4-a716-446655440000",
      "order_date": "2025-10-23T10:30:00Z",
      "subtotal": 1935.00,
      "discount_amount": 100.00,
      "shipping_cost": 25.00,
      "gst_amount": 185.95,
      "total_amount": 2045.95,
      "payment_status": "paid",
      "fulfillment_status": "shipped",
      "fulfillment_method": "courier",
      "items": [
        {
          "part_id": "550e8400-e29b-41d4-a716-446655440005",
          "quantity": 1,
          "unit_price": 1850.00,
          "discount_percentage": 5,
          "line_total": 1757.50,
          "warranty_months": 6,
          "warranty_expiry_date": "2026-04-23"
        }
      ],
      "created_at": "2025-10-23T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_pages": 3,
    "total_items": 52
  },
  "meta": {
    "timestamp": "2025-10-23T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### Get Order Details
**GET** `/orders/{id}`

Response (200 OK): Returns single order with full details

#### Create Order
**POST** `/orders`

Request Body:
```json
{
  "customer_id": "550e8400-e29b-41d4-a716-446655440003",
  "items": [
    {
      "part_id": "550e8400-e29b-41d4-a716-446655440005",
      "quantity": 1
    }
  ],
  "discount_amount": 100,
  "shipping_cost": 25,
  "fulfillment_method": "courier",
  "shipping_address": {
    "street": "456 Oak Street",
    "suburb": "Fitzroy",
    "state": "VIC",
    "postcode": "3065"
  },
  "notes": "Handle with care - fragile part"
}
```

Response (201 Created): Returns created order object

#### Update Order
**PATCH** `/orders/{id}`

Request Body:
```json
{
  "notes": "Updated notes",
  "internal_notes": "Updated internal notes"
}
```

Response (200 OK): Returns updated order object

#### Record Payment
**POST** `/orders/{id}/payments`

Request Body:
```json
{
  "payment_method": "card",
  "amount": 2045.95,
  "payment_gateway": "stripe",
  "transaction_id": "ch_1234567890",
  "notes": "Payment processed"
}
```

Response (201 Created):
```json
{
  "success": true,
  "data": {
    "payment_id": "550e8400-e29b-41d4-a716-446655440009",
    "order_id": "550e8400-e29b-41d4-a716-446655440008",
    "amount": 2045.95,
    "status": "completed",
    "payment_date": "2025-10-23T10:35:00Z"
  }
}
```

#### Create Shipment
**POST** `/orders/{id}/ship`

Request Body:
```json
{
  "carrier": "australia_post",
  "tracking_number": "CP1234567890AU",
  "estimated_delivery_date": "2025-10-26",
  "recipient_name": "John Smith",
  "recipient_phone": "0212345678"
}
```

Response (201 Created):
```json
{
  "success": true,
  "data": {
    "shipment_id": "550e8400-e29b-41d4-a716-446655440010",
    "order_id": "550e8400-e29b-41d4-a716-446655440008",
    "carrier": "australia_post",
    "tracking_number": "CP1234567890AU",
    "status": "shipped",
    "shipped_date": "2025-10-23T11:00:00Z"
  }
}
```

#### Update Order Status
**PATCH** `/orders/{id}/status`

Request Body:
```json
{
  "fulfillment_status": "delivered",
  "notify_customer": true,
  "notes": "Order delivered successfully"
}
```

Response (200 OK): Returns updated order object

#### Generate Invoice PDF
**GET** `/orders/{id}/invoice`

Response (200 OK): Returns PDF file with invoice

---

### 3.7 Payment Processing

#### Create Stripe Payment Intent
**POST** `/payments/stripe/intent`

Request Body:
```json
{
  "order_id": "550e8400-e29b-41d4-a716-446655440008",
  "amount": 204595,
  "currency": "aud",
  "customer_email": "john@smithsrepairs.com.au"
}
```

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "client_secret": "pi_1234567890_secret_abc123",
    "intent_id": "pi_1234567890",
    "amount": 204595,
    "currency": "aud",
    "status": "requires_payment_method"
  }
}
```

#### Stripe Webhook Handler
**POST** `/payments/stripe/webhook`

Headers:
```
Stripe-Signature: t=timestamp,v1=signature
```

Request Body: Stripe event JSON

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Webhook processed"
  }
}
```

#### Square Checkout
**POST** `/payments/square/checkout`

Request Body:
```json
{
  "order_id": "550e8400-e29b-41d4-a716-446655440008",
  "amount": 204595,
  "currency": "AUD",
  "return_url": "https://mysite.com/checkout/return"
}
```

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "checkout_url": "https://checkout.square.site/pay/abc123",
    "checkout_id": "abc123"
  }
}
```

#### Process Refund
**POST** `/payments/{id}/refund`

Request Body:
```json
{
  "reason": "customer_request",
  "notes": "Customer requested refund for defective part"
}
```

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "refund_id": "550e8400-e29b-41d4-a716-446655440011",
    "original_payment_id": "550e8400-e29b-41d4-a716-446655440009",
    "amount": 2045.95,
    "status": "completed",
    "reason": "customer_request"
  }
}
```

---

### 3.8 Shipping Integration

#### Calculate Shipping Rate
**POST** `/shipping/calculate-rate`

Request Body:
```json
{
  "carrier": "australia_post",
  "from_postcode": "3121",
  "to_postcode": "3065",
  "weight_kg": 2.5,
  "length_cm": 30,
  "width_cm": 20,
  "height_cm": 15,
  "service_type": "parcel_post"
}
```

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "carrier": "australia_post",
    "service_type": "parcel_post",
    "cost": 25.00,
    "currency": "AUD",
    "estimated_days": 5,
    "estimated_delivery_date": "2025-10-28"
  },
  "meta": {
    "timestamp": "2025-10-23T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### Generate Shipping Label
**POST** `/shipping/create-label`

Request Body:
```json
{
  "shipment_id": "550e8400-e29b-41d4-a716-446655440010",
  "carrier": "australia_post",
  "service_type": "parcel_post",
  "from_address": {
    "name": "Smith's Auto Wrecking",
    "phone": "0212345678",
    "address": "123 Yard Street",
    "suburb": "Richmond",
    "state": "VIC",
    "postcode": "3121"
  },
  "to_address": {
    "name": "John Smith",
    "phone": "0212345679",
    "address": "456 Oak Street",
    "suburb": "Fitzroy",
    "state": "VIC",
    "postcode": "3065"
  }
}
```

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "label_url": "https://shipping.australia-post.com.au/labels/label_123.pdf",
    "tracking_number": "CP1234567890AU",
    "carrier": "australia_post"
  }
}
```

#### Track Shipment
**GET** `/shipping/track/{tracking_number}`

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "tracking_number": "CP1234567890AU",
    "carrier": "australia_post",
    "status": "in_transit",
    "events": [
      {
        "timestamp": "2025-10-24T08:30:00Z",
        "location": "Richmond, VIC",
        "status": "picked_up",
        "description": "Item picked up from sender"
      },
      {
        "timestamp": "2025-10-24T15:45:00Z",
        "location": "Melbourne Sorting Centre, VIC",
        "status": "in_transit",
        "description": "Item in transit"
      }
    ],
    "estimated_delivery": "2025-10-26"
  }
}
```

---

### 3.9 Reporting & Analytics

#### Get Dashboard Metrics
**GET** `/reports/dashboard`

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "today_sales": 4827.50,
    "today_sales_vs_avg": 15,
    "open_orders": 12,
    "orders_processing": 5,
    "orders_ready_to_ship": 7,
    "total_inventory": 2456,
    "vehicles_in_stock": 53,
    "new_parts_today": 87,
    "open_support_tickets": 7,
    "high_priority_tickets": 3,
    "pending_quotes": 15,
    "expiring_quotes": 5,
    "outstanding_payments": 12845.50,
    "overdue_payments_count": 4,
    "recent_activity": [
      {
        "timestamp": "2025-10-23T10:30:00Z",
        "event": "Order created",
        "reference": "ORD-2025-001"
      }
    ],
    "top_selling_parts": [
      {
        "part_id": "550e8400-e29b-41d4-a716-446655440005",
        "description": "Engines",
        "revenue": 24850.00,
        "units_sold": 12,
        "period_days": 7
      }
    ]
  },
  "meta": {
    "timestamp": "2025-10-23T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### Sales Report
**GET** `/reports/sales`

Query Parameters:
- `date_from` (optional): Start date (ISO 8601)
- `date_to` (optional): End date (ISO 8601)
- `group_by` (optional): Group by (day/week/month/year)
- `filter_by` (optional): Filter by (customer/category/part)

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "total_revenue": 125000.00,
    "total_gst": 12500.00,
    "total_orders": 50,
    "average_order_value": 2500.00,
    "by_period": [
      {
        "period": "2025-10-23",
        "revenue": 4827.50,
        "orders": 2,
        "gst": 482.75
      }
    ],
    "by_category": [
      {
        "category": "Engines",
        "revenue": 24850.00,
        "units": 12
      }
    ]
  }
}
```

#### Inventory Report
**GET** `/reports/inventory`

Query Parameters:
- `date_from` (optional): Start date
- `date_to` (optional): End date
- `status` (optional): Filter by status

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "total_parts": 2456,
    "total_inventory_value": 487500.00,
    "inventory_by_status": {
      "available": 1850,
      "reserved": 456,
      "sold": 150
    },
    "inventory_aging": {
      "0_30_days": 450,
      "31_60_days": 380,
      "61_90_days": 290,
      "90_plus_days": 736
    },
    "stock_turnover_rate": 2.5,
    "slowest_moving_parts": [
      {
        "part_id": "550e8400-e29b-41d4-a716-446655440005",
        "days_in_stock": 180,
        "quantity": 1
      }
    ]
  }
}
```

#### Customer Report
**GET** `/reports/customers`

Query Parameters:
- `date_from` (optional): Start date
- `date_to` (optional): End date

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "new_customers": 5,
    "active_customers": 52,
    "total_revenue_from_customers": 125000.00,
    "top_customers": [
      {
        "customer_id": "550e8400-e29b-41d4-a716-446655440003",
        "name": "Smith's Repairs",
        "lifetime_value": 35000.00,
        "orders": 14
      }
    ],
    "customer_retention_rate": 85,
    "average_customer_lifetime_value": 2404.00
  }
}
```

#### Export Report
**POST** `/reports/export`

Request Body:
```json
{
  "report_type": "sales",
  "format": "csv",
  "date_from": "2025-01-01",
  "date_to": "2025-10-23",
  "email_to": "user@example.com"
}
```

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Report is being generated and will be emailed shortly",
    "export_id": "exp_123456"
  }
}
```

---

## 4. Data Models

### 4.1 Tenant
```json
{
  "id": "uuid",
  "business_name": "string",
  "subdomain": "string",
  "abn": "string",
  "subscription_tier": "string (basic|pro|enterprise)",
  "subscription_status": "string (trial|active|suspended|cancelled)",
  "contact_email": "string",
  "settings": "object",
  "storage_quota_gb": "integer",
  "api_rate_limit": "integer",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### 4.2 User
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "email": "string",
  "first_name": "string",
  "last_name": "string",
  "role": "string (owner|admin|sales|inventory|accountant|customer)",
  "phone": "string",
  "is_active": "boolean",
  "email_verified": "boolean",
  "last_login_at": "timestamp",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### 4.3 Customer
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "customer_type": "string (individual|business)",
  "first_name": "string",
  "last_name": "string",
  "business_name": "string",
  "abn": "string",
  "email": "string",
  "phone": "string",
  "mobile": "string",
  "address": "object {street, suburb, state, postcode, country}",
  "customer_classification": "string (retail|trade|wholesale)",
  "credit_limit": "decimal",
  "payment_terms": "integer",
  "preferred_contact": "string",
  "lifetime_value": "decimal",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### 4.4 Vehicle
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "vin": "string",
  "make": "string",
  "model": "string",
  "year": "integer",
  "body_type": "string",
  "engine": "string",
  "transmission": "string",
  "color": "string",
  "odometer": "integer",
  "acquisition_date": "date",
  "acquisition_source": "string",
  "acquisition_cost": "decimal",
  "vehicle_status": "string",
  "storage_location": "string",
  "dismantler_user_id": "uuid",
  "disposal_date": "date",
  "photos": "array of urls",
  "notes": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### 4.5 Part
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "vehicle_id": "uuid",
  "part_type": "string",
  "part_category": "string",
  "oem_part_number": "string",
  "aftermarket_part_number": "string",
  "description": "string",
  "condition_grade": "string (new|excellent|good|fair|poor)",
  "warranty_months": "integer",
  "quantity": "integer",
  "location": "string",
  "cost_price": "decimal",
  "sell_price": "decimal",
  "status": "string (available|reserved|sold|returned)",
  "reserved_until": "timestamp",
  "compatibility": "array",
  "extended_attributes": "object",
  "photos": "array of urls",
  "weight_kg": "decimal",
  "dimensions": "object {length_cm, width_cm, height_cm}",
  "date_cataloged": "date",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### 4.6 Quote
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "quote_number": "string",
  "customer_id": "uuid",
  "sales_user_id": "uuid",
  "quote_date": "date",
  "expiry_date": "date",
  "subtotal": "decimal",
  "discount_amount": "decimal",
  "shipping_cost": "decimal",
  "gst_amount": "decimal",
  "total_amount": "decimal",
  "status": "string (draft|sent|accepted|declined|expired|converted)",
  "items": "array of quote items",
  "notes": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### 4.7 Order
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "order_number": "string",
  "quote_id": "uuid",
  "customer_id": "uuid",
  "sales_user_id": "uuid",
  "order_date": "timestamp",
  "subtotal": "decimal",
  "discount_amount": "decimal",
  "shipping_cost": "decimal",
  "gst_amount": "decimal",
  "total_amount": "decimal",
  "payment_status": "string (pending|paid|partially_paid|refunded)",
  "fulfillment_status": "string (pending|picking|packed|shipped|delivered|completed)",
  "fulfillment_method": "string (pickup|courier|freight)",
  "items": "array of order items",
  "notes": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### 4.8 Payment
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "order_id": "uuid",
  "payment_method": "string (card|cash|bank_transfer|eftpos)",
  "payment_gateway": "string (stripe|square)",
  "transaction_id": "string",
  "amount": "decimal",
  "payment_date": "timestamp",
  "status": "string (pending|completed|failed|refunded)",
  "notes": "string",
  "created_at": "timestamp"
}
```

### 4.9 Shipment
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "order_id": "uuid",
  "carrier": "string (australia_post|tnt|startrack)",
  "tracking_number": "string",
  "shipping_label_url": "string",
  "shipped_date": "date",
  "estimated_delivery_date": "date",
  "actual_delivery_date": "date",
  "delivery_status": "string (pending|in_transit|delivered|failed)",
  "recipient_name": "string",
  "recipient_phone": "string",
  "delivery_address": "object",
  "notes": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

---

## 5. Error Handling

### 5.1 Standard Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [
      {
        "field": "field_name",
        "message": "Field-specific error message"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-10-23T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

### 5.2 HTTP Status Codes

| Code | Name | Description |
|------|------|-------------|
| 200 | OK | Successful GET, PUT, PATCH request |
| 201 | Created | Successful POST request creating a resource |
| 204 | No Content | Successful DELETE request |
| 400 | Bad Request | Validation error or malformed request |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Authenticated but insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists or state conflict |
| 422 | Unprocessable Entity | Business logic validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Server maintenance or dependency unavailable |

### 5.3 Standard Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| VALIDATION_ERROR | 400 | Request validation failed |
| INVALID_CREDENTIALS | 401 | Email/password incorrect |
| TOKEN_EXPIRED | 401 | JWT token has expired |
| TOKEN_INVALID | 401 | JWT token is invalid |
| UNAUTHORIZED | 403 | User lacks required permissions |
| NOT_FOUND | 404 | Resource not found |
| DUPLICATE_RECORD | 409 | Record already exists |
| BUSINESS_LOGIC_ERROR | 422 | Business logic constraint violated |
| INVALID_ABN | 422 | ABN validation failed |
| INSUFFICIENT_STOCK | 422 | Part quantity insufficient |
| QUOTE_EXPIRED | 422 | Quote has expired |
| PAYMENT_FAILED | 422 | Payment processing failed |
| RATE_LIMIT_EXCEEDED | 429 | API rate limit exceeded |
| SERVER_ERROR | 500 | Internal server error |
| SERVICE_UNAVAILABLE | 503 | External service temporarily unavailable |

### 5.4 Australian-Specific Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| INVALID_ABN_FORMAT | 422 | ABN format is invalid |
| ABN_NOT_FOUND | 422 | ABN not found in ABR database |
| ABN_NOT_GST_REGISTERED | 422 | Business ABN not GST registered |
| ACL_VIOLATION | 422 | Australian Consumer Law violation |
| PRIVACY_ACT_VIOLATION | 422 | Privacy Act 1988 violation |
| GST_CALCULATION_ERROR | 500 | Error calculating GST |

### 5.5 Example Error Responses

**Validation Error (400)**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email format is invalid"
      },
      {
        "field": "phone",
        "message": "Phone number must be provided"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-10-23T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

**Insufficient Permissions (403)**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "You do not have permission to perform this action",
    "details": [
      {
        "required_role": "admin",
        "user_role": "sales"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-10-23T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

**Business Logic Error (422)**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Requested quantity exceeds available stock",
    "details": [
      {
        "part_id": "550e8400-e29b-41d4-a716-446655440005",
        "requested_quantity": 5,
        "available_quantity": 2
      }
    ]
  },
  "meta": {
    "timestamp": "2025-10-23T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

---

## 6. Rate Limiting & Quotas

### 6.1 Rate Limiting by Subscription Tier

| Tier | Requests/Hour | Requests/Minute | Storage (GB) |
|------|---|---|---|
| Basic | 1,000 | 30 | 10 |
| Pro | 10,000 | 300 | 100 |
| Enterprise | 100,000 | 3,000 | Unlimited |

### 6.2 Rate Limit Headers

All API responses include rate limit information:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1698000000
```

- `X-RateLimit-Limit`: Maximum requests per hour for your tier
- `X-RateLimit-Remaining`: Requests remaining in current hour
- `X-RateLimit-Reset`: Unix timestamp when limit resets

### 6.3 Rate Limit Exceeded Response (429)

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "limit": 1000,
      "remaining": 0,
      "reset_at": "2025-10-23T11:30:00Z",
      "retry_after_seconds": 1800
    }
  },
  "meta": {
    "timestamp": "2025-10-23T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

### 6.4 Other Quotas

| Resource | Basic | Pro | Enterprise |
|----------|-------|-----|------------|
| Users | 3 | 10 | Unlimited |
| Vehicles/Month | 20 | 100 | Unlimited |
| Parts Inventory | 1,000 | 10,000 | Unlimited |
| Locations | 1 | 3 | Unlimited |
| API Keys | 1 | 5 | 10 |
| Webhooks | 5 | 20 | Unlimited |

---

## 7. Webhooks

### 7.1 Webhook Overview

Webhooks allow your application to receive real-time notifications when events occur in the platform. Each event is delivered as a POST request to your registered webhook URL.

### 7.2 Webhook Events

Available webhook events:

| Event | Description | Payload |
|-------|-------------|---------|
| `part.created` | Part added to inventory | Part object |
| `part.updated` | Part details modified | Part object |
| `part.status_changed` | Part status changed | Part object + old status |
| `order.created` | Order placed | Order object |
| `order.payment_received` | Payment recorded | Order + Payment object |
| `order.status_changed` | Order status updated | Order object + old status |
| `order.shipped` | Order shipped | Order + Shipment object |
| `order.delivered` | Order delivered | Order + Shipment object |
| `customer.created` | New customer registered | Customer object |
| `quote.created` | Quote generated | Quote object |
| `quote.accepted` | Quote accepted by customer | Quote object |
| `quote.expired` | Quote expiry date passed | Quote object |

### 7.3 Webhook Payload Format

```json
{
  "id": "webhook_event_id",
  "timestamp": "2025-10-23T10:30:00Z",
  "event": "order.created",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440008",
    "order_number": "ORD-2025-001",
    "customer_id": "550e8400-e29b-41d4-a716-446655440003",
    "total_amount": 2045.95,
    "status": "pending"
  },
  "metadata": {
    "tenant_id": "550e8400-e29b-41d4-a716-446655440001",
    "attempt": 1,
    "max_retries": 5
  }
}
```

### 7.4 Webhook Signature Verification

All webhook requests include an HMAC signature in the `X-Webhook-Signature` header:

```
X-Webhook-Signature: sha256=abcdef123456...
```

To verify the signature:

```javascript
const crypto = require('crypto');
const signature = request.headers['x-webhook-signature'];
const body = request.rawBody;
const secret = 'your_webhook_secret';

const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(body)
  .digest('hex');

if (signature !== `sha256=${expectedSignature}`) {
  throw new Error('Invalid signature');
}
```

### 7.5 Webhook Retry Policy

- **Delivery Attempts**: Maximum 5 attempts
- **Retry Schedule**: 
  - 1st retry: 1 minute
  - 2nd retry: 5 minutes
  - 3rd retry: 30 minutes
  - 4th retry: 2 hours
  - 5th retry: 24 hours
- **Success Response**: HTTP 200-299

---

## 8. Third-Party Integrations

### 8.1 Payment Gateways

#### Stripe Integration

**Environment Variables Required**:
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Supported Features**:
- Credit/debit card payments
- Payment intents API
- Webhook event handling
- 3D Secure authentication
- Refunds and partial refunds

#### Square Integration

**Environment Variables Required**:
```
SQUARE_ACCESS_TOKEN=sq0atp_...
SQUARE_LOCATION_ID=...
SQUARE_WEBHOOK_SIGNATURE_KEY=...
```

**Supported Features**:
- Card payments
- Square Reader integration
- Invoicing
- Refunds

### 8.2 Shipping Providers

#### Australia Post

**Environment Variables Required**:
```
AUSPOST_API_KEY=...
AUSPOST_ACCOUNT_NUMBER=...
```

**Endpoints Used**:
- Rate calculation
- Label generation
- Tracking

#### StarTrack

**Environment Variables Required**:
```
STARTRACK_USERNAME=...
STARTRACK_PASSWORD=...
```

**Endpoints Used**:
- Freight rate calculation
- Dangerous goods handling
- Tracking

### 8.3 VIN Decoder

#### NEVDIS (Primary)

**Configuration**:
```
NEVDIS_API_KEY=...
NEVDIS_BASE_URL=https://nevdis.api.example.com
```

**Data Retrieved**:
- Make, model, year
- Body type
- Engine specifications
- Stolen vehicle status
- Odometer history

### 8.4 ABN Validation

**Environment Variables Required**:
```
ABN_LOOKUP_API_KEY=...
ABN_LOOKUP_BASE_URL=https://www.abr.gov.au/json
```

**Data Retrieved**:
- Business name validation
- GST registration status
- Business entity type
- ACN number

### 8.5 SMS/Email Services

#### Twilio (SMS)

**Environment Variables Required**:
```
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+61...
```

#### SendGrid (Email)

**Environment Variables Required**:
```
SENDGRID_API_KEY=...
SENDGRID_FROM_EMAIL=noreply@autopartsplatform.com.au
```

### 8.6 Accounting Software Integration

#### Xero Integration

**OAuth 2.0 Required**:
```
XERO_CLIENT_ID=...
XERO_CLIENT_SECRET=...
XERO_REDIRECT_URI=https://api.autopartsplatform.com.au/integrations/xero/callback
```

**Data Synced**:
- Customers → Contacts
- Orders → Invoices
- Payments → Payment records

#### MYOB Integration

**Configuration**:
```
MYOB_API_KEY=...
MYOB_API_URL=https://api.myob.com
```

**Data Synced**:
- Customers → Contact List
- Orders → Sales Invoices
- Payments → Bank Deposits

---

## 9. Mobile API Considerations

### 9.1 Offline Operation

The mobile app supports offline-first operation with the following considerations:

#### Data Caching Strategy

```json
{
  "cached_endpoints": [
    "/parts",
    "/vehicles",
    "/customers",
    "/quotes"
  ],
  "cache_duration_seconds": {
    "parts": 3600,
    "customers": 7200,
    "vehicles": 7200,
    "quotes": 1800
  },
  "max_offline_size_mb": 500
}
```

#### Sync Mechanism

When offline:
- Queue all mutations (POST, PUT, PATCH, DELETE)
- Display cached data
- Show offline indicator to user

When online:
- Automatically sync queued requests
- Use exponential backoff for retries
- Resolve conflicts (last-write-wins)

### 9.2 Bandwidth Optimization

#### Image Compression

- Original images stored at full resolution
- Thumbnails generated at 200x200px for list views
- Medium images at 800x600px for detail views
- WebP format with fallback to JPEG

Request parameter for image size:

```
GET /parts/{id}?image_size=thumbnail|medium|full
```

#### Response Compression

- All responses gzip compressed
- Typical savings: 60-70% reduction
- Threshold: Compress if > 1KB

### 9.3 Push Notifications

#### Topics Supported

- `order_updates`: Order status changes
- `payment_confirmations`: Payment received
- `part_availability`: Requested part in stock
- `urgent_messages`: High-priority alerts

#### Registration Endpoint

**POST** `/mobile/push-tokens`

Request Body:
```json
{
  "token": "fcm_token_or_apns_token",
  "platform": "android|ios",
  "app_version": "1.0.0",
  "os_version": "14.0"
}
```

Response (201 Created):
```json
{
  "success": true,
  "data": {
    "token_id": "550e8400-e29b-41d4-a716-446655440012",
    "topics": ["order_updates", "payment_confirmations"]
  }
}
```

### 9.4 App Update Management

**GET** `/mobile/app-version`

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "current_version": "1.2.0",
    "minimum_required_version": "1.0.0",
    "latest_version": "1.3.0",
    "latest_release_notes": "Bug fixes and performance improvements",
    "update_available": true,
    "critical_update": false,
    "download_url": "https://play.google.com/store/apps/details?id=com.autoparts.mobile"
  }
}
```

---

## 10. Development & Testing Guidelines

### 10.1 API Documentation Format

The API follows OpenAPI 3.0 specification. Full OpenAPI definition available at:

```
https://api.autopartsplatform.com.au/openapi.json
```

### 10.2 SDK/Client Libraries

Official client libraries available:

- **JavaScript/TypeScript**: `@autoparts/sdk-js`
- **Python**: `autoparts-sdk`
- **PHP**: `autoparts/sdk-php`
- **Java**: `com.autoparts:sdk-java`

Installation (JavaScript):
```bash
npm install @autoparts/sdk-js
```

Usage:
```javascript
const AutoParts = require('@autoparts/sdk-js');

const client = new AutoParts.Client({
  accessToken: 'your_access_token',
  baseUrl: 'https://api.autopartsplatform.com.au/api/v1'
});

const parts = await client.parts.list();
```

### 10.3 Testing Environment

**Sandbox URL**: `https://sandbox.api.autopartsplatform.com.au/api/v1`

Sandbox features:
- Isolated database
- Free rate limits (no throttling)
- Stripe test keys
- Sample data pre-loaded

### 10.4 Test Data

Sample API credentials for testing:

```
Email: demo@example.com
Password: demo123456
Tenant: demo-wrecker
```

Pre-populated test data includes:
- 5 customers
- 10 vehicles
- 50 parts
- 5 quotes
- 3 orders

### 10.5 Postman Collection

Download Postman collection:

```
https://api.autopartsplatform.com.au/postman-collection.json
```

Import into Postman and configure:
- `base_url`: https://api.autopartsplatform.com.au/api/v1
- `access_token`: Your JWT token
- `tenant_id`: Your tenant ID

### 10.6 cURL Examples

Login:
```bash
curl -X POST https://api.autopartsplatform.com.au/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

List Parts:
```bash
curl -X GET 'https://api.autopartsplatform.com.au/api/v1/parts?page=1' \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Create Part:
```bash
curl -X POST https://api.autopartsplatform.com.au/api/v1/parts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "vehicle_id": "550e8400-e29b-41d4-a716-446655440004",
    "part_type": "Engine",
    "description": "2.4L Petrol Engine",
    "sell_price": 1850.00
  }'
```

---

## 11. Australian Compliance Requirements

### 11.1 Privacy Act 1988 Compliance

The API handles personal information in accordance with the Privacy Act 1988 (Cth).

#### Personal Data Endpoints

**Get Customer Personal Data**
**GET** `/customers/{id}/export-data`

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "export_date": "2025-10-23T10:30:00Z",
    "customer": {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "first_name": "John",
      "last_name": "Smith",
      "email": "john@smithsrepairs.com.au",
      "phone": "0212345678",
      "address": {
        "street": "123 Main Street",
        "suburb": "Richmond",
        "state": "VIC",
        "postcode": "3121"
      }
    },
    "orders": [],
    "quotes": [],
    "communications": []
  }
}
```

**Delete Customer Data**
**DELETE** `/customers/{id}/delete-data`

Request Body:
```json
{
  "confirmation_code": "CONFIRM_DELETE_12345",
  "reason": "Customer requested deletion"
}
```

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Customer data anonymized as per Privacy Act",
    "anonymization_date": "2025-10-23T10:30:00Z"
  }
}
```

#### Data Retention Policy

- **Customer Data**: 7 years (tax requirements)
- **Audit Logs**: 7 years (legal requirements)
- **Marketing Data**: Until consent withdrawn
- **Deleted Data**: Immediately anonymized, but financial records retained for 7 years

### 11.2 Australian Consumer Law (ACL) Compliance

#### Warranty Management

All parts sold include warranty information as required by ACL:

```json
{
  "warranty_months": 6,
  "warranty_expiry_date": "2026-04-23",
  "warranty_includes": "Manufacturing defects",
  "acl_statutory_guarantee": true,
  "acl_guarantee_text": "This product comes with guarantees that cannot be excluded under the Australian Consumer Law..."
}
```

**Create Warranty Claim**
**POST** `/order-items/{id}/warranty-claim`

Request Body:
```json
{
  "claim_reason": "manufacturing_defect",
  "description": "Engine knocking noise not present on delivery",
  "photos": ["url_1", "url_2"],
  "requested_remedy": "replacement"
}
```

Response (201 Created):
```json
{
  "success": true,
  "data": {
    "claim_id": "550e8400-e29b-41d4-a716-446655440013",
    "status": "received",
    "acl_compliant": true,
    "max_response_days": 14
  }
}
```

#### Returns & Refunds

**POST** `/orders/{id}/return-request`

Request Body:
```json
{
  "reason": "faulty_item",
  "items": ["550e8400-e29b-41d4-a716-446655440005"],
  "description": "Part not functioning as described"
}
```

Response (201 Created):
```json
{
  "success": true,
  "data": {
    "return_id": "RET-2025-001",
    "items_eligible_for_return": 1,
    "acl_compliance_status": "eligible_for_refund",
    "estimated_refund_timeframe_days": 14
  }
}
```

### 11.3 GST Compliance

All prices in the API include GST calculations as required by Australian tax law.

#### GST Calculation

Every quote and order automatically calculates 10% GST:

```json
{
  "subtotal_ex_gst": 1935.00,
  "gst_10_percent": 193.50,
  "total_inc_gst": 2128.50
}
```

#### Tax Invoice Requirements

Tax invoices generated for all orders include:
- ABN of supplier
- GST amount broken down
- Invoice number and date
- Customer details
- Itemized list of parts

**GET** `/orders/{id}/invoice` - Returns tax-compliant PDF invoice

#### BAS Reporting

**GET** `/tax/bas-report`

Query Parameters:
- `quarter`: Q1/Q2/Q3/Q4
- `year`: 2025, etc.

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "quarter": "Q4",
    "year": 2025,
    "total_gst_collected": 24500.00,
    "total_gst_paid": 8250.00,
    "net_gst_payable": 16250.00,
    "export_formats": {
      "csv": "https://cdn.autopartsplatform.com.au/reports/bas_q4_2025.csv",
      "xero_import": "https://cdn.autopartsplatform.com.au/reports/bas_q4_2025_xero.csv"
    }
  }
}
```

### 11.4 ABN Validation

All business customers must have validated ABN:

**POST** `/customers/validate-abn`

Request Body:
```json
{
  "abn": "12345678901"
}
```

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "abn": "12345678901",
    "is_valid": true,
    "business_name": "Smith's Repairs Pty Ltd",
    "entity_type": "Private Company",
    "gst_registered": true,
    "acn": "123456789"
  }
}
```

### 11.5 Subscription Tier Differentiation in API

API responses differ based on subscription tier:

#### Feature Availability Header

```
X-Subscription-Tier: pro
X-Feature-Access: {
  "advanced_reports": true,
  "accounting_integration": true,
  "priority_support": false,
  "custom_branding": false
}
```

#### Tier-Limited Feature Response (403)

```json
{
  "success": false,
  "error": {
    "code": "FEATURE_NOT_AVAILABLE",
    "message": "Advanced reports available in Pro tier and above",
    "current_tier": "basic",
    "upgrade_to": "pro",
    "pricing": "https://autopartsplatform.com.au/pricing"
  }
}
```

---

## Conclusion

This API documentation provides comprehensive guidance for integrating with the Australian Auto Parts Sales Platform. All endpoints follow RESTful principles, include detailed examples, and comply with Australian regulatory requirements including Privacy Act 1988, Australian Consumer Law, and GST regulations.

For additional support:
- **API Support**: api-support@autopartsplatform.com.au
- **Developer Forum**: https://developers.autopartsplatform.com.au
- **Status Page**: https://status.autopartsplatform.com.au
- **Change Log**: https://api.autopartsplatform.com.au/changelog

---

**Document Version**: 1.0  
**Last Updated**: October 23, 2025  
**API Version**: v1  
**Status**: Production Ready