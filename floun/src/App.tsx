import React, { useState } from 'react';
import './App.css'; // Additional styles

const App: React.FC = () => {
  const [result, setResult] = useState<string>('cat'); // Sample initial value

  // Event handler for the scan button
  const handleScan = () => {
    // Trigger your scan logic here; updating the result for demo purposes
    setResult('Scan triggered! (results will appear here)');
  };

  // Event handler for the download button
  const handleDownload = () => {
    // Add download logic here
    console.log('Download button clicked');
  };

  return (
    <div className="app">
      <div className="header">
        <img src="icons/floun.png" alt="Floun Logo" />
        <div>
          <button id="scanBtn" onClick={handleScan}>Scan</button>
        </div>
      </div>
      <div id="results">
        <div id="resultsText">{result}</div>
        <button id="downloadBtn" onClick={handleDownload}>Download</button>
      </div>
    </div>
  );
};

export default App;