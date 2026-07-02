import React, {createContext, useCallback, useContext, useMemo, useState} from 'react';
import {httpRequest} from '../api/httpClient';
import {DEFAULT_FEATURE_FLAGS, FeatureFlagKey, FeatureFlags} from './types';

interface FeatureFlagsContextValue {
  flags: FeatureFlags;
  loaded: boolean;
  isEnabled: (key: FeatureFlagKey) => boolean;
  refresh: () => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | null>(null);

function mergeFlags(raw: Record<string, boolean> | undefined): FeatureFlags {
  if (!raw) {
    return DEFAULT_FEATURE_FLAGS;
  }
  return {
    ...DEFAULT_FEATURE_FLAGS,
    ...raw,
  } as FeatureFlags;
}

export function FeatureFlagsProvider({children}: {children: React.ReactNode}) {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await httpRequest<Record<string, boolean>>('/api/features', {}, 8000);
      if (response.success && response.data) {
        setFlags(mergeFlags(response.data));
      }
    } catch {
      setFlags(DEFAULT_FEATURE_FLAGS);
    } finally {
      setLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const isEnabled = useCallback(
    (key: FeatureFlagKey) => flags[key] !== false,
    [flags],
  );

  const value = useMemo(
    () => ({flags, loaded, isEnabled, refresh}),
    [flags, loaded, isEnabled, refresh],
  );

  return (
    <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags(): FeatureFlagsContextValue {
  const ctx = useContext(FeatureFlagsContext);
  if (!ctx) {
    throw new Error('useFeatureFlags must be used within FeatureFlagsProvider');
  }
  return ctx;
}

export function useFeatureFlag(key: FeatureFlagKey): boolean {
  return useFeatureFlags().isEnabled(key);
}
