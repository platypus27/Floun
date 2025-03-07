/// <reference types="chrome"/>
import React, { useState } from 'react';
import './App.css';
import { HeaderSecurityCheck } from './components/headerAnalysis';
import { analyzeCryptoInJavascript } from './components/javascriptanalysis';
import { analyzeCertificate } from './components/certificateanalysis';
import { analyzeTokens } from './components/tokenAnalysis';
import { createReport } from './components/ai-handler'; // Import the createReport function

interface AnalysisSummary {
  total: number;
  safe: number;
  vulnerable: number;
  vulnerableDetails: string[];
}

const App: React.FC = () => {
  const [scanData, setScanData] = useState<any>(null);
  const [jsResults, setJsResults] = useState<string[]>([]);
  const [tokenResults, setTokenResults] = useState<string[]>([]);
  const [headerResults, setHeaderResults] = useState<string[]>([]);
  const [certResults, setCertResults] = useState<string[]>([]);

  const [jsSummary, setJsSummary] = useState<AnalysisSummary>({ total: 0, safe: 0, vulnerable: 0, vulnerableDetails: [] });
  const [tokenSummary, setTokenSummary] = useState<AnalysisSummary>({ total: 0, safe: 0, vulnerable: 0, vulnerableDetails: [] });
  const [headerSummary, setHeaderSummary] = useState<AnalysisSummary>({ total: 0, safe: 0, vulnerable: 0, vulnerableDetails: [] });
  const [certSummary, setCertSummary] = useState<AnalysisSummary>({ total: 0, safe: 0, vulnerable: 0, vulnerableDetails: [] });


  const analyzeResults = (results: string[]): AnalysisSummary => {
    console.log(results)
    const total = results.length;
    const vulnerableDetails = results.filter(result => result.toLowerCase().includes("vulnerable") || result.toLowerCase().includes("insecure"));
    const vulnerable = vulnerableDetails.length;
    const safe = total - vulnerable;

    return {
      total,
      safe,
      vulnerable,
      vulnerableDetails
    };
  };


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
                }
                setJsResults(jsResultsLocal || []);
                const jsSum = analyzeResults(jsResultsLocal || []);
                setJsSummary(jsSum);

                // Analyze Headers
                let headerResultsLocal: string[] = [];
                if (response.data.TLS) {
                  headerResultsLocal = HeaderSecurityCheck(response.data.TLS);
                }
                setHeaderResults(headerResultsLocal || []);
                const headerSum = analyzeResults(headerResultsLocal || []);
                setHeaderSummary(headerSum);

                // Analyze Certificates
                let certResultsLocal: string[] = [];
                if (response.data.certificates) {
                  const certAnalysisResult = analyzeCertificate(response.data.certificates);
                  certResultsLocal = Array.isArray(certAnalysisResult) ? certAnalysisResult : [];
                }
                setCertResults(certResultsLocal || []);
                const certSum = analyzeResults(certResultsLocal || []);
                setCertSummary(certSum);

                // Analyze Tokens
                const tokenResultsLocal = analyzeTokens(response.data.tokens);
                setTokenResults(tokenResultsLocal || []);
                const tokenSum = analyzeResults(tokenResultsLocal || []);
                setTokenSummary(tokenSum);

                // Display Final Results
                console.log('Final Results: ', { jsResultsLocal, tokenResultsLocal, headerResultsLocal, certResultsLocal });

                // Store parsed data
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
    await createReport(jsResults, tokenResults, headerResults, certResults);
  };

  const displayAnalysisSummary = (summary: AnalysisSummary, title: string) => {
    return (
      <div>
        <p>{title} Results:</p>
        <p>Total found: {summary.total}</p>
        <p>Safe: {summary.safe}</p>
        <p>Vulnerable: {summary.vulnerable}</p>
        {summary.vulnerable > 0 && (
          <div>
            <p>Vulnerable Details:</p>
            <ul>
              {summary.vulnerableDetails.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
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
          {displayAnalysisSummary(jsSummary, "JavaScript")}
          {displayAnalysisSummary(tokenSummary, "Token")}
          {displayAnalysisSummary(headerSummary, "Header")}
          {displayAnalysisSummary(certSummary, "Certificate")}
        </div>
      )}
    </div>
  );
};

export default App;