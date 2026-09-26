# CRM Backend (Dristikon)

Node.js, Express, and MongoDB backend API for the Dristikon CRM platform.

---

## 🚀 Getting Started with Docker

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### 1. Start Services (Backend + MongoDB)
From the project root or `dristikon_backend` directory, run:
```bash
docker compose up -d --build
```
This starts:
- **MongoDB** on `localhost:27017` (with persistent volume `mongo_data`)
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

# MongoDB only
docker compose logs -f mongo
```

### 4. Verify Health Endpoint
```bash
curl http://localhost:4000/api/v1/health
```
Response:
```json
{"status":200,"msg":"API health good, working as expected."}
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

If you wish to run MongoDB in Docker and the backend directly on your host machine:

1. Start only MongoDB:
   ```bash
   docker compose up -d mongo
   ```
2. Configure `.env`:
   Ensure `MONGOURI` is set to `mongodb://localhost:27017/dristikon_db`.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start development server:
   ```bash
   npm run dev
   ```

---

## 📦 Updating npm Packages

- **Safe update (minor/patch releases within current ranges)**:
  ```bash
  npm update
  ```
- **Major version upgrades (e.g. Express 5, Mongoose 9)**:
  ```bash
  npx npm-check-updates -u
  npm install
  ```

---

## ⚙️ Environment Variables (`.env`)

| Variable | Description | Default in Docker | Default on Host |
| :--- | :--- | :--- | :--- |
| `PORT` | HTTP server port | `4000` | `4000` |
| `MONGOURI` | MongoDB connection URI | `mongodb://mongo:27017/dristikon_db` | `mongodb://localhost:27017/dristikon_db` |
| `PLATFORM` | Morgan logger format | `dev` | `dev` |
| `NODEENV` | Node environment | `development` | `development` |
| `ACCESS_TOKEN_SECRET` | Secret key for access token | `dristikon_access_token_secret_key_2026` | `dristikon_access_token_secret_key_2026` |
| `ACCESS_TOKEN_EXPTIME`| Access token expiration | `15m` | `15m` |
| `REFRESH_TOKEN_SECRET`| Secret key for refresh token | `dristikon_refresh_token_secret_key_2026` | `dristikon_refresh_token_secret_key_2026` |
| `REFRESH_TOKEN_EXPTIME`| Refresh token expiration | `7d` | `7d` |
| `CLIENTURL` | Frontend origin for CORS | `http://localhost:5173` | `http://localhost:5173` |

---

## 📡 API Endpoints Overview

- **Health Check**: `GET /api/v1/health`
- **Auth**:
  - `POST /api/v1/auth/signup`
  - `POST /api/v1/auth/signin` (Returns `accessToken`, `refreshToken`, and `token`)
  - `POST /api/v1/auth/refresh` (Refreshes and rotates `accessToken` and `refreshToken`)
  - `POST /api/v1/auth/signout`
- **Profile**:
  - `GET /api/v1/profile/me`
  - `GET /api/v1/profile`
  - `POST /api/v1/profile/new`
  - `PATCH /api/v1/profile/update-password`
  - `PATCH /api/v1/profile/update-profile`
- **Consumers**:
  - `POST /api/v1/consumer/new`
  - `GET /api/v1/consumer/list`
  - `GET /api/v1/consumer/:id`
  - `PATCH /api/v1/consumer/:id`
  - `DELETE /api/v1/consumer/:id`
- **Categories**:
  - `POST /api/v1/category/new`
  - `GET /api/v1/category/list`
  - `GET /api/v1/category/:id`
  - `DELETE /api/v1/category/:id`
- **Transactions**:
  - `POST /api/v1/transaction/new`
  - `GET /api/v1/transaction/list`
  - `GET /api/v1/transaction/:id`
- **Events**:
  - `POST /api/v1/event/new`
  - `GET /api/v1/event/list`
  - `GET /api/v1/event/:id`
