import { useRef, useCallback } from 'react';

/** Progress object that may contain an error field */
interface ProgressWithError {
  error?: string | null;
}

interface PollingOptions<T> {
  /** Function to fetch progress data */
  fetchProgress: () => Promise<T>;
  /** Callback when progress updates */
  onProgress: (progress: T) => void;
  /** Callback when an error is detected in progress */
  onError?: (error: string) => void;
  /** Polling interval in ms (default: 250) */
  interval?: number;
}

/**
 * Hook for polling progress with automatic cleanup
 */
export function useProgressPolling<T>() {
  const intervalRef = useRef<number | null>(null);

  const startPolling = useCallback(<P extends T>(options: PollingOptions<P>) => {
    const { fetchProgress, onProgress, onError, interval = 250 } = options;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = window.setInterval(async () => {
      try {
        const progress = await fetchProgress();
        onProgress(progress);

        // Check for error in progress object (type-safe check)
        const progressWithError = progress as ProgressWithError;
        if (onError && progressWithError.error) {
          onError(progressWithError.error);
          stopPolling();
        }
      } catch (err) {
        // Log polling errors in development for debugging
        if (import.meta.env.DEV) {
          console.warn('[useProgressPolling] Polling error:', err);
        }
        // Don't stop polling - transient network issues shouldn't halt progress tracking
      }
    }, interval);
  }, []);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return { startPolling, stopPolling, intervalRef };
}
