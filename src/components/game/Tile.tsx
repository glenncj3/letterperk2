import { memo, useState, useRef, useEffect } from 'react';
import { Tile as TileType } from '../../types/game';
import { BONUS_COLORS } from '../../constants/gameConstants';
import { useGameState } from '../../contexts/GameContext';

interface TileProps {
  tile: TileType;
  isSelected: boolean;
  onClick: () => void;
  isNew?: boolean;
  animationDelay?: number;
  isShuffling?: boolean;
  shuffleFromRow?: number;
  shuffleFromCol?: number;
  shuffleDelay?: number;
}

export const Tile = memo(function Tile({ 
  tile, 
  isSelected, 
  onClick, 
  isNew = false, 
  animationDelay = 0,
  isShuffling = false,
  shuffleFromRow,
  shuffleFromCol,
  shuffleDelay = 0
}: TileProps) {
  const { actions } = useGameState();
  const [isAnimating, setIsAnimating] = useState(isNew);
  const [isShuffleAnimating, setIsShuffleAnimating] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const tooltipShownRef = useRef(false);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isNew) {
      setIsAnimating(true);
      // Animation duration is ~600ms, so clear the flag after that
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 600 + animationDelay);
      return () => clearTimeout(timer);
    } else {
      // If isNew becomes false, stop animating immediately
      setIsAnimating(false);
    }
  }, [isNew, animationDelay]);

  useEffect(() => {
    if (isShuffling && shuffleFromRow !== undefined && shuffleFromCol !== undefined) {
      setIsShuffleAnimating(true);
      // Shuffle animation duration is 400ms
      const timer = setTimeout(() => {
        setIsShuffleAnimating(false);
      }, 400 + shuffleDelay);
      return () => clearTimeout(timer);
    } else {
      setIsShuffleAnimating(false);
    }
  }, [isShuffling, shuffleFromRow, shuffleFromCol, shuffleDelay]);

  const handleMouseDown = () => {
    tooltipShownRef.current = false;
    if (tile.bonusType) {
      timeoutRef.current = window.setTimeout(() => {
        const colors = BONUS_COLORS[tile.bonusType!];
        actions.setTooltip({ title: colors.name, description: colors.description });
        tooltipShownRef.current = true;
      }, 500);
    }
  };

  const handleMouseUp = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    handleMouseUp();
    actions.setTooltip(null);
    tooltipShownRef.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
    // Prevent selection if tooltip was shown during this interaction
    if (tooltipShownRef.current) {
      e.preventDefault();
      e.stopPropagation();
      // Reset the flag after a short delay to allow tooltip to be dismissed
      setTimeout(() => {
        tooltipShownRef.current = false;
        actions.setTooltip(null);
      }, 100);
      return;
    }
    onClick();
  };

  const handleTouchEnd = () => {
    handleMouseUp();
    // On touch devices, if tooltip was shown, prevent the click
    if (tooltipShownRef.current) {
      // Reset after a short delay
      setTimeout(() => {
        tooltipShownRef.current = false;
        actions.setTooltip(null);
      }, 100);
    }
  };

  const getBonusStyles = () => {
    if (!tile.bonusType) return '';

    const colors = BONUS_COLORS[tile.bonusType];
    const tintMap = {
      green: isSelected ? 'bg-green-300' : 'bg-green-100',
      purple: isSelected ? 'bg-purple-300' : 'bg-purple-100',
      red: isSelected ? 'bg-red-300' : 'bg-red-100',
      yellow: isSelected ? 'bg-yellow-300' : 'bg-yellow-100',
      blue: isSelected ? 'bg-blue-300' : 'bg-blue-100',
      black: isSelected ? 'bg-gray-500' : 'bg-gray-400'
    };

    const tint = tintMap[tile.bonusType];
    const border = isSelected ? '' : `border-4 ${colors.border}`;
    return `${tint} ${border}`;
  };

  // Calculate shuffle transform values
  // The tile needs to move from its old grid position to its new position
  // Since the tile is already in the new cell, we start it at the old position
  // and animate to (0, 0) - its current position
  const getShuffleTransform = () => {
    if (!isShuffling || shuffleFromRow === undefined || shuffleFromCol === undefined) {
      return { x: '0', y: '0' };
    }
    
    const colDiff = tile.col - shuffleFromCol;
    const rowDiff = tile.row - shuffleFromRow;
    
    if (colDiff === 0 && rowDiff === 0) {
      return { x: '0', y: '0' };
    }
    
    // The transform is relative to the tile's container (the cell div)
    // To move from old cell to new cell, we calculate the offset
    // For a 3-column grid with gap-2:
    // - Horizontal: each column is roughly 33.33% of grid width, plus gap
    // - Vertical: each row is 100% of cell height, plus gap
    
    // Use a simpler calculation: since cells are aspect-square and the grid
    // uses gap-2 (0.5rem), we'll calculate based on the cell size
    // We'll use CSS calc with viewport-relative units for horizontal
    // and percentage for vertical (relative to cell height)
    
    // Horizontal movement: colDiff columns
    // In a responsive grid, column width varies, but we can approximate
    // Using a calculation that works for most screen sizes
    const xValue = colDiff !== 0 
      ? `calc(${colDiff} * (33.333% + 0.5rem))`
      : '0';
    
    // Vertical movement: rowDiff rows
    // Each cell is aspect-square, so height = width
    // With gap-2, movement = rowDiff * (100% + 0.5rem)
    const yValue = rowDiff !== 0
      ? `calc(${rowDiff} * (100% + 0.5rem))`
      : '0';
    
    return { x: xValue, y: yValue };
  };

  const shuffleTransform = getShuffleTransform();
  
  return (
    <div className="relative">
      <button
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleTouchEnd}
        className={`
          w-full aspect-square rounded-full
          flex items-center justify-center
          transition-all duration-200
          ${getBonusStyles()}
          ${isSelected ? (tile.bonusType ? 'scale-95' : 'bg-gray-300 scale-95') : tile.bonusType ? 'hover:scale-105' : 'bg-white hover:scale-105'}
          shadow-lg pb-0.5
          ${isAnimating ? 'animate-tile-fall' : ''}
          ${isShuffleAnimating ? 'animate-tile-shuffle' : ''}
        `}
        style={{
          fontSize: 'clamp(1.75rem, 5vw, 2rem)',
          animationDelay: isAnimating 
            ? `${animationDelay}ms` 
            : isShuffleAnimating 
              ? `${shuffleDelay}ms` 
              : undefined,
          zIndex: isAnimating || isShuffleAnimating ? 20 : 1,
          // Calculate transform for shuffle: move from old position to new position
          // The transform starts at the old position (negative of the movement) and animates to 0
          '--shuffle-from-x': isShuffleAnimating && shuffleTransform.x !== '0'
            ? `calc(-1 * (${shuffleTransform.x}))`
            : '0',
          '--shuffle-from-y': isShuffleAnimating && shuffleTransform.y !== '0'
            ? `calc(-1 * (${shuffleTransform.y}))`
            : '0',
        } as React.CSSProperties}
        aria-label={`Letter ${tile.letter}, ${tile.points} points${tile.bonusType ? `, ${tile.bonusType} bonus` : ''}`}
      >
        <span className="relative font-bold text-gray-900 leading-none -translate-y-px">
          {tile.letter}
          <sub className="absolute text-[0.5em] text-gray-600 font-normal ml-[0.15em]">{tile.points}</sub>
        </span>
      </button>

    </div>
  );
});
