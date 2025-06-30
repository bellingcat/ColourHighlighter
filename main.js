const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl");
const video = document.getElementById("video");


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

// Utility: load shader
async function loadShaderFromFile(file, type) {
    const res = await fetch(file);
    const src = await res.text();
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader));
    }
    return shader;
}

let glProgram = null;
let u_targetHSV = null;
let u_toleranceHSV = null;
let u_enableEdgeDetect = null;
let u_texelSize = null;

async function initGL() {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    uniform vec2 u_scale;
    void main() {
      v_texCoord = a_texCoord;
      gl_Position = vec4(a_position * u_scale, 0, 1);
    }
  `);
    gl.compileShader(vertexShader);

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

    gl.uniform3f(u_targetHSV, 0.6, 1.0, 1.0);
    gl.uniform3f(u_toleranceHSV, 0.1, 0.5, 0.5);
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

// Button event listeners
document.getElementById("startBtn").addEventListener("click", () => {
    start();
});

