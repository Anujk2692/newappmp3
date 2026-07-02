#!/bin/bash
# Build iOS release archive (requires Xcode + Apple Developer account)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/mobile"

if ! grep -q "APP_MODE.*production" src/production.config.ts 2>/dev/null; then
  echo "WARNING: production.config.ts still in development mode."
fi

echo "==> TypeScript check..."
npm run typecheck

echo "==> Installing pods..."
cd ios && pod install

echo ""
echo "==> Open Xcode to archive and upload:"
echo "    open ios/MediaFaceApp.xcworkspace"
echo ""
echo "In Xcode:"
echo "  1. Select 'Any iOS Device' as destination"
echo "  2. Product → Archive"
echo "  3. Distribute App → App Store Connect"
echo ""
echo "Before submit:"
echo "  - Add App Icon (1024×1024) in Images.xcassets/AppIcon"
echo "  - Set production.config.ts APP_MODE + HTTPS URL + API_KEY"
echo "  - Configure signing team in Signing & Capabilities"

open ios/MediaFaceApp.xcworkspace 2>/dev/null || true
