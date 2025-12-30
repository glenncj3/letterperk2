export interface Tile {
  id: string;
  letter: string;
  points: number;
  row: number;
  col: number;
  targetRow?: number;
  bonusType?: BonusType;
}

export type BonusType = 'green' | 'purple' | 'red' | 'yellow' | 'blue';

export interface BonusConfig {
  type: BonusType;
  minCount?: number;
  maxCount?: number;
}

export interface GameConfiguration {
  columnSequences: Array<Array<{ letter: string; points: number; bonusType?: BonusType }>>;
  bonusConfig: BonusConfig[];
  effects?: GameEffect[];
}

export interface CompletedWord {
  word: string;
  score: number;
  bonusesApplied: BonusType[];
  tileBonuses: (BonusType | null)[];
  bonusBreakdown: Array<{ type: BonusType; value: number }>; // Full bonus breakdown with values
}

export interface ScoreBreakdown {
  baseScore: number;
  bonuses: Array<{ type: BonusType; value: number }>;
  finalScore: number;
}

export type GameMode = 'daily' | 'casual';
export type GameStatus = 'loading' | 'playing' | 'gameover';

export type EffectType =
  | 'point_modifier'
  | 'tile_manipulation'
  | 'score_modifier'
  | 'word_restriction';

export type EffectTiming =
  | 'game_start'
  | 'word_formation'
  | 'word_submission'
  | 'after_word'
  | 'continuous';

export interface GameEffect {
  id: string;
  type: EffectType;
  timing: EffectTiming;
  name: string;
  description: string;
  icon?: string;
  enabled: boolean;
  params: Record<string, unknown>;
}

export interface GameState {
  gameMode: GameMode;

  puzzle: {
    date: string;
    seed: number;
    configuration: GameConfiguration;
  } | null;

  gameStatus: GameStatus;

  columnSequences: Array<Array<{ letter: string; points: number; bonusType?: BonusType }>>;
  columnDrawIndices: [number, number, number];
  randomFunc: (() => number) | null;

  tiles: Tile[];
  selectedTiles: Tile[];

  currentWord: string;
  isWordValid: boolean;

  totalScore: number;
  currentWordScore: ScoreBreakdown;

  wordsCompleted: CompletedWord[];
  wordsRemaining: number;

  activeEffects: GameEffect[];

  refreshUsed: boolean;
  error: string | null;
  isLoading: boolean;
  gameStartedAt?: string; // ISO timestamp when game started
}

export interface GameActions {
  setGameMode: (mode: GameMode) => Promise<void>;
  selectTile: (tileId: string) => void;
  deselectTile: (tileId: string) => void;
  clearSelection: () => void;
  submitWord: () => Promise<void>;
  refreshTiles: () => void;
  initializeGame: (mode: GameMode, replay?: boolean) => Promise<void>;
  resetGame: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}
