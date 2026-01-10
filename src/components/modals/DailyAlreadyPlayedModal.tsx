import { Dices, Trophy } from 'lucide-react';
import { useGameState } from '../../contexts/GameContext';
import { LeaderboardModal } from './LeaderboardModal';
import { useState } from 'react';
import { trackEvent } from '../../services/analytics';

interface DailyAlreadyPlayedModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
}

export function DailyAlreadyPlayedModal({
  isOpen,
  onClose,
  score,
}: DailyAlreadyPlayedModalProps) {
  const { state, actions } = useGameState();
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  if (!isOpen) return null;

  const handlePlayCasual = () => {
    // Check if a casual game is already in progress
    const isCasualGameInProgress = state.gameMode === 'casual' && state.gameStatus === 'playing';
    
    if (isCasualGameInProgress) {
      // Just close the modal, don't restart the game
      actions.clearDailyGameAlreadyPlayed();
      onClose();
    } else {
      // Start a new casual game
      actions.clearDailyGameAlreadyPlayed();
      actions.initializeGame('casual');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-sm w-full p-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-2">
          Great Job! 🎉
        </h2>

        <p className="text-center text-gray-600 mb-6">
          You've played today's puzzle! Try a Casual game instead?
        </p>

        <div className="bg-gray-100 rounded-xl p-6 mb-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900">{score}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handlePlayCasual}
            className="py-4 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors flex items-center justify-center"
          >
            <Dices className="w-6 h-6" />
          </button>

          <button
            onClick={() => {
              setShowLeaderboard(true);
              trackEvent('view_leaderboard', {
                game_mode: 'daily',
                total_score: score,
              });
            }}
            className="py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center"
          >
            <Trophy className="w-6 h-6" />
          </button>
        </div>
      </div>

      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        openedFromDailyAlreadyPlayed={true}
      />
    </div>
  );
}

