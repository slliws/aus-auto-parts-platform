# Docker Deployment Guide

## Overview

This guide covers full-stack deployment of the Australian Auto Parts Platform using Docker and Docker Compose. The platform consists of a React frontend, Node.js/Express backend, PostgreSQL database, and Redis cache.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 4GB RAM available
- Ports 3000, 5173, 5432, 6379, 8080 available

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   PostgreSQL    │
│   (React +      │◄──►│   (Node.js +    │◄──►│   (Database)    │
│    Nginx)       │    │    Express)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│     Redis       │◄─────────────┘
                        │   (Cache +      │
                        │   Sessions)     │
                        └─────────────────┘
```

## Quick Start

### 1. Production Deployment

```bash
# Clone the repository
git clone <repository-url>
cd aus-auto-parts-platform

# Configure production environment
cp .env.production .env
# Edit .env with your production values

# Deploy full stack
docker-compose -f docker-compose.prod.yml up -d

# Check service health
docker-compose -f docker-compose.prod.yml ps
```

### 2. Development Deployment

```bash
# Deploy development environment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Environment Configuration

### Production Environment (.env.production)

Key variables to configure before deployment:

```env
# CRITICAL: Change these secrets in production!
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-characters
SESSION_SECRET=your-session-secret-minimum-32-characters

# Database
POSTGRES_PASSWORD=your-secure-database-password

# Redis
REDIS_PASSWORD=your-secure-redis-password

# CORS - Add your production domains
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Email Configuration
SMTP_HOST=your-smtp-server.com
SMTP_USER=your-email@yourdomain.com
SMTP_PASSWORD=your-email-password

# AWS (if using S3)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET=your-s3-bucket-name
```

## Service Configuration

### Backend Service
- **Port**: 3000
- **Health Check**: `/api/v1/health`
- **Environment**: Production/Development
- **Build**: Multi-stage Node.js 20 Alpine
- **Features**: 
  - TypeScript compilation
  - Prisma client generation
  - Health monitoring
  - Graceful shutdown

### Frontend Service
- **Port**: 5173 (dev) / 8080 (prod)
- **Build**: Multi-stage React + Vite + Nginx
- **Features**:
  - Static asset optimization
  - Gzip compression
  - Security headers
  - API proxy configuration
  - SPA routing support

### PostgreSQL Service
- **Port**: 5432
- **Image**: postgres:16-alpine
- **Features**:
  - Health checks
  - Data persistence
  - Automatic backups (configure externally)
  - Connection pooling

### Redis Service
- **Port**: 6379
- **Image**: redis:7-alpine
- **Features**:
  - Health checks
  - Data persistence
  - Session storage
  - Cache management

## Health Monitoring

All services include health checks:

```bash
# Check all services
docker-compose -f docker-compose.prod.yml ps

# Check specific service health
docker-compose -f docker-compose.prod.yml exec backend curl -f http://localhost:3000/api/v1/health
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U postgres
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping

# View service logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

## Data Persistence

### Volumes
- `postgres_data`: PostgreSQL database files
- `redis_data`: Redis persistence files

### Backup Strategy
```bash
# Backup PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres auto_parts_platform > backup.sql

# Restore PostgreSQL
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres auto_parts_platform < backup.sql

# Backup Redis
docker-compose -f docker-compose.prod.yml exec redis redis-cli BGSAVE
docker cp aus-auto-parts-redis:/data/dump.rdb ./redis-backup.rdb
```

## Network Configuration

Services communicate via internal Docker network:
- Frontend → Backend: `http://backend:3000/api/v1`
- Backend → PostgreSQL: `postgres:5432`
- Backend → Redis: `redis:6379`

## Security Features

### Backend Security
- Helmet.js security headers
- CORS configuration
- Rate limiting
- JWT authentication
- Input validation
- SQL injection protection (Prisma ORM)

