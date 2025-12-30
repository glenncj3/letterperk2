import { HelpCircle, Calendar, Shuffle } from 'lucide-react';
import { useGameState } from '../../contexts/GameContext';
import { useState, useRef, useEffect } from 'react';

interface GameHeaderProps {
  onHelpClick: () => void;
}

export function GameHeader({ onHelpClick }: GameHeaderProps) {
  const { state, actions } = useGameState();
  const [hasInteracted, setHasInteracted] = useState(false);
  const dailyTimeoutRef = useRef<number | null>(null);
  const casualTimeoutRef = useRef<number | null>(null);
  const pointsTimeoutRef = useRef<number | null>(null);
  const wordsTimeoutRef = useRef<number | null>(null);
  const dailyTooltipShownRef = useRef(false);
  const casualTooltipShownRef = useRef(false);

  useEffect(() => {
    return () => {
      if (dailyTimeoutRef.current) {
        clearTimeout(dailyTimeoutRef.current);
      }
      if (casualTimeoutRef.current) {
        clearTimeout(casualTimeoutRef.current);
      }
      if (pointsTimeoutRef.current) {
        clearTimeout(pointsTimeoutRef.current);
      }
      if (wordsTimeoutRef.current) {
        clearTimeout(wordsTimeoutRef.current);
      }
    };
  }, []);

  // Reset glimmer when game status changes to 'playing' (new game started)
  useEffect(() => {
    if (state.gameStatus === 'playing') {
      setHasInteracted(false);
    }
  }, [state.gameStatus]);

  // Track first interaction (click or tap) to remove glimmer
  useEffect(() => {
    if (hasInteracted || state.gameStatus !== 'playing') return;

    const handleFirstInteraction = () => {
      setHasInteracted(true);
    };

    // Listen for clicks and touches
    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [hasInteracted, state.gameStatus]);

  const handleDailyMouseDown = () => {
    dailyTooltipShownRef.current = false;
    dailyTimeoutRef.current = window.setTimeout(() => {
      actions.setTooltip({ title: 'Daily Mode', description: 'Play the same puzzle as everyone else today' });
      dailyTooltipShownRef.current = true;
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
    actions.setTooltip(null);
    dailyTooltipShownRef.current = false;
  };

  const handleDailyClick = (e: React.MouseEvent) => {
    if (dailyTooltipShownRef.current || state.tooltip) {
      e.preventDefault();
      e.stopPropagation();
      setTimeout(() => {
        dailyTooltipShownRef.current = false;
        actions.setTooltip(null);
      }, 100);
      return;
    }
    actions.setGameMode('daily');
  };

  const handleDailyTouchEnd = () => {
    handleDailyMouseUp();
    if (dailyTooltipShownRef.current || state.tooltip) {
      setTimeout(() => {
        dailyTooltipShownRef.current = false;
        actions.setTooltip(null);
      }, 100);
    }
  };

  const handleCasualMouseDown = () => {
    casualTooltipShownRef.current = false;
    casualTimeoutRef.current = window.setTimeout(() => {
      actions.setTooltip({ title: 'Casual Mode', description: 'Play unlimited random puzzles' });
      casualTooltipShownRef.current = true;
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
    actions.setTooltip(null);
    casualTooltipShownRef.current = false;
  };

  const handleCasualClick = (e: React.MouseEvent) => {
    if (casualTooltipShownRef.current || state.tooltip) {
      e.preventDefault();
      e.stopPropagation();
      setTimeout(() => {
        casualTooltipShownRef.current = false;
        actions.setTooltip(null);
      }, 100);
      return;
    }
    actions.setGameMode('casual');
  };

  const handleCasualTouchEnd = () => {
    handleCasualMouseUp();
    if (casualTooltipShownRef.current || state.tooltip) {
      setTimeout(() => {
        casualTooltipShownRef.current = false;
        actions.setTooltip(null);
      }, 100);
    }
  };

  const handlePointsMouseDown = () => {
    pointsTimeoutRef.current = window.setTimeout(() => {
      actions.setTooltip({ title: 'Total Score', description: 'Points from all words this game' });
    }, 500);
  };

  const handlePointsMouseUp = () => {
    if (pointsTimeoutRef.current) {
      clearTimeout(pointsTimeoutRef.current);
      pointsTimeoutRef.current = null;
    }
  };

  const handlePointsMouseLeave = () => {
    handlePointsMouseUp();
    actions.setTooltip(null);
  };

  const handleWordsMouseDown = () => {
    wordsTimeoutRef.current = window.setTimeout(() => {
      actions.setTooltip({ title: 'Words Remaining', description: 'Number of words left to submit' });
    }, 500);
  };

  const handleWordsMouseUp = () => {
    if (wordsTimeoutRef.current) {
      clearTimeout(wordsTimeoutRef.current);
      wordsTimeoutRef.current = null;
    }
  };

  const handleWordsMouseLeave = () => {
    handleWordsMouseUp();
    actions.setTooltip(null);
  };

  return (
    <header className="w-full max-w-[25.2rem] mx-auto px-4 pt-2 pb-1 flex-shrink-0">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-gray-900">LetterPerk</h1>

        <div className="flex items-center gap-1.5">
          <div className="relative">
            <div
              className="bg-gray-200 rounded-lg w-12 h-12 flex flex-col items-center justify-center cursor-help"
              onMouseDown={handlePointsMouseDown}
              onMouseUp={handlePointsMouseUp}
              onMouseLeave={handlePointsMouseLeave}
              onTouchStart={handlePointsMouseDown}
              onTouchEnd={handlePointsMouseUp}
            >
              <div className="text-xl font-bold text-gray-900 text-center leading-tight">
                {state.totalScore}
              </div>
              <div className="text-[9px] text-gray-600 text-center whitespace-nowrap leading-tight">
                Points
              </div>
            </div>
          </div>

          <div className="relative">
            <div
              className="bg-gray-200 rounded-lg w-12 h-12 flex flex-col items-center justify-center cursor-help"
              onMouseDown={handleWordsMouseDown}
              onMouseUp={handleWordsMouseUp}
              onMouseLeave={handleWordsMouseLeave}
              onTouchStart={handleWordsMouseDown}
              onTouchEnd={handleWordsMouseUp}
            >
              <div className="text-xl font-bold text-gray-900 text-center leading-tight">
                {state.wordsRemaining}
              </div>
              <div className="text-[9px] text-gray-600 text-center whitespace-nowrap leading-tight">
                Words
              </div>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={handleDailyClick}
              disabled={state.gameStatus === 'loading'}
              onMouseDown={handleDailyMouseDown}
              onMouseUp={handleDailyMouseUp}
              onMouseLeave={handleDailyMouseLeave}
              onTouchStart={handleDailyMouseDown}
              onTouchEnd={handleDailyTouchEnd}
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
          </div>

          <div className="relative">
            <button
              onClick={handleCasualClick}
              disabled={state.gameStatus === 'loading'}
              onMouseDown={handleCasualMouseDown}
              onMouseUp={handleCasualMouseUp}
              onMouseLeave={handleCasualMouseLeave}
              onTouchStart={handleCasualMouseDown}
              onTouchEnd={handleCasualTouchEnd}
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
          </div>

          <button
            onClick={onHelpClick}
            className={`bg-gray-200 rounded-lg w-10 h-12 flex items-center justify-center hover:bg-gray-300 transition-all duration-200 active:scale-95 ${!hasInteracted && state.gameStatus === 'playing' ? 'animate-glimmer' : ''}`}
            aria-label="Help"
          >
            <HelpCircle className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  );
}
