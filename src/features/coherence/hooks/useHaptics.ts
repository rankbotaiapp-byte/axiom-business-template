import { useCallback } from 'react';
import { Platform } from 'react-native';

export function useHaptics() {
  const trigger = useCallback((pattern: 'light' | 'medium' | 'heavy' = 'light') => {
    if (Platform.OS === 'web') return;

    // Expo SDK v57 includes Haptics support via expo-haptics.
    // Keep this hook as a safe no-op during early scaffolding so the app can run without extra dependencies.
    if (pattern === 'heavy') {
      return;
    }
    if (pattern === 'medium') {
      return;
    }
  }, []);

  return { trigger };
}
