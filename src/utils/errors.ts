/**
 * Error types for the game application.
 */
export enum ErrorType {
  // Game initialization errors
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  PUZZLE_LOAD_FAILED = 'PUZZLE_LOAD_FAILED',
  
  // Gameplay errors
  INVALID_WORD = 'INVALID_WORD',
  NO_TRADES_AVAILABLE = 'NO_TRADES_AVAILABLE',
  NO_TILES_SELECTED = 'NO_TILES_SELECTED',
  GAME_NOT_INITIALIZED = 'GAME_NOT_INITIALIZED',
  
  // Network/database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Standardized error class for game errors.
 */
export class GameError extends Error {
  constructor(
    public readonly type: ErrorType,
    message: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'GameError';
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GameError);
    }
  }

  /**
   * Creates a user-friendly error message.
   */
  getUserMessage(): string {
    switch (this.type) {
      case ErrorType.INITIALIZATION_FAILED:
        return 'Failed to initialize game. Please try again.';
      case ErrorType.PUZZLE_LOAD_FAILED:
        return 'Failed to load puzzle. Please refresh the page.';
      case ErrorType.INVALID_WORD:
        return 'Invalid word. Please select a valid word.';
      case ErrorType.NO_TRADES_AVAILABLE:
        return 'No trades available.';
      case ErrorType.NO_TILES_SELECTED:
        return 'Select tiles to trade.';
      case ErrorType.GAME_NOT_INITIALIZED:
        return 'Game not initialized. Please refresh the page.';
      case ErrorType.DATABASE_ERROR:
        return 'Database error. Your progress may not be saved.';
      case ErrorType.NETWORK_ERROR:
        return 'Network error. Please check your connection.';
      default:
        return this.message || 'An unexpected error occurred.';
    }
  }
}

/**
 * Error handler utility functions.
 */
export class ErrorHandler {
  /**
   * Handles an error and returns a GameError.
   * Logs the error to console in development.
   */
  static handle(error: unknown, defaultType: ErrorType = ErrorType.UNKNOWN_ERROR): GameError {
    if (error instanceof GameError) {
      return error;
    }

    const message = error instanceof Error ? error.message : String(error);
    const gameError = new GameError(defaultType, message, error);

    // Log in development
    if (import.meta.env.DEV) {
      console.error(`[GameError] ${gameError.type}:`, gameError.message, gameError.originalError);
    }

    return gameError;
  }

  /**
   * Handles an error and returns a user-friendly message.
   */
  static getUserMessage(error: unknown, defaultType: ErrorType = ErrorType.UNKNOWN_ERROR): string {
    return this.handle(error, defaultType).getUserMessage();
  }

  /**
   * Wraps an async function with error handling.
   */
  static async wrap<T>(
    fn: () => Promise<T>,
    errorType: ErrorType = ErrorType.UNKNOWN_ERROR
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      this.handle(error, errorType);
      return null;
    }
  }

  /**
   * Wraps a sync function with error handling.
   */
  static wrapSync<T>(
    fn: () => T,
    errorType: ErrorType = ErrorType.UNKNOWN_ERROR
  ): T | null {
    try {
      return fn();
    } catch (error) {
      this.handle(error, errorType);
      return null;
    }
  }
}

