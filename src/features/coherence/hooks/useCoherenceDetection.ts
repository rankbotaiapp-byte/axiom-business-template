import { useEffect } from 'react';

export function useCoherenceDetection(enabled: boolean, onReached: () => void) {
  useEffect(() => {
    if (!enabled) return;

    // TODO: Replace with real implementation.
    // Options:
    // 1. Browser getUserMedia + simple brightness analysis on fingertip
    // 2. Integration with Apple Health / Google Fit via Capacitor or native modules
    // 3. Wearable SDK
    console.log('Detection started...');

    const timer = setTimeout(() => {
      onReached();
    }, 2000);

    return () => clearTimeout(timer);
  }, [enabled, onReached]);
}
