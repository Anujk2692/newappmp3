#!/bin/bash
# Deploy MediaFace backend to production (Docker)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "ERROR: .env not found. Run: cp .env.example .env && edit secrets"
  exit 1
fi

# shellcheck disable=SC1091
source .env

if [[ -z "${API_KEY:-}" || "${API_KEY}" == "change-me-generate-with-openssl-rand-hex-32" ]]; then
  echo "ERROR: Set a real API_KEY in .env (openssl rand -hex 32)"
  exit 1
fi

if [[ -z "${MONGO_ROOT_PASSWORD:-}" || "${MONGO_ROOT_PASSWORD}" == "change-me-strong-password" ]]; then
  echo "ERROR: Set a strong MONGO_ROOT_PASSWORD in .env"
  exit 1
fi

echo "==> Building and starting production stack..."
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "==> Waiting for backend health..."
for i in $(seq 1 30); do
  if curl -sf "http://localhost:${BACKEND_PORT:-8080}/api/health" >/dev/null 2>&1; then
    echo "[OK] Backend is UP on port ${BACKEND_PORT:-8080}"
    curl -s "http://localhost:${BACKEND_PORT:-8080}/api/health"
    echo ""
    echo ""
    echo "Next steps:"
    echo "  1. HTTPS: set DOMAIN in .env, then:"
    echo "     docker compose -f docker-compose.prod.yml --profile https up -d"
    echo "  2. Mobile: edit mobile/src/production.config.ts"
    echo "     APP_MODE=production, PRODUCTION_API_URL=https://\$DOMAIN"
    echo "     PRODUCTION_API_KEY=\$API_KEY"
    echo "  3. Build release app: ./scripts/build-android-release.sh"
    exit 0
  fi
  sleep 4
done

echo "ERROR: Backend did not become healthy in time. Check: docker compose -f docker-compose.prod.yml logs backend"
exit 1
