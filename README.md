# CRM Backend (Dristikon)

High-performance, secure, and scalable Node.js, Express, MongoDB, and Redis backend API for the Dristikon CRM platform.

---

## ⚡ Architecture & Performance Features

- **🛡️ Security & Hardening**:
  - `helmet` HTTP protection (CSP, HSTS, X-Content-Type-Options, hides `X-Powered-By`).
  - Rate limiting via `express-rate-limit` (strict limits on `/auth` to prevent brute force; general protection on `/api`).
  - Request body payload size caps (`50kb`) preventing memory exhaustion attacks.
  - Dual-token authentication (`accessToken` 15m + `refreshToken` 7d with revocation and token rotation).
- **🚀 High Throughput & Low Latency**:
  - `compression` middleware with automatic Gzip/Brotli payload compression.
  - `.lean()` unhydrated Mongoose queries for 3x–5x read acceleration.
  - Redis distributed caching with automatic cache invalidation on data mutation.
  - Standardized pagination on all collection endpoints (`?page=1&limit=50`).
- **🗄️ Database Optimization**:
  - Mongoose connection pooling (`maxPoolSize: 50`, `minPoolSize: 10`).
  - Indexes on all foreign keys, lookup fields, and timestamps (`consumerId`, `eventId`, `createdAt`, `role`).
  - Concurrency-safe atomic updates (`$inc`, `$gte`) preventing payment race conditions.
- **🔄 Resilience & Lifecycle**:
  - Graceful shutdown handlers for `SIGTERM` and `SIGINT` (drains HTTP requests, cleanly closes MongoDB & Redis connections).
  - Resilient Redis failover: if Redis is offline, requests seamlessly bypass to MongoDB without downtime.

---

## 🚀 Getting Started with Docker

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### 1. Start All Services (Backend + MongoDB + Redis)
From the project root or `dristikon_backend` directory, run:
```bash
docker compose up -d --build
```
This starts:
- **MongoDB** on `localhost:27017` (with persistent volume `mongo_data`)
- **Redis** on `localhost:6381` (with persistent volume `redis_data`)
- **Backend API** on `http://localhost:4000` (with live code reloading on edits)

### 2. Check Service Status
```bash
docker compose ps
```

### 3. View Logs
```bash
# All services
docker compose logs -f

# Backend only
docker compose logs -f backend

# Redis only
docker compose logs -f redis

# MongoDB only
docker compose logs -f mongo
```

### 4. Verify Health Endpoint
```bash
curl http://localhost:4000/api/v1/health
```

### 5. Stop Services
```bash
docker compose down
```
To stop and remove persistent database volumes:
```bash
docker compose down -v
```

---

## 💻 Running Locally (Without Docker Backend)

1. Start MongoDB and Redis:
   ```bash
   docker compose up -d mongo redis
   ```
2. Configure `.env`:
   Set `MONGOURI=mongodb://localhost:27017/dristikon_db` and `REDIS_HOST=localhost`, `REDIS_PORT=6381`.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start development server:
   ```bash
   npm run dev
   ```

---

## ⚙️ Environment Variables (`.env`)

| Variable | Description | Default in Docker | Default on Host |
| :--- | :--- | :--- | :--- |
| `PORT` | HTTP server port | `4000` | `4000` |
| `MONGOURI` | MongoDB connection URI | `mongodb://mongo:27017/dristikon_db` | `mongodb://localhost:27017/dristikon_db` |
| `REDIS_HOST` | Redis cache hostname | `redis` | `localhost` |
| `REDIS_PORT` | Redis cache port | `6379` | `6381` |
| `PLATFORM` | Morgan logger format | `dev` | `dev` |
| `NODEENV` | Node environment | `development` | `development` |
| `ACCESS_TOKEN_SECRET` | Secret key for access token | `dristikon_access_token_secret_key_2026` | `dristikon_access_token_secret_key_2026` |
| `ACCESS_TOKEN_EXPTIME`| Access token expiration | `15m` | `15m` |
| `REFRESH_TOKEN_SECRET`| Secret key for refresh token | `dristikon_refresh_token_secret_key_2026` | `dristikon_refresh_token_secret_key_2026` |
| `REFRESH_TOKEN_EXPTIME`| Refresh token expiration | `7d` | `7d` |
| `CLIENTURL` | Frontend origin for CORS | `http://localhost:5173` | `http://localhost:5173` |

---

## 📡 API Endpoints Overview

### Health
- `GET /api/v1/health`

### Authentication (Rate Limited)
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/signin`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/signout`

### Profile
- `GET /api/v1/profile/me`
- `GET /api/v1/profile?role=all&page=1&limit=20`
- `POST /api/v1/profile/new`
- `PATCH /api/v1/profile/update-password`
- `PATCH /api/v1/profile/update-profile`

### Consumers (Cached & Paginated)
- `POST /api/v1/consumer/new`
- `GET /api/v1/consumer/list?page=1&limit=50`
- `GET /api/v1/consumer/:id`
- `PATCH /api/v1/consumer/:id`
- `DELETE /api/v1/consumer/:id`

### Categories (Cached & Paginated)
- `POST /api/v1/category/new`
- `GET /api/v1/category/list?page=1&limit=50`
- `GET /api/v1/category/:id`
- `DELETE /api/v1/category/:id`

### Transactions (Atomic Decrement & Paginated)
- `POST /api/v1/transaction/new`
- `GET /api/v1/transaction/list?page=1&limit=50`
- `GET /api/v1/transaction/:id`

### Events (Cached & Paginated)
- `POST /api/v1/event/new`
- `GET /api/v1/event/list?page=1&limit=50`
- `GET /api/v1/event/:id`
