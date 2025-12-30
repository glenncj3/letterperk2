import { Send, RefreshCw } from 'lucide-react';
import { useGameState } from '../../contexts/GameContext';
import { useState, useRef, useEffect } from 'react';

export function GameControls() {
  const { state, actions } = useGameState();
  const [showRedrawTooltip, setShowRedrawTooltip] = useState(false);
  const redrawTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (redrawTimeoutRef.current) {
        clearTimeout(redrawTimeoutRef.current);
      }
    };
  }, []);

  const handleRedrawMouseDown = () => {
    if (!state.refreshUsed && state.gameStatus === 'playing') {
      redrawTimeoutRef.current = window.setTimeout(() => {
        setShowRedrawTooltip(true);
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
    setShowRedrawTooltip(false);
  };

  const handleRedrawTouchEnd = () => {
    handleRedrawMouseUp();
    // On touch devices, if tooltip was shown, prevent the click
    if (showRedrawTooltip) {
      setTimeout(() => {
        setShowRedrawTooltip(false);
      }, 100);
    }
  };

  const handleRedrawClick = (e: React.MouseEvent) => {
    // Prevent action if tooltip was shown
    if (showRedrawTooltip) {
      e.preventDefault();
      e.stopPropagation();
      setTimeout(() => {
        setShowRedrawTooltip(false);
      }, 100);
      return;
    }
    actions.refreshTiles();
  };

  const canSubmit = state.isWordValid && state.selectedTiles.length >= 2;

  return (
    <div className="w-full max-w-[25.2rem] mx-auto px-4 pb-2 mt-4 flex-shrink-0">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <button
            onClick={handleRedrawClick}
            disabled={state.refreshUsed || state.gameStatus !== 'playing'}
            onMouseDown={handleRedrawMouseDown}
            onMouseUp={handleRedrawMouseUp}
            onMouseLeave={handleRedrawMouseLeave}
            onTouchStart={handleRedrawMouseDown}
            onTouchEnd={handleRedrawTouchEnd}
            className={`
              w-full py-2.5 px-3 rounded-xl font-semibold text-sm
              transition-all duration-200 flex items-center justify-center gap-2
              ${state.refreshUsed || state.gameStatus !== 'playing'
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white active:scale-95'
              }
            `}
          >
            <RefreshCw className="w-4 h-4" />
            Redraw ({state.refreshUsed ? 0 : 1})
          </button>
          {showRedrawTooltip && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 pointer-events-none">
              <div className="bg-gray-900 text-white text-sm rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                <div className="font-semibold">Redraw Tiles</div>
                <div className="text-xs text-gray-300">Replace all tiles with new ones</div>
              </div>
            </div>
          )}
        </div>

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
          <Send className="w-4 h-4" />
          Submit
        </button>
      </div>
    </div>
  );
}
