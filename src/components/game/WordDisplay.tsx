import { X } from 'lucide-react';
import { useGameState } from '../../contexts/GameContext';
import { BONUS_COLORS } from '../../constants/gameConstants';

export function WordDisplay() {
  const { state, actions } = useGameState();

  const hasSelectedTiles = state.selectedTiles.length > 0;

  return (
    <div className="w-full max-w-[25.2rem] mx-auto px-4 mb-3 flex-shrink-0">
      <div className="text-center min-h-[88px] flex flex-col justify-center">
        {!hasSelectedTiles ? (
          <div className="text-gray-400 italic text-xs">
            Tap and hold to read your perks. Tap any letters to spell words.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="text-4xl font-bold text-gray-900 tracking-wider flex items-center">
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
              <button
                onClick={actions.clearSelection}
                className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                aria-label="Clear word"
              >
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
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
              <span className="text-base font-medium text-gray-700">
                {state.currentWordScore.finalScore} Point{state.currentWordScore.finalScore !== 1 ? 's' : ''}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
