# CI/CD and Deployment Guide

This document defines the concrete, minimal CI/CD and deployment approach required to expose:

- Web GUI: https://app.example.com
- API: https://api.example.com

over the internet using the existing Dockerized setup and the AWS-based architecture described in [`CLOUD_INFRASTRUCTURE_PLAN.md`](CLOUD_INFRASTRUCTURE_PLAN.md:1).

It is intentionally provider-focused on AWS resources (ECR, ECS Fargate, RDS, ElastiCache, ALB, Route 53, ACM, S3, CloudWatch) but avoids locking into a specific CI provider implementation other than referencing GitHub Actions conceptually (no YAML here).

The application is already containerized via:

- Backend: [`backend/Dockerfile`](backend/Dockerfile:1)
- Frontend: [`frontend/Dockerfile`](frontend/Dockerfile:1)
- Orchestration reference: [`docker-compose.prod.yml`](docker-compose.prod.yml:1)

All steps below are sufficient for an engineer to:

- Build and push Docker images.
- Stand up ECS/RDS/ElastiCache/ALB/Route 53/ACM.
- Achieve working HTTPS endpoints for `app.example.com` and `api.example.com` wired to the existing containers.

---

## 1. Container Registry and Image Strategy

### 1.1. Amazon ECR Repositories

Create the following ECR repositories in the target AWS account and region (e.g. `ap-southeast-2`):

- `aus-auto-parts-frontend`
- `aus-auto-parts-backend`

These repositories will hold all images for:

- Production (main branch + tagged releases)
- Staging (develop branch)
- Feature branches

Example ECR URIs (replace with your AWS account ID and region):

- `ACCOUNT_ID.dkr.ecr.ap-southeast-2.amazonaws.com/aus-auto-parts-frontend`
- `ACCOUNT_ID.dkr.ecr.ap-southeast-2.amazonaws.com/aus-auto-parts-backend`

### 1.2. Image Tagging Convention

Use consistent, deterministic tags:

- `main` branch (production):
  - `prod-<git-sha>`
  - Optionally also `prod-latest` for convenience.
- `develop` branch (staging):
  - `staging-<git-sha>`
  - Optionally also `staging-latest`.
- Feature branches:
  - `feature-<sanitized-branch-name>-<git-sha>`

Examples:

- Frontend:
  - `.../aus-auto-parts-frontend:prod-a1b2c3d4`
  - `.../aus-auto-parts-frontend:staging-a1b2c3d4`
  - `.../aus-auto-parts-frontend:feature-search-ui-a1b2c3d4`
- Backend:
  - `.../aus-auto-parts-backend:prod-a1b2c3d4`
  - `.../aus-auto-parts-backend:staging-a1b2c3d4`
  - `.../aus-auto-parts-backend:feature-search-api-a1b2c3d4`

Definition of `git-sha`:

- Short (7–12 chars) commit SHA from Git.
- Chosen by the CI pipeline at build time.

### 1.3. How ECS Services Use Image Tags

Use immutable, SHA-based tags in ECS task definitions. For each deployment:

1. CI builds images for the current commit.
2. CI pushes:
   - `aus-auto-parts-frontend:<channel>-<git-sha>`
   - `aus-auto-parts-backend:<channel>-<git-sha>`
3. CI updates the ECS service or task definition to reference those exact tags:
   - Production ECS services:
     - `image: .../aus-auto-parts-frontend:prod-<git-sha>`
     - `image: .../aus-auto-parts-backend:prod-<git-sha>`
   - Staging ECS services:
     - `image: .../aus-auto-parts-frontend:staging-<git-sha>`
     - `image: .../aus-auto-parts-backend:staging-<git-sha>`

Never use `latest` in ECS task definitions. Always deploy by immutable tag for traceability and rollback.

---

## 2. CI/CD Pipeline Definitions (GitHub Actions Orchestration)

Note: This section describes the GitHub Actions workflows conceptually. Do NOT create `.github/workflows` files here; this is implementation guidance only.

