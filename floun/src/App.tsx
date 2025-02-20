import React, { useState } from 'react';
import './App.css';
import { runAllScans } from './components/autoscan';

const App: React.FC = () => {
  const [result, setResult] = useState<string>('');

  const handleScan = async () => {
    const hostname = window.location.hostname || 'example.com';
    const scanResults = runAllScans(hostname);
    setResult(JSON.stringify(scanResults, null, 2));
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