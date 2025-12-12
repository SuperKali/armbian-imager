import { useState, useMemo } from 'react';
import { HardDrive, RefreshCw, AlertTriangle, Usb, Shield } from 'lucide-react';
import { Modal } from './Modal';
import type { BlockDevice } from '../types';
import { getBlockDevices } from '../hooks/useTauri';
import { useAsyncDataWhen } from '../hooks/useAsyncData';

/** Sort devices: removable first, then by size */
function sortDevices(devices: BlockDevice[]): BlockDevice[] {
  return [...devices].sort((a, b) => {
    if (a.is_system !== b.is_system) return a.is_system ? 1 : -1;
    if (a.is_removable !== b.is_removable) return a.is_removable ? -1 : 1;
    return b.size - a.size;
  });
}

interface DeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (device: BlockDevice) => void;
}

export function DeviceModal({ isOpen, onClose, onSelect }: DeviceModalProps) {
  const [selectedDevice, setSelectedDevice] = useState<BlockDevice | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Use hook for async data fetching - always refresh when modal opens
  const { data: rawDevices, loading, error, reload } = useAsyncDataWhen<BlockDevice[]>(
    isOpen,
    () => getBlockDevices(),
    [isOpen]
  );

  // Sort devices after fetching
  const devices = useMemo(() => {
    return rawDevices ? sortDevices(rawDevices) : [];
  }, [rawDevices]);

  function handleDeviceClick(device: BlockDevice) {
    if (device.is_system) return;
    setSelectedDevice(device);
    setShowConfirm(true);
  }

  function handleConfirm() {
    if (selectedDevice && !selectedDevice.is_system) {
      onSelect(selectedDevice);
      setShowConfirm(false);
    }
  }

  return (
    <>
      <Modal isOpen={isOpen && !showConfirm} onClose={onClose} title="Select Storage Device">
        <div className="modal-warning-banner">
          <AlertTriangle size={16} />
          <span>All data on selected device will be erased</span>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner" />
            <p>Scanning devices...</p>
          </div>
        ) : error ? (
          <div className="error">
            <p>{error}</p>
            <button onClick={reload} className="btn btn-primary">Retry</button>
          </div>
        ) : devices.length === 0 ? (
          <div className="no-results">
            <Usb size={40} />
            <p>No devices found</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Insert an SD card or USB drive
            </p>
            <button className="btn btn-secondary" onClick={reload} disabled={loading} style={{ marginTop: 16 }}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              Refresh
            </button>
          </div>
        ) : (
          <>
            <div className="modal-list">
              {devices.map((device) => (
                <button
                  key={device.path}
                  className={`list-item ${device.is_removable ? 'removable' : ''} ${device.is_system ? 'system' : ''}`}
                  onClick={() => handleDeviceClick(device)}
                  disabled={device.is_system}
                  style={{ opacity: device.is_system ? 0.5 : 1 }}
                >
                  <div className="list-item-icon" style={{
                    backgroundColor: device.is_system ? 'rgba(239, 68, 68, 0.1)' :
                      device.is_removable ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-secondary)',
                    color: device.is_system ? '#ef4444' :
                      device.is_removable ? '#10b981' : 'var(--text-secondary)'
                  }}>
                    {device.is_system ? <Shield size={20} /> :
                      device.is_removable ? <Usb size={20} /> : <HardDrive size={20} />}
                  </div>
                  <div className="list-item-content">
                    <div className="list-item-title">
                      {device.model || device.name}
                      {device.is_system && <span className="system-badge" style={{ marginLeft: 8 }}>System</span>}
                      {device.is_removable && !device.is_system && <span className="removable-badge" style={{ marginLeft: 8 }}>Removable</span>}
                    </div>
                    <div className="list-item-subtitle">
                      {device.name} • {device.size_formatted}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="modal-refresh-bottom">
              <button className="btn btn-secondary" onClick={reload} disabled={loading}>
                <RefreshCw size={14} className={loading ? 'spin' : ''} />
                Refresh Devices
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Confirmation Dialog */}
      {showConfirm && selectedDevice && !selectedDevice.is_system && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">
              <AlertTriangle size={32} color="#f59e0b" />
            </div>
            <h3 className="confirm-title">Confirm Selection</h3>
            <p className="confirm-text">You are about to write to:</p>
            <div className="confirm-device">
              <strong>{selectedDevice.model || selectedDevice.name}</strong>
              <span>{selectedDevice.name} ({selectedDevice.size_formatted})</span>
            </div>
            <p className="confirm-warning">ALL DATA WILL BE PERMANENTLY ERASED</p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleConfirm}>
                Erase & Flash
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
