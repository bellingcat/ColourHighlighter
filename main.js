// Import filterConfigs from configs.js
import { filterConfigs } from "./configs.js";

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

let currentLUT = "LUTs/blue-isolated.png";
let lutTexture = null;
let lutImage = null;
let lutLocation = null;
let glProgram = null;
let u_enableLUT = null;
let u_enableChromaKey = null;
let u_enableColorCorrection = null;
let u_numChromaKeys = null;
let u_numColorCorrections = null;
let u_ckey_color = null, u_ckey_similarity = null, u_ckey_smoothness = null, u_ckey_spill = null;
let u_ccor_gamma = null, u_ccor_contrast = null, u_ccor_saturation = null;
let lutEnabled = true;
let pendingFilterConfig = null; // Store config to apply when WebGL is ready

// Add support for enabling/disabling LUT in the shader
async function loadLUTTexture(lutFile) {
    if (!lutTexture) {
        lutTexture = gl.createTexture();
    }
    lutImage = new Image();
    lutImage.src = lutFile.startsWith("LUTs/") || lutFile === "none" ? lutFile : "LUTs/" + lutFile;
    await lutImage.decode();

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, lutTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, lutImage);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

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

    // LUT Texture
    lutLocation = gl.getUniformLocation(program, "u_lut");
    u_enableLUT = gl.getUniformLocation(program, "u_enableLUT");
    u_enableChromaKey = gl.getUniformLocation(program, "u_enableChromaKey");
    u_enableColorCorrection = gl.getUniformLocation(program, "u_enableColorCorrection");
    u_numChromaKeys = gl.getUniformLocation(program, "u_numChromaKeys");
    u_numColorCorrections = gl.getUniformLocation(program, "u_numColorCorrections");
    u_ckey_color = gl.getUniformLocation(program, "u_ckey_color");
    u_ckey_similarity = gl.getUniformLocation(program, "u_ckey_similarity");
    u_ckey_smoothness = gl.getUniformLocation(program, "u_ckey_smoothness");
    u_ckey_spill = gl.getUniformLocation(program, "u_ckey_spill");
    u_ccor_gamma = gl.getUniformLocation(program, "u_ccor_gamma");
    u_ccor_contrast = gl.getUniformLocation(program, "u_ccor_contrast");
    u_ccor_saturation = gl.getUniformLocation(program, "u_ccor_saturation");

    // Apply pending filter config if it exists, otherwise use original filter
    if (pendingFilterConfig) {
        await setFilter(pendingFilterConfig);
        pendingFilterConfig = null;
    } else {
        // Fallback to original filter
        const originalFilter = filterConfigs.find(f => f.id === "original");
        if (originalFilter) {
            await setFilter(originalFilter);
        }
    }

    // Video Texture
    const videoTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, videoTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const videoLocation = gl.getUniformLocation(program, "u_video");
    gl.uniform1i(videoLocation, 0); // texture unit 0

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

async function setFilter(config) {
    gl.useProgram(glProgram);

    // Chroma Key
    const chromaKeys = config.chromaKeys || [];
    gl.uniform1i(u_numChromaKeys, chromaKeys.length);
    const ckey_color = fillArray(chromaKeys.map(k => k.ckey_color), [0, 0, 0]);
    const ckey_similarity = fillArray(chromaKeys.map(k => k.ckey_similarity), 0.0);
    const ckey_smoothness = fillArray(chromaKeys.map(k => k.ckey_smoothness), 0.0);
    const ckey_spill = fillArray(chromaKeys.map(k => k.ckey_spill), 0.0);
    gl.uniform3fv(u_ckey_color, ckey_color.flat());
    gl.uniform1fv(u_ckey_similarity, ckey_similarity);
    gl.uniform1fv(u_ckey_smoothness, ckey_smoothness);
    gl.uniform1fv(u_ckey_spill, ckey_spill);

    // Color Correction
    const colorCorrections = config.colorCorrections || [];
    gl.uniform1i(u_numColorCorrections, colorCorrections.length);
    const ccor_gamma = fillArray(colorCorrections.map(c => c.gamma), 0.0);
    const ccor_contrast = fillArray(colorCorrections.map(c => c.contrast), 0.0);
    const ccor_saturation = fillArray(colorCorrections.map(c => c.saturation), 1.0);
    gl.uniform1fv(u_ccor_gamma, ccor_gamma);
    gl.uniform1fv(u_ccor_contrast, ccor_contrast);
    gl.uniform1fv(u_ccor_saturation, ccor_saturation);

    // LUT
    if (!config.enableLUT) {
        lutEnabled = false;
        gl.uniform1i(u_enableLUT, 0);
    } else {
        lutEnabled = true;
        await loadLUTTexture(config.lut);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, lutTexture);
        gl.uniform1i(lutLocation, 1);
        gl.uniform1i(u_enableLUT, 1);
    }
}

