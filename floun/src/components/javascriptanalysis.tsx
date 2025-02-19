import React, { useEffect, useState } from 'react';
import { scanPage } from './autoscan';

const JavaScriptCryptographyAnalysis: React.FC = () => {
  const [autoScanResults, setAutoScanResults] = useState<string>('');
  const jsResults: string[] = [];
  const scriptElements = document.getElementsByTagName('script');

  // Call scanPage from autoscan.tsx and store its results
  useEffect(() => {
    const performAutoScan = async () => {
      const hostname = window.location.hostname || 'example.com';
      const results = await scanPage(hostname);
      setAutoScanResults(results);
    };

    performAutoScan();

    // JavaScript analysis: iterate through script elements
    for (let i = 0; i < scriptElements.length; i++) {
      const scriptElement = scriptElements[i];
      if (scriptElement.src) {
        fetch(scriptElement.src)
          .then(response => response.text())
          .then(content => {
            analyzeContent(content, jsResults);
            sendResults(jsResults);
          })
          .catch(error => {
            jsResults.push(`Error fetching script: ${scriptElement.src}`);
            sendResults(jsResults);
          });
      } else {
        const content = scriptElement.textContent || '';
        analyzeContent(content, jsResults);
      }
    }
  }, []);

  // Function to analyze script content
  const analyzeContent = (content: string, results: string[]) => {
    const algorithms = [
      { name: 'RSA', regex: /\bRSA\b/i, quantumVulnerable: true },
      { name: 'AES', regex: /\bAES\b/i, quantumVulnerable: false },
      { name: 'SHA-1', regex: /\bSHA-1\b/i, quantumVulnerable: true },
      { name: 'SHA-256', regex: /\bSHA-256\b/i, quantumVulnerable: false },
      { name: 'ECDSA', regex: /\bECDSA\b/i, quantumVulnerable: true },
      { name: 'ECDH', regex: /\bECDH\b/i, quantumVulnerable: true },
    ];

    algorithms.forEach((algorithm) => {
      if (algorithm.regex.test(content)) {
        results.push(
          `${algorithm.name} found. ${
            algorithm.quantumVulnerable
              ? 'This algorithm is vulnerable to quantum attacks.'
              : 'This algorithm is not vulnerable to quantum attacks.'
          }`
        );
      }
    });
  };

  // Function to send results to the background script (or elsewhere)
  const sendResults = (results: string[]) => {
    // For example, you can merge the autoscan and JS analysis results or send separately.
    const mergedResults = {
      autoScan: autoScanResults,
      jsAnalysis: results,
    };
    chrome.runtime.sendMessage({ action: 'analysisResults', data: mergedResults });
  };

  return (
    <div>
      <h2>JavaScript Cryptography Analysis</h2>
      <p>Check the console or background for sent results.</p>
    </div>
  );
};

export default JavaScriptCryptographyAnalysis;