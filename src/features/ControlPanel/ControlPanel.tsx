import React, { useEffect, useState } from "react";
import { filterConfigs, FilterConfig } from "@/configs";
import { setGLFilter, setMultiColorFilter, applyStreamSettings } from "@/services";
import { ControlPanelWrapper, AnimatedChipsContainer, AnimatedBottomBar } from "./ControlPanel.styles";
import Button from "@/components/Button";
import {
  Chips,
  ChipData,
  ChipControlPanel,
  ToleranceControl,
  SaturationControl,
  ValueControl,
  HueControl,
  PickerDropdown,
  PickerOption,
  StreamSettings,
  StreamSettingsState,
  ConfirmationModal,
} from "@/components";
import { Eyedropper, MonitorPlay, PictureInPicture, Plus, Minus, X } from "phosphor-react";
import { Toolbar, Picker } from "@/features";
import { RestartAlt } from "@mui/icons-material";
import { useTheme } from "styled-components";
import styled from "styled-components";

// Define picker modes
export type PickerMode = 'add' | 'remove' | null;

// Color swatch for showing which color is being deleted
const ColorSwatchContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  background: ${(props) => props.theme.colors.backgroundSecondary};
  margin: 8px 0;
`;

const ColorSwatch = styled.div<{ $color: string }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  border: 3px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
`;

const ColorInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const ColorLabel = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${(props) => props.theme.colors.textMuted};
`;

const ColorValue = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
  font-family: monospace;
`;