// UI State Management
let currentStream = null;

function showHighlighterOptions() {
    document.querySelector('.start-capture-section').classList.add('hide');
    document.querySelector('.highlighter-options').classList.add('show');
}

function showStartCaptureSection() {
    document.querySelector('.start-capture-section').classList.remove('hide');
    document.querySelector('.highlighter-options').classList.remove('show');
}

function stopScreenCapture() {
    if (currentStream) {
        // Stop all tracks in the stream
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;

        // Hide canvas
        canvas.style.display = "none";

        // Reset UI to initial state
        showStartCaptureSection();

        // Clear video source
        video.srcObject = null;
    }
}

// Start screen capture and render loop
async function start() {
    const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
    });

    // Store stream reference for stopping
    currentStream = stream;
    video.srcObject = stream;

    // Ensure compatibility with Chrome/Safari
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;

    // Show canvas when sharing starts
    canvas.style.display = "";

    // Switch UI to show highlighter options
    showHighlighterOptions();

    // Hide canvas and restore UI when sharing stops naturally
    stream.getVideoTracks()[0].addEventListener("ended", () => {
        canvas.style.display = "none";
        showStartCaptureSection();
        currentStream = null;
    });

    const { videoTexture } = await initGL();

    function render() {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, videoTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);

        if (lutEnabled) {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, lutTexture);
        }

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

document.getElementById("stopBtn").addEventListener("click", () => {
    stopScreenCapture();
});

// Populate the highlighter dropdown with options from filterConfigs
const highlighterSelect = document.querySelector("#highlighterSelect");

// Clear existing options (if any)
highlighterSelect.innerHTML = '';

// Dynamically create dropdown options from filterConfigs
filterConfigs.forEach((filter, idx) => {
    const option = document.createElement("option");
    option.value = filter.id;
    option.textContent = filter.name || filter.id;
    if (idx === 0) option.selected = true; // Original as default
    highlighterSelect.appendChild(option);
});

// Add event listener for dropdown changes
highlighterSelect.addEventListener("change", async (event) => {
    const selectedFilterId = event.target.value;
    const selectedFilter = filterConfigs.find(f => f.id === selectedFilterId);
    if (selectedFilter) {
        // Remove active state from reset button when preset is selected
        resetBtn.classList.remove("active");
        await setFilter(selectedFilter);
    }
});

// Set initial config on load
setFilter(filterConfigs.find(f => f.id === "original")); // Original as default

// Custom Color Picker Functionality
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
    ] : null;
}

