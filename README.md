# Nexus Platform

> Enterprise-grade full-stack management dashboard — Angular 17 · Node.js · MongoDB

[![Angular](https://img.shields.io/badge/Angular-17-red?logo=angular)](https://angular.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue?logo=typescript)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-20-green?logo=node.js)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green?logo=mongodb)](https://www.mongodb.com)

---

## Overview

Nexus Platform is a production-quality internship assignment project demonstrating enterprise-grade full-stack engineering across the entire MEAN-adjacent stack. It features a dark SaaS-style UI, role-based access control, configurable async delay simulation, reactive Angular architecture, and a clean TypeScript Express API.

---

## Architecture

```
nexus-platform/
├── backend/                   # Express + TypeScript API
│   └── src/
│       ├── config/            # DB, env, swagger setup
│       ├── controllers/       # Thin request handlers
│       ├── middleware/        # Auth, delay simulation, error handling, validators
│       ├── models/            # Mongoose schemas (User, Record, ActivityLog)
│       ├── repositories/      # Data access layer (query logic)
│       ├── routes/            # Express routers with JSDoc annotations
│       ├── services/          # Business logic layer
│       ├── types/             # Shared TypeScript types
│       └── utils/             # Logger, API response helpers, seed script
│
├── frontend/                  # Angular 17 standalone app
│   └── src/app/
│       ├── core/
│       │   ├── guards/        # authGuard, adminGuard, publicGuard
│       │   ├── interceptors/  # JWT Auth interceptor + exponential-backoff retry
│       │   ├── models/        # Shared TypeScript interfaces
│       │   └── services/      # AuthService (signals), API services, ToastService
│       ├── shared/
│       │   └── components/    # Shell layout, Sidebar navigation
│       └── features/
│           ├── auth/          # Login page (lazy-loaded)
│           ├── dashboard/     # Analytics overview (lazy-loaded)
│           ├── records/       # Data table with filtering/sorting (lazy-loaded)
│           ├── admin/         # User management CRUD (lazy-loaded, admin-only)
│           └── profile/       # User profile view/edit (lazy-loaded)
│
├── docker-compose.yml
└── README.md
```

---

## Tech Stack

| Layer        | Technology                                              |
|--------------|---------------------------------------------------------|
| Frontend     | Angular 17 (standalone), Angular Material, RxJS, SCSS  |
| Backend      | Node.js, Express.js, TypeScript                         |
| Database     | MongoDB 7, Mongoose ODM                                 |
| Auth         | JWT (access + refresh tokens), bcryptjs                 |
| Docs         | Swagger / OpenAPI 3.0                                   |
| DevOps       | Docker, Docker Compose, Nginx                           |

---

## Quick Start (Local)

### Prerequisites
- Node.js 18+
- MongoDB running locally (or MongoDB Atlas URI)
- npm 9+

### 1. Clone & install dependencies

```bash
git clone <repo-url>
cd nexus-platform

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
```

### 3. Seed the database

```bash
cd backend
npm run seed
```

This creates:
- **Admin**: `userId: admin` | `password: Admin@123`
- **User**: `userId: john.doe` | `password: User@123`
- 50 realistic records across 8 users

### 4. Run both servers

```bash
# Terminal 1 — backend (port 5000)
cd backend && npm run dev

# Terminal 2 — frontend (port 4200)
cd frontend && npm start
```

Open `http://localhost:4200` and log in with demo credentials.

---

## Docker (Full Stack)

```bash
# Build and start all services (MongoDB, Backend, Frontend)
docker-compose up --build

# Seed data (once containers are running)
docker exec nexus_backend node dist/utils/seed.js
```

Services:
- Frontend: `http://localhost:4200`
- Backend API: `http://localhost:5000/api/v1`
- Swagger Docs: `http://localhost:5000/api/docs`

---

## Authentication Flow

```
1. User submits userId + password + role → POST /api/v1/auth/login
2. Backend validates credentials via bcrypt.compare()
3. Role mismatch → 403 Forbidden
4. On success → returns { user, tokens: { accessToken, refreshToken } }
5. Frontend persists tokens in localStorage via AuthService (Angular signals)
6. All subsequent requests carry Bearer token via AuthInterceptor
7. On 401 response → AuthInterceptor attempts silent token refresh
8. On refresh failure → automatic logout + redirect to /auth/login
9. Route guards (authGuard, adminGuard) protect all feature routes
```

---

## API Documentation

Swagger UI: `http://localhost:5000/api/docs`

### Auth Endpoints

| Method | Route                   | Auth | Description           |
|--------|-------------------------|------|-----------------------|
| POST   | /api/v1/auth/login      | No   | Login                 |
| POST   | /api/v1/auth/refresh    | No   | Refresh access token  |
| GET    | /api/v1/auth/me         | Yes  | Get current user      |
| POST   | /api/v1/auth/logout     | Yes  | Logout                |

### User Endpoints (Admin only)

| Method | Route              | Description           |
|--------|--------------------|-----------------------|
| GET    | /api/v1/users      | List users (paginated)|
| GET    | /api/v1/users/:id  | Get user by ID        |
| POST   | /api/v1/users      | Create user           |
| PUT    | /api/v1/users/:id  | Update user           |
| DELETE | /api/v1/users/:id  | Delete user           |
| GET    | /api/v1/users/stats| User statistics       |

### Record Endpoints

| Method | Route                | Auth     | Description              |
|--------|----------------------|----------|--------------------------|
| GET    | /api/v1/records      | Any      | List records (scoped by role)|
| GET    | /api/v1/records/:id  | Any      | Get record               |
| POST   | /api/v1/records      | Admin    | Create record            |
| PUT    | /api/v1/records/:id  | Any      | Update record            |
| DELETE | /api/v1/records/:id  | Admin    | Delete record            |

### Dashboard Endpoints

| Method | Route                       | Auth  | Description         |
|--------|-----------------------------|-------|---------------------|
| GET    | /api/v1/dashboard/analytics | Any   | Dashboard analytics |
| GET    | /api/v1/dashboard/activity  | Admin | Activity logs       |

---

## Async Processing Simulation

A configurable delay middleware (`simulateDelay`) is applied to all authenticated routes.

**Configure via environment:**
```env
API_MIN_DELAY=200   # minimum delay in ms
API_MAX_DELAY=800   # maximum delay in ms (random between min/max)
```

**Per-request override (header):**
```
x-simulate-delay: 2000
```

**Frontend response:**
- Skeleton loaders shown while API is pending
- `MatProgressBar` for table loading states
- `finalize()` RxJS operator ensures consistent load state cleanup
- Retry interceptor with exponential backoff on 502/503/504

---

## Role-Based Access Control

| Feature                  | User | Admin |
|--------------------------|------|-------|
| View own records         | ✅   | ✅    |
| View all records         | ❌   | ✅    |
| Create records           | ❌   | ✅    |
| Edit own assigned records| ✅   | ✅    |
| Delete records           | ❌   | ✅    |
| View dashboard analytics | ✅   | ✅    |
| View activity logs       | ❌   | ✅    |
| Manage users (CRUD)      | ❌   | ✅    |
| Assign user roles        | ❌   | ✅    |
| Access /admin route      | ❌   | ✅    |

RBAC is enforced at **two levels**:
1. **Backend** — `authorize('admin')` middleware on routes, service-layer ownership checks
2. **Frontend** — `adminGuard` route guard, `*ngIf="isAdmin()"` in templates

---

## Security Implementation

- Passwords hashed with **bcrypt** (12 salt rounds)
- **JWT** access tokens (7d) + refresh tokens (30d)
- **express-mongo-sanitize** prevents NoSQL injection
- **helmet** sets security headers
- **cors** restricts origins
- **express-rate-limit** — 100 req / 15 min per IP
- Input validation via **express-validator** on all mutation routes
- TypeScript strict mode on both frontend and backend

---

## Frontend Architecture Highlights

- **Angular 17 standalone components** — no NgModules
- **Angular Signals** for auth state (`AuthService` uses `signal()` and `computed()`)
- **Lazy-loaded feature routes** — each feature is a separate chunk
- **Smart/Dumb component pattern** — container components own data, presentational handle display
- **RxJS best practices** — `takeUntil` with `Subject` for subscriptions, `finalize` for cleanup
- **HTTP interceptor chain** — auth token injection + retry with exponential backoff
- **Reactive forms** with comprehensive validators
- Custom SCSS design system with CSS custom properties (dark theme)

---

## MongoDB Setup

### Local
```bash
# Install MongoDB Community
brew install mongodb-community  # macOS
# or follow: https://www.mongodb.com/docs/manual/installation/

# Start MongoDB
brew services start mongodb-community

# Default URI (matches .env.example)
MONGO_URI=mongodb://localhost:27017/nexus_platform
```

### Atlas (Cloud)
1. Create cluster at https://cloud.mongodb.com
2. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/nexus_platform`
3. Set in `.env` as `MONGO_URI`

---

## Project Evaluation Checklist

| Criteria                        | Implementation                                     |
|---------------------------------|----------------------------------------------------|
| Angular architecture            | Standalone, lazy-loaded, guards, interceptors, signals |
| TypeScript quality              | Strict mode, interfaces, generics throughout       |
| Async processing                | Delay simulation, skeletons, retry, finalize       |
| API handling                    | Paginated, filtered, sorted; full error handling   |
| MongoDB integration             | Mongoose schemas, indexes, virtuals, aggregation   |
| UI creativity                   | Custom dark SaaS design, animations, responsive    |
| Code cleanliness                | Controller → Service → Repository layering         |
| Scalability                     | Feature modules, env config, Docker-ready          |
| Engineering maturity            | Proper error handling, activity logs, validation   |

---

## License

MIT
