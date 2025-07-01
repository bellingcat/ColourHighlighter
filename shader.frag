// shader.frag
precision mediump float;

uniform sampler2D u_video;
uniform vec2      u_texelSize;     // = 1.0 / textureSize
uniform bool     u_enableEdgeDetect; // enable edge detection on mask

#define MAX_TARGETS 8

uniform int   u_numTargets;
uniform vec3  u_targetHSV[MAX_TARGETS];
uniform vec3  u_toleranceHSV[MAX_TARGETS];
uniform int   u_operations[MAX_TARGETS]; // 0: union, 1: intersection, 2: difference

varying vec2      v_texCoord;

// RGB to HSV conversion based on https://en.wikipedia.org/wiki/HSL_and_HSV#General_approach
vec3 rgb2hsv(vec3 colour) {
    float M = max(max(colour.r,colour.g),colour.b);
    float m = min(min(colour.r,colour.g),colour.b);
    float c = M - m;
    float h = 0.0;
    if(c > 0.0001) {
        if(M == colour.r){
            h = mod((colour.g - colour.b) / c, 6.0);
        }else if(M == colour.g){
            h = (colour.b - colour.r) / c + 2.0;
        }else{
            h = (colour.r - colour.g) / c + 4.0;
        }              
        h /= 6.0;
    }
    float s = (M <= 0.0) ? 0.0 : c / M;
    return vec3(h, s, M);
}

// check if two hues are within ±delta, accounting for wrap
bool hueWithin(float h, float targetH, float tolH) {
    float diff = abs(h - targetH);
    diff = min(diff, 1.0 - diff);
    return diff <= tolH;
}

void main() {
    vec4  color = texture2D(u_video, v_texCoord);
    vec3  hsv   = rgb2hsv(color.rgb);

    float mask = 0.0;

    for(int i = 0; i < MAX_TARGETS; ++i) {
        if(i >= u_numTargets) break;

        bool inHue = hueWithin(hsv.x, u_targetHSV[i].x, u_toleranceHSV[i].x);
        bool inSat = abs(hsv.y - u_targetHSV[i].y) <= u_toleranceHSV[i].y;
        bool inVal = abs(hsv.z - u_targetHSV[i].z) <= u_toleranceHSV[i].z;
        float thisMask = (inHue && inSat && inVal) ? 1.0 : 0.0;

        if(i == 0) {
            mask = thisMask;
        } else {
            if(u_operations[i] == 0) { // union
                mask = max(mask, thisMask);
            } else if(u_operations[i] == 1) { // intersection
                mask = mask * thisMask;
            } else if(u_operations[i] == 2) { // difference
                mask = mask * (1.0 - thisMask);
            }
        }
    }

    // base output: color vs grayscale
    vec3 outColor;
    if(mask > 0.5) {
        outColor = color.rgb;
    } else {
        float grayscale = dot(color.rgb, vec3(0.299, 0.587, 0.114)); // using linear luminance grayscale conversion
        outColor = vec3(grayscale);
    }

    // optional edge-detection on mask using laplacian kernel
    if(u_enableEdgeDetect) {

        float edge = 0.0;
        edge += -1.0 * texture2D(u_video, v_texCoord + vec2(-u_texelSize.x, 0.0)).a; // we'll abuse alpha as mask
        edge += -1.0 * texture2D(u_video, v_texCoord + vec2( u_texelSize.x, 0.0)).a;
        edge += -1.0 * texture2D(u_video, v_texCoord + vec2(0.0, -u_texelSize.y)).a;
        edge += -1.0 * texture2D(u_video, v_texCoord + vec2(0.0,  u_texelSize.y)).a;
        edge +=  4.0 * mask;

        // threshold for “edge”
        if(edge > 0.5) {
            // invert the *detected* (original) color for highlight
            outColor = vec3(1.0) - color.rgb;
        }
    }

    gl_FragColor = vec4(outColor, 1.0);
}
