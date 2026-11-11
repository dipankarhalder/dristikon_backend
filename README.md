# CRM Backend (Dristikon)

High-performance, secure, and scalable Node.js, Express, MongoDB, and Redis backend API for the Dristikon CRM platform.

---

## ⚡ Architecture & Performance Features

- **🛡️ Managed Security Controls (Production-Ready)**:
  - **NoSQL Injection Filter**: Recursive middleware automatically strips MongoDB injection keys (`$` or `.`) from body, query, and params.
  - **HTTP Security Headers (`helmet`)**: Comprehensive headers protecting against Clickjacking, MIME sniffing, and XSS.
  - **Redis-Backed Distributed Rate Limiting**: Strict threshold (5 attempts per 15 mins) on auth endpoints (`/auth/signin`, `/auth/signup`, `/auth/refresh`). Synced via `rate-limit-redis` and `ioredis`.
  - **Parameter Pollution Prevention (`hpp`)**: Filters duplicate query inputs and blocks parameter array injections.
  - **Strict ID Parameter Validation**: Validates route `:id` parameters against 24-character hex MongoDB ObjectId format with Mongoose `CastError` mapped to 400 Bad Request.
  - **Logging Anonymization (GDPR Compliance)**: Winston logger with `redactSensitiveData` filter censoring passwords, tokens, auth headers, and payment data.
  - **Body Payload Size Limit**: Strict 16kb payload capping on JSON and URL-encoded parsers preventing DoS.
  - **Server Cloaking**: Express framework signature (`X-Powered-By`) explicitly disabled.
  - **Secure Production Cookies**: Strict `httpOnly`, `secure` (production boolean), and `sameSite: 'strict'` configuration.
  - **Password Cryptography**: One-way bcrypt hashing with salt rounds (10) and regex complexity rules.
  - **Strict Mutation Rate Limiting**: 15 requests per minute ceiling on state-changing mutation routes (`POST`, `PATCH`, `DELETE`).
  - **RBAC (Role-Based Access Control)**: Route-level authorization (`super_admin`, `collaborator`, `staff`).
  - **Account Lockout Protection**: Automatically locks accounts for 15 minutes after 5 consecutive failed sign-in attempts.
  - **Token Blacklisting**: Immediate revocation of access tokens in Redis upon signout.
  - **Production Fail-Fast Secret Validation**: Startup crashes if production environment uses default development secrets.
- **⚡ Native Process Clustering**:
  - Utilizes Node.js native `cluster` module to auto-fork worker processes matching host CPU core count.
  - Primary master process monitors worker health and automatically respawns replacements upon unexpected exits.
  - Zero-downtime rolling terminations forwarding shutdown signals to child workers.
- **🚀 High-Performance Caching & Queues (10M Users scale)**:
  - **Redis Read-Through Caching**: Implemented `getOrSet()` caching pattern with randomized TTL jitter offsets to prevent cache stampede / thundering herd under massive concurrent load.
  - **Kafka Asynchronous Queue Broker**: Heavy write workloads (e.g. broadcast notifications) offloaded to background Kafka consumer workers.
  - **Constant Memory Cursor Streams**: Uses MongoDB Cursor Streams (`cursor()`) processed in chunks of 1,000 users to maintain constant O(1) memory boundaries even with 10M+ users.
- **☸️ Kubernetes Deployment Orchestration (`deploy/k8s/`)**:
  - **Autoscaling (HPA)**: Horizontal Pod Autoscaler scaling application instances dynamically up to 10 replicas when CPU usage exceeds 70%.
  - **Credential Separation**: Sensitive secrets and non-sensitive configurations cleanly decoupled into Kubernetes Secrets and ConfigMaps.
  - **Persistence (PVC)**: Allocates Persistent Volume Claims for Redis state (`redis-data-pvc`), Kafka logs (`kafka-data-pvc`), and uploaded files (`uploads-data-pvc`).
  - **Ingress Routing**: Production Ingress manifest configured with TLS termination and automated HTTP-to-HTTPS SSL redirects.
- **⚓ Git Hook Validations (Husky Hooks)**:
  - **Pre-commit Checks**: Runs `npm run security-check` (verifying production dependency safety and code-level security controls) before a commit is saved.
  - **Pre-push Checks**: Runs all tests (`npm test`) before pushing code to the remote repository.
  - **Commit-msg Validation**: Validates that commit messages follow `<prefix>(optional-scope): <description>`.
    - Allowed Prefixes: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `hotfix`, `err`, `revert`.
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

## 🚀 Getting Started with Docker (Auto-Deploy & Hot Reload)

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### Option A: One-Command Auto-Deploy Script

From `dristikon_backend/`:

```bash
./scripts/docker-deploy.sh --logs
```

This builds and launches MongoDB, Redis, Kafka, Zookeeper, and the Backend, waits for health checks to pass, and streams logs.

### Option B: Docker Compose Watch (Official Auto-Sync & Rebuild)

Runs the cluster and activates Docker Compose Watch to auto-sync source edits into the container and auto-rebuild if `package.json` changes:

```bash
npm run docker:watch
# or: docker compose up --watch
```

### Option C: Standard Background Up

```bash
npm run docker:up
# or: docker compose up -d --build
```

This starts:

- **Backend API** on `http://localhost:4000` (with live nodemon hot reload on any file save)
- **MongoDB** on `localhost:27017` (with persistent volume `mongo_data`)
- **Redis** on `localhost:6381` (with persistent volume `redis_data`)
- **Apache Kafka** on `localhost:9092` (Official Apache image in native KRaft mode, zero ZooKeeper required)

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

| Variable                | Description                  | Default in Docker                         | Default on Host                           |
| :---------------------- | :--------------------------- | :---------------------------------------- | :---------------------------------------- |
| `PORT`                  | HTTP server port             | `4000`                                    | `4000`                                    |
| `MONGOURI`              | MongoDB connection URI       | `mongodb://mongo:27017/dristikon_db`      | `mongodb://localhost:27017/dristikon_db`  |
| `REDIS_HOST`            | Redis cache hostname         | `redis`                                   | `localhost`                               |
| `REDIS_PORT`            | Redis cache port             | `6379`                                    | `6381`                                    |
| `PLATFORM`              | Morgan logger format         | `dev`                                     | `dev`                                     |
| `NODEENV`               | Node environment             | `development`                             | `development`                             |
| `ACCESS_TOKEN_SECRET`   | Secret key for access token  | `dristikon_access_token_secret_key_2026`  | `dristikon_access_token_secret_key_2026`  |
| `ACCESS_TOKEN_EXPTIME`  | Access token expiration      | `15m`                                     | `15m`                                     |
| `REFRESH_TOKEN_SECRET`  | Secret key for refresh token | `dristikon_refresh_token_secret_key_2026` | `dristikon_refresh_token_secret_key_2026` |
| `REFRESH_TOKEN_EXPTIME` | Refresh token expiration     | `7d`                                      | `7d`                                      |
| `CLIENTURL`             | Frontend origin for CORS     | `http://localhost:5173`                   | `http://localhost:5173`                   |

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
