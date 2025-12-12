import { RotateCcw } from 'lucide-react';
import type { FlashStage } from './FlashStageIcon';

interface FlashActionsProps {
  stage: FlashStage;
  onComplete: () => void;
  onBack: () => void;
  onRetry: () => void;
  onCancel: () => void;
}

export function FlashActions({
  stage,
  onComplete,
  onBack,
  onRetry,
  onCancel,
}: FlashActionsProps) {
  if (stage === 'complete') {
    return (
      <div className="flash-actions-inline">
        <button className="btn btn-secondary" onClick={onBack}>
          Flash Another
        </button>
        <button className="btn btn-primary" onClick={onComplete}>
          Done
        </button>
      </div>
    );
  }

  if (stage === 'error') {
    return (
      <div className="flash-actions-inline">
        <button className="btn btn-secondary" onClick={onBack}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={onRetry}>
          <RotateCcw size={16} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flash-actions-inline">
      <button className="btn btn-secondary" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