function rgbToHex(r, g, b) {
    const toHex = (n) => {
        const hex = Math.round(n * 255).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function createCustomColorFilter(hexColor) {
    const rgbColor = hexToRgb(hexColor);
    if (!rgbColor) return null;

    return {
        id: "custom",
        name: "Custom",
        lut: null,
        enableLUT: false,
        enableGreyscale: false,
        chromaKeys: [
            {
                ckey_color: rgbColor,
                ckey_similarity: 0.1, // Fixed sensitivity value
                ckey_smoothness: 10.0,
                ckey_spill: 50.0
            }
        ],
        colorCorrections: [
            {
                gamma: 0.0,
                contrast: 0.3,
                saturation: 2.0
            }
        ]
    };
}

// Get UI elements
const colorPicker = document.getElementById("colorPicker");
const hexInput = document.getElementById("hexInput");
const resetBtn = document.getElementById("applyCustomColor");
const eyedropperBtn = document.getElementById("eyedropperBtn");
const magnifier = document.getElementById("magnifier");
const magnifierCanvas = document.getElementById("magnifierCanvas");
const magnifierCtx = magnifierCanvas.getContext("2d");

// Eyedropper state
let eyedropperMode = false;

// Magnifier settings
const MAGNIFIER_SIZE = 12; // 12x12 pixel sample area
const MAGNIFIER_ZOOM = 10; // 10x zoom level
const MAGNIFIER_CANVAS_SIZE = 120; // Canvas size in pixels

// Function to update magnifier position and content
function updateMagnifier(mouseX, mouseY) {
    if (!eyedropperMode) return;

    // Position magnifier near cursor but not covering it
    const offsetX = 30;
    const offsetY = -150;
    let magnifierX = mouseX + offsetX;
    let magnifierY = mouseY + offsetY;

    // Keep magnifier on screen
    const rect = document.body.getBoundingClientRect();
    if (magnifierX + 120 > window.innerWidth) magnifierX = mouseX - 120 - offsetX;
    if (magnifierY < 0) magnifierY = mouseY + offsetX;

    magnifier.style.left = magnifierX + 'px';
    magnifier.style.top = magnifierY + 'px';

    // Sample pixels from WebGL canvas after next render
    requestAnimationFrame(() => {
        try {
            // Make sure we're using the correct WebGL context
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            // Sample pixels from WebGL canvas
            const rect2 = canvas.getBoundingClientRect();
            const canvasX = mouseX - rect2.left;
            const canvasY = mouseY - rect2.top;

            // Convert to WebGL coordinates
            const glX = Math.floor(canvasX * canvas.width / rect2.width);
            const glY = Math.floor((rect2.height - canvasY) * canvas.height / rect2.height);

            // Sample area around cursor
            const halfSize = Math.floor(MAGNIFIER_SIZE / 2);
            const sampleX = Math.max(0, Math.min(canvas.width - MAGNIFIER_SIZE, glX - halfSize));
            const sampleY = Math.max(0, Math.min(canvas.height - MAGNIFIER_SIZE, glY - halfSize));

            // Read pixel data from WebGL
            const pixels = new Uint8Array(MAGNIFIER_SIZE * MAGNIFIER_SIZE * 4);
            gl.readPixels(sampleX, sampleY, MAGNIFIER_SIZE, MAGNIFIER_SIZE, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

            // Debug: Log some pixel values
            console.log('Magnifier pixels sample:', pixels.slice(0, 12));

            // Create ImageData and draw magnified version
            const imageData = new ImageData(MAGNIFIER_SIZE, MAGNIFIER_SIZE);
            imageData.data.set(pixels);

            // Clear magnifier canvas
            magnifierCtx.clearRect(0, 0, MAGNIFIER_CANVAS_SIZE, MAGNIFIER_CANVAS_SIZE);

            // Disable smoothing for pixelated effect
            magnifierCtx.imageSmoothingEnabled = false;

            // Create temporary canvas for the sample
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = MAGNIFIER_SIZE;
            tempCanvas.height = MAGNIFIER_SIZE;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.putImageData(imageData, 0, 0);

            // Draw magnified version (flipped vertically to correct WebGL coordinate system)
            magnifierCtx.save();
            magnifierCtx.scale(1, -1);
            magnifierCtx.drawImage(tempCanvas, 0, -MAGNIFIER_CANVAS_SIZE, MAGNIFIER_CANVAS_SIZE, MAGNIFIER_CANVAS_SIZE);
            magnifierCtx.restore();

        } catch (error) {
            console.warn("Could not update magnifier:", error);
        }
    });
}

// Function to sample color from canvas at coordinates
function sampleColorFromCanvas(x, y) {
    return new Promise((resolve) => {
        // Convert screen coordinates to WebGL coordinates
        const rect = canvas.getBoundingClientRect();
        const canvasX = x - rect.left;
        const canvasY = y - rect.top;

        // Convert to WebGL pixel coordinates (flip Y axis)
        const glX = Math.floor(canvasX * canvas.width / rect.width);
        const glY = Math.floor((rect.height - canvasY) * canvas.height / rect.height);

        // Ensure we read pixels after the next render frame
        requestAnimationFrame(() => {
            try {
                // Make sure we're using the correct WebGL context
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);

                // Read pixel data from WebGL context
                const pixels = new Uint8Array(4);
                gl.readPixels(glX, glY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

                // Debug logging
                console.log('Sampled pixel:', pixels[0], pixels[1], pixels[2], pixels[3]);

                // Convert to hex
                const hex = rgbToHex(pixels[0] / 255, pixels[1] / 255, pixels[2] / 255);
                resolve(hex);
            } catch (error) {
                console.error('Error reading pixels:', error);
                resolve('#000000');
            }
        });
    });
}

// Toggle eyedropper mode
eyedropperBtn.addEventListener("click", () => {
    eyedropperMode = !eyedropperMode;

    if (eyedropperMode) {
        eyedropperBtn.classList.add("active");
        canvas.classList.add("eyedropper-mode");
        eyedropperBtn.innerHTML = '<span>🎯</span> Click to Sample';
    } else {
        eyedropperBtn.classList.remove("active");
        canvas.classList.remove("eyedropper-mode");
        magnifier.style.display = 'none';
        eyedropperBtn.innerHTML = '<span>🎯</span> Pick from Canvas';
    }
});

// Canvas click handler for color sampling
canvas.addEventListener("click", async (event) => {
    if (!eyedropperMode) return;

    try {
        const sampledColor = await sampleColorFromCanvas(event.clientX, event.clientY);

        console.log('Sampled color:', sampledColor);

        // Update color picker and hex input
        colorPicker.value = sampledColor;
        hexInput.value = sampledColor;

        // Auto-apply the sampled color
        const customFilter = createCustomColorFilter(sampledColor);

        if (customFilter) {
            // Reset dropdown to show custom selection (no specific preset selected)
            // Note: We don't change the dropdown value here to maintain user's last selection

            // Add active state to reset button
            resetBtn.classList.add("active");

            setFilter(customFilter);
        }

        // Turn off eyedropper mode after sampling
        eyedropperMode = false;
        eyedropperBtn.classList.remove("active");
        canvas.classList.remove("eyedropper-mode");
        magnifier.style.display = 'none';
        eyedropperBtn.innerHTML = '<span>🎯</span> Pick from Canvas';

    } catch (error) {
        console.warn("Could not sample color:", error);
    }
});

// Canvas mouse movement for magnifier
canvas.addEventListener("mousemove", (event) => {
    if (!eyedropperMode) return;

    magnifier.style.display = 'block';
    updateMagnifier(event.clientX, event.clientY);
});

// Hide magnifier when mouse leaves canvas
canvas.addEventListener("mouseleave", () => {
    magnifier.style.display = 'none';
});



// Color picker change event
colorPicker.addEventListener("change", () => {
    hexInput.value = colorPicker.value;
});

// Hex input change event
hexInput.addEventListener("input", () => {
    const hex = hexInput.value;
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
        colorPicker.value = hex;
    }
});

// Validate and format hex input on blur
hexInput.addEventListener("blur", () => {
    let hex = hexInput.value.trim();
    if (!hex.startsWith("#")) {
        hex = "#" + hex;
    }
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
        hexInput.value = hex.toUpperCase();
        colorPicker.value = hex;
    } else {
        // Reset to color picker value if invalid
        hexInput.value = colorPicker.value;
    }
});

// Reset to original filter
resetBtn.addEventListener("click", async () => {
    // Reset to original filter (no filter)
    const originalFilter = filterConfigs.find(f => f.id === "original");
    if (originalFilter) {
        // Reset dropdown to original selection
        highlighterSelect.value = "original";

        // Remove active state from reset button
        resetBtn.classList.remove("active");

        await setFilter(originalFilter);
    }
});

// Note: Custom color button active state is already handled in the dropdown change event above

// Draggable control panel functionality
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let hasDragged = false;
let currentPosition = { x: 20, y: 20 }; // Track actual position

const controlPane = document.getElementById('control-pane');

// Control panel state persistence
const CONTROL_PANEL_STORAGE_KEY = 'controlPanelState';

function saveControlPanelState() {
    const state = {
        position: currentPosition,
        collapsed: controlPane.classList.contains('collapsed')
    };
    localStorage.setItem(CONTROL_PANEL_STORAGE_KEY, JSON.stringify(state));
}

function loadControlPanelState() {
    try {
        const savedState = localStorage.getItem(CONTROL_PANEL_STORAGE_KEY);
        if (savedState) {
            const state = JSON.parse(savedState);

            // Restore position
            if (state.position && typeof state.position.x === 'number' && typeof state.position.y === 'number') {
                // Ensure position is within current viewport bounds
                const maxX = window.innerWidth - controlPane.offsetWidth;
                const maxY = window.innerHeight - controlPane.offsetHeight;

                currentPosition.x = Math.max(0, Math.min(maxX, state.position.x));
                currentPosition.y = Math.max(0, Math.min(maxY, state.position.y));

                controlPane.style.left = currentPosition.x + 'px';
                controlPane.style.top = currentPosition.y + 'px';
            }

            // Restore collapsed state
            if (state.collapsed === true) {
                controlPane.classList.add('collapsed');
            } else {
                controlPane.classList.remove('collapsed');
            }
        }
    } catch (error) {
        console.warn('Failed to load control panel state:', error);
        // Use default position and state if loading fails
    }
}

// Load saved state when page loads
loadControlPanelState();

// Adjust position on window resize to keep panel in bounds
window.addEventListener('resize', () => {
    const maxX = window.innerWidth - controlPane.offsetWidth;
    const maxY = window.innerHeight - controlPane.offsetHeight;

    // Adjust position if needed
    const newX = Math.max(0, Math.min(maxX, currentPosition.x));
    const newY = Math.max(0, Math.min(maxY, currentPosition.y));

    if (newX !== currentPosition.x || newY !== currentPosition.y) {
        currentPosition.x = newX;
        currentPosition.y = newY;
        controlPane.style.left = newX + 'px';
        controlPane.style.top = newY + 'px';
        saveControlPanelState(); // Save adjusted position
    }
});

// Collapse button functionality
const collapseBtn = document.getElementById('collapseBtn');
collapseBtn.addEventListener('click', (e) => {
    controlPane.classList.add('collapsed');
    saveControlPanelState(); // Save state when collapsed
    e.preventDefault();
    e.stopPropagation();
});

// Click on collapsed pane to expand (but not if we just finished dragging)
controlPane.addEventListener('click', (e) => {
    if (controlPane.classList.contains('collapsed') && !hasDragged) {
        controlPane.classList.remove('collapsed');
        saveControlPanelState(); // Save state when expanded
        e.preventDefault();
        e.stopPropagation();
    }
    // Reset drag flag after a short delay to allow for genuine clicks
    setTimeout(() => {
        hasDragged = false;
    }, 100);
});

// Mouse down event - start dragging immediately
controlPane.addEventListener('mousedown', (e) => {
    // Don't start dragging if clicking on the collapse button
    if (e.target.id === 'collapseBtn') {
        return;
    }

    // Only start drag if clicking on the drag handle area (top 40px) or empty areas (when expanded)
    // When collapsed, the entire area is draggable
    const rect = controlPane.getBoundingClientRect();
    const isCollapsed = controlPane.classList.contains('collapsed');
    const isInDragArea = isCollapsed || e.clientY - rect.top < 40;
    const isEmptyArea = isCollapsed || !e.target.closest('button, input, select, div[style*="margin-bottom"]');

    if (isInDragArea || isEmptyArea) {
        isDragging = true;
        hasDragged = false; // Reset at start of drag
        controlPane.classList.add('dragging');

        // Calculate offset from mouse to top-left corner of panel
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;

        e.preventDefault(); // Prevent text selection
    }
});

// Mouse move event - perform dragging
document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    hasDragged = true; // Mark that we've actually moved during drag

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    // Keep panel within viewport bounds
    const maxX = window.innerWidth - controlPane.offsetWidth;
    const maxY = window.innerHeight - controlPane.offsetHeight;

    const constrainedX = Math.max(0, Math.min(maxX, newX));
    const constrainedY = Math.max(0, Math.min(maxY, newY));

    // Update current position and apply directly
    currentPosition.x = constrainedX;
    currentPosition.y = constrainedY;
    controlPane.style.left = constrainedX + 'px';
    controlPane.style.top = constrainedY + 'px';
});

