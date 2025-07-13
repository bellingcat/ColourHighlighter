// Describe what a single filter needs to work:
export interface FilterConfig {
  id: string;       // Unique name used in code
  name: string;     // Human-readable label shown in the UI
  highlightMode: number; // Integer the shader reads to pick a filter

  // Optional settings used only by the custom (eyedropper) filter:
  customThreshold?: number;    // How strictly to match colors
  customMinSaturation?: number; // Ignore very gray pixels
  customMinLuma?: number;       // Ignore very dark pixels
  customColor?: [number, number, number];  // RGB picked by user, each channel 0..1
  customSimilarity?: number;    // Hue tolerance (0.0 = exact, 1.0 = any)

  // Final image adjustments for all filters:
  brightness?: number;  // Multiplier on color (1 = no change)
  contrast?: number;    // 1 = no change
  gamma?: number;       // 1 = no change
}

// An array of all available filters:
export const filterConfigs: FilterConfig[] = [
  {
    id: "original",
    name: "Original",
    highlightMode: 0,  // The shader's "mode 0" means show raw video
  },
  {
    id: "custom",
    name: "Custom",
    highlightMode: 99,         // Special mode in shader for color picking
    // Default eyepicker settings:
    customThreshold: 0.05,     // Start with small tolerance
    customMinSaturation: 0.1,   // Ignore nearly gray pixels
    customMinLuma: 0.0,         // Include all brightness levels
    customColor: [1, 0, 0],     // Default pick = red ([R,G,B] each 0..1)
    customSimilarity: 0.2,      // How close a hue must be to keep it
  },
];