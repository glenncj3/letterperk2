import { GameState, BonusType } from '../types/game';

// Emoji squares for different bonus types
const BONUS_EMOJI_MAP: Record<BonusType, string> = {
    green: '🟩',
    purple: '🟪',
    red: '🟥',
    yellow: '🟨',
    blue: '🟦',
};

// Grey square for normal letters
const NORMAL_EMOJI = '⬜';

/**
 * Formats a date as MM/DD/YYYY
 */
function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
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
        console.error('Failed to copy to clipboard:', error);
        return false;
    }
}

