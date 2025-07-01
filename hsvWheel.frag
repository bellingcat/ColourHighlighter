precision mediump float;
const float PI = 3.141592653589793;
const float DESAT_FACTOR = 0.5;
#define MAX_TARGETS 8

uniform vec3  u_targetHSV[MAX_TARGETS];
uniform vec3  u_toleranceHSV[MAX_TARGETS];
uniform int   u_operations[MAX_TARGETS]; // 0: union, 1: intersection, 2: difference
uniform int   u_numTargets;
uniform float u_value;
uniform bool  u_highlight;
uniform vec2  u_resolution;

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

bool hueWithin(float h, float t, float tol) {
    float d = abs(h - t);
    return min(d, 1.0 - d) <= tol;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 pos = uv * 2.0 - 1.0;
    float r = length(pos);
    if (r > 1.0) discard;
    float ang = atan(pos.y, pos.x);
    float h = (ang + PI) / (2.0 * PI);
    float s = r;
    float v = u_value;

    float mask = 0.0;

    if (u_highlight) {
        for(int i = 0; i < MAX_TARGETS; ++i) {
            if(i >= u_numTargets) break;
            bool inH = hueWithin(h, u_targetHSV[i].x, u_toleranceHSV[i].x);
            bool inS = abs(s - u_targetHSV[i].y) <= u_toleranceHSV[i].y;
            bool inV = abs(v - u_targetHSV[i].z) <= u_toleranceHSV[i].z;
            float thisMask = (inH && inS && inV) ? 1.0 : 0.0;

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
    }

    float outS = (u_highlight && mask < 0.5) ? s * DESAT_FACTOR : s;
    vec3 rgb = hsv2rgb(vec3(h, outS, v));
    gl_FragColor = vec4(rgb, 1.0);
}