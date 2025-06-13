// src/webgl.ts

import { filterConfigs } from "./configs";
import { fillArray } from "./utils";

// Derive the FilterConfig type from the configs array
type FilterConfig = typeof filterConfigs[number];

// URL to load the fragment shader from public folder
export const SHADER_URL: string = `${process.env.PUBLIC_URL}/shader.frag`;

// Shared refs for WebGL state
export const glRef = { current: null as WebGLRenderingContext | null };
export interface GLVars {
  program: WebGLProgram;
  u_scale: WebGLUniformLocation | null;
  lutLocation: WebGLUniformLocation | null;
  u_enableLUT: WebGLUniformLocation | null;
  u_numChromaKeys: WebGLUniformLocation | null;
  u_ckey_color: WebGLUniformLocation | null;
  u_ckey_similarity: WebGLUniformLocation | null;
  u_ckey_smoothness: WebGLUniformLocation | null;
  u_ckey_spill: WebGLUniformLocation | null;
  u_numColorCorrections: WebGLUniformLocation | null;
  u_ccor_gamma: WebGLUniformLocation | null;
  u_ccor_contrast: WebGLUniformLocation | null;
  u_ccor_saturation: WebGLUniformLocation | null;
  videoTexture: WebGLTexture | null;
  lutTexture: WebGLTexture | null;
}
export const glVars = { current: null as GLVars | null };
export const animationIdRef = { current: null as number | null };

export const currentFilterRef = {
  // Deep‐copy the "original" filter as the default state
  current: JSON.parse(
    JSON.stringify(filterConfigs.find((f) => f.id === "original"))
  ) as FilterConfig,
};

/**
 * Initializes the WebGL context, compiles shaders, sets up buffers, uniforms, and textures.
 * Called once when a new video stream starts.
 */
