import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Video, {OnLoadData, OnProgressData, VideoRef} from 'react-native-video';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {COLORS, SPACING} from '../../config';
import {MediaStackParamList} from '../../navigation/types';
import {api} from '../../api/client';

type Props = NativeStackScreenProps<MediaStackParamList, 'Player'>;

function formatTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

interface PlayerControlsProps {
  currentTime: number;
  duration: number;
  paused: boolean;
  onSeek: (seconds: number) => void;
  onTogglePause: () => void;
  compact?: boolean;
}

function PlayerControls({
  currentTime,
  duration,
  paused,
  onSeek,
  onTogglePause,
  compact,
}: PlayerControlsProps) {
  const progress = duration > 0 ? currentTime / duration : 0;
  return (
    <View style={[styles.controlsSection, compact && styles.controlsCompact]}>
      <View style={styles.progressRow}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, {width: `${progress * 100}%`}]} />
        </View>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>
      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.skipBtn} onPress={() => onSeek(-10)}>
          <Icon name="play-back" size={compact ? 24 : 28} color={COLORS.text} />
          <Text style={styles.skipLabel}>10s</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.playBtn} onPress={onTogglePause}>
          <Icon name={paused ? 'play' : 'pause'} size={compact ? 32 : 36} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={() => onSeek(10)}>
          <Icon name="play-forward" size={compact ? 24 : 28} color={COLORS.text} />
          <Text style={styles.skipLabel}>10s</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function PlayerScreen({route}: Props) {
  const insets = useSafeAreaInsets();
  const {item, media, streamUrl} = route.params;
  const playable = media ?? (item ? {
    title: item.title,
    type: item.type,
    streamUrl,
    thumbnailUrl: item.thumbnailUrl,
    quality: item.quality,
  } : null);

  const videoRef = useRef<VideoRef>(null);
  const fullscreenVideoRef = useRef<VideoRef>(null);
  const [buffering, setBuffering] = useState(true);
  const [error, setError] = useState(false);
  const [downloading, setDownloading] = useState<'AUDIO' | 'VIDEO' | null>(null);
  const [streamKey, setStreamKey] = useState(0);
  const [paused, setPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenControls, setShowFullscreenControls] = useState(true);
  const [screen, setScreen] = useState(Dimensions.get('window'));

  const videoProps = {
    ignoreSilentSwitch: 'ignore' as const,
    playInBackground: true,
    playWhenInactive: true,
  };

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({window}) => setScreen(window));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!isFullscreen) {
      setShowFullscreenControls(true);
    }
  }, [isFullscreen]);

  const onLoad = (data: OnLoadData) => {
    setDuration(data.duration);
    setBuffering(false);
    setError(false);
  };

  const onProgress = (data: OnProgressData) => {
    setCurrentTime(data.currentTime);
  };

  const seekBy = useCallback((seconds: number) => {
    const next = Math.max(0, Math.min(duration || 0, currentTime + seconds));
    videoRef.current?.seek(next);
    fullscreenVideoRef.current?.seek(next);
    setCurrentTime(next);
  }, [currentTime, duration]);

  const enterFullscreen = () => {
    setIsFullscreen(true);
    setShowFullscreenControls(true);
  };

  const exitFullscreen = () => {
    setIsFullscreen(false);
    fullscreenVideoRef.current?.seek(currentTime);
  };

  if (!playable) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Nothing to play</Text>
      </View>
    );
  }

  const isVideo = playable.type === 'VIDEO';
  const isSearch = !!media;
  const isLandscape = screen.width > screen.height;

  const videoSource = {
    uri: streamUrl,
    type: (isVideo ? 'mp4' : 'm4a') as 'mp4' | 'm4a',
  };

  const inlineVideoWidth = screen.width - SPACING.md * 2;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isVideo ? ['#2A1033', COLORS.background] : ['#1A1033', COLORS.background]}
        style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.playerWrap}>
            {isVideo ? (
              <View>
                {buffering && (
                  <View style={styles.loader}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loaderText}>Loading video...</Text>
                  </View>
                )}
                <Video
                  ref={videoRef}
                  key={streamKey}
                  source={videoSource}
                  style={[styles.video, {width: inlineVideoWidth, height: inlineVideoWidth * 0.5625}]}
                  resizeMode="contain"
                  paused={paused || isFullscreen}
                  controls={false}
                  {...videoProps}
                  onLoad={onLoad}
                  onProgress={onProgress}
                  onBuffer={({isBuffering}) => setBuffering(isBuffering)}
                  onError={() => { setError(true); setBuffering(false); }}
                />
                <TouchableOpacity style={styles.fullscreenBtn} onPress={enterFullscreen}>
                  <Icon name="expand" size={22} color={COLORS.text} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.audioPlayer}>
                {playable.thumbnailUrl ? (
                  <Image source={{uri: playable.thumbnailUrl}} style={styles.artworkImage} />
                ) : (
                  <LinearGradient colors={[COLORS.audio, COLORS.primaryDark]} style={styles.artwork}>
                    <Icon name="musical-notes" size={72} color={COLORS.text} />
                  </LinearGradient>
                )}
                {buffering ? (
                  <ActivityIndicator color={COLORS.primary} style={styles.audioLoader} />
                ) : (
                  <Text style={styles.nowPlaying}>Now Playing</Text>
                )}
                <Video
                  ref={videoRef}
                  key={streamKey}
                  source={videoSource}
                  style={styles.hiddenVideo}
                  paused={paused}
                  controls={false}
                  {...videoProps}
                  onLoad={onLoad}
                  onProgress={onProgress}
                  onBuffer={({isBuffering}) => setBuffering(isBuffering)}
                  onError={() => { setError(true); setBuffering(false); }}
                />
              </View>
            )}
          </View>

          {!isFullscreen && (
            <PlayerControls
              currentTime={currentTime}
              duration={duration}
              paused={paused}
              onSeek={seekBy}
              onTogglePause={() => setPaused(p => !p)}
            />
          )}

          {error && (
            <View style={styles.errorBox}>
              <Icon name="alert-circle" size={22} color={COLORS.danger} />
              <Text style={styles.errorText}>
                Playback failed. Delete and re-download, or retry after backend restarts.
              </Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => {
                setError(false); setBuffering(true); setStreamKey(k => k + 1);
              }}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.meta}>
            <Text style={styles.title} numberOfLines={3}>{playable.title}</Text>
            <View style={styles.row}>
              <View style={[styles.chip, isVideo ? styles.videoChip : styles.audioChip]}>
                <Text style={styles.chipText}>{isVideo ? 'HD Video' : 'Audio'}</Text>
              </View>
              {playable.quality && (
                <View style={styles.chipOutline}>
                  <Text style={styles.chipOutlineText}>{playable.quality}</Text>
                </View>
              )}
            </View>
          </View>

          {isSearch && media?.videoId && (
            <View style={styles.downloadRow}>
              <TouchableOpacity
                style={[styles.downloadBtn, styles.audioDownload]}
                disabled={!!downloading}
                onPress={async () => {
                  if (!media.sourceUrl) return;
                  setDownloading('AUDIO');
                  try {
                    const response = await api.downloadMedia({
                      videoId: media.videoId!, title: media.title,
                      sourceUrl: media.sourceUrl, type: 'AUDIO',
                    });
                    Alert.alert(response.success ? 'Saved' : 'Failed',
                      response.success ? 'Audio added to library' : response.message || 'Download failed');
                  } catch (e) {
                    Alert.alert('Failed', e instanceof Error ? e.message : 'Download failed');
                  } finally { setDownloading(null); }
                }}>
                {downloading === 'AUDIO' ? <ActivityIndicator color={COLORS.audio} /> : (
                  <>
                    <Icon name="download-outline" size={20} color={COLORS.audio} />
                    <Text style={[styles.downloadText, {color: COLORS.audio}]}>Save Audio</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.downloadBtn, styles.videoDownload]}
                disabled={!!downloading}
                onPress={async () => {
                  if (!media.sourceUrl) return;
                  setDownloading('VIDEO');
                  try {
                    const response = await api.downloadMedia({
                      videoId: media.videoId!, title: media.title,
                      sourceUrl: media.sourceUrl, type: 'VIDEO',
                    });
                    Alert.alert(response.success ? 'Saved' : 'Failed',
                      response.success ? 'Video added to library' : response.message || 'Download failed');
                  } catch (e) {
                    Alert.alert('Failed', e instanceof Error ? e.message : 'Download failed');
                  } finally { setDownloading(null); }
                }}>
                {downloading === 'VIDEO' ? <ActivityIndicator color={COLORS.video} /> : (
                  <>
                    <Icon name="download-outline" size={20} color={COLORS.video} />
                    <Text style={[styles.downloadText, {color: COLORS.video}]}>Save Video</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </LinearGradient>

      {isVideo && (
        <Modal
          visible={isFullscreen}
          animationType="fade"
          supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
          onRequestClose={exitFullscreen}>
          <StatusBar hidden />
          <View style={styles.fullscreenRoot}>
            <TouchableOpacity
              style={styles.fullscreenTapArea}
              activeOpacity={1}
              onPress={() => setShowFullscreenControls(v => !v)}>
              <Video
                ref={fullscreenVideoRef}
                source={videoSource}
                style={styles.fullscreenVideo}
                resizeMode="contain"
                paused={paused}
                controls={false}
                {...videoProps}
                onLoad={(data) => {
                  onLoad(data);
                  fullscreenVideoRef.current?.seek(currentTime);
                }}
                onProgress={onProgress}
                onBuffer={({isBuffering}) => setBuffering(isBuffering)}
                onError={() => { setError(true); setBuffering(false); }}
              />
              {buffering && (
                <View style={styles.fullscreenLoader}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
              )}
            </TouchableOpacity>

            {showFullscreenControls && (
              <View style={[styles.fullscreenOverlay, {paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8}]}>
                <View style={styles.fullscreenTopBar}>
                  <TouchableOpacity style={styles.fullscreenClose} onPress={exitFullscreen}>
                    <Icon name="contract" size={24} color={COLORS.text} />
                  </TouchableOpacity>
                  <Text style={styles.fullscreenTitle} numberOfLines={1}>{playable.title}</Text>
                  {!isLandscape && (
                    <Text style={styles.rotateHint}>Rotate for landscape</Text>
                  )}
                </View>
                <View style={styles.fullscreenControlsWrap}>
                  <PlayerControls
                    currentTime={currentTime}
                    duration={duration}
                    paused={paused}
                    onSeek={seekBy}
                    onTogglePause={() => setPaused(p => !p)}
                    compact
                  />
                </View>
              </View>
            )}
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  gradient: {flex: 1},
  scrollContent: {padding: SPACING.md, paddingBottom: SPACING.xl},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background},
  playerWrap: {
    borderRadius: 24, overflow: 'hidden', backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
  },
  video: {backgroundColor: '#000'},
  fullscreenBtn: {
    position: 'absolute', bottom: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10,
    padding: 10, zIndex: 3,
  },
  loader: {
    ...StyleSheet.absoluteFill, zIndex: 2,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.65)',
  },
  loaderText: {color: COLORS.text, marginTop: SPACING.sm, fontSize: 13},
  audioPlayer: {padding: SPACING.xl, alignItems: 'center'},
  artwork: {
    width: 200, height: 200, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg,
  },
  artworkImage: {
    width: 200, height: 200, borderRadius: 24,
    marginBottom: SPACING.lg, backgroundColor: COLORS.surfaceLight,
  },
  nowPlaying: {color: COLORS.textSecondary, fontSize: 13, marginBottom: SPACING.sm},
  audioLoader: {marginBottom: SPACING.sm},
  hiddenVideo: {width: 1, height: 1, opacity: 0, position: 'absolute'},
  controlsSection: {
    marginTop: SPACING.lg, backgroundColor: COLORS.surface,
    borderRadius: 20, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border,
  },
  controlsCompact: {
    marginTop: 0, backgroundColor: 'rgba(26,26,36,0.92)', borderColor: 'rgba(255,255,255,0.12)',
  },
  progressRow: {flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.lg},
  timeText: {color: COLORS.textSecondary, fontSize: 12, width: 40, textAlign: 'center'},
  progressBg: {
    flex: 1, height: 6, borderRadius: 3, backgroundColor: COLORS.surfaceLight, overflow: 'hidden',
  },
  progressFill: {height: '100%', backgroundColor: COLORS.primary, borderRadius: 3},
  controlsRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xl},
  skipBtn: {alignItems: 'center', justifyContent: 'center', minWidth: 64},
  skipLabel: {color: COLORS.textMuted, fontSize: 11, marginTop: 2, fontWeight: '600'},
  playBtn: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  errorBox: {
    marginTop: SPACING.md, padding: SPACING.md, borderRadius: 16,
    backgroundColor: 'rgba(255, 92, 122, 0.12)', borderWidth: 1, borderColor: COLORS.danger,
    alignItems: 'center', gap: SPACING.sm,
  },
  errorText: {color: COLORS.danger, textAlign: 'center'},
  retryBtn: {
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    borderRadius: 10, backgroundColor: COLORS.surfaceLight,
  },
  retryText: {color: COLORS.text, fontWeight: '700'},
  meta: {marginTop: SPACING.lg},
  title: {color: COLORS.text, fontSize: 22, fontWeight: '800', lineHeight: 30},
  row: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.md},
  chip: {paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10},
  audioChip: {backgroundColor: 'rgba(124, 92, 255, 0.35)'},
  videoChip: {backgroundColor: 'rgba(255, 107, 157, 0.35)'},
  chipText: {color: COLORS.text, fontWeight: '700', fontSize: 12},
  chipOutline: {
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
  },
  chipOutlineText: {color: COLORS.textSecondary, fontSize: 12},
  downloadRow: {flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xl},
  downloadBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.lg, paddingHorizontal: SPACING.md,
    borderRadius: 16, borderWidth: 2, minHeight: 56,
  },
  audioDownload: {borderColor: COLORS.audio, backgroundColor: 'rgba(124, 92, 255, 0.12)'},
  videoDownload: {borderColor: COLORS.video, backgroundColor: 'rgba(255, 107, 157, 0.12)'},
  downloadText: {fontWeight: '800', fontSize: 14},
  fullscreenRoot: {flex: 1, backgroundColor: '#000'},
  fullscreenTapArea: {flex: 1},
  fullscreenVideo: {...StyleSheet.absoluteFillObject, backgroundColor: '#000'},
  fullscreenLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)',
  },
  fullscreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  fullscreenTopBar: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  fullscreenClose: {
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, padding: 10,
  },
  fullscreenTitle: {
    flex: 1, color: COLORS.text, fontWeight: '700', fontSize: 15,
  },
  rotateHint: {
    color: COLORS.textSecondary, fontSize: 11, fontWeight: '600',
  },
  fullscreenControlsWrap: {paddingHorizontal: SPACING.md},
});
