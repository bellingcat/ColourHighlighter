import React, { useEffect, useRef, useState, useCallback } from "react";
import styled, { createGlobalStyle } from "styled-components";
import Tooltip from "@/components/Tooltip";

/**
 * Color Picker with Dynamic Zoom Magnifier
 * 
 * This component provides a circular magnifier that follows the mouse cursor
 * and displays a zoomed-in view of the video stream underneath.
 * 
 * ZOOM SYSTEM:
 * - Scroll wheel changes picker size and zoom level dynamically
 * - Larger picker size = higher zoom level (more magnification)
 * - Smaller picker size = lower zoom level (less magnification)
 * - Zoom levels are easily configurable via minZoom/maxZoom constants
 * - Uses quadratic easing for smooth zoom progression
 * 
 * CONFIGURATION:
 * - Adjust minSize/maxSize for picker size range
 * - Adjust minZoom/maxZoom for zoom level range
 * - Modify baseArea division factor for capture area scaling
 * 
 * Props for the ColorPicker:
 * - size: diameter in pixels (base size)
 * - borderWidth: width of the circular border
 * - color: current border (and pixel) color
 * - onPositionChange: callback receiving cursor x,y
 * - onEscape: callback when Escape key is pressed to toggle fallback
 * - onPick: callback when user confirms a pick (e.g., click)
 */
export interface PickerProps {
  size?: number;
  borderWidth?: number;
  color?: string;
  onPositionChange?: (x: number, y: number) => void;
  onEscape?: () => void;
  onPick?: () => void;
  sourceMode?: 'video' | 'filtered'; // New prop to specify source
}

// Hide the native cursor
export const GlobalStyle = createGlobalStyle`
  body {
    cursor: none;
  }
`;

// Track the last mouse position globally so we can initialize picker at the correct spot
let lastMouseX = 0;
let lastMouseY = 0;
if (typeof window !== "undefined") {
  lastMouseX = window.innerWidth / 2;
  lastMouseY = window.innerHeight / 2;
  window.addEventListener(
    "mousemove",
    (e: MouseEvent) => {
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    },
    { passive: true }
  );
}

// Main picker container
const PickerWrapper = styled.div<{
  $size: number;
  $borderWidth: number;
  $color: string;
}>`
  position: fixed;
  width: ${(props) => props.$size}px;
  height: ${(props) => props.$size}px;
  border: ${(props) => props.$borderWidth}px solid ${(props) => props.$color};
  border-radius: 50%;
  pointer-events: none;
  background: #000;
  will-change: transform;
  z-index: 9999;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  transform: translate3d(0, 0, 0); /* Hardware acceleration */
  backface-visibility: hidden; /* Prevent flickering */
`;

// Canvas for the magnified view
const MagnifierCanvas = styled.canvas`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  image-rendering: -webkit-optimize-contrast; /* Better image quality */
  image-rendering: crisp-edges;
`;

// Center crosshair/square for precise picking
const CenterSquare = styled.div<{ $color: string }>`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 4px;
  transform: translate(-50%, -50%);
  border: 1px solid #fff;
  background: transparent;
  pointer-events: auto;
  cursor: none;
  z-index: 10001;
  
  &:hover {
    transform: translate(-50%, -50%) scale(1.2);
  }
  
  &:active {
    transform: translate(-50%, -50%) scale(0.9);
  }
`;

// Info overlay showing zoom level
const ZoomInfo = styled.div`
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-weight: 500;
  white-space: nowrap;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  pointer-events: none;
`;

