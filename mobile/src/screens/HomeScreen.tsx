import React, {useCallback, useState} from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {useFocusEffect} from '@react-navigation/native';
import {AppHeader} from '../components/AppHeader';
import {FeatureCard} from '../components/FeatureCard';
import {SectionHeader} from '../components/SectionHeader';
import {StatTile} from '../components/StatTile';
import {api} from '../api/client';
import {COLORS, GRADIENTS, RADIUS, SPACING} from '../config';
import {useTheme} from '../context/ThemeContext';
import {
  goToCameraTab,
  goToFacesTab,
  goToMediaTab,
  openGuide,
  openSettings,
} from '../navigation/navigationRef';
import {useLayoutMetrics} from '../utils/layout';

interface DashboardStats {
  songs: number;
  videos: number;
  people: number;
  captures: number;
  serverOk: boolean;
}

const QUICK_SEARCHES = ['Bollywood hits', 'Lo-fi beats', 'Pop music', 'Music video HD'];

export function HomeScreen() {
  const {colors} = useTheme();
  const layout = useLayoutMetrics(true);
  const [stats, setStats] = useState<DashboardStats>({
    songs: 0,
    videos: 0,
    people: 0,
    captures: 0,
    serverOk: false,
  });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [health, audio, video, people, captures] = await Promise.allSettled([
      api.health(),
      api.getAudioLibrary(),
      api.getVideoLibrary(),
      api.getPersons(),
      api.getCaptures(),
    ]);

    setStats({
      serverOk: health.status === 'fulfilled' && health.value.success,
      songs: audio.status === 'fulfilled' ? audio.value.data?.length ?? 0 : 0,
      videos: video.status === 'fulfilled' ? video.value.data?.length ?? 0 : 0,
      people: people.status === 'fulfilled' ? people.value.data?.length ?? 0 : 0,
      captures: captures.status === 'fulfilled' ? captures.value.data?.length ?? 0 : 0,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <LinearGradient colors={GRADIENTS.media} style={styles.root}>
      <AppHeader
        title="MediaFace"
        subtitle="Your all-in-one media & AI hub"
        accentColor={colors.primary}
        rightIcon="book-outline"
        onRightPress={openGuide}
        showSettings
      />

      <ScrollView
        contentContainerStyle={[styles.content, {paddingBottom: layout.contentBottomPad}]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }>
        {/* Hero */}
        <LinearGradient
          colors={[`${colors.primary}40`, `${colors.accent}18`, 'transparent']}
          style={[styles.hero, {marginHorizontal: layout.hPad, padding: layout.isCompact ? SPACING.md : SPACING.lg}]}>
          <View style={styles.heroTop}>
            <View>
              <Text style={[styles.greeting, {fontSize: layout.font.sm}]}>Welcome back</Text>
              <Text style={[styles.heroTitle, {fontSize: layout.font.xl}]}>
                Search · Play · Capture · Recognize
              </Text>
            </View>
            <View
              style={[
                styles.serverPill,
                {backgroundColor: stats.serverOk ? `${colors.success}22` : `${colors.warning}22`},
              ]}>
              <View
                style={[
                  styles.serverDot,
                  {backgroundColor: stats.serverOk ? colors.success : colors.warning},
                ]}
              />
              <Text
                style={[
                  styles.serverText,
                  {color: stats.serverOk ? colors.success : colors.warning},
                ]}>
                {stats.serverOk ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <StatTile icon="musical-notes" label="Songs" value={stats.songs} accent={colors.audio} />
            <StatTile icon="videocam" label="Videos" value={stats.videos} accent={colors.video} />
            <StatTile icon="people" label="People" value={stats.people} accent={colors.face} />
            <StatTile icon="camera" label="Shots" value={stats.captures} accent={colors.camera} />
          </View>
        </LinearGradient>

        <SectionHeader title="Quick start" subtitle="One tap to any feature" />

        <View style={[styles.grid, {paddingHorizontal: layout.hPad, gap: layout.gap}]}>
          <FeatureCard
            icon="search"
            title="Search"
            subtitle="Stream or download any song or video"
            colors={[`${colors.primary}55`, `${colors.primary}18`]}
            accent={colors.primary}
            width={layout.halfGridWidth}
            onPress={() => goToMediaTab('SearchTab')}
          />
          <FeatureCard
            icon="library"
            title="Library"
            subtitle="Your saved music & HD videos"
            colors={[`${colors.audio}45`, `${colors.video}15`]}
            accent={colors.audio}
            badge={stats.songs + stats.videos > 0 ? String(stats.songs + stats.videos) : undefined}
            width={layout.halfGridWidth}
            onPress={() => goToMediaTab('AudioTab')}
          />
          <FeatureCard
            icon="camera"
            title="Camera"
            subtitle="Photo & video with GPS geotag"
            colors={[`${colors.camera}50`, `${colors.camera}15`]}
            accent={colors.camera}
            width={layout.halfGridWidth}
            onPress={goToCameraTab}
          />
          <FeatureCard
            icon="scan-circle"
            title="Face AI"
            subtitle="Identify people in photos & videos"
            colors={[`${colors.face}45`, `${colors.face}12`]}
            accent={colors.face}
            badge={stats.people > 0 ? String(stats.people) : undefined}
            width={layout.halfGridWidth}
            onPress={goToFacesTab}
          />
        </View>

        <SectionHeader
          title="Popular searches"
          subtitle="Tap to search instantly"
          actionLabel="All media"
          onAction={() => goToMediaTab('SearchTab')}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.chips, {paddingHorizontal: layout.hPad}]}>
          {QUICK_SEARCHES.map(q => (
            <TouchableOpacity
              key={q}
              style={[styles.chip, {borderColor: `${colors.primary}40`}]}
              onPress={() => goToMediaTab('SearchTab', q)}>
              <Icon name="flash" size={14} color={colors.primary} />
              <Text style={[styles.chipText, {color: colors.text}]}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <SectionHeader title="Power tools" subtitle="Everything this app can do" />

        <View style={[styles.list, {marginHorizontal: layout.hPad}]}>
          <PowerRow
            icon="play-circle"
            color={colors.primary}
            title="Stream anything"
            detail="Play audio or video instantly without downloading"
            onPress={() => goToMediaTab('SearchTab')}
          />
          <PowerRow
            icon="download"
            color={colors.audio}
            title="Offline library"
            detail="Save MP3 and HD video to watch anytime"
            onPress={() => goToMediaTab('AudioTab')}
          />
          <PowerRow
            icon="location"
            color={colors.camera}
            title="Geo camera"
            detail="Capture with GPS, EXIF tags, and cloud backup"
            onPress={goToCameraTab}
          />
          <PowerRow
            icon="images"
            color={colors.face}
            title="Library face scan"
            detail="Find people in group photos and video frames"
            onPress={goToFacesTab}
          />
          <PowerRow
            icon="color-palette"
            color={colors.accent}
            title="Themes & settings"
            detail="5 color themes, server status, full guide"
            onPress={openSettings}
          />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function PowerRow({
  icon,
  color,
  title,
  detail,
  onPress,
}: {
  icon: string;
  color: string;
  title: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.powerRow} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.powerIcon, {backgroundColor: `${color}22`}]}>
        <Icon name={icon} size={20} color={color} />
      </View>
      <View style={styles.powerText}>
        <Text style={styles.powerTitle}>{title}</Text>
        <Text style={styles.powerDetail}>{detail}</Text>
      </View>
      <Icon name="chevron-forward" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  content: {},
  hero: {
    marginTop: SPACING.sm,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  greeting: {
    color: COLORS.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  heroTitle: {
    color: COLORS.text,
    fontWeight: '800',
    letterSpacing: -0.4,
    maxWidth: 260,
    lineHeight: 28,
  },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.lg,
  },
  serverDot: {width: 7, height: 7, borderRadius: 4},
  serverText: {fontSize: 12, fontWeight: '800'},
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chips: {
    gap: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(26,26,36,0.85)',
    borderWidth: 1,
  },
  chipText: {fontWeight: '700', fontSize: 13},
  list: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(26,26,36,0.55)',
  },
  powerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  powerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  powerText: {flex: 1, minWidth: 0},
  powerTitle: {color: COLORS.text, fontWeight: '800', fontSize: 15},
  powerDetail: {color: COLORS.textMuted, fontSize: 12, fontWeight: '600', marginTop: 2, lineHeight: 17},
});
