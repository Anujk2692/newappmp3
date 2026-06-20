import React, {useCallback, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {api, PersonPhoto} from '../../api/client';
import {COLORS, SPACING} from '../../config';
import {FaceStackParamList} from '../../navigation/types';

type Props = NativeStackScreenProps<FaceStackParamList, 'PersonPhotos'>;

const PAGE_SIZE = 40;
const GRID_GAP = 2;
const NUM_COLUMNS = 3;
const TILE_SIZE =
  (Dimensions.get('window').width - GRID_GAP * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

export function PersonPhotosScreen({route}: Props) {
  const {personId, personName} = route.params;
  const [photos, setPhotos] = useState<PersonPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({scanned: 0, found: 0});
  const cancelScanRef = useRef(false);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getPersonPhotos(personId);
      if (response.success) {
        setPhotos(response.data || []);
      }
    } catch {
      Alert.alert('Error', 'Could not load photos');
    } finally {
      setLoading(false);
    }
  }, [personId]);

  useFocusEffect(
    useCallback(() => {
      loadPhotos();
    }, [loadPhotos]),
  );

  const requestLibraryPermission = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  const scanLibrary = async () => {
    const allowed = await requestLibraryPermission();
    if (!allowed) {
      Alert.alert('Permission needed', 'Allow photo library access to find old photos.');
      return;
    }

    Alert.alert(
      'Scan photo library',
      `Search your old photos for ${personName}? This may take a few minutes.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Start scan', onPress: () => runScan()},
      ],
    );
  };

  const runScan = async () => {
    cancelScanRef.current = false;
    setScanning(true);
    setScanProgress({scanned: 0, found: 0});

    let cursor: string | undefined;
    let scanned = 0;
    let found = 0;

    try {
      while (!cancelScanRef.current) {
        const page = await CameraRoll.getPhotos({
          first: PAGE_SIZE,
          after: cursor,
          assetType: 'Photos',
          include: ['filename', 'fileSize'],
        });

        if (page.edges.length === 0) {
          break;
        }

        for (const edge of page.edges) {
          if (cancelScanRef.current) {
            break;
          }

          const uri = edge.node.image.uri;
          const devicePhotoId = edge.node.id || uri;

          try {
            const response = await api.scanLibraryPhoto(
              personId,
              uri,
              devicePhotoId,
              edge.node.id,
            );
            if (response.success && response.data?.matched && response.data.saved) {
              found += 1;
            }
          } catch {
            // Skip unreadable photos and continue scanning.
          }

          scanned += 1;
          setScanProgress({scanned, found});
        }

        if (!page.page_info.has_next_page) {
          break;
        }
        cursor = page.page_info.end_cursor;
      }

      await loadPhotos();
      Alert.alert(
        'Scan complete',
        `Checked ${scanned} photos · found ${found} new match${found === 1 ? '' : 'es'}`,
      );
    } catch (error) {
      Alert.alert(
        'Scan failed',
        error instanceof Error ? error.message : 'Could not read photo library',
      );
    } finally {
      setScanning(false);
      cancelScanRef.current = false;
    }
  };

  const stopScan = () => {
    cancelScanRef.current = true;
  };

  const handleDeletePhoto = (photo: PersonPhoto) => {
    Alert.alert('Remove photo', 'Remove this photo from the album?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await api.deletePersonPhoto(photo.id);
            if (response.success) {
              setPhotos(current => current.filter(item => item.id !== photo.id));
            }
          } catch {
            Alert.alert('Error', 'Could not remove photo');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>
          {photos.length} photo{photos.length === 1 ? '' : 's'} of {personName}
        </Text>
        {scanning ? (
          <View style={styles.scanRow}>
            <ActivityIndicator color={COLORS.face} size="small" />
            <Text style={styles.scanText}>
              Scanning {scanProgress.scanned} · found {scanProgress.found}
            </Text>
            <TouchableOpacity style={styles.stopBtn} onPress={stopScan}>
              <Text style={styles.stopBtnText}>Stop</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.scanBtn} onPress={scanLibrary}>
            <Icon name="images-outline" size={18} color={COLORS.background} />
            <Text style={styles.scanBtnText}>Find more photos</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && photos.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.face} size="large" />
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={item => item.id}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={photos.length === 0 ? styles.emptyList : styles.grid}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <Icon name="images-outline" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No photos yet</Text>
                <Text style={styles.emptySubtitle}>
                  Tap “Find more photos” to scan your library like Google Photos
                </Text>
              </View>
            ) : null
          }
          renderItem={({item}) => (
            <TouchableOpacity
              style={styles.tile}
              onLongPress={() => handleDeletePhoto(item)}
              activeOpacity={0.85}>
              <Image
                source={{uri: api.getImageUrl(item.imageUrl)}}
                style={styles.tileImage}
              />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.face,
    paddingVertical: SPACING.md,
    borderRadius: 14,
  },
  scanBtnText: {
    color: COLORS.background,
    fontWeight: '700',
    fontSize: 15,
  },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  scanText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  stopBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stopBtnText: {
    color: COLORS.danger,
    fontWeight: '600',
  },
  grid: {
    padding: GRID_GAP,
  },
  emptyList: {
    flexGrow: 1,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    margin: GRID_GAP / 2,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    marginTop: 80,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
});
