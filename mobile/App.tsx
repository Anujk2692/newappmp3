import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {RootNavigator} from './src/navigation/RootNavigator';
import {BackendGate} from './src/components/BackendGate';
import {ErrorBoundary} from './src/components/ErrorBoundary';
import {PlaybackProvider} from './src/context/PlaybackContext';
import {ThemeProvider, useTheme} from './src/context/ThemeContext';
import {FeatureFlagsProvider} from './src/core/features/FeatureFlagsProvider';

function AppShell() {
  const {colors} = useTheme();
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <BackendGate>
        <PlaybackProvider>
          <RootNavigator />
        </PlaybackProvider>
      </BackendGate>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <FeatureFlagsProvider>
            <AppShell />
          </FeatureFlagsProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

export default App;