### 2.1. Authentication: GitHub OIDC + AWS IAM

Use GitHub OIDC to assume an AWS IAM role without storing long-lived AWS keys.

1. Create an IAM role `GitHubActionsDeploymentRole` with:
   - Trust policy allowing GitHub OIDC provider and your repo (`repo:owner/name`) to assume it.
   - Conditions scoping to specific branches and tags (e.g. `ref:refs/heads/main`, `ref:refs/heads/develop`, `ref:refs/tags/*`).
2. Attach policies to allow:
   - ECR:
     - `ecr:GetAuthorizationToken`
     - `ecr:BatchCheckLayerAvailability`
     - `ecr:CompleteLayerUpload`
     - `ecr:UploadLayerPart`
     - `ecr:InitiateLayerUpload`
     - `ecr:PutImage`
     - `ecr:DescribeRepositories`
   - ECS:
     - `ecs:DescribeClusters`
     - `ecs:DescribeServices`
     - `ecs:DescribeTaskDefinition`
     - `ecs:RegisterTaskDefinition`
     - `ecs:UpdateService`
   - IAM (scoped):
     - `iam:PassRole` for ECS task execution and task role ARNs used in task definitions.
   - CloudWatch Logs (if needed for log group creation, typically via infra code):
     - `logs:CreateLogGroup`
     - `logs:CreateLogStream`
     - `logs:PutLogEvents`
   - (Optional, if CI updates SSM/Secrets Manager references or tags):
     - `ssm:GetParameter`
     - `secretsmanager:GetSecretValue`

The workflow then:

- Uses `aws-actions/configure-aws-credentials` with the OIDC role to gain temporary credentials.
- Logs into ECR with `aws ecr get-login-password | docker login ...`.

### 2.2. Common Build and Push Steps (All Pipelines)

Conceptual steps:

1. Checkout repo.
2. Configure AWS credentials via OIDC.
3. Log in to ECR.
4. Determine:
   - `GIT_SHA`
   - `CHANNEL` (prod/staging/feature).
   - Target ECR repos and tags.
5. Build images using existing Dockerfiles:
   - Frontend: build from [`frontend/Dockerfile`](frontend/Dockerfile:1)
   - Backend: build from [`backend/Dockerfile`](backend/Dockerfile:1)
6. Tag images according to conventions.
7. Push images to ECR.

Commands (example, to be embedded in YAML by an engineer):

- Frontend:
  - `docker build -t $FRONTEND_ECR_REPO:$TAG -f frontend/Dockerfile .`
  - `docker push $FRONTEND_ECR_REPO:$TAG`
- Backend:
  - `docker build -t $BACKEND_ECR_REPO:$TAG -f backend/Dockerfile .`
  - `docker push $BACKEND_ECR_REPO:$TAG`

### 2.3. On Push to main (Production)

Trigger: `on: push` to `refs/heads/main`.

High-level workflow:

1. Detect `branch == main`.
2. Set:
   - `CHANNEL=prod`
   - `IMAGE_TAG=prod-<git-sha>`
3. Perform steps from 2.2 to build and push:
   - `aus-auto-parts-frontend:prod-<git-sha>`
   - `aus-auto-parts-backend:prod-<git-sha>`
4. Deployment to ECS:
   - Fetch current ECS task definitions for:
     - `aus-auto-parts-frontend-prod`
     - `aus-auto-parts-backend-prod`
   - Create new task definition revisions:
     - Replace container `image` fields with new tags.
     - Keep environment, IAM roles, CPU/memory, networking as defined by infra.
   - Call `ecs:update-service` for each prod service:
     - `--cluster aus-auto-parts-prod`
     - `--service aus-auto-parts-frontend-prod`
     - `--force-new-deployment`
     - `--cluster aus-auto-parts-prod`
     - `--service aus-auto-parts-backend-prod`
     - `--force-new-deployment`
5. ECS Fargate performs rolling deployment behind the ALB.
6. CloudWatch Logs and ALB health checks confirm success.