// Close button for canceling the picker
const CloseButton = styled.button`
  position: absolute;
  top: -12px;
  right: -12px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  color: #000;
  z-index: 10002;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  
  &:hover {
    background: rgba(255, 255, 255, 1);
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const Picker: React.FC<PickerProps> = ({
  size = 120,
  borderWidth = 8,
  color = "#000",
  onPositionChange,
  onEscape,
  onPick,
  sourceMode = 'video',
}) => {
  const pickerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentSize, setCurrentSize] = useState(size);
  const [mousePos, setMousePos] = useState({ x: lastMouseX, y: lastMouseY });
  const updateRequestRef = useRef<number | null>(null);
  
  // SIZE CONFIGURATION - Easy to adjust!
  const minSize = size * 0.8; // Smaller minimum size (80% of base)
  const maxSize = size * 3.0; // Larger maximum size (300% of base)
  
  // ZOOM CONFIGURATION - Easy to adjust!
  const minZoom = 1.5; // Minimum zoom level (when picker is smallest)
  const maxZoom = 1.5; // Maximum zoom level (when picker is largest)
  
  // Calculate current zoom level based on picker size using smooth curve
  const sizeRatio = (currentSize - minSize) / (maxSize - minSize); // 0 to 1
  // Use easing function for smoother zoom progression
  const easedRatio = sizeRatio * sizeRatio; // Quadratic easing for more natural feel
  const currentZoom = minZoom + (maxZoom - minZoom) * easedRatio;

  // Function to update the magnified view
  const updateMagnifier = useCallback(() => {
    const canvas = canvasRef.current;
    
    if (!canvas) return;
    
    // Choose source based on sourceMode prop
    let sourceElement: HTMLVideoElement | HTMLCanvasElement | null = null;
    
    if (sourceMode === 'filtered') {
      // Use the filtered WebGL canvas for remove mode
      sourceElement = document.getElementById("glcanvas") as HTMLCanvasElement;
    } else {
      // Use the original video stream for add mode
      let video = document.querySelector("video") as HTMLVideoElement;
      if (!video) {
        const videos = document.getElementsByTagName("video");
        if (videos.length > 0) {
          video = videos[0] as HTMLVideoElement;
        }
      }
      sourceElement = video;
    }
    
    if (!sourceElement) return;
    
    // Make sure source is ready and has content
    if (sourceElement instanceof HTMLVideoElement) {
      if (sourceElement.readyState < 1 || sourceElement.videoWidth === 0 || sourceElement.videoHeight === 0) {
        return;
      }
    } else if (sourceElement instanceof HTMLCanvasElement) {
      if (sourceElement.width === 0 || sourceElement.height === 0) {
        return;
      }
    }
    
    const ctx = canvas.getContext("2d")!;
    
    // Enable smooth image scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Calculate coordinates relative to the appropriate canvas viewport
    // When in filtered mode, use the filtered canvas; otherwise use the GL canvas
    let referenceCanvas: HTMLCanvasElement | null = null;
    
    if (sourceMode === 'filtered') {
      referenceCanvas = document.getElementById("glcanvas") as HTMLCanvasElement;
    } else {
      referenceCanvas = document.getElementById("glcanvas") as HTMLCanvasElement;
    }
    
    if (!referenceCanvas) return;
    
    // Set canvas size to match the picker
    canvas.width = currentSize;
    canvas.height = currentSize;
    
    const rect = referenceCanvas.getBoundingClientRect();
    const relativeX = (mousePos.x - rect.left) / rect.width;
    const relativeY = (mousePos.y - rect.top) / rect.height;
    
    // Ensure coordinates are within bounds
    const clampedX = Math.max(0, Math.min(1, relativeX));
    const clampedY = Math.max(0, Math.min(1, relativeY));
    
    // Calculate the size of the area to capture from source
    // Higher zoom means smaller capture area (more magnified view)
    // The capture area should be inversely proportional to the zoom level
    // As picker size increases → currentZoom increases → captureSize decreases → more magnification
    const sourceWidth = sourceElement instanceof HTMLVideoElement ? sourceElement.videoWidth : sourceElement.width;
    const sourceHeight = sourceElement instanceof HTMLVideoElement ? sourceElement.videoHeight : sourceElement.height;
    
    const baseArea = Math.min(sourceWidth, sourceHeight) / 8; // Base reference area
    const captureSize = baseArea / currentZoom;
    
    // Calculate source coordinates on the source element
    const sourceX = clampedX * sourceWidth;
    const sourceY = clampedY * sourceHeight;
    const cropX = Math.max(0, Math.min(sourceWidth - captureSize, sourceX - captureSize / 2));
    const cropY = Math.max(0, Math.min(sourceHeight - captureSize, sourceY - captureSize / 2));
    
    // Clear canvas with dark background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Create circular clipping path
    ctx.save();
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, (canvas.width - borderWidth * 2) / 2, 0, Math.PI * 2);
    ctx.clip();
    
    try {
      // Draw the magnified portion from the source element
      ctx.drawImage(
        sourceElement,
        cropX,
        cropY,
        captureSize,
        captureSize,
        borderWidth,
        borderWidth,
        canvas.width - borderWidth * 2,
        canvas.height - borderWidth * 2
      );
    } catch (error) {
      // If there's an error, draw a placeholder
      ctx.fillStyle = "#333";
      ctx.fillRect(borderWidth, borderWidth, canvas.width - borderWidth * 2, canvas.height - borderWidth * 2);
      ctx.fillStyle = "#888";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Loading...", canvas.width / 2, canvas.height / 2);
      console.warn("Failed to draw source to magnifier:", error);
    }
    
    ctx.restore();
  }, [mousePos, borderWidth, currentZoom, sourceMode, currentSize]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      
      // Update picker position immediately with CSS transform for smooth movement
      if (pickerRef.current) {
        pickerRef.current.style.transform = `translate3d(${x - currentSize / 2}px, ${
          y - currentSize / 2
        }px, 0)`;
      }
      
      // Throttle state updates to reduce re-renders
      if (updateRequestRef.current) {
        cancelAnimationFrame(updateRequestRef.current);
      }
      
      updateRequestRef.current = requestAnimationFrame(() => {
        setMousePos({ x, y });
        updateRequestRef.current = null;
      });
      
      onPositionChange?.(x, y);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      // More responsive wheel handling with logarithmic scaling
      const direction = e.deltaY > 0 ? -1 : 1;
      const baseIncrement = 8; // Base pixel increment
      const currentRatio = (currentSize - minSize) / (maxSize - minSize);
      // Scale increment based on current size for better feel
      const scaledIncrement = baseIncrement * (1 + currentRatio * 0.5);
      
      setCurrentSize(prev => {
        const newSize = prev + (direction * scaledIncrement);
        return Math.max(minSize, Math.min(maxSize, newSize));
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onEscape?.();
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);

    // Initialize at the last cursor position
    handleMouseMove({ clientX: lastMouseX, clientY: lastMouseY } as MouseEvent);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
      
      // Clean up any pending animation frame
      if (updateRequestRef.current) {
        cancelAnimationFrame(updateRequestRef.current);
      }
    };
  }, [currentSize, onPositionChange, onEscape, minSize, maxSize]);

  // Update magnifier view regularly
  useEffect(() => {
    // Initial update
    updateMagnifier();
    
    // Use reduced frequency for better performance
    const intervalId = setInterval(() => {
      updateMagnifier();
    }, 50); // Update every 50ms (20fps) instead of every frame
    
    return () => {
      clearInterval(intervalId);
    };
  }, [updateMagnifier]);

  // Also trigger update when size changes
  useEffect(() => {
    updateMagnifier();
  }, [currentSize, updateMagnifier]);

  const handleClick = () => {
    onPick?.();
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering other click handlers
    onEscape?.();
  };

  return (
    <>
      <GlobalStyle />
      <PickerWrapper
        ref={pickerRef}
        $size={currentSize}
        $borderWidth={borderWidth}
        $color={color}
      >
        <MagnifierCanvas ref={canvasRef} />
        <CenterSquare $color={color} onClick={handleClick} />
        <Tooltip content="Cancel (ESC)" position="left">
          <CloseButton onClick={handleClose}>
            ×
          </CloseButton>
        </Tooltip>
        <ZoomInfo>
          {currentZoom.toFixed(1)}x zoom • {Math.round(currentSize)}px • scroll to adjust
        </ZoomInfo>
      </PickerWrapper>
    </>
  );
};

export default Picker;
