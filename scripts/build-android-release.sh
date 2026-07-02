#!/bin/bash
# Build signed Android release APK/AAB
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/mobile"

if ! grep -q "APP_MODE.*production" src/production.config.ts 2>/dev/null; then
  echo "WARNING: production.config.ts still in development mode."
  echo "         Set APP_MODE='production' before store release."
fi

GRADLE_PROPS="android/gradle.properties"
if [[ ! -f "$GRADLE_PROPS" ]] || ! grep -q "MEDIAFACE_UPLOAD_STORE_FILE" "$GRADLE_PROPS" 2>/dev/null; then
  echo "WARNING: No release keystore in android/gradle.properties"
  echo "         Copy android/gradle.properties.example and create a keystore."
  echo "         Release will use debug signing (not for Play Store)."
fi

echo "==> TypeScript check..."
npm run typecheck

echo "==> Building Android release APK..."
cd android
./gradlew assembleRelease

echo ""
echo "[OK] APK: android/app/build/outputs/apk/release/app-release.apk"
echo "     AAB: run npm run android:bundle for Play Store upload"
