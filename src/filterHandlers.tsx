// src/filterHandlers.tsx

import type { RefObject, Dispatch, SetStateAction } from "react";
import {
  setupWebGL,       // Sets up the WebGL context, shaders, and textures
  renderLoop,       // The main animation loop to draw frames
  stopRenderLoop,   // Stops animation when not needed
  currentFilterRef, // Ref holding the current filter config
  animationIdRef,   // Ref holding the current requestAnimationFrame ID
} from "./webgl";
import { debounce } from "./utils";
import type { FilterConfig } from "./configs";  // <-- fixed path

/** 
 * Params required to start screen capture and WebGL:
 * - videoRef: ref to the <video> element (may be null until mounted)
 * - canvasRef: ref to the <canvas> element (may be null until mounted)
 * - setShowWelcome / setShowPanel: React state setters for UI
 */
interface CaptureParams {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  setShowWelcome: Dispatch<SetStateAction<boolean>>;
  setShowPanel: Dispatch<SetStateAction<boolean>>;
}

/**
 * Starts the screen-capture process and sets up WebGL rendering.
 * Called when the user clicks "Start Capture".
 */
export const handleStartCapture = async ({
  videoRef,
  canvasRef,
  setShowWelcome,
  setShowPanel,
}: CaptureParams): Promise<void> => {
  // Hide welcome & show panel optimistically
  setShowWelcome(false);
  setShowPanel(true);

  const video = videoRef.current;
  if (!video) return;

  let stream: MediaStream;
  try {
    // Ask for screen‐share; may throw if user cancels or denies
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: { ideal: 60, max: 60 } },
    });
  } catch (err) {
    console.warn("Screen capture was cancelled or denied", err);
    // Revert UI back to welcome state
    setShowWelcome(true);
    setShowPanel(false);
    return;
  }

  // If we got here, user granted. Attach and start WebGL render loop.
  video.srcObject = stream;
  const startWebGL = async () => {
    await setupWebGL();
    if (animationIdRef.current != null) {
      cancelAnimationFrame(animationIdRef.current);
    }
    renderLoop();
  };

  video.onloadedmetadata = () => {
    video.play();
    startWebGL();
    video.onloadedmetadata = null;
  };

  stream.getVideoTracks()[0].addEventListener("ended", () => {
    setShowWelcome(true);
    setShowPanel(false);
    stopRenderLoop();
  });

  if (video.readyState >= 1) {
    video.play();
    await startWebGL();
  }
};


/**
 * Handles selecting a filter:
 * - Debounced to prevent rapid re-initialization
 * - Updates UI state (active index) and WebGL uniforms
 */
export const onSelectFilter = debounce(
  async (
    filter: FilterConfig,
    idx: number,
    setActiveIdx: Dispatch<SetStateAction<number>>,
    setGLFilterFn: (cfg: FilterConfig) => Promise<void>
  ) => {
    // Clone to avoid mutating the original config
    currentFilterRef.current = JSON.parse(JSON.stringify(filter));
    setActiveIdx(idx);           // Highlight the selected filter
    await setGLFilterFn(filter); // Apply it in WebGL
  },
  20  // debounce delay in ms
);
