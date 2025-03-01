// contentScript.js
console.log("Content script is running!");

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'runScans') {
    console.log("Content script: Received 'runScans' message.  Sending to background...");
    const pageOrigin = window.location.origin;
    const url_info = request.data
    console.log(request.data);
    console.log(request);
    console.log("Content script pageOrigin:", pageOrigin);

    chrome.runtime.sendMessage({ action: 'scanWebsite', pageOrigin: pageOrigin, url_info: url_info }, (response) => {
      console.log("Content script: Received response from background script:", response);

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