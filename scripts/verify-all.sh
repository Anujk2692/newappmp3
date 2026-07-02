#!/bin/bash
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IP=$(ipconfig getifaddr en0 2>/dev/null || echo "unknown")

echo "======== MediaFace System Check ========"
echo "Mac IP: $IP"
echo ""

fail=0

if nc -z localhost 27019 2>/dev/null; then
  echo "[OK] MongoDB :27019"
else
  echo "[FAIL] MongoDB — run: docker compose up -d"
  fail=1
fi

if curl -sf --max-time 5 http://localhost:8080/api/health >/dev/null; then
  echo "[OK] Backend http://localhost:8080"
  curl -s http://localhost:8080/api/health
  echo ""
  if curl -sf --max-time 5 http://localhost:8080/api/captures >/dev/null; then
    echo "[OK] Captures API /api/captures"
  else
    echo "[FAIL] Captures API — restart backend after camera module changes"
    fail=1
  fi
else
  echo "[FAIL] Backend — run: cd backend && mvn spring-boot:run"
  fail=1
fi

if curl -sf --max-time 5 "http://${IP}:8080/api/health" >/dev/null 2>&1; then
  echo "[OK] Backend LAN http://${IP}:8080"
else
  echo "[WARN] Backend not reachable on LAN IP (phone may fail)"
fi

if curl -sf --max-time 3 http://localhost:8081/status >/dev/null; then
  echo "[OK] Metro :8081"
else
  echo "[WARN] Metro not running — run: cd mobile && npm start"
fi

echo ""
echo "Update mobile/src/local.config.ts:"
echo "  LAN_BACKEND_HOST = '$IP'"
echo "Update mobile/ios/.xcode.env.local:"
echo "  REACT_NATIVE_PACKAGER_HOSTNAME=$IP"
echo "======================================="

exit $fail
