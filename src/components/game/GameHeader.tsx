import { HelpCircle, Calendar, Shuffle } from 'lucide-react';
import { useGameState } from '../../contexts/GameContext';

interface GameHeaderProps {
  onHelpClick: () => void;
}

export function GameHeader({ onHelpClick }: GameHeaderProps) {
  const { state, actions } = useGameState();

  return (
    <header className="w-full max-w-[25.2rem] mx-auto px-4 pt-2 pb-1 flex-shrink-0">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-gray-900">LetterPerk</h1>

        <div className="flex items-center gap-1.5">
          <div className="bg-gray-100 rounded-lg w-12 h-12 flex flex-col items-center justify-center">
            <div className="text-xl font-bold text-gray-900 text-center leading-tight">
              {state.totalScore}
            </div>
            <div className="text-[9px] text-gray-600 text-center whitespace-nowrap leading-tight">
              Points
            </div>
          </div>

          <div className="bg-gray-100 rounded-lg w-12 h-12 flex flex-col items-center justify-center">
            <div className="text-xl font-bold text-gray-900 text-center leading-tight">
              {state.wordsRemaining}
            </div>
            <div className="text-[9px] text-gray-600 text-center whitespace-nowrap leading-tight">
              Words
            </div>
          </div>

          <button
            onClick={() => actions.setGameMode('daily')}
            disabled={state.gameStatus === 'loading'}
            className={`
              w-10 h-12 rounded-lg font-semibold
              transition-all duration-200 flex items-center justify-center
              ${state.gameMode === 'daily'
                ? 'bg-gray-700 text-white shadow-sm'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }
            `}
            aria-label="Daily mode"
          >
            <Calendar className="w-6 h-6" />
          </button>

          <button
            onClick={() => actions.setGameMode('casual')}
            disabled={state.gameStatus === 'loading'}
            className={`
              w-10 h-12 rounded-lg font-semibold
              transition-all duration-200 flex items-center justify-center
              ${state.gameMode === 'casual'
                ? 'bg-gray-700 text-white shadow-sm'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }
            `}
            aria-label="Casual mode"
          >
            <Shuffle className="w-6 h-6" />
          </button>

          <button
            onClick={onHelpClick}
            className="bg-gray-100 rounded-lg w-10 h-12 flex items-center justify-center hover:bg-gray-200 transition-colors"
            aria-label="Help"
          >
            <HelpCircle className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  );
}
