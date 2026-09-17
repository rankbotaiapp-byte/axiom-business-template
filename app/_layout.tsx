import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Audio } from 'expo-av';

import { ErrorBoundary } from '../src/components/ErrorBoundary';

export default function RootLayout() {
  useEffect(() => {
    // Configure audio for better compatibility
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    }).catch(console.error);
  }, []);

  return (
    <ErrorBoundary>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0B0C0E' },
          headerTintColor: '#fff',
          contentStyle: { backgroundColor: '#0B0C0E' },
        }}
      >
        <Stack.Screen name="intro" options={{ title: 'Z Point' }} />
        <Stack.Screen name="disclaimer" options={{ title: 'Disclaimer' }} />
        <Stack.Screen name="briefing" options={{ title: 'Briefing' }} />
        <Stack.Screen name="begin" options={{ title: 'Begin' }} />
      </Stack>
    </ErrorBoundary>
  );
}