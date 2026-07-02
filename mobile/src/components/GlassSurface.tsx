import React from 'react';
import {StyleSheet, View, ViewProps} from 'react-native';
import {RADIUS, SHADOW} from '../config';

interface GlassSurfaceProps extends ViewProps {
  children: React.ReactNode;
  radius?: number;
  padding?: number;
  accent?: string;
}

export function GlassSurface({
  children,
  style,
  radius = RADIUS.lg,
  padding = 12,
  accent,
  ...rest
}: GlassSurfaceProps) {
  return (
    <View
      style={[
        styles.base,
        {borderRadius: radius, padding},
        accent ? {borderColor: `${accent}44`} : null,
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: 'rgba(14,14,20,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    ...SHADOW.sm,
  },
});
