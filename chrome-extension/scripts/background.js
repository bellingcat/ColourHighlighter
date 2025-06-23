// Background script for Colour Highlighter Shortcut Extension
// Handles tab capture and communication with the main application

// Store captured streams temporarily
const capturedStreams = new Map();

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Colour Highlighter Shortcut extension installed:', details.reason);
});

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request);

    if (request.type === 'TAB_CAPTURED') {
        handleTabCaptured(request);
        sendResponse({ success: true });
    } else if (request.type === 'REQUEST_STREAM') {
        // Send captured stream info to the main application
        const streamInfo = capturedStreams.get(request.targetTabId);
        sendResponse({ streamInfo });
    }

    return true; // Keep message channel open for async responses
});

async function handleTabCaptured(data) {
    console.log('Handling tab capture:', data);

    try {
        // Store the capture info for the target tab
        capturedStreams.set(data.targetTabId, {
            sourceTabId: data.sourceTabId,
            sourceTabUrl: data.sourceTabUrl,
            timestamp: Date.now()
        });

        // Wait a moment for the target tab to load, then inject content script
        setTimeout(async () => {
            try {
                // Inject content script to communicate with the main app
                await chrome.scripting.executeScript({
                    target: { tabId: data.targetTabId },
                    func: initializeTabCapture,
                    args: [data.sourceTabId, data.sourceTabUrl]
                });

                console.log('Successfully injected content script');
            } catch (error) {
                console.error('Failed to inject content script:', error);
            }
        }, 1000);

        // Clean up old streams after 5 minutes
        setTimeout(() => {
            capturedStreams.delete(data.targetTabId);
        }, 5 * 60 * 1000);

    } catch (error) {
        console.error('Error handling tab capture:', error);
    }
}

// Function to be injected into the main application
function initializeTabCapture(sourceTabId, sourceTabUrl) {
    console.log('Initializing tab capture in main app:', { sourceTabId, sourceTabUrl });

    // Notify the main application that tab capture is ready
    window.postMessage({
        type: 'TAB_CAPTURE_READY',
        sourceTabId: sourceTabId,
        sourceTabUrl: sourceTabUrl
    }, '*');

    // Function to start tab capture using getDisplayMedia optimized for tabs
    window.startTabCapture = async function () {
        try {
            console.log('Starting tab capture with display media...');

            // Use getDisplayMedia with browser surface preference for easier tab selection
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    displaySurface: "browser",  // Prefer browser tabs
                    cursor: "never",            // Don't show cursor for cleaner capture
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 30 }
                },
                audio: false
            });

            console.log('Successfully got display media stream:', stream);
            return stream;
        } catch (error) {
            console.error('Failed to get display media:', error);
            throw error;
        }
    };
} 