// page.tsx

"use client"; // Next.js directive: ensures this page is rendered on the client side
import styled from "styled-components"; // Styled-components for CSS-in-JS styling
import { FC, useRef, useEffect, useState, useCallback } from "react"; // React core: component type and hooks
import { LandingPage, ControlPanel } from "@/features"; // Feature-specific UI panels
import { PickerMode } from "@/features/ControlPanel/ControlPanel"; // Import picker mode type

import {
  setupWebGL,
  startSmoothRenderLoop,
  setGLFilter,
  currentFilterRef,
} from "@/services/webgl"; // Helper functions & refs managing WebGL filters and capture
import { filterConfigs, FilterConfig } from "@/configs"; // Predefined filter settings and their types
import { hexToRgb } from "@/utils"; // Utility to convert color hex to RGB
import { handleStartCapture, handleNewStream as startNewStream, onSelectFilter } from "@/services";

// Styled components for the main layout and canvas
const Container = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  background: ${(props) => props.theme.colors.backgroundSecondary};
  transition: background-color 0.3s ease;
`;

const GlCanvas = styled.canvas`
  flex: 1;
  display: block;
  width: 100%;
  height: 100%;
  z-index: 10;
  inset: 0;
`;

// Define our main page as a React Functional Component (FC)
const HomePage: FC = () => {
  // === UI state ===
  const [showPanel, setShowPanel] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);

  // === Window focus state for auto-hide functionality ===
  const [isWindowFocused, setIsWindowFocused] = useState(true);

  // === Custom-color state ===
  const [customHex, setCustomHex] = useState("#000");
  const [customSimilarity, setCustomSimilarity] = useState(0.03);
  const [eyedropper, setEyedropper] = useState(false);

  // === Picker mode state ===
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);

  // === References to underlying DOM elements ===
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Hook: Track window focus/blur events for auto-hide functionality
  useEffect(() => {
    const handleFocus = () => setIsWindowFocused(true);
    const handleBlur = () => setIsWindowFocused(false);

    // Also track document visibility for when user switches tabs
    const handleVisibilityChange = () => {
      setIsWindowFocused(!document.hidden);
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Function: apply the custom color filter
  const applyCustom = useCallback(
    (hex: string) => {
      setCustomHex(hex);
      const rgb = hexToRgb(hex);
      const cfg = {
        ...filterConfigs.find((f) => f.id === "custom")!,
      } as FilterConfig;
      cfg.highlightMode = 99;
      cfg.customColor = rgb;
      cfg.customSimilarity = customSimilarity;
      currentFilterRef.current = cfg;
      setGLFilter(cfg);
      setActiveIdx(filterConfigs.findIndex((f) => f.id === "custom"));
    },
    [customSimilarity]
  );

  // Function: handle starting a new stream
  const handleNewStream = useCallback(async () => {
    // Only reset eyedropper if it's active, keep everything else
    if (eyedropper) {
      setEyedropper(false);
    }
    setPickerMode(null);
    setShowPanel(true);
    
    // Start a new screen capture while preserving all settings
    await startNewStream({
      videoRef,
    });
  }, [eyedropper, videoRef]);

  // Hook: whenever similarity or hex changes and the custom filter is active, re-apply it
  useEffect(() => {
    const customIdx = filterConfigs.findIndex((f) => f.id === "custom");
    if (activeIdx === customIdx) {
      applyCustom(customHex);
    }
  }, [customSimilarity, activeIdx, customHex, applyCustom]);

  return (
    <Container>

      {showPanel && (
        <ControlPanel
          activeIdx={activeIdx}
          setActiveIdx={setActiveIdx}
          onSelectFilter={onSelectFilter}
          customHex={customHex}
          customSimilarity={customSimilarity}
          setCustomSimilarity={setCustomSimilarity}
          eyedropper={eyedropper}
          setEyedropper={setEyedropper}
          applyCustom={applyCustom}
          onNewStream={handleNewStream}
          isWindowFocused={isWindowFocused}
          pickerMode={pickerMode}
          setPickerMode={setPickerMode}
        />
      )}

      {/* Welcome overlay shown initially */}
      {showWelcome && (
        <LandingPage
          onStart={async () => {
            // 1) Initialize WebGL & compile/link shaders
            await setupWebGL();

            // 2) Start the smooth render loop so glRef.current is live
            startSmoothRenderLoop();

            // 3) Now safe to show UI and kick off camera capture
            await handleStartCapture({
              videoRef,
              setShowWelcome,
              setShowPanel,
            });
          }}
        >
          {/* Empty fragment as required children */}
          <></>
        </LandingPage>
      )}

      {/* Hidden video element to stream camera data */}
      <video ref={videoRef} style={{ display: "none" }} playsInline muted />

      {/* WebGL Canvas: shows live video with filters applied */}
      <GlCanvas
        id="glcanvas"
        ref={canvasRef}
        onClick={(e) => {
          if (!eyedropper) return;
          const rect = canvasRef.current!.getBoundingClientRect();
          const xCSS = e.clientX - rect.left;
          const yCSS = e.clientY - rect.top;
          const video = videoRef.current!;

          const px = Math.floor((xCSS / rect.width) * video.videoWidth);
          const py = Math.floor((yCSS / rect.height) * video.videoHeight);

          let r, g, b;
          
          if (pickerMode === 'remove') {
            // For remove mode, sample from the filtered canvas to get the filtered color
            const canvas = canvasRef.current!;
            const ctx = canvas.getContext('2d')!;
            
            // Get the filtered pixel data directly from the displayed canvas
            const canvasPixelData = ctx.getImageData(
              Math.floor((xCSS / rect.width) * canvas.width),
              Math.floor((yCSS / rect.height) * canvas.height),
              1, 1
            ).data;
            
            [r, g, b] = canvasPixelData;
          } else {
            // For add mode, sample from the original video
            const picker = document.createElement("canvas");
            picker.width = video.videoWidth;
            picker.height = video.videoHeight;
            const ctx = picker.getContext("2d")!;
            ctx.drawImage(video, 0, 0);
            [r, g, b] = ctx.getImageData(px, py, 1, 1).data;
          }
          
          const hex =
            "#" +
            [r, g, b]
              .map((v) => (v ?? 0).toString(16).padStart(2, "0"))
              .join("");
          applyCustom(hex);
          setEyedropper(false);
          setPickerMode(null);
        }}
      />
    </Container>
  );
};

export default HomePage;
