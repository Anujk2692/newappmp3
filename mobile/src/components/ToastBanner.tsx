import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {COLORS, RADIUS, SHADOW, SPACING} from '../config';

interface ToastBannerProps {
  visible: boolean;
  message: string;
  icon?: string;
  accentColor?: string;
  bottomOffset?: number;
}

export function ToastBanner({
  visible,
  message,
  icon = 'checkmark-circle',
  accentColor = COLORS.success,
  bottomOffset = 100,
}: ToastBannerProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {toValue: 1, duration: 220, useNativeDriver: true}),
        Animated.spring(translateY, {toValue: 0, useNativeDriver: true, friction: 8}),
      ]).start();
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {toValue: 0, duration: 180, useNativeDriver: true}),
      Animated.timing(translateY, {toValue: 16, duration: 180, useNativeDriver: true}),
    ]).start();
  }, [visible, message, opacity, translateY]);

  if (!visible && message.length === 0) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        {bottom: bottomOffset, opacity, transform: [{translateY}]},
      ]}>
      <View style={[styles.banner, SHADOW.md]}>
        <Icon name={icon} size={18} color={accentColor} />
        <Text style={styles.text} numberOfLines={2}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 50,
    alignItems: 'center',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(22,22,32,0.94)',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    maxWidth: 340,
  },
  text: {
    flex: 1,
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 13,
  },
});
