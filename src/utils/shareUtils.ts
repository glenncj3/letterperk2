import { GameState, BonusType } from '../types/game';
import { getLogger } from '../services/Logger';

// Emoji squares for different bonus types
const BONUS_EMOJI_MAP: Record<BonusType, string> = {
    green: '🟩',
    purple: '🟪',
    red: '🟥',
    yellow: '🟨',
    blue: '🟦',
    black: '⬛',
};

// Grey square for normal letters
const NORMAL_EMOJI = '⬜';

/**
 * Formats a date as MM/DD/YYYY in EST timezone.
 * The dateString is in YYYY-MM-DD format and represents a date in EST.
 * We add 5 hours (EST offset) to ensure it displays correctly at midnight EST.
 * Intl.DateTimeFormat automatically handles DST (EDT = UTC-4, EST = UTC-5).
 */
function formatDate(dateString: string): string {
    // Parse the date string (YYYY-MM-DD) as midnight UTC
    const date = new Date(dateString + 'T00:00:00Z');
    
    // Add 5 hours to account for EST offset (will be 4 hours during DST, but Intl handles this)
    // This ensures that at midnight EST (05:00 UTC), the date displays correctly
    const dateWithOffset = new Date(date.getTime() + 5 * 60 * 60 * 1000);
    
    // Format using EST timezone to get the correct date components
    // This automatically handles DST transitions
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    
    const parts = formatter.formatToParts(dateWithOffset);
    const month = parts.find(p => p.type === 'month')!.value;
    const day = parts.find(p => p.type === 'day')!.value;
    const year = parts.find(p => p.type === 'year')!.value;
    
    return `${month}/${day}/${year}`;
}

/**
 * Converts a bonus type to its corresponding emoji square
 */
function bonusToEmoji(bonusType: BonusType | null): string {
    if (!bonusType) {
        return NORMAL_EMOJI;
    }
    return BONUS_EMOJI_MAP[bonusType];
}

/**
 * Generates the share text for a completed game
 */
export function generateShareText(state: GameState): string {
    if (!state.puzzle) {
        return '';
    }

    const date = formatDate(state.puzzle.date);
    const lines: string[] = [
        `LetterPerk - ${date}`,
        `Score: ${state.totalScore}`,
        '',
    ];

    // Add a row of emoji squares for each completed word
    state.wordsCompleted.forEach((word) => {
        const squares = word.tileBonuses.map(bonusToEmoji).join('');
        lines.push(squares);
    });

    return lines.join('\n');
}

/**
 * Copies text to the clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            return success;
        }
    } catch (error) {
        getLogger().error('Failed to copy to clipboard', error);
        return false;
    }
}

