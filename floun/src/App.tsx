/// <reference types="chrome"/>
import React, { useEffect, useState } from 'react';
import './App.css';
import { HeaderSecurityCheck } from './components/headerAnalysis';
import { analyzeCryptoInJavascript } from './components/javascriptanalysis';
import { analyzeCertificate } from './components/certificateanalysis';
import { analyzeTokens } from './components/tokenAnalysis';
import { createReport } from './components/ai-handler';

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

  const [jsSummary, setJsSummary] = useState<AnalysisSummary>({
    total: 0,
    safe: 0,
    vulnerable: 0,
    vulnerableDetails: []
  });
  const [tokenSummary, setTokenSummary] = useState<AnalysisSummary>({
    total: 0,
    safe: 0,
    vulnerable: 0,
    vulnerableDetails: []
  });
  const [headerSummary, setHeaderSummary] = useState<AnalysisSummary>({
    total: 0,
    safe: 0,
    vulnerable: 0,
    vulnerableDetails: []
  });
  const [certSummary, setCertSummary] = useState<AnalysisSummary>({
    total: 0,
    safe: 0,
    vulnerable: 0,
    vulnerableDetails: []
  });

  // UI state to track loading and results
  const [isLoading, setIsLoading] = useState(false);
  const [resultsLoaded, setResultsLoaded] = useState(false);

  const analyzeResults = (results: string[]): AnalysisSummary => {
    const total = results.length;
    const vulnerableDetails = results.filter(result =>
      result.toLowerCase().includes("vulnerable") ||
      result.toLowerCase().includes("insecure")
    );
    const vulnerable = vulnerableDetails.length;
    const safe = total - vulnerable;
    return { total, safe, vulnerable, vulnerableDetails };
  };

  const handleScan = async () => {
    setIsLoading(true);
    setResultsLoaded(false);
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs.length > 0 && tabs[0].url) {
        const tabId = tabs[0].id;
        const url = new URL(tabs[0].url);
        const urlProperties = { protocol: url.protocol, hostname: url.hostname };
        if (tabId !== undefined) {
          chrome.tabs.sendMessage(
            tabId,
            { action: 'runScans', data: urlProperties },
            response => {
              if (response && response.status === 'success') {
                try {
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

                  setScanData(response.data);

                  // Ensure the Dashboard renders then trigger animation after a short delay
                  setResultsLoaded(true);
                  setIsLoading(false);
                } catch (error) {
                  setScanData({ error: 'Error parsing JSON' });
                  setIsLoading(false);
                }
              } else {
                setScanData({ error: response ? response.message : 'Unknown error' });
                setIsLoading(false);
              }
            }
          );
        } else {
          setScanData({ error: 'No active tab found.' });
          setIsLoading(false);
        }
      } else {
        setScanData({ error: 'No active tab found.' });
        setIsLoading(false);
      }
    });
  };

  const handleGenerateReport = async () => {
    await createReport(jsResults, tokenResults, headerResults, certResults);
  };

  // Dashboard component that renders the scan dashboard
  const Dashboard: React.FC = () => {
    const totalOccurrences = jsSummary.total + tokenSummary.total + headerSummary.total + certSummary.total;
    const [animateLoaded, setAnimateLoaded] = useState(false);

    useEffect(() => {
      if (resultsLoaded) {
        const timer = setTimeout(() => {
          setAnimateLoaded(true);
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [resultsLoaded]);

    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h2>Occurrences</h2>
          <div className={`total-occurrences ${animateLoaded ? 'loaded' : ''}`}>
            {totalOccurrences}
          </div>
        </div>
        <details className="results-dropdown">
          <summary>JavaScript Results</summary>
          <div className="results-content">
            {displayAnalysisSummary(jsSummary, "JavaScript")}
          </div>
        </details>
        <details className="results-dropdown">
          <summary>Token Results</summary>
          <div className="results-content">
            {displayAnalysisSummary(tokenSummary, "Token")}
          </div>
        </details>
        <details className="results-dropdown">
          <summary>Header Results</summary>
          <div className="results-content">
            {displayAnalysisSummary(headerSummary, "Header")}
          </div>
        </details>
        <details className="results-dropdown">
          <summary>Certificate Results</summary>
          <div className="results-content">
            {displayAnalysisSummary(certSummary, "Certificate")}
          </div>
        </details>
      </div>
    );
  };

  const displayAnalysisSummary = (summary: AnalysisSummary, title: string) => {
    return (
      <div className="analysis-section">
        <p className="section-title">{title} Results</p>
        <p>Total found: {summary.total}</p>
        <p>Safe: {summary.safe}</p>
        <p>Vulnerable: {summary.vulnerable}</p>
        {summary.vulnerable > 0 && (
          <div className="vulnerable-details">
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
        </div>
      </div>
      {isLoading && (
        <div className="loading">
          <img src="icons/icon_128.png" alt="Loading Animation" className="swimming-icon" />
        </div>
      )}
      {scanData && scanData.error && (
        <div id="results">
          <p>Error: {scanData.error}</p>
        </div>
      )}
      {resultsLoaded && !scanData.error && (
        <div id="results">
          <Dashboard />
        </div>
      )}
      {resultsLoaded && (
        <button id="generateReportBtn" onClick={handleGenerateReport}>
          Generate Report
        </button>
      )}
    </div>
  );
};

export default App;