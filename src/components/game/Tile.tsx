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
  oldRow?: number;
  oldCol?: number;
}

export const Tile = memo(function Tile({ 
  tile, 
  isSelected, 
  onClick, 
  isNew = false, 
  animationDelay = 0,
  isShuffling = false,
  oldRow,
  oldCol
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
    if (isShuffling && oldRow !== undefined && oldCol !== undefined) {
      setIsShuffleAnimating(true);
      // Animation duration is ~700ms, so clear the flag after that
      const timer = setTimeout(() => {
        setIsShuffleAnimating(false);
      }, 700 + animationDelay);
      return () => clearTimeout(timer);
    } else {
      setIsShuffleAnimating(false);
    }
  }, [isShuffling, oldRow, oldCol, animationDelay]);

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

  // Calculate shuffle transform offsets
  const getShuffleStyles = () => {
    if (!isShuffling || oldRow === undefined || oldCol === undefined) {
      return {};
    }

    // Calculate position differences
    const rowDiff = tile.row - oldRow;
    const colDiff = tile.col - oldCol;

    // Grid uses gap-2 (0.5rem) with 3 columns and 3 rows
    // For a 3-column grid: each column is approximately 33.33% + gap contribution
    // Using a simplified calculation that works well for the grid layout
    // The gap (0.5rem) is small relative to cell size, so we approximate
    
    // Calculate base offsets: colDiff * (100% / 3) for column movement
    // The gap adds approximately 0.5rem per column moved
    const baseColPercent = (colDiff * 100) / 3;
    const baseRowPercent = (rowDiff * 100) / 3;
    
    // For the start position, we need to move from old to new
    // Since transform is relative to current position, we move backwards
    const colOffset = colDiff !== 0 
      ? `calc(${-baseColPercent}% - ${colDiff * 0.5}rem)` 
      : '0';
    const rowOffset = rowDiff !== 0 
      ? `calc(${-baseRowPercent}% - ${rowDiff * 0.5}rem)` 
      : '0';
    
    // For the mid-point, move halfway with a slight arc upward
    const midColPercent = baseColPercent / 2;
    const midRowPercent = baseRowPercent / 2;
    const midColOffset = colDiff !== 0 
      ? `calc(${-midColPercent}% - ${colDiff * 0.25}rem + ${colDiff * 0.15}rem)` 
      : '0';
    const midRowOffset = rowDiff !== 0 
      ? `calc(${-midRowPercent}% - ${rowDiff * 0.25}rem - ${Math.abs(rowDiff) * 0.2}rem)` 
      : '0';

    return {
      '--shuffle-start-transform': `translate(${colOffset}, ${rowOffset})`,
      '--shuffle-mid-transform': `translate(${midColOffset}, ${midRowOffset})`,
      '--shuffle-end-transform': 'translate(0, 0)',
    } as React.CSSProperties;
  };

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
          ${isAnimating && !isShuffleAnimating ? 'animate-tile-fall' : ''}
          ${isShuffleAnimating ? 'animate-tile-shuffle' : ''}
        `}
        style={{
          fontSize: 'clamp(1.75rem, 5vw, 2rem)',
          animationDelay: (isAnimating || isShuffleAnimating) ? `${animationDelay}ms` : undefined,
          zIndex: (isAnimating || isShuffleAnimating) ? 10 : 1,
          ...getShuffleStyles()
        }}
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
