precision mediump float;

uniform sampler2D u_video;
uniform sampler2D u_lut;
uniform bool u_enableLUT;
uniform int u_numChromaKeys;
uniform vec3 u_ckey_color[4];
uniform float u_ckey_similarity[4];
uniform float u_ckey_smoothness[4];
uniform float u_ckey_spill[4];
uniform int u_numColorCorrections;
uniform float u_ccor_gamma[4];
uniform float u_ccor_contrast[4];
uniform float u_ccor_saturation[4];
varying vec2 v_texCoord;

const float size = 64.0; // 64x64x64 LUT
const float tiles = 8.0; // 8x8 grid

vec3 applyLUT(vec3 color) {
  // Scale color to [0, size-1]
  float r = clamp(color.r, 0.0, 1.0) * (size - 1.0);
  float g = clamp(color.g, 0.0, 1.0) * (size - 1.0);
  float b = clamp(color.b, 0.0, 1.0) * (size - 1.0);

  // Get integer and fractional part of blue (z)
  float zSlice = floor(b);
  float zOffset = fract(b);

  // Compute tile position in 8x8 grid
  float tileX = mod(zSlice, tiles);
  float tileY = floor(zSlice / tiles);

  // Compute normalized coordinates within the tile
  vec2 uv1 = vec2(
    (r + 0.5) / size,
    (g + 0.5) / size
  );

  // Offset by tile position in the 512x512 texture
  uv1.x = (uv1.x + tileX) / tiles;
  uv1.y = (uv1.y + tileY) / tiles;

  // For trilinear interpolation, sample next slice
  float zSlice2 = min(zSlice + 1.0, size - 1.0);
  float tileX2 = mod(zSlice2, tiles);
  float tileY2 = floor(zSlice2 / tiles);

  vec2 uv2 = vec2(
    (r + 0.5) / size,
    (g + 0.5) / size
  );
  uv2.x = (uv2.x + tileX2) / tiles;
  uv2.y = (uv2.y + tileY2) / tiles;

  vec3 result1 = texture2D(u_lut, uv1).rgb;
  vec3 result2 = texture2D(u_lut, uv2).rgb;

  return mix(result1, result2, zOffset);
}

float getChromaMask(vec3 color, vec3 keyColor, float similarity, float smoothness) {
  float Y = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
  float Cr = color.r - Y;
  float Cb = color.b - Y;
  float Yk = 0.299 * keyColor.r + 0.587 * keyColor.g + 0.114 * keyColor.b;
  float Crk = keyColor.r - Yk;
  float Cbk = keyColor.b - Yk;
  float dist = distance(vec2(Cr, Cb), vec2(Crk, Cbk));
  float edge0 = similarity * (1.0 - smoothness * 0.01);
  float edge1 = similarity * (1.0 + smoothness * 0.01);
  return 1.0 - smoothstep(edge0, edge1, dist);
}

vec3 applyColorCorrection(vec3 color, float gamma, float contrast, float saturation) {
  // Gamma
  color = pow(color, vec3(1.0 / max(0.01, 1.0 + gamma)));
  // Contrast
  color = (color - 0.5) * (1.0 + contrast) + 0.5;
  // Saturation
  float luma = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(luma), color, saturation);
  return clamp(color, 0.0, 1.0);
}

void main() {
  vec4 videoColor = texture2D(u_video, v_texCoord);
  vec3 color = videoColor.rgb;

  // Apply all chroma key filters in order
  for (int i = 0; i < 4; ++i) {
    if (i >= u_numChromaKeys) break;
    float mask = getChromaMask(color, u_ckey_color[i], u_ckey_similarity[i], u_ckey_smoothness[i]);
    color = mix(color, vec3(color.r, color.g * (1.0 - u_ckey_spill[i] * 0.005), color.b), mask);
  }

  // Apply all color correction filters in order
  for (int i = 0; i < 4; ++i) {
    if (i >= u_numColorCorrections) break;
    color = applyColorCorrection(color, u_ccor_gamma[i], u_ccor_contrast[i], u_ccor_saturation[i]);
  }

  // LUT (if enabled)
  if (u_enableLUT) {
    color = applyLUT(color);
  }

  gl_FragColor = vec4(color, 1.0);
}