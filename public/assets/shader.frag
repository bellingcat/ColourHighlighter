/* ======================================
   2) shader.frag - fragment shader code  
   ====================================== */
// Runs on the GPU for each pixel of the video frame.
precision mediump float;

uniform sampler2D u_video;      // The live video texture
uniform int   u_highlightMode;  // Which filter to run (0=original,99=custom)
uniform vec3  u_customColor;    // Picked RGB color (for backward compatibility)
uniform float u_customSimilarity;// Tolerance for hue match
uniform float u_brightness;      // Final brightness adjustment
uniform float u_contrast;        // Final contrast adjustment
uniform float u_gamma;           // Final gamma adjustment
uniform float u_temperature;     // Color temperature adjustment (-1.0 to 1.0)

// Multi-color filtering uniforms
uniform vec3 u_multiColors[10]; // Array of up to 10 original colors
uniform float u_multiTolerances[10]; // Array of tolerances for each color
uniform float u_multiSaturations[10]; // Array of saturation ranges for each color
uniform float u_multiValues[10]; // Array of value ranges for each color
uniform float u_multiHues[10]; // Array of hue ranges for each color
uniform float u_multiBoosted[10]; // Array of boost flags for each color
uniform vec3 u_multiDisplayColors[10]; // Array of display colors for each color
uniform float u_multiModes[10]; // Array of modes for each color (0.0 = include, 1.0 = exclude)
uniform int u_numColors;        // Number of active colors
uniform float u_multiSimilarity; // Global tolerance for backward compatibility

varying vec2 v_texCoord;         // Coordinates of this pixel

// Convert RGB color to HSL space (hue,saturation,lightness)
vec3 rgb2hsl(vec3 c) {
    float maxc = max(max(c.r,c.g),c.b);
    float minc = min(min(c.r,c.g),c.b);
    float l = (maxc + minc) * 0.5;
    float s = 0.0;
    float h = 0.0;
    if (maxc != minc) {
        float d = maxc - minc;
        s = l < 0.5 ? d/(maxc+minc) : d/(2.0-maxc-minc);
        if (maxc == c.r) {
            h = (c.g - c.b)/d + (c.g < c.b ? 6.0 : 0.0);
        } else if (maxc == c.g) {
            h = (c.b - c.r)/d + 2.0;
        } else {
            h = (c.r - c.g)/d + 4.0;
        }
        h /= 6.0;
    }
    return vec3(h,s,l);
}

