import { Calendar, Shuffle, Trophy, Share2 } from 'lucide-react';
import { useGameState } from '../../contexts/GameContext';

interface GameOverModalProps {
  isOpen: boolean;
  onPlayAgain: () => void;
}

export function GameOverModal({ isOpen, onPlayAgain }: GameOverModalProps) {
  const { state, actions } = useGameState();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-6">
          Word Up!
        </h2>

        <div className="bg-gray-100 rounded-xl p-6 mb-6">
          <div className="text-center mb-4">
            <div className="text-5xl font-bold text-gray-900">{state.totalScore}</div>
            <div className="text-lg text-gray-600">Total Points</div>
          </div>

          <div className="space-y-2">
            {state.wordsCompleted.map((word, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="font-medium text-gray-900">{word.word}</span>
                <span className="text-gray-600">{word.score} pts</span>
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
            <Shuffle className="w-6 h-6" />
          </button>

          <button
            onClick={() => {}}
            className="py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center"
          >
            <Share2 className="w-6 h-6" />
          </button>

          <button
            onClick={() => {}}
            className="py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center"
          >
            <Trophy className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
