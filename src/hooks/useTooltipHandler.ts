import { useRef, useCallback, useEffect } from 'react';

export interface UseTooltipHandlerOptions {
  tooltip: { title: string; description: string } | null;
  delay?: number;
  setTooltip: (tooltip: { title: string; description: string } | null) => void;
  onClick?: (e: React.MouseEvent) => void;
}

export interface UseTooltipHandlerReturn {
  handleMouseDown: () => void;
  handleMouseUp: () => void;
  handleMouseLeave: () => void;
  handleTouchStart: () => void;
  handleTouchEnd: () => void;
  handleClick: (e: React.MouseEvent) => void;
}

/**
 * Custom hook for handling tooltip interactions with delay.
 * Provides consistent behavior for mouse and touch events.
 * 
 * @param options - Configuration options
 * @returns Event handlers for tooltip interactions
 */
export function useTooltipHandler({
  tooltip,
  delay = 500,
  setTooltip,
  onClick,
}: UseTooltipHandlerOptions): UseTooltipHandlerReturn {
  const timeoutRef = useRef<number | null>(null);
  const tooltipShownRef = useRef(false);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseDown = useCallback(() => {
    tooltipShownRef.current = false;
    if (tooltip) {
      timeoutRef.current = window.setTimeout(() => {
        setTooltip(tooltip);
        tooltipShownRef.current = true;
      }, delay);
    }
  }, [tooltip, delay, setTooltip]);

  const handleMouseUp = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    handleMouseUp();
    setTooltip(null);
    tooltipShownRef.current = false;
  }, [handleMouseUp, setTooltip]);

  const handleTouchStart = useCallback(() => {
    handleMouseDown();
  }, [handleMouseDown]);

  const handleTouchEnd = useCallback(() => {
    handleMouseUp();
    // On touch devices, if tooltip was shown, prevent the click
    if (tooltipShownRef.current) {
      setTimeout(() => {
        tooltipShownRef.current = false;
        setTooltip(null);
      }, 100);
    }
  }, [handleMouseUp, setTooltip]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Prevent action if tooltip was shown during this interaction
      if (tooltipShownRef.current) {
        e.preventDefault();
        e.stopPropagation();
        // Reset the flag after a short delay to allow tooltip to be dismissed
        setTimeout(() => {
          tooltipShownRef.current = false;
          setTooltip(null);
        }, 100);
        return;
      }
      onClick?.(e);
    },
    [onClick, setTooltip]
  );

  return {
    handleMouseDown,
    handleMouseUp,
    handleMouseLeave,
    handleTouchStart,
    handleTouchEnd,
    handleClick,
  };
}

