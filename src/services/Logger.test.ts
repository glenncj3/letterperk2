import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Logger, LogLevel, getLogger } from './Logger';

describe('Logger', () => {
  let logger: Logger;
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logger = Logger.getInstance();
    logger.setMinLevel(LogLevel.DEBUG); // Reset to debug for tests
    
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const logger1 = Logger.getInstance();
      const logger2 = Logger.getInstance();
      expect(logger1).toBe(logger2);
    });
  });

  describe('getLogger', () => {
    it('should return logger instance', () => {
      const logger = getLogger();
      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe('debug', () => {
    it('should log debug message when level is DEBUG', () => {
      logger.setMinLevel(LogLevel.DEBUG);
      logger.debug('Test debug message', { data: 'test' });
      
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        '[DEBUG] Test debug message',
        { data: 'test' }
      );
    });

    it('should not log when level is above DEBUG', () => {
      logger.setMinLevel(LogLevel.INFO);
      logger.debug('Test debug message');
      
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });
  });

  describe('info', () => {
    it('should log info message when level is INFO or below', () => {
      logger.setMinLevel(LogLevel.INFO);
      logger.info('Test info message', { data: 'test' });
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[INFO] Test info message',
        { data: 'test' }
      );
    });

    it('should not log when level is above INFO', () => {
      logger.setMinLevel(LogLevel.WARN);
      logger.info('Test info message');
      
      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log warn message when level is WARN or below', () => {
      logger.setMinLevel(LogLevel.WARN);
      logger.warn('Test warn message', { data: 'test' });
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[WARN] Test warn message',
        { data: 'test' }
      );
    });

    it('should not log when level is above WARN', () => {
      logger.setMinLevel(LogLevel.ERROR);
      logger.warn('Test warn message');
      
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should log error message with Error object', () => {
      logger.setMinLevel(LogLevel.ERROR);
      const error = new Error('Test error');
      logger.error('Test error message', error);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ERROR] Test error message',
        error
      );
    });

    it('should log error message with stack trace for Error objects', () => {
      logger.setMinLevel(LogLevel.ERROR);
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';
      logger.error('Test error message', error);
      
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Stack trace:', 'Error: Test error\n    at test.js:1:1');
    });

    it('should log error message with non-Error value', () => {
      logger.setMinLevel(LogLevel.ERROR);
      logger.error('Test error message', 'string error', { extra: 'data' });
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ERROR] Test error message',
        'string error',
        { extra: 'data' }
      );
    });

    it('should always log errors regardless of level', () => {
      logger.setMinLevel(LogLevel.ERROR);
      logger.error('Test error message');
      
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('gameEvent', () => {
    it('should log game event when level is DEBUG', () => {
      logger.setMinLevel(LogLevel.DEBUG);
      logger.gameEvent('word_submitted', { word: 'HELLO', score: 10 });
      
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        '[GAME] word_submitted',
        { word: 'HELLO', score: 10 }
      );
    });

    it('should log game event without data', () => {
      logger.setMinLevel(LogLevel.DEBUG);
      logger.gameEvent('game_started');
      
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        '[GAME] game_started',
        {}
      );
    });

    it('should not log when level is above DEBUG', () => {
      logger.setMinLevel(LogLevel.INFO);
      logger.gameEvent('word_submitted');
      
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });
  });

  describe('setMinLevel', () => {
    it('should change minimum log level', () => {
      logger.setMinLevel(LogLevel.WARN);
      logger.debug('Should not log');
      logger.info('Should not log');
      logger.warn('Should log');
      
      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });
});

