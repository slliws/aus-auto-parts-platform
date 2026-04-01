# Australian Auto Parts Platform - Backend API

Multi-tenant B2B e-commerce platform backend built with Node.js, Express, TypeScript, PostgreSQL, and Redis.

## 🚀 Quick Start

### Prerequisites

- Node.js v18 LTS or higher
- PostgreSQL 15+
- Redis 6+
- npm or yarn

### Installation

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
# Set required variables: JWT_SECRET, DB_PASSWORD, etc.
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Run production build
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── index.ts      # Main config
│   │   ├── database.ts   # PostgreSQL connection
│   │   └── redis.ts      # Redis connection
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts       # Authentication
│   │   ├── errorHandler.ts
│   │   ├── rateLimiter.ts
│   │   ├── tenantContext.ts
│   │   └── validator.ts
│   ├── routes/           # API routes
│   │   ├── auth.routes.ts
│   │   ├── users.routes.ts
│   │   ├── tenants.routes.ts
│   │   └── index.ts
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── models/           # Database models (TODO)
│   ├── types/            # TypeScript types
│   ├── utils/            # Utilities
│   │   ├── logger.ts
│   │   ├── errors.ts
│   │   └── validators.ts
│   ├── app.ts            # Express app setup
│   └── server.ts         # Server entry point
├── tests/                # Test files (TODO)
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## 🔑 Environment Variables

See [`.env.example`](src/.env.example:1) for all required environment variables.

**Critical Variables:**
- `JWT_SECRET` - Secret key for JWT token signing
- `DB_PASSWORD` - PostgreSQL database password
- `REDIS_PASSWORD` - Redis password (if enabled)

## 🛠️ Tech Stack

- **Runtime:** Node.js v18 LTS
- **Framework:** Express.js 4.18+
- **Language:** TypeScript 5+
- **Database:** PostgreSQL 15+
- **Cache:** Redis 6+
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** Joi
- **Logging:** Winston
- **Security:** Helmet, CORS, bcrypt
- **Rate Limiting:** express-rate-limit

## 🏗️ Architecture

### Multi-Tenancy
- Row-level tenant isolation
- Tenant context middleware
- Subscription-based rate limiting

### Authentication
- JWT-based authentication
- Access tokens (1h expiry)
- Refresh tokens (30d expiry)
- Role-based authorization

### Rate Limiting
- **Basic Tier:** 1,000 requests/hour
- **Pro Tier:** 10,000 requests/hour
- **Enterprise Tier:** 100,000 requests/hour

### API Structure
All endpoints are prefixed with `/api/v1`

## 📡 API Endpoints

### Health Check
- `GET /api/v1/health` - API health status
- `GET /api/v1/version` - API version info

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `GET /api/v1/auth/me` - Get current user

### Users (Protected)
- `GET /api/v1/users` - List users in tenant
- `GET /api/v1/users/:id` - Get user by ID
- `POST /api/v1/users` - Create user
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user
- `PATCH /api/v1/users/:id/role` - Update user role

### Tenants (Protected)
- `POST /api/v1/tenants` - Register new tenant
- `GET /api/v1/tenants/:id` - Get tenant details
- `PUT /api/v1/tenants/:id` - Update tenant
- `GET /api/v1/tenants/:id/subscription` - Get subscription
- `PATCH /api/v1/tenants/:id/subscription` - Update subscription

## 🔒 Security Features

- Helmet for HTTP headers security
- CORS with configurable origins
- Rate limiting per subscription tier
- JWT token authentication
- Bcrypt password hashing (12 rounds)
- Input validation with Joi
- SQL injection protection (parameterized queries)
- XSS protection

## 📊 Logging

Winston logger with multiple transports:
- Console (development)
- File rotation (production)
- Configurable log levels
- Request/response logging

## 🧪 Testing (TODO)

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 🚢 Deployment

### Build for Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

### Docker (TODO)
Docker configuration to be added in deployment phase.

### Environment-Specific Configuration

The application uses different configurations based on `NODE_ENV`:
- `development` - Verbose logging, no database SSL
- `production` - File logging, database SSL, optimized settings
- `test` - Test-specific configuration

## 📝 Development Guidelines

### Code Style
- Follow TypeScript strict mode
- Use ESLint for linting
- Use Prettier for formatting
- Add JSDoc comments for exported functions

### Git Workflow
1. Create feature branch from `develop`
2. Make changes with descriptive commits
3. Run linting and tests
4. Submit pull request

### API Design
- RESTful conventions
- JSON request/response
- Consistent error responses
- Pagination for list endpoints
- Versioned API (`/api/v1`)

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
psql -h localhost -U postgres

# Verify connection string in .env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=auto_parts_platform
```

### Redis Connection Issues
```bash
# Check Redis is running
redis-cli ping

# Should return PONG
```

### Port Already in Use
```bash
# Change PORT in .env
PORT=3001
```

## 📅 Development Roadmap

### Phase 1: Foundation (Current)
- ✅ Project structure
- ✅ Configuration management
- ✅ Middleware setup
- ✅ Route structure
- ⏳ Database models
- ⏳ Authentication implementation

### Phase 2: Core Features
- ⏳ User management
- ⏳ Tenant management
- ⏳ Product catalog
- ⏳ Order management

### Phase 3: Advanced Features
- ⏳ Inventory management
- ⏳ Reporting
- ⏳ Analytics
- ⏳ Email notifications

### Phase 4: Production
- ⏳ Performance optimization
- ⏳ Security hardening
- ⏳ Deployment automation
- ⏳ Monitoring and logging

## 🤝 Contributing

1. Follow the code style guidelines
2. Write tests for new features
3. Update documentation
4. Create detailed pull requests

## 📄 License

UNLICENSED - Proprietary software

## 📞 Support

For technical support and questions, please contact the development team.

---

**Built with ❤️ for the Australian Auto Parts Industry**