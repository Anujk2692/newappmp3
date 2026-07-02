#!/bin/bash
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IP=$(ipconfig getifaddr en0 2>/dev/null || echo "unknown")

echo "======== MediaFace System Check ========"
echo "Mac IP: $IP (Bonjour auto-discovery — no IP config required)"
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
  HEALTH=$(curl -s http://localhost:8080/api/health)
  echo "$HEALTH"
  echo ""
  COOKIES=$(echo "$HEALTH" | python3 -c "import sys,json; m=json.load(sys.stdin).get('data',{}).get('media',{}); print(m.get('youtubeCookies','?'), m.get('playDownload','?'))" 2>/dev/null || echo "? ?")
  echo "[INFO] Mac backend cookies/play: $COOKIES (Mac play works without cookies on LAN)"
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
  echo "[WARN] Backend not reachable on LAN IP (check firewall / same Wi‑Fi)"
fi

if curl -sf --max-time 15 https://newappmp3.onrender.com/api/health >/dev/null 2>&1; then
  CLOUD=$(curl -s https://newappmp3.onrender.com/api/health)
  CLOUD_STATUS=$(echo "$CLOUD" | python3 -c "import sys,json; m=json.load(sys.stdin).get('data',{}).get('media',{}); print(m.get('youtubeCookies','?'), m.get('playDownload','?'))" 2>/dev/null || echo "? ?")
  echo "[OK] Render cloud — cookies/playDownload: $CLOUD_STATUS"
  if echo "$CLOUD_STATUS" | grep -q MISSING; then
    echo "[WARN] Cloud play needs YOUTUBE_COOKIES_BASE64 — run: ./scripts/export-youtube-cookies.sh"
  fi
else
  echo "[WARN] Render cloud unreachable (may be sleeping)"
fi

if curl -sf --max-time 3 http://localhost:8081/status >/dev/null; then
  echo "[OK] Metro :8081"
else
  echo "[WARN] Metro not running — run: cd mobile && npm start"
fi

echo ""
echo "Phone setup:"
echo "  • Same Wi‑Fi as Mac, Local Network enabled for MediaFace"
echo "  • Rebuild app after native changes: npx react-native run-ios --device"
echo "  • Optional manual IP override: mobile/src/local.config.ts (usually leave empty)"
echo "======================================="

exit $fail
