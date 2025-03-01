import performHeaderSecurityCheck from '../src/components/headerSecurity.js';
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // console.log('Message received in background script:', message);

  if (message.action === 'scanWebsite') {
    const tabId = sender.tab?.id;
    if (!tabId) {
      console.error('Tab ID not found.');
      sendResponse({ status: 'error', message: 'Tab ID not found' });
      return true;
    }

    const pageOrigin = message.pageOrigin;
    // console.log("Page origin (background.js, after retrieval):", pageOrigin);
    if (!pageOrigin) {
      sendResponse({ status: 'error', message: 'Page origin not found' });
      return true;
    }

    // Certificate fetching function
    const getCertificates = async (url) => {
      try {
        if (url.protocol == "https:") {
          const domain = url.hostname;
          const response = await fetch(
            `https://ssl-checker.io/api/v1/check/${domain}`
          );
          console.log("response_cert", response);
          // console.log("response_cert", response);
          // const response2 = await fetch(
          //   `https://api.ssllabs.com/api/v3/analyze?host=${domain}&all=done`
          // );
          // console.log("Test headerSecurityStatus", response2.json());
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
    
          const data = await response.json();
    
          if (data.length === 0) {
            throw new Error("No certificate found for this domain.");
          }
    
          return data; // Return the JSON data directly
        } else {
          console.error("No certificate found for this domain. (http)");
          return false;
        }
      } catch (error) {
        console.error("Error fetching certificates:", error);
        return null; // Handle errors gracefully by returning null
      }
    };

    // Injected script for running scans (without its own messaging)
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: (pageOrigin) => {
        // Define helper functions inside the injected script
        const getTokens = () => {
          return new Promise((resolve, reject) => {
            const tokens = [];
            const sessionTokenRegex = /^(?:[a-zA-Z0-9+/]{24,}=*|[a-f0-9]{32,}|[a-zA-Z0-9_-]{36,})$/;
        
            // Scan cookies 
            const cookies = document.cookie.split(';');
            cookies.forEach((cookie) => {
              const parts = cookie.split('=');
              const cookieValue = parts[1] ? parts[1].trim() : ''; 
              if (cookieValue && sessionTokenRegex.test(cookieValue)) {
                tokens.push(cookieValue);
              }
            });
        
            // Scan localStorage
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              const value = localStorage.getItem(key);
              if (typeof value === 'string' && value && sessionTokenRegex.test(value)) {
                tokens.push(value);
              }
            }
        
            // Scan sessionStorage
            for (let i = 0; i < sessionStorage.length; i++) {
              const key = sessionStorage.key(i);
              const value = sessionStorage.getItem(key);
              if (typeof value === 'string' && value && sessionTokenRegex.test(value)) {
                tokens.push(value);
              }
            }
        
            resolve(tokens.length > 0 ? tokens : ["No tokens found"]);
          });
        };

        const getHeaders = () => {
          const headers = {};
          const metaTags = document.getElementsByTagName('meta');
          for (let i = 0; i < metaTags.length; i++) {
            const metaTag = metaTags[i];
            const name = metaTag.getAttribute('name') || metaTag.getAttribute('http-equiv');
            const content = metaTag.getAttribute('content');
            if (name && content) headers[name] = content;
          }
          headers['Content-Type'] = document.contentType || 'Not available';
          headers['Content-Language'] = document.documentElement.lang || 'Not available';
          return headers;
        };

        const getJavaScript = async (pageOrigin) => {
          const scripts = [];
          const scriptElements = document.getElementsByTagName('script');
          for (let i = 0; i < scriptElements.length; i++) {
            const scriptElement = scriptElements[i];
            const scriptSource = scriptElement.src || scriptElement.baseURI || '';
            // Exclude unwanted protocols and non-matching origins
            if (
              scriptSource.includes('chrome-extension://') ||
              scriptSource.includes('moz-extension://') ||
              scriptSource.includes('file://') ||
              !scriptSource.startsWith(pageOrigin)
            ) {
              continue;
            }
            if (scriptElement.src) {
              try {
                const response = await fetch(scriptElement.src);
                if (!response.ok) {
                  throw new Error(`Failed to fetch script: ${scriptElement.src}`);
                }
                const content = await response.text();
                scripts.push({ type: 'external', src: scriptElement.src, content });
              } catch (error) {
                scripts.push({ type: 'external', src: scriptElement.src, content: 'CORS issue' });
              }
            } else {
              scripts.push({ type: 'inline', content: scriptElement.textContent || '' });
            }
          }
          return scripts; // Return the collected scripts, including inline scripts.
        };

        const runAllScans = async (hostname) => {
          try {
            const [tokens, headers, jsScripts] = await Promise.all([
              Promise.resolve(getTokens()),
              Promise.resolve(getHeaders()),
              getJavaScript(pageOrigin),
            ]);
            return { tokens, headers, jsScripts };
          } catch (error) {
            return { error: error.message };
          }
        };

        const hostname = window.location.hostname;
        return runAllScans(hostname);
      },
      args: [pageOrigin]
    }, async (injectionResults) => {
      if (chrome.runtime.lastError) {
        console.error('Script injection failed:', chrome.runtime.lastError.message);
        sendResponse({ status: 'error', message: chrome.runtime.lastError.message });
        return;
      }
      // Retrieve scan results from the injected script.
      let scanResults = injectionResults[0]?.result || {};

      try {
        const certificates = await getCertificates(message.url_info);

        const hostname = new URL(pageOrigin).hostname;
        const headerSecurityStatus = await performHeaderSecurityCheck(hostname);


        const combinedResults = { ...scanResults, certificates, headerSecurityStatus };
        console.log('Final combined results:', combinedResults);
        sendResponse({ status: 'success', data: combinedResults });
      } catch (error) {
        sendResponse({ status: 'error', message: error.message });
      }
    });

    // Return true to indicate sendResponse will be called asynchronously.
    return true;
  }
});