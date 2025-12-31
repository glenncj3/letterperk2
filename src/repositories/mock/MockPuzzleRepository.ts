import { IPuzzleRepository } from '../interfaces/IPuzzleRepository';
import { GameConfiguration } from '../../types/game';
import { generateGameConfiguration } from '../../utils/seedGenerator';

/**
 * Mock implementation of IPuzzleRepository for testing.
 * Stores puzzles in memory.
 */
export class MockPuzzleRepository implements IPuzzleRepository {
  private puzzles: Map<string, GameConfiguration> = new Map();

  async loadDailyPuzzle(date: string, seed: number): Promise<GameConfiguration> {
    const key = `${date}-${seed}`;
    
    if (this.puzzles.has(key)) {
      return this.puzzles.get(key)!;
    }

    // Generate new puzzle
    const configuration = generateGameConfiguration(seed);
    this.puzzles.set(key, configuration);
    return configuration;
  }

  async saveDailyPuzzle(
    date: string,
    seed: number,
    configuration: GameConfiguration
  ): Promise<void> {
    const key = `${date}-${seed}`;
    this.puzzles.set(key, configuration);
  }

  // Test helper methods
  clear(): void {
    this.puzzles.clear();
  }

  hasPuzzle(date: string, seed: number): boolean {
    const key = `${date}-${seed}`;
    return this.puzzles.has(key);
  }

  getPuzzleCount(): number {
    return this.puzzles.size;
  }
}

