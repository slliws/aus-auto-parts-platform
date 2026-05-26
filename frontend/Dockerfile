# Frontend Dockerfile — Production-ready Vite React build served by Nginx
# Multi-stage build for small, efficient runtime image

# 1) Builder stage
FROM node:20 AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN rm package-lock.json && npm install

# Copy source
COPY tsconfig.json ./
COPY tsconfig.app.json ./
COPY tsconfig.node.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY src ./src

# Type-check + build (0 TS errors as of 2026-05-26)
RUN npx tsc --skipLibCheck --noEmit && npx vite build

# 2) Nginx runtime stage
FROM nginx:1.27-alpine AS runner

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port (fronted by load balancer / reverse proxy in production)
EXPOSE 80

# Nginx is started by the base image CMD
