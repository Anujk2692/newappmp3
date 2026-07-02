import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {RootNavigator} from './src/navigation/RootNavigator';
import {BackendGate} from './src/components/BackendGate';
import {ErrorBoundary} from './src/components/ErrorBoundary';
import {PlaybackProvider} from './src/context/PlaybackContext';
import {ThemeProvider, useTheme} from './src/context/ThemeContext';

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
          <AppShell />
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

export default App;
