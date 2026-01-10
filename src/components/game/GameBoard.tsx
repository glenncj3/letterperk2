import { useGameState } from '../../contexts/GameContext';
import { Tile } from './Tile';
import { GRID_ROWS, GRID_COLS } from '../../constants/gameConstants';
import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  detectTileChanges,
  setupNewGameAnimation,
  generateAnimationDelays,
  createPositionMap,
} from '../../utils/tileAnimation';

export function GameBoard() {
  const { state, actions } = useGameState();
  const previousTileIdsRef = useRef<Set<string> | null>(null);
  const previousTilePositionsRef = useRef<Map<string, { row: number; col: number }>>(new Map());
  const previousPuzzleSeedRef = useRef<number | null>(null);
  const [newTileIds, setNewTileIds] = useState<Set<string>>(new Set());
  const tileDelaysRef = useRef<Map<string, number>>(new Map());

  // Memoize tile lookups for performance
  const tileMap = useMemo(() => {
    const map = new Map<string, Tile>();
    state.tiles.forEach(tile => {
      map.set(`${tile.row}-${tile.col}`, tile);
    });
    return map;
  }, [state.tiles]);

  const selectedTileIds = useMemo(() => {
    return new Set(state.selectedTiles.map(t => t.id));
  }, [state.selectedTiles]);

  const getTileAt = useCallback((row: number, col: number) => {
    return tileMap.get(`${row}-${col}`);
  }, [tileMap]);

  const isTileSelected = useCallback((tileId: string) => {
    return selectedTileIds.has(tileId);
  }, [selectedTileIds]);

  // Effect 1: Detect new game (puzzle seed changed)
  useEffect(() => {
    const currentPuzzleSeed = state.puzzle?.seed ?? null;
    const isNewGame = previousPuzzleSeedRef.current !== null &&
      currentPuzzleSeed !== null &&
      previousPuzzleSeedRef.current !== currentPuzzleSeed;

    if (isNewGame && state.tiles.length > 0) {
      const animation = setupNewGameAnimation(state.tiles);
      setNewTileIds(animation.tileIds);
      tileDelaysRef.current = animation.delays;

      const timer = setTimeout(() => {
        setNewTileIds(new Set());
        tileDelaysRef.current.clear();
      }, 1000);

      previousPuzzleSeedRef.current = currentPuzzleSeed;
      previousTileIdsRef.current = new Set(state.tiles.map(t => t.id));
      previousTilePositionsRef.current = createPositionMap(state.tiles);

      return () => clearTimeout(timer);
    }

    if (currentPuzzleSeed !== null) {
      previousPuzzleSeedRef.current = currentPuzzleSeed;
    }
  }, [state.puzzle?.seed, state.tiles]);

  // Effect 2: Initialize on first render
  useEffect(() => {
    if (previousTileIdsRef.current === null && state.tiles.length > 0) {
      const animation = setupNewGameAnimation(state.tiles);
      setNewTileIds(animation.tileIds);
      tileDelaysRef.current = animation.delays;

      const timer = setTimeout(() => {
        setNewTileIds(new Set());
        tileDelaysRef.current.clear();
      }, 1000);

      previousTileIdsRef.current = new Set(state.tiles.map(t => t.id));
      previousTilePositionsRef.current = createPositionMap(state.tiles);
      if (state.puzzle?.seed !== null && state.puzzle?.seed !== undefined) {
        previousPuzzleSeedRef.current = state.puzzle.seed;
      }

      return () => clearTimeout(timer);
    }
  }, [state.tiles, state.puzzle?.seed]);

  // Effect 3: Track tile changes (new and moved tiles)
  useEffect(() => {
    const currentTileIds = new Set(state.tiles.map(t => t.id));
    const previousIds = previousTileIdsRef.current;
    const previousPositions = previousTilePositionsRef.current;

    // Skip if this is initial render or new game (handled by other effects)
    if (previousIds === null) {
      return;
    }

    const changes = detectTileChanges(state.tiles, previousIds, previousPositions);
    const tilesToAnimate = new Set([...changes.newTileIds, ...changes.movedTileIds]);

    if (tilesToAnimate.size > 0) {
      const delays = generateAnimationDelays(
        state.tiles.filter(t => tilesToAnimate.has(t.id)),
        previousPositions
      );

      // Update delays map
      delays.forEach((delay, id) => {
        tileDelaysRef.current.set(id, delay);
      });

      setNewTileIds(tilesToAnimate);

      const timer = setTimeout(() => {
        setNewTileIds(new Set());
        tilesToAnimate.forEach(id => tileDelaysRef.current.delete(id));
      }, 1000);

      // Update tracking refs
      previousTileIdsRef.current = currentTileIds;
      previousTilePositionsRef.current = createPositionMap(state.tiles);

      return () => clearTimeout(timer);
    }

    // Update tracking refs even if no animations
    previousTileIdsRef.current = currentTileIds;
    previousTilePositionsRef.current = createPositionMap(state.tiles);
  }, [state.tiles]);

  const handleTileClick = (tileId: string) => {
    const isSelected = isTileSelected(tileId);
    const tile = state.tiles.find(t => t.id === tileId);

    if (!tile) return;

    if (isSelected) {
      actions.deselectTile(tileId);
    } else {
      actions.selectTile(tileId);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto px-4">
      <div className="bg-gray-100 rounded-2xl p-2.5">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: GRID_COLS }).map((_, col) => (
            <div key={col} className="flex flex-col gap-2">
              {Array.from({ length: GRID_ROWS }).map((_, row) => {
                const tile = getTileAt(row, col);
                return (
                  <div key={`${row}-${col}`} className="aspect-square">
                    {tile ? (
                      <Tile
                        tile={tile}
                        isSelected={isTileSelected(tile.id)}
                        onClick={() => handleTileClick(tile.id)}
                        isNew={newTileIds.has(tile.id)}
                        animationDelay={newTileIds.has(tile.id) ? (tileDelaysRef.current.get(tile.id) || 0) : 0}
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gray-100" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