// PiP Button Component
const PiPButton: React.FC = () => {
  const theme = useTheme();
  
  // Capture the filtered canvas and create a video stream for PiP
  const handlePiP = async () => {
    try {
      // Find the WebGL canvas that contains the filtered video
      const canvas = document.getElementById('glcanvas') as HTMLCanvasElement;
      if (!canvas) {
        alert('Filtered video canvas not found.');
        return;
      }

      // Create a video element optimized for real-time streaming
      const video = document.createElement('video');
      video.style.display = 'none';
      video.muted = true;
      video.playsInline = true;
      
      // Ultra-low latency settings for maximum smoothness
      video.preload = 'none';
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      
      // Disable buffering and optimize for real-time
      video.controls = false;
      video.disablePictureInPicture = false;
      video.autoplay = true;
      
      // Set video properties for minimal latency and smooth playback
      Object.assign(video, {
        currentTime: 0,
        defaultPlaybackRate: 1.0,
        playbackRate: 1.0
      });
      
      // Add event listeners for smooth playback
      video.addEventListener('canplay', () => {
        // Ensure video starts playing immediately when ready
        if (video.duration && isFinite(video.duration) && video.duration > 0) {
          video.currentTime = video.duration;
        }
      });
      
      video.addEventListener('waiting', () => {
        // Skip buffering by jumping to live edge
        if (video.buffered.length > 0) {
          const bufferedEnd = video.buffered.end(video.buffered.length - 1);
          if (isFinite(bufferedEnd)) {
            video.currentTime = bufferedEnd;
          }
        }
      });
      
      document.body.appendChild(video);

      // Detect actual canvas update rate before starting stream
      let canvasUpdateRate = 30; // Default fallback
      const lastCanvasTime = performance.now();
      let canvasFrameCount = 0;
      
      const detectCanvasRate = () => {
        const now = performance.now();
        canvasFrameCount++;
        
        if (canvasFrameCount === 10) { // Sample 10 frames
          const elapsed = now - lastCanvasTime;
          if (elapsed > 0) {
            const detectedFPS = Math.round((canvasFrameCount / elapsed) * 1000);
            if (isFinite(detectedFPS) && detectedFPS > 0) {
              canvasUpdateRate = Math.min(30, Math.max(15, detectedFPS)); // Clamp between 15-30
              console.log(`Detected canvas update rate: ${canvasUpdateRate} FPS`);
            }
          }
          return; // Stop detection
        }
        
        requestAnimationFrame(detectCanvasRate);
      };
      
      // Start detection
      requestAnimationFrame(detectCanvasRate);
      
      // Wait briefly for detection, then proceed
      await new Promise(resolve => setTimeout(resolve, 200));

      // Use detected canvas update rate for optimal streaming
      const targetFPS = Math.min(canvasUpdateRate, Math.ceil(canvas.width * canvas.height / 100000));
      // Ensure targetFPS is finite and within reasonable bounds
      const safeFPS = isFinite(targetFPS) ? Math.max(10, Math.min(60, targetFPS)) : 30;
      const stream = canvas.captureStream(safeFPS);
      
      // Get video track and apply performance-optimized constraints
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        try {
          // Optimized constraints for smooth real-time streaming
          await videoTrack.applyConstraints({
            width: { ideal: canvas.width },
            height: { ideal: canvas.height },
            frameRate: { ideal: safeFPS, min: 15 }, // Allow dropping to 15fps if needed
            aspectRatio: { ideal: canvas.width / canvas.height }
          });
          
          // Set content hint for better encoding if supported (experimental feature)
          const trackWithHint = videoTrack as MediaStreamTrack & { contentHint?: string };
          if ('contentHint' in trackWithHint) {
            trackWithHint.contentHint = 'motion';
          }
          
          console.log('Video track configured:', videoTrack.getSettings());
        } catch {
          console.log('Advanced constraints not supported, using fallback');
          // Minimal fallback constraints
          try {
            await videoTrack.applyConstraints({
              frameRate: { ideal: 20, min: 10 }
            });
          } catch {
            // Use track as-is if constraints fail completely
          }
        }
      }
      
      video.srcObject = stream;
      
      // Start playing with optimized timing
      video.currentTime = 0;
      
      // Enter PiP mode with enhanced timing and error handling
      if ('requestPictureInPicture' in video) {
        // Wait for the video to be ready but don't wait too long
        const playPromise = video.play();
        
        // Use double-RAF for smoother timing coordination with browser rendering
        requestAnimationFrame(() => {
          requestAnimationFrame(async () => {
            try {
              await playPromise; // Ensure video is playing
              await video.requestPictureInPicture();
              
              // Optimize main canvas rendering by pausing it during PiP
              // setPiPActive(true);
              
              // Monitor and optimize PiP window performance
              let lastFrameTime = performance.now();
              let frameCount = 0;
              let dropCount = 0;
              
              const optimizePlayback = () => {
                const now = performance.now();
                const deltaTime = now - lastFrameTime;
                
                // Track frame timing for performance monitoring
                if (deltaTime > 0) {
                  frameCount++;
                  
                  // If frame rate drops below target, adjust quality
                  const actualFPS = 1000 / deltaTime;
                  if (isFinite(actualFPS) && actualFPS < safeFPS * 0.8) { // 20% tolerance
                    dropCount++;
                    
                    // Every 10 drops, try to reduce quality slightly
                    if (dropCount % 10 === 0 && videoTrack) {
                      try {
                        const newFPS = Math.max(15, Math.floor(actualFPS * 0.9));
                        if (isFinite(newFPS)) {
                          videoTrack.applyConstraints({
                            frameRate: { ideal: newFPS, min: 10 }
                          });
                        }
                      } catch {
                        // Ignore constraint errors
                      }
                    }
                  }
                  
                  // Log performance every 5 seconds
                  if (frameCount % (safeFPS * 5) === 0) {
                    console.log(`PiP Performance - FPS: ${actualFPS.toFixed(1)}, Drops: ${dropCount}`);
                  }
                }
                
                lastFrameTime = now;
                
                // Continue monitoring while PiP is active
                if (document.pictureInPictureElement === video) {
                  requestAnimationFrame(optimizePlayback);
                }
              };
              
              // Start performance monitoring
              requestAnimationFrame(optimizePlayback);
              
              // Set up cleanup with enhanced resource management
              const cleanup = () => {
                try {
                  // Resume main canvas rendering
                  // setPiPActive(false);
                  
                  // Stop all tracks to free resources immediately
                  stream.getTracks().forEach(track => {
                    track.stop();
                    console.log('Track stopped:', track.kind);
                  });
                  
                  // Remove video element
                  if (video.parentNode) {
                    video.pause();
                    video.srcObject = null;
                    document.body.removeChild(video);
                  }
                  
                  console.log('PiP cleanup completed');
                } catch (cleanupError) {
                  console.warn('Cleanup error:', cleanupError);
                }
              };
              
              // Listen for PiP exit
              video.addEventListener('leavepictureinpicture', cleanup, { once: true });
              
              // Also clean up if the video errors out
              video.addEventListener('error', cleanup, { once: true });
              
            } catch (pipError) {
              console.warn('Initial PiP failed, trying fallback approach:', pipError);
              
              // Enhanced fallback with metadata loading
              const onLoadedMetadata = async () => {
                try {
                  await video.requestPictureInPicture();
                  
                  // Optimize main canvas rendering by pausing it during PiP
                  // setPiPActive(true);
                  
                  const cleanup = () => {
                    // Resume main canvas rendering
                    // setPiPActive(false);
                    
                    stream.getTracks().forEach(track => track.stop());
                    if (video.parentNode) {
                      document.body.removeChild(video);
                    }
                  };
                  
                  video.addEventListener('leavepictureinpicture', cleanup, { once: true });
                } catch (fallbackError) {
                  console.error('Fallback PiP failed:', fallbackError);
                  stream.getTracks().forEach(track => track.stop());
                  if (video.parentNode) {
                    document.body.removeChild(video);
                  }
                }
              };
              
              video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
              await playPromise;
            }
          });
        });
      } else {
        alert('Picture-in-Picture is not supported in this browser.');
        document.body.removeChild(video);
      }

    } catch (error) {
      console.error('PiP error:', error);
      alert('Failed to enter Picture-in-Picture mode.');
    }
  };

  return (
    <Button
      onClick={handlePiP}
      icon={<PictureInPicture size={22} weight="duotone" />}
      iconColor={theme.colors.primary}
      size={48}
      aria-label="Picture-in-Picture"
      tooltip="Enter Picture-in-Picture mode"
    />
  );
};

