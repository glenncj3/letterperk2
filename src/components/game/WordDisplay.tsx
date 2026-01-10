import { Delete, RefreshCw } from 'lucide-react';
import { useGameState } from '../../contexts/GameContext';
import { BONUS_COLORS } from '../../constants/gameConstants';

export function WordDisplay() {
  const { state, actions } = useGameState();

  const hasSelectedTiles = state.selectedTiles.length > 0;

  return (
    <div className="w-full max-w-[25.2rem] mx-auto px-4 mb-3 flex-shrink-0 relative">
      <div className="text-center min-h-[88px] flex flex-col justify-center relative">
        {state.tooltip && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none w-full max-w-[20rem] px-4">
            <div className="bg-gray-900 text-white text-sm rounded-lg px-4 py-3 shadow-xl">
              <div className="font-semibold whitespace-normal">{state.tooltip.title}</div>
              <div className="text-xs text-gray-300 mt-1 whitespace-normal">{state.tooltip.description}</div>
            </div>
          </div>
        )}
        {!hasSelectedTiles ? (
          <div className="text-gray-400 italic text-xs">
            Tap and hold to read your perks. Tap any letters to spell words.
          </div>
        ) : (
          <>
            <div className="mb-2">
              <div className="text-4xl font-bold text-gray-900 tracking-wider flex items-center justify-center">
                {state.currentWord.split('').map((letter, index) => (
                  <span
                    key={`${letter}-${index}`}
                    className={state.isWordValid ? 'animate-letter-pulse' : ''}
                    style={{
                      animationDelay: state.isWordValid ? `${index * 100}ms` : undefined
                    }}
                  >
                    {letter}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              {state.currentWordScore.bonuses.length > 0 && (
                <>
                  {state.currentWordScore.bonuses.map((bonus, index) => {
                    const colors = BONUS_COLORS[bonus.type];
                    return (
                      <div
                        key={`${bonus.type}-${index}`}
                        className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-white ${colors.bg}`}
                      >
                        {bonus.type === 'purple' ? '×2' : `+${bonus.value}`}
                      </div>
                    );
                  })}
                </>
              )}
              {/* Show black bonus indicator if any selected tiles have black bonus */}
              {state.selectedTiles.some(tile => tile.bonusType === 'black') && (
                <div className="w-7 h-7 rounded flex items-center justify-center bg-gray-500 border-0">
                  <RefreshCw className="w-4 h-4 text-white" />
                </div>
              )}
              <span className="text-base font-medium text-gray-700">
                {state.currentWordScore.finalScore} Point{state.currentWordScore.finalScore !== 1 ? 's' : ''}
              </span>
            </div>
          </>
        )}
      </div>
      {hasSelectedTiles && (
        <button
          onClick={actions.removeLastTile}
          className="absolute right-4 top-[35%] -translate-y-1/2 bg-gray-200 rounded-lg w-10 h-12 flex items-center justify-center hover:bg-gray-300 transition-all duration-200 active:scale-95"
          aria-label="Remove last tile"
        >
          <Delete className="w-6 h-6 text-gray-600" />
        </button>
      )}
    </div>
  );
}
