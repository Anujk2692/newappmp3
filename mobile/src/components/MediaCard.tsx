import React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {COLORS, SPACING} from '../config';

interface MediaCardProps {
  title: string;
  subtitle?: string;
  thumbnailUrl?: string;
  audioFormat?: string;
  videoFormat?: string;
  onPlayAudio?: () => void;
  onPlayVideo?: () => void;
  onPlay?: () => void;
  onDownloadAudio?: () => void;
  onDownloadVideo?: () => void;
  onDelete?: () => void;
  downloading?: 'AUDIO' | 'VIDEO' | null;
  playing?: 'AUDIO' | 'VIDEO' | null;
  mode?: 'search' | 'library';
  type?: 'AUDIO' | 'VIDEO';
}

function formatDuration(seconds?: number) {
  if (!seconds) {
    return '';
  }
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function MediaCard({
  title,
  subtitle,
  thumbnailUrl,
  audioFormat,
  videoFormat,
  onPlayAudio,
  onPlayVideo,
  onPlay,
  onDownloadAudio,
  onDownloadVideo,
  onDelete,
  downloading,
  playing,
  mode = 'search',
  type,
}: MediaCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.main}>
        <Image source={{uri: thumbnailUrl}} style={styles.thumbnail} />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
          {mode === 'search' && (audioFormat || videoFormat) && (
            <View style={styles.formatRow}>
              {audioFormat ? (
                <View style={[styles.badge, styles.audioBadge]}>
                  <Icon name="musical-notes" size={11} color={COLORS.text} />
                  <Text style={styles.badgeText}>{audioFormat}</Text>
                </View>
              ) : null}
              {videoFormat ? (
                <View style={[styles.badge, styles.videoBadge]}>
                  <Icon name="videocam" size={11} color={COLORS.text} />
                  <Text style={styles.badgeText}>{videoFormat}</Text>
                </View>
              ) : null}
            </View>
          )}
          {type && mode === 'library' && (
            <View style={[styles.badge, type === 'AUDIO' ? styles.audioBadge : styles.videoBadge]}>
              <Icon
                name={type === 'AUDIO' ? 'musical-notes' : 'videocam'}
                size={12}
                color={COLORS.text}
              />
              <Text style={styles.badgeText}>{type === 'AUDIO' ? 'Audio' : 'Video'}</Text>
            </View>
          )}
        </View>
      </View>

      {mode === 'search' && (
        <>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={onPlayAudio}
              disabled={!!playing}>
              <LinearGradient
                colors={['#5B3FD9', COLORS.audio]}
                style={styles.gradientBtn}>
                {playing === 'AUDIO' ? (
                  <ActivityIndicator color={COLORS.text} size="small" />
                ) : (
                  <>
                    <Icon name="play" size={20} color={COLORS.text} />
                    <Text style={styles.actionText}>Play Audio</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={onPlayVideo}
              disabled={!!playing}>
              <LinearGradient
                colors={['#D94A7A', COLORS.video]}
                style={styles.gradientBtn}>
                {playing === 'VIDEO' ? (
                  <ActivityIndicator color={COLORS.text} size="small" />
                ) : (
                  <>
                    <Icon name="play-circle" size={20} color={COLORS.text} />
                    <Text style={styles.actionText}>Play Video</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={onDownloadAudio}
              disabled={!!downloading}>
              <View style={[styles.outlineBtn, styles.audioOutline]}>
                {downloading === 'AUDIO' ? (
                  <ActivityIndicator color={COLORS.audio} size="small" />
                ) : (
                  <>
                    <Icon name="download-outline" size={20} color={COLORS.audio} />
                    <Text style={[styles.actionText, styles.audioText]}>Download Audio</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={onDownloadVideo}
              disabled={!!downloading}>
              <View style={[styles.outlineBtn, styles.videoOutline]}>
                {downloading === 'VIDEO' ? (
                  <ActivityIndicator color={COLORS.video} size="small" />
                ) : (
                  <>
                    <Icon name="download-outline" size={20} color={COLORS.video} />
                    <Text style={[styles.actionText, styles.videoText]}>Download Video</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </>
      )}

      {mode === 'library' && (
        <View style={styles.libraryFooter}>
          <TouchableOpacity style={styles.playLibraryBtn} onPress={onPlay}>
            <Icon name="play" size={16} color={COLORS.text} />
            <Text style={styles.playLibraryText}>Play</Text>
          </TouchableOpacity>
          {onDelete && (
            <TouchableOpacity style={styles.deleteLibraryBtn} onPress={onDelete}>
              <Icon name="trash-outline" size={18} color={COLORS.danger} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

export {formatDuration};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  main: {
    flexDirection: 'row',
    padding: SPACING.md,
    alignItems: 'center',
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
  },
  info: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  title: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  formatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: SPACING.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  audioBadge: {
    backgroundColor: 'rgba(124, 92, 255, 0.25)',
  },
  videoBadge: {
    backgroundColor: 'rgba(255, 107, 157, 0.25)',
  },
  badgeText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '600',
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  actionBtn: {
    flex: 1,
  },
  gradientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 14,
    minHeight: 54,
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 2,
    minHeight: 54,
  },
  audioOutline: {
    borderColor: COLORS.audio,
    backgroundColor: 'rgba(124, 92, 255, 0.08)',
  },
  videoOutline: {
    borderColor: COLORS.video,
    backgroundColor: 'rgba(255, 107, 157, 0.08)',
  },
  actionText: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 14,
  },
  audioText: {
    color: COLORS.audio,
  },
  videoText: {
    color: COLORS.video,
  },
  libraryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  playLibraryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    minHeight: 54,
  },
  playLibraryText: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 14,
  },
  deleteLibraryBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 92, 122, 0.1)',
  },
});
