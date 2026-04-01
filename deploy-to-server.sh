#!/bin/bash
###############################################################################
# deploy-to-server.sh
# Automated deployment script for aus-auto-parts-platform on Linux server
# 
# This script:
# - Checks and installs Docker and Docker Compose
# - Sets up the project directory structure
# - Configures environment variables
# - Builds and starts Docker containers
# - Displays access URLs
#
# Usage: ./deploy-to-server.sh
###############################################################################

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/opt/aus-auto-parts-platform"
SERVER_IP="192.168.1.110"
BACKEND_PORT=3000
FRONTEND_PORT=8080

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo -e "${BLUE}================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

###############################################################################
# Check if running as root
###############################################################################

check_root() {
    if [ "$EUID" -ne 0 ]; then 
        print_error "This script must be run as root (or with sudo)"
        exit 1
    fi
    print_success "Running with root privileges"
}

###############################################################################
# Check and Install Docker
###############################################################################

check_docker() {
    print_header "Checking Docker Installation"
    
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        print_success "Docker is already installed: $DOCKER_VERSION"
        return 0
    else
        print_warning "Docker is not installed. Installing now..."
        install_docker
    fi
}

install_docker() {
    print_info "Installing Docker for Debian/Ubuntu..."
    
    # Update package index
    apt-get update -y
    
    # Install prerequisites
    apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    
    # Set up the repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    print_success "Docker installed successfully"
    docker --version
}

###############################################################################
# Check and Install Docker Compose
###############################################################################

check_docker_compose() {
    print_header "Checking Docker Compose Installation"
    
    if docker compose version &> /dev/null; then
        COMPOSE_VERSION=$(docker compose version)
        print_success "Docker Compose is already installed: $COMPOSE_VERSION"
        return 0
    elif command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version)
        print_success "Docker Compose (standalone) is installed: $COMPOSE_VERSION"
        return 0
    else
        print_warning "Docker Compose is not installed. Installing now..."
        install_docker_compose
    fi
}

install_docker_compose() {
    print_info "Installing Docker Compose..."
    
    # Docker Compose should be installed with docker-compose-plugin
    apt-get update -y
    apt-get install -y docker-compose-plugin
    
    print_success "Docker Compose installed successfully"
    docker compose version
}

###############################################################################
# Setup Project Directory
###############################################################################

setup_project_directory() {
    print_header "Setting Up Project Directory"
    
    if [ -d "$PROJECT_DIR" ]; then
        print_warning "Project directory already exists. Backing up..."
        BACKUP_DIR="${PROJECT_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
        mv "$PROJECT_DIR" "$BACKUP_DIR"
        print_success "Backup created at: $BACKUP_DIR"
    fi
    
    mkdir -p "$PROJECT_DIR"
    print_success "Project directory created: $PROJECT_DIR"
}

###############################################################################
# Setup Environment Files
###############################################################################

setup_environment_files() {
    print_header "Setting Up Environment Files"
    
    # Create backend .env file
    if [ ! -f "$PROJECT_DIR/backend/.env" ]; then
        print_info "Creating backend .env file..."
        mkdir -p "$PROJECT_DIR/backend"
        
        cat > "$PROJECT_DIR/backend/.env" <<EOF
# Application Environment
NODE_ENV=production
PORT=3000

# Database Configuration (Docker service name)
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/auto_parts_platform?schema=public"

# Legacy Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=auto_parts_platform
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT_MS=30000
DB_CONNECTION_TIMEOUT_MS=2000

# Redis Configuration (Docker service name)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TLS=false

# JWT Configuration - CHANGE THESE IN PRODUCTION!
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_ACCESS_EXPIRY=1h
JWT_REFRESH_EXPIRY=30d
JWT_EMAIL_VERIFICATION_EXPIRY=24h
JWT_PASSWORD_RESET_EXPIRY=1h
JWT_ISSUER=aus-auto-parts-platform

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_BASIC=1000
RATE_LIMIT_MAX_PRO=10000
RATE_LIMIT_MAX_ENTERPRISE=100000

# CORS Configuration
ALLOWED_ORIGINS=http://${SERVER_IP}:${FRONTEND_PORT},http://localhost:${FRONTEND_PORT}
CORS_CREDENTIALS=true

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE_PATH=logs/app.log
LOG_ERROR_FILE_PATH=logs/error.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=14d

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=$(openssl rand -base64 32)

# API Configuration
API_PREFIX=/api/v1
API_TIMEOUT=30000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/

# Email (configure as needed)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=noreply@aus-auto-parts.com

# AWS Configuration (configure as needed)
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET=

# Monitoring (configure as needed)
SENTRY_DSN=
NEW_RELIC_LICENSE_KEY=
EOF
        print_success "Backend .env file created with secure random secrets"
    else
        print_warning "Backend .env file already exists, skipping..."
    fi
    
    # Create root .env file for docker-compose
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        print_info "Creating root .env file for Docker Compose..."
        
        cat > "$PROJECT_DIR/.env" <<EOF
# Docker Compose Environment Configuration
BACKEND_PORT=${BACKEND_PORT}
FRONTEND_PORT=${FRONTEND_PORT}

# PostgreSQL Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=auto_parts_platform

# API URL for frontend (using server IP)
VITE_API_URL=http://${SERVER_IP}:${BACKEND_PORT}/api/v1
EOF
        print_success "Root .env file created"
    else
        print_warning "Root .env file already exists, skipping..."
    fi
}

