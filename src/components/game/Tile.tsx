import { memo, useState, useRef, useEffect } from 'react';
import { Tile as TileType } from '../../types/game';
import { BONUS_COLORS } from '../../constants/gameConstants';

interface TileProps {
  tile: TileType;
  isSelected: boolean;
  onClick: () => void;
}

export const Tile = memo(function Tile({ tile, isSelected, onClick }: TileProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseDown = () => {
    if (tile.bonusType) {
      timeoutRef.current = window.setTimeout(() => {
        setShowTooltip(true);
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
      black: isSelected ? 'bg-gray-400' : 'bg-gray-200'
    };

    const tint = tintMap[tile.bonusType];
    const border = isSelected ? '' : `border-4 ${colors.border}`;
    return `${tint} ${border}`;
  };

  return (
    <div className="relative">
      <button
        onClick={onClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        className={`
          w-full aspect-square rounded-full
          flex items-center justify-center
          transition-all duration-200
          ${getBonusStyles()}
          ${isSelected ? (tile.bonusType ? 'scale-95' : 'bg-gray-300 scale-95') : tile.bonusType ? 'hover:scale-105' : 'bg-white hover:scale-105'}
          shadow-lg pb-0.5
        `}
        style={{ fontSize: 'clamp(1rem, 4vw, 2rem)' }}
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