void main() {
    // 1) Sample the video color at this pixel
    vec3 color = texture2D(u_video, v_texCoord).rgb;
    vec3 originalColor = color; // Store original color for stream adjustments
    bool isPickedColor = false; // Track if this pixel matches any picked color

    // 2) Multi-color filtering logic
    if (u_numColors > 0) {
        vec3 pixHSL = rgb2hsl(color);
        bool matchesIncludeColor = false;
        bool matchesExcludeColor = false;
        vec3 finalColor = color;
        
        // First pass: Check for exclude colors (highest priority)
        for (int i = 0; i < 10; i++) {
            if (i >= u_numColors) break;
            
            bool isExcludeMode = u_multiModes[i] > 0.5; // 1.0 for exclude, 0.0 for include
            if (!isExcludeMode) continue; // Skip include colors in this pass
            
            vec3 targetHSL = rgb2hsl(u_multiColors[i]);
            
            // For exclude mode, use chroma key-like similarity matching
            // Calculate overall color similarity in HSL space
            float dh = abs(pixHSL.x - targetHSL.x);
            dh = min(dh, 1.0 - dh);
            float ds = abs(pixHSL.y - targetHSL.y);
            float dv = abs(pixHSL.z - targetHSL.z);
            
            // Use only the main tolerance for overall similarity (chroma key style)
            float tolerance = u_multiTolerances[i] > 0.0 ? u_multiTolerances[i] : u_multiSimilarity;
            
            // Combined similarity check - all components must be within tolerance
            bool colorMatch = (dh <= tolerance) && (ds <= tolerance) && (dv <= tolerance);
            bool notTooGray = pixHSL.y >= 0.05; // Minimum saturation to avoid grayscale
            
            if (colorMatch && notTooGray) {
                matchesExcludeColor = true;
                break; // Exclude colors have highest priority
            }
        }
        
        // Second pass: Check for include colors (only if not excluded)
        if (!matchesExcludeColor) {
            for (int i = 0; i < 10; i++) {
                if (i >= u_numColors) break;
                
                bool isExcludeMode = u_multiModes[i] > 0.5; // 1.0 for exclude, 0.0 for include
                if (isExcludeMode) continue; // Skip exclude colors in this pass
                
                vec3 targetHSL = rgb2hsl(u_multiColors[i]);
                
                // Hue difference (shortest path around color wheel)
                float dh = abs(pixHSL.x - targetHSL.x);
                dh = min(dh, 1.0 - dh);
                
                // Saturation difference
                float ds = abs(pixHSL.y - targetHSL.y);
                
                // Value/Lightness difference
                float dv = abs(pixHSL.z - targetHSL.z);
                
                // Use individual tolerances for each component
                float hueTolerance = u_multiHues[i] / 360.0; // Convert degrees to 0-1 range
                float satTolerance = u_multiSaturations[i];
                float valTolerance = u_multiValues[i];
                float tolerance = u_multiTolerances[i] > 0.0 ? u_multiTolerances[i] : u_multiSimilarity;
                
                // Check if pixel matches this color within all tolerances
                bool hueMatch = dh <= max(tolerance, hueTolerance);
                bool satMatch = ds <= satTolerance;
                bool valMatch = dv <= valTolerance;
                bool notTooGray = pixHSL.y >= 0.05; // Minimum saturation to avoid grayscale
                
                if (hueMatch && satMatch && valMatch && notTooGray) {
                    matchesIncludeColor = true;
                    isPickedColor = true; // Mark as picked color
                    
                    // Keep the original color variations, but optionally tint toward display color
                    vec3 originalColorForTint = color; // Preserve natural variations
                    vec3 displayColor = u_multiDisplayColors[i];
                    
                    // Only tint if display color is significantly different from original picked color
                    vec3 pickedColor = u_multiColors[i];
                    float colorDifference = length(displayColor - pickedColor);
                    
                    if (colorDifference > 0.1) {
                        // Gently tint the natural color toward the display color
                        // This preserves shadows, highlights, and natural variations
                        finalColor = mix(originalColorForTint, originalColorForTint * (displayColor / max(pickedColor, vec3(0.001))), 0.6);
                    }
                    break; // Found a match, no need to check further
                }
            }
        }
        
        // Apply the filtering logic:
        // 1. If pixel matches an exclude color, make it grayscale (removes false positives)
        // 2. If pixel matches an include color and not excluded, show it in color
        // 3. If pixel doesn't match any include colors, make it grayscale
        if (matchesExcludeColor) {
            // Force to grayscale - this color should be "removed" from highlights
            float gray = dot(color, vec3(0.299,0.587,0.114));
            color = vec3(gray);
        } else if (matchesIncludeColor) {
            // Show in color - this color should be highlighted
            color = finalColor;
        } else {
            // Default to grayscale - this color was never picked
            float gray = dot(color, vec3(0.299,0.587,0.114));
            color = vec3(gray);
        }
    }
    // 3) Fallback to single color filtering for backward compatibility
    else if (u_customSimilarity > 0.0) {
        // a) Convert both current pixel and picked color to HSL
        vec3 pixHSL = rgb2hsl(color);
        vec3 pickHSL = rgb2hsl(u_customColor);
        // b) Compute shortest distance around the hue circle
        float dh = abs(pixHSL.x - pickHSL.x);
        dh = min(dh, 1.0 - dh);
        // c) If within tolerance AND pixel not too gray, keep color; else make it gray
        if (dh <= u_customSimilarity && pixHSL.y >= 0.1) {
            isPickedColor = true; // Mark as picked color for single color mode
        } else {
            float gray = dot(color, vec3(0.299,0.587,0.114));
            color = vec3(gray);
        }
    }

    // 4) Apply stream adjustments ONLY to non-picked colors
    if (!isPickedColor) {
        // Apply brightness, contrast, gamma, and temperature adjustments to background
        color *= u_brightness;
        color = (color - 0.5) * u_contrast + 0.5;
        color = pow(color, vec3(1.0/max(0.001,u_gamma)));
        
        // Temperature adjustment: shift color temperature from cool (blue) to warm (orange/red)
        if (u_temperature != 0.0) {
            // Create temperature tint based on u_temperature (-1.0 to 1.0)
            float tempStrength = abs(u_temperature) * 0.1; // Reduce intensity for subtle effect
            
            if (u_temperature > 0.0) {
                // Warm: increase red/yellow, decrease blue
                color.r += tempStrength * 0.8;
                color.g += tempStrength * 0.3;
                color.b -= tempStrength * 0.5;
            } else {
                // Cool: increase blue, decrease red/yellow
                color.r -= tempStrength * 0.5;
                color.g -= tempStrength * 0.2;
                color.b += tempStrength * 0.8;
            }
            
            // Clamp to valid range
            color = clamp(color, 0.0, 1.0);
        }
    }
    // For picked colors, keep them unchanged to make them "pop"

    // 5) Output final pixel with full opacity
    gl_FragColor = vec4(color,1.0);
}