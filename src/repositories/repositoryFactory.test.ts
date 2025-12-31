import { describe, it, expect, beforeEach } from 'vitest';
import { RepositoryFactory } from './repositoryFactory';
import { MockPuzzleRepository } from './mock/MockPuzzleRepository';
import { MockGameResultRepository } from './mock/MockGameResultRepository';

describe('RepositoryFactory', () => {
  beforeEach(() => {
    RepositoryFactory.reset();
  });

  it('should create puzzle repository instance', () => {
    const repo = RepositoryFactory.getPuzzleRepository();
    expect(repo).toBeDefined();
  });

  it('should return same instance on subsequent calls', () => {
    const repo1 = RepositoryFactory.getPuzzleRepository();
    const repo2 = RepositoryFactory.getPuzzleRepository();
    expect(repo1).toBe(repo2);
  });

  it('should create game result repository instance', () => {
    const repo = RepositoryFactory.getGameResultRepository();
    expect(repo).toBeDefined();
  });

  it('should return same game result repository instance on subsequent calls', () => {
    const repo1 = RepositoryFactory.getGameResultRepository();
    const repo2 = RepositoryFactory.getGameResultRepository();
    expect(repo1).toBe(repo2);
  });

  it('should allow setting custom puzzle repository', () => {
    const mockRepo = new MockPuzzleRepository();
    RepositoryFactory.setPuzzleRepository(mockRepo);

    const repo = RepositoryFactory.getPuzzleRepository();
    expect(repo).toBe(mockRepo);
  });

  it('should allow setting custom game result repository', () => {
    const mockRepo = new MockGameResultRepository();
    RepositoryFactory.setGameResultRepository(mockRepo);

    const repo = RepositoryFactory.getGameResultRepository();
    expect(repo).toBe(mockRepo);
  });

  it('should reset all repositories', () => {
    const repo1 = RepositoryFactory.getPuzzleRepository();
    RepositoryFactory.reset();
    const repo2 = RepositoryFactory.getPuzzleRepository();

    expect(repo1).not.toBe(repo2);
  });
});

