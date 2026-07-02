#!/bin/bash
set -e

export JAVA_HOME="/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:/usr/local/bin:$PATH"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Environment"
echo "Java: $(java -version 2>&1 | head -1)"
echo "yt-dlp: $(yt-dlp --version 2>/dev/null || echo 'NOT INSTALLED')"
echo "MongoDB: checking port 27019..."

if command -v docker &>/dev/null; then
  if docker ps --format '{{.Names}}' | grep -q mediaface-mongo; then
    echo "MongoDB container: running"
  elif nc -z localhost 27019 2>/dev/null; then
    echo "MongoDB: available on localhost:27019"
  else
    echo "Starting MongoDB container..."
    cd "$ROOT" && docker compose up -d || true
  fi
fi

echo "==> Starting backend on http://localhost:8080"
if [[ -n "${SPRING_PROFILES_ACTIVE:-}" ]]; then
  echo "    Profile: ${SPRING_PROFILES_ACTIVE}"
fi
cd "$ROOT/backend"
mvn spring-boot:run
