import React, { useState } from 'react';
import './App.css';
import { HeaderSecurityCheck } from './components/headerAnalysis';
import { analyzeCryptoInJavascript } from './components/javascriptanalysis';
import { analyzeCertificate } from './components/certificateanalysis';
import { analyzeTokens } from './components/tokenAnalysis';


const App: React.FC = () => {
  const [scanData, setScanData] = useState<any>(null); // Store parsed data

  const handleScan = async () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].url) {
        const tabId = tabs[0].id;
        const url = new URL(tabs[0].url);
        const url_properties = {"protocol": url.protocol, "hostname": url.hostname}
        if (tabId !== undefined) {
          chrome.tabs.sendMessage(tabId, { action: 'runScans', data: url_properties }, (response) => {
            if (response && response.status === 'success') {
              try {
                console.log('response data', response.data);
                let jsResults: string[] = [];
                if (response.data.jsScripts) {
                  jsResults = analyzeCryptoInJavascript(response.data.jsScripts);
                } else {
                  console.log("No JavaScript found to analyze.");
                  jsResults = []; // Leave the results empty
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

  return (
    <div className="app">
      <div className="header">
        <img src="icons/floun.png" alt="Floun Logo" />
        <div id="rightHeader">
          <button id="scanBtn" onClick={handleScan}>
            Scan
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
        </div>
      )}
    </div>
  );
};

export default App;