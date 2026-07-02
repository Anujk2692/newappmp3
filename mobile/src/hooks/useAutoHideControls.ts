import {useCallback, useEffect, useRef} from 'react';

const HIDE_DELAY_MS = 3500;

/** Auto-hide controls while playing; tap toggles visibility */
export function useAutoHideControls(visible: boolean, playing: boolean) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(
    (setVisible: (v: boolean) => void) => {
      clearTimer();
      if (playing) {
        timerRef.current = setTimeout(() => setVisible(false), HIDE_DELAY_MS);
      }
    },
    [clearTimer, playing],
  );

  useEffect(() => () => clearTimer(), [clearTimer]);

  return {clearTimer, scheduleHide};
}
