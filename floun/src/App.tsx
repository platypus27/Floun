import React, { useState } from 'react';
import './App.css';
import { HeaderSecurityCheck } from './components/headerAnalysis';
import { analyzeCryptoInJavascript } from './components/javascriptanalysis';
import { analyzeCertificate } from './components/certificateanalysis';
import { analyzeTokens } from './components/tokenAnalysis';
import { createReport } from './components/ai-handler'; // Import the createReport function

const App: React.FC = () => {
  const [scanData, setScanData] = useState<any>(null); // Store parsed data
  const [jsResults, setJsResults] = useState<string[]>([]); // Store JavaScript analysis results
  const [tokenResults, setTokenResults] = useState<string[]>([]); // Store token analysis results

  const handleScan = async () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].url) {
        const tabId = tabs[0].id;
        const url = new URL(tabs[0].url);
        const url_properties = { protocol: url.protocol, hostname: url.hostname };
        if (tabId !== undefined) {
          chrome.tabs.sendMessage(tabId, { action: 'runScans', data: url_properties }, (response) => {
            if (response && response.status === 'success') {
              try {
                console.log('response data', response.data);

                // Analyze JavaScript
                let jsResultsLocal: string[] = [];
                if (response.data.jsScripts) {
                  jsResultsLocal = analyzeCryptoInJavascript(response.data.jsScripts);
                } else {
                  console.log("No JavaScript found to analyze.");
                  jsResultsLocal = []; // Leave the results empty
                }
                const headerResults = HeaderSecurityCheck(response.data.TLS);
                const certResults = analyzeCertificate(response.data.certificates);
                const tokenResults = analyzeTokens(response.data.tokens);
                console.log("finalresults", { headerResults, jsResults, certResults, tokenResults });
                setScanData(response.data);
              } catch (error) {
                setScanData({ error: 'Error parsing JSON' });
              }
            } else {
              setScanData({ error: response ? response.message : 'Unknown error' });
            }
          });
        } else {
          setScanData({ error: 'No active tab found.' });
        }
      } else {
        setScanData({ error: 'No active tab found.' });
      }
    });
  };

  const handleGenerateReport = async () => {
    // Call the createReport function with jsResults and tokenResults
    await createReport(jsResults, tokenResults);
  };

  return (
    <div className="app">
      <div className="header">
        <img src="icons/floun.png" alt="Floun Logo" />
        <div id="rightHeader">
          <button id="scanBtn" onClick={handleScan}>
            Scan
          </button>
          <button id="generateReportBtn" onClick={handleGenerateReport} disabled={!scanData}>
            Generate Report
          </button>
        </div>
      </div>
      {scanData && scanData.error && (
        <div id="results">
          <p>Error: {scanData.error}</p>
        </div>
      )}
      {scanData && !scanData.error && (
        <div id="results">
          <p>JavaScript Results:</p>
          <pre>{JSON.stringify(jsResults, null, 2)}</pre>
          <p>Token Results:</p>
          <pre>{JSON.stringify(tokenResults, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default App;