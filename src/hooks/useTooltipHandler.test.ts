import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTooltipHandler } from './useTooltipHandler';

describe('useTooltipHandler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should show tooltip after delay on mouse down', () => {
    const setTooltip = vi.fn();
    const { result } = renderHook(() =>
      useTooltipHandler({
        tooltip: { title: 'Test', description: 'Test description' },
        delay: 500,
        setTooltip,
      })
    );

    act(() => {
      result.current.handleMouseDown();
    });

    // Should not be called immediately
    expect(setTooltip).not.toHaveBeenCalled();

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should be called after delay
    expect(setTooltip).toHaveBeenCalledWith({
      title: 'Test',
      description: 'Test description',
    });
  });

  it('should cancel tooltip on mouse up', () => {
    const setTooltip = vi.fn();
    const { result } = renderHook(() =>
      useTooltipHandler({
        tooltip: { title: 'Test', description: 'Test description' },
        delay: 500,
        setTooltip,
      })
    );

    act(() => {
      result.current.handleMouseDown();
    });

    act(() => {
      result.current.handleMouseUp();
    });

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should not be called because mouse up cancelled it
    expect(setTooltip).not.toHaveBeenCalled();
  });

  it('should clear tooltip on mouse leave', () => {
    const setTooltip = vi.fn();
    const { result } = renderHook(() =>
      useTooltipHandler({
        tooltip: { title: 'Test', description: 'Test description' },
        delay: 500,
        setTooltip,
      })
    );

    act(() => {
      result.current.handleMouseDown();
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(setTooltip).toHaveBeenCalled();

    act(() => {
      result.current.handleMouseLeave();
    });

    // Should clear tooltip
    expect(setTooltip).toHaveBeenLastCalledWith(null);
  });

  it('should handle touch events', () => {
    const setTooltip = vi.fn();
    const { result } = renderHook(() =>
      useTooltipHandler({
        tooltip: { title: 'Test', description: 'Test description' },
        delay: 500,
        setTooltip,
      })
    );

    act(() => {
      result.current.handleTouchStart();
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(setTooltip).toHaveBeenCalled();
  });

  it('should prevent click if tooltip was shown', () => {
    const setTooltip = vi.fn();
    const onClick = vi.fn();
    const { result } = renderHook(() =>
      useTooltipHandler({
        tooltip: { title: 'Test', description: 'Test description' },
        delay: 500,
        setTooltip,
        onClick,
      })
    );

    act(() => {
      result.current.handleMouseDown();
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Tooltip should be shown
    expect(setTooltip).toHaveBeenCalled();

    // Simulate click
    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as React.MouseEvent;

    act(() => {
      result.current.handleClick(mockEvent);
    });

    // Should prevent default and not call onClick
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('should call onClick if tooltip was not shown', () => {
    const setTooltip = vi.fn();
    const onClick = vi.fn();
    const { result } = renderHook(() =>
      useTooltipHandler({
        tooltip: { title: 'Test', description: 'Test description' },
        delay: 500,
        setTooltip,
        onClick,
      })
    );

    act(() => {
      result.current.handleMouseDown();
    });

    act(() => {
      result.current.handleMouseUp();
    });

    // Click immediately (before tooltip delay)
    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as React.MouseEvent;

    act(() => {
      result.current.handleClick(mockEvent);
    });

    // Should call onClick
    expect(onClick).toHaveBeenCalled();
  });

  it('should clean up timeout on unmount', () => {
    const setTooltip = vi.fn();
    const { result, unmount } = renderHook(() =>
      useTooltipHandler({
        tooltip: { title: 'Test', description: 'Test description' },
        delay: 500,
        setTooltip,
      })
    );

    act(() => {
      result.current.handleMouseDown();
    });

    unmount();

    // Fast-forward time after unmount
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should not be called because component unmounted
    expect(setTooltip).not.toHaveBeenCalled();
  });
});

