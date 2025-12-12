import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, Star } from 'lucide-react';
import { Modal } from './Modal';
import type { BoardInfo, Manufacturer } from '../types';
import { getBoards, getBoardImageUrl } from '../hooks/useTauri';
import { useAsyncDataWhen } from '../hooks/useAsyncData';
import { getManufacturer } from '../config';

function getBoardColor(name: string): string {
  const colors = ['#3baed4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getBoardInitials(name: string): string {
  const words = name.split(/[\s-]+/).filter(w => w.length > 0);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

interface BoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (board: BoardInfo) => void;
  manufacturer: Manufacturer | null;
}

export function BoardModal({ isOpen, onClose, onSelect, manufacturer }: BoardModalProps) {
  const [search, setSearch] = useState('');
  const [boardImages, setBoardImages] = useState<Record<string, string | null>>({});
  const loadingImagesRef = useRef<Set<string>>(new Set());
  const loadedRef = useRef<Set<string>>(new Set());

  // Use hook for async data fetching
  const { data: boards, loading, error, reload } = useAsyncDataWhen<BoardInfo[]>(
    isOpen,
    () => getBoards(),
    [isOpen]
  );

  useEffect(() => {
    setSearch('');
  }, [manufacturer]);

  const loadBoardImage = useCallback(async (slug: string) => {
    if (loadedRef.current.has(slug) || loadingImagesRef.current.has(slug)) return;
    loadingImagesRef.current.add(slug);
    try {
      const url = await getBoardImageUrl(slug);
      loadedRef.current.add(slug);
      setBoardImages((prev) => ({ ...prev, [slug]: url }));
    } catch {
      loadedRef.current.add(slug);
      setBoardImages((prev) => ({ ...prev, [slug]: null }));
    } finally {
      loadingImagesRef.current.delete(slug);
    }
  }, []);

  const filteredBoards = useMemo(() => {
    if (!manufacturer || !boards) return [];
    const searchLower = search.toLowerCase();
    return boards
      .filter((board) => {
        const mfr = getManufacturer(board.slug, board.name);
        if (mfr !== manufacturer.id) return false;
        return board.name.toLowerCase().includes(searchLower) ||
          board.slug.toLowerCase().includes(searchLower);
      })
      .sort((a, b) => {
        if (a.has_promoted && !b.has_promoted) return -1;
        if (!a.has_promoted && b.has_promoted) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [boards, manufacturer, search]);

  useEffect(() => {
    if (isOpen && filteredBoards.length > 0) {
      const loadImages = async () => {
        for (let i = 0; i < Math.min(filteredBoards.length, 10); i += 5) {
          const batch = filteredBoards.slice(i, i + 5);
          await Promise.all(batch.map(board => loadBoardImage(board.slug)));
        }
      };
      loadImages();
    }
  }, [isOpen, filteredBoards, loadBoardImage]);

  const title = manufacturer ? `${manufacturer.name} Boards` : 'Select Board';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="modal-search">
        <div className="search-box" style={{ marginBottom: 0 }}>
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search boards..."
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
          {filteredBoards.map((board) => (
            <button
              key={board.slug}
              className="list-item"
              onClick={() => onSelect(board)}
              onMouseEnter={() => loadBoardImage(board.slug)}
            >
              <div className="list-item-icon" style={{ backgroundColor: getBoardColor(board.name) }}>
                {boardImages[board.slug] ? (
                  <img src={boardImages[board.slug]!} alt={board.name} />
                ) : (
                  getBoardInitials(board.name)
                )}
              </div>
              <div className="list-item-content">
                <div className="list-item-title">
                  {board.name}
                  {board.has_promoted && <Star className="promoted-star" size={14} fill="currentColor" style={{ marginLeft: 6 }} />}
                </div>
                <div className="list-item-subtitle">{board.image_count} images available</div>
              </div>
            </button>
          ))}
          {filteredBoards.length === 0 && (
            <div className="no-results">
              <p>No boards found</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
