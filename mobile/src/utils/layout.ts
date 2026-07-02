import {useMemo} from 'react';
import {PixelRatio, useWindowDimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

/** Visual height of the bottom tab pill (excluding safe-area inset). */
export const TAB_BAR_VISUAL_HEIGHT = 62;
export const TAB_BAR_FLOAT_MARGIN = 10;
export const TAB_BAR_SIDE_MARGIN = 10;

export function tabBarHeight(insetsBottom: number): number {
  return TAB_BAR_VISUAL_HEIGHT + Math.max(insetsBottom, TAB_BAR_FLOAT_MARGIN);
}

/**
 * Total space occupied from the bottom edge by the floating tab bar.
 * Use as ScrollView paddingBottom / sceneContainerStyle paddingBottom.
 */
export function floatingTabBarInset(insetsBottom: number, width: number): number {
  const bottom = Math.max(insetsBottom, TAB_BAR_FLOAT_MARGIN);
  return bottom + TAB_BAR_VISUAL_HEIGHT + rs(14, width);
}

/** Bottom offset for mini-player above floating tab bar. */
export function miniPlayerBottom(insetsBottom: number, width: number): number {
  return floatingTabBarInset(insetsBottom, width) + rs(4, width);
}

/** Scale relative to 390pt reference — allows more shrink on small phones. */
export function rs(size: number, width: number): number {
  const ratio = width / 390;
  const scaled = size * ratio;
  const min = size * (width < 360 ? 0.72 : 0.78);
  const max = size * (width > 428 ? 1.12 : 1.08);
  return Math.round(PixelRatio.roundToNearestPixel(Math.min(Math.max(scaled, min), max)));
}

export function gridColumns(width: number): number {
  if (width >= 900) return 4;
  if (width >= 700) return 3;
  return 2;
}

export function gridItemWidth(
  screenWidth: number,
  columns: number,
  horizontalPad: number,
  gap: number,
): number {
  const totalGap = gap * (columns - 1);
  return (screenWidth - horizontalPad * 2 - totalGap) / columns;
}

export function halfGridItemWidth(screenWidth: number, horizontalPad: number, gap: number): number {
  return (screenWidth - horizontalPad * 2 - gap) / 2;
}

export function useLayoutMetrics(tabBarVisible = true) {
  const {width, height} = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const shortSide = Math.min(width, height);
    const longSide = Math.max(width, height);
    const isSmallPhone = width < 360;
    const isCompact = width < 375 || height < 700;
    const isTablet = width >= 768;
    const hPad = rs(isSmallPhone ? 12 : 16, width);
    const gap = rs(isSmallPhone ? 6 : 8, width);
    const cols = gridColumns(width);
    const floatInset = floatingTabBarInset(insets.bottom, width);
    const tabBar = tabBarVisible ? floatInset : 0;

    return {
      width,
      height,
      shortSide,
      longSide,
      insets,
      isSmallPhone,
      isCompact,
      isTablet,
      tabBar,
      tabBarVisible,
      hPad,
      gap,
      gridColumns: cols,
      gridItemWidth: gridItemWidth(width, cols, hPad, gap),
      halfGridWidth: halfGridItemWidth(width, hPad, gap),
      /** Scroll content padding — clears floating tab bar */
      contentBottomPad: tabBarVisible ? floatInset + rs(8, width) : insets.bottom + rs(16, width),
      /** Extra pad when mini-player may appear */
      contentBottomPadWithPlayer: tabBarVisible ? floatInset + rs(72, width) : insets.bottom + rs(80, width),
      floatInset,
      miniPlayerBottom: miniPlayerBottom(insets.bottom, width),
      cameraBottom: tabBarVisible ? floatInset : insets.bottom + rs(20, width),
      screenBottom: tabBarVisible ? floatInset : insets.bottom + rs(24, width),
      shutterOuter: rs(isCompact ? 70 : 80, width),
      shutterInner: rs(isCompact ? 54 : 62, width),
      sideBtn: rs(isCompact ? 40 : 48, width),
      iconBtn: rs(isCompact ? 40 : 44, width),
      thumbSize: rs(isCompact ? 56 : 68, width),
      mediaHeight: Math.min(width - hPad * 2, longSide * (isCompact ? 0.42 : 0.48)),
      headerBtn: rs(isCompact ? 34 : 38, width),
      font: {
        xs: rs(10, width),
        sm: rs(isSmallPhone ? 11 : 12, width),
        md: rs(isSmallPhone ? 13 : 14, width),
        lg: rs(isSmallPhone ? 15 : 17, width),
        xl: rs(isCompact ? 19 : 22, width),
        hero: rs(isCompact ? 56 : 72, width),
      },
    };
  }, [width, height, insets, tabBarVisible]);
}