Required AWS permissions (added to OIDC role):

- `ecs:RegisterTaskDefinition`
- `ecs:UpdateService`
- `ecs:DescribeTaskDefinition`
- `ecs:DescribeServices`
- `ecs:DescribeClusters`
- `iam:PassRole` for ECS task and execution roles.

### 2.4. On Push to develop (Staging)

Trigger: `on: push` to `refs/heads/develop`.

High-level workflow:

1. Detect `branch == develop`.
2. Set:
   - `CHANNEL=staging`
   - `IMAGE_TAG=staging-<git-sha>`
3. Build and push staging images.
4. Update staging ECS services:
   - `aus-auto-parts-frontend-staging`
   - `aus-auto-parts-backend-staging`
   - Same pattern as production, but:
     - `--cluster aus-auto-parts-staging`
     - `--service aus-auto-parts-frontend-staging`
     - `--service aus-auto-parts-backend-staging`
5. ECS Fargate handles rolling updates on the staging ALB or shared ALB.

Permissions: same as main, but scope resources to staging clusters/services where possible.

### 2.5. On Tagged Releases (Versioned Prod Deployments)

Trigger: `on: push` with `tags: ["v*.*.*"]` (e.g. `v1.0.0`).

High-level workflow:

1. Detect semver tag (e.g. `v1.0.0`).
2. Build images and push:
   - `:prod-<git-sha>`
   - `:<version>` (e.g. `:v1.0.0`)
3. Update production ECS task definitions to use `:prod-<git-sha>` or `:<version>`:
   - Recommended: continue to use `prod-<git-sha>` in ECS; use `<version>` as an additional immutable reference.
4. Trigger `ecs:update-service` on prod services as in 2.3.

This allows:

- Clear mapping of releases to running tasks.
- Simple rollback by redeploying previous task definition or tag.

---

## 3. Domain and SSL Integration Procedure

This section defines the exact steps to expose:

- `app.example.com` → Frontend ECS service
- `api.example.com` → Backend ECS service

using Route 53, ACM, and an internet-facing Application Load Balancer (ALB).

### 3.1. Route 53: Domain Setup

1. Purchase or transfer `example.com` to Route 53 (or ensure it is already hosted there).
2. Create (or confirm existence of) a public hosted zone:
   - Name: `example.com`
3. Ensure the domain registrar uses the Route 53 name servers for `example.com`.

### 3.2. ACM: SSL Certificates for Subdomains

Region requirement:

- Certificates for ALB must be in the same region as the ALB (e.g. `ap-southeast-2`).

Steps:

1. In AWS Certificate Manager (ACM) in the ALB region, request a public certificate for:
   - `app.example.com`
   - `api.example.com`
2. Choose DNS validation.
3. For each domain name, ACM provides CNAME records.
4. In Route 53 hosted zone `example.com`, create the provided CNAME records.
5. Wait for validation to complete; ACM certificate status should become `Issued`.
6. Note the ACM certificate ARN for use in ALB HTTPS listener.

### 3.3. Application Load Balancer (ALB) Setup

Create one internet-facing ALB that fronts both frontend and backend services.

1. Network:
   - Scheme: `internet-facing`
   - Type: `Application Load Balancer`
   - Subnets: public subnets across at least two AZs.
   - Security group (ALB SG):
     - Inbound:
       - TCP 80 from `0.0.0.0/0`
       - TCP 443 from `0.0.0.0/0`
     - Outbound: allow to targets (default outbound open or restricted to ECS ENIs).
2. Target Groups:
   - Frontend target group:
     - Protocol: HTTP
     - Port: 80
     - Target type: `ip` (for Fargate)
     - Health check path: `/` (or appropriate frontend health endpoint)
   - Backend target group:
     - Protocol: HTTP
     - Port: 3000
     - Target type: `ip`
     - Health check path: `/api/v1/health` or existing backend health endpoint
