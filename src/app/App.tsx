import React, { FC, useRef, useEffect, useState } from "react";
import Container from "./components/Container";
import ControlPanelWrapper from "./components/ControlPanel";
import LandingPage, { WelcomeText, WelcomeButton } from "./components/LandingPage";
import Fab from "./components/Fab";
import GlCanvas from "./components/GlCanvas";

import {
  stopRenderLoop,
  glRef,
  glVars,
  animationIdRef,
} from "./webgl";
import { handleStartCapture, onSelectFilter } from "./filterHandlers";

const App: FC = () => {
  const [showPanel, setShowPanel] = useState<boolean>(false);
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [panelSide, setPanelSide] = useState<"left" | "right">("left");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Reset shared WebGL refs on mount
useEffect(() => {
  glRef.current = null;
  glVars.current = null;  
  animationIdRef.current = null;
}, []);


  // Handle canvas resizing and viewport updates
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const gl = glRef.current;
      if (gl) {
        gl.viewport(
          0,
          0,
          gl.drawingBufferWidth,
          gl.drawingBufferHeight
        );
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // Stop rendering loop on unmount
  useEffect(() => {
    return () => stopRenderLoop();
  }, []);

  // Toggle panel side between left/right
  const togglePanelSide = () =>
    setPanelSide((side) => (side === "left" ? "right" : "left"));

  const handleMinimizePanel = () => setShowPanel(false);
  const handleRestorePanel = () => setShowPanel(true);

  // Start capture: hide welcome, show panel, initialize capture
  const _handleStartCapture = () => {
    setShowWelcome(false);
    setShowPanel(true);
    handleStartCapture({
      videoRef,
      canvasRef,
      setShowWelcome,
      setShowPanel,
    });
  };

  return (
    <Container>
      {showPanel && (
        <ControlPanelWrapper
          side={panelSide}
          activeIdx={activeIdx}
          setActiveIdx={setActiveIdx}
          onSelectFilter={onSelectFilter}
          togglePanelSide={togglePanelSide}
          handleMinimizePanel={handleMinimizePanel}
        />
      )}

      {showWelcome && (
        <LandingPage>
          <WelcomeText>
            Welcome!
            <br />
            Please click below to get started.
          </WelcomeText>
          <WelcomeButton id="startBtn" onClick={_handleStartCapture}>
            Start Capture
          </WelcomeButton>
        </LandingPage>
      )}

      {/* Hidden video element for capture */}
      <video
        ref={videoRef}
        style={{ display: "none" }}
        playsInline
        muted
      />

      {/* WebGL canvas */}
      <GlCanvas id="glcanvas" ref={canvasRef} />

      {/* Floating button to restore panel */}
      {!showPanel && !showWelcome && (
        <Fab
          id="fab"
          side={panelSide}
          title="Show panel"
          aria-label="Show panel"
          className="show"
          onClick={handleRestorePanel}
        >
          ☰
        </Fab>
      )}
    </Container>
  );
};

export default App;
