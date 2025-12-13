import { useState } from 'react';
import { Upload, ExternalLink, AlertCircle } from 'lucide-react';
import { uploadLogs, openUrl } from '../../hooks/useTauri';
import QRCode from 'qrcode';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorDisplay({ error, onRetry, compact = false }: ErrorDisplayProps) {
  const [uploading, setUploading] = useState(false);
  const [pasteUrl, setPasteUrl] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleUploadLogs() {
    setUploading(true);
    setUploadError(null);

    try {
      const result = await uploadLogs();
      setPasteUrl(result.url);

      if (!compact) {
        const qrDataUrl = await QRCode.toDataURL(result.url, {
          width: 120,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        setQrCodeDataUrl(qrDataUrl);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleOpenUrl() {
    if (!pasteUrl) return;
    try {
      await openUrl(pasteUrl);
    } catch {
      window.open(pasteUrl, '_blank');
    }
  }

  if (compact) {
    return (
      <div className="error-display-compact">
        <div className="error-display-message">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
        <div className="error-display-actions">
          {onRetry && (
            <button onClick={onRetry} className="btn btn-primary btn-sm">
              Retry
            </button>
          )}
          {!pasteUrl ? (
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleUploadLogs}
              disabled={uploading}
            >
              <Upload size={14} />
              {uploading ? 'Uploading...' : 'Upload Logs'}
            </button>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={handleOpenUrl}>
              <ExternalLink size={14} />
              View Logs
            </button>
          )}
        </div>
        {uploadError && (
          <div className="error-display-upload-error">
            <AlertCircle size={12} />
            <span>{uploadError}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="error-dialog">
      <div className="error-dialog-message">
        <AlertCircle size={20} />
        <span>{error}</span>
      </div>

      {!pasteUrl ? (
        <button
          className="btn btn-secondary upload-logs-btn"
          onClick={handleUploadLogs}
          disabled={uploading}
        >
          <Upload size={16} />
          {uploading ? 'Uploading logs...' : 'Upload Logs for Support'}
        </button>
      ) : (
        <div className="paste-result">
          <div className="paste-qr">
            {qrCodeDataUrl && (
              <img src={qrCodeDataUrl} alt="QR Code" className="qr-code" />
            )}
          </div>
          <div className="paste-info">
            <span className="paste-label">Scan QR or share this link:</span>
            <button className="paste-url" onClick={handleOpenUrl}>
              {pasteUrl}
              <ExternalLink size={12} />
            </button>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="upload-error">
          <AlertCircle size={14} />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
}
