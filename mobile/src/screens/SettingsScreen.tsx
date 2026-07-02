import React, {useCallback, useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {AppHeader} from '../components/AppHeader';
import {useTheme} from '../context/ThemeContext';
import {api} from '../api/client';
import {getApiBaseUrl, isProductionMode, RADIUS, SHADOW, SPACING} from '../config';
import {THEME_LIST, ThemeId} from '../theme/themes';
import {openGuide, goToCameraTab, goToFacesTab, goToMediaTab} from '../navigation/navigationRef';
import {useLayoutMetrics} from '../utils/layout';

export function SettingsScreen() {
  const layout = useLayoutMetrics(false);
  const navigation = useNavigation();
  const {themeId, setThemeId, colors, gradients} = useTheme();
  const [serverOk, setServerOk] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      api.health().then(r => setServerOk(r.success)).catch(() => setServerOk(false));
    }, []),
  );

  return (
    <LinearGradient colors={gradients.media} style={styles.root}>
      <AppHeader
        title="Settings"
        subtitle="Theme · Server · Guide"
        showBack
        onBack={() => navigation.goBack()}
        accentColor={colors.primary}
      />

      <ScrollView
        contentContainerStyle={[styles.content, {padding: layout.hPad, paddingBottom: layout.contentBottomPad}]}
        showsVerticalScrollIndicator={false}>
        {/* Server status */}
        <View style={[styles.statusCard, {borderColor: colors.border}]}>
          <View style={styles.statusRow}>
            <Icon
              name={serverOk ? 'cloud-done' : 'cloud-offline'}
              size={22}
              color={serverOk ? colors.success : colors.warning}
            />
            <View style={styles.statusText}>
              <Text style={[styles.statusTitle, {color: colors.text}]}>
                {serverOk === null
                  ? 'Checking server…'
                  : serverOk
                    ? 'Cloud server connected'
                    : 'Server unreachable'}
                {isProductionMode() ? ' · Live' : ' · Dev'}
              </Text>
              <Text style={[styles.statusUrl, {color: colors.textMuted}]} numberOfLines={1}>
                {getApiBaseUrl()}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick links */}
        <Text style={[styles.sectionTitle, {color: colors.text}]}>Jump to feature</Text>
        <View style={styles.linkGrid}>
          <LinkChip icon="search" label="Search" color={colors.primary} onPress={() => goToMediaTab('SearchTab')} />
          <LinkChip icon="musical-notes" label="Music" color={colors.audio} onPress={() => goToMediaTab('AudioTab')} />
          <LinkChip icon="videocam" label="Videos" color={colors.video} onPress={() => goToMediaTab('VideoTab')} />
          <LinkChip icon="camera" label="Camera" color={colors.camera} onPress={goToCameraTab} />
          <LinkChip icon="scan" label="Faces" color={colors.face} onPress={goToFacesTab} />
          <LinkChip icon="book" label="Guide" color={colors.accent} onPress={openGuide} />
        </View>

        <Text style={[styles.sectionTitle, {color: colors.text, marginTop: SPACING.lg}]}>Color theme</Text>
        <Text style={[styles.sectionHint, {color: colors.textMuted}]}>
          Applies across Home, Media, Camera, and Faces.
        </Text>

        <View style={styles.themeGrid}>
          {THEME_LIST.map(theme => {
            const active = theme.id === themeId;
            return (
              <TouchableOpacity
                key={theme.id}
                style={[
                  styles.themeCard,
                  {borderColor: active ? theme.swatch : colors.border},
                  active && {backgroundColor: `${theme.swatch}18`},
                ]}
                activeOpacity={0.88}
                onPress={() => setThemeId(theme.id as ThemeId)}>
                <View style={[styles.swatch, {backgroundColor: theme.swatch}]}>
                  {active ? <Icon name="checkmark" size={18} color="#fff" /> : null}
                </View>
                <Text style={[styles.themeName, {color: colors.text}]}>{theme.name}</Text>
                <View style={styles.dots}>
                  {[theme.colors.primary, theme.colors.face, theme.colors.camera].map(c => (
                    <View key={c} style={[styles.dot, {backgroundColor: c}]} />
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function LinkChip({
  icon,
  label,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.linkChip, {borderColor: `${color}40`}]} onPress={onPress}>
      <Icon name={icon} size={18} color={color} />
      <Text style={styles.linkLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  content: {},
  statusCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    backgroundColor: 'rgba(26,26,36,0.85)',
    marginBottom: SPACING.lg,
    ...SHADOW.sm,
  },
  statusRow: {flexDirection: 'row', alignItems: 'center', gap: SPACING.md},
  statusText: {flex: 1, minWidth: 0},
  statusTitle: {fontWeight: '800', fontSize: 15},
  statusUrl: {fontSize: 12, fontWeight: '600', marginTop: 2},
  sectionTitle: {fontSize: 18, fontWeight: '800', marginBottom: 4},
  sectionHint: {fontSize: 13, fontWeight: '600', marginBottom: SPACING.md},
  linkGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm},
  linkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    backgroundColor: 'rgba(26,26,36,0.7)',
    minWidth: '30%',
    flexGrow: 1,
  },
  linkLabel: {color: '#fff', fontWeight: '700', fontSize: 13},
  themeGrid: {gap: SPACING.sm},
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    backgroundColor: 'rgba(26,26,36,0.85)',
    ...SHADOW.sm,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeName: {flex: 1, fontWeight: '700', fontSize: 15},
  dots: {flexDirection: 'row', gap: 6},
  dot: {width: 10, height: 10, borderRadius: 5},
});