3. Listeners:
   - HTTP 80:
     - Default action: redirect to HTTPS 443 (`HTTPS://:443` with 301).
   - HTTPS 443:
     - Use ACM certificate that covers:
       - `app.example.com`
       - `api.example.com`
     - Listener rules (host-based routing):
       - Rule 1:
         - If `Host` is `app.example.com`
         - Forward to frontend target group.
       - Rule 2:
         - If `Host` is `api.example.com`
         - Forward to backend target group.
       - Default action:
         - Optional 404 fixed response or one of the above target groups, per preference.

### 3.4. Route 53: Alias Records to ALB

In the `example.com` hosted zone, create:

1. `app.example.com`:
   - Type: `A` (Alias)
   - Alias target: the ALB DNS name (e.g. `aus-auto-alb-123456.ap-southeast-2.elb.amazonaws.com`)
   - Routing policy: simple (or as required).
2. `api.example.com`:
   - Type: `A` (Alias)
   - Alias target: same ALB DNS as above.

Once:

- ECS services register their tasks in the correct target groups, and
- ALB routing is configured,

Then:

- `https://app.example.com` → ALB → frontend target group → frontend ECS service.
- `https://api.example.com` → ALB → backend target group → backend ECS service.

---

## 4. ECS Service Wiring (Tasks, Env, Security)

This section defines how ECS task definitions and services must be configured to align with the existing Dockerization and environment usage.

Assumptions:

- ECS Launch type: Fargate.
- Networking: awsvpc.
- One or more ECS clusters:
  - `aus-auto-parts-prod`
  - `aus-auto-parts-staging`
- Shared or separate ALB as defined in [`CLOUD_INFRASTRUCTURE_PLAN.md`](CLOUD_INFRASTRUCTURE_PLAN.md:1).

### 4.1. Frontend ECS Task Definition

Container:

- Image:
  - Production:
    - `ACCOUNT_ID.dkr.ecr.ap-southeast-2.amazonaws.com/aus-auto-parts-frontend:prod-<git-sha>`
  - Staging:
    - `...:staging-<git-sha>`
- CPU/Memory:
  - Set to minimal required Fargate sizes (e.g. 256/512 to 512/1024), per performance needs.
- Port mappings:
  - Container port: `80`
  - Protocol: `tcp`
- Environment / build configuration:

At build time or via runtime env, ensure the frontend calls the correct backend URL:

- `VITE_API_URL=https://api.example.com/api/v1` for production.
- For staging, use appropriate hostname (e.g. `https://api-staging.example.com/api/v1`) if using separate domains or paths.

Implementation options:

1. Build-time:
   - CI sets `VITE_API_URL` during `docker build` for prod/staging images.
2. Runtime:
   - If the frontend image supports runtime configuration, inject `VITE_API_URL` as an environment variable via ECS task definition.

The critical requirement is that the running frontend served at `https://app.example.com` calls `https://api.example.com/api/v1` for API requests.

Service:

- ECS service `aus-auto-parts-frontend-prod` (and `-staging`):
  - Launch type: Fargate.
  - Desired count: at least 2 for HA in prod.
  - Network configuration:
    - Subnets: private subnets (recommended).
    - Security group: `FrontendServiceSG`.
  - Load balancer configuration:
    - Attach to ALB frontend target group (port 80).
    - Health checks aligned with ALB target group.

### 4.2. Backend ECS Task Definition

Container:

- Image:
  - Production:
    - `ACCOUNT_ID.dkr.ecr.ap-southeast-2.amazonaws.com/aus-auto-parts-backend:prod-<git-sha>`
  - Staging:
    - `...:staging-<git-sha>`
- CPU/Memory:
  - Set according to expected load.
- Port mappings:
  - Container port: `3000`
  - Protocol: `tcp`

Environment configuration:

Use SSM Parameter Store and/or Secrets Manager for sensitive values. ECS task definition should reference these as secrets.

Required environment variables:

- `PORT=3000`
- `DATABASE_URL`
  - PostgreSQL connection string pointing to RDS instance.
  - Example: `postgresql://USER:PASSWORD@rds-endpoint:5432/dbname?schema=public`
  - Inject via Secrets Manager or SSM parameter (not plain text).