###############################################################################
# Build and Start Containers
###############################################################################

build_and_start_containers() {
    print_header "Building and Starting Docker Containers"
    
    cd "$PROJECT_DIR"
    
    print_info "Stopping any existing containers..."
    docker compose -f docker-compose.prod.yml down 2>/dev/null || true
    
    print_info "Building Docker images (this may take several minutes)..."
    docker compose -f docker-compose.prod.yml build --no-cache
    
    print_info "Starting containers..."
    docker compose -f docker-compose.prod.yml up -d
    
    print_success "Containers started successfully"
}

###############################################################################
# Wait for Services to be Ready
###############################################################################

wait_for_services() {
    print_header "Waiting for Services to Start"
    
    print_info "Waiting for PostgreSQL to be ready..."
    timeout=60
    counter=0
    while ! docker exec aus-auto-parts-postgres pg_isready -U postgres &>/dev/null; do
        sleep 2
        counter=$((counter + 2))
        if [ $counter -ge $timeout ]; then
            print_error "PostgreSQL failed to start within ${timeout}s"
            exit 1
        fi
    done
    print_success "PostgreSQL is ready"
    
    print_info "Waiting for Redis to be ready..."
    counter=0
    while ! docker exec aus-auto-parts-redis redis-cli ping &>/dev/null; do
        sleep 2
        counter=$((counter + 2))
        if [ $counter -ge $timeout ]; then
            print_error "Redis failed to start within ${timeout}s"
            exit 1
        fi
    done
    print_success "Redis is ready"
    
    print_info "Waiting for backend to be ready..."
    counter=0
    while ! curl -f http://localhost:${BACKEND_PORT}/api/v1/health &>/dev/null; do
        sleep 2
        counter=$((counter + 2))
        if [ $counter -ge $timeout ]; then
            print_error "Backend failed to start within ${timeout}s"
            print_info "Check logs with: docker logs aus-auto-parts-backend"
            exit 1
        fi
    done
    print_success "Backend is ready"
    
    print_info "Waiting for frontend to be ready..."
    counter=0
    while ! curl -f http://localhost:${FRONTEND_PORT} &>/dev/null; do
        sleep 2
        counter=$((counter + 2))
        if [ $counter -ge $timeout ]; then
            print_error "Frontend failed to start within ${timeout}s"
            print_info "Check logs with: docker logs aus-auto-parts-frontend"
            exit 1
        fi
    done
    print_success "Frontend is ready"
}

###############################################################################
# Display Access Information
###############################################################################

display_access_info() {
    print_header "Deployment Complete!"
    
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           AUS AUTO PARTS PLATFORM - DEPLOYED                   ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}Frontend GUI:${NC}"
    echo -e "  ${GREEN}http://${SERVER_IP}:${FRONTEND_PORT}${NC}"
    echo ""
    echo -e "${BLUE}Backend API:${NC}"
    echo -e "  ${GREEN}http://${SERVER_IP}:${BACKEND_PORT}${NC}"
    echo -e "  Health Check: ${GREEN}http://${SERVER_IP}:${BACKEND_PORT}/api/v1/health${NC}"
    echo ""
    echo -e "${BLUE}Container Status:${NC}"
    docker compose -f "$PROJECT_DIR/docker-compose.prod.yml" ps
    echo ""
    echo -e "${YELLOW}Management Commands:${NC}"
    echo -e "  View logs:        ${BLUE}docker logs -f [container-name]${NC}"
    echo -e "  Stop services:    ${BLUE}cd $PROJECT_DIR && docker compose -f docker-compose.prod.yml down${NC}"
    echo -e "  Start services:   ${BLUE}cd $PROJECT_DIR && docker compose -f docker-compose.prod.yml up -d${NC}"
    echo -e "  Restart services: ${BLUE}cd $PROJECT_DIR && docker compose -f docker-compose.prod.yml restart${NC}"
    echo ""
    echo -e "${GREEN}Deployment completed successfully!${NC}"
    echo ""
}

###############################################################################
# Main Execution
###############################################################################

main() {
    print_header "AUS AUTO PARTS PLATFORM - DEPLOYMENT SCRIPT"
    echo ""
    
    check_root
    check_docker
    check_docker_compose
    setup_project_directory
    
    # Note: Files should be copied before running this script
    # This script assumes the project files are already in $PROJECT_DIR
    
    setup_environment_files
    build_and_start_containers
    wait_for_services
    display_access_info
}

# Run main function
main