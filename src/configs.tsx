// src/configs.ts

/**
 * Defines a single chroma‐key entry (for background removal)
 */
export interface ChromaKey {
  /** RGB key color as three normalized numbers [0–1] */
  ckey_color: [number, number, number];
  /** Similarity threshold for chroma‐key */
  ckey_similarity: number;
  /** Smoothness of the transition */
  ckey_smoothness: number;
  /** Spill reduction amount */
  ckey_spill: number;
}

/**
 * Defines a single color‐correction entry
 */
export interface ColorCorrection {
  gamma?: number;
  contrast?: number;
  brightness?: number;
  saturation?: number;
  hueShift?: number;
  tint?: number;
}

/**
 * Defines the shape of a filter configuration
 */
export interface FilterConfig {
  id: string;
  name: string;
  /** Path to LUT image or null if unused */
  lut: string | null;
  enableLUT: boolean;
  chromaKeys: ChromaKey[];
  colorCorrections: ColorCorrection[];
}

/**
 * List of all filter configurations used.
 */
export const filterConfigs: FilterConfig[] = [
  {
    id: "original",
    name: "Original",
    lut: null,
    enableLUT: false,
    chromaKeys: [],
    colorCorrections: [],
  },
  {
    id: "red",
    name: "Red",
    lut: "LUTs/red-filter.png",
    enableLUT: true,
    chromaKeys: [
      {
        ckey_color: [175 / 255, 142 / 255, 132 / 255],
        ckey_similarity: 1.0,
        ckey_smoothness: 1.0,
        ckey_spill: -50,
      },
    ],
    colorCorrections: [
      {
        saturation: 2,
      },
    ],
  },
  {
    id: "blue",
    name: "Blue",
    lut: "LUTs/blue-filter.png",
    enableLUT: true,
    chromaKeys: [],
    colorCorrections: [
      {
        saturation: 1.5,
        contrast: 0.2,
      },
    ],
  },
  {
    id: "green",
    name: "Green",
    lut: "LUTs/green-filter.png",
    enableLUT: true,
    chromaKeys: [],
    colorCorrections: [],
  },
];
