/**
 * Armbian Board Detection Modal
 *
 * Shows when the app detects it's running on an Armbian system.
 * Allows the user to confirm auto-selection of the detected board
 * or cancel and proceed with manual selection.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown, Shield, Users, Clock, Tv, Wrench } from 'lucide-react';
import type { ArmbianReleaseInfo, BoardInfo } from '../../types';
import { getBoardImageUrl, logWarn } from '../../hooks/useTauri';
import { setArmbianBoardDetection } from '../../hooks/useSettings';
import { UI } from '../../config/constants';

interface ArmbianBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onDetectionDisabled?: () => void;
  armbianInfo: ArmbianReleaseInfo;
  boardInfo?: BoardInfo | null;
}

export function ArmbianBoardModal({
  isOpen,
  onClose,
  onConfirm,
  onDetectionDisabled,
  armbianInfo,
  boardInfo,
}: ArmbianBoardModalProps) {
  const { t } = useTranslation();
  const [isExiting, setIsExiting] = useState(false);
  const isExitingRef = useRef(false);
  const [boardImageUrl, setBoardImageUrl] = useState<string | null>(null);

  /**
   * Preload board image for the detected board
   * Includes cleanup to prevent state updates after unmount
   */
  useEffect(() => {
    let cancelled = false;

    const loadImage = async () => {
      if (!isOpen || !armbianInfo.board) return;

      try {
        const baseUrl = await getBoardImageUrl(armbianInfo.board);
        // Use higher resolution image (480px) for modal display
        const url = baseUrl ? baseUrl.replace('/272/', `/${UI.ARMBIAN_BOARD_IMAGE_WIDTH}/`) : null;
        // Check if component was cancelled during async operation
        if (cancelled || !url) {
          if (!cancelled) setBoardImageUrl(null);
          return;
        }

        const img = new Image();

        img.onload = () => {
          if (!cancelled) {
            setBoardImageUrl(url);
          }
        };

        img.onerror = () => {
          if (!cancelled) {
            logWarn('app', `Failed to load board image: ${url}`);
            setBoardImageUrl(null);
          }
        };

        img.src = url;
      } catch (error) {
        if (!cancelled) {
          logWarn('app', `Failed to get board image URL: ${error}`);
          setBoardImageUrl(null);
        }
      }
    };

    loadImage();

    // Cleanup function - sets cancelled flag to prevent state updates after unmount
    return () => {
      cancelled = true;
    };
  }, [isOpen, armbianInfo.board]);

  /**
   * Handle close with exit animation
   */
  const handleClose = useCallback(() => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;
    setIsExiting(true);

    // Disable board auto-detection when user cancels
    setArmbianBoardDetection('disabled');

    setTimeout(() => {
      setIsExiting(false);
      isExitingRef.current = false;
      onClose();
      onDetectionDisabled?.();
    }, 200);
  }, [onClose, onDetectionDisabled]);

  /**
   * Handle confirm with exit animation
   */
  const handleConfirm = useCallback(() => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;
    setIsExiting(true);

    setTimeout(() => {
      setIsExiting(false);
      isExitingRef.current = false;
      onConfirm();
    }, 200);
  }, [onConfirm]);

  /**
   * Handle Escape key press
   */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isExiting) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isExiting, handleClose]);

  if (!isOpen) return null;

  const animationClass = isExiting ? 'modal-exiting' : 'modal-entering';

  return (
    <div className={`modal-overlay ${animationClass}`} onClick={handleClose}>
      <div className={`modal modal-compact ${animationClass}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <h2 className="modal-title">{t('armbian.title')}</h2>
          </div>
          <button className="modal-close" onClick={handleClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal-body armbian-board-modal">
          {/* Board image with accent glow */}
          <div className="armbian-board-hero">
            <div className="armbian-board-image">
              {boardImageUrl ? (
                <img src={boardImageUrl} alt={armbianInfo.board_name} />
              ) : (
                <div className="board-image-placeholder">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <path d="M8 21h8" />
                    <path d="M12 17v4" />
                    <circle cx="12" cy="10" r="2" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Board name */}
          <h3 className="armbian-board-name">{armbianInfo.board_name}</h3>

          {/* Support badges */}
          {boardInfo && (
            <div className="board-grid-badges" style={{ justifyContent: 'center', marginBottom: '8px' }}>
              {boardInfo.has_platinum_support && <span className="badge-platinum"><Crown size={10} /><span>Platinum</span></span>}
              {boardInfo.has_standard_support && !boardInfo.has_platinum_support && <span className="badge-standard"><Shield size={10} /><span>Standard</span></span>}
              {boardInfo.has_community_support && <span className="badge-community"><Users size={10} /><span>Community</span></span>}
              {boardInfo.has_eos_support && <span className="badge-eos"><Clock size={10} /><span>EOS</span></span>}
              {boardInfo.has_tvb_support && <span className="badge-tvb"><Tv size={10} /><span>TV Box</span></span>}
              {boardInfo.has_wip_support && <span className="badge-wip"><Wrench size={10} /><span>WIP</span></span>}
            </div>
          )}

          {/* Description */}
          <p className="armbian-board-description">{t('armbian.description')}</p>

          {/* Action buttons */}
          <div className="armbian-board-actions">
            <button className="btn btn-secondary" onClick={handleClose} disabled={isExiting}>
              {t('common.cancel')}
            </button>
            <button className="btn btn-primary" onClick={handleConfirm} disabled={isExiting}>
              {t('common.confirm')}
            </button>
          </div>
          <p className="armbian-board-hint">{t('armbian.cancelHint')}</p>
        </div>
      </div>
    </div>
  );
}
