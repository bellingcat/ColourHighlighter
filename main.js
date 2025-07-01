const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl");
const video = document.getElementById("video");

const wheelCanvas = document.getElementById('wheel');
const wGL = wheelCanvas.getContext('webgl');

// Hide canvas initially
canvas.style.display = "none";

// Resize canvas to fill screen
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// DOM elements
const valueRange = document.getElementById('valueRange');
const valLowMarker = document.getElementById('valLowMarker');
const valHighMarker = document.getElementById('valHighMarker');
const hueTol = document.getElementById('hueTol');
const satTol = document.getElementById('satTol');
const valTol = document.getElementById('valTol');
const resetBtn = document.getElementById('resetBtn');
const debugHSV = document.getElementById('debugHSV');
const debugTol = document.getElementById('debugTol');

let glProgram = null;
let u_targetHSV = null;
let u_toleranceHSV = null;
let u_operations = null; // Add this line
let u_numTargets = null; // Add this line
let u_enableEdgeDetect = null;
let u_texelSize = null;

const wheelLocs = {
    targetHSV: null,
    toleranceHSV: null,
    operations: null,      // Add this line
    numTargets: null,      // Add this line
    value: null,
    highlight: null,
    resolution: null
};

const defaults = { tolHSV: [0.05, 0.2, 0.2] };
const state = {
    targetHSV: [0, 0, 1],
    tolHSV: [...defaults.tolHSV],
    value: 1,
    highlight: false
};

// Utility: load shader
async function loadShaderFromFile(file, type, glContext = gl) {
    const res = await fetch(file);
    const src = await res.text();
    return compileShader(src, type, glContext);
}

// Utility: compile shader from source
function compileShader(src, type, glContext = gl) {
    const shader = glContext.createShader(type);
    glContext.shaderSource(shader, src);
    glContext.compileShader(shader);
    if (!glContext.getShaderParameter(shader, glContext.COMPILE_STATUS)) {
        console.error(glContext.getShaderInfoLog(shader));
    }
    return shader;
}

async function initWheelGL() {
    
    // HSV wheel shader setup
    // -------------------------

    const wheelVertexShaderSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;
    const wheelVertexShader = compileShader(wheelVertexShaderSource, wGL.VERTEX_SHADER, wGL);
    const wheelFragmentShader = await loadShaderFromFile('hsvWheel.frag', wGL.FRAGMENT_SHADER, wGL);

    const wheelProgram = wGL.createProgram();
    wGL.attachShader(wheelProgram, wheelVertexShader);
    wGL.attachShader(wheelProgram, wheelFragmentShader);
    wGL.linkProgram(wheelProgram);
    wGL.useProgram(wheelProgram);

    // Fullscreen quad
    const quadBuf = wGL.createBuffer();
    wGL.bindBuffer(wGL.ARRAY_BUFFER, quadBuf);
    wGL.bufferData(wGL.ARRAY_BUFFER, new Float32Array([
        -1, -1,
        1, -1,
        -1, 1,
        1, 1
    ]), wGL.STATIC_DRAW);
    const aPos = wGL.getAttribLocation(wheelProgram, 'a_position');
    wGL.enableVertexAttribArray(aPos);
    wGL.vertexAttribPointer(aPos, 2, wGL.FLOAT, false, 0, 0);

    wheelLocs.targetHSV = wGL.getUniformLocation(wheelProgram, 'u_targetHSV');
    wheelLocs.toleranceHSV = wGL.getUniformLocation(wheelProgram, 'u_toleranceHSV');
    wheelLocs.operations = wGL.getUniformLocation(wheelProgram, 'u_operations'); // Add this line
    wheelLocs.numTargets = wGL.getUniformLocation(wheelProgram, 'u_numTargets'); // Add this line
    wheelLocs.value = wGL.getUniformLocation(wheelProgram, 'u_value');
    wheelLocs.highlight = wGL.getUniformLocation(wheelProgram, 'u_highlight');
    wheelLocs.resolution = wGL.getUniformLocation(wheelProgram, 'u_resolution');

    wGL.uniform2f(wheelLocs.resolution, wheelCanvas.width, wheelCanvas.height);
}

