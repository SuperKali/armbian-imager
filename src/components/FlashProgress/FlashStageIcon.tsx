import {
  Download,
  HardDrive,
  CheckCircle,
  XCircle,
  Check,
  Archive,
  Shield,
} from 'lucide-react';

export type FlashStage =
  | 'authorizing'
  | 'downloading'
  | 'decompressing'
  | 'flashing'
  | 'verifying'
  | 'complete'
  | 'error';

interface FlashStageIconProps {
  stage: FlashStage;
  size?: number;
}

export function FlashStageIcon({ stage, size = 32 }: FlashStageIconProps) {
  switch (stage) {
    case 'authorizing':
      return <Shield size={size} className="stage-icon authorizing" />;
    case 'downloading':
      return <Download size={size} className="stage-icon downloading" />;
    case 'decompressing':
      return <Archive size={size} className="stage-icon decompressing" />;
    case 'flashing':
      return <HardDrive size={size} className="stage-icon flashing" />;
    case 'verifying':
      return <Check size={size} className="stage-icon verifying" />;
    case 'complete':
      return <CheckCircle size={size} className="stage-icon complete" />;
    case 'error':
      return <XCircle size={size} className="stage-icon error" />;
  }
}

export function getStageText(stage: FlashStage): string {
  switch (stage) {
    case 'authorizing':
      return 'Requesting authorization...';
    case 'downloading':
      return 'Downloading image...';
    case 'decompressing':
      return 'Decompressing image...';
    case 'flashing':
      return 'Writing image to device...';
    case 'verifying':
      return 'Verifying written data...';
    case 'complete':
      return 'Flash complete!';
    case 'error':
      return 'An error occurred';
  }
}
