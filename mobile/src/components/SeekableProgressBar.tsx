import React, {useRef} from 'react';
import {LayoutChangeEvent, Pressable, StyleSheet, View} from 'react-native';
import {COLORS} from '../config';

interface SeekableProgressBarProps {
  progress: number;
  duration: number;
  onSeek: (seconds: number) => void;
  accentColor?: string;
  height?: number;
}

export function SeekableProgressBar({
  progress,
  duration,
  onSeek,
  accentColor = COLORS.primary,
  height = 6,
}: SeekableProgressBarProps) {
  const barWidth = useRef(0);

  const seekAt = (locationX: number) => {
    if (duration <= 0 || barWidth.current <= 0) {
      return;
    }
    const ratio = Math.max(0, Math.min(1, locationX / barWidth.current));
    onSeek(ratio * duration);
  };

  const onLayout = (e: LayoutChangeEvent) => {
    barWidth.current = e.nativeEvent.layout.width;
  };

  return (
    <Pressable
      onLayout={onLayout}
      onPress={e => seekAt(e.nativeEvent.locationX)}
      style={[styles.track, {height: height + 12, justifyContent: 'center'}]}
      accessibilityRole="adjustable"
      accessibilityLabel="Seek">
      <View style={[styles.bg, {height}]}>
        <View
          style={[
            styles.fill,
            {width: `${Math.min(100, progress * 100)}%`, backgroundColor: accentColor, height},
          ]}
        />
        <View
          style={[
            styles.thumb,
            {
              left: `${Math.min(100, progress * 100)}%`,
              backgroundColor: accentColor,
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {flex: 1},
  bg: {
    borderRadius: 4,
    backgroundColor: COLORS.surfaceLight,
    overflow: 'visible',
    position: 'relative',
  },
  fill: {borderRadius: 4},
  thumb: {
    position: 'absolute',
    top: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
    borderWidth: 2,
    borderColor: COLORS.text,
  },
});
