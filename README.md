# AIMS — Agricultural Information Management System

> **Department of Agriculture and Agrifood (DoAA)**
>
> A full-stack web application for managing agricultural data across multiple domains: crops, livestock, biosecurity, agrifood profiling, and retail pricing.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Service Details](#service-details)
  - [GraphQL API Service](#graphql-api-service)
  - [App (Frontend) Service](#app-frontend-service)
- [Data Model](#data-model)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development](#local-development)
  - [Docker Deployment](#docker-deployment)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Utility Scripts](#utility-scripts)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Client Browser                     │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP
                         ▼
┌─────────────────────────────────────────────────────────┐
│              App Service (Next.js + Express)             │
│                    Port 3001                             │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  SSR Pages  │  │ Static Assets│  │  /api Proxy   │  │
│  │  (Next.js)  │  │  (public/)   │  │  → /graphql   │  │
│  └─────────────┘  └──────────────┘  └───────┬───────┘  │
└──────────────────────────────────────────────┼──────────┘
                                               │ HTTP Proxy
                                               ▼
┌─────────────────────────────────────────────────────────┐
│           GraphQL API Service (Apollo Server)            │
│                    Port 4000                             │
│                                                         │
│  ┌──────────────┐  ┌────────────┐  ┌────────────────┐  │
│  │ 102 Schema   │  │ Auth &     │  │ REST Endpoints │  │
│  │ Modules      │  │ DataLoader │  │ /callback      │  │
│  │ (auto-load)  │  │            │  │ /vegetable-list│  │
│  └──────┬───────┘  └────────────┘  └────────────────┘  │
└─────────┼───────────────────────────────────────────────┘
          │
    ┌─────┴─────┬─────────────┬────────────────┐
    ▼           ▼             ▼                ▼
┌────────┐ ┌────────┐ ┌────────────┐ ┌──────────────┐
│MySQL 8 │ │Redis 7 │ │ ClickHouse │ │  AWS S3      │
│(Prisma)│ │(Cache) │ │ (Analytics)│ │  (Storage)   │
└────────┘ └────────┘ └────────────┘ └──────────────┘
```

### Request Flow

1. Browser requests hit the **App service** on port 3001
2. Next.js handles server-side rendering of pages
3. API calls go to `/api/*` and are proxied to the **GraphQL service** at `/graphql`
4. GraphQL resolvers interact with **MySQL** (via Prisma), **Redis**, **ClickHouse**, and **S3**
5. Authentication uses JWT tokens (`TOKENIZE` secret) with role-based access control

---

## Technology Stack

| Layer         | Technology                                         |
| ------------- | -------------------------------------------------- |
| Frontend      | Next.js 10, React 17, Tailwind CSS, Framer Motion  |
| Backend       | Apollo Server Express 2.x, Express 4, Prisma 4     |
| Database      | MySQL 8.0 (primary), ClickHouse (analytics)        |
| Cache         | Redis 7 (via ioredis)                              |
| Storage       | AWS S3 (file uploads, presigned URLs)              |
| Auth          | JWT (jsonwebtoken), bcryptjs, Active Directory     |
| Monorepo      | Yarn 1.x Workspaces + Lerna 3.22                   |
| Containerize  | Docker, Docker Compose                             |
| PDF           | pdfmake (with custom fonts: Roboto, Poppins, etc.) |
| Excel         | exceljs                                            |
| Email         | nodemailer                                         |
| Notifications | Telegram Bot API, Discord Webhooks, Slack Webhooks |

---

## Project Structure

```
aims/
├── docker-compose.yml          # Docker orchestration (MySQL, Redis, ClickHouse, GraphQL, App)
├── .dockerignore               # Docker build exclusions
├── .env                        # Root environment variables (loaded by both services)
├── .env.example                # Environment template
├── .gitignore                  # Git exclusions
├── lerna.json                  # Lerna monorepo config
├── package.json                # Root workspace (name: "DoAA")
├── yarn.lock                   # Dependency lock file
│
└── services/
    ├── graphql/                # ── GraphQL API Service ──
    │   ├── index.js            # Entry point: Apollo Server + Express
    │   ├── Dockerfile          # Docker image (node:18-slim)
    │   ├── package.json        # Dependencies (apollo, prisma, aws-sdk, etc.)
    │   ├── .env                # Service-specific env (DATABASE_URL, DB_*)
    │   │
    │   ├── schema/             # 102 GraphQL schema modules (auto-discovered)
    │   │   ├── index.js        # Schema loader: auto-merges from subdirs
    │   │   ├── helpers.js      # composeTypeDefs utility
    │   │   ├── User/           # Example module:
    │   │   │   ├── types.js    #   GraphQL type definitions
    │   │   │   └── resolvers.js#   Query/Mutation resolvers
    │   │   ├── Broiler/
    │   │   ├── CropsFruit/
    │   │   ├── Livestock/
    │   │   ├── BioSecurityImportData/
    │   │   └── ... (102 modules)
    │   │
    │   ├── prisma/
    │   │   └── schema.prisma   # 106 Prisma models (MySQL)
    │   │
    │   ├── authentication.js   # JWT auth + default user seeding
    │   ├── clickhouse.js       # ClickHouse client init
    │   ├── data-loader.js      # DataLoader factories (batched DB queries)
    │   ├── emailer.js          # Nodemailer config
    │   ├── excel.js            # Excel generation with exceljs
    │   ├── mongodb-connection.js # MongoDB connection (used by utility scripts)
    │   ├── pdf.js              # PDF generation with pdfmake
    │   ├── redis.js            # Redis (ioredis) client
    │   ├── s3.js               # AWS S3 client init
    │   ├── role-privileges.json # Role-based access control definitions
    │   ├── spectaql-config.yml # SpectaQL API docs config
    │   │
    │   ├── libs/               # Shared utilities
    │   │   ├── base64.js
    │   │   ├── cdn-url.js
    │   │   ├── nanoid.js
    │   │   ├── numbers.js
    │   │   ├── time.js
    │   │   └── title.js
    │   │
    │   ├── pdf-fonts/          # Custom TTF fonts (Roboto, Poppins, OpenSans, Merriweather)
    │   │
    │   ├── public/             # Upload directories & templates
    │   │   ├── saveFileDir/
    │   │   ├── country_producing/
    │   │   ├── fruit_retail_price/
    │   │   ├── vegetable_retail_price/
    │   │   ├── trade_data_file/
    │   │   ├── unstructured_document/
    │   │   └── template/       # Excel import/export templates
    │   │
    │   ├── static/template/    # Trade data export templates (xlsx)
    │   │
    │   ├── utilities/          # Standalone scripts (run directly with node)
    │   │   ├── db-backup.js    # Database backup
    │   │   ├── db-restore.js   # Database restore
    │   │   ├── denormalize/    # Data denormalization scripts
    │   │   ├── migration/      # Data migration helpers
    │   │   └── ...             # Various data fix/conversion scripts
    │   │
    │   └── vegetable-rest/
    │       └── vegetable.js    # REST endpoint logic for /vegetable-list
    │
    └── app/                    # ── Next.js Frontend Service ──
        ├── server/
        │   └── index.js        # Custom Express server: proxy, static files, S3 presigned URLs
        ├── Dockerfile          # Docker image (node:18-slim)
        ├── package.json        # Dependencies (next, react, apollo-client, etc.)
        ├── next.config.js      # Next.js config (webpack 4)
        ├── tailwind.config.js  # Tailwind CSS config
        ├── postcss.config.js   # PostCSS config
        │
        ├── pages/              # 144 Next.js pages (file-based routing)
        │   ├── _app.js         # App wrapper (Apollo Provider, auth)
        │   ├── _document.js    # Custom HTML document
        │   ├── index.js        # Landing redirect → /doa/login
        │   ├── login.js
        │   ├── dashboard.js
        │   │
        │   ├── broiler/                  # Poultry: broiler management
        │   ├── day-old-chick/            # Poultry: day-old chick tracking
        │   ├── fertilized-eggs/          # Poultry: fertilized egg data
        │   ├── table-eggs/               # Poultry: table egg data
        │   ├── ruminant/                 # Livestock: ruminant production
        │   ├── livestock-feed/           # Livestock: feed management
        │   ├── miscellaneous-livestock/  # Livestock: other animals
        │   │
        │   ├── paddy-crops/              # Crops: paddy/rice production
        │   ├── fruit-crops/              # Crops: fruit production
        │   ├── vegetable-crops/          # Crops: vegetable production
        │   ├── miscellaneous-crops/      # Crops: other crops
        │   ├── floriculture-crops/       # Crops: cut flowers, ornamentals
        │   ├── retail-price-crops/       # Market: crop retail pricing
        │   │
        │   ├── master-data-agrifood/     # Master data: agrifood domain
        │   ├── master-data-biosecurity/  # Master data: biosecurity domain
        │   ├── master-data-crops/        # Master data: crops domain
        │   ├── master-data-livestock/    # Master data: livestock domain
        │   │
        │   ├── profiling-agrifood/       # Profiling: agrifood companies
        │   ├── profiling-biosecurity/    # Profiling: biosecurity entities
        │   ├── profiling-crops/          # Profiling: crop farmers/farms
        │   ├── profiling-livestock/      # Profiling: livestock farmers/farms
        │   │
        │   ├── dashboard-agrifood.js     # Domain dashboards
        │   ├── dashboard-biosecurity.js
        │   ├── overall-dashboard.js
        │   └── ...
        │
        ├── components/         # React components
        │   ├── AdminArea.js    # Layout wrapper: Sidebar + Header + content
        │   ├── App.js          # Root app component
        │   ├── Header.js       # Top navigation bar
        │   ├── Sidebar.js      # Side navigation menu
        │   ├── Table.js        # Data table component
        │   ├── TableAsync.js   # Async paginated data table
        │   ├── Modal.js        # Modal dialog
        │   ├── FormCustomizer.js # Dynamic form builder
        │   ├── DateFilterWithExport.js
        │   ├── MonthAndYearsFilterWithExport.js
        │   ├── MultiYearsFilterWithExport.js
        │   │
        │   ├── form/           # Form field components (22 types)
        │   │   ├── ShortText.js, LongText.js, Number.js, Email.js
        │   │   ├── Select.js, SingleSelect.js, MultipleSelect.js
        │   │   ├── Date.js, Time.js, File.js, Attachment.js
        │   │   ├── Toggle.js, Checkbox.js, Rating.js, Currency.js
        │   │   └── ... (EditableDate, EditableText, EditableTime, etc.)
        │   │
        │   ├── FloricultureCrops/     # Domain-specific components
        │   ├── FruitCrops/
        │   ├── PaddyCrops/
        │   ├── PaddySeedlingProductionCrops/
        │   ├── NonComplianceEnforcement/
        │   ├── ProductCatalogue/
        │   ├── RetailPriceCropsImport/
        │   └── UserManagement/
        │
        ├── libs/               # Client-side utilities
        │   ├── apollo.js       # Apollo Client setup (with SSR)
        │   ├── apollo-client.js
        │   ├── checkLoggedIn.js # Auth guard
        │   ├── encryptedLS.js  # Encrypted localStorage
        │   ├── localStorage.js # useLocalStorage hook
        │   ├── navigation.js   # Route/menu definitions
        │   ├── redirect.js     # Server/client redirect
        │   ├── color-scheme.js # Dashboard color schemes
        │   ├── time.js, strings.js, numbers.js, nanoid.js
        │   └── ...
        │
        ├── locales/            # i18n translations
        │   ├── en/             # English (dashboard, login, sidebar)
        │   └── id/             # Indonesian (dashboard, login, sidebar)
        │
        ├── styles/             # CSS files
        │   ├── index.css       # Global styles
        │   ├── button.css, form.css
        │   └── ... (vendor overrides)
        │
        └── public/             # Static assets
            ├── css/            # Vendor CSS (bootstrap, fullcalendar, etc.)
            ├── fonts/          # Summernote fonts
            ├── fontawesome-free-5.12.1-web/  # FontAwesome icons
            ├── icons/          # SVG icons
            ├── images/         # UI images, logos, dashboard graphics
            ├── js/             # Vendor JS (mathlive)
            └── template/       # Excel import templates (xlsx)
```

---

## Service Details

### GraphQL API Service

**Entry Point:** `services/graphql/index.js`

The GraphQL service uses a **dynamic schema loading** pattern:

1. On startup, it scans all subdirectories under `schema/`
2. Each directory contains `types.js` (GraphQL type definitions) and `resolvers.js` (query/mutation handlers)
3. All schemas are merged using Apollo's `mergeSchemas`
4. Custom types are shared across all modules via `composeTypeDefs`

**Key features:**

- **Authentication:** JWT-based with `authenticate()` middleware on every request
- **Data Loaders:** Batched database queries via DataLoader to prevent N+1 problems
- **File Operations:** Excel import/export, PDF generation, S3 file uploads
- **Notifications:** Telegram, Discord, and Slack webhook integration
- **REST Endpoints:** `/callback` (health check), `/vegetable-list` (external REST API)

**Domain modules (102 total):**

| Domain           | Modules                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Crops**        | CropsFruit, CropsVegetable, PaddyProduction, CropsCutFlower, CropsOrnamentalPlant, MiscellaneousCrops, etc.          |
| **Livestock**    | Livestock, LivestockCategory, LivestockFeed, Broiler, DayOldChick, FertilizedEgg, TableEgg, RuminantProduction, etc. |
| **BioSecurity**  | BioSecurityImportData, BioSecurityCompliance, BioSecurityNonCompliance\*, BioSecurityCountry, etc.                   |
| **Agrifood**     | AgrifoodProduction, AgrifoodCompanyProfile, AgrifoodPremiseProfile, FoodSampling, SEFIRental, etc.                   |
| **Profiling**    | FarmerProfile, FarmProfile, CompanyStatus, ContractStatus, Machinery, ModernTechnology, etc.                         |
| **Retail Price** | RetailPrice, FruitRetailPrice, VegetableRetailPrice, MiscellaneousCropsRetailPrice, CropRetailPrice                  |
| **System**       | User, Notification, CPUUtilization, Test                                                                             |

### App (Frontend) Service

**Entry Point:** `services/app/server/index.js`

The App service is a custom Express server wrapping Next.js:

1. **API Proxy:** All `/api/*` requests are forwarded to the GraphQL service's `/graphql` endpoint
2. **SSR:** Next.js handles server-side rendering of React pages
3. **Static Files:** Express serves templates, cached files, and uploaded documents
4. **S3 Presigned URLs:** `/storage-presigned-url` endpoint for direct browser-to-S3 uploads
5. **Service Workers:** Firebase messaging service worker registration

**Page domains (144 pages across 20+ directories):**

- Dashboards (overall, agrifood, biosecurity, crops, livestock)
- Data entry forms (production data, retail prices, import data)
- Master data management (categories, units, locations, etc.)
- Entity profiling (companies, farms, farmers)
- User management and authentication

---

## Data Model

The Prisma schema (`services/graphql/prisma/schema.prisma`) defines **106 models** across these domains:

| Domain           | Key Models                                                          |
| ---------------- | ------------------------------------------------------------------- |
| **User & Auth**  | User, UserRole, ActivityLogs                                        |
| **Livestock**    | Livestock, LivestockCategory, LivestockCommodity, AnimalFeed        |
| **Poultry**      | Broiler, DayOldChick, FertilizedEgg, TableEgg, PoultryHouse         |
| **Ruminant**     | RuminantStock, RuminantProduction, RuminantPens                     |
| **Crops**        | CropsFruit, CropsVegetable, PaddyProduction, Season, FarmProfile    |
| **Floriculture** | CropsCutFlower, CropsOrnamentalPlant, CropsSellingLocation          |
| **BioSecurity**  | BioSecurityImportData, BioSecurityCompliance, BioSecurityCountry    |
| **Agrifood**     | AgrifoodProduction, AgrifoodProduct, ProductCatalogue, FoodSampling |
| **Retail Price** | RetailPrice, FruitRetailPrice, VegetableRetailPrice                 |
| **Profiling**    | FarmerProfile, FarmProfile, CompanyStatus, Machinery                |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (20+ for local dev)
- **Yarn** 1.x (classic)
- **MySQL** 8.0+ (or use Docker)
- **Redis** 7+ (or use Docker)
- **Docker** & **Docker Compose** (for containerized deployment)

### Local Development

```bash
# 1. Clone the repository
git clone git@github.com:arya020595/st_aims.git
cd st_aims

# 2. Install all dependencies (Yarn Workspaces)
yarn install

# 3. Configure environment
cp .env.example .env
cp .env.example services/graphql/.env
# Edit both .env files with your database credentials

# 4. Generate Prisma client
cd services/graphql && npx prisma generate && cd ../..

# 5. Run database migrations (if needed)
cd services/graphql && npx prisma db push && cd ../..

# 6. Start GraphQL service
cd services/graphql && node index.js
# → GraphQL server ready at http://localhost:4000/graphql

# 7. Start App service (separate terminal)
cd services/app && NODE_OPTIONS=--openssl-legacy-provider node server/index.js
# → Ready on http://localhost:3001
```

**Development mode (with auto-reload):**

```bash
# GraphQL (uses nodemon)
cd services/graphql && yarn graphql:dev

# App (uses nodemon for server, Next.js HMR for pages)
cd services/app && NODE_OPTIONS=--openssl-legacy-provider yarn app:dev
```

### Docker Deployment

```bash
# Build and start all services (MySQL, Redis, ClickHouse, GraphQL, App)
docker compose up --build -d

# Check service status
docker compose ps

# View logs
docker compose logs -f graphql app

# Stop all services
docker compose down

# Stop and remove volumes (⚠️ deletes data)
docker compose down -v
```

**Docker services:**

| Service     | Container       | Port(s)    | Image                        |
| ----------- | --------------- | ---------- | ---------------------------- |
| MySQL       | aims-mysql      | 3306       | mysql:8.0                    |
| Redis       | aims-redis      | 6379       | redis:7-alpine               |
| ClickHouse  | aims-clickhouse | 8123, 9000 | clickhouse/clickhouse-server |
| GraphQL API | aims-graphql    | 4000       | Custom (node:18-slim)        |
| App         | aims-app        | 3001       | Custom (node:18-slim)        |

---

## Environment Variables

All environment variables are documented in [`.env.example`](.env.example).

| Variable              | Service | Default     | Description                       |
| --------------------- | ------- | ----------- | --------------------------------- |
| `APP_PORT`            | App     | `3001`      | Frontend service port             |
| `GRAPHQL_API_HOST`    | App     | `localhost` | GraphQL service hostname          |
| `GRAPHQL_API_PORT`    | Both    | `4000`      | GraphQL service port              |
| `TOKENIZE`            | Both    | —           | JWT signing secret                |
| `DB_HOST`             | GraphQL | `localhost` | MySQL host                        |
| `DB_USER`             | GraphQL | `root`      | MySQL user                        |
| `DB_PASSWORD`         | GraphQL | —           | MySQL password                    |
| `DB_NAME`             | GraphQL | `doa_db`    | MySQL database name               |
| `DATABASE_URL`        | GraphQL | —           | Prisma connection string          |
| `REDIS_HOST`          | GraphQL | `localhost` | Redis host                        |
| `REDIS_PORT`          | GraphQL | `6379`      | Redis port                        |
| `CLICKHOUSE_URL`      | GraphQL | —           | ClickHouse HTTP URL               |
| `CLICKHOUSE_PORT`     | GraphQL | `8123`      | ClickHouse port                   |
| `S3_ACCESS_KEY`       | Both    | —           | AWS S3 access key (optional)      |
| `S3_SECRET_KEY`       | Both    | —           | AWS S3 secret key (optional)      |
| `S3_BUCKET_NAME`      | App     | —           | S3 bucket for file uploads        |
| `TELEGRAM_BOT_TOKEN`  | GraphQL | —           | Telegram notifications (optional) |
| `DISCORD_WEBHOOK_URL` | GraphQL | —           | Discord notifications (optional)  |

**Note:** Both services load the root `.env` file via `require("dotenv").config({ path: "../../.env" })`. The GraphQL service also reads `services/graphql/.env` for Prisma-specific variables (`DATABASE_URL`).

---

## API Documentation

Generate interactive API documentation using SpectaQL:

```bash
# Development mode (with live reload)
cd services/graphql && npx spectaql spectaql-config.yml -D

# Build static documentation
cd services/graphql && npx spectaql spectaql-config.yml
```

Access the GraphQL Playground (development mode only):

- http://localhost:4000/graphql

---

## Utility Scripts

Located in `services/graphql/utilities/`:

| Script                           | Usage                            | Description                      |
| -------------------------------- | -------------------------------- | -------------------------------- |
| `db-backup.js`                   | `yarn db:backup`                 | Full database backup             |
| `db-restore.js`                  | `yarn db:restore`                | Restore from backup              |
| `db-backup.js --minimal`         | `yarn db:backup:minimal`         | Minimal backup (structure only)  |
| `denormalize/*.js`               | `node utilities/denormalize/...` | Data denormalization for reports |
| `daily-cocoa-price-scheduler.js` | `node utilities/...`             | Scheduled cocoa price fetcher    |
| `countDataAllCollection.js`      | `node utilities/...`             | Count records across all tables  |

---

## License

MIT
