import { createContext, useContext, useReducer, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { GameState, GameActions, GameMode, Tile, CompletedWord } from '../types/game';
import { MAX_WORDS_PER_GAME, GRID_COLS, TILES_PER_COLUMN } from '../constants/gameConstants';
import { calculateScore } from '../utils/bonusUtils';
import { applyGravity } from '../utils/tileUtils';
import { replaceTilesInColumns } from '../utils/tileReplacement';
import { calculateWordState } from '../utils/wordCalculation';
import { loadDictionary } from '../lib/dictionary';
import { logGameResult } from '../lib/puzzle';
import { RepositoryFactory } from '../repositories/repositoryFactory';
import { GameInitializer } from '../services/GameInitializer';
import { ErrorHandler, ErrorType, GameError } from '../utils/errors';

interface GameContextValue {
  state: GameState;
  actions: GameActions;
}

const GameContext = createContext<GameContextValue | null>(null);

const initialState: GameState = {
  gameMode: 'daily',
  puzzle: null,
  gameStatus: 'loading',
  columnSequences: [[], [], []],
  columnDrawIndices: [0, 0, 0],
  randomFunc: null,
  tiles: [],
  selectedTiles: [],
  currentWord: '',
  isWordValid: false,
  totalScore: 0,
  currentWordScore: { baseScore: 0, bonuses: [], finalScore: 0 },
  wordsCompleted: [],
  wordsRemaining: MAX_WORDS_PER_GAME,
  activeEffects: [],
  tradesAvailable: 1, // Start with 1 trade
  error: null,
  isLoading: true,
  gameStartedAt: undefined,
  tooltip: null,
};

type GameAction =
  | { type: 'SET_GAME_MODE'; mode: GameMode }
  | { type: 'SET_PUZZLE'; puzzle: GameState['puzzle'] }
  | { type: 'SET_GAME_STATUS'; status: GameState['gameStatus'] }
  | { type: 'SET_TILES'; tiles: Tile[] }
  | { type: 'SET_COLUMN_SEQUENCES'; sequences: GameState['columnSequences']; indices: [number, number, number]; randomFunc: () => number }
  | { type: 'SELECT_TILE'; tileId: string }
  | { type: 'DESELECT_TILE'; tileId: string }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'UPDATE_WORD_STATE'; word: string; isValid: boolean; score: GameState['currentWordScore'] }
  | { type: 'COMPLETE_WORD'; word: CompletedWord; newTiles: Tile[]; newIndices: [number, number, number] }
  | { type: 'REFRESH_TILES'; newTiles: Tile[] }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_TOOLTIP'; tooltip: { title: string; description: string } | null }
  | { type: 'RESET_GAME' };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_GAME_MODE':
      return { ...state, gameMode: action.mode };

    case 'SET_PUZZLE':
      return { ...state, puzzle: action.puzzle };

    case 'SET_GAME_STATUS': {
      // Set game start time when status changes to 'playing'
      const gameStartedAt = action.status === 'playing' && !state.gameStartedAt
        ? new Date().toISOString()
        : state.gameStartedAt;
      return { ...state, gameStatus: action.status, gameStartedAt };
    }

    case 'SET_TILES':
      return { ...state, tiles: action.tiles };

    case 'SET_COLUMN_SEQUENCES':
      return {
        ...state,
        columnSequences: action.sequences,
        columnDrawIndices: action.indices,
        randomFunc: action.randomFunc,
      };

    case 'SELECT_TILE': {
      const tile = state.tiles.find(t => t.id === action.tileId);
      if (!tile || state.selectedTiles.includes(tile)) return state;
      return {
        ...state,
        selectedTiles: [...state.selectedTiles, tile],
      };
    }

    case 'DESELECT_TILE': {
      const index = state.selectedTiles.findIndex(t => t.id === action.tileId);
      if (index === -1) return state;
      return {
        ...state,
        selectedTiles: state.selectedTiles.filter(t => t.id !== action.tileId),
      };
    }

    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedTiles: [],
        currentWord: '',
        isWordValid: false,
        currentWordScore: { baseScore: 0, bonuses: [], finalScore: 0 },
      };

    case 'UPDATE_WORD_STATE':
      return {
        ...state,
        currentWord: action.word,
        isWordValid: action.isValid,
        currentWordScore: action.score,
      };

    case 'COMPLETE_WORD': {
      const wordsCompleted = [...state.wordsCompleted, action.word];
      const wordsRemaining = MAX_WORDS_PER_GAME - wordsCompleted.length;
      const gameStatus = wordsRemaining === 0 ? 'gameover' : 'playing';

      // Count black bonuses used in this word (each black bonus gives +1 trade)
      const blackBonusCount = action.word.tileBonuses.filter(b => b === 'black').length;
      const newTradesAvailable = state.tradesAvailable + blackBonusCount;

      return {
        ...state,
        wordsCompleted,
        wordsRemaining,
        totalScore: state.totalScore + action.word.score,
        tiles: action.newTiles,
        columnDrawIndices: action.newIndices,
        selectedTiles: [],
        currentWord: '',
        isWordValid: false,
        currentWordScore: { baseScore: 0, bonuses: [], finalScore: 0 },
        gameStatus,
        tradesAvailable: newTradesAvailable,
      };
    }

    case 'REFRESH_TILES':
      return {
        ...state,
        tiles: action.newTiles,
        tradesAvailable: Math.max(0, state.tradesAvailable - 1), // Decrement trades
        selectedTiles: [],
        currentWord: '',
        isWordValid: false,
        currentWordScore: { baseScore: 0, bonuses: [], finalScore: 0 },
      };

    case 'SET_ERROR':
      return { ...state, error: action.error };

    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };

    case 'SET_TOOLTIP':
      return { ...state, tooltip: action.tooltip };

    case 'RESET_GAME':
      return { ...initialState, gameMode: state.gameMode };

    default:
      return state;
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  useEffect(() => {
    // Dictionary will load lazily on first word validation
    // Just mark loading as complete
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }, []);

  // Memoize word state calculation to avoid unnecessary recalculations
  const wordState = useMemo(() => {
    return calculateWordState(state.selectedTiles);
  }, [state.selectedTiles]);

  // Update word state when it changes
  useEffect(() => {
    if (wordState.word || state.selectedTiles.length === 0) {
      dispatch({
        type: 'UPDATE_WORD_STATE',
        word: wordState.word,
        isValid: wordState.isValid,
        score: wordState.score,
      });
    }
  }, [wordState]);

  useEffect(() => {
    if (state.gameStatus === 'gameover' && state.puzzle) {
      console.log('Game over detected, preparing to log result...', {
        wordsCompleted: state.wordsCompleted.length,
        totalScore: state.totalScore,
        gameMode: state.gameMode,
        puzzleDate: state.puzzle.date,
        seed: state.puzzle.seed
      });

      // Calculate duration if we have a start time
      const durationSeconds = state.gameStartedAt 
        ? Math.floor((Date.now() - new Date(state.gameStartedAt).getTime()) / 1000)
        : undefined;

      // Count total bonus tiles used across all words
      const totalBonusTilesUsed = state.wordsCompleted.reduce((total, word) => {
        return total + word.tileBonuses.filter(b => b !== null).length;
      }, 0);

      const words = state.wordsCompleted.map((w, index) => {
        // Count bonus tiles in this word
        const bonusTilesCount = w.tileBonuses.filter(b => b !== null).length;
        
        // Use the bonus breakdown with actual values (handle missing breakdown)
        const bonuses = (w.bonusBreakdown || []).map(b => ({
          type: b.type,
          value: b.value
        }));

        return {
          word: w.word,
          score: w.score,
          index: index + 1,
          bonuses,
          bonusTilesCount
        };
      });

      console.log('Calling logGameResult with:', {
        puzzleDate: state.puzzle.date,
        seed: state.puzzle.seed,
        totalScore: state.totalScore,
        wordCount: state.wordsCompleted.length,
        mode: state.gameMode,
        wordsCount: words.length,
        durationSeconds,
        totalBonusTilesUsed
      });

      logGameResult(
        state.puzzle.date,
        state.puzzle.seed,
        state.totalScore,
        state.wordsCompleted.length,
        state.gameMode,
        words,
        durationSeconds,
        state.gameStartedAt,
        totalBonusTilesUsed
      ).catch(error => {
        console.error('Failed to log game result:', error);
      });
    }
  }, [state.gameStatus, state.puzzle, state.totalScore, state.wordsCompleted, state.gameMode, state.gameStartedAt]);

  const initializeGame = useCallback(async (mode: GameMode, replay = false) => {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    dispatch({ type: 'RESET_GAME' });
    dispatch({ type: 'SET_GAME_MODE', mode });

    try {
      const puzzleRepo = RepositoryFactory.getPuzzleRepository();
      const initializer = new GameInitializer(puzzleRepo);
      const setup = await initializer.initialize(mode);

      dispatch({
        type: 'SET_PUZZLE',
        puzzle: { date: setup.date, seed: setup.seed, configuration: setup.configuration },
      });

      dispatch({
        type: 'SET_COLUMN_SEQUENCES',
        sequences: setup.columnSequences,
        indices: setup.columnDrawIndices,
        randomFunc: setup.randomFunc,
      });

      dispatch({ type: 'SET_TILES', tiles: setup.tiles });
      dispatch({ type: 'SET_GAME_STATUS', status: 'playing' });
    } catch (error) {
      const gameError = ErrorHandler.handle(error, ErrorType.INITIALIZATION_FAILED);
      dispatch({ type: 'SET_ERROR', error: gameError.getUserMessage() });
    } finally {
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }, []);

  const selectTile = useCallback((tileId: string) => {
    dispatch({ type: 'SELECT_TILE', tileId });
  }, []);

  const deselectTile = useCallback((tileId: string) => {
    dispatch({ type: 'DESELECT_TILE', tileId });
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, []);

  const submitWord = useCallback(async () => {
    if (!state.isWordValid || state.selectedTiles.length < 2) {
      const error = new GameError(ErrorType.INVALID_WORD, 'Invalid word');
      dispatch({ type: 'SET_ERROR', error: error.getUserMessage() });
      return;
    }

    if (!state.puzzle || !state.randomFunc) {
      const error = new GameError(ErrorType.GAME_NOT_INITIALIZED, 'Game not initialized');
      dispatch({ type: 'SET_ERROR', error: error.getUserMessage() });
      return;
    }

    const completedWord: CompletedWord = {
      word: state.currentWord,
      score: state.currentWordScore.finalScore,
      bonusesApplied: state.currentWordScore.bonuses.map(b => b.type),
      tileBonuses: state.selectedTiles.map(t => t.bonusType || null),
      bonusBreakdown: state.currentWordScore.bonuses, // Full bonus breakdown with values
    };

    const remainingTiles = state.tiles.filter(
      tile => !state.selectedTiles.some(st => st.id === tile.id)
    );

    const { newTiles: allTiles, newIndices } = replaceTilesInColumns(
      remainingTiles,
      state.selectedTiles,
      state.columnSequences,
      state.columnDrawIndices
    );

    // Apply gravity to position everything correctly
    const finalTiles = applyGravity(allTiles);

    dispatch({
      type: 'COMPLETE_WORD',
      word: completedWord,
      newTiles: finalTiles,
      newIndices,
    });
  }, [state]);

  const refreshTiles = useCallback(() => {
    if (state.tradesAvailable <= 0) {
      dispatch({ type: 'SET_ERROR', error: 'No trades available' });
      return;
    }

    // Require at least one selected tile to trade
    if (state.selectedTiles.length === 0) {
      dispatch({ type: 'SET_ERROR', error: 'Select tiles to trade.' });
      return;
    }

    if (!state.puzzle || !state.randomFunc) {
      dispatch({ type: 'SET_ERROR', error: 'Game not initialized' });
      return;
    }

    // Remove selected tiles and keep the rest
    const remainingTiles = state.tiles.filter(
      tile => !state.selectedTiles.some(st => st.id === tile.id)
    );

    const { newTiles: allTiles, newIndices } = replaceTilesInColumns(
      remainingTiles,
      state.selectedTiles,
      state.columnSequences,
      state.columnDrawIndices
    );

    // Apply gravity to position everything correctly
    const finalTiles = applyGravity(allTiles);

    dispatch({ type: 'REFRESH_TILES', newTiles: finalTiles });
    dispatch({ type: 'SET_COLUMN_SEQUENCES', sequences: state.columnSequences, indices: newIndices, randomFunc: state.randomFunc! });
  }, [state.tradesAvailable, state.selectedTiles, state.tiles, state.columnDrawIndices, state.columnSequences, state.puzzle, state.randomFunc]);

  const setGameMode = useCallback(async (mode: GameMode) => {
    await initializeGame(mode);
  }, [initializeGame]);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', error });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', error: null });
  }, []);

  const setTooltip = useCallback((tooltip: { title: string; description: string } | null) => {
    dispatch({ type: 'SET_TOOLTIP', tooltip });
  }, []);

  const actions: GameActions = {
    setGameMode,
    selectTile,
    deselectTile,
    clearSelection,
    submitWord,
    refreshTiles,
    initializeGame,
    resetGame,
    setError,
    clearError,
    setTooltip,
  };

  return (
    <GameContext.Provider value={{ state, actions }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameState must be used within GameProvider');
  }
  return context;
}