### Frontend Security
- Content Security Policy headers
- XSS protection
- Secure cookie handling
- HTTPS enforcement (configure in production)

### Database Security
- Connection encryption (SSL)
- User permissions
- Query parameterization
- Regular security updates

## Performance Optimization

### Backend Optimization
- Connection pooling
- Redis caching
- Gzip compression
- Request logging
- Graceful error handling

### Frontend Optimization
- Static asset caching
- Code splitting
- Image optimization
- Bundle size optimization
- CDN integration (configure externally)

### Database Optimization
- Connection pooling
- Query optimization
- Index management
- Regular maintenance

## Monitoring & Logging

### Application Logs
```bash
# View real-time logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend

# Export logs
docker-compose -f docker-compose.prod.yml logs --no-color > application.log
```

### Health Monitoring
- Service health endpoints
- Database connectivity checks
- Redis availability monitoring
- Resource usage monitoring

## Troubleshooting

### Common Issues

#### 1. Container Won't Start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs service-name

# Check resource usage
docker stats

# Restart specific service
docker-compose -f docker-compose.prod.yml restart service-name
```

#### 2. Database Connection Issues
```bash
# Check PostgreSQL status
docker-compose -f docker-compose.prod.yml exec postgres pg_isready

# Check connection string
docker-compose -f docker-compose.prod.yml exec backend env | grep DATABASE_URL
```

#### 3. Frontend Can't Reach Backend
```bash
# Check network connectivity
docker-compose -f docker-compose.prod.yml exec frontend curl -f http://backend:3000/api/v1/health

# Check CORS configuration
docker-compose -f docker-compose.prod.yml exec backend env | grep ALLOWED_ORIGINS
```

#### 4. Redis Connection Issues
```bash
# Check Redis status
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping

# Check Redis configuration
docker-compose -f docker-compose.prod.yml exec backend env | grep REDIS
```

### Performance Issues
```bash
# Check resource usage
docker stats --no-stream

# Check disk usage
docker system df

# Clean up unused resources
docker system prune
```

## Scaling

### Horizontal Scaling
```bash
# Scale backend instances
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Scale with load balancer (configure externally)
# Use nginx, HAProxy, or cloud load balancer
```

### Database Scaling
- Read replicas (configure externally)
- Connection pooling optimization
- Query optimization
- Index management

## Maintenance

### Regular Tasks
1. **Security Updates**
   ```bash
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Database Maintenance**
   ```bash
   # Run migrations
   docker-compose -f docker-compose.prod.yml exec backend npm run db:migrate:deploy
   
   # Backup database
   # (Configure automated backups)
   ```

3. **Log Rotation**
   ```bash
   # Configure log rotation in docker-compose.prod.yml
   # Use external logging solutions (ELK, Splunk)
   ```

## Deployment Checklist

### Pre-deployment
- [ ] Update all secrets and passwords
- [ ] Configure production domain(s)
- [ ] Set up SSL certificates
- [ ] Configure monitoring
- [ ] Test database migrations
- [ ] Verify environment variables
- [ ] Check resource requirements

### Post-deployment
- [ ] Verify all services are healthy
- [ ] Test API endpoints
- [ ] Check frontend functionality
- [ ] Verify database connectivity
- [ ] Test Redis functionality
- [ ] Monitor error logs
- [ ] Set up backup schedule

## Support

For issues or questions:
1. Check logs: `docker-compose -f docker-compose.prod.yml logs`
2. Review this documentation
3. Check service health endpoints
4. Verify environment configuration

## Production Considerations

### High Availability
- Deploy across multiple instances
- Use load balancers
- Implement health checks
- Configure auto-scaling

### Security
- Use secrets management
- Implement SSL/TLS
- Regular security updates
- Network security

### Backup & Recovery
- Automated database backups
- Point-in-time recovery
- Disaster recovery plan
- Regular testing

### Monitoring
- Application performance monitoring
- Infrastructure monitoring
- Log aggregation
- Alerting setup