#!/bin/bash
set -e

export JAVA_HOME="/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:/usr/local/bin:$PATH"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "============================================"
echo "  MediaFace - Full Stack Setup & Run"
echo "============================================"

# 1. Check MongoDB (Docker on port 27019 to avoid conflict with system MongoDB)
if nc -z localhost 27019 2>/dev/null; then
  echo "[OK] MongoDB on port 27019"
else
  echo "[..] Starting MongoDB..."
  cd "$ROOT" && docker compose up -d 2>/dev/null || echo "[!!] Start MongoDB manually: docker compose up -d"
fi

# 2. Check yt-dlp
if command -v yt-dlp &>/dev/null; then
  echo "[OK] yt-dlp $(yt-dlp --version)"
else
  echo "[!!] Installing yt-dlp..."
  brew install yt-dlp
fi

# 3. Build backend
echo "[..] Building backend..."
cd "$ROOT/backend"
mvn -q -DskipTests package
echo "[OK] Backend built"

# 4. Start backend in background
echo "[..] Starting backend..."
mvn spring-boot:run > "$ROOT/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$ROOT/.backend.pid"

for i in {1..30}; do
  if curl -s http://localhost:8080/api/health >/dev/null 2>&1; then
    echo "[OK] Backend running at http://localhost:8080 (PID $BACKEND_PID)"
    break
  fi
  sleep 2
  if [ $i -eq 30 ]; then
    echo "[!!] Backend failed to start. Check backend.log"
    tail -20 "$ROOT/backend.log"
    exit 1
  fi
done

echo ""
echo "============================================"
echo "  Ready! Run the mobile app:"
echo "  cd mobile && npx react-native run-ios"
echo "  cd mobile && npx react-native run-android"
echo ""
echo "  Stop backend: kill \$(cat .backend.pid)"
echo "============================================"
