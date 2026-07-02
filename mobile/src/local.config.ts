/**
 * Network settings for iOS & Android.
 *
 * Simulator / emulator (default):
 *   USE_PHYSICAL_DEVICE = false
 *   - iOS Simulator  → localhost
 *   - Android Emulator → 10.0.2.2
 *
 * Physical device (same Wi‑Fi as your Mac):
 *   USE_PHYSICAL_DEVICE = true
 *   LAN_BACKEND_HOST = your Mac IP (run: ipconfig getifaddr en0)
 */
export const USE_PHYSICAL_DEVICE = true;

/** Your Mac's LAN IP — update if your network changes */
export const LAN_BACKEND_HOST = '192.168.0.105';
