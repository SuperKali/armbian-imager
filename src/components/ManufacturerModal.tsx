import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Modal } from './Modal';
import type { BoardInfo, Manufacturer } from '../types';
import { getBoards } from '../hooks/useTauri';
import { useAsyncDataWhen } from '../hooks/useAsyncData';
import {
  MANUFACTURERS,
  getManufacturer,
  getManufacturerLogoUrl,
  type ManufacturerConfig,
} from '../config';

// Re-export Manufacturer type for backward compatibility
export type { Manufacturer } from '../types';

function ManufacturerIcon({ config, size = 36 }: { config: ManufacturerConfig; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const logoUrl = getManufacturerLogoUrl(config.logo);

  if (logoUrl && !imgError) {
    return (
      <div className="list-item-icon" style={{ backgroundColor: config.color, width: size, height: size }}>
        <img
          src={logoUrl}
          alt={config.name}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className="list-item-icon" style={{ backgroundColor: config.color, width: size, height: size }}>
      {config.name.substring(0, 2).toUpperCase()}
    </div>
  );
}

interface ManufacturerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (manufacturer: Manufacturer) => void;
}

export function ManufacturerModal({ isOpen, onClose, onSelect }: ManufacturerModalProps) {
  const [search, setSearch] = useState('');

  // Use hook for async data fetching - only fetch when modal opens and no data yet
  const { data: boards, loading, error, reload } = useAsyncDataWhen<BoardInfo[]>(
    isOpen,
    () => getBoards(),
    [isOpen]
  );

  const manufacturers = useMemo(() => {
    if (!boards) return [];
    const searchLower = search.toLowerCase();
    const counts: Record<string, number> = {};

    for (const board of boards) {
      const mfr = getManufacturer(board.slug, board.name);
      if (!counts[mfr]) counts[mfr] = 0;
      counts[mfr]++;
    }

    const result: Manufacturer[] = Object.entries(counts)
      .filter(([key, count]) => {
        if (count === 0) return false;
        const config = MANUFACTURERS[key];
        return config.name.toLowerCase().includes(searchLower);
      })
      .map(([key, count]) => ({
        id: key,
        name: MANUFACTURERS[key].name,
        color: MANUFACTURERS[key].color,
        boardCount: count,
        logo: MANUFACTURERS[key].logo,
      }))
      .sort((a, b) => {
        if (a.id === 'other') return 1;
        if (b.id === 'other') return -1;
        return b.boardCount - a.boardCount;
      });

    return result;
  }, [boards, search]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Manufacturer">
      <div className="modal-search">
        <div className="search-box" style={{ marginBottom: 0 }}>
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search manufacturer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
            autoFocus
          />
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner" />
          <p>Loading...</p>
        </div>
      ) : error ? (
        <div className="error">
          <p>{error}</p>
          <button onClick={reload} className="btn btn-primary">Retry</button>
        </div>
      ) : (
        <div className="modal-list">
          {manufacturers.map((mfr) => {
            const config = MANUFACTURERS[mfr.id];
            return (
              <button
                key={mfr.id}
                className="list-item"
                onClick={() => onSelect(mfr)}
              >
                <ManufacturerIcon config={config} />
                <div className="list-item-content">
                  <div className="list-item-title">{mfr.name}</div>
                  <div className="list-item-subtitle">{mfr.boardCount} boards</div>
                </div>
              </button>
            );
          })}
          {manufacturers.length === 0 && (
            <div className="no-results">
              <p>No manufacturers found</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// Re-export from config for backward compatibility
export { MANUFACTURERS, getManufacturer } from '../config';
