import type { RefObject, Dispatch, SetStateAction } from "react";
import {
  setupWebGL,
  startSmoothRenderLoop,
  stopRenderLoop,
  currentFilterRef,
  animationIdRef,
} from "@/services";
import { debounce } from "@/utils";
import type { FilterConfig } from "@/configs";

// Params needed to start capturing screen video
interface CaptureParams {
  videoRef: RefObject<HTMLVideoElement|null>;
  setShowWelcome: Dispatch<SetStateAction<boolean>>; // hide/show UI
  setShowPanel: Dispatch<SetStateAction<boolean>>;   // hide/show UI
}

// Called when the user clicks "Start Capture"
export const handleStartCapture = async ({
  videoRef,
  setShowWelcome,
  setShowPanel,
}: CaptureParams): Promise<void> => {
  setShowWelcome(false);  // hide welcome overlay
  setShowPanel(true);     // show filter panel

  const video = videoRef.current;
  if (!video) return;

  try {
    // Ask user to share their screen at up to 60fps
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { ideal:60, max:60 }}});
    video.srcObject = stream;

    // Track stream health and recover if needed
    let lastWidth = 0;
    let lastHeight = 0;
    let streamHealthCheck: NodeJS.Timeout;

    const checkStreamHealth = () => {
      if (!video.videoWidth || !video.videoHeight) {
        console.warn('Stream lost dimensions, attempting recovery...');
        // Try to restart the video
        if (video.srcObject === stream) {
          video.load();
          video.play().catch(err => console.warn('Recovery play failed:', err));
        }
        return;
      }

      // Check if dimensions changed significantly (window resize)
      if (video.videoWidth !== lastWidth || video.videoHeight !== lastHeight) {
        lastWidth = video.videoWidth;
        lastHeight = video.videoHeight;
        console.log(`Stream dimensions changed: ${lastWidth}x${lastHeight}`);
        
        // Trigger canvas update after a brief delay to let things settle
        setTimeout(() => {
          if (video.videoWidth && video.videoHeight) {
            const event = new Event('resize');
            window.dispatchEvent(event);
          }
        }, 100);
      }
    };

    // When metadata loads (video dimensions known), start WebGL
    video.onloadedmetadata = () => {
      video.play();       // start the hidden video
      lastWidth = video.videoWidth;
      lastHeight = video.videoHeight;
      
      setupWebGL()         // prepare shaders, textures, etc.
        .then(() => {
          if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
          startSmoothRenderLoop();      // start drawing frames in a loop with optimization
          
          // Start monitoring stream health
          streamHealthCheck = setInterval(checkStreamHealth, 200);
        });
      video.onloadedmetadata = null;
    };

    // Add more robust error handling
    video.onerror = (e) => {
      console.error('Video error:', e);
      if (streamHealthCheck) clearInterval(streamHealthCheck);
    };

    video.onended = () => {
      console.log('Video ended');
      if (streamHealthCheck) clearInterval(streamHealthCheck);
    };

    // If the user stops sharing, reset UI and stop rendering
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.addEventListener("ended", () => {
        setShowWelcome(true);
        setShowPanel(false);
        stopRenderLoop();
        if (streamHealthCheck) clearInterval(streamHealthCheck);
      });
    }

    // If video already ready, skip waiting
    if (video.readyState >= 1) {
      video.play();
      lastWidth = video.videoWidth;
      lastHeight = video.videoHeight;
      await setupWebGL();
      startSmoothRenderLoop();
      streamHealthCheck = setInterval(checkStreamHealth, 200);
    }
  } catch (err) {
    console.warn("Screen capture failed or cancelled", err);
    setShowWelcome(true);
    setShowPanel(false);
  }
};

// Called when the user wants to start a new stream (preserving existing UI)
export const handleNewStream = async ({
  videoRef,
}: {
  videoRef: RefObject<HTMLVideoElement|null>;
}): Promise<void> => {
  const video = videoRef.current;
  if (!video) return;

  try {
    // Ask user to share their screen at up to 60fps
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { ideal:60, max:60 }}});
    video.srcObject = stream;

    // Track stream health and recover if needed
    let lastWidth = 0;
    let lastHeight = 0;
    let streamHealthCheck: NodeJS.Timeout;

    const checkStreamHealth = () => {
      if (!video.videoWidth || !video.videoHeight) {
        console.warn('Stream lost dimensions, attempting recovery...');
        // Try to restart the video
        if (video.srcObject === stream) {
          video.load();
          video.play().catch(err => console.warn('Recovery play failed:', err));
        }
        return;
      }

      // Check if dimensions changed significantly (window resize)
      if (video.videoWidth !== lastWidth || video.videoHeight !== lastHeight) {
        lastWidth = video.videoWidth;
        lastHeight = video.videoHeight;
        console.log(`Stream dimensions changed: ${lastWidth}x${lastHeight}`);
        
        // Trigger canvas update after a brief delay to let things settle
        setTimeout(() => {
          if (video.videoWidth && video.videoHeight) {
            const event = new Event('resize');
            window.dispatchEvent(event);
          }
        }, 100);
      }
    };

    // When metadata loads (video dimensions known), start WebGL
    video.onloadedmetadata = () => {
      video.play();       // start the hidden video
      lastWidth = video.videoWidth;
      lastHeight = video.videoHeight;
      
      setupWebGL()         // prepare shaders, textures, etc.
        .then(() => {
          if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
          startSmoothRenderLoop();      // start drawing frames in a loop with optimization
          
          // Start monitoring stream health
          streamHealthCheck = setInterval(checkStreamHealth, 200);
        });
      video.onloadedmetadata = null;
    };

    // Add more robust error handling
    video.onerror = (e) => {
      console.error('Video error:', e);
      if (streamHealthCheck) clearInterval(streamHealthCheck);
    };

    video.onended = () => {
      console.log('Video ended');
      if (streamHealthCheck) clearInterval(streamHealthCheck);
    };

    // If the user stops sharing, clean up but don't change UI
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.addEventListener("ended", () => {
        stopRenderLoop();
        if (streamHealthCheck) clearInterval(streamHealthCheck);
      });
    }

    // If video already ready, skip waiting
    if (video.readyState >= 1) {
      video.play();
      lastWidth = video.videoWidth;
      lastHeight = video.videoHeight;
      await setupWebGL();
      startSmoothRenderLoop();
      streamHealthCheck = setInterval(checkStreamHealth, 200);
    }
  } catch (err) {
    console.warn("New stream cancelled or failed", err);
    // Don't change UI state - just silently fail
  }
};

// Called when the user chooses a different filter from the UI
export const onSelectFilter = debounce(
  async (
    filter: FilterConfig,
    idx: number,
    setActiveIdx: Dispatch<SetStateAction<number>>,
    setGLFilterFn: (cfg: FilterConfig) => Promise<void>
  ) => {
    // a) Remember the new filter settings
    currentFilterRef.current = JSON.parse(JSON.stringify(filter));
    // b) Update which button is highlighted
    setActiveIdx(idx);
    // c) Tell WebGL to switch uniforms to this filter
    await setGLFilterFn(filter);
  },
  20 // wait 20ms to avoid doing this too often
);