import { memo, useState, useRef, useEffect } from 'react';
import { Tile as TileType } from '../../types/game';
import { BONUS_COLORS } from '../../constants/gameConstants';

interface TileProps {
  tile: TileType;
  isSelected: boolean;
  onClick: () => void;
  isNew?: boolean;
  animationDelay?: number;
}

export const Tile = memo(function Tile({ tile, isSelected, onClick, isNew = false, animationDelay = 0 }: TileProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isAnimating, setIsAnimating] = useState(isNew);
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

  const handleMouseDown = () => {
    tooltipShownRef.current = false;
    if (tile.bonusType) {
      timeoutRef.current = window.setTimeout(() => {
        setShowTooltip(true);
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
    setShowTooltip(false);
    tooltipShownRef.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
    // Prevent selection if tooltip was shown during this interaction
    if (tooltipShownRef.current || showTooltip) {
      e.preventDefault();
      e.stopPropagation();
      // Reset the flag after a short delay to allow tooltip to be dismissed
      setTimeout(() => {
        tooltipShownRef.current = false;
      }, 100);
      return;
    }
    onClick();
  };

  const handleTouchEnd = () => {
    handleMouseUp();
    // On touch devices, if tooltip was shown, prevent the click
    if (tooltipShownRef.current || showTooltip) {
      // Reset after a short delay
      setTimeout(() => {
        tooltipShownRef.current = false;
        setShowTooltip(false);
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
      blue: isSelected ? 'bg-blue-300' : 'bg-blue-100'
    };

    const tint = tintMap[tile.bonusType];
    const border = isSelected ? '' : `border-4 ${colors.border}`;
    return `${tint} ${border}`;
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
          ${isAnimating ? 'animate-tile-fall' : ''}
        `}
        style={{ 
          fontSize: 'clamp(1rem, 4vw, 2rem)',
          animationDelay: isAnimating ? `${animationDelay}ms` : undefined,
          zIndex: isAnimating ? 10 : 1
        }}
        aria-label={`Letter ${tile.letter}, ${tile.points} points${tile.bonusType ? `, ${tile.bonusType} bonus` : ''}`}
      >
        <span className="relative font-bold text-gray-900 leading-none -translate-y-px">
          {tile.letter}
          <sub className="absolute text-[0.4em] text-gray-600 font-normal ml-[0.15em]">{tile.points}</sub>
        </span>
      </button>

      {showTooltip && tile.bonusType && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="bg-gray-900 text-white text-sm rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
            <div className="font-semibold">{BONUS_COLORS[tile.bonusType].name}</div>
            <div className="text-xs text-gray-300">{BONUS_COLORS[tile.bonusType].description}</div>
          </div>
        </div>
      )}
    </div>
  );
});
