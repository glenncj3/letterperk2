import { X } from 'lucide-react';
import { BONUS_COLORS } from '../../constants/gameConstants';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">How to Play</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Objective</h3>
            <p className="text-gray-700">
              Spell 4 valid words using letter tiles to maximize your score.
              Each word must be at least 2 letters long.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">How to Play</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Tap tiles to select letters and form a word</li>
              <li>Tap the last selected tile again to deselect it</li>
              <li>Use the Submit button when you have a valid word</li>
              <li>Complete 4 words to finish the game</li>
            </ol>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Bonus Perks</h3>
            <p className="text-gray-700 mb-3">
              Some tiles have special bonus perks (shown by colored borders/backgrounds).
              Long-press any bonus tile to see what it does!
            </p>
            <div className="space-y-3">
              {Object.entries(BONUS_COLORS).map(([type, config]) => (
                <div key={type} className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-full ${config.bg} flex-shrink-0 border-4 ${config.border}`} />
                  <div>
                    <div className="font-semibold text-gray-900">{config.name}</div>
                    <div className="text-sm text-gray-600">{config.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Special Features</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><strong>Refresh Tiles:</strong> Use once per game to redraw all tiles</li>
              <li><strong>Gravity:</strong> Tiles fall down when words are removed</li>
              <li><strong>Column Sequences:</strong> Each column refills from its own sequence</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Scoring</h3>
            <p className="text-gray-700">
              Your score is calculated from the point values of the letters you use,
              plus any bonus perks. The Purple bonus doubles your total word score
              (applied after all other bonuses).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
