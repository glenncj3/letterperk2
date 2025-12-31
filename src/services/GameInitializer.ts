import { GameMode, GameConfiguration, Tile } from '../types/game';
import { IPuzzleRepository } from '../repositories/interfaces/IPuzzleRepository';
import {
  generateGameConfiguration,
  seededRandom,
  getTodayUTC,
  dateToSeed,
  formatUTCDateString,
} from '../utils/seedGenerator';
import { assignBonusesToSequences } from '../utils/bonusUtils';
import { createTile } from '../utils/tileUtils';
import { GRID_COLS, TILES_PER_COLUMN } from '../constants/gameConstants';

export interface GameSetup {
  date: string;
  seed: number;
  configuration: GameConfiguration;
  tiles: Tile[];
  columnSequences: GameConfiguration['columnSequences'];
  columnDrawIndices: [number, number, number];
  randomFunc: () => number;
}

/**
 * Service responsible for initializing new games.
 * Handles puzzle loading, configuration, and initial tile creation.
 */
export class GameInitializer {
  constructor(private puzzleRepository: IPuzzleRepository) {}

  /**
   * Initializes a new game for the given mode.
   * 
   * @param mode - Game mode ('daily' or 'casual')
   * @returns Game setup including tiles, configuration, and random function
   */
  async initialize(mode: GameMode): Promise<GameSetup> {
    const today = getTodayUTC();
    const date = formatUTCDateString(today);

    let seed: number;
    if (mode === 'daily') {
      seed = dateToSeed(today);
    } else {
      // Casual mode uses random seed
      seed = Math.floor(Math.random() * 900000) + 100000;
    }

    // Load or generate puzzle configuration
    const configuration =
      mode === 'daily'
        ? await this.puzzleRepository.loadDailyPuzzle(date, seed)
        : generateGameConfiguration(seed);

    const random = seededRandom(seed);

    // Assign bonuses to sequences
    const sequencesWithBonuses = assignBonusesToSequences(
      configuration.columnSequences,
      configuration.bonusConfig,
      random
    );

    const configWithBonuses: GameConfiguration = {
      ...configuration,
      columnSequences: sequencesWithBonuses,
    };

    // Create initial tiles
    const tiles: Tile[] = [];
    for (let col = 0; col < GRID_COLS; col++) {
      for (let row = 0; row < TILES_PER_COLUMN; row++) {
        const tileData = sequencesWithBonuses[col][row];
        const tile = createTile(
          tileData.letter,
          tileData.points,
          row,
          col,
          tileData.bonusType
        );
        tiles.push(tile);
      }
    }

    return {
      date,
      seed,
      configuration: configWithBonuses,
      tiles,
      columnSequences: sequencesWithBonuses,
      columnDrawIndices: [TILES_PER_COLUMN, TILES_PER_COLUMN, TILES_PER_COLUMN],
      randomFunc: random,
    };
  }
}

