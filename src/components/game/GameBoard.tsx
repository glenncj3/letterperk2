import { useGameState } from '../../contexts/GameContext';
import { Tile } from './Tile';
import { GRID_ROWS, GRID_COLS } from '../../constants/gameConstants';
import { useRef, useEffect, useState } from 'react';

export function GameBoard() {
  const { state, actions } = useGameState();
  const previousTileIdsRef = useRef<Set<string> | null>(null);
  const previousTilePositionsRef = useRef<Map<string, { row: number; col: number }>>(new Map());
  const previousPuzzleSeedRef = useRef<number | null>(null);
  const [newTileIds, setNewTileIds] = useState<Set<string>>(new Set());
  const tileDelaysRef = useRef<Map<string, number>>(new Map());

  const getTileAt = (row: number, col: number) => {
    return state.tiles.find(t => t.row === row && t.col === col);
  };

  const isTileSelected = (tileId: string) => {
    return state.selectedTiles.some(t => t.id === tileId);
  };

  // Track new tiles when they appear
  useEffect(() => {
    const currentTileIds = new Set(state.tiles.map(t => t.id));
    const currentPuzzleSeed = state.puzzle?.seed ?? null;
    const isNewGame = previousPuzzleSeedRef.current !== null && 
                      currentPuzzleSeed !== null && 
                      previousPuzzleSeedRef.current !== currentPuzzleSeed;
    
    // If this is a new game (puzzle seed changed), animate all tiles
    if (isNewGame && state.tiles.length > 0) {
      const allNewIds = new Set<string>();
      const newPositions = new Map<string, { row: number; col: number }>();
      state.tiles.forEach(tile => {
        allNewIds.add(tile.id);
        const delay = (tile.col * 40) + (tile.row * 30) + (Math.random() * 200);
        tileDelaysRef.current.set(tile.id, delay);
        newPositions.set(tile.id, { row: tile.row, col: tile.col });
      });
      
      setNewTileIds(allNewIds);
      const timer = setTimeout(() => {
        setNewTileIds(new Set());
        allNewIds.forEach(id => tileDelaysRef.current.delete(id));
      }, 1000);
      
      previousTileIdsRef.current = currentTileIds;
      previousTilePositionsRef.current = newPositions;
      previousPuzzleSeedRef.current = currentPuzzleSeed;
      
      return () => clearTimeout(timer);
    }
    
    // Initialize on first render - animate all tiles on initial game load
    if (previousTileIdsRef.current === null && state.tiles.length > 0) {
      const allNewIds = new Set<string>();
      const newPositions = new Map<string, { row: number; col: number }>();
      state.tiles.forEach(tile => {
        allNewIds.add(tile.id);
        const delay = (tile.col * 40) + (tile.row * 30) + (Math.random() * 200);
        tileDelaysRef.current.set(tile.id, delay);
        newPositions.set(tile.id, { row: tile.row, col: tile.col });
      });
      
      setNewTileIds(allNewIds);
      const timer = setTimeout(() => {
        setNewTileIds(new Set());
        allNewIds.forEach(id => tileDelaysRef.current.delete(id));
      }, 1000);
      
      previousTileIdsRef.current = currentTileIds;
      previousTilePositionsRef.current = newPositions;
      previousPuzzleSeedRef.current = currentPuzzleSeed;
      
      return () => clearTimeout(timer);
    }
    
    const previousIds = previousTileIdsRef.current;
    const previousPositions = previousTilePositionsRef.current;
    
    // Find tiles that are new (in current but not in previous)
    const newIds = new Set<string>();
    currentTileIds.forEach(id => {
      if (!previousIds.has(id)) {
        newIds.add(id);
        // Generate and store a random delay for this tile
        const tile = state.tiles.find(t => t.id === id);
        if (tile) {
          const delay = (tile.col * 40) + (tile.row * 30) + (Math.random() * 200);
          tileDelaysRef.current.set(id, delay);
        }
      }
    });

    // Find tiles that have moved positions (same ID but different row/col)
    const movedIds = new Set<string>();
    state.tiles.forEach(tile => {
      if (previousIds.has(tile.id)) {
        const previousPos = previousPositions.get(tile.id);
        if (previousPos && (previousPos.row !== tile.row || previousPos.col !== tile.col)) {
          movedIds.add(tile.id);
          // Generate delay based on how far they moved
          const rowDiff = Math.abs(previousPos.row - tile.row);
          const delay = (tile.col * 40) + (tile.row * 30) + (rowDiff * 50);
          tileDelaysRef.current.set(tile.id, delay);
        }
      }
    });

    // Combine new and moved tiles for animation
    const tilesToAnimate = new Set([...newIds, ...movedIds]);

    if (tilesToAnimate.size > 0) {
      setNewTileIds(tilesToAnimate);
      // Clear the animation flags and delays after animation completes
      const timer = setTimeout(() => {
        setNewTileIds(new Set());
        tilesToAnimate.forEach(id => tileDelaysRef.current.delete(id));
      }, 1000); // Slightly longer than animation duration
      
      // Update previous tile IDs and positions after detecting changes
      previousTileIdsRef.current = currentTileIds;
      const newPositions = new Map<string, { row: number; col: number }>();
      state.tiles.forEach(tile => {
        newPositions.set(tile.id, { row: tile.row, col: tile.col });
      });
      previousTilePositionsRef.current = newPositions;
      
      return () => clearTimeout(timer);
    }

    // Update previous tile IDs and positions even if no animations
    previousTileIdsRef.current = currentTileIds;
    const newPositions = new Map<string, { row: number; col: number }>();
    state.tiles.forEach(tile => {
      newPositions.set(tile.id, { row: tile.row, col: tile.col });
    });
    previousTilePositionsRef.current = newPositions;
    if (currentPuzzleSeed !== null) {
      previousPuzzleSeedRef.current = currentPuzzleSeed;
    }
  }, [state.tiles, state.puzzle?.seed]);

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
