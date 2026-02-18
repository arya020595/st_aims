# Docker Quick Start Guide

> Quick start guide for running AIMS using Docker — both **development** and **production** modes.

---

## Prerequisites

| Tool           | Minimum Version | Check Command            |
| -------------- | --------------- | ------------------------ |
| Docker         | 20.10+          | `docker --version`       |
| Docker Compose | 2.0+ (V2)       | `docker compose version` |
| Git            | 2.x             | `git --version`          |

> **Disk space:** ~10 GB for Docker images + database volumes.

---

## 1. Clone & Configure

```bash
# Clone the repository
git clone git@github.com:arya020595/st_aims.git
cd st_aims

# Create environment file from template
cp .env.example .env
```

Edit `.env` with your settings (the defaults work for Docker out of the box):

```dotenv
# App
APP_PORT=3001
GRAPHQL_API_HOST=localhost
GRAPHQL_API_PORT=4000
TOKENIZE=your_jwt_secret_here

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=doa_db
DB_PORT=3306
DATABASE_URL="mysql://root:your_password_here@localhost:3306/doa_db"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

> **Note:** `DB_HOST`, `REDIS_HOST`, and `GRAPHQL_API_HOST` are overridden inside Docker Compose to use container hostnames (`mysql`, `redis`, `graphql`). You don't need to change them for Docker — they're only for local (non-Docker) development.

---

## 2A. Development Mode

Development mode provides **live-reload** — your source code is mounted into containers so changes are reflected immediately without rebuilding images.

### What you get

| Feature               | Details                                               |
| --------------------- | ----------------------------------------------------- |
| Hot reload (GraphQL)  | nodemon watches all files, restarts on change         |
| Hot reload (App)      | Next.js HMR for pages/components + nodemon for server |
| GraphQL Playground    | Enabled at http://localhost:4000/graphql              |
| Debug-friendly errors | Full stack traces in responses                        |
| Source code mounted   | Edit locally → see changes in container               |

### Start

```bash
# First-time: build images (takes 5-10 min)
docker compose -f docker-compose.dev.yml build

# Start all services
docker compose -f docker-compose.dev.yml up -d

# ⚠️ First-time only: create database tables (wait ~30s for MySQL to be healthy first)
docker exec -it aims-dev-graphql npx prisma db push --schema ./prisma/schema.prisma

# Restart GraphQL & App after DB is initialized
docker compose -f docker-compose.dev.yml restart graphql app
```

### Verify

```bash
# Check all containers are running
docker compose -f docker-compose.dev.yml ps

# Expected output:
# aims-dev-mysql       running (healthy)
# aims-dev-redis       running (healthy)
# aims-dev-clickhouse  running (healthy)
# aims-dev-graphql     running
# aims-dev-app         running
```

### Access

| Service            | URL                           |
| ------------------ | ----------------------------- |
| App (Frontend)     | http://localhost:3001         |
| GraphQL Playground | http://localhost:4000/graphql |
| MySQL              | `localhost:3306`              |
| Redis              | `localhost:6379`              |
| ClickHouse HTTP    | http://localhost:8123         |

### Logs

```bash
# All services
docker compose -f docker-compose.dev.yml logs -f

# Specific service
docker compose -f docker-compose.dev.yml logs -f graphql
docker compose -f docker-compose.dev.yml logs -f app
```

### Stop

```bash
# Stop containers (preserves data)
docker compose -f docker-compose.dev.yml down

# Stop and remove volumes (⚠️ deletes database data)
docker compose -f docker-compose.dev.yml down -v
```

### Rebuild (after dependency changes)

If you change `package.json` or `yarn.lock`, you need to rebuild:

```bash
docker compose -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.dev.yml up -d
```

---

## 2B. Production Mode

Production mode builds **optimized images** with pre-compiled Next.js bundles. No source code is mounted — everything is baked into the image.

### What you get

| Feature             | Details                                      |
| ------------------- | -------------------------------------------- |
| Pre-built Next.js   | `next build` runs during image build         |
| NODE_ENV=production | GraphQL Playground disabled, optimized React |
| No source mount     | Self-contained images, deploy anywhere       |
| Health checks       | MySQL, Redis, ClickHouse auto-recovery       |
| Auto-restart        | `restart: unless-stopped` on all services    |

### Start

```bash
# Build production images (takes 10-15 min first time)
docker compose build

# Start all services
docker compose up -d

# ⚠️ First-time only: create database tables (wait ~30s for MySQL to be healthy first)
docker exec -it aims-graphql npx prisma db push --schema ./prisma/schema.prisma

# Restart GraphQL & App after DB is initialized
docker compose restart graphql app
```

### Verify

```bash
# Check all containers are running
docker compose ps

# Expected output:
# aims-mysql       running (healthy)
# aims-redis       running (healthy)
# aims-clickhouse  running (healthy)
# aims-graphql     running
# aims-app         running

