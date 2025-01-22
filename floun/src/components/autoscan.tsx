import React, { useState } from 'react';

const AutoScanFeature: React.FC = () => {
  const [scanResults, setScanResults] = useState<string | null>(null);

  const handleAutoScan = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab && activeTab.id) {
        chrome.scripting.executeScript(
          {
            target: { tabId: activeTab.id },
            func: scanPage,
          },
          (results) => {
            if (results && results[0] && results[0].result) {
              setScanResults(results[0].result);
            }
          }
        );
      }
    });
  };

  const scanPage = async () => {
    const hostname = 'example.com'; // Replace with the actual hostname
    const certificate = await getCertificates(hostname);
  
    const results = {
      certificates: certificate,
      tokens: getTokens(),
      headers: getHeaders(),
      jsCrypto: getJavaScriptCrypto(),
      webSockets: getWebSockets(),
      dynamicCrypto: getDynamicCrypto(),
      contentSecurity: getContentSecurity(),
    };
    return JSON.stringify(results, null, 2);
  };
  
  const getCertificates = async (hostname: string) => {
    try {
      const response = await fetch(`https://crt.sh/?q=${hostname}&output=json`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const certificates = await response.json();
      return JSON.stringify(certificates, null, 2);
    } catch (error) {
      // return `Error: ${error.message}`;
      return `Error`;
    }
  };
  
  const getTokens = () => {
    const tokens = [];
    const regex = /([a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+)/g; // Regex to match JWTs
  
    // Scan the entire document for tokens
    const elements = document.getElementsByTagName('*');
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const textContent = element.textContent || '';
      const matches = textContent.match(regex);
      if (matches) {
        tokens.push(...matches);
      }
    }
  
    // Scan cookies for tokens
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      const matches = cookie.match(regex);
      if (matches) {
        tokens.push(...matches);
      }
    }
  
    // Scan localStorage for tokens
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key) || '';
      const matches = value.match(regex);
      if (matches) {
        tokens.push(...matches);
      }
    }
  
    // Scan sessionStorage for tokens
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      const value = sessionStorage.getItem(key) || '';
      const matches = value.match(regex);
      if (matches) {
        tokens.push(...matches);
      }
    }
  
    return tokens.length > 0 ? tokens : 'No tokens found';
  };
  
  const getHeaders = () => {
    const headers: { [key: string]: string } = {};
  
    // Retrieve meta tags as headers
    const metaTags = document.getElementsByTagName('meta');
    for (let i = 0; i < metaTags.length; i++) {
      const metaTag = metaTags[i];
      const name = metaTag.getAttribute('name') || metaTag.getAttribute('http-equiv');
      const content = metaTag.getAttribute('content');
      if (name && content) {
        headers[name] = content;
      }
    }
  
    // Retrieve other headers from the document
    headers['Content-Type'] = document.contentType;
    headers['Content-Language'] = document.documentElement.lang;
  
    return headers;
  };
  
  const getJavaScriptCrypto = () => {
    const scripts = [];
    const scriptElements = document.getElementsByTagName('script');
  
    for (let i = 0; i < scriptElements.length; i++) {
      const scriptElement = scriptElements[i];
      if (scriptElement.src) {
        // If the script has a src attribute, fetch the script content
        scripts.push(`External script: ${scriptElement.src}`);
      } else {
        // If the script is inline, get its content
        scripts.push(scriptElement.textContent || '');
      }
    }
  
    return scripts.length > 0 ? scripts : 'No JavaScript found';
  };
  

  // kiv features see if got time

  const getWebSockets = () => {
    // Implement WebSocket and API security analysis logic here
    return 'WebSocket and API security results';
  };
  
  const getDynamicCrypto = () => {
    // Implement dynamic cryptographic behavior monitoring logic here
    return 'Dynamic cryptographic behavior monitoring results';
  };
  
  const getContentSecurity = () => {
    // Implement content security analysis logic here
    return 'Content security analysis results';
  };

  return (
    <div>
      <h2>Auto-Scan Feature</h2>
      <button onClick={handleAutoScan}>Start Auto-Scan</button>
      {scanResults && (
        <div>
          <h3>Scan Results:</h3>
          <pre>{scanResults}</pre>
        </div>
      )}
    </div>
  );
};

export default AutoScanFeature;