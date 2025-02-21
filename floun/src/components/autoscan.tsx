/**
 * Internal scanning functions used by runAllScans.
 */

import { analyzeCryptoInJavascript } from './javascriptanalysis';
import { analyzeTokens } from './sessiontokenanalysis';

const getCertificates = async (hostname: string): Promise<any> => {
  try {
    const response = await fetch(`https://crt.sh/?q=${hostname}&output=json`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const certificates = await response.json();
    return certificates;
  } catch (error: any) {
    return `Error fetching certificates: ${error.message}`;
  }
};

const getTokens = (): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const tokens: string[] = [];
    const tokenRegex = /^[a-zA-Z0-9!@#$%^&*()_\-+=`~[\]{}|;':",./<>?]{16,512}$/;  // Your token regex

    // 1. Scan Cookies
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        reject("No active tab found.");
        return;
      }

      const tab = tabs[0];
      if (!tab.url) {
        reject("Tab URL is not available.");
        return;
      }

      const url = new URL(tab.url);
      const domain = url.hostname;

      chrome.cookies.getAll({ domain: domain }, (cookies) => {
        if (cookies) {
          cookies.forEach((cookie) => {
            if (tokenRegex.test(cookie.value)) {
              tokens.push(cookie.value);
            }
          });
        }
        // 2. Scan localStorage and sessionStorage (after cookies)
        try {
          const localStorageTokens = scanStorage(localStorage, tokenRegex);
          const sessionStorageTokens = scanStorage(sessionStorage, tokenRegex);

          tokens.push(...localStorageTokens, ...sessionStorageTokens);

          if (tokens.length > 0) {
            resolve(tokens);
          } else {
            resolve(["No tokens found"]);
          }
        } catch (error) {
          reject(`Error scanning storage: ${error}`);
        }
      });
    });
  });
};

// Helper function to scan storage (localStorage or sessionStorage)
function scanStorage(storage: Storage, tokenRegex: RegExp): string[] {
  const tokens: string[] = [];
  // console.log("Scanning storage:", storage);
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key) {
      const value = storage.getItem(key);
      if (value && tokenRegex.test(value)) { // Apply regex test
        tokens.push(value);
      }
      if (key && tokenRegex.test(key)) {
        tokens.push(key);
      }
    }
  }
  return tokens;
}

getTokens()
  .then((tokens) => {
    // console.log("Tokens found:", tokens);
    chrome.runtime.sendMessage({ action: "tokensFound", tokens: tokens });
  })
  .catch((error) => {
    console.error("Error getting tokens:", error);
  });

const getHeaders = (): { [key: string]: string } => {
  const headers: { [key: string]: string } = {};
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

const getJavaScript = async (): Promise<any> => {
  const scripts: any[] = [];
  const scriptElements = document.getElementsByTagName('script');

  // Process existing <script> elements
  for (let i = 0; i < scriptElements.length; i++) {
    const scriptElement = scriptElements[i];
    if (scriptElement.src) {
      // For external scripts, fetch the content (if allowed by CORS)
      try {
        const response = await fetch(scriptElement.src);
        const content = await response.text();
        scripts.push({
          type: 'external',
          src: scriptElement.src,
          content: content,
        });
      } catch (error) {
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
          const scriptElement = node as HTMLScriptElement;
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

  return scripts.length > 0 ? scripts : 'No JavaScript found';
};

/**
 * Aggregates all scans including certificate, token, header, and JavaScript scans.
 * Also calls analyzeCryptoInJavaScript from javascriptanalysis.tsx.
 */
export const runAllScans = async (hostname: string): Promise<any> => {
  try {
    const [certificates, tokens, headers, jsScripts] = await Promise.all([
      getCertificates(hostname),
      Promise.resolve(getTokens()),
      Promise.resolve(getHeaders()),
      getJavaScript(),
    ]);

    if (jsScripts === 'No JavaScript found') {
      throw new Error('No JavaScript detected on the page.');
    }
    
    const cryptoAnalysis = analyzeCryptoInJavascript(jsScripts);
    const tokenAnalysis = analyzeTokens(tokens);
    return {
      certificates,
      tokenAnalysis,
      headers,
      jsScripts,
      cryptoAnalysis,
    };
  } catch (error) {
    console.error('Error running all scans:', error);
    return {
      error: (error as Error).message,
    };
  }
};