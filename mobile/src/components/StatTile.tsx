import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {COLORS, RADIUS, SPACING} from '../config';
import {useLayoutMetrics} from '../utils/layout';

interface StatTileProps {
  icon: string;
  label: string;
  value: string | number;
  accent: string;
}

export function StatTile({icon, label, value, accent}: StatTileProps) {
  const layout = useLayoutMetrics(true);

  return (
    <View style={[styles.tile, {borderColor: `${accent}35`}]}>
      <View
        style={[
          styles.iconWrap,
          {
            width: layout.isCompact ? 24 : 28,
            height: layout.isCompact ? 24 : 28,
            borderRadius: layout.isCompact ? 12 : 14,
            backgroundColor: `${accent}20`,
          },
        ]}>
        <Icon name={icon} size={layout.isCompact ? 14 : 16} color={accent} />
      </View>
      <Text style={[styles.value, {color: accent, fontSize: layout.font.lg}]}>{value}</Text>
      <Text style={[styles.label, {fontSize: layout.font.xs}]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    backgroundColor: 'rgba(26,26,36,0.65)',
    gap: 4,
    minWidth: 0,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  label: {
    color: COLORS.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
