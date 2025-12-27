import { Send, RefreshCw } from 'lucide-react';
import { useGameState } from '../../contexts/GameContext';

export function GameControls() {
  const { state, actions } = useGameState();

  const canSubmit = state.isWordValid && state.selectedTiles.length >= 2;

  return (
    <div className="w-full max-w-[25.2rem] mx-auto px-4 pb-2 mt-4 flex-shrink-0">
      <div className="flex gap-2">
        <button
          onClick={actions.refreshTiles}
          disabled={state.refreshUsed || state.gameStatus !== 'playing'}
          className={`
            flex-1 py-2.5 px-3 rounded-xl font-semibold text-white text-sm
            transition-all duration-200 flex items-center justify-center gap-2
            ${state.refreshUsed || state.gameStatus !== 'playing'
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-red-500 hover:bg-red-600 active:scale-95'
            }
          `}
        >
          <RefreshCw className="w-4 h-4" />
          Redraw ({state.refreshUsed ? 0 : 1})
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
          <Send className="w-4 h-4" />
          Submit
        </button>
      </div>
    </div>
  );
}
