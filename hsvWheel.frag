precision mediump float;
      const float PI = 3.141592653589793;
      uniform vec3 u_targetHSV;
      uniform vec3 u_toleranceHSV;
      uniform float u_value;
      uniform bool u_highlight;
      uniform vec2 u_resolution;
      const float DESAT_FACTOR = 0.5;

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
          bool inH = hueWithin(h, u_targetHSV.x, u_toleranceHSV.x);
          bool inS = abs(s - u_targetHSV.y) <= u_toleranceHSV.y;
          bool inV = abs(v - u_targetHSV.z) <= u_toleranceHSV.z;
          mask = (inH && inS && inV) ? 1.0 : 0.0;
        }

        float outS = (u_highlight && mask < 0.5) ? s * DESAT_FACTOR : s;
        vec3 rgb = hsv2rgb(vec3(h, outS, v));
        gl_FragColor = vec4(rgb, 1.0);
      }