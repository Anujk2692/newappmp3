import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {COLORS, RADIUS, SPACING} from '../config';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
  accentColor?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  accentColor = COLORS.primary,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[`${accentColor}40`, `${accentColor}12`]}
        style={styles.iconWrap}>
        <Icon name={icon} size={36} color={accentColor} />
      </LinearGradient>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity
          style={[styles.action, {backgroundColor: accentColor}]}
          onPress={onAction}
          activeOpacity={0.88}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: '800',
    marginBottom: SPACING.sm,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  action: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.lg,
  },
  actionText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
});
