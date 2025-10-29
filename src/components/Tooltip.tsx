import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  delay?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
  preserveLayout?: boolean; // New prop to preserve parent layout
}

const TooltipWrapper = styled.div`
  position: relative;
  display: inline-block;
  
  /* Ensure the wrapper doesn't disrupt flex/grid layouts */
  &[data-layout="preserve"] {
    display: contents;
  }
`;
const TooltipContent = styled.div<{
  $visible: boolean;
  $position: 'top' | 'bottom' | 'left' | 'right';
}>`
  position: absolute;
  background: rgba(34, 36, 42, 0.98);
  color: #fff;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  white-space: nowrap;
  pointer-events: none;
  z-index: 20000;
  box-shadow: 0 6px 32px 0 rgba(40, 40, 80, 0.18), 0 1.5px 6px 0 rgba(0,0,0,0.10);
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: ${({ $visible, $position }) =>
    $visible
      ? $position === 'top' || $position === 'bottom'
        ? 'scale(1) translateY(0)'
        : 'scale(1) translateX(0)'
      : $position === 'top'
        ? 'scale(0.96) translateY(8px)'
        : $position === 'bottom'
        ? 'scale(0.96) translateY(-8px)'
        : $position === 'left'
        ? 'scale(0.96) translateX(8px)'
        : 'scale(0.96) translateX(-8px)'};
  transition: opacity 0.16s cubic-bezier(.4,0,.2,1), transform 0.18s cubic-bezier(.4,0,.2,1);

  ${({ $position }) => {
    switch ($position) {
      case 'top':
        return `
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 8px;
        `;
      case 'bottom':
        return `
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-top: 8px;
        `;
      case 'left':
        return `
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          margin-right: 8px;
        `;
      case 'right':
        return `
          left: 100%;
          top: 50%;
          transform: translateY(-50%);
          margin-left: 8px;
        `;
      default:
        return '';
    }
  }}

  &::after {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    border-style: solid;
    ${({ $position }) => {
      switch ($position) {
        case 'top':
          return `
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border-width: 6px 6px 0 6px;
            border-color: rgba(34,36,42,0.98) transparent transparent transparent;
          `;
        case 'bottom':
          return `
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            border-width: 0 6px 6px 6px;
            border-color: transparent transparent rgba(34,36,42,0.98) transparent;
          `;
        case 'left':
          return `
            top: 50%;
            left: 100%;
            transform: translateY(-50%);
            border-width: 6px 0 6px 6px;
            border-color: transparent transparent transparent rgba(34,36,42,0.98);
          `;
        case 'right':
          return `
            top: 50%;
            right: 100%;
            transform: translateY(-50%);
            border-width: 6px 6px 6px 0;
            border-color: transparent rgba(34,36,42,0.98) transparent transparent;
          `;
        default:
          return '';
      }
    }}
  }
`;

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  delay = 500,
  position = 'top',
  preserveLayout = false,
}) => {
  const [visible, setVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [actualPosition, setActualPosition] = useState(position);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const calculateOptimalPosition = useCallback(() => {
    // Use the child element's bounding rect if preserveLayout is true
    const targetElement = preserveLayout && wrapperRef.current?.firstElementChild 
      ? wrapperRef.current.firstElementChild 
      : wrapperRef.current;
      
    if (!targetElement || !tooltipRef.current) return position;

    const wrapperRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    // Calculate available space in each direction
    const spaceTop = wrapperRect.top;
    const spaceBottom = viewport.height - wrapperRect.bottom;
    const spaceLeft = wrapperRect.left;
    const spaceRight = viewport.width - wrapperRect.right;

    // Tooltip dimensions (approximate)
    const tooltipWidth = tooltipRect.width || 150; // fallback width
    const tooltipHeight = tooltipRect.height || 40; // fallback height

    // Check if preferred position fits
    switch (position) {
      case 'top':
        if (spaceTop >= tooltipHeight + 8) {
          // Check if it fits horizontally
          const leftEdge = wrapperRect.left + wrapperRect.width / 2 - tooltipWidth / 2;
          const rightEdge = leftEdge + tooltipWidth;
          if (leftEdge >= 0 && rightEdge <= viewport.width) return 'top';
        }
        // Fall back to bottom, left, or right
        if (spaceBottom >= tooltipHeight + 8) return 'bottom';
        if (spaceRight >= tooltipWidth + 8) return 'right';
        if (spaceLeft >= tooltipWidth + 8) return 'left';
        break;

      case 'bottom':
        if (spaceBottom >= tooltipHeight + 8) {
          const leftEdge = wrapperRect.left + wrapperRect.width / 2 - tooltipWidth / 2;
          const rightEdge = leftEdge + tooltipWidth;
          if (leftEdge >= 0 && rightEdge <= viewport.width) return 'bottom';
        }
        if (spaceTop >= tooltipHeight + 8) return 'top';
        if (spaceRight >= tooltipWidth + 8) return 'right';
        if (spaceLeft >= tooltipWidth + 8) return 'left';
        break;

      case 'left':
        if (spaceLeft >= tooltipWidth + 8) {
          const topEdge = wrapperRect.top + wrapperRect.height / 2 - tooltipHeight / 2;
          const bottomEdge = topEdge + tooltipHeight;
          if (topEdge >= 0 && bottomEdge <= viewport.height) return 'left';
        }
        if (spaceRight >= tooltipWidth + 8) return 'right';
        if (spaceTop >= tooltipHeight + 8) return 'top';
        if (spaceBottom >= tooltipHeight + 8) return 'bottom';
        break;

      case 'right':
        if (spaceRight >= tooltipWidth + 8) {
          const topEdge = wrapperRect.top + wrapperRect.height / 2 - tooltipHeight / 2;
          const bottomEdge = topEdge + tooltipHeight;
          if (topEdge >= 0 && bottomEdge <= viewport.height) return 'right';
        }
        if (spaceLeft >= tooltipWidth + 8) return 'left';
        if (spaceTop >= tooltipHeight + 8) return 'top';
        if (spaceBottom >= tooltipHeight + 8) return 'bottom';
        break;
    }

    // If nothing fits perfectly, choose the side with most space
    const maxSpace = Math.max(spaceTop, spaceBottom, spaceLeft, spaceRight);
    if (maxSpace === spaceTop) return 'top';
    if (maxSpace === spaceBottom) return 'bottom';
    if (maxSpace === spaceLeft) return 'left';
    return 'right';
  }, [position, preserveLayout]);

  useEffect(() => {
    if (visible) {
      // Small delay to ensure tooltip is rendered before calculating position
      const timer = setTimeout(() => {
        const optimalPosition = calculateOptimalPosition();
        setActualPosition(optimalPosition);
      }, 10);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [visible, position, calculateOptimalPosition]);

  const showTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    const id = setTimeout(() => {
      setVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setVisible(false);
  };

  const handleClick = () => {
    hideTooltip();
  };

  return (
    <TooltipWrapper
      ref={wrapperRef}
      data-layout={preserveLayout ? "preserve" : undefined}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      onClick={handleClick}
    >
      {children}
      <TooltipContent 
        ref={tooltipRef}
        $visible={visible} 
        $position={actualPosition}
      >
        {content}
      </TooltipContent>
    </TooltipWrapper>
  );
};

export default Tooltip;
