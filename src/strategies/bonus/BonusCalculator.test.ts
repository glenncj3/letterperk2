import { describe, it, expect, beforeEach } from 'vitest';
import { BonusCalculator } from './BonusCalculator';
import { Tile } from '../../types/game';
import { createTile } from '../../utils/tileUtils';
import {
  GREEN_BONUS_VALUE,
  RED_BONUS_VALUE,
  BLUE_BONUS_VALUE,
  PURPLE_BONUS_MULTIPLIER,
} from '../../constants/gameConstants';

describe('BonusCalculator', () => {
  let calculator: BonusCalculator;

  beforeEach(() => {
    calculator = new BonusCalculator();
  });

  describe('calculateScore', () => {
    it('should calculate base score without bonuses', () => {
      const tiles: Tile[] = [
        createTile('H', 4, 0, 0),
        createTile('E', 1, 0, 1),
        createTile('L', 1, 0, 2),
        createTile('L', 1, 0, 2),
        createTile('O', 1, 0, 3),
      ];

      const result = calculator.calculateScore('HELLO', tiles);

      expect(result.baseScore).toBe(8);
      expect(result.bonuses).toEqual([]);
      expect(result.finalScore).toBe(8);
    });

    it('should apply green bonus (+2 per green tile)', () => {
      const tiles: Tile[] = [
        createTile('H', 4, 0, 0, 'green'),
        createTile('E', 1, 0, 1),
        createTile('L', 1, 0, 2, 'green'),
        createTile('L', 1, 0, 2),
        createTile('O', 1, 0, 3),
      ];

      const result = calculator.calculateScore('HELLO', tiles);

      expect(result.baseScore).toBe(8);
      expect(result.bonuses).toHaveLength(2);
      expect(result.bonuses[0]).toEqual({ type: 'green', value: GREEN_BONUS_VALUE });
      expect(result.bonuses[1]).toEqual({ type: 'green', value: GREEN_BONUS_VALUE });
      expect(result.finalScore).toBe(8 + GREEN_BONUS_VALUE + GREEN_BONUS_VALUE);
    });

    it('should apply red bonus (+10 if word length <= 3)', () => {
      const tiles: Tile[] = [
        createTile('H', 4, 0, 0, 'red'),
        createTile('I', 1, 0, 1),
      ];

      const result = calculator.calculateScore('HI', tiles);

      expect(result.baseScore).toBe(5);
      expect(result.bonuses).toHaveLength(1);
      expect(result.bonuses[0]).toEqual({ type: 'red', value: RED_BONUS_VALUE });
      expect(result.finalScore).toBe(5 + RED_BONUS_VALUE);
    });

    it('should not apply red bonus if word length > 3', () => {
      const tiles: Tile[] = [
        createTile('H', 4, 0, 0, 'red'),
        createTile('E', 1, 0, 1),
        createTile('L', 1, 0, 2),
        createTile('L', 1, 0, 2),
        createTile('O', 1, 0, 3),
      ];

      const result = calculator.calculateScore('HELLO', tiles);

      expect(result.baseScore).toBe(8);
      expect(result.bonuses).toEqual([]);
      expect(result.finalScore).toBe(8);
    });

    it('should apply blue bonus (+5 if first or last position)', () => {
      const tiles: Tile[] = [
        createTile('H', 4, 0, 0, 'blue'),
        createTile('E', 1, 0, 1),
        createTile('L', 1, 0, 2),
        createTile('O', 1, 0, 3, 'blue'),
      ];

      const result = calculator.calculateScore('HELO', tiles);

      expect(result.baseScore).toBe(7);
      expect(result.bonuses).toHaveLength(2);
      expect(result.bonuses[0]).toEqual({ type: 'blue', value: BLUE_BONUS_VALUE });
      expect(result.bonuses[1]).toEqual({ type: 'blue', value: BLUE_BONUS_VALUE });
      expect(result.finalScore).toBe(7 + BLUE_BONUS_VALUE + BLUE_BONUS_VALUE);
    });

    it('should not apply blue bonus if not first or last', () => {
      const tiles: Tile[] = [
        createTile('H', 4, 0, 0),
        createTile('E', 1, 0, 1, 'blue'),
        createTile('L', 1, 0, 2),
        createTile('O', 1, 0, 3),
      ];

      const result = calculator.calculateScore('HELO', tiles);

      expect(result.baseScore).toBe(7);
      expect(result.bonuses).toEqual([]);
      expect(result.finalScore).toBe(7);
    });

    it('should apply yellow bonus (square of yellow count)', () => {
      const tiles: Tile[] = [
        createTile('H', 4, 0, 0, 'yellow'),
        createTile('E', 1, 0, 1, 'yellow'),
        createTile('L', 1, 0, 2, 'yellow'),
        createTile('L', 1, 0, 2),
        createTile('O', 1, 0, 3),
      ];

      const result = calculator.calculateScore('HELLO', tiles);

      expect(result.baseScore).toBe(8);
      expect(result.bonuses).toHaveLength(1);
      expect(result.bonuses[0]).toEqual({ type: 'yellow', value: 9 }); // 3^2 = 9
      expect(result.finalScore).toBe(17);
    });

    it('should apply purple bonus (doubles score if word length >= 7)', () => {
      const tiles: Tile[] = [
        createTile('H', 4, 0, 0, 'purple'),
        createTile('E', 1, 0, 1),
        createTile('L', 1, 0, 2),
        createTile('L', 1, 0, 2),
        createTile('O', 1, 0, 3),
        createTile('W', 4, 0, 4),
        createTile('O', 1, 0, 5),
        createTile('R', 1, 0, 6),
        createTile('L', 1, 0, 7),
        createTile('D', 2, 0, 8),
      ];

      const result = calculator.calculateScore('HELLOWORLD', tiles);

      expect(result.baseScore).toBe(17); // 4+1+1+1+1+4+1+1+1+2
      expect(result.bonuses).toHaveLength(1);
      expect(result.bonuses[0]).toEqual({ type: 'purple', value: 17 });
      expect(result.finalScore).toBe(17 * PURPLE_BONUS_MULTIPLIER);
    });

    it('should not apply purple bonus if word length < 5', () => {
      const tiles: Tile[] = [
        createTile('H', 4, 0, 0, 'purple'),
        createTile('I', 1, 0, 1),
      ];

      const result = calculator.calculateScore('HI', tiles);

      expect(result.baseScore).toBe(5);
      expect(result.bonuses).toEqual([]);
      expect(result.finalScore).toBe(5);
    });

    it('should combine multiple bonuses correctly', () => {
      const tiles: Tile[] = [
        createTile('H', 4, 0, 0, 'green'),
        createTile('E', 1, 0, 1),
        createTile('L', 1, 0, 2),
        createTile('L', 1, 0, 2),
        createTile('O', 1, 0, 3, 'blue'), // Blue at last position
      ];

      const result = calculator.calculateScore('HELLO', tiles);

      expect(result.baseScore).toBe(8);
      // Green + BLUE_BONUS_VALUE, Blue + BLUE_BONUS_VALUE (last position)
      // Additive: 8 + GREEN_BONUS_VALUE + BLUE_BONUS_VALUE
      expect(result.finalScore).toBe(8 + GREEN_BONUS_VALUE + BLUE_BONUS_VALUE);
    });

    it('should combine green, blue, and purple bonuses correctly', () => {
      const tiles: Tile[] = [
        createTile('H', 4, 0, 0, 'green'),
        createTile('E', 1, 0, 1),
        createTile('L', 1, 0, 2),
        createTile('L', 1, 0, 2),
        createTile('O', 1, 0, 3),
        createTile('W', 4, 0, 4),
        createTile('O', 1, 0, 5, 'purple'), // Purple at last position
      ];

      const result = calculator.calculateScore('HELLOWO', tiles);

      expect(result.baseScore).toBe(13);
      // Green + GREEN_BONUS_VALUE, Purple multiplies
      // Additive: 13 + GREEN_BONUS_VALUE
      // Multiplicative: (13 + GREEN_BONUS_VALUE) * PURPLE_BONUS_MULTIPLIER
      const additiveScore = 13 + GREEN_BONUS_VALUE;
      expect(result.finalScore).toBe(additiveScore * PURPLE_BONUS_MULTIPLIER);
    });

    it('should handle black bonus (no score effect)', () => {
      const tiles: Tile[] = [
        createTile('H', 4, 0, 0, 'black'),
        createTile('I', 1, 0, 1),
      ];

      const result = calculator.calculateScore('HI', tiles);

      expect(result.baseScore).toBe(5);
      expect(result.bonuses).toEqual([]);
      expect(result.finalScore).toBe(5);
    });
  });
});

