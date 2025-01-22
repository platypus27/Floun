import React, { useState } from 'react';

const JavaScriptCryptographyAnalysis = () => {
  const results: string[] = [];
  const scriptElements = document.getElementsByTagName('script');

  for (let i = 0; i < scriptElements.length; i++) {
    const scriptElement = scriptElements[i];
    let scriptContent = '';

    if (scriptElement.src) {
      // Fetch external scripts
      fetch(scriptElement.src)
        .then((response) => response.text())
        .then((content) => {
          scriptContent = content;
          analyzeContent(scriptContent, results);
          sendResults(results);
        })
        .catch((error) => {
          results.push(`Error fetching script: ${scriptElement.src}`);
          sendResults(results);
        });
    } else {
      // Analyze inline scripts
      scriptContent = scriptElement.textContent || '';
      analyzeContent(scriptContent, results);
    }
  }

  sendResults(results);
};

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

// Function to send results to the background script
const sendResults = (results: string[]) => {
  chrome.runtime.sendMessage({ action: 'analysisResults', data: results });
};

export default JavaScriptCryptographyAnalysis;