import React, {useCallback, useState} from 'react';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {SearchBar} from '../../components/SearchBar';
import {MediaCard, formatDuration} from '../../components/MediaCard';
import {EmptyState} from '../../components/EmptyState';
import {api, MediaSearchResult, PlayableMedia} from '../../api/client';
import {COLORS, SPACING} from '../../config';
import {MediaStackParamList} from '../../navigation/types';

type Nav = NativeStackNavigationProp<MediaStackParamList>;

export function SearchScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [preparing, setPreparing] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<Record<string, 'AUDIO' | 'VIDEO'>>({});
  const [playing, setPlaying] = useState<Record<string, 'AUDIO' | 'VIDEO'>>({});

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      return;
    }
    setLoading(true);
    try {
      const response = await api.searchMedia(query.trim());
      if (response.success) {
        setResults(response.data || []);
      } else {
        Alert.alert('Search failed', response.message || 'Try again');
      }
    } catch {
      Alert.alert('Connection error', 'Make sure backend is running on port 8080');
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handlePlay = async (item: MediaSearchResult, type: 'AUDIO' | 'VIDEO') => {
    setPlaying(prev => ({...prev, [item.videoId]: type}));
    setPreparing(`${type}:${item.videoId}`);
    try {
      const response = await api.preparePlayUrl(item.videoId, type);
      if (!response.success || !response.data?.streamUrl) {
        Alert.alert('Playback failed', response.message || 'Could not prepare media');
        return;
      }

      const media: PlayableMedia = {
        title: item.title,
        type,
        streamUrl: api.getStreamUrl(response.data.streamUrl),
        thumbnailUrl: item.thumbnailUrl,
        quality: response.data.quality || (type === 'AUDIO' ? item.audioFormat : item.videoFormat),
        sourceUrl: item.sourceUrl,
        videoId: item.videoId,
      };

      const parent = navigation.getParent<Nav>();
      (parent ?? navigation).navigate('Player', {media, streamUrl: media.streamUrl});
    } catch (e) {
      Alert.alert(
        'Playback failed',
        e instanceof Error ? e.message : 'Stream could not start. Try downloading instead.',
      );
    } finally {
      setPreparing(null);
      setPlaying(prev => {
        const next = {...prev};
        delete next[item.videoId];
        return next;
      });
    }
  };

  const handleDownload = async (item: MediaSearchResult, type: 'AUDIO' | 'VIDEO') => {
    setDownloading(prev => ({...prev, [item.videoId]: type}));
    try {
      const response = await api.downloadMedia({
        videoId: item.videoId,
        title: item.title,
        sourceUrl: item.sourceUrl,
        type,
      });
      if (response.success) {
        Alert.alert(
          'Download complete',
          type === 'AUDIO'
            ? 'Audio saved to your Audio library'
            : 'Video saved to your Videos library',
        );
      } else {
        Alert.alert('Download failed', response.message || 'Try again');
      }
    } catch (e) {
      Alert.alert('Download failed', e instanceof Error ? e.message : 'Check backend and yt-dlp');
    } finally {
      setDownloading(prev => {
        const next = {...prev};
        delete next[item.videoId];
        return next;
      });
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A1033', COLORS.background]}
        style={[styles.header, {paddingTop: insets.top + SPACING.sm}]}>
        <Text style={styles.headerTitle}>Search Any Song</Text>
        <Text style={styles.headerSubtitle}>
          Play audio & HD video instantly, or save to your library
        </Text>
      </LinearGradient>

      <SearchBar
        value={query}
        onChangeText={setQuery}
        onSearch={handleSearch}
        loading={loading}
        placeholder="Search any song, artist, music video..."
      />

      <FlatList
        data={results}
        keyExtractor={item => item.videoId}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleSearch} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="search-outline"
              title="Search any song on Google"
              subtitle="Play MP3 or HD video instantly, or download to your library"
            />
          ) : null
        }
        renderItem={({item}) => (
          <MediaCard
            title={item.title}
            subtitle={
              item.durationSeconds
                ? `${item.channel} · ${formatDuration(item.durationSeconds)}`
                : item.channel
            }
            thumbnailUrl={item.thumbnailUrl}
            audioFormat={item.audioFormat}
            videoFormat={item.videoFormat}
            mode="search"
            downloading={downloading[item.videoId] || null}
            playing={playing[item.videoId] || null}
            onPlayAudio={() => handlePlay(item, 'AUDIO')}
            onPlayVideo={() => handlePlay(item, 'VIDEO')}
            onDownloadAudio={() => handleDownload(item, 'AUDIO')}
            onDownloadVideo={() => handleDownload(item, 'VIDEO')}
          />
        )}
        contentContainerStyle={results.length === 0 ? styles.emptyList : undefined}
      />

      <Modal transparent visible={!!preparing} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Icon name="hourglass-outline" size={32} color={COLORS.primary} />
            <Text style={styles.modalTitle}>Preparing playback...</Text>
            <Text style={styles.modalSub}>This may take 1–2 minutes on first play</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  header: {paddingHorizontal: SPACING.md, paddingBottom: SPACING.md},
  headerTitle: {color: COLORS.text, fontSize: 26, fontWeight: '800'},
  headerSubtitle: {color: COLORS.textSecondary, fontSize: 14, marginTop: SPACING.xs, lineHeight: 20},
  emptyList: {flexGrow: 1},
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 280,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitle: {color: COLORS.text, fontSize: 18, fontWeight: '700', marginTop: SPACING.md},
  modalSub: {color: COLORS.textSecondary, marginTop: SPACING.xs, textAlign: 'center'},
});
