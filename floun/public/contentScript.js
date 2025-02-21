// contentScript.js
console.log("Content script is running!");

// Listen for messages from the background script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'runScans') {
        // Log immediately before sending to the background script
        console.log("Content script: Received 'runScans' message.  Sending to background...");
        // Get the page origin
        const pageOrigin = window.location.origin;
        console.log("Content script pageOrigin:", pageOrigin);

        // Send a message to the background script to initiate the scan
        chrome.runtime.sendMessage({ action: 'scanWebsite', pageOrigin: pageOrigin }, (response) => {
            if (response && response.status === 'success') {
                console.log('Scan results received:', response.data);
                sendResponse({ status: 'success', data: response.data });
            } else {
                console.error('Error during scan:', response ? response.message : 'Unknown error');
                sendResponse({ status: 'error', message: response ? response.message : 'Unknown error' });
            }
        });

        return true; // Keep the message channel open for the response
    }
});