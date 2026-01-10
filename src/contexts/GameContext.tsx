import { createContext, useContext, useReducer, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { GameState, GameActions, GameMode, Tile, CompletedWord } from '../types/game';
import { MAX_WORDS_PER_GAME, GRID_COLS, TILES_PER_COLUMN } from '../constants/gameConstants';
import { calculateScore } from '../utils/bonusUtils';
import { applyGravity, shuffleTiles } from '../utils/tileUtils';
import { replaceTilesInColumns } from '../utils/tileReplacement';
import { calculateWordState } from '../utils/wordCalculation';
import { loadDictionary } from '../lib/dictionary';
import { logGameResult } from '../lib/puzzle';
import { RepositoryFactory } from '../repositories/repositoryFactory';
import { GameInitializer } from '../services/GameInitializer';
import { ErrorHandler, ErrorType, GameError } from '../utils/errors';
import { getLogger } from '../services/Logger';
import { trackEvent } from '../services/analytics';
import { 
  markDailyAsPlayed, 
  getDailyGameResult, 
  cleanupOldDailyRecords,
  getTodayDateString 
} from '../utils/dailyGameStorage';

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
  dailyGameAlreadyPlayed: null,
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
  | { type: 'REMOVE_LAST_TILE' }
  | { type: 'UPDATE_WORD_STATE'; word: string; isValid: boolean; score: GameState['currentWordScore'] }
  | { type: 'COMPLETE_WORD'; word: CompletedWord; newTiles: Tile[]; newIndices: [number, number, number] }
  | { type: 'REFRESH_TILES'; newTiles: Tile[] }
  | { type: 'SHUFFLE_TILES'; newTiles: Tile[] }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_TOOLTIP'; tooltip: { title: string; description: string } | null }
  | { type: 'SET_DAILY_GAME_ALREADY_PLAYED'; result: { score: number; wordCount: number; puzzleDate: string } | null }
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

    case 'REMOVE_LAST_TILE': {
      if (state.selectedTiles.length === 0) return state;
      const newSelectedTiles = state.selectedTiles.slice(0, -1);
      return {
        ...state,
        selectedTiles: newSelectedTiles,
      };
    }

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

    case 'SHUFFLE_TILES':
      return {
        ...state,
        tiles: action.newTiles,
        // Keep selection intact after shuffle
      };

    case 'SET_ERROR':
      return { ...state, error: action.error };

    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };

    case 'SET_TOOLTIP':
      return { ...state, tooltip: action.tooltip };

    case 'SET_DAILY_GAME_ALREADY_PLAYED':
      return { ...state, dailyGameAlreadyPlayed: action.result };

    case 'RESET_GAME': {
      // Always preserve dailyGameAlreadyPlayed from current state
      // The caller is responsible for setting it before RESET_GAME if needed
      // This avoids issues with React batching state updates
      return { ...initialState, gameMode: state.gameMode, dailyGameAlreadyPlayed: state.dailyGameAlreadyPlayed };
    }

    default:
      return state;
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  useEffect(() => {
    // Cleanup old daily game records (older than 48 hours)
    cleanupOldDailyRecords();
    
    // Dictionary will load lazily on first word validation
    // Just mark loading as complete
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }, []);

  // Check localStorage for daily game already played when game mode is casual
  useEffect(() => {
    if (state.gameMode === 'casual' && state.gameStatus === 'playing' && state.dailyGameAlreadyPlayed === null) {
      const today = getTodayDateString();
      const result = getDailyGameResult(today);
      if (result) {
        dispatch({
          type: 'SET_DAILY_GAME_ALREADY_PLAYED',
          result: {
            score: result.score,
            wordCount: result.wordCount,
            puzzleDate: result.puzzleDate,
          },
        });
      }
    }
  }, [state.gameMode, state.gameStatus, state.dailyGameAlreadyPlayed]);

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
      const logger = getLogger();
      logger.gameEvent('game_over_detected', {
        wordsCompleted: state.wordsCompleted.length,
        totalScore: state.totalScore,
        gameMode: state.gameMode,
        puzzleDate: state.puzzle.date,
        seed: state.puzzle.seed
      });
      
      // Mark daily game as played when it ends
      if (state.gameMode === 'daily') {
        markDailyAsPlayed(
          state.puzzle.date,
          state.totalScore,
          state.wordsCompleted.length
        );
      }
      
      // Calculate duration if we have a start time
      const durationSeconds = state.gameStartedAt 
        ? Math.floor((Date.now() - new Date(state.gameStartedAt).getTime()) / 1000)
        : undefined;

      // Count total bonus tiles used across all words
      const totalBonusTilesUsed = state.wordsCompleted.reduce((total, word) => {
        return total + word.tileBonuses.filter(b => b !== null).length;
      }, 0);

      // Track game completion with GA4 recommended event
      trackEvent('game_complete', {
        game_mode: state.gameMode,
        total_score: state.totalScore,
        word_count: state.wordsCompleted.length,
        puzzle_date: state.puzzle.date,
        seed: state.puzzle.seed,
        duration_seconds: durationSeconds,
        total_bonus_tiles_used: totalBonusTilesUsed,
      });

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

      logger.gameEvent('calling_log_game_result', {
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
        getLogger().error('Failed to log game result', error);
      });
    }
  }, [state.gameStatus, state.puzzle, state.totalScore, state.wordsCompleted, state.gameMode, state.gameStartedAt]);

  const initializeGame = useCallback(async (mode: GameMode, replay = false) => {
    // Check if daily game has already been played
    if (mode === 'daily') {
      const today = getTodayDateString();
      const result = getDailyGameResult(today);
      if (result) {
        dispatch({
          type: 'SET_DAILY_GAME_ALREADY_PLAYED',
          result: {
            score: result.score,
            wordCount: result.wordCount,
            puzzleDate: result.puzzleDate,
          },
        });
        dispatch({ type: 'SET_LOADING', isLoading: false });
        // Set game mode to daily so modal knows we tried to start daily
        dispatch({ type: 'SET_GAME_MODE', mode: 'daily' });
        return;
      }
    }

    dispatch({ type: 'SET_LOADING', isLoading: true });
    // Set game mode FIRST so RESET_GAME can check it
    dispatch({ type: 'SET_GAME_MODE', mode });
    
    // For casual mode, check localStorage and set state BEFORE RESET_GAME
    // This ensures RESET_GAME can preserve it
    let dailyGameResult: { score: number; wordCount: number; puzzleDate: string } | null = null;
    if (mode === 'casual') {
      const today = getTodayDateString();
      const result = getDailyGameResult(today);
      if (result) {
        dailyGameResult = {
          score: result.score,
          wordCount: result.wordCount,
          puzzleDate: result.puzzleDate,
        };
        dispatch({ type: 'SET_DAILY_GAME_ALREADY_PLAYED', result: dailyGameResult });
      }
    }
    
    dispatch({ type: 'RESET_GAME' });
    
    // After RESET_GAME, restore the daily game already played state for casual mode
    if (mode === 'casual' && dailyGameResult) {
      dispatch({ type: 'SET_DAILY_GAME_ALREADY_PLAYED', result: dailyGameResult });
    } else if (mode !== 'casual') {
      dispatch({ type: 'SET_DAILY_GAME_ALREADY_PLAYED', result: null });
    }

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
      
      // Track game start
      trackEvent('game_start', {
        game_mode: mode,
        puzzle_date: setup.date,
        seed: setup.seed,
        is_replay: replay,
      });
    } catch (error) {
      const gameError = ErrorHandler.handle(error, ErrorType.INITIALIZATION_FAILED);
      dispatch({ type: 'SET_ERROR', error: gameError.getUserMessage() });
      
      // Track initialization error
      trackEvent('game_start_error', {
        game_mode: mode,
        error: gameError.getUserMessage(),
      });
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

  const removeLastTile = useCallback(() => {
    dispatch({ type: 'REMOVE_LAST_TILE' });
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
    
    // Track word submission
    trackEvent('word_submitted', {
      word: state.currentWord,
      word_length: state.currentWord.length,
      score: state.currentWordScore.finalScore,
      base_score: state.currentWordScore.baseScore,
      bonus_count: state.currentWordScore.bonuses.length,
      bonus_types: state.currentWordScore.bonuses.map(b => b.type),
      game_mode: state.gameMode,
      words_remaining: state.wordsRemaining - 1,
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
    
    // Type guard: randomFunc should exist at this point due to earlier check
    if (!state.randomFunc) {
      const error = new GameError(ErrorType.GAME_NOT_INITIALIZED, 'Game not initialized');
      dispatch({ type: 'SET_ERROR', error: error.getUserMessage() });
      return;
    }
    
    dispatch({ type: 'SET_COLUMN_SEQUENCES', sequences: state.columnSequences, indices: newIndices, randomFunc: state.randomFunc });
  }, [state.tradesAvailable, state.selectedTiles, state.tiles, state.columnDrawIndices, state.columnSequences, state.puzzle, state.randomFunc]);

  const shuffleTilesInGrid = useCallback(() => {
    if (state.gameStatus !== 'playing') {
      return;
    }

    // Use game's random function if available, otherwise use Math.random
    const randomFunc = state.randomFunc || Math.random;
    const shuffled = shuffleTiles(state.tiles, randomFunc);
    
    dispatch({ type: 'SHUFFLE_TILES', newTiles: shuffled });
    
    // Track shuffle event
    trackEvent('tiles_shuffled', {
      game_mode: state.gameMode,
      tiles_count: state.tiles.length,
    });
  }, [state.tiles, state.gameStatus, state.randomFunc, state.gameMode]);

  const setGameMode = useCallback(async (mode: GameMode) => {
    if (state.gameMode !== mode) {
      // Track mode change
      trackEvent('game_mode_changed', {
        from_mode: state.gameMode,
        to_mode: mode,
      });
    }
    
    // When switching to casual, check if daily has been played and preserve that state
    // so the button stays grayed out
    if (mode === 'casual') {
      const today = getTodayDateString();
      const result = getDailyGameResult(today);
      if (result) {
        dispatch({
          type: 'SET_DAILY_GAME_ALREADY_PLAYED',
          result: {
            score: result.score,
            wordCount: result.wordCount,
            puzzleDate: result.puzzleDate,
          },
        });
      }
    } else {
      // When switching to daily, clear the state (it will be set again if daily has already been played)
      dispatch({ type: 'SET_DAILY_GAME_ALREADY_PLAYED', result: null });
    }
    
    await initializeGame(mode);
  }, [initializeGame, state.gameMode]);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', error });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', error: null });
  }, []);

  const clearDailyGameAlreadyPlayed = useCallback(() => {
    dispatch({ type: 'SET_DAILY_GAME_ALREADY_PLAYED', result: null });
  }, []);

  const setTooltip = useCallback((tooltip: { title: string; description: string } | null) => {
    dispatch({ type: 'SET_TOOLTIP', tooltip });
  }, []);

  const actions: GameActions = {
    setGameMode,
    selectTile,
    deselectTile,
    clearSelection,
    removeLastTile,
    submitWord,
    refreshTiles,
    shuffleTilesInGrid,
    initializeGame,
    resetGame,
    setError,
    clearError,
    setTooltip,
    clearDailyGameAlreadyPlayed,
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
