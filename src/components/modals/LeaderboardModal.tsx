import { Trophy, X, Calendar, Dices, Share2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { getLeaderboard } from '../../lib/puzzle';
import { getTodayUTC, formatUTCDateString } from '../../utils/seedGenerator';
import { LeaderboardEntry } from '../../repositories/interfaces/IGameResultRepository';
import { getLogger } from '../../services/Logger';
import { useGameState } from '../../contexts/GameContext';
import { generateShareText, copyToClipboard } from '../../utils/shareUtils';
import { trackEvent } from '../../services/analytics';

interface LeaderboardModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LeaderboardModal({ isOpen, onClose }: LeaderboardModalProps) {
    const { state, actions } = useGameState();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [shareFeedback, setShareFeedback] = useState<string>('');

    const loadLeaderboard = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const today = getTodayUTC();
            const dateString = formatUTCDateString(today);

            const data = await getLeaderboard('daily', dateString);
            setLeaderboard(data);
        } catch (err) {
            getLogger().error('Error loading leaderboard', err);
            setError('Failed to load leaderboard');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadLeaderboard();
        }
    }, [isOpen, loadLeaderboard]);

    const handleClose = () => {
        onClose();
        // Reset game to daily mode when closing
        actions.setGameMode('daily');
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

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

    if (!isOpen) return null;

    // Get player's score (only show if in daily mode and game is over)
    const playerScore = state.gameMode === 'daily' && state.gameStatus === 'gameover' 
        ? state.totalScore 
        : null;
    
    // Check if player's score appears in leaderboard
    const playerScoreIndex = playerScore !== null 
        ? leaderboard.findIndex(entry => entry.total_score === playerScore)
        : -1;
    const isPlayerOnLeaderboard = playerScoreIndex !== -1;

    // Split leaderboard into two columns
    const leftColumn = leaderboard.slice(0, 5);
    const rightColumn = leaderboard.slice(5, 10);

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={handleBackdropClick}
        >
            <div 
                className="bg-white rounded-2xl max-w-[25.2rem] w-full p-8 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="flex items-center justify-center gap-3 mb-6">
                    <Trophy className="w-8 h-8 text-yellow-500" />
                    <h2 className="text-3xl font-bold text-gray-900">Daily Top 10</h2>
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
                    <div>
                        {/* Player's Score Display */}
                        {playerScore !== null && (
                            <div className="mb-6 p-4 bg-gray-100 rounded-lg border-2 border-gray-300 mx-auto w-fit">
                                <div className="text-sm font-medium text-gray-700 mb-1 text-center">Your Score</div>
                                <div className="text-2xl font-bold text-gray-900 text-center">{playerScore}</div>
                            </div>
                        )}

                        {leaderboard.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No scores yet today. Be the first!
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {/* Left Column (1-5) */}
                                <div className="space-y-2">
                                    {leftColumn.map((entry, index) => {
                                        const rank = index + 1;
                                        const isHighlighted = playerScore !== null && entry.total_score === playerScore;
                                        return (
                                            <div
                                                key={`left-${index}`}
                                                className={`flex items-center justify-between p-3 rounded-lg ${
                                                    isHighlighted 
                                                        ? 'bg-gray-200 border-2 border-gray-400' 
                                                        : 'bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-8 h-8 flex items-center justify-center font-bold ${
                                                        isHighlighted ? 'text-gray-800' : 'text-gray-700'
                                                    }`}>
                                                        {rank}
                                                    </div>
                                                    <div className={`font-semibold ${
                                                        isHighlighted ? 'text-gray-900' : 'text-gray-900'
                                                    }`}>
                                                        {entry.total_score}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Right Column (6-10) */}
                                <div className="space-y-2">
                                    {rightColumn.map((entry, index) => {
                                        const rank = index + 6;
                                        const isHighlighted = playerScore !== null && entry.total_score === playerScore;
                                        return (
                                            <div
                                                key={`right-${index}`}
                                                className={`flex items-center justify-between p-3 rounded-lg ${
                                                    isHighlighted 
                                                        ? 'bg-gray-200 border-2 border-gray-400' 
                                                        : 'bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-8 h-8 flex items-center justify-center font-bold ${
                                                        isHighlighted ? 'text-gray-800' : 'text-gray-700'
                                                    }`}>
                                                        {rank}
                                                    </div>
                                                    <div className={`font-semibold ${
                                                        isHighlighted ? 'text-gray-900' : 'text-gray-900'
                                                    }`}>
                                                        {entry.total_score}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 mt-6">
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
                        disabled
                        className="py-4 bg-gray-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center cursor-not-allowed opacity-60"
                    >
                        <Trophy className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
}

