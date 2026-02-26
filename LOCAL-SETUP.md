# Local Setup Guide (Without Docker)

> Run AIMS directly on your machine — no Docker required. Saves memory and disk space.

---

## Prerequisites

| Tool    | Version  | Check Command     | Install Guide                                      |
| ------- | -------- | ----------------- | -------------------------------------------------- |
| Node.js | 18 or 20 | `node --version`  | https://nodejs.org or use `nvm`                    |
| Yarn    | 1.x      | `yarn --version`  | `npm install -g yarn`                              |
| MySQL   | 8.0+     | `mysql --version` | https://dev.mysql.com/downloads/mysql/             |
| Redis   | 7+       | `redis-server -v` | https://redis.io/docs/getting-started/installation |
| Git     | 2.x      | `git --version`   | https://git-scm.com                                |

> **ClickHouse** is optional — only needed for analytics dashboards. You can skip it for basic development.
>
> **Node.js 20 note:** Node 20 works but requires two extra steps:
>
> 1. A `.yarnrc` file to bypass engine compatibility checks (see [Step 4](#4-clone--install-dependencies))
> 2. A one-time patch for `extract-files` (see [Step 7](#7-patch-for-nodejs-20-required))

---

## 1. Install System Dependencies

### Ubuntu / Debian

```bash
# Node.js 18 via nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Yarn
npm install -g yarn

# MySQL 8
sudo apt update
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql

# Redis
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### macOS (Homebrew)

```bash
# Node.js
brew install node@18

# Yarn
npm install -g yarn

# MySQL
brew install mysql
brew services start mysql

# Redis
brew install redis
brew services start redis
```

### Windows

Use installers from the official sites above, or run MySQL and Redis via WSL2.

---

## 2. Setup MySQL Database

```bash
# Log into MySQL as root
sudo mysql -u root
# (on macOS: mysql -u root)

# Create the database and set a password
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password_here';
CREATE DATABASE doa_db;
FLUSH PRIVILEGES;
EXIT;
```

Verify the connection:

```bash
mysql -u root -p -e "SHOW DATABASES;" | grep doa_db
```

---

## 3. Setup Redis

Redis should already be running after installation. Verify:

```bash
redis-cli ping
# Expected: PONG
```

---

## 4. Clone & Install Dependencies

```bash
# Clone the repository
git clone git@github.com:arya020595/st_aims.git
cd st_aims
```

### Node.js 20+ — Bypass Engine Check

If you're on **Node.js 20+**, some dependencies (e.g., `@azure/msal-node@1.18.4`) declare engine compatibility only up to Node 18. The project works fine on Node 20, but `yarn install` will fail with:

```
error @azure/msal-node@1.18.4: The engine "node" is incompatible with this module.
Expected version "10 || 12 || 14 || 16 || 18". Got "20.x.x"
```

**Fix — create a `.yarnrc` file** (already included in the repository):

```bash
# This file should already exist; if not, create it:
echo '--install.ignore-engines true' > .yarnrc
```

This tells Yarn to skip engine version checks. On **Node.js 18**, this step is not needed (but having the file is harmless).

### Install Dependencies

```bash
# Install all dependencies (Yarn Workspaces handles both services)
yarn install
```

> This installs dependencies for both `services/graphql` and `services/app` via Yarn Workspaces.
>
> **Note:** You will see many `warning Lockfile has incorrect entry for ...` messages during install. These are **safe to ignore** — they come from stale entries in `yarn.lock` and Yarn resolves them automatically (the lockfile is updated on successful install).

---

## 5. Configure Environment Variables

```bash
# Create root .env from template
cp .env.example .env

# Create GraphQL service .env (needed for Prisma)
cp .env.example services/graphql/.env
```

Edit **`.env`** with your actual values:

```dotenv
# App (Next.js frontend)
APP_PORT=3001
GRAPHQL_API_HOST=localhost
GRAPHQL_API_PORT=4000
TOKENIZE=super_secret_key_456

# Database (MySQL)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=doa_db
DB_PORT=3306
DATABASE_URL="mysql://root:your_password_here@localhost:3306/doa_db"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# ClickHouse (optional — skip if not using analytics)
# CLICKHOUSE_HOST=localhost
# CLICKHOUSE_PORT=8123

# AWS S3 (optional — skip if not using file uploads)
# S3_ACCESS_KEY=
# S3_SECRET_KEY=
# S3_REGION_NAME=ap-southeast-1
# S3_BUCKET_NAME=
```

Edit **`services/graphql/.env`** — it only needs the `DATABASE_URL`:

```dotenv
DATABASE_URL="mysql://root:your_password_here@localhost:3306/doa_db"
```

> **Important:** Both files must have the same `DATABASE_URL` and `DB_PASSWORD`.

---

## 6. Setup Prisma (Database Schema)

```bash
cd services/graphql

# Generate the Prisma client
npx prisma generate

# Push the schema to MySQL (creates all tables)
npx prisma db push --schema ./prisma/schema.prisma

cd ../..
```

> **Existing database?** If the database already has data, Prisma may warn about potential data loss (e.g., timestamp precision changes). If you're sure the changes are safe, use:
>
> ```bash
> npx prisma db push --schema ./prisma/schema.prisma --accept-data-loss
> ```

## 7. Patch for Node.js 20+ (Required)

If you're using **Node.js 20+**, the `extract-files` package (v9) has an incompatible `exports` field that uses a deprecated trailing-slash pattern. This causes the App service to crash with:

```
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './public/extractFiles'
is not defined by "exports" in node_modules/extract-files/package.json
```

**Fix — run this once after `yarn install`:**

```bash
node -e "
const pkg = require('./node_modules/extract-files/package.json');
pkg.exports['./public/*'] = './public/*.js';
pkg.exports['./public/extractFiles'] = './public/extractFiles.js';
require('fs').writeFileSync('./node_modules/extract-files/package.json', JSON.stringify(pkg, null, 2) + '\n');
"
```

> **Note:** This patch lives in `node_modules` and will be lost if you run `yarn install` again. Re-run the patch after every fresh install. On **Node.js 18**, this step is not needed.

---

## 8. Start the Services

You need **two terminal windows** (or use a process manager).

### Terminal 1 — GraphQL API

```bash
cd services/graphql
node index.js
```

Expected output:

```
🚀  GraphQL server ready at http://localhost:4000/graphql
```

> You may see warnings about Prisma env var conflicts and AWS SDK v2 deprecation — these are safe to ignore (see [Expected Warnings](#expected-warnings)).

### Terminal 2 — App (Frontend)

```bash
cd services/app
NODE_OPTIONS=--openssl-legacy-provider node server/index.js
```

Expected output:

```
> Ready on http://localhost:3001
```

> First request to any page will trigger Next.js compilation (takes a few seconds). Subsequent requests are instant.

---

## 9. Development Mode (Auto-Reload)

For active development with file watching and auto-restart:

### Option A: Using Yarn scripts from root

```bash
# Terminal 1 — GraphQL (auto-restarts on file changes via nodemon)
yarn graphql:dev

# Terminal 2 — App (Next.js HMR + nodemon for server)
# Note: NODE_OPTIONS must be set in your environment
export NODE_OPTIONS=--openssl-legacy-provider
yarn app:dev
```

### Option B: Running directly in each service

```bash
# Terminal 1
cd services/graphql
npx nodemon index.js --watch ./

# Terminal 2
cd services/app
NODE_OPTIONS=--openssl-legacy-provider npx nodemon server/index.js --watch server
```

---

## 10. Access the Application

| Service            | URL                                              |
| ------------------ | ------------------------------------------------ |
| App (Frontend)     | http://localhost:3001                            |
| Login Page         | http://localhost:3001/doa/login                  |
| GraphQL Playground | http://localhost:4000/graphql (development only) |
| GraphQL Health     | http://localhost:4000/callback                   |

### Quick Health Check

```bash
# GraphQL API
curl -s http://localhost:4000/callback
# Expected: {"ok":true}

# GraphQL query test
curl -s http://localhost:4000/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ __typename }"}' | head -c 100
# Expected: {"data":{"__typename":"Query"}}
```

---

## Optional: ClickHouse Setup

Only needed if you use analytics dashboards.

```bash
# Ubuntu/Debian
sudo apt install -y clickhouse-server clickhouse-client
sudo systemctl start clickhouse-server

# macOS
brew install clickhouse

# Verify
clickhouse-client --query "SELECT 1"
```

Then uncomment the ClickHouse variables in `.env`:

```dotenv
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=8123
```

---

## Troubleshooting

### `Error: listen EADDRINUSE :::4000` or `:::3001`

A process is already using the port. Kill it:

```bash
# Find and kill the process on port 4000
lsof -ti:4000 | xargs kill -9

# Or for port 3001
lsof -ti:3001 | xargs kill -9
```

### `Can't reach MySQL server` / `Connection refused`

```bash
# Check if MySQL is running
sudo systemctl status mysql

# Start it if stopped
sudo systemctl start mysql

# Verify you can connect
mysql -u root -p -e "SELECT 1;"
```

### `Redis connection error`

```bash
# Check if Redis is running
sudo systemctl status redis-server

# Start it
sudo systemctl start redis-server

# Verify
redis-cli ping
```

### Prisma errors: `Can't reach database server`

- Double-check `DATABASE_URL` in both `.env` and `services/graphql/.env`
- Make sure the password matches what you set in MySQL
- Ensure the `doa_db` database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### `Error: digital envelope routines::unsupported` (App service)

You need the OpenSSL legacy flag. Make sure you're running with:

```bash
NODE_OPTIONS=--openssl-legacy-provider node server/index.js
```

Or set it globally in your shell profile:

```bash
echo 'export NODE_OPTIONS=--openssl-legacy-provider' >> ~/.bashrc
source ~/.bashrc
```

### `ERR_PACKAGE_PATH_NOT_EXPORTED` — extract-files {#known-issues-node-20}

This happens on **Node.js 20+**. The `extract-files` v9 package uses a deprecated exports pattern.

```
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './public/extractFiles'
is not defined by "exports" in node_modules/extract-files/package.json
```

**Fix:**

```bash
node -e "
const pkg = require('./node_modules/extract-files/package.json');
pkg.exports['./public/*'] = './public/*.js';
pkg.exports['./public/extractFiles'] = './public/extractFiles.js';
require('fs').writeFileSync('./node_modules/extract-files/package.json', JSON.stringify(pkg, null, 2) + '\n');
"
```

> Re-run this after every `yarn install`.

### `@azure/msal-node` engine incompatible (Node 20+)

If you see:

```
error @azure/msal-node@1.18.4: The engine "node" is incompatible with this module.
```

Create or verify `.yarnrc` exists in the project root:

```bash
echo '--install.ignore-engines true' > .yarnrc
yarn install
```

### `Module not found` errors

Re-install dependencies:

```bash
# From the project root
rm -rf node_modules services/app/node_modules services/graphql/node_modules
yarn install
```

Then regenerate Prisma client:

```bash
cd services/graphql && npx prisma generate && cd ../..
```

If on Node.js 20+, also re-run the extract-files patch (see above).

### Lockfile warnings (`Lockfile has incorrect entry for ...`)

These warnings during `yarn install` are harmless. They occur when `yarn.lock` has stale or mismatched entries. Yarn resolves them automatically and updates the lockfile on successful install. No action required.

---

## Stopping Services

Simply press `Ctrl+C` in each terminal window.

To stop MySQL and Redis when not in use (saves memory):

```bash
# Linux
sudo systemctl stop mysql
sudo systemctl stop redis-server

# macOS
brew services stop mysql
brew services stop redis
```

---

## Memory Comparison

| Setup              | Approx. RAM Usage | Disk Usage      |
| ------------------ | ----------------- | --------------- |
| Docker (all)       | ~2-4 GB           | ~10 GB (images) |
| Local (this guide) | ~500 MB - 1 GB    | ~1-2 GB         |

> Running locally uses significantly less memory and disk since there's no Docker daemon, container overhead, or duplicate image layers.

---

## Expected Warnings

These warnings appear during startup and are **safe to ignore**:

| Warning                                                            | Reason                                                                                                                                      |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `warn(prisma) Conflict for env vars DB_HOST, DB_USER...`           | Prisma detects the same variables in both `../../.env` and `services/graphql/.env`. The service-level `.env` takes priority — this is fine. |
| `NOTE: The AWS SDK for JavaScript (v2) has reached end-of-support` | The project uses AWS SDK v2. It still works, but AWS recommends migrating to v3 eventually.                                                 |
| `Not connected to AWS, missing access key or secret key!`          | S3 credentials are not configured. File upload features won't work, but everything else runs normally.                                      |
| `You have enabled the JIT engine which is currently in preview`    | Next.js JIT mode warning from Tailwind CSS. Does not affect functionality.                                                                  |

---

## Quick Reference

| Action                   | Command                                                                          |
| ------------------------ | -------------------------------------------------------------------------------- |
| Install dependencies     | `yarn install`                                                                   |
| Bypass engine check      | `echo '--install.ignore-engines true' > .yarnrc`                                 |
| Generate Prisma client   | `cd services/graphql && npx prisma generate`                                     |
| Push database schema     | `cd services/graphql && npx prisma db push`                                      |
| Start GraphQL (prod)     | `cd services/graphql && node index.js`                                           |
| Start GraphQL (dev)      | `yarn graphql:dev`                                                               |
| Start App (prod)         | `cd services/app && NODE_OPTIONS=--openssl-legacy-provider node server/index.js` |
| Start App (dev)          | `export NODE_OPTIONS=--openssl-legacy-provider && yarn app:dev`                  |
| Patch extract-files      | See [Step 7](#7-patch-for-nodejs-20-required) (Node 20+ only)                    |
| Backup database          | `cd services/graphql && yarn db:backup`                                          |
| Restore database         | `cd services/graphql && yarn db:restore`                                         |
| Generate API docs        | `cd services/graphql && npx spectaql spectaql-config.yml`                        |
| View API docs (live)     | `cd services/graphql && npx spectaql spectaql-config.yml -D`                     |
| Open Prisma Studio (GUI) | `cd services/graphql && npx prisma studio`                                       |
