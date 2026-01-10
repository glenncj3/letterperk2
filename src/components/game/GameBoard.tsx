import { useGameState } from '../../contexts/GameContext';
import { Tile } from './Tile';
import { GRID_ROWS, GRID_COLS } from '../../constants/gameConstants';
import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  detectTileChanges,
  setupNewGameAnimation,
  generateAnimationDelays,
  createPositionMap,
  setupShuffleAnimation,
} from '../../utils/tileAnimation';

export function GameBoard() {
  const { state, actions } = useGameState();
  const previousTileIdsRef = useRef<Set<string> | null>(null);
  const previousTilePositionsRef = useRef<Map<string, { row: number; col: number }>>(new Map());
  const previousPuzzleSeedRef = useRef<number | null>(null);
  const [newTileIds, setNewTileIds] = useState<Set<string>>(new Set());
  const tileDelaysRef = useRef<Map<string, number>>(new Map());
  const [shuffleAnimations, setShuffleAnimations] = useState<Map<string, { fromRow: number; fromCol: number; delay: number }>>(new Map());
  const isShufflingRef = useRef(false);

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
    
    // Check if this is a shuffle: all tiles moved, no new tiles, same tile count
    const isShuffle = changes.newTileIds.size === 0 && 
                      changes.movedTileIds.size === state.tiles.length &&
                      state.tiles.length === previousIds.size &&
                      state.tiles.length > 0;

    if (isShuffle) {
      // This is a shuffle - use shuffle animation instead of drop animation
      isShufflingRef.current = true;
      
      // CRITICAL: Clear newTileIds immediately to prevent drop animation from triggering
      // after shuffle completes (when isShufflingRef becomes false)
      setNewTileIds(new Set());
      tileDelaysRef.current.clear();
      
      const shuffleAnims = setupShuffleAnimation(state.tiles, previousPositions);
      
      // Convert to map for easy lookup
      const shuffleMap = new Map<string, { fromRow: number; fromCol: number; delay: number }>();
      shuffleAnims.forEach(anim => {
        shuffleMap.set(anim.tileId, {
          fromRow: anim.fromRow,
          fromCol: anim.fromCol,
          delay: anim.delay,
        });
      });
      
      setShuffleAnimations(shuffleMap);

      // Update tracking refs IMMEDIATELY to prevent drop animation from triggering
      // after shuffle completes
      previousTileIdsRef.current = currentTileIds;
      previousTilePositionsRef.current = createPositionMap(state.tiles);

      // Clear shuffle animation after it completes
      const maxDelay = Math.max(...shuffleAnims.map(a => a.delay), 0);
      const timer = setTimeout(() => {
        setShuffleAnimations(new Map());
        isShufflingRef.current = false;
      }, 400 + maxDelay); // Animation duration (400ms) + max delay

      return () => clearTimeout(timer);
    } else {
      // Normal tile changes - use drop animation
      // BUT: Don't trigger drop animation if we're currently shuffling
      if (!isShufflingRef.current) {
        isShufflingRef.current = false;
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
        } else {
          // No tiles to animate, but still update refs
          previousTileIdsRef.current = currentTileIds;
          previousTilePositionsRef.current = createPositionMap(state.tiles);
        }
      } else {
        // We're shuffling, so just update refs without triggering drop animation
        previousTileIdsRef.current = currentTileIds;
        previousTilePositionsRef.current = createPositionMap(state.tiles);
      }
    }
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
                        isNew={newTileIds.has(tile.id) && !isShufflingRef.current}
                        animationDelay={newTileIds.has(tile.id) && !isShufflingRef.current ? (tileDelaysRef.current.get(tile.id) || 0) : 0}
                        isShuffling={isShufflingRef.current && shuffleAnimations.has(tile.id)}
                        shuffleFromRow={shuffleAnimations.get(tile.id)?.fromRow}
                        shuffleFromCol={shuffleAnimations.get(tile.id)?.fromCol}
                        shuffleDelay={shuffleAnimations.get(tile.id)?.delay || 0}
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
