// Popup script for Colour Highlighter Extension

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Popup loaded');

    // Get current tab information (for logging purposes)
    try {
        const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (currentTab) {
            console.log('Current tab:', currentTab.url);
        }
    } catch (error) {
        console.warn('Could not get current tab info:', error);
    }

    // Add pulse animation to button
    const captureBtn = document.getElementById('captureBtn');
    captureBtn.classList.add('pulse');

    // Handle capture button click
    captureBtn.addEventListener('click', async () => {
        console.log('Capture button clicked in popup');

        // Update button state to show capturing
        captureBtn.disabled = true;
        captureBtn.textContent = 'Starting Capture...';
        captureBtn.classList.remove('pulse');

        try {
            // Get current tab again to ensure we have the latest info
            const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!currentTab) {
                throw new Error('No active tab found');
            }

            console.log('Starting tab capture for tab:', currentTab.id);

            // Open the highlighter application first
            const newTab = await chrome.tabs.create({
                url: 'http://127.0.0.1:8000',
                active: true
            });

            console.log('Opened highlighter tab:', newTab.id);

            // Send the captured stream to the background script to pass to the main app
            chrome.runtime.sendMessage({
                type: 'TAB_CAPTURED',
                sourceTabId: currentTab.id,
                targetTabId: newTab.id,
                sourceTabUrl: currentTab.url
            });

            // Close the popup after successful capture
            setTimeout(() => {
                window.close();
            }, 100);

        } catch (error) {
            console.error('Failed to capture tab:', error);

            // Reset button state
            captureBtn.disabled = false;
            captureBtn.textContent = '► START CAPTURE';
            captureBtn.classList.add('pulse');

            // Show error in the notification area
            const notification = document.querySelector('.notification-text');
            let errorMessage = `Error: ${error.message}`;

            if (error.message.includes('capture')) {
                errorMessage += ' Make sure the tab is a regular web page (not chrome:// or extension pages).';
            } else {
                errorMessage += ' Make sure the highlighter server is running on localhost:8000.';
            }

            notification.textContent = errorMessage;
            notification.style.color = '#d32f2f';
            document.querySelector('.notification').style.backgroundColor = '#ffebee';
            document.querySelector('.notification').style.borderColor = '#f44336';
        }
    });
});

// Handle messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Popup received message:', request);

    if (request.type === 'CAPTURE_SUCCESS') {
        // Update UI to show success
        const notification = document.querySelector('.notification-text');
        notification.textContent = 'Tab captured successfully! Opening highlighter...';
        notification.style.color = '#2e7d32';
    }

    sendResponse({ received: true });
});

