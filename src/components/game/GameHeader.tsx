import { HelpCircle, Calendar, Dices } from 'lucide-react';
import { useGameState } from '../../contexts/GameContext';
import { useState, useEffect } from 'react';
import { useTooltipHandler } from '../../hooks/useTooltipHandler';

interface GameHeaderProps {
  onHelpClick: () => void;
}

export function GameHeader({ onHelpClick }: GameHeaderProps) {
  const { state, actions } = useGameState();
  const [hasInteracted, setHasInteracted] = useState(false);

  // Tooltip handlers using the reusable hook
  const dailyTooltip = useTooltipHandler({
    tooltip: { title: 'Daily Mode', description: 'Play the same puzzle as everyone else today' },
    delay: 500,
    setTooltip: actions.setTooltip,
    onClick: (e) => {
      // Check if tooltip is currently shown (from hook or elsewhere)
      if (state.tooltip) {
        e.preventDefault();
        e.stopPropagation();
        setTimeout(() => {
          actions.setTooltip(null);
        }, 100);
        return;
      }
      actions.setGameMode('daily');
    },
  });

  const casualTooltip = useTooltipHandler({
    tooltip: { title: 'Casual Mode', description: 'Play unlimited random puzzles' },
    delay: 500,
    setTooltip: actions.setTooltip,
    onClick: (e) => {
      // Check if tooltip is currently shown (from hook or elsewhere)
      if (state.tooltip) {
        e.preventDefault();
        e.stopPropagation();
        setTimeout(() => {
          actions.setTooltip(null);
        }, 100);
        return;
      }
      actions.setGameMode('casual');
    },
  });

  const pointsTooltip = useTooltipHandler({
    tooltip: { title: 'Total Score', description: 'Points from all words this game' },
    delay: 500,
    setTooltip: actions.setTooltip,
  });

  const wordsTooltip = useTooltipHandler({
    tooltip: { title: 'Words Remaining', description: 'Number of words left to submit' },
    delay: 500,
    setTooltip: actions.setTooltip,
  });

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


  return (
    <header className="w-full max-w-[25.2rem] mx-auto px-4 pt-2 pb-1 flex-shrink-0">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-gray-900">LetterPerk</h1>

        <div className="flex items-center gap-1.5">
          <div className="relative">
            <div
              className="bg-gray-200 rounded-lg w-12 h-12 flex flex-col items-center justify-center cursor-help"
              onMouseDown={pointsTooltip.handleMouseDown}
              onMouseUp={pointsTooltip.handleMouseUp}
              onMouseLeave={pointsTooltip.handleMouseLeave}
              onTouchStart={pointsTooltip.handleTouchStart}
              onTouchEnd={pointsTooltip.handleTouchEnd}
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
              onMouseDown={wordsTooltip.handleMouseDown}
              onMouseUp={wordsTooltip.handleMouseUp}
              onMouseLeave={wordsTooltip.handleMouseLeave}
              onTouchStart={wordsTooltip.handleTouchStart}
              onTouchEnd={wordsTooltip.handleTouchEnd}
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
              onClick={dailyTooltip.handleClick}
              disabled={state.gameStatus === 'loading'}
              onMouseDown={dailyTooltip.handleMouseDown}
              onMouseUp={dailyTooltip.handleMouseUp}
              onMouseLeave={dailyTooltip.handleMouseLeave}
              onTouchStart={dailyTooltip.handleTouchStart}
              onTouchEnd={dailyTooltip.handleTouchEnd}
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
              onClick={casualTooltip.handleClick}
              disabled={state.gameStatus === 'loading'}
              onMouseDown={casualTooltip.handleMouseDown}
              onMouseUp={casualTooltip.handleMouseUp}
              onMouseLeave={casualTooltip.handleMouseLeave}
              onTouchStart={casualTooltip.handleTouchStart}
              onTouchEnd={casualTooltip.handleTouchEnd}
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
              <Dices className="w-6 h-6" />
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