async function initGL() {

    // Main canvas shader setup
    // -------------------------
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
    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);

    const fragmentShader = await loadShaderFromFile('shader.frag', gl.FRAGMENT_SHADER);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    glProgram = program;

    const u_scale = gl.getUniformLocation(program, "u_scale");

    function updateScale() {
        const canvasAspect = canvas.width / canvas.height;
        const videoAspect = video.videoWidth / video.videoHeight || 1;
        let scaleX = 1, scaleY = 1;
        if (canvasAspect > videoAspect) {
            scaleX = videoAspect / canvasAspect;
        } else {
            scaleY = canvasAspect / videoAspect;
        }
        gl.useProgram(program);
        gl.uniform2f(u_scale, scaleX, scaleY);
    }
    window.addEventListener("resize", updateScale);
    video.addEventListener("loadedmetadata", updateScale);
    updateScale();

    // Quad
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
        -1, -1, 0, 1,
        1, -1, 1, 1,
        -1, 1, 0, 0,
        1, 1, 1, 0
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const a_position = gl.getAttribLocation(program, "a_position");
    const a_texCoord = gl.getAttribLocation(program, "a_texCoord");
    gl.enableVertexAttribArray(a_position);
    gl.enableVertexAttribArray(a_texCoord);
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 16, 8);


    u_targetHSV = gl.getUniformLocation(program, "u_targetHSV");
    u_toleranceHSV = gl.getUniformLocation(program, "u_toleranceHSV");
    u_operations = gl.getUniformLocation(program, "u_operations"); // Add this line
    u_numTargets = gl.getUniformLocation(program, "u_numTargets"); // Add this line
    u_enableEdgeDetect = gl.getUniformLocation(program, "u_enableEdgeDetect");
    u_texelSize = gl.getUniformLocation(program, "u_texelSize");


    // Video Texture
    const videoTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, videoTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const videoLocation = gl.getUniformLocation(program, "u_video");
    gl.uniform1i(videoLocation, 0); // texture unit 0

    // Example: set up for a single target (for now, until UI is updated)
    // You can expand this to multiple targets later
    const MAX_TARGETS = 8;
    const targetHSVArray = new Float32Array(MAX_TARGETS * 3);
    const toleranceHSVArray = new Float32Array(MAX_TARGETS * 3);
    const operationsArray = new Int32Array(MAX_TARGETS);

    // Fill first entry with state, rest with zeros/defaults
    targetHSVArray.set(state.targetHSV, 0);
    toleranceHSVArray.set(state.tolHSV, 0);
    operationsArray[0] = 0; // 0: union

    gl.useProgram(program);
    gl.uniform1i(u_numTargets, 1);
    gl.uniform3fv(u_targetHSV, targetHSVArray);
    gl.uniform3fv(u_toleranceHSV, toleranceHSVArray);
    gl.uniform1iv(u_operations, operationsArray);

    gl.uniform1i(u_enableEdgeDetect, true);

    return { videoTexture };
}



// Helper to fill arrays to length 4 with defaults
function fillArray(arr, def, len = 4) {
    const out = [];
    for (let i = 0; i < len; ++i) {
        out.push(arr[i] !== undefined ? arr[i] : def);
    }
    return out;
}

// Helper to convert HSV to RGB for CSS
function hsvToCss(h, s, v) {
    let r, g, b;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

function updateSliderGradient() {
    const [h, s] = state.targetHSV;
    const start = hsvToCss(h, s, 0);
    const end = hsvToCss(h, s, 1);
    valueRange.style.background = `linear-gradient(to right, ${start}, ${end})`;
}

function updateValueMarkers() {
    const lowPct = Math.max(0, state.value - state.tolHSV[2]) * 100;
    const highPct = Math.min(1, state.value + state.tolHSV[2]) * 100;
    valLowMarker.style.left = lowPct + '%';
    valHighMarker.style.left = highPct + '%';
}

function updateDebugText() {
    debugHSV.textContent = `(${state.targetHSV.map(v => v.toFixed(2)).join(', ')})`;
    debugTol.textContent = `(${state.tolHSV.map(v => v.toFixed(2)).join(', ')})`;
}


// Helper to update uniforms when state changes
function updateGLUniforms() {
    if (glProgram && u_targetHSV && u_toleranceHSV && u_operations && u_numTargets) {
        gl.useProgram(glProgram);
        const MAX_TARGETS = 8;
        const targetHSVArray = new Float32Array(MAX_TARGETS * 3);
        const toleranceHSVArray = new Float32Array(MAX_TARGETS * 3);
        const operationsArray = new Int32Array(MAX_TARGETS);

        // Fill first entry with state, rest with zeros/defaults
        targetHSVArray.set(state.targetHSV, 0);
        toleranceHSVArray.set(state.tolHSV, 0);
        operationsArray[0] = 0; // 0: union

        gl.uniform1i(u_numTargets, 1);
        gl.uniform3fv(u_targetHSV, targetHSVArray);
        gl.uniform3fv(u_toleranceHSV, toleranceHSVArray);
        gl.uniform1iv(u_operations, operationsArray);
    }
}

// Start screen capture and render loop
async function start() {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    video.srcObject = stream;

    // Ensure compatibility with Chrome/Safari
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;

    // Show canvas when sharing starts
    canvas.style.display = "";

    // Hide canvas when sharing stops
    stream.getVideoTracks()[0].addEventListener("ended", () => {
        canvas.style.display = "none";
    });

    const { videoTexture } = await initGL();

    function render() {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, videoTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);


        gl.uniform2f(u_texelSize,
            1.0 / video.videoWidth,
            1.0 / video.videoHeight
        );

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        requestAnimationFrame(render);
    }

    // Wait for video metadata, then play and render
    video.onloadedmetadata = () => {
        video.play().then(() => {
            render();
        });
        video.onloadedmetadata = null;
    };

    // If video is already ready, play and render immediately
    if (video.readyState >= 1) { // HAVE_METADATA
        video.play().then(() => {
            render();
        });
    }
}