# Quick health check
curl -s http://localhost:4000/graphql -H 'Content-Type: application/json' \
  -d '{"query":"{ __typename }"}' | head -c 100
# Should return: {"data":{"__typename":"Query"}}
```

### Access

| Service        | URL                           |
| -------------- | ----------------------------- |
| App (Frontend) | http://localhost:3001         |
| GraphQL API    | http://localhost:4000/graphql |

> In production, GraphQL Playground is disabled. Use the API endpoint directly.

### Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f graphql
docker compose logs -f app
```

### Stop

```bash
# Stop containers (preserves data)
docker compose down

# Stop and remove volumes (⚠️ deletes all data)
docker compose down -v
```

### Update / Redeploy

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose build
docker compose up -d
```

---

## Quick Reference

### Command Cheat Sheet

| Action                 | Development                                                 | Production                                        |
| ---------------------- | ----------------------------------------------------------- | ------------------------------------------------- |
| **Build**              | `docker compose -f docker-compose.dev.yml build`            | `docker compose build`                            |
| **Start**              | `docker compose -f docker-compose.dev.yml up -d`            | `docker compose up -d`                            |
| **Stop**               | `docker compose -f docker-compose.dev.yml down`             | `docker compose down`                             |
| **Logs**               | `docker compose -f docker-compose.dev.yml logs -f`          | `docker compose logs -f`                          |
| **Status**             | `docker compose -f docker-compose.dev.yml ps`               | `docker compose ps`                               |
| **Rebuild**            | `docker compose -f docker-compose.dev.yml build --no-cache` | `docker compose build --no-cache`                 |
| **Shell into GraphQL** | `docker exec -it aims-dev-graphql sh`                       | `docker exec -it aims-graphql sh`                 |
| **Shell into App**     | `docker exec -it aims-dev-app sh`                           | `docker exec -it aims-app sh`                     |
| **Run Prisma migrate** | `docker exec -it aims-dev-graphql npx prisma db push`       | `docker exec -it aims-graphql npx prisma db push` |
| **Reset database**     | `docker compose -f docker-compose.dev.yml down -v`          | `docker compose down -v`                          |

### Files Overview

| File                          | Purpose                                               |
| ----------------------------- | ----------------------------------------------------- |
| `docker-compose.yml`          | **Production** — builds optimized images              |
| `docker-compose.dev.yml`      | **Development** — volume mounts, live-reload          |
| `services/graphql/Dockerfile` | GraphQL service image (node:18-slim + Prisma)         |
| `services/app/Dockerfile`     | App service image (node:18-slim + Next.js build)      |
| `.dockerignore`               | Excludes node_modules, .next, .env from build context |
| `.env`                        | Environment variables (loaded by Docker Compose)      |
| `.env.example`                | Template for `.env`                                   |

### Architecture in Docker

```
┌─────────────────────────────────────────────────────┐
│                   Docker Network                     │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │  MySQL   │  │  Redis   │  │    ClickHouse      │ │
│  │  :3306   │  │  :6379   │  │    :8123 / :9000   │ │
│  └────┬─────┘  └────┬─────┘  └────────┬───────────┘ │
│       │              │                 │             │
│       └──────────────┼─────────────────┘             │
│                      │                               │
│              ┌───────┴────────┐                      │
│              │   GraphQL API  │                      │
│              │   :4000        │                      │
│              └───────┬────────┘                      │
│                      │                               │
│              ┌───────┴────────┐                      │
│              │   App (Next.js)│                      │
│              │   :3001        │                      │
│              └────────────────┘                      │
└─────────────────────────────────────────────────────┘
        ↑ :3001 (App)    ↑ :4000 (API)    ↑ :3306, :6379, :8123
        Host ports exposed to localhost
```

---

## Troubleshooting

### Container won't start

```bash
# Check logs for the failing service
docker compose logs graphql
docker compose logs app

# Common issues:
# - MySQL not ready yet → GraphQL depends_on uses healthcheck, wait ~30s
# - Port already in use → Change port in .env (APP_PORT, GRAPHQL_API_PORT)
# - Permission denied → Run with sudo or add user to docker group
```

### Database connection refused

```bash
# Verify MySQL is healthy
docker compose ps mysql

# Check if MySQL is accepting connections
docker exec -it aims-mysql mysqladmin ping -h localhost

# If using dev mode, check container name prefix (aims-dev-mysql)
docker exec -it aims-dev-mysql mysqladmin ping -h localhost
```

### Changes not reflecting (Development)

```bash
# Verify volumes are mounted
docker inspect aims-dev-graphql | grep -A5 "Mounts"

# Restart the specific service
docker compose -f docker-compose.dev.yml restart graphql

# If schema changes, restart is automatic (nodemon watches files)
```

### Out of disk space

```bash
# Remove unused Docker resources
docker system prune -a

# Remove only this project's volumes
docker compose down -v
```

### Rebuild from scratch

```bash
# Nuclear option: remove everything and start fresh
docker compose down -v --rmi all
docker compose build --no-cache
docker compose up -d
```
