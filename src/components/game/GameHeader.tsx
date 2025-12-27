import { HelpCircle, Calendar, Shuffle } from 'lucide-react';
import { useGameState } from '../../contexts/GameContext';
import { useState, useRef, useEffect } from 'react';

interface GameHeaderProps {
  onHelpClick: () => void;
}

export function GameHeader({ onHelpClick }: GameHeaderProps) {
  const { state, actions } = useGameState();
  const [showDailyTooltip, setShowDailyTooltip] = useState(false);
  const [showCasualTooltip, setShowCasualTooltip] = useState(false);
  const dailyTimeoutRef = useRef<number | null>(null);
  const casualTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (dailyTimeoutRef.current) {
        clearTimeout(dailyTimeoutRef.current);
      }
      if (casualTimeoutRef.current) {
        clearTimeout(casualTimeoutRef.current);
      }
    };
  }, []);

  const handleDailyMouseDown = () => {
    dailyTimeoutRef.current = window.setTimeout(() => {
      setShowDailyTooltip(true);
    }, 500);
  };

  const handleDailyMouseUp = () => {
    if (dailyTimeoutRef.current) {
      clearTimeout(dailyTimeoutRef.current);
      dailyTimeoutRef.current = null;
    }
  };

  const handleDailyMouseLeave = () => {
    handleDailyMouseUp();
    setShowDailyTooltip(false);
  };

  const handleCasualMouseDown = () => {
    casualTimeoutRef.current = window.setTimeout(() => {
      setShowCasualTooltip(true);
    }, 500);
  };

  const handleCasualMouseUp = () => {
    if (casualTimeoutRef.current) {
      clearTimeout(casualTimeoutRef.current);
      casualTimeoutRef.current = null;
    }
  };

  const handleCasualMouseLeave = () => {
    handleCasualMouseUp();
    setShowCasualTooltip(false);
  };

  return (
    <header className="w-full max-w-[25.2rem] mx-auto px-4 pt-2 pb-1 flex-shrink-0">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-gray-900">LetterPerk</h1>

        <div className="flex items-center gap-1.5">
          <div className="bg-gray-200 rounded-lg w-12 h-12 flex flex-col items-center justify-center">
            <div className="text-xl font-bold text-gray-900 text-center leading-tight">
              {state.totalScore}
            </div>
            <div className="text-[9px] text-gray-600 text-center whitespace-nowrap leading-tight">
              Points
            </div>
          </div>

          <div className="bg-gray-200 rounded-lg w-12 h-12 flex flex-col items-center justify-center">
            <div className="text-xl font-bold text-gray-900 text-center leading-tight">
              {state.wordsRemaining}
            </div>
            <div className="text-[9px] text-gray-600 text-center whitespace-nowrap leading-tight">
              Words
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => actions.setGameMode('daily')}
              disabled={state.gameStatus === 'loading'}
              onMouseDown={handleDailyMouseDown}
              onMouseUp={handleDailyMouseUp}
              onMouseLeave={handleDailyMouseLeave}
              onTouchStart={handleDailyMouseDown}
              onTouchEnd={handleDailyMouseUp}
              className={`
                w-10 h-12 rounded-lg font-semibold
                transition-all duration-200 flex items-center justify-center
                ${state.gameStatus === 'loading'
                  ? 'cursor-not-allowed'
                  : 'active:scale-95'
                }
                ${state.gameMode === 'daily'
                  ? 'bg-gray-700 text-white shadow-sm'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }
              `}
              aria-label="Daily mode"
            >
              <Calendar className="w-6 h-6" />
            </button>
            {showDailyTooltip && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50 pointer-events-none">
                <div className="bg-gray-900 text-white text-sm rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                  <div className="font-semibold">Daily Mode</div>
                  <div className="text-xs text-gray-300">Play the same puzzle as everyone else today</div>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => actions.setGameMode('casual')}
              disabled={state.gameStatus === 'loading'}
              onMouseDown={handleCasualMouseDown}
              onMouseUp={handleCasualMouseUp}
              onMouseLeave={handleCasualMouseLeave}
              onTouchStart={handleCasualMouseDown}
              onTouchEnd={handleCasualMouseUp}
              className={`
                w-10 h-12 rounded-lg font-semibold
                transition-all duration-200 flex items-center justify-center
                ${state.gameStatus === 'loading'
                  ? 'cursor-not-allowed'
                  : 'active:scale-95'
                }
                ${state.gameMode === 'casual'
                  ? 'bg-gray-700 text-white shadow-sm'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }
              `}
              aria-label="Casual mode"
            >
              <Shuffle className="w-6 h-6" />
            </button>
            {showCasualTooltip && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50 pointer-events-none">
                <div className="bg-gray-900 text-white text-sm rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                  <div className="font-semibold">Casual Mode</div>
                  <div className="text-xs text-gray-300">Play unlimited random puzzles</div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onHelpClick}
            className="bg-gray-200 rounded-lg w-10 h-12 flex items-center justify-center hover:bg-gray-300 transition-all duration-200 active:scale-95"
            aria-label="Help"
          >
            <HelpCircle className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  );
}
