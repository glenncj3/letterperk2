import { Calendar, Dices, Trophy, Share2 } from 'lucide-react';
import { useGameState } from '../../contexts/GameContext';
import { generateShareText, copyToClipboard } from '../../utils/shareUtils';
import { LeaderboardModal } from './LeaderboardModal';
import { useState } from 'react';
import { trackEvent } from '../../services/analytics';

interface GameOverModalProps {
  isOpen: boolean;
  onPlayAgain: () => void;
}

export function GameOverModal({ isOpen, onPlayAgain }: GameOverModalProps) {
  const { state, actions } = useGameState();
  const [shareFeedback, setShareFeedback] = useState<string>('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  if (!isOpen) return null;

  const handleShare = async () => {
    const shareText = generateShareText(state);
    if (shareText) {
      const success = await copyToClipboard(shareText);
      if (success) {
        setShareFeedback('Copied to clipboard!');
        setTimeout(() => setShareFeedback(''), 2000);
        
        // Track share event
        trackEvent('share', {
          method: 'clipboard',
          game_mode: state.gameMode,
          total_score: state.totalScore,
          word_count: state.wordsCompleted.length,
        });
      } else {
        setShareFeedback('Failed to copy');
        setTimeout(() => setShareFeedback(''), 2000);
        
        // Track share error
        trackEvent('share_error', {
          method: 'clipboard',
          error: 'copy_failed',
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-6">
          Word Up!
        </h2>

        <div className="bg-gray-100 rounded-xl p-6 mb-6">
          <div className="text-center mb-4">
            <div className="text-5xl font-bold text-gray-900">{state.totalScore}</div>
          </div>

          <div className="space-y-2">
            {state.wordsCompleted.map((word, index) => (
              <div key={index} className="text-center">
                <span className="font-medium text-gray-900">{word.word}: {word.score}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => actions.setGameMode('daily')}
            className="py-4 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors flex items-center justify-center"
          >
            <Calendar className="w-6 h-6" />
          </button>

          <button
            onClick={() => actions.setGameMode('casual')}
            className="py-4 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors flex items-center justify-center"
          >
            <Dices className="w-6 h-6" />
          </button>

          <button
            onClick={handleShare}
            className="py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center relative"
          >
            <Share2 className="w-6 h-6" />
            {shareFeedback && (
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {shareFeedback}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setShowLeaderboard(true);
              trackEvent('view_leaderboard', {
                game_mode: state.gameMode,
                total_score: state.totalScore,
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
      />
    </div>
  );
}
