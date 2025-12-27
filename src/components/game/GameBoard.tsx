import { useGameState } from '../../contexts/GameContext';
import { Tile } from './Tile';
import { GRID_ROWS, GRID_COLS } from '../../constants/gameConstants';

export function GameBoard() {
  const { state, actions } = useGameState();

  const getTileAt = (row: number, col: number) => {
    return state.tiles.find(t => t.row === row && t.col === col);
  };

  const isTileSelected = (tileId: string) => {
    return state.selectedTiles.some(t => t.id === tileId);
  };

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
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gray-200" />
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
