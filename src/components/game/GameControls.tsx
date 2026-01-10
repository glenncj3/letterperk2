import { Send, RefreshCw, Shuffle } from 'lucide-react';
import { useGameState } from '../../contexts/GameContext';
import { useRef, useEffect } from 'react';
import { trackEvent } from '../../services/analytics';

export function GameControls() {
  const { state, actions } = useGameState();
  const redrawTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (redrawTimeoutRef.current) {
        clearTimeout(redrawTimeoutRef.current);
      }
    };
  }, []);

  const handleRedrawMouseDown = () => {
    if (state.tradesAvailable > 0 && state.gameStatus === 'playing') {
      redrawTimeoutRef.current = window.setTimeout(() => {
        actions.setTooltip({ title: 'Trade', description: 'Replace selected tiles with new ones' });
      }, 500);
    }
  };

  const handleRedrawMouseUp = () => {
    if (redrawTimeoutRef.current) {
      clearTimeout(redrawTimeoutRef.current);
      redrawTimeoutRef.current = null;
    }
  };

  const handleRedrawMouseLeave = () => {
    handleRedrawMouseUp();
    actions.setTooltip(null);
  };

  const handleRedrawTouchEnd = () => {
    handleRedrawMouseUp();
    // On touch devices, if tooltip was shown, prevent the click
    if (state.tooltip) {
      setTimeout(() => {
        actions.setTooltip(null);
      }, 100);
    }
  };

  const handleRedrawClick = (e: React.MouseEvent) => {
    // Prevent action if tooltip was shown
    if (state.tooltip) {
      e.preventDefault();
      e.stopPropagation();
      setTimeout(() => {
        actions.setTooltip(null);
      }, 100);
      return;
    }
    // Prevent action if button is disabled
    if (!canRedraw) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // Track tile refresh
    trackEvent('tile_refresh', {
      game_mode: state.gameMode,
      tiles_selected: state.selectedTiles.length,
      trades_remaining: state.tradesAvailable - 1,
    });
    
    actions.refreshTiles();
  };

  const canSubmit = state.isWordValid && state.selectedTiles.length >= 2;
  const canRedraw = state.tradesAvailable > 0 && state.gameStatus === 'playing' && state.selectedTiles.length > 0;
  const canShuffle = state.gameStatus === 'playing' && state.tiles.length > 0;

  const handleShuffleClick = () => {
    if (!canShuffle) return;
    actions.shuffleTilesInGrid();
  };

  return (
    <div className="w-full max-w-sm mx-auto px-4 pb-2 mt-4 flex-shrink-0">
      <div className="flex gap-2">
        <button
          onClick={handleRedrawClick}
          onMouseDown={handleRedrawMouseDown}
          onMouseUp={handleRedrawMouseUp}
          onMouseLeave={handleRedrawMouseLeave}
          onTouchStart={handleRedrawMouseDown}
          onTouchEnd={handleRedrawTouchEnd}
          className={`
            flex-1 py-2.5 px-3 rounded-xl font-semibold text-sm
            transition-all duration-200 flex items-center justify-center gap-2
            ${canRedraw
              ? 'bg-gray-500 hover:bg-gray-700 text-white active:scale-95'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          <RefreshCw className="w-4 h-4 drop-shadow-md" />
          <span className="drop-shadow-md">Trade ({state.tradesAvailable})</span>
        </button>

        <button
          onClick={handleShuffleClick}
          disabled={!canShuffle}
          className={`
            flex-1 py-2.5 px-3 rounded-xl font-semibold text-sm
            transition-all duration-200 flex items-center justify-center gap-2
            ${canShuffle
              ? 'bg-blue-800 hover:bg-blue-900 text-white active:scale-95'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          <Shuffle className="w-4 h-4 drop-shadow-md" />
          <span className="drop-shadow-md">Shuffle</span>
        </button>

        <button
          onClick={actions.submitWord}
          disabled={!canSubmit || state.gameStatus !== 'playing'}
          className={`
            flex-1 py-2.5 px-3 rounded-xl font-semibold text-sm
            transition-all duration-200 flex items-center justify-center gap-2
            ${canSubmit && state.gameStatus === 'playing'
              ? 'bg-green-500 hover:bg-green-600 text-white active:scale-95'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          <Send className="w-4 h-4 drop-shadow-md" />
          <span className="drop-shadow-md">Submit</span>
        </button>
      </div>
    </div>
  );
}
