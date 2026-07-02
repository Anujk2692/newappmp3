import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {COLORS, RADIUS} from '../config';

interface FaceScanOverlayProps {
  active?: boolean;
  label?: string;
  accent?: string;
  size?: number;
}

export function FaceScanOverlay({
  active = false,
  label = 'Align face in frame',
  accent = COLORS.face,
  size = 240,
}: FaceScanOverlayProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const scan = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      pulse.setValue(0);
      scan.setValue(0);
      return;
    }
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
        Animated.timing(pulse, {toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
      ]),
    );
    const scanLoop = Animated.loop(
      Animated.timing(scan, {toValue: 1, duration: 2200, easing: Easing.linear, useNativeDriver: true}),
    );
    pulseLoop.start();
    scanLoop.start();
    return () => {
      pulseLoop.stop();
      scanLoop.stop();
    };
  }, [active, pulse, scan]);

  const ringScale = pulse.interpolate({inputRange: [0, 1], outputRange: [1, 1.06]});
  const scanY = scan.interpolate({inputRange: [0, 1], outputRange: [0, size - 4]});

  return (
    <View style={[styles.wrap, {width: size, height: size}]} pointerEvents="none">
      <Animated.View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: accent,
            transform: [{scale: active ? ringScale : 1}],
            opacity: active ? 0.95 : 0.7,
          },
        ]}
      />
      <View style={[styles.corner, styles.tl, {borderColor: accent}]} />
      <View style={[styles.corner, styles.tr, {borderColor: accent}]} />
      <View style={[styles.corner, styles.bl, {borderColor: accent}]} />
      <View style={[styles.corner, styles.br, {borderColor: accent}]} />
      {active ? (
        <Animated.View
          style={[
            styles.scanLine,
            {backgroundColor: accent, width: size * 0.72, transform: [{translateY: scanY}]},
          ]}
        />
      ) : null}
      <View style={styles.centerIcon}>
        <Icon name="scan-circle" size={28} color={accent} />
      </View>
      <Text style={[styles.label, {color: accent}]}>{label}</Text>
    </View>
  );
}

const CORNER = 22;

const styles = StyleSheet.create({
  wrap: {alignItems: 'center', justifyContent: 'center'},
  ring: {
    position: 'absolute',
    borderWidth: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderWidth: 3,
  },
  tl: {top: 8, left: 8, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: RADIUS.sm},
  tr: {top: 8, right: 8, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: RADIUS.sm},
  bl: {bottom: 28, left: 8, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: RADIUS.sm},
  br: {bottom: 28, right: 8, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: RADIUS.sm},
  scanLine: {position: 'absolute', height: 2, opacity: 0.85, borderRadius: 1, top: 16},
  centerIcon: {opacity: 0.35},
  label: {
    position: 'absolute',
    bottom: 0,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
