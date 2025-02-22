import React, { useState } from 'react';
import './App.css';

// Component for displaying certificates
const CertificateListComponent: React.FC<{ certificates: any[] }> = ({ certificates }) => {
  return (
    <div>
      <h3>Certificates</h3>
      <ul>
        {certificates.map((cert, index) => (
          <li key={index}>
            Subject: {cert.subject}, Issuer: {cert.issuer}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Component for displaying tokens
const TokenListComponent: React.FC<{ tokens: string[] }> = ({ tokens }) => {
  return (
    <div>
      <h3>Tokens</h3>
      <ul>
        {tokens.map((token, index) => (
          <li key={index}>{token}</li>
        ))}
      </ul>
    </div>
  );
};

// Component for displaying headers
const HeadersComponent: React.FC<{ headers: { [key: string]: string } }> = ({ headers }) => {
  return (
    <div>
      <h3>Headers</h3>
      <ul>
        {Object.entries(headers).map(([key, value]) => (
          <li key={key}>
            {key}: {value}
          </li>
        ))}
      </ul>
    </div>
  );
};

const App: React.FC = () => {
  const [scanData, setScanData] = useState<any>(null); // Store parsed data

  const handleScan = async () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].url) {
        const tabId = tabs[0].id;
        const url = new URL(tabs[0].url);
        console.log(url);
        if (tabId !== undefined) {
          chrome.tabs.sendMessage(tabId, { action: 'runScans', data: url }, (response) => {
            if (response && response.status === 'success') {
              try {
                console.log('response data', response.data);
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
          {scanData.certificates && <CertificateListComponent certificates={scanData.certificates} />}
          {scanData.tokens && <TokenListComponent tokens={scanData.tokens} />}
          {scanData.headers && <HeadersComponent headers={scanData.headers} />}
        </div>
      )}
    </div>
  );
};

export default App;