# AIMS (DoAA)

Agricultural Information Management System

## Architecture

- **App** — Next.js 10 frontend with Express custom server (port 3001)
- **GraphQL** — Apollo Server + Express + Prisma (port 4000)
- **MySQL 8** — Primary database
- **Redis 7** — Caching
- **ClickHouse** — Analytics

## Prerequisites

- Node.js 18+ (with `--openssl-legacy-provider` for the app)
- Yarn 1.x
- Docker & Docker Compose (for containerized deployment)

## Local Development

```bash
# Install dependencies (from root)
yarn install

# Copy and configure environment
cp .env.example .env
cp .env.example services/graphql/.env
# Edit .env files with your DB credentials

# Run GraphQL service
cd services/graphql && node index.js

# Run App service (separate terminal)
cd services/app && NODE_OPTIONS=--openssl-legacy-provider node server/index.js
```

## Docker Deployment

```bash
# Build and start all services
docker compose up --build -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

## Environment Variables

See [.env.example](.env.example) for all available configuration options.