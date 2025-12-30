import { createContext, useContext, useReducer, ReactNode, useCallback, useEffect } from 'react';
import { GameState, GameActions, GameMode, Tile, CompletedWord } from '../types/game';
import { MAX_WORDS_PER_GAME, GRID_COLS, TILES_PER_COLUMN } from '../constants/gameConstants';
import { generateGameConfiguration, seededRandom, getTodayPST, dateToSeed } from '../utils/seedGenerator';
import { calculateScore, assignBonusesToSequences } from '../utils/bonusUtils';
import { applyGravity, createTile } from '../utils/tileUtils';
import { isValidWord, loadDictionary } from '../lib/dictionary';
import { loadDailyPuzzle, logGameResult } from '../lib/puzzle';

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
  refreshUsed: false,
  error: null,
  isLoading: true,
  gameStartedAt: undefined,
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
      };
    }

    case 'REFRESH_TILES':
      return {
        ...state,
        tiles: action.newTiles,
        refreshUsed: true,
        selectedTiles: [],
        currentWord: '',
        isWordValid: false,
        currentWordScore: { baseScore: 0, bonuses: [], finalScore: 0 },
      };

    case 'SET_ERROR':
      return { ...state, error: action.error };

    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };

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

  useEffect(() => {
    if (state.selectedTiles.length > 0) {
      const word = state.selectedTiles.map(t => t.letter).join('');
      const isValid = isValidWord(word) && word.length >= 2;
      const score = calculateScore(word, state.selectedTiles);
      dispatch({ type: 'UPDATE_WORD_STATE', word, isValid, score });
    }
  }, [state.selectedTiles]);

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
      let seed: number;
      let date: string;

      if (mode === 'daily') {
        const today = getTodayPST();
        date = today.toISOString().split('T')[0];
        seed = dateToSeed(today);
      } else {
        date = new Date().toISOString().split('T')[0];
        seed = Math.floor(Math.random() * 900000) + 100000;
      }

      const configuration = mode === 'daily'
        ? await loadDailyPuzzle(date, seed)
        : generateGameConfiguration(seed);
      const random = seededRandom(seed);

      const sequencesWithBonuses = assignBonusesToSequences(
        configuration.columnSequences,
        configuration.bonusConfig,
        random
      );

      const configWithBonuses = {
        ...configuration,
        columnSequences: sequencesWithBonuses
      };

      dispatch({
        type: 'SET_PUZZLE',
        puzzle: { date, seed, configuration: configWithBonuses },
      });

      const initialTiles: Tile[] = [];
      for (let col = 0; col < GRID_COLS; col++) {
        for (let row = 0; row < TILES_PER_COLUMN; row++) {
          const tileData = sequencesWithBonuses[col][row];
          const tile = createTile(tileData.letter, tileData.points, row, col, tileData.bonusType);
          initialTiles.push(tile);
        }
      }

      dispatch({
        type: 'SET_COLUMN_SEQUENCES',
        sequences: sequencesWithBonuses,
        indices: [TILES_PER_COLUMN, TILES_PER_COLUMN, TILES_PER_COLUMN],
        randomFunc: random,
      });

      dispatch({ type: 'SET_TILES', tiles: initialTiles });
      dispatch({ type: 'SET_GAME_STATUS', status: 'playing' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: 'Failed to initialize game' });
      console.error(error);
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
      dispatch({ type: 'SET_ERROR', error: 'Invalid word' });
      return;
    }

    if (!state.puzzle || !state.randomFunc) {
      dispatch({ type: 'SET_ERROR', error: 'Game not initialized' });
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

    const freshTiles: Tile[] = [];
    const newIndices: [number, number, number] = [...state.columnDrawIndices];

    // Calculate correct row positions for new tiles
    // After removing selected tiles, we need to place new tiles at the top of each column
    for (let col = 0; col < GRID_COLS; col++) {
      const columnTiles = remainingTiles.filter(t => t.col === col);
      const tilesNeeded = TILES_PER_COLUMN - columnTiles.length;

      // Place new tiles at negative row numbers so they sort last in descending sort
      // This ensures they end up at the top after gravity is applied
      // (gravity sorts descending, so lower numbers = sorted last = placed at top)
      for (let i = 0; i < tilesNeeded; i++) {
        const sequence = state.columnSequences[col];
        const tileData = sequence[newIndices[col] % sequence.length];
        newIndices[col]++;

        // Use negative row numbers to ensure new tiles sort last and go to top
        const newTile = createTile(tileData.letter, tileData.points, -1 - i, col, tileData.bonusType);
        freshTiles.push(newTile);
      }
    }

    // Combine all tiles and apply gravity once to position everything correctly
    const allTiles = [...remainingTiles, ...freshTiles];
    const finalTiles = applyGravity(allTiles);

    dispatch({
      type: 'COMPLETE_WORD',
      word: completedWord,
      newTiles: finalTiles,
      newIndices,
    });
  }, [state]);

  const refreshTiles = useCallback(() => {
    if (state.refreshUsed) return;

    // Require at least one selected tile to redraw
    if (state.selectedTiles.length === 0) {
      dispatch({ type: 'SET_ERROR', error: 'Select tiles to redraw' });
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

    const freshTiles: Tile[] = [];
    const newIndices: [number, number, number] = [...state.columnDrawIndices];

    // Calculate how many new tiles are needed per column
    for (let col = 0; col < GRID_COLS; col++) {
      const columnTiles = remainingTiles.filter(t => t.col === col);
      const tilesNeeded = TILES_PER_COLUMN - columnTiles.length;

      // Draw new tiles from the sequence to fill the column
      for (let i = 0; i < tilesNeeded; i++) {
        const sequence = state.columnSequences[col];
        const tileData = sequence[newIndices[col] % sequence.length];
        newIndices[col]++;

        // Use negative row numbers so they sort last and go to top after gravity
        const newTile = createTile(tileData.letter, tileData.points, -1 - i, col, tileData.bonusType);
        freshTiles.push(newTile);
      }
    }

    // Combine remaining tiles with new tiles and apply gravity
    const allTiles = [...remainingTiles, ...freshTiles];
    const finalTiles = applyGravity(allTiles);

    dispatch({ type: 'REFRESH_TILES', newTiles: finalTiles });
    dispatch({ type: 'SET_COLUMN_SEQUENCES', sequences: state.columnSequences, indices: newIndices });
  }, [state.refreshUsed, state.selectedTiles, state.tiles, state.columnDrawIndices, state.columnSequences, state.puzzle, state.randomFunc]);

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
