import React, {useCallback, useState} from 'react';
import {
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {EmptyState} from '../../components/EmptyState';
import {api, FaceStatus, Person} from '../../api/client';
import {COLORS, SPACING} from '../../config';
import {FaceStackParamList} from '../../navigation/types';

type Nav = NativeStackNavigationProp<FaceStackParamList>;

export function FaceHomeScreen() {
  const navigation = useNavigation<Nav>();
  const [persons, setPersons] = useState<Person[]>([]);
  const [status, setStatus] = useState<FaceStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [personsRes, statusRes] = await Promise.allSettled([
        api.getPersons(),
        api.getFaceStatus(),
      ]);

      if (personsRes.status === 'fulfilled' && personsRes.value.success) {
        setPersons(personsRes.value.data || []);
      } else if (personsRes.status === 'rejected') {
        Alert.alert('Error', personsRes.reason?.message || 'Could not load people');
      }

      if (statusRes.status === 'fulfilled' && statusRes.value.success) {
        setStatus(statusRes.value.data);
      }
    } catch {
      Alert.alert('Error', 'Could not load face recognition data');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleDelete = (person: Person) => {
    Alert.alert('Remove person', `Delete ${person.name}?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await api.deletePerson(person.id);
            if (response.success) {
              load();
            } else {
              Alert.alert('Delete failed', response.message || 'Try again');
            }
          } catch {
            Alert.alert('Delete failed', 'Could not remove person');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A2E28', COLORS.background]} style={styles.hero}>
        <Icon name="scan-circle" size={48} color={COLORS.face} />
        <Text style={styles.heroTitle}>Face Recognition</Text>
        <Text style={styles.heroSubtitle}>
          Best accuracy with many people — partial faces and side angles supported
        </Text>
        <View style={[styles.statusBadge, status?.engineReady ? styles.statusOk : styles.statusBad]}>
          <Icon
            name={status?.engineReady ? 'checkmark-circle' : 'warning'}
            size={14}
            color={status?.engineReady ? COLORS.success : COLORS.warning}
          />
          <Text style={styles.statusText}>
            {status?.engineReady
              ? `Engine ready · ${status.registeredCount} registered`
              : status?.message || 'Checking engine...'}
          </Text>
        </View>
        <View style={styles.heroActions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('RegisterFace')}>
            <Icon name="person-add" size={18} color={COLORS.text} />
            <Text style={styles.primaryBtnText}>Register Face</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('IdentifyFace')}>
            <Icon name="camera" size={18} color={COLORS.face} />
            <Text style={styles.secondaryBtnText}>Identify</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <Text style={styles.sectionTitle}>Registered People</Text>

      <FlatList
        data={persons}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={COLORS.face} />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="people-outline"
              title="No faces registered yet"
              subtitle="Add reference photos to enable identification"
            />
          ) : null
        }
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.personCard}
            onPress={() =>
              navigation.navigate('PersonPhotos', {
                personId: item.id,
                personName: item.name,
              })
            }>
            {item.imageUrl ? (
              <Image
                source={{uri: api.getImageUrl(item.imageUrl)}}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Icon name="person" size={28} color={COLORS.textMuted} />
              </View>
            )}
            <View style={styles.personInfo}>
              <Text style={styles.personName}>{item.name}</Text>
              {(item.photoCount ?? 0) > 0 ? (
                <Text style={styles.photoCount}>
                  {item.photoCount} photo{item.photoCount === 1 ? '' : 's'}
                </Text>
              ) : null}
              {item.registeredViews && item.registeredViews.length > 0 ? (
                <Text style={styles.viewTags} numberOfLines={1}>
                  AI views: {[...new Set(item.registeredViews)].join(' · ')}
                </Text>
              ) : null}
              {item.notes ? (
                <Text style={styles.personNotes} numberOfLines={2}>
                  {item.notes}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={() => handleDelete(item)}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Icon name="trash-outline" size={20} color={COLORS.danger} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        contentContainerStyle={persons.length === 0 ? styles.emptyList : styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  hero: {
    padding: SPACING.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    marginTop: SPACING.sm,
  },
  heroSubtitle: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusOk: {
    borderColor: COLORS.success,
    backgroundColor: 'rgba(0, 212, 170, 0.12)',
  },
  statusBad: {
    borderColor: COLORS.warning,
    backgroundColor: 'rgba(255, 176, 32, 0.12)',
  },
  statusText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  heroActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.face,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 14,
  },
  primaryBtnText: {
    color: COLORS.background,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.face,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 14,
  },
  secondaryBtnText: {
    color: COLORS.face,
    fontWeight: '700',
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    padding: SPACING.md,
  },
  list: {
    paddingBottom: SPACING.xl,
  },
  emptyList: {
    flexGrow: 1,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surfaceLight,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  personInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  personName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  photoCount: {
    color: COLORS.face,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  viewTags: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  personNotes: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
});
