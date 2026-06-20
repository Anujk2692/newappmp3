import {Platform} from 'react-native';
import {LAN_BACKEND_HOST, USE_PHYSICAL_DEVICE} from './local.config';

function resolveBackendHost(): string {
  if (USE_PHYSICAL_DEVICE) {
    return LAN_BACKEND_HOST;
  }
  return Platform.select({
    android: '10.0.2.2',
    ios: 'localhost',
    default: 'localhost',
  })!;
}

export const API_BASE_URL = `http://${resolveBackendHost()}:8080`;

export const COLORS = {
  background: '#0F0F14',
  surface: '#1A1A24',
  surfaceLight: '#252533',
  primary: '#7C5CFF',
  primaryDark: '#5B3FD9',
  accent: '#00D4AA',
  text: '#FFFFFF',
  textSecondary: '#A0A0B8',
  textMuted: '#6B6B80',
  border: '#2E2E3E',
  danger: '#FF5C7A',
  success: '#00D4AA',
  warning: '#FFB020',
  audio: '#7C5CFF',
  video: '#FF6B9D',
  face: '#00D4AA',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