// Mouse up event - stop dragging
document.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        controlPane.classList.remove('dragging');
        // Position is already set correctly in mousemove, no need to convert
        if (hasDragged) {
            saveControlPanelState(); // Save position after dragging
        }
    }
});

// Touch events for mobile support
let touchStartPos = { x: 0, y: 0 };

controlPane.addEventListener('touchstart', (e) => {
    // Don't start dragging if touching the collapse button
    if (e.target.id === 'collapseBtn') {
        return;
    }

    const rect = controlPane.getBoundingClientRect();
    const touch = e.touches[0];
    const isCollapsed = controlPane.classList.contains('collapsed');
    const isInDragArea = isCollapsed || touch.clientY - rect.top < 40;
    const isEmptyArea = isCollapsed || !e.target.closest('button, input, select, div[style*="margin-bottom"]');

    // Store touch start position
    touchStartPos.x = touch.clientX;
    touchStartPos.y = touch.clientY;

    // Start dragging IMMEDIATELY - no delays or conditions
    if (isInDragArea || isEmptyArea) {
        isDragging = true;
        hasDragged = false; // Reset at start of drag
        controlPane.classList.add('dragging');

        dragOffset.x = touch.clientX - rect.left;
        dragOffset.y = touch.clientY - rect.top;

        e.preventDefault();
    }
});

document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;

    hasDragged = true; // Mark that we've actually moved during drag

    const touch = e.touches[0];
    const newX = touch.clientX - dragOffset.x;
    const newY = touch.clientY - dragOffset.y;

    const maxX = window.innerWidth - controlPane.offsetWidth;
    const maxY = window.innerHeight - controlPane.offsetHeight;

    const constrainedX = Math.max(0, Math.min(maxX, newX));
    const constrainedY = Math.max(0, Math.min(maxY, newY));

    // Update current position and apply directly
    currentPosition.x = constrainedX;
    currentPosition.y = constrainedY;
    controlPane.style.left = constrainedX + 'px';
    controlPane.style.top = constrainedY + 'px';

    e.preventDefault();
});

document.addEventListener('touchend', (e) => {
    if (isDragging) {
        isDragging = false;
        controlPane.classList.remove('dragging');
        // Position is already set correctly in touchmove, no need to convert
        if (hasDragged) {
            saveControlPanelState(); // Save position after touch dragging
        }
    }
});