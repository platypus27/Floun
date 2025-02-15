// background.js

// Log when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
    console.log('Floun extension installed or updated.');
  });
  
  // Listen for messages from other parts of the extension (e.g., popup or content scripts)
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received in background script:', message);
  
    // Handle specific messages
    if (message.action === 'scanWebsite') {
      // Perform background tasks (e.g., fetch data, process results)
      const results = { status: 'Scan completed', data: message.data };
      sendResponse(results); // Send a response back to the sender
    }
  
    // Return true to indicate that the response will be sent asynchronously
    return true;
  });
  
  // Example: Listen for tab updates (e.g., when a user navigates to a new page)
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      console.log('Tab updated:', tab.url);
      // You can trigger actions here, such as scanning the new page
    }
  });