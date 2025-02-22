chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in background script:', message);

  if (message.action === 'scanWebsite') {
    const tabId = sender.tab.id;

    if (!tabId) {
      console.error('Tab ID not found.');
      sendResponse({ status: 'error', message: 'Tab ID not found' });
      return true;
    }

    const pageOrigin = message.pageOrigin;

    console.log("Page origin (background.js, after retrieval):", pageOrigin);

    if (!pageOrigin) {
      console.error('Page origin not found.');
      sendResponse({ status: 'error', message: 'Page origin not found' });
      return true;
    }

    const getCertificates = async (hostname) => {
      try {
        const response = await fetch(`https://crt.sh/?q=${hostname}&output=json`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const certificates = await response.json();
        return certificates;
      } catch (error) {
        console.error('Error fetching certificates:', error);
        return `Error fetching certificates: ${error.message}`;
      }
    };

    chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: (pageOrigin) => {
        const runScans = async () => {
          const getTokens = () => {
            const tokens = [];
            const regex = /([a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+)/g;

            // Scan document text
            const elements = document.getElementsByTagName('*');
            for (let i = 0; i < elements.length; i++) {
              const text = elements[i].textContent || '';
              const matches = text.match(regex);
              if (matches) tokens.push(...matches);
            }

            // Scan cookies, localStorage, and sessionStorage
            document.cookie.split(';').forEach(cookie => {
              const matches = cookie.trim().match(regex);
              if (matches) tokens.push(...matches);
            });
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              const value = key ? localStorage.getItem(key) || '' : '';
              const matches = value.match(regex);
              if (matches) tokens.push(...matches);
            }
            for (let i = 0; i < sessionStorage.length; i++) {
              const key = sessionStorage.key(i);
              const value = key ? sessionStorage.getItem(key) || '' : '';
              const matches = value.match(regex);
              if (matches) tokens.push(...matches);
            }

            return tokens.length > 0 ? tokens : 'No tokens found';
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

            console.log('The correct Page origin:', pageOrigin); // Ensure that the correct page origin is used for the javascript
            console.log('Number of script elements found:', scriptElements.length);

            // Process existing <script> elements
            for (let i = 0; i < scriptElements.length; i++) {
              const scriptElement = scriptElements[i];
              const scriptSource = scriptElement.src || scriptElement.baseURI || '';

              console.log('Processing script:', scriptSource);

              // Exclude scripts from extensions and other unsupported protocols
              if (
                scriptSource.includes('chrome-extension://') ||
                scriptSource.includes('moz-extension://') ||
                scriptSource.includes('file://')
              ) {
                console.log('Skipping script due to unsupported protocol:', scriptSource);
                continue; // Skip this script entirely
              }

              // Only process scripts that belong to the same origin
              if (!scriptSource.startsWith(pageOrigin)) {
                continue; // Skip scripts that don't match the page origin
              }

              if (scriptElement.src) {
                // For external scripts, fetch the content (if allowed by CORS)
                try {
                  const response = await fetch(scriptElement.src);
                  if (!response.ok) {
                    throw new Error(`Failed to fetch script: ${scriptElement.src}, status: ${response.status}`);
                  }
                  const content = await response.text();
                  scripts.push({
                    type: 'external',
                    src: scriptElement.src,
                    content: content,
                  });
                } catch (error) {
                  console.error(`Error fetching external script: ${scriptElement.src}`, error);
                  // If fetching fails, log the URL only
                  scripts.push({
                    type: 'external',
                    src: scriptElement.src,
                    content: 'Unable to fetch content due to CORS restrictions',
                  });
                }
              } else {
                // For inline scripts, add the content
                scripts.push({
                  type: 'inline',
                  content: scriptElement.textContent || '',
                });
              }
            }

            // Capture dynamically injected scripts (optional)
            const observer = new MutationObserver((mutations) => {
              mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                  if (node.nodeName === 'SCRIPT') {
                    const scriptElement = node;
                    const scriptSource = scriptElement.src || scriptSource.baseURI || '';

                    console.log('Processing dynamically injected script:', scriptSource);

                    // Exclude scripts from extensions and other unsupported protocols
                    if (
                      scriptSource.includes('chrome-extension://') ||
                      scriptSource.includes('moz-extension://') ||
                      scriptSource.includes('file://')
                    ) {
                      return; // Skip this script entirely
                    }

                    // Only process scripts that belong to the same origin
                    if (!scriptSource.startsWith(pageOrigin)) {
                      return; // Skip scripts that don't match the page origin
                    }

                    if (scriptElement.src) {
                      scripts.push({
                        type: 'dynamic-external',
                        src: scriptElement.src,
                        content: 'Dynamically injected external script',
                      });
                    } else {
                      scripts.push({
                        type: 'dynamic-inline',
                        content: scriptElement.textContent || '',
                      });
                    }
                  }
                });
              });
            });

            // Start observing the document for changes
            observer.observe(document.documentElement, {
              childList: true,
              subtree: true,
            });

            console.log('Scripts found:', scripts);
            return scripts.length > 0 ? scripts : 'No JavaScript found';
          };

          const runAllScans = async (hostname) => {
            try {
              const [tokens, headers, jsScripts] = await Promise.all([
                Promise.resolve(getTokens()),
                Promise.resolve(getHeaders()),
                getJavaScript(pageOrigin), // Pass the page origin to getJavaScript
              ]);

              return {
                tokens,
                headers,
                jsScripts,
              };
            } catch (error) {
              console.error('Error running all scans:', error);
              return {
                error: error.message,
              };
            }
          };

          const hostname = window.location.hostname; // Get the hostname
          const results = await runAllScans(hostname);

          // Send the results back to the extension
          chrome.runtime.sendMessage({ action: 'scanResults', data: results });
        };

        // Call the function and return the result
        runScans().then((results) => {
          console.log('Scan results:', results);
        }).catch((error) => {
          console.error('Error running scans:', error);
        });
      },
      args: [pageOrigin]
    }, (injectionResults) => {
      if (chrome.runtime.lastError) {
        console.error('Script injection failed:', chrome.runtime.lastError.message);
        sendResponse({ status: 'error', message: chrome.runtime.lastError.message });
        return;
      }

      console.log('Script injected successfully.');
    });

    // Fetch certificates in the background script to avoid CORS issues
    getCertificates(pageOrigin).then((certificates) => {
      console.log('Certificates fetched:', certificates);
      // Combine certificates with other scan results
      chrome.runtime.sendMessage({ action: 'scanResults', data: { certificates } });
    }).catch((error) => {
      console.error('Error fetching certificates:', error);
      sendResponse({ status: 'error', message: error.message });
    });

    return true;
  }
});