- `REDIS_URL` (or equivalent host/port configuration) for ElastiCache/Redis:
  - Example:
    - `REDIS_URL=redis://cache-endpoint:6379`
  - Alternatively:
    - `REDIS_HOST`
    - `REDIS_PORT`

Other application-specific env vars (JWT secrets, etc.) should also be sourced from Secrets Manager/SSM, consistent with security best practices and the backend code’s expectations.

Service:

- ECS service `aus-auto-parts-backend-prod` (and `-staging`):
  - Launch type: Fargate.
  - Desired count: at least 2 for HA in prod.
  - Network configuration:
    - Subnets: private subnets.
    - Security group: `BackendServiceSG`.
  - Load balancer:
    - Attach to ALB backend target group (port 3000).
    - Health check path should match actual backend health endpoint.

### 4.3. Security Group Rules

Implement layered security consistent with the architecture:

1. ALB Security Group (`ALBSG`):
   - Inbound:
     - TCP 80 from `0.0.0.0/0` (for HTTP → HTTPS redirect).
     - TCP 443 from `0.0.0.0/0` (for HTTPS).
   - Outbound:
     - Allow to ECS tasks on their ports (80 for frontend, 3000 for backend), typically `0-65535` or restricted to ECS service SGs.

2. Frontend ECS Service Security Group (`FrontendServiceSG`):
   - Inbound:
     - TCP 80 from `ALBSG` only.
   - Outbound:
     - Allow HTTPS/HTTP to `api.example.com` (resolved via ALB), or direct calls as required.
     - Typically open outbound to required endpoints (ALB / backend / internet for assets if needed).
   - No direct inbound from the internet.

3. Backend ECS Service Security Group (`BackendServiceSG`):
   - Inbound:
     - TCP 3000 from `ALBSG` only.
   - Outbound:
     - To RDS SG on PostgreSQL port.
     - To Redis/ElastiCache SG on port 6379 (or configured).
     - To other required external services (if any).
   - No direct inbound from internet or frontend SG.

4. RDS PostgreSQL Security Group (`RDSSG`):
   - Inbound:
     - TCP 5432 from `BackendServiceSG` only.
   - Outbound:
     - Default or minimal as per AWS managed RDS defaults.
   - No inbound from ALB, internet, or frontend SG.

5. Redis/ElastiCache Security Group (`RedisSG`):
   - Inbound:
     - TCP 6379 (or configured port) from `BackendServiceSG` only.
   - Outbound:
     - As required for ElastiCache.
   - No inbound from ALB, internet, or frontend SG.

This ensures:

- Only the ALB is internet-facing.
- Only ALB can reach frontend/backends on their service ports.
- Only backend tasks can reach RDS and Redis.
- Frontend communicates with backend exclusively via HTTPS on `api.example.com` routed through the ALB.

---

## 5. Minimal End-to-End Flow Overview

Putting it all together:

1. Engineer provisions AWS infra:
   - ECR repos.
   - ECS Fargate clusters/services.
   - RDS (Postgres).
   - ElastiCache (Redis or alternative).
   - ALB with listeners, target groups, host-based routing.
   - Route 53 hosted zone and alias records.
   - ACM certificates.
   - Security groups matching rules above.

2. CI builds images from existing Dockerfiles and pushes to ECR:
   - Based on branch/tag (main → `prod-*`, develop → `staging-*`, features → `feature-*`).

3. CI updates ECS task definitions and triggers rolling deployments:
   - ECS pulls images by the immutable tags from ECR.
   - New tasks are registered in ALB target groups.

4. DNS and SSL:
   - `app.example.com` and `api.example.com` point (Alias) to the ALB.
   - ALB serves HTTPS using ACM, and routes based on Host header to the correct ECS services.

The result is a secure, minimal, and production-ready CI/CD and deployment workflow aligned with the existing Dockerization and the AWS architecture defined for this project.