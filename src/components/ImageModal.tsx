import { useState, useMemo } from 'react';
import { Star, Download, Package, Monitor, Terminal, Zap } from 'lucide-react';
import { Modal } from './Modal';
import type { BoardInfo, ImageInfo, ImageFilterType } from '../types';
import { getImagesForBoard } from '../hooks/useTauri';
import { useAsyncDataWhen } from '../hooks/useAsyncData';
import {
  getOsInfo,
  getAppInfo,
  getDesktopEnv,
  getKernelType,
  DESKTOP_BADGES,
  KERNEL_BADGES,
  DESKTOP_ENVIRONMENTS,
} from '../config';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (image: ImageInfo) => void;
  board: BoardInfo | null;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return 'Unknown';
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}

/**
 * Filter predicates - defined once, used for both checking availability and filtering
 * Each predicate returns true if the image matches the filter criteria
 */
const IMAGE_FILTER_PREDICATES: Record<Exclude<ImageFilterType, 'all'>, (img: ImageInfo) => boolean> = {
  // Stable: from archive repository and not trunk version
  stable: (img) => img.download_repository === 'archive' && !img.armbian_version.includes('trunk'),
  // Nightly: trunk versions
  nightly: (img) => img.armbian_version.includes('trunk'),
  // Apps: has preinstalled application
  apps: (img) => !!(img.preinstalled_application && img.preinstalled_application.length > 0),
  // Barebone/Minimal: no desktop environment and no preinstalled apps
  barebone: (img) => {
    const variant = img.image_variant.toLowerCase();
    const hasDesktop = DESKTOP_ENVIRONMENTS.some(de => variant.includes(de));
    const hasApp = img.preinstalled_application && img.preinstalled_application.length > 0;
    return !hasDesktop && !hasApp;
  },
};

/** Check if any images match a filter */
function hasImagesForFilter(images: ImageInfo[], filter: Exclude<ImageFilterType, 'all'>): boolean {
  return images.some(IMAGE_FILTER_PREDICATES[filter]);
}

/** Apply filter to images */
function applyFilter(images: ImageInfo[], filter: ImageFilterType): ImageInfo[] {
  if (filter === 'all') return images;
  return images.filter(IMAGE_FILTER_PREDICATES[filter]);
}

export function ImageModal({ isOpen, onClose, onSelect, board }: ImageModalProps) {
  const [filterType, setFilterType] = useState<ImageFilterType>('all');

  // Use hook for async data fetching
  const { data: allImages, loading, error, reload } = useAsyncDataWhen<ImageInfo[]>(
    isOpen && !!board,
    () => getImagesForBoard(board!.slug, undefined, undefined, undefined, false),
    [isOpen, board?.slug]
  );

  // Calculate available filters based on all images
  const availableFilters = useMemo(() => {
    if (!allImages) return { stable: false, nightly: false, apps: false, barebone: false };
    return {
      stable: hasImagesForFilter(allImages, 'stable'),
      nightly: hasImagesForFilter(allImages, 'nightly'),
      apps: hasImagesForFilter(allImages, 'apps'),
      barebone: hasImagesForFilter(allImages, 'barebone'),
    };
  }, [allImages]);

  // Apply filter using useMemo
  const filteredImages = useMemo(() => {
    if (!allImages) return [];
    return applyFilter(allImages, filterType);
  }, [allImages, filterType]);

  const title = board ? `${board.name} - Select OS` : 'Select Operating System';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="modal-filter-bar">
        <button
          className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
          onClick={() => setFilterType('all')}
        >
          All
        </button>
        {availableFilters.stable && (
          <button
            className={`filter-btn ${filterType === 'stable' ? 'active' : ''}`}
            onClick={() => setFilterType('stable')}
          >
            Stable
          </button>
        )}
        {availableFilters.nightly && (
          <button
            className={`filter-btn ${filterType === 'nightly' ? 'active' : ''}`}
            onClick={() => setFilterType('nightly')}
          >
            Nightly
          </button>
        )}
        {availableFilters.apps && (
          <button
            className={`filter-btn ${filterType === 'apps' ? 'active' : ''}`}
            onClick={() => setFilterType('apps')}
          >
            Apps
          </button>
        )}
        {availableFilters.barebone && (
          <button
            className={`filter-btn ${filterType === 'barebone' ? 'active' : ''}`}
            onClick={() => setFilterType('barebone')}
          >
            Minimal
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner" />
          <p>Loading images...</p>
        </div>
      ) : error ? (
        <div className="error">
          <p>{error}</p>
          <button onClick={reload} className="btn btn-primary">Retry</button>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="no-results">
          <Package size={48} />
          <p>No images found</p>
          <button onClick={() => setFilterType('all')} className="btn btn-secondary">
            Show all images
          </button>
        </div>
      ) : (
        <div className="modal-list">
          {filteredImages.map((image, index) => {
            const desktopEnv = getDesktopEnv(image.image_variant);
            const kernelType = getKernelType(image.kernel_branch);
            const osInfo = getOsInfo(image.distro_release);
            const appInfo = getAppInfo(image.preinstalled_application);

            // Use app logo if available, otherwise use OS logo
            const displayInfo = appInfo || osInfo;

            return (
              <button
                key={index}
                className={`list-item ${image.promoted ? 'promoted' : ''}`}
                onClick={() => onSelect(image)}
              >
                {/* OS/App Icon */}
                <div className="list-item-icon os-icon" style={{ backgroundColor: displayInfo?.color || '#64748b' }}>
                  {displayInfo?.logo ? (
                    <img src={displayInfo.logo} alt={displayInfo.name} />
                  ) : (
                    <Package size={20} color="white" />
                  )}
                </div>

                <div className="list-item-content" style={{ flex: 1 }}>
                  <div className="list-item-title">
                    {image.promoted && <Star className="promoted-star" size={14} fill="currentColor" style={{ marginRight: 6 }} />}
                    Armbian {image.armbian_version} {image.distro_release}
                    {image.preinstalled_application && (
                      <span className="badge" style={{ marginLeft: 8, background: appInfo?.badgeColor || 'var(--accent)', color: 'white' }}>
                        {image.preinstalled_application}
                      </span>
                    )}
                  </div>
                  <div className="list-item-badges" style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                    {desktopEnv && DESKTOP_BADGES[desktopEnv] ? (
                      <span className="badge badge-desktop" style={{ backgroundColor: DESKTOP_BADGES[desktopEnv].color }}>
                        <Monitor size={10} style={{ marginRight: 4 }} />
                        {DESKTOP_BADGES[desktopEnv].label}
                      </span>
                    ) : (
                      <span className="badge badge-cli">
                        <Terminal size={10} style={{ marginRight: 4 }} />
                        CLI
                      </span>
                    )}
                    {kernelType && KERNEL_BADGES[kernelType] && (
                      <span className="badge badge-kernel" style={{ backgroundColor: KERNEL_BADGES[kernelType].color }}>
                        <Zap size={10} style={{ marginRight: 4 }} />
                        {KERNEL_BADGES[kernelType].label}
                      </span>
                    )}
                  </div>
                </div>
                <div className="list-item-meta" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}>
                  <Download size={14} />
                  {formatSize(image.file_size)}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
