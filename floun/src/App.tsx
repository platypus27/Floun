import React, { useState } from 'react';
import './App.css';
import { scanPage } from './components/autoscan';

const App: React.FC = () => {
  // Start with an empty result so the results div is hidden initially
  const [result, setResult] = useState<string>(''); 

  // Event handler for the scan button
  const handleScan = async () => {
    console.log("1")
    const hostname = window.location.hostname || 'example.com';
    const scanResult = await scanPage(hostname);

    setResult('Scan triggered! (results will appear here)');
  };

  // Event handler for the download button
  const handleDownload = () => {
    console.log('Download button clicked');
  };

  return (
    <div className="app">
      <div className="header">
        <img src="icons/floun.png" alt="Floun Logo" />
        <div id="rightHeader">
          <button id="scanBtn" onClick={handleScan}>Scan</button>
        </div>
      </div>
      {/* Render the results div only if result is not empty */}
      {result && (
        <div id="results">
          <div id="resultsText">{result}</div>
          <button id="downloadBtn" onClick={handleDownload}>Download</button>
        </div>
      )}
    </div>
  );
};

export default App;