export async function setupWebGL(): Promise<void> {
  // Find the canvas element by ID and get a WebGL context
  const canvas = document.getElementById("glcanvas") as HTMLCanvasElement | null;
  if (!canvas) throw new Error("Canvas #glcanvas not found");
  const gl = canvas.getContext("webgl");
  if (!gl) throw new Error("WebGL not supported");
  glRef.current = gl;

  // Find the video element for screen-capture frames
  const video = document.querySelector("video") as HTMLVideoElement | null;
  if (!video) throw new Error("Video element not found");

  // Vertex shader source: positions & texture coordinates
  const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    uniform vec2 u_scale;
    void main() {
      v_texCoord = a_texCoord;
      gl_Position = vec4(a_position * u_scale, 0, 1);
    }
  `;
  // Load the fragment shader from the public folder
  const fragSrc = await fetch(SHADER_URL).then((r) => r.text());

  // Compile & link shaders into a program
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  const program = createProgram(gl, vertexShader, fragmentShader);
  gl.useProgram(program);

  // Create and fill a buffer with a full-screen quad (positions + tex coords)
  const posBuffer = gl.createBuffer();
  if (!posBuffer) throw new Error("Failed to create buffer");
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  const positions = new Float32Array([
    -1, -1, 0, 1,
     1, -1, 1, 1,
    -1,  1, 0, 0,
     1,  1, 1, 0,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  // Set up the vertex attributes
  const a_position = gl.getAttribLocation(program, "a_position");
  const a_texCoord = gl.getAttribLocation(program, "a_texCoord");
  gl.enableVertexAttribArray(a_position);
  gl.enableVertexAttribArray(a_texCoord);
  gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 16, 0);
  gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 16, 8);

  // Collect all needed uniform locations & placeholder textures
  glVars.current = {
    program,
    u_scale: gl.getUniformLocation(program, "u_scale"),
    lutLocation: gl.getUniformLocation(program, "u_lut"),
    u_enableLUT: gl.getUniformLocation(program, "u_enableLUT"),
    u_numChromaKeys: gl.getUniformLocation(program, "u_numChromaKeys"),
    u_ckey_color: gl.getUniformLocation(program, "u_ckey_color"),
    u_ckey_similarity: gl.getUniformLocation(program, "u_ckey_similarity"),
    u_ckey_smoothness: gl.getUniformLocation(program, "u_ckey_smoothness"),
    u_ckey_spill: gl.getUniformLocation(program, "u_ckey_spill"),
    u_numColorCorrections: gl.getUniformLocation(program, "u_numColorCorrections"),
    u_ccor_gamma: gl.getUniformLocation(program, "u_ccor_gamma"),
    u_ccor_contrast: gl.getUniformLocation(program, "u_ccor_contrast"),
    u_ccor_saturation: gl.getUniformLocation(program, "u_ccor_saturation"),
    videoTexture: null,
    lutTexture: null,
  };

  // Setup video texture (texture unit 0)
  glVars.current.videoTexture = gl.createTexture();
  if (!glVars.current.videoTexture) throw new Error("Failed to create video texture");
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, glVars.current.videoTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(gl.getUniformLocation(program, "u_video"), 0);

  // Setup LUT texture (texture unit 1)
  glVars.current.lutTexture = gl.createTexture();
  if (!glVars.current.lutTexture) throw new Error("Failed to create LUT texture");
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, glVars.current.lutTexture);
  gl.uniform1i(glVars.current.lutLocation!, 1);

  // Apply the initial filter configuration
  await setGLFilter(currentFilterRef.current);

  // --- Aspect correction: ensures the video fits without stretching
  function updateScale(): void {
    // Re-grab canvas & video in case DOM refs have changed
    const canvasEl = document.getElementById("glcanvas") as HTMLCanvasElement | null;
    const videoEl = document.querySelector("video") as HTMLVideoElement | null;

    // Bail out if WebGL isn’t initialized or we lost our elements
    if (!glRef.current || !glVars.current || !canvasEl || !videoEl) return;

    const canvasAspect = canvasEl.width / canvasEl.height;
    const videoAspect = videoEl.videoWidth / videoEl.videoHeight || 1;

    let scaleX = 1, scaleY = 1;
    if (canvasAspect > videoAspect) {
      scaleX = videoAspect / canvasAspect;
    } else {
      scaleY = canvasAspect / videoAspect;
    }

    glRef.current.useProgram(glVars.current.program);
    glRef.current.uniform2f(glVars.current.u_scale, scaleX, scaleY);
  }

  window.addEventListener("resize", updateScale);
  video.addEventListener("loadedmetadata", updateScale);
  updateScale();
}

/** Stops the animation loop by cancelling requestAnimationFrame */
export function stopRenderLoop(): void {
  if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
}

/** Sets all shader uniforms and textures for a given filter config */
export const setGLFilter = async (config: FilterConfig): Promise<void> => {
  const gl = glRef.current;
  const vars = glVars.current;
  if (!gl || !vars) return;
  gl.useProgram(vars.program);

  // --- Chroma‐key uniforms
  const chromaKeys = config.chromaKeys || [];
  gl.uniform1i(vars.u_numChromaKeys, chromaKeys.length);
  const ckey_color = fillArray(chromaKeys.map((k) => k.ckey_color), [0, 0, 0]);
  const ckey_similarity = fillArray(chromaKeys.map((k) => k.ckey_similarity), 0.0);
  const ckey_smoothness = fillArray(chromaKeys.map((k) => k.ckey_smoothness), 0.0);
  const ckey_spill = fillArray(chromaKeys.map((k) => k.ckey_spill), 0.0);
  gl.uniform3fv(vars.u_ckey_color, ckey_color.flat() as Float32List);
  gl.uniform1fv(vars.u_ckey_similarity, ckey_similarity);
  gl.uniform1fv(vars.u_ckey_smoothness, ckey_smoothness);
  gl.uniform1fv(vars.u_ckey_spill, ckey_spill);

  // --- Color‐correction uniforms
  const colorCorrections = config.colorCorrections || [];
  gl.uniform1i(vars.u_numColorCorrections, colorCorrections.length);
  const ccor_gamma = fillArray(colorCorrections.map((c) => c.gamma), 0.0);
  const ccor_contrast = fillArray(colorCorrections.map((c) => c.contrast), 0.0);
  const ccor_saturation = fillArray(colorCorrections.map((c) => c.saturation), 1.0);
  gl.uniform1fv(vars.u_ccor_gamma, ccor_gamma);
  gl.uniform1fv(vars.u_ccor_contrast, ccor_contrast);
  gl.uniform1fv(vars.u_ccor_saturation, ccor_saturation);

// --- LUT handling
if (!config.enableLUT) {
  gl.uniform1i(vars.u_enableLUT, 0);
} else {
  gl.uniform1i(vars.u_enableLUT, 1);
  // coalesce null → undefined to satisfy loadLUTTexture signature
  await loadLUTTexture(config.lut ?? undefined, vars.lutTexture!);
}
};

// Replace your existing renderLoop with this version in src/webgl.tsx

export function renderLoop(): void {
  const vars = glVars.current;
  const videoEl = document.querySelector("video") as HTMLVideoElement | null;

  function draw(): void {
    // Re-fetch gl each frame and guard before use
    const gl = glRef.current;
    if (!gl || !vars || !vars.videoTexture || !videoEl) return;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, vars.videoTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGB,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      videoEl
    );
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    animationIdRef.current = requestAnimationFrame(draw);
  }

  draw();
}



/**
 * Loads a LUT image into a WebGL texture for color‐grading filters.
 * Resolves when the image is loaded and texture parameters are set.
 */
export async function loadLUTTexture(
  lutFile: string | undefined,
  texture: WebGLTexture
): Promise<void> {
  if (!lutFile) return;
  await new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const gl = glRef.current!;
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      resolve();
    };
    img.src = lutFile.startsWith("LUTs/")
      ? `${process.env.PUBLIC_URL}/${lutFile}`
      : lutFile;
  });
}

// --- Internal helpers ---

/** Compiles a GLSL shader of given type from source */
function createShader(
  gl: WebGLRenderingContext,
  type: GLenum,
  src: string
): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || "Shader compile error");
  }
  return shader;
}

/** Links a vertex + fragment shader into a WebGL program */
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
    throw new Error(gl.getProgramInfoLog(program) || "Program link error");
  }
  return program;
}