export interface ControlPanelProps {
  activeIdx: number;
  setActiveIdx: React.Dispatch<React.SetStateAction<number>>;
  onSelectFilter: (
    filter: FilterConfig,
    idx: number,
    setActiveIdx: React.Dispatch<React.SetStateAction<number>>,
    setGLFilterFn: (cfg: FilterConfig) => Promise<void>
  ) => void;
  customHex: string;
  customSimilarity: number;
  setCustomSimilarity: React.Dispatch<React.SetStateAction<number>>;
  eyedropper: boolean;
  setEyedropper: React.Dispatch<React.SetStateAction<boolean>>;
  applyCustom: (hex: string) => void;
  onNewStream?: () => void;
  isWindowFocused: boolean;
  isAutoHideDisabled?: boolean;
  pickerMode?: PickerMode;
  setPickerMode?: React.Dispatch<React.SetStateAction<PickerMode>>;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  activeIdx,
  setActiveIdx,
  onSelectFilter,
  customHex,
  eyedropper,
  setEyedropper,
  applyCustom,
  onNewStream,
  isWindowFocused,
  isAutoHideDisabled = false,
  pickerMode: externalPickerMode,
  setPickerMode: externalSetPickerMode,
}) => {
  const theme = useTheme();
  const [hoveredColor, setHoveredColor] = useState<string>(customHex);
  const [hasPicked, setHasPicked] = useState(false);
  const [isHoveringCancelButton, setIsHoveringCancelButton] = useState(false);
  const [hidePickerTimeout, setHidePickerTimeout] = useState<NodeJS.Timeout | null>(null);

  // Auto-hide logic: hide UI when window loses focus, but only after first color is picked
  // Can be disabled via isAutoHideDisabled prop
  const shouldShowUI = !hasPicked || isWindowFocused || eyedropper || isAutoHideDisabled;

  // State for managing multiple color chips
  const [chips, setChips] = useState<ChipData[]>([]);
  const [editingChipId, setEditingChipId] = useState<string | null>(null);

  // State for stream display settings
  const [streamSettings, setStreamSettings] = useState<StreamSettingsState>({
    brightness: 0,
    contrast: 0,
    temperature: 0,
    gamma: 1.0,
  });

  // State for picker mode - use external state if provided, otherwise local state
  const [localPickerMode, setLocalPickerMode] = useState<PickerMode>(null);
  const pickerMode = externalPickerMode !== undefined ? externalPickerMode : localPickerMode;
  const setPickerMode = externalSetPickerMode || setLocalPickerMode;

  // Modal states for confirmations
  const [showResetModal, setShowResetModal] = useState(false);
  const [showChipDeleteModal, setShowChipDeleteModal] = useState(false);
  const [chipToDelete, setChipToDelete] = useState<string | null>(null);

  // Helper functions for smooth hover experience
  const handleCancelAreaEnter = () => {
    if (hidePickerTimeout) {
      clearTimeout(hidePickerTimeout);
      setHidePickerTimeout(null);
    }
    setIsHoveringCancelButton(true);
  };

  const handleCancelAreaLeave = () => {
    // Add a small delay before hiding the picker to prevent flickering
    const timeout = setTimeout(() => {
      setIsHoveringCancelButton(false);
    }, 100); // 100ms delay
    setHidePickerTimeout(timeout);
  };
  const getActiveChipData = (chipsArray: ChipData[]) => {
    return chipsArray
      .filter((chip) => chip.active)
      .map((chip) => ({
        color: chip.color,
        tolerance: chip.tolerance,
        saturation: chip.saturation,
        value: chip.value,
        hue: chip.hue,
        displayColor: chip.displayColor,
        mode: chip.mode,
      }));
  };

  const originalIdx = filterConfigs.findIndex((f) => f.id === "original");
  const customIdx = filterConfigs.findIndex((f) => f.id === "custom");
  const [lastFilterIdx, setLastFilterIdx] = useState<number>(activeIdx);

  // Initialize to original filter once
  useEffect(() => {
    if (originalIdx !== -1) {
      onSelectFilter(
        filterConfigs[originalIdx]!,
        originalIdx,
        setActiveIdx,
        setGLFilter
      );
    }
  }, [onSelectFilter, originalIdx, setActiveIdx]);

  // Reset to original when entering eyedropper mode (but not for remove mode)
  useEffect(() => {
    if (eyedropper && originalIdx !== -1 && pickerMode !== 'remove') {
      // Clear all filtering to show full spectrum for color picking
      // But keep the filtered stream visible for remove mode
      setMultiColorFilter([], 0);
      onSelectFilter(
        filterConfigs[originalIdx]!,
        originalIdx,
        setActiveIdx,
        setGLFilter
      );
    }
  }, [eyedropper, pickerMode, onSelectFilter, originalIdx, setActiveIdx]);

  // Restore multi-color filter when exiting eyedropper mode
  useEffect(() => {
    if (!eyedropper && activeIdx === customIdx && chips.length > 0) {
      const activeChipData = getActiveChipData(chips);
      setMultiColorFilter(activeChipData, 0);
    }
  }, [eyedropper, activeIdx, customIdx, chips]);

  // Apply stream settings when they change
  useEffect(() => {
    applyStreamSettings(streamSettings);
  }, [streamSettings]);

  // Track hover color when in eyedropper mode
  useEffect(() => {
    if (!eyedropper) {
      setHoveredColor(customHex);
      return;
    }
    const offscreen = document.createElement("canvas");
    const ctx = offscreen.getContext("2d")!;
    
    // Throttle mouse move events for better performance
    let lastUpdate = 0;
    const throttleDelay = 16; // ~60fps max

    function onMouseMove(e: MouseEvent) {
      const now = Date.now();
      if (now - lastUpdate < throttleDelay) {
        return; // Skip this update
      }
      lastUpdate = now;
      
      const canvasEl = document.getElementById("glcanvas") as HTMLCanvasElement;
      const rect = canvasEl.getBoundingClientRect();
      
      // Calculate mouse position relative to the canvas
      const x = Math.floor(
        ((e.clientX - rect.left) / rect.width) * canvasEl.width
      );
      const y = Math.floor(
        ((e.clientY - rect.top) / rect.height) * canvasEl.height
      );
      
      let sourceCanvas: HTMLCanvasElement | null = null;
      
      if (pickerMode === 'remove') {
        // For remove mode, sample from the filtered WebGL canvas
        sourceCanvas = document.getElementById("glcanvas") as HTMLCanvasElement;
      } else {
        // For add mode, sample from the original video
        const video = document.querySelector("video") as HTMLVideoElement;
        if (!video || video.readyState < 2) return;
        
        // Draw video to offscreen canvas for sampling
        offscreen.width = video.videoWidth;
        offscreen.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        // Calculate coordinates relative to video dimensions
        const videoX = Math.floor(
          ((e.clientX - rect.left) / rect.width) * offscreen.width
        );
        const videoY = Math.floor(
          ((e.clientY - rect.top) / rect.height) * offscreen.height
        );
        
        const [r, g, b] = ctx.getImageData(videoX, videoY, 1, 1).data;
        const hex =
          "#" +
          [r, g, b].map((v = 0) => v.toString(16).padStart(2, "0")).join("");
        setHoveredColor(hex);
        return;
      }
      
      // Sample from the filtered canvas (remove mode)
      if (sourceCanvas) {
        try {
          // Create a temporary 2D canvas to read from the WebGL canvas
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = sourceCanvas.width;
          tempCanvas.height = sourceCanvas.height;
          const tempCtx = tempCanvas.getContext('2d')!;
          
          // Draw the WebGL canvas to the temporary 2D canvas
          tempCtx.drawImage(sourceCanvas, 0, 0);
          
          // Ensure coordinates are within bounds
          const clampedX = Math.max(0, Math.min(sourceCanvas.width - 1, x));
          const clampedY = Math.max(0, Math.min(sourceCanvas.height - 1, y));
          
          // Sample the color from the temporary canvas
          const [r, g, b] = tempCtx.getImageData(clampedX, clampedY, 1, 1).data;
          
          // Only update if we got valid color data (not all zeros)
          if (r !== 0 || g !== 0 || b !== 0) {
            const hex =
              "#" +
              [r, g, b].map((v = 0) => v.toString(16).padStart(2, "0")).join("");
            setHoveredColor(hex);
          }
        } catch (error) {
          console.warn("Failed to sample color from filtered canvas:", error);
          // If sampling fails, don't change the color
        }
      }
    }

    document.addEventListener("mousemove", onMouseMove);
    return () => document.removeEventListener("mousemove", onMouseMove);
  }, [eyedropper, customHex, pickerMode]);

  // Cleanup timeout when component unmounts or eyedropper mode ends
  useEffect(() => {
    return () => {
      if (hidePickerTimeout) {
        clearTimeout(hidePickerTimeout);
      }
    };
  }, [hidePickerTimeout]);

  useEffect(() => {
    if (!eyedropper && hidePickerTimeout) {
      clearTimeout(hidePickerTimeout);
      setHidePickerTimeout(null);
      setIsHoveringCancelButton(false);
    }
  }, [eyedropper, hidePickerTimeout]);

  // Add color picker - single color
  const handleAddColor = () => {
    setLastFilterIdx(activeIdx);
    setMultiColorFilter([], 0);
    setPickerMode('add');
    setEyedropper(true);
  };


  // Remove color picker - samples from filtered stream
  const handleRemoveColorPicker = () => {
    if (chips.length === 0) return; // No colors to remove from
    setPickerMode('remove');
    // Don't clear the filter - keep the current filtered stream visible
    // so user can see exactly which colors they want to remove
    setEyedropper(true);
  };



  // Helper component for combined icons (eyedropper + action)
  const CombinedIcon: React.FC<{ actionIcon: React.ReactNode; color: string }> = ({ actionIcon, color }) => (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <Eyedropper size={18} color={color} weight="fill" />
      <div style={{ 
        position: 'absolute', 
        bottom: -2, 
        right: -2, 
        backgroundColor: 'white', 
        borderRadius: '50%', 
        width: 12, 
        height: 12, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        border: '1px solid #e5e7eb'
      }}>
        {actionIcon}
      </div>
    </div>
  );


  // Define picker options for dropdown
  const pickerOptions: PickerOption[] = [
    {
      id: 'add-color',
      label: 'Add Color',
      shortcut: 'E',
      icon: <CombinedIcon actionIcon={<Plus size={8} color={theme.colors.success} weight="bold" />} color={theme.colors.primary} />,
      action: handleAddColor,
      description: 'Pick a single color from the stream'
    },
    {
      id: 'remove-color-picker',
      label: 'Remove Color',
      shortcut: 'R',
      icon: <CombinedIcon actionIcon={<Minus size={8} color={chips.length > 0 ? theme.colors.error : theme.colors.textMuted} weight="bold" />} color={chips.length > 0 ? theme.colors.primary : theme.colors.textMuted} />,
      action: handleRemoveColorPicker,
      disabled: chips.length === 0,
      description: 'Pick exact colors from the filtered stream to exclude them'
    }
  ];

  // Utility function to convert hex to HSV
  const hexToHsv = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    let h = 0;
    if (diff !== 0) {
      if (max === r) h = ((g - b) / diff) % 6;
      else if (max === g) h = (b - r) / diff + 2;
      else h = (r - g) / diff + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;

    const s = Math.round((max === 0 ? 0 : diff / max) * 100);
    const v = Math.round(max * 100);

    return { h, s, v };
  };

  const handlePickColor = () => {
    // Convert picked color to HSV
    const hsv = hexToHsv(hoveredColor);
    
    // Determine the mode based on picker mode
    const chipMode = pickerMode === 'remove' ? 'exclude' : 'include';
    const defaultValues = getDefaultChipValues(chipMode);

    // Add new color as a chip
    const newChip: ChipData = {
      id: Date.now().toString(),
      color: hoveredColor,
      active: true,
      ...defaultValues,
      displayColor: hoveredColor, // Initially same as picked color
      mode: chipMode,
      hsv,
    };

    const updatedChips = [...chips, newChip];
    setChips(updatedChips);

    // Switch to custom mode
    if (customIdx !== -1) {
      onSelectFilter(
        filterConfigs[customIdx]!,
        customIdx,
        setActiveIdx,
        setGLFilter
      );
    }

    // Apply multi-color filter immediately
    const activeChipData = getActiveChipData(updatedChips);
    setMultiColorFilter(activeChipData, 0);

    // Automatically open the slider for the new chip
    setEditingChipId(newChip.id);

    applyCustom(hoveredColor);
    setHasPicked(true);
    setEyedropper(false);
    setPickerMode(null); // Reset picker mode after successful pick
    setIsHoveringCancelButton(false); // Reset hover state
    
    // Clear any pending timeout
    if (hidePickerTimeout) {
      clearTimeout(hidePickerTimeout);
      setHidePickerTimeout(null);
    }
  };

  // Effect to update WebGL filtering when chips change
  useEffect(() => {
    if (activeIdx === customIdx && chips.length > 0) {
      const activeChipData = getActiveChipData(chips);
      setMultiColorFilter(activeChipData, 0);
    }
  }, [chips, activeIdx, customIdx]);

  // Chip management functions
  const handleChipToggle = (id: string) => {
    setChips((prev) =>
      prev.map((chip) =>
        chip.id === id ? { ...chip, active: !chip.active } : chip
      )
    );
    
    // Update multi-color filter immediately
    const updatedChips = chips.map((chip) =>
      chip.id === id ? { ...chip, active: !chip.active } : chip
    );
    const activeChipData = getActiveChipData(updatedChips);
    setMultiColorFilter(activeChipData, 0);
  };

  const handleChipReset = (id: string) => {
    setChips((prev) =>
      prev.map((chip) =>
        chip.id === id ? { 
          ...chip, 
          ...getDefaultChipValues(chip.mode),
          displayColor: chip.color
        } : chip
      )
    );
  };

  const handleChipDelete = (id: string) => {
    setChipToDelete(id);
    setShowChipDeleteModal(true);
  };

  const handleChipDeleteDirect = (id: string) => {
    // Direct delete without modal - used when ColorSettings handles confirmation
    const updatedChips = chips.filter((chip) => chip.id !== id);
    setChips(updatedChips);

    if (editingChipId === id) {
      setEditingChipId(null);
    }

    // Update multi-color filter
    const activeChipData = getActiveChipData(updatedChips);
    setMultiColorFilter(activeChipData, 0);
  };

  const handleChipDeleteConfirm = () => {
    if (chipToDelete) {
      handleChipDeleteDirect(chipToDelete);
      setShowChipDeleteModal(false);
      setChipToDelete(null);
    }
  };

  const handleDisplayColorChange = (displayColor: string) => {
    if (editingChipId) {
      setChips((prev) =>
        prev.map((chip) =>
          chip.id === editingChipId ? { ...chip, displayColor } : chip
        )
      );
    }
  };

  const handleChipEdit = (id: string) => {
    setEditingChipId(editingChipId === id ? null : id);
  };

  const handleToleranceChange = (tolerance: number) => {
    if (editingChipId) {
      setChips((prev) =>
        prev.map((chip) =>
          chip.id === editingChipId ? { ...chip, tolerance } : chip
        )
      );
    }
  };

  const handleSaturationChange = (saturation: number) => {
    if (editingChipId) {
      setChips((prev) =>
        prev.map((chip) =>
          chip.id === editingChipId ? { ...chip, saturation } : chip
        )
      );
    }
  };

  const handleValueChange = (value: number) => {
    if (editingChipId) {
      setChips((prev) =>
        prev.map((chip) =>
          chip.id === editingChipId ? { ...chip, value } : chip
        )
      );
    }
  };

  const handleHueChange = (hue: number) => {
    if (editingChipId) {
      setChips((prev) =>
        prev.map((chip) =>
          chip.id === editingChipId ? { ...chip, hue } : chip
        )
      );
    }
  };

  // Helper function to get default values based on chip mode
  const getDefaultChipValues = (mode: 'include' | 'exclude') => ({
    tolerance: mode === 'exclude' ? 0.02 : 0.05,
    saturation: mode === 'exclude' ? 0.05 : 0.4,
    value: mode === 'exclude' ? 0.05 : 0.3,
    hue: mode === 'exclude' ? 2 : 15,
  });

  // Individual reset functions for color settings
  const handleToleranceReset = () => {
    if (!editingChipId) return;
    const editingChip = chips.find(chip => chip.id === editingChipId);
    if (!editingChip) return;
    const defaultValue = getDefaultChipValues(editingChip.mode).tolerance;
    handleToleranceChange(defaultValue);
  };

  const handleSaturationReset = () => {
    if (!editingChipId) return;
    const editingChip = chips.find(chip => chip.id === editingChipId);
    if (!editingChip) return;
    const defaultValue = getDefaultChipValues(editingChip.mode).saturation;
    handleSaturationChange(defaultValue);
  };

  const handleValueReset = () => {
    if (!editingChipId) return;
    const editingChip = chips.find(chip => chip.id === editingChipId);
    if (!editingChip) return;
    const defaultValue = getDefaultChipValues(editingChip.mode).value;
    handleValueChange(defaultValue);
  };

  const handleHueReset = () => {
    if (!editingChipId) return;
    const editingChip = chips.find(chip => chip.id === editingChipId);
    if (!editingChip) return;
    const defaultValue = getDefaultChipValues(editingChip.mode).hue;
    handleHueChange(defaultValue);
  };

  const handleEscape = () => {
    // Clear any pending timeout
    if (hidePickerTimeout) {
      clearTimeout(hidePickerTimeout);
      setHidePickerTimeout(null);
    }
    
    if (lastFilterIdx === customIdx) {
      applyCustom(customHex);
      // Restore multi-color filter if we have chips
      if (chips.length > 0) {
        const activeChipData = getActiveChipData(chips);
        setMultiColorFilter(activeChipData, 0);
      }
    } else if (originalIdx !== -1) {
      onSelectFilter(
        filterConfigs[originalIdx]!,
        originalIdx,
        setActiveIdx,
        setGLFilter
      );
    }
    setEyedropper(false);
    setPickerMode(null); // Reset picker mode
    setIsHoveringCancelButton(false); // Reset hover state
  };

  const handleReset = () => {
    setShowResetModal(true);
  };

  const handleResetConfirm = () => {
    // Clear any pending timeout
    if (hidePickerTimeout) {
      clearTimeout(hidePickerTimeout);
      setHidePickerTimeout(null);
    }
    
    if (originalIdx !== -1) {
      onSelectFilter(
        filterConfigs[originalIdx]!,
        originalIdx,
        setActiveIdx,
        setGLFilter
      );
    }
    setHasPicked(false);
    setEyedropper(false);
    setPickerMode(null); // Reset picker mode
    setIsHoveringCancelButton(false); // Reset hover state
    setChips([]); // Clear all chips
    setEditingChipId(null);
    // Reset multi-color filter to show full spectrum
    setMultiColorFilter([], 0);
  };

  return (
    <>
      {/* Show picker when in eyedropper mode but not when hovering over cancel button */}
      {eyedropper && !isHoveringCancelButton && (
        <Picker
          size={140}
          borderWidth={6}
          color={hoveredColor}
          onPositionChange={() => {}}
          onEscape={handleEscape}
          onPick={handlePickColor}
          sourceMode={pickerMode === 'remove' ? 'filtered' : 'video'}
        />
      )}

      {/* Show cancel button when in eyedropper mode, otherwise show full control panel */}
      {eyedropper ? (
        <ControlPanelWrapper 
          $isVisible={true}
        >
          <Toolbar>
            <Toolbar.Left>
              {/* Empty left section when in eyedropper mode */}
            </Toolbar.Left>
            <Toolbar.Center>
              {/* Cancel button in center when in eyedropper mode */}
              {/* Use a wrapper with larger hover area but no visual padding */}
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  // Create larger hover area with invisible padding
                  padding: '12px',
                  margin: '-12px', // Negative margin to cancel out padding visually
                }}
                onMouseEnter={handleCancelAreaEnter}
                onMouseLeave={handleCancelAreaLeave}
              >
                <Button
                  bgColor="#fff"
                  size={48}
                  icon={<X size={24} />}
                  onClick={handleEscape}
                  aria-label="Cancel color picking"
                  iconColor={theme.colors.error}
                  tooltip="Cancel color picking (ESC)"
                />
              </div>
            </Toolbar.Center>
            <Toolbar.Right>
              {/* Empty right section when in eyedropper mode */}
            </Toolbar.Right>
          </Toolbar>
        </ControlPanelWrapper>
      ) : (
        <ControlPanelWrapper $isVisible={shouldShowUI}>
          <Toolbar>
            <Toolbar.Left>
              {onNewStream && (
                <Button
                bgColor="#fff"
                size={48}
                icon={<MonitorPlay size={24} />}
                onClick={onNewStream}
                aria-label="Start new stream"
                iconColor={theme.colors.primary}
                tooltip="Start new stream"
                />
              )}
              <PiPButton />
            </Toolbar.Left>
            <Toolbar.Center>
              {/* Picker dropdown with multiple options */}
              <PickerDropdown 
                options={pickerOptions}
                hasPicked={hasPicked}
              />
            </Toolbar.Center>
            <Toolbar.Right>
              <StreamSettings
                settings={streamSettings}
                onSettingsChange={setStreamSettings}
              />
              <Button
                bgColor="#fff"
                size={48}
                icon={<RestartAlt fontSize="medium" />}
                onClick={hasPicked ? handleReset : undefined}
                aria-label="Reset filter to original"
                iconColor={hasPicked ? theme.colors.primary : theme.colors.textMuted}
                tooltip={hasPicked ? "Reset all colors and filters" : "Pick a color first to enable reset"}
                disabled={!hasPicked}
              />
            </Toolbar.Right>
          </Toolbar>

          {/* Chips component for managing multiple colors */}
          <AnimatedChipsContainer $isVisible={shouldShowUI}>
            <Chips
              chips={chips}
              onChipRemove={handleChipDelete}
              onChipEdit={handleChipEdit}
              onToggleVisibility={handleChipToggle}
              editingId={editingChipId}
            />
          </AnimatedChipsContainer>

          <AnimatedBottomBar $isVisible={shouldShowUI}>
            {/* Individual chip tolerance slider when editing */}
            {editingChipId &&
              (() => {
                const editingChip = chips.find(
                  (chip) => chip.id === editingChipId
                );
                return editingChip ? (
                  <ChipControlPanel
                    color={editingChip.color}
                    displayColor={editingChip.displayColor}
                    onClose={() => {
                      setEditingChipId(null);
                      // Just close the panel, keep the chip active
                    }}
                    onToggleVisibility={() => handleChipToggle(editingChip.id)}
                    onReset={() => handleChipReset(editingChip.id)}
                    onDelete={() => handleChipDeleteDirect(editingChip.id)}
                    onDisplayColorChange={handleDisplayColorChange}
                    isVisible={editingChip.active}
                  >
                    {editingChip.mode === 'exclude' ? (
                      // For exclude mode (remove colors), show only similarity slider
                      // Works like chroma key - controls how similar colors need to be to be removed
                      <ToleranceControl
                        color={editingChip.color}
                        value={editingChip.tolerance}
                        onChange={handleToleranceChange}
                        label="Similarity"
                        min={0.001}
                        max={0.1}
                        step={0.001}
                        defaultValue={0.02}
                        onReset={handleToleranceReset}
                      />
                    ) : (
                      // For include mode (add colors), show all controls
                      <>
                        <ToleranceControl
                          color={editingChip.color}
                          value={editingChip.tolerance}
                          onChange={handleToleranceChange}
                          label="Tolerance"
                          defaultValue={0.05}
                          onReset={handleToleranceReset}
                        />
                        <SaturationControl
                          color={editingChip.color}
                          value={editingChip.saturation}
                          onChange={handleSaturationChange}
                          label="Saturation"
                          defaultValue={0.4}
                          onReset={handleSaturationReset}
                        />
                        <ValueControl
                          color={editingChip.color}
                          value={editingChip.value}
                          onChange={handleValueChange}
                          label="Value"
                          defaultValue={0.3}
                          onReset={handleValueReset}
                        />
                        <HueControl
                          color={editingChip.color}
                          value={editingChip.hue}
                          onChange={handleHueChange}
                          label="Hue"
                          defaultValue={15}
                          onReset={handleHueReset}
                        />
                      </>
                    )}
                  </ChipControlPanel>
                ) : null;
              })()}
          </AnimatedBottomBar>
        </ControlPanelWrapper>
      )}
      
      {/* Reset All Colors Confirmation Modal */}
      <ConfirmationModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleResetConfirm}
        title="Reset All Colors"
        message="Are you sure you want to reset all colors and filters? This will clear all selected colors and return to the original filter. This action cannot be undone."
        confirmText="Reset All"
        cancelText="Cancel"
        variant="warning"
        color="#F59E0B"
      />
      
      {/* Delete Chip Confirmation Modal */}
      <ConfirmationModal
        isOpen={showChipDeleteModal}
        onClose={() => {
          setShowChipDeleteModal(false);
          setChipToDelete(null);
        }}
        onConfirm={handleChipDeleteConfirm}
        title="Delete Color"
        message="Are you sure you want to delete this color from the filter? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        color="#dc2626"
        customContent={
          chipToDelete ? (
            <ColorSwatchContainer>
              <ColorSwatch $color={chips.find(c => c.id === chipToDelete)?.color || '#000000'} />
              <ColorInfo>
                <ColorLabel>Color to delete:</ColorLabel>
                <ColorValue>{chips.find(c => c.id === chipToDelete)?.color || 'Unknown'}</ColorValue>
              </ColorInfo>
            </ColorSwatchContainer>
          ) : null
        }
      />
    </>
  );
};

export default ControlPanel;
