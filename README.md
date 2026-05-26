# Nexus Platform

> Enterprise-grade full-stack management dashboard built with Angular 17, Node.js, and MongoDB.

🌐 **Live Demo:** [https://nexus-platform-woad-kappa.vercel.app](https://nexus-platform-woad-kappa.vercel.app)
🔌 **API:** [https://nexus-platform-3xvo.onrender.com](https://nexus-platform-3xvo.onrender.com)
📖 **API Docs:** [https://nexus-platform-3xvo.onrender.com/api/docs](https://nexus-platform-3xvo.onrender.com/api/docs)

---

## Demo Credentials

| Role | User ID | Password |
|------|---------|----------|
| Administrator | `admin` | `Admin@123` |
| General User | `john.doe` | `User@123` |

---

## Overview

Nexus Platform is a production-quality internship assignment demonstrating enterprise-grade full-stack engineering. It features a modern dark SaaS-style UI, role-based access control, async delay simulation, reactive Angular architecture, and a clean TypeScript REST API.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 17 (Standalone), Angular Material, RxJS, SCSS |
| Backend | Node.js, Express.js, TypeScript |
| Database | MongoDB Atlas, Mongoose ODM |
| Auth | JWT (Access + Refresh tokens), bcryptjs |
| Docs | Swagger / OpenAPI 3.0 |
| Hosting | Vercel (Frontend), Render (Backend), MongoDB Atlas (DB) |

---

## Features

### Authentication
- JWT-based login with access and refresh token rotation
- Role selection at login (Admin / General User)
- Persistent sessions via localStorage
- Silent token refresh via Angular HTTP interceptor
- Protected routes with `authGuard` and `adminGuard`

### Dashboard
- Real-time analytics cards (total records, active tasks, completion rate)
- Priority and status breakdown charts
- Live activity feed (Admin)
- Week summary with quick-action shortcuts
- Skeleton loaders during async fetches

### Records Management
- Paginated, sortable, filterable data table
- Search across title and description
- Filter by status and priority
- Create / Edit records via dialog (Admin)
- CSV export
- Overdue date detection

### User Management (Admin only)
- Full CRUD — create, edit, deactivate, delete users
- Role assignment (promote/demote between Admin and User)
- User stats overview (total, active, admin count)
- Activity log tracking every action

### Profile
- View and edit personal details
- Account metadata (joined date, last login, department)

---

## Architecture

```text
nexus-platform/
├── backend/
│   └── src/
│       ├── config/         # DB, env, swagger
│       ├── controllers/    # Request handlers
│       ├── middleware/     # Auth, delay simulation, validators, error handling
│       ├── models/         # Mongoose schemas
│       ├── repositories/   # Data access layer
│       ├── routes/         # Express routers
│       ├── services/       # Business logic
│       ├── types/          # TypeScript interfaces
│       └── utils/          # Logger, response helpers, seed
│
└── frontend/
    └── src/app/
        ├── core/           # Guards, interceptors, services, models
        ├── shared/         # Shell layout, sidebar
        └── features/       # Auth, Dashboard, Records, Admin, Profile
```

---

## Key Engineering Decisions

- **Angular Signals** for reactive auth state — no NgRx overhead for this scale
- **4-layer backend** (Route → Controller → Service → Repository) for clean separation
- **Async delay simulation middleware** — configurable per-request via `x-simulate-delay` header
- **Retry interceptor** with exponential backoff on 502/503/504
- **Role enforcement at two levels** — backend middleware + frontend guards/templates
- **Standalone Angular components** — no NgModules, tree-shakable by default
- **Mongoose pre-save hooks** for password hashing, never stored plain text

---

## Security

- Passwords hashed with bcrypt (12 salt rounds)
- JWT access tokens (7d) + refresh tokens (30d)
- `express-mongo-sanitize` — NoSQL injection prevention
- `helmet` — secure HTTP headers
- CORS restricted to frontend origin
- Rate limiting — 100 requests / 15 min per IP
- Input validation on all mutation routes via `express-validator`

---

## API Reference

Full interactive docs at [`/api/docs`](https://nexus-platform-3xvo.onrender.com/api/docs)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/v1/auth/login` | Public | Login |
| GET | `/api/v1/auth/me` | Auth | Current user |
| GET | `/api/v1/users` | Admin | List users |
| POST | `/api/v1/users` | Admin | Create user |
| PUT | `/api/v1/users/:id` | Admin | Update user |
| DELETE | `/api/v1/users/:id` | Admin | Delete user |
| GET | `/api/v1/records` | Auth | List records (scoped by role) |
| POST | `/api/v1/records` | Admin | Create record |
| PUT | `/api/v1/records/:id` | Auth | Update record |
| DELETE | `/api/v1/records/:id` | Admin | Delete record |
| GET | `/api/v1/dashboard/analytics` | Auth | Dashboard data |
| GET | `/api/v1/dashboard/activity` | Admin | Activity logs |

---