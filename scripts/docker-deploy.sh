#!/usr/bin/env bash

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}   🚀 Dristikon CRM - Local Docker Auto-Deploy & Hot Reload${NC}"
echo -e "${BLUE}======================================================${NC}\n"

# 1. Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}❌ Docker daemon is not running. Please start Docker Desktop and try again.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Docker daemon is running.${NC}"

# Navigate to script directory parent (dristikon_backend)
cd "$(dirname "$0")/.."

# 2. Build and launch containers
echo -e "\n${YELLOW}📦 Building images and starting local cluster (MongoDB, Redis, Apache Kafka, Backend)...${NC}"
docker compose up -d --build

# 3. Wait for backend service health
echo -e "\n${YELLOW}⏳ Waiting for backend API to pass health check...${NC}"
RETRIES=30
until curl -s http://localhost:4000/api/v1/health | grep -q "status" || [ $RETRIES -eq 0 ]; do
  echo -n "."
  sleep 2
  RETRIES=$((RETRIES - 1))
done

echo ""
if [ $RETRIES -eq 0 ]; then
  echo -e "${RED}❌ Backend health check timed out. Showing recent container logs:${NC}"
  docker compose logs --tail=40 backend
  exit 1
fi

echo -e "${GREEN}🎉 All services are healthy and running!${NC}"
echo -e "${GREEN}   - Backend API: http://localhost:4000/api/v1/health${NC}"
echo -e "${GREEN}   - MongoDB:     localhost:27017${NC}"
echo -e "${GREEN}   - Redis:       localhost:6381${NC}"
echo -e "${GREEN}   - Apache Kafka: localhost:9092 (Native KRaft Mode)${NC}\n"

echo -e "${BLUE}💡 Hot Reload is active: any edits inside 'src/' will instantly reload in the container.${NC}"
echo -e "${BLUE}💡 Docker Compose Watch is available: run 'npm run docker:watch' to auto-sync files.${NC}\n"

# Optional: Stream logs
if [ "$1" == "--logs" ] || [ "$1" == "-l" ]; then
  echo -e "${YELLOW}Streaming backend container logs (Ctrl+C to stop)...${NC}"
  docker compose logs -f backend
fi
