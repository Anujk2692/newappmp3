import React, {useCallback, useState} from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {MediaCard} from '../../components/MediaCard';
import {EmptyState} from '../../components/EmptyState';
import {api, MediaItem} from '../../api/client';
import {COLORS} from '../../config';
import {MediaStackParamList} from '../../navigation/types';

type Nav = NativeStackNavigationProp<MediaStackParamList>;

interface Props {
  type: 'AUDIO' | 'VIDEO';
}

export function LibraryScreen({type}: Props) {
  const navigation = useNavigation<Nav>();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response =
        type === 'AUDIO'
          ? await api.getAudioLibrary()
          : await api.getVideoLibrary();
      if (response.success) {
        setItems(response.data || []);
      }
    } catch {
      Alert.alert('Error', 'Could not load library. Is backend running?');
    } finally {
      setLoading(false);
    }
  }, [type]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleDelete = (item: MediaItem) => {
    Alert.alert('Delete', `Remove "${item.title}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await api.deleteMedia(item.id);
            if (response.success) {
              load();
            } else {
              Alert.alert('Delete failed', response.message || 'Try again');
            }
          } catch {
            Alert.alert('Delete failed', 'Could not remove item');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon={type === 'AUDIO' ? 'musical-notes-outline' : 'videocam-outline'}
              title={type === 'AUDIO' ? 'No downloaded songs' : 'No downloaded videos'}
              subtitle={
                type === 'AUDIO'
                  ? 'Search and download MP3 files to see them here'
                  : 'Search and download videos to see them here'
              }
            />
          ) : null
        }
        renderItem={({item}) => (
          <MediaCard
            title={item.title}
            subtitle={item.quality}
            thumbnailUrl={item.thumbnailUrl}
            mode="library"
            type={item.type}
            onPlay={() => {
              const parent = navigation.getParent<Nav>();
              (parent ?? navigation).navigate('Player', {
                item,
                streamUrl: api.getStreamUrl(item.streamUrl),
              });
            }}
            onDelete={() => handleDelete(item)}
          />
        )}
        contentContainerStyle={items.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  emptyList: {
    flexGrow: 1,
  },
});
