import { describe, it, expect } from 'vitest';
import { ErrorType, GameError, ErrorHandler } from './errors';

describe('GameError', () => {
  it('should create error with type and message', () => {
    const error = new GameError(ErrorType.INVALID_WORD, 'Test message');
    
    expect(error.type).toBe(ErrorType.INVALID_WORD);
    expect(error.message).toBe('Test message');
    expect(error.name).toBe('GameError');
  });

  it('should store original error', () => {
    const originalError = new Error('Original');
    const error = new GameError(ErrorType.INITIALIZATION_FAILED, 'Wrapped', originalError);
    
    expect(error.originalError).toBe(originalError);
  });

  describe('getUserMessage', () => {
    it('should return user-friendly message for INITIALIZATION_FAILED', () => {
      const error = new GameError(ErrorType.INITIALIZATION_FAILED, 'Failed');
      expect(error.getUserMessage()).toBe('Failed to initialize game. Please try again.');
    });

    it('should return user-friendly message for INVALID_WORD', () => {
      const error = new GameError(ErrorType.INVALID_WORD, 'Invalid');
      expect(error.getUserMessage()).toBe('Invalid word. Please select a valid word.');
    });

    it('should return user-friendly message for NO_TRADES_AVAILABLE', () => {
      const error = new GameError(ErrorType.NO_TRADES_AVAILABLE, 'No trades');
      expect(error.getUserMessage()).toBe('No trades available.');
    });

    it('should return custom message for UNKNOWN_ERROR if no message', () => {
      const error = new GameError(ErrorType.UNKNOWN_ERROR, '');
      expect(error.getUserMessage()).toBe('An unexpected error occurred.');
    });

    it('should return message for UNKNOWN_ERROR if message provided', () => {
      const error = new GameError(ErrorType.UNKNOWN_ERROR, 'Custom message');
      expect(error.getUserMessage()).toBe('Custom message');
    });
  });
});

describe('ErrorHandler', () => {
  describe('handle', () => {
    it('should return GameError if already a GameError', () => {
      const gameError = new GameError(ErrorType.INVALID_WORD, 'Test');
      const result = ErrorHandler.handle(gameError);
      
      expect(result).toBe(gameError);
    });

    it('should wrap Error in GameError', () => {
      const error = new Error('Test error');
      const result = ErrorHandler.handle(error, ErrorType.DATABASE_ERROR);
      
      expect(result).toBeInstanceOf(GameError);
      expect(result.type).toBe(ErrorType.DATABASE_ERROR);
      expect(result.message).toBe('Test error');
      expect(result.originalError).toBe(error);
    });

    it('should wrap string in GameError', () => {
      const result = ErrorHandler.handle('String error', ErrorType.NETWORK_ERROR);
      
      expect(result).toBeInstanceOf(GameError);
      expect(result.type).toBe(ErrorType.NETWORK_ERROR);
      expect(result.message).toBe('String error');
    });

    it('should use UNKNOWN_ERROR as default', () => {
      const result = ErrorHandler.handle('Error');
      
      expect(result.type).toBe(ErrorType.UNKNOWN_ERROR);
    });
  });

  describe('getUserMessage', () => {
    it('should return user-friendly message', () => {
      const message = ErrorHandler.getUserMessage(
        new Error('Test'),
        ErrorType.INVALID_WORD
      );
      
      expect(message).toBe('Invalid word. Please select a valid word.');
    });
  });

  describe('wrap', () => {
    it('should return result if function succeeds', async () => {
      const result = await ErrorHandler.wrap(async () => 'success', ErrorType.UNKNOWN_ERROR);
      
      expect(result).toBe('success');
    });

    it('should return null and handle error if function fails', async () => {
      const result = await ErrorHandler.wrap(
        async () => {
          throw new Error('Failed');
        },
        ErrorType.DATABASE_ERROR
      );
      
      expect(result).toBeNull();
    });
  });

  describe('wrapSync', () => {
    it('should return result if function succeeds', () => {
      const result = ErrorHandler.wrapSync(() => 'success', ErrorType.UNKNOWN_ERROR);
      
      expect(result).toBe('success');
    });

    it('should return null and handle error if function fails', () => {
      const result = ErrorHandler.wrapSync(
        () => {
          throw new Error('Failed');
        },
        ErrorType.DATABASE_ERROR
      );
      
      expect(result).toBeNull();
    });
  });
});

