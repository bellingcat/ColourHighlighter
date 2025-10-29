// src/services/index.ts

// Screen capture and filter handling
export { handleStartCapture, handleNewStream, onSelectFilter } from './screenCapture';

// WebGL setup and rendering
export {
  setupWebGL,
  renderLoop,
  startSmoothRenderLoop,
  stopRenderLoop,
  setGLFilter,
  setMultiColorFilter,
  applyStreamSettings,
  optimizeVideoForPlayback,
  glRef,
  glVars,
  currentFilterRef,
  animationIdRef,
} from './webgl';
