import { Trophy, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getLeaderboard } from '../../lib/puzzle';
import { getTodayUTC, formatUTCDateString } from '../../utils/seedGenerator';

interface LeaderboardModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface LeaderboardEntry {
    total_score: number;
    word_count: number;
    created_at: string;
}

export function LeaderboardModal({ isOpen, onClose }: LeaderboardModalProps) {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadLeaderboard();
        }
    }, [isOpen]);

    const loadLeaderboard = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const today = getTodayUTC();
            const dateString = formatUTCDateString(today);

            const data = await getLeaderboard('daily', dateString);
            setLeaderboard(data);
        } catch (err) {
            console.error('Error loading leaderboard:', err);
            setError('Failed to load leaderboard');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <Trophy className="w-8 h-8 text-yellow-500" />
                    <h2 className="text-3xl font-bold text-gray-900">Today's Top 10</h2>
                </div>

                {isLoading && (
                    <div className="text-center py-8 text-gray-500">
                        Loading leaderboard...
                    </div>
                )}

                {error && (
                    <div className="text-center py-8 text-red-500">
                        {error}
                    </div>
                )}

                {!isLoading && !error && (
                    <div className="space-y-2">
                        {leaderboard.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No scores yet today. Be the first!
                            </div>
                        ) : (
                            leaderboard.map((entry, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 flex items-center justify-center font-bold text-gray-700">
                                            {index + 1}
                                        </div>
                                        <div className="font-semibold text-gray-900">
                                            {entry.total_score}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

