/**
 * Log levels for the logger.
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Logger service for centralized logging.
 * Provides structured logging with different levels and environment-aware behavior.
 */
export class Logger {
  private static instance: Logger | null = null;
  private minLevel: LogLevel;

  private constructor() {
    // In production, only show WARN and ERROR
    // In development, show all levels
    this.minLevel = import.meta.env.PROD ? LogLevel.WARN : LogLevel.DEBUG;
  }

  /**
   * Gets the singleton logger instance.
   */
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Sets the minimum log level.
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * Logs a debug message (only in development).
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.minLevel <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Logs an info message.
   */
  info(message: string, ...args: unknown[]): void {
    if (this.minLevel <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * Logs a warning message.
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.minLevel <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  /**
   * Logs an error message.
   */
  error(message: string, error?: unknown, ...args: unknown[]): void {
    if (this.minLevel <= LogLevel.ERROR) {
      if (error instanceof Error) {
        console.error(`[ERROR] ${message}`, error, ...args);
        if (error.stack) {
          console.error('Stack trace:', error.stack);
        }
      } else {
        console.error(`[ERROR] ${message}`, error, ...args);
      }
    }
  }

  /**
   * Logs a game-specific event (for analytics/debugging).
   */
  gameEvent(event: string, data?: Record<string, unknown>): void {
    if (this.minLevel <= LogLevel.DEBUG) {
      console.debug(`[GAME] ${event}`, data || {});
    }
  }
}

/**
 * Convenience function to get the logger instance.
 */
export function getLogger(): Logger {
  return Logger.getInstance();
}