// UI event handlers
// -----------------

document.getElementById("startBtn").addEventListener("click", () => {
    start();
});

function renderWheel() {
    const MAX_TARGETS = 8;
    const targetHSVArray = new Float32Array(MAX_TARGETS * 3);
    const toleranceHSVArray = new Float32Array(MAX_TARGETS * 3);
    const operationsArray = new Int32Array(MAX_TARGETS);

    // Fill first entry with state, rest with zeros/defaults
    targetHSVArray.set(state.targetHSV, 0);
    toleranceHSVArray.set(state.tolHSV, 0);
    operationsArray[0] = 0; // 0: union

    wGL.useProgram(wGL.getParameter(wGL.CURRENT_PROGRAM));
    wGL.uniform1i(wheelLocs.numTargets, 1);
    wGL.uniform3fv(wheelLocs.targetHSV, targetHSVArray);
    wGL.uniform3fv(wheelLocs.toleranceHSV, toleranceHSVArray);
    wGL.uniform1iv(wheelLocs.operations, operationsArray);
    wGL.uniform1f(wheelLocs.value, state.value);
    wGL.uniform1i(wheelLocs.highlight, state.highlight);
    wGL.drawArrays(wGL.TRIANGLE_STRIP, 0, 4);
    updateSliderGradient();
    updateValueMarkers();
    updateDebugText();
}

valueRange.addEventListener('input', e => {
    state.value = parseFloat(e.target.value);
    state.targetHSV[2] = state.value;
    state.highlight = true;
    updateGLUniforms();
    renderWheel();
});
hueTol.addEventListener('input', e => {
    state.tolHSV[0] = parseFloat(e.target.value);
    state.highlight = true;
    updateGLUniforms();
    renderWheel();
});
satTol.addEventListener('input', e => {
    state.tolHSV[1] = parseFloat(e.target.value);
    state.highlight = true;
    updateGLUniforms();
    renderWheel();
});
valTol.addEventListener('input', e => {
    state.tolHSV[2] = parseFloat(e.target.value);
    state.highlight = true;
    updateGLUniforms();
    renderWheel();
});
resetBtn.addEventListener('click', () => {
    state.tolHSV = [...defaults.tolHSV];
    hueTol.value = defaults.tolHSV[0];
    satTol.value = defaults.tolHSV[1];
    valTol.value = defaults.tolHSV[2];
    state.highlight = false;
    updateGLUniforms();
    renderWheel();
});

// Wheel interaction
let dragging = false;
wheelCanvas.addEventListener('mousedown', e => { dragging = true; onPointer(e); });
wheelCanvas.addEventListener('mousemove', e => { if (dragging) onPointer(e); });
window.addEventListener('mouseup', () => { dragging = false; });
function onPointer(e) {
    const rect = wheelCanvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const nx = (px / rect.width) * 2 - 1;
    const ny = 1 - (py / rect.height) * 2;
    const r = Math.hypot(nx, ny);
    if (r > 1) return;
    const ang = Math.atan2(ny, nx);
    const hue = (ang + Math.PI) / (2 * Math.PI);
    state.targetHSV[0] = hue;
    state.targetHSV[1] = r;
    state.highlight = true;
    updateGLUniforms();
    renderWheel();
}

await initWheelGL();
renderWheel();

