import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {COLORS, SPACING} from '../config';

interface HeroHeaderProps {
  title: string;
  subtitle: string;
  icon?: string;
  colors?: [string, string];
  accentColor?: string;
  showBack?: boolean;
}

export function HeroHeader({
  title,
  subtitle,
  icon,
  colors = ['#1A1033', COLORS.background],
  accentColor = COLORS.primary,
  showBack = false,
}: HeroHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <LinearGradient
      colors={colors}
      style={[styles.wrap, {paddingTop: insets.top + SPACING.sm}]}>
      {showBack ? (
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
      ) : null}
      {icon ? (
        <View style={[styles.iconCircle, {borderColor: accentColor}]}>
          <Icon name={icon} size={28} color={accentColor} />
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
    marginLeft: -4,
    padding: 4,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
});
