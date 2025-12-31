import { X } from 'lucide-react';
import { BONUS_COLORS } from '../../constants/gameConstants';
import { trackEvent } from '../../services/analytics';
import { useEffect } from 'react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  useEffect(() => {
    if (isOpen) {
      trackEvent('view_help', {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome to LetterPerk!</h2>
              <p className="text-sm italic text-gray-500 mt-1">Updated 12/30/25</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">How to Play</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Each game, spell the required number of words</li>
              <li>Tap letters to spell words</li>
              <li>Used letters get replaced by new ones</li>
              <li>Focus on perks and points to score big</li>
              <li>In a bind? Trade in some tiles!</li>
            </ol>
          </section>

          <section>
            <p className="text-gray-700 mb-3">
              Play the Daily game for the leaderboard, or have fun in Casual mode!
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Bonus Perks</h3>
            <p className="text-gray-700 mb-3">
              Tap and hold any bonus tile to see what it does!
            </p>
            <div className="space-y-3">
              {Object.entries(BONUS_COLORS).map(([type, config]) => (
                <div key={type} className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-full ${type === 'black' ? 'bg-gray-500' : config.bg} flex-shrink-0 border-4 ${type === 'black' ? 'border-gray-500' : config.border}`} />
                  <div>
                    <div className="font-semibold text-gray-900">{config.name}</div>
                    <div className="text-sm text-gray-600">{config.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
