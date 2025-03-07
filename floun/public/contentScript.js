// contentScript.js
// console.log("Content script is running!");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'runScans') {
    const pageOrigin = window.location.origin;
    const url_info = request.data

    chrome.runtime.sendMessage({ action: 'scanWebsite', pageOrigin: pageOrigin, url_info: url_info }, (response) => {
      // console.log("Content script: Received response from background script:", response);

      if (response && response.status === 'success') {
        // console.log('Scan results received:', response.data);
        sendResponse({ status: 'success', data: response.data });
      } else {
        console.error('Error during scan:', response ? response.message : 'Unknown error');
        sendResponse({ status: 'error', message: response ? response.message : 'Unknown error' });
      }
    });

    return true; // Keep the message channel open for the response
  }
});