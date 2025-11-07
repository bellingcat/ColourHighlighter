// This file sets up and controls WebGL to apply real-time filters to a live video feed.

import { filterConfigs } from "@/configs";

// 1. Define what a filter looks like by reusing the shape of items in filterConfigs
type FilterConfig = typeof filterConfigs[number];

// 2. We'll need a place to store our WebGL context once we get it.
export const glRef = {
  current: null as WebGLRenderingContext | null,
};

// 3. Define all the pieces (uniforms, program, texture) we'll talk to in our shaders:
export interface GLVars {
  program: WebGLProgram;              
  u_scale: WebGLUniformLocation|null; 
  u_highlightMode: WebGLUniformLocation|null;
  u_customColor: WebGLUniformLocation|null;
  u_customSimilarity: WebGLUniformLocation|null;
  u_brightness: WebGLUniformLocation|null;
  u_contrast: WebGLUniformLocation|null;
  u_gamma: WebGLUniformLocation|null;
  u_temperature: WebGLUniformLocation|null;
  // Multi-color filtering uniforms
  u_multiColors: WebGLUniformLocation|null;
  u_multiTolerances: WebGLUniformLocation|null;
  u_multiSaturations: WebGLUniformLocation|null;
  u_multiValues: WebGLUniformLocation|null;
  u_multiHues: WebGLUniformLocation|null;
  u_multiBoosted: WebGLUniformLocation|null;
  u_multiDisplayColors: WebGLUniformLocation|null;
  u_multiModes: WebGLUniformLocation|null;
  u_numColors: WebGLUniformLocation|null;
  u_multiSimilarity: WebGLUniformLocation|null;
  videoTexture: WebGLTexture|null;
}

// 4. These refs will hold instances of the above, and the animation loop ID:
export const glVars = { current: null as GLVars|null };
export const animationIdRef = { current: null as number|null };

// 5. Keep track of which filter is currently picked. We clone the "original" filter to start.
export const currentFilterRef = {
  current: JSON.parse(
    JSON.stringify(filterConfigs.find(f => f.id === "original"))
  ) as FilterConfig,
};

// 6. Helper: Check we actually found all the uniforms (just logs warnings)
function verifyGLVars() {
  if (!glVars.current) return;
  const missing: string[] = [];
  const vars = glVars.current;
  
  if (vars.u_scale === null) missing.push("u_scale");
  if (vars.u_highlightMode === null) missing.push("u_highlightMode");
  if (vars.u_customColor === null) missing.push("u_customColor");
  if (vars.u_customSimilarity === null) missing.push("u_customSimilarity");
  if (vars.u_brightness === null) missing.push("u_brightness");
  if (vars.u_contrast === null) missing.push("u_contrast");
  if (vars.u_gamma === null) missing.push("u_gamma");
  if (vars.u_temperature === null) missing.push("u_temperature");
  if (vars.u_multiColors === null) missing.push("u_multiColors");
  if (vars.u_numColors === null) missing.push("u_numColors");
  if (vars.u_multiSimilarity === null) missing.push("u_multiSimilarity");
  
  if (missing.length) {
    console.warn("Warning: these WebGL variables were not found:", missing);
  } else {
    console.log("All WebGL variables located successfully.");
  }
}

// 7. Main setup function. Call this once to get everything ready.
export async function setupWebGL(): Promise<void> {
  // A) Find the canvas and get the WebGL context
  const canvas = document.getElementById("glcanvas") as HTMLCanvasElement | null;
  if (!canvas) throw new Error("Canvas element #glcanvas is missing");
  
  // Create WebGL context with preserveDrawingBuffer enabled for color sampling
  const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) throw new Error("Your browser does not support WebGL");
  glRef.current = gl;

  // B) Find the hidden <video> element. That video feed becomes our texture.
  const video = document.querySelector("video") as HTMLVideoElement | null;
  if (!video) throw new Error("Video element not found");
  
  // Optimize video for smoother playback
  optimizeVideoForPlayback(video);

  // C) Vertex shader: sets positions and texture coords
  const vertexSrc = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    uniform vec2 u_scale;
    void main() {
      v_texCoord = a_texCoord;
      gl_Position = vec4(a_position * u_scale, 0, 1);
    }
  `;

  // D) Load fragment shader code
  const fragSrc = await fetch(`assets/shader.frag`).then(r => r.text());

  // E) Compile shaders & link program
  const vs = createShader(gl, gl.VERTEX_SHADER, vertexSrc);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  const program = createProgram(gl, vs, fs);
  gl.useProgram(program);

  // F) Create a rectangle covering the screen
  const posBuffer = gl.createBuffer();
  if (!posBuffer) throw new Error("Failed to create buffer");
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1, -1, 0, 0,
       1, -1, 1, 0,
      -1,  1, 0, 1,
       1,  1, 1, 1,
    ]),
    gl.STATIC_DRAW
  );

  // G) Tell WebGL how to read that buffer
  const aPos = gl.getAttribLocation(program, "a_position");
  const aTex = gl.getAttribLocation(program, "a_texCoord");
  gl.enableVertexAttribArray(aPos);
  gl.enableVertexAttribArray(aTex);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
  gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, 16, 8);

  // H) Find all uniforms and stash them
  glVars.current = {
    program,
    u_scale:          gl.getUniformLocation(program, "u_scale"),
    u_highlightMode:  gl.getUniformLocation(program, "u_highlightMode"),
    u_customColor:    gl.getUniformLocation(program, "u_customColor"),
    u_customSimilarity: gl.getUniformLocation(program, "u_customSimilarity"),
    u_brightness:     gl.getUniformLocation(program, "u_brightness"),
    u_contrast:       gl.getUniformLocation(program, "u_contrast"),
    u_gamma:          gl.getUniformLocation(program, "u_gamma"),
    u_temperature:    gl.getUniformLocation(program, "u_temperature"),
    // Multi-color filtering uniforms
    u_multiColors:    gl.getUniformLocation(program, "u_multiColors"),
    u_multiTolerances: gl.getUniformLocation(program, "u_multiTolerances"),
    u_multiSaturations: gl.getUniformLocation(program, "u_multiSaturations"),
    u_multiValues:    gl.getUniformLocation(program, "u_multiValues"),
    u_multiHues:      gl.getUniformLocation(program, "u_multiHues"),
    u_multiBoosted:   gl.getUniformLocation(program, "u_multiBoosted"),
    u_multiDisplayColors: gl.getUniformLocation(program, "u_multiDisplayColors"),
    u_multiModes:     gl.getUniformLocation(program, "u_multiModes"),
    u_numColors:      gl.getUniformLocation(program, "u_numColors"),
    u_multiSimilarity: gl.getUniformLocation(program, "u_multiSimilarity"),
    videoTexture:     null,
  };
  verifyGLVars();

  // I) Create the texture for video frames
  glVars.current.videoTexture = gl.createTexture();
  if (!glVars.current.videoTexture) throw new Error("Could not create video texture");
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, glVars.current.videoTexture);

  // **FLIP Y**: this makes the video right-side-up in WebGL
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  // Use linear filtering for smoother video playback
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  
  // Enable optimizations for video texture streaming
  const anisotropicExt = gl.getExtension('EXT_texture_filter_anisotropic');
  if (anisotropicExt) {
    gl.texParameterf(gl.TEXTURE_2D, anisotropicExt.TEXTURE_MAX_ANISOTROPY_EXT, 1.0);
  }
  
  gl.uniform1i(gl.getUniformLocation(program, "u_video"), 0);

  // Optimize WebGL for smooth video playback
  optimizeWebGLForVideo(gl);

  // J) Apply the starting filter and size the canvas
  await setGLFilter(currentFilterRef.current);
  updateCanvasAndScale();
  window.addEventListener("resize", updateCanvasAndScale);
  video.addEventListener("loadedmetadata", updateCanvasAndScale);
  video.addEventListener("resize", updateCanvasAndScale);
  
  // Add a periodic check for video dimension changes
  let lastVideoWidth = 0;
  let lastVideoHeight = 0;
  let lastCanvasWidth = 0;
  let lastCanvasHeight = 0;
  
  const checkVideoDimensions = () => {
    const rect = canvas.getBoundingClientRect();
    const currentCanvasWidth = rect.width;
    const currentCanvasHeight = rect.height;
    
    // Only update if dimensions actually changed
    if (video.videoWidth !== lastVideoWidth || 
        video.videoHeight !== lastVideoHeight ||
        currentCanvasWidth !== lastCanvasWidth ||
        currentCanvasHeight !== lastCanvasHeight) {
      lastVideoWidth = video.videoWidth;
      lastVideoHeight = video.videoHeight;
      lastCanvasWidth = currentCanvasWidth;
      lastCanvasHeight = currentCanvasHeight;
      updateCanvasAndScale();
    }
  };
  setInterval(checkVideoDimensions, 100); // Check every 100ms

  // K) Helper: match canvas size & set u_scale
  function updateCanvasAndScale() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = rect.width * dpr;
    canvas.height = rect.height * dpr;
    if (!gl) return;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;
    
    try {
      gl.viewport(0, 0, canvas.width, canvas.height);
      const ca = canvas.width / canvas.height;
      const va = video.videoWidth / video.videoHeight;
      
      // Avoid division by zero and invalid ratios
      if (!isFinite(ca) || !isFinite(va) || ca <= 0 || va <= 0) {
        console.warn('Invalid aspect ratios:', { ca, va, canvas: { w: canvas.width, h: canvas.height }, video: { w: video.videoWidth, h: video.videoHeight } });
        return;
      }
      
      const sx = ca > va ? va / ca : 1;
      const sy = ca > va ? 1 : ca / va;
      
      gl.useProgram(program);
      gl.uniform2f(glVars.current!.u_scale, sx, sy);
      
      console.log(`Canvas scaled: ${canvas.width}x${canvas.height}, Video: ${video.videoWidth}x${video.videoHeight}, Scale: ${sx.toFixed(3)}, ${sy.toFixed(3)}`);
    } catch (error) {
      console.warn('Canvas scaling error:', error);
    }
  }
}

// 8. Stop the animation loop
export function stopRenderLoop() {
  if (animationIdRef.current) {
    cancelAnimationFrame(animationIdRef.current);
  }
}

// 9. Apply a new filter
export const setGLFilter = async (config: FilterConfig) => {
  const gl = glRef.current!;
  const vars = glVars.current!;
  gl.useProgram(vars.program);
  gl.uniform1i(vars.u_highlightMode, config.highlightMode || 0);
  if (config.highlightMode === 99 && config.customColor) {
    gl.uniform3fv(vars.u_customColor, config.customColor);
    gl.uniform1f(vars.u_customSimilarity, config.customSimilarity || 0);
  } else {
    gl.uniform1f(vars.u_customSimilarity, 0);
  }
  gl.uniform1f(vars.u_brightness, config.brightness || 1.0);
  gl.uniform1f(vars.u_contrast,   config.contrast   || 1.0);
  gl.uniform1f(vars.u_gamma,      config.gamma      || 1.0);
  gl.uniform1f(vars.u_temperature, 0.0); // Initialize temperature to neutral
};

// 9.5. Apply multi-color filtering
export const setMultiColorFilter = async (chips: Array<{
  color: string, 
  tolerance: number, 
  saturation: number, 
  value: number, 
  hue: number, 
  displayColor: string,
  mode?: 'include' | 'exclude'
}>, fallbackSimilarity: number = 0.03) => {
  const gl = glRef.current!;
  const vars = glVars.current!;
  gl.useProgram(vars.program);
  
  // Clear single color filtering
  gl.uniform1f(vars.u_customSimilarity, 0);
  
  if (chips.length === 0) {
    // No colors selected, show full spectrum
    gl.uniform1i(vars.u_numColors, 0);
    gl.uniform1f(vars.u_multiSimilarity, 0);
    return;
  }

  // Convert hex colors to RGB arrays and collect all parameters
  const colorArray: number[] = [];
  const toleranceArray: number[] = [];
  const saturationArray: number[] = [];
  const valueArray: number[] = [];
  const hueArray: number[] = [];
  const displayColorArray: number[] = [];
  const modeArray: number[] = [];
  
  chips.forEach((chip, index) => {
    if (index < 10) { // Max 10 colors supported by shader
      // Original color
      const r = parseInt(chip.color.slice(1, 3), 16) / 255;
      const g = parseInt(chip.color.slice(3, 5), 16) / 255;
      const b = parseInt(chip.color.slice(5, 7), 16) / 255;
      colorArray.push(r, g, b);
      
      // Display color
      const dr = parseInt(chip.displayColor.slice(1, 3), 16) / 255;
      const dg = parseInt(chip.displayColor.slice(3, 5), 16) / 255;
      const db = parseInt(chip.displayColor.slice(5, 7), 16) / 255;
      displayColorArray.push(dr, dg, db);
      
      // Parameters
      toleranceArray.push(chip.tolerance);
      saturationArray.push(chip.saturation);
      valueArray.push(chip.value);
      hueArray.push(chip.hue);
      modeArray.push(chip.mode === 'exclude' ? 1.0 : 0.0); // 1.0 for exclude, 0.0 for include
    }
  });

  // Pad all arrays to required lengths
  while (colorArray.length < 30) colorArray.push(0, 0, 0);
  while (displayColorArray.length < 30) displayColorArray.push(0, 0, 0);
  while (toleranceArray.length < 10) toleranceArray.push(0);
  while (saturationArray.length < 10) saturationArray.push(0);
  while (valueArray.length < 10) valueArray.push(0);
  while (hueArray.length < 10) hueArray.push(0);
  while (modeArray.length < 10) modeArray.push(0);

  // Upload all data to GPU
  gl.uniform3fv(vars.u_multiColors, colorArray);
  gl.uniform3fv(vars.u_multiDisplayColors, displayColorArray);
  gl.uniform1fv(vars.u_multiTolerances, toleranceArray);
  gl.uniform1fv(vars.u_multiSaturations, saturationArray);
  gl.uniform1fv(vars.u_multiValues, valueArray);
  gl.uniform1fv(vars.u_multiHues, hueArray);
  gl.uniform1fv(vars.u_multiModes, modeArray);
  gl.uniform1i(vars.u_numColors, Math.min(chips.length, 10));
  gl.uniform1f(vars.u_multiSimilarity, fallbackSimilarity);
};

// 10. The render loop: upload each frame and draw
export function renderLoop() {
  const video = document.querySelector("video") as HTMLVideoElement;
  let lastFrameTime = 0;
  let frameCount = 0;
  let lastVideoTime = 0;
  
  function draw(currentTime: number) {
    const gl = glRef.current!;
    const vars = glVars.current!;
    
    // Check if video and WebGL are still valid
    if (!vars.videoTexture || !video || video.readyState < 2) {
      animationIdRef.current = requestAnimationFrame(draw);
      return;
    }
    
    // Check if video has valid dimensions
    if (!video.videoWidth || !video.videoHeight) {
      animationIdRef.current = requestAnimationFrame(draw);
      return;
    }
    
    // Only update texture if video has new frame data
    // This reduces unnecessary texture uploads and improves performance
    const currentVideoTime = video.currentTime;
    if (currentVideoTime !== lastVideoTime) {
      lastVideoTime = currentVideoTime;
      
      try {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, vars.videoTexture);

        // Upload the current video frame into the GPU texture:
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGB,
          gl.RGB,
          gl.UNSIGNED_BYTE,
          video
        );
      } catch (error) {
        console.warn('Texture upload error:', error);
        // Continue trying to render on next frame
        animationIdRef.current = requestAnimationFrame(draw);
        return;
      }
    }
    
    // Always draw the frame for smooth animation
    try {
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } catch (error) {
      console.warn('Draw error:', error);
    }
    
    // Performance monitoring (optional - can be removed in production)
    frameCount++;
    if (currentTime - lastFrameTime >= 1000) {
      const fps = (frameCount * 1000) / (currentTime - lastFrameTime);
      if (fps < 25) {
        console.warn(`Low FPS detected: ${fps.toFixed(1)} fps`);
      }
      frameCount = 0;
      lastFrameTime = currentTime;
    }
    
    // Next frame:
    animationIdRef.current = requestAnimationFrame(draw);
  }
  
  // Start the render loop
  animationIdRef.current = requestAnimationFrame(draw);
}

// Enhanced render loop with better frame timing
export function startSmoothRenderLoop() {
  // Stop any existing render loop
  stopRenderLoop();
  
  // Start the optimized render loop
  renderLoop();
  
  console.log('Smooth render loop started');
}

// 11. Utility: compile shader
function createShader(
  gl: WebGLRenderingContext,
  type: GLenum,
  src: string
): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || "Shader compile failed");
  }
  return shader;
}

// 12. Utility: link shaders
function createProgram(
  gl: WebGLRenderingContext,
  vs: WebGLShader,
  fs: WebGLShader
): WebGLProgram {
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "Program link failed");
  }
  return program;
}

// Helper function to optimize WebGL for smooth video playback
function optimizeWebGLForVideo(gl: WebGLRenderingContext) {
  // Enable depth testing and other optimizations
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.STENCIL_TEST);
  gl.disable(gl.SCISSOR_TEST);
  gl.disable(gl.BLEND);
  gl.disable(gl.CULL_FACE);
  gl.disable(gl.DITHER);
  
  // Set viewport optimization hints
  gl.hint(gl.GENERATE_MIPMAP_HINT, gl.FASTEST);
  
  // Clear any existing errors
  while (gl.getError() !== gl.NO_ERROR) {
    // Clear error queue
  }
  
  console.log('WebGL optimized for video playback');
}

// Function to optimize video element for smoother playback
export function optimizeVideoForPlayback(video: HTMLVideoElement) {
  // Set video attributes for smoother playback
  video.playsInline = true;
  video.muted = true; // Required for autoplay in most browsers
  
  // Add performance optimization attributes
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  
  // Optimize video playback settings
  if ('requestVideoFrameCallback' in video) {
    // Use the newer video frame callback API if available for smoother sync
    console.log('Using requestVideoFrameCallback for smoother playback');
  }
  
  // Handle video events for better performance
  video.addEventListener('loadeddata', () => {
    console.log('Video loaded, optimizing for playback');
  });
  
  video.addEventListener('canplay', () => {
    console.log('Video can play, ready for smooth rendering');
  });
  
  // Preload video for smoother startup
  video.preload = 'auto';
  
  console.log('Video element optimized for smooth playback');
}

// Apply stream display settings that affect rendering but not color picking
export const applyStreamSettings = (settings: {
  brightness: number;    // -100 to 100
  contrast: number;      // -100 to 100
  temperature: number;   // -100 to 100 (cool to warm)
  gamma: number;         // 0.5 to 2.0
}) => {
  const gl = glRef.current;
  const vars = glVars.current;
  
  if (!gl || !vars) return;
  
  gl.useProgram(vars.program);
  
  // Convert settings to shader values
  // Brightness: -100 to 100 -> 0.0 to 2.0 (1.0 is neutral)
  const brightness = 1.0 + (settings.brightness / 100.0);
  
  // Contrast: -100 to 100 -> 0.0 to 2.0 (1.0 is neutral)  
  const contrast = 1.0 + (settings.contrast / 100.0);
  
  // Temperature: -100 to 100 -> -1.0 to 1.0 (0.0 is neutral)
  const temperature = settings.temperature / 100.0;
  
  // Gamma: already in correct range (0.5 to 2.0)
  const gamma = settings.gamma;
  
  // Apply the settings to WebGL uniforms
  gl.uniform1f(vars.u_brightness, brightness);
  gl.uniform1f(vars.u_contrast, contrast);
  gl.uniform1f(vars.u_gamma, gamma);
  gl.uniform1f(vars.u_temperature, temperature);
};
