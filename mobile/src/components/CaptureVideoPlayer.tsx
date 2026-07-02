import React, {useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import Video from 'react-native-video';
import {COLORS, RADIUS} from '../config';

interface CaptureVideoPlayerProps {
  uri: string;
  fileName?: string;
  height: number;
}

export function CaptureVideoPlayer({uri, fileName, height}: CaptureVideoPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ext = fileName?.toLowerCase() ?? uri.toLowerCase();
  const sourceType = ext.includes('.mov') ? ('mp4' as const) : undefined;

  return (
    <View style={[styles.wrap, {height}]}>
      <Video
        source={sourceType ? {uri, type: sourceType} : {uri}}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
        controls
        ignoreSilentSwitch="ignore"
        playWhenInactive={false}
        onLoad={() => {
          setLoading(false);
          setError(null);
        }}
        onError={e => {
          setLoading(false);
          setError(e.error?.errorString || e.error?.localizedDescription || 'Video failed to load');
        }}
        onBuffer={({isBuffering}) => setLoading(isBuffering)}
      />
      {loading ? (
        <View style={styles.overlay}>
          <ActivityIndicator color={COLORS.camera} size="large" />
          <Text style={styles.hint}>Loading video…</Text>
        </View>
      ) : null}
      {error ? (
        <View style={styles.overlay}>
          <Text style={styles.errorTitle}>Cannot play video</Text>
          <Text style={styles.errorSub}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: '#000',
    overflow: 'hidden',
    borderRadius: RADIUS.lg,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: 16,
  },
  hint: {color: COLORS.textSecondary, marginTop: 10, fontWeight: '600'},
  errorTitle: {color: COLORS.danger, fontWeight: '800', fontSize: 16},
  errorSub: {color: COLORS.textSecondary, marginTop: 6, textAlign: 'center', fontSize: 13},
});
