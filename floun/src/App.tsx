import React, { useState } from 'react';
import './App.css';

const App: React.FC = () => {
  const [result, setResult] = useState<string>('');

  const handleScan = async () => {
    // Send a message to the content script to start the scan
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        const tabId = tabs[0].id;
        if (tabId !== undefined) {
          chrome.tabs.sendMessage(tabId, { action: 'runScans' }, (response) => {
            if (response && response.status === 'success') {
              setResult(JSON.stringify(response.data, null, 2));
            } else {
              setResult(`Error: ${response ? response.message : 'Unknown error'}`);
            }
          });
        } else {
          setResult('No active tab found.');
        }
      } else {
        setResult('No active tab found.');
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
      {result && (
        <div id="results">
          <pre>{result}</pre>
        </div>
      )}
    </div>
  );
};

export default App;