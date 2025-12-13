import { useEffect, useCallback } from 'react';
import { getBlockDevices } from './useTauri';
import type { BlockDevice } from '../types';

/** Polling interval for device monitoring (ms) */
const DEVICE_POLL_INTERVAL = 2000;

/**
 * Hook to monitor if a selected device is still connected.
 * Clears the device selection if it's disconnected.
 */
export function useDeviceMonitor(
  selectedDevice: BlockDevice | null,
  onDeviceDisconnected: () => void,
  enabled: boolean = true
) {
  const checkDevice = useCallback(async () => {
    if (!selectedDevice) return;

    try {
      const devices = await getBlockDevices();
      const stillConnected = devices.some(d => d.path === selectedDevice.path);

      if (!stillConnected) {
        onDeviceDisconnected();
      }
    } catch {
      // Silently ignore polling errors
    }
  }, [selectedDevice, onDeviceDisconnected]);

  useEffect(() => {
    if (!enabled || !selectedDevice) return;

    // Check immediately
    checkDevice();

    // Then poll periodically
    const interval = setInterval(checkDevice, DEVICE_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [enabled, selectedDevice, checkDevice]);
}
