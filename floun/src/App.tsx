/// <reference types="chrome"/>
import React, { useState } from 'react';
import './App.css';
import { AnalysisFinding } from './components/analysisFinding';
import { AnalysisModuleResult, runAnalysisModules } from './components/analysisModules';
import { ScanPayload, emptyScanMeta, scanActiveTab } from './extension/scanClient';
import {
  clearReportDraftingSettings,
  loadReportDraftingSettings,
  saveReportDraftingSettings,
} from './components/reportgen/reportDraftingSettings';

interface DashboardProps {
  resultsLoaded: boolean;
  moduleResults: AnalysisModuleResult[];
}

const getErrorMessage = (error: unknown): string => (
  error instanceof Error ? error.message : 'Unknown error'
);

const formatStatus = (status: string): string => (
  status
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
);

const FindingRows: React.FC<{ findings: AnalysisFinding[] }> = ({ findings }) => (
  <div className="finding-list">
    {findings.map((finding, index) => (
      <details className={`finding-row severity-${finding.severity.toLowerCase()}`} key={`${finding.source}-${finding.ruleId || finding.title}-${index}`}>
        <summary className="finding-summary">
          <span className="finding-severity">{finding.severity}</span>
          <span className="finding-title">{finding.title}</span>
          {finding.confidence && (
            <span className="finding-meta">{finding.confidence}</span>
          )}
          {finding.location && (
            <span className="finding-meta">{finding.location}</span>
          )}
        </summary>
        <div className="finding-detail">
          {finding.rationale && (
            <p><strong>Rationale:</strong> {finding.rationale}</p>
          )}
          {finding.details && (
            <p><strong>Details:</strong> {finding.details}</p>
          )}
          {finding.limitations && (
            <p><strong>Limitations:</strong> {finding.limitations}</p>
          )}
          {finding.recommendation && (
            <p><strong>Recommendation:</strong> {finding.recommendation}</p>
          )}
          {finding.evidence && (
            <p><strong>Evidence:</strong> {finding.evidence}</p>
          )}
          <div className="finding-attributes">
            {finding.ruleId && <span>Rule: {finding.ruleId}</span>}
            {finding.standardStatus && <span>Status: {formatStatus(finding.standardStatus)}</span>}
            {finding.updatedAt && <span>Updated: {finding.updatedAt}</span>}
          </div>
          {finding.references && finding.references.length > 0 && (
            <div className="finding-references">
              {finding.references.map((reference, referenceIndex) => (
                <a href={reference} target="_blank" rel="noreferrer" key={reference}>
                  Reference {referenceIndex + 1}
                </a>
              ))}
            </div>
          )}
        </div>
      </details>
    ))}
  </div>
);

const displayAnalysisSection = (moduleResult: AnalysisModuleResult) => (
  <div className="analysis-section">
    <p className="section-title">{moduleResult.label} Results</p>
    <p>Total found: {moduleResult.summary.total}</p>
    <p>Safe: {moduleResult.summary.safe}</p>
    <p>Review: {moduleResult.summary.review}</p>
    <p>Vulnerable: {moduleResult.summary.vulnerable}</p>
    <p>Info: {moduleResult.summary.informational}</p>
    <FindingRows findings={moduleResult.findings} />
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({
  resultsLoaded,
  moduleResults,
}) => {
  const totalOccurrences = moduleResults.reduce(
    (total, moduleResult) => total + moduleResult.summary.total,
    0
  );
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Occurrences</h2>
        <div className={`total-occurrences ${resultsLoaded ? 'loaded' : ''}`}>
          {totalOccurrences}
        </div>
      </div>
      {moduleResults.map(moduleResult => (
        <details className="results-dropdown" key={moduleResult.id}>
          <summary>{moduleResult.label} Results</summary>
          <div className="results-content">
            {displayAnalysisSection(moduleResult)}
          </div>
        </details>
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const [initialSettings] = useState(loadReportDraftingSettings);
  const [scanError, setScanError] = useState<string | null>(null);
  const [moduleResults, setModuleResults] = useState<AnalysisModuleResult[]>([]);
  const [scanWarnings, setScanWarnings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resultsLoaded, setResultsLoaded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(initialSettings.apiKey);
  const [consented, setConsented] = useState(initialSettings.consented);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  const setAnalysisResults = (scanPayload: ScanPayload) => {
    setModuleResults(runAnalysisModules(scanPayload));
    setScanWarnings(scanPayload.scanMeta?.warnings || emptyScanMeta().warnings);
  };

  const handleScan = async () => {
    setIsLoading(true);
    setResultsLoaded(false);
    setScanError(null);
    setScanWarnings([]);

    try {
      const scanPayload = await scanActiveTab();
      setAnalysisResults(scanPayload);
      setResultsLoaded(true);
    } catch (error) {
      setScanError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const { createReport } = await import('./components/ai-handler');
      await createReport(moduleResults, loadReportDraftingSettings());
    } catch (error) {
      setScanError(getErrorMessage(error));
    }
  };

  const handleSaveSettings = () => {
    if (apiKey.trim() && !consented) {
      setSettingsMessage('Consent is required before DeepSeek drafting can be enabled.');
      return;
    }

    try {
      const saved = saveReportDraftingSettings({ apiKey, consented });
      setApiKey(saved.apiKey);
      setConsented(saved.consented);
      setSettingsMessage(saved.consented
        ? 'DeepSeek drafting is enabled with your locally stored key.'
        : 'Local PDF drafting is enabled. DeepSeek is off.');
    } catch {
      setSettingsMessage('AI settings could not be saved in this browser profile.');
    }
  };

  const handleClearSettings = () => {
    clearReportDraftingSettings();
    setApiKey('');
    setConsented(false);
    setSettingsMessage('DeepSeek settings were removed. Local PDF drafting remains available.');
  };

  return (
    <div className="app">
      <div className="header">
        <img src="icons/floun.png" alt="Floun Logo" />
        <div id="rightHeader">
          <button
            className="secondary-button"
            onClick={() => setSettingsOpen(open => !open)}
            type="button"
          >
            AI Settings
          </button>
          <button id="scanBtn" onClick={handleScan} disabled={isLoading}>
            Scan
          </button>
        </div>
      </div>
      {settingsOpen && (
        <section className="settings-panel" aria-labelledby="ai-settings-title">
          <h2 id="ai-settings-title">Optional DeepSeek drafting</h2>
          <p>
            When enabled, Floun sends redacted report findings to DeepSeek to draft report text.
            Raw token evidence is omitted. Your API key stays in this browser profile.
          </p>
          <label htmlFor="deepseekApiKey">DeepSeek API key</label>
          <input
            id="deepseekApiKey"
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(event) => {
              setApiKey(event.target.value);
              setSettingsMessage(null);
            }}
          />
          <label className="consent-row" htmlFor="deepseekConsent">
            <input
              id="deepseekConsent"
              type="checkbox"
              checked={consented}
              onChange={(event) => {
                setConsented(event.target.checked);
                setSettingsMessage(null);
              }}
            />
            I consent to sending redacted report findings to DeepSeek when I generate a report.
          </label>
          <div className="settings-actions">
            <button type="button" onClick={handleSaveSettings}>Save AI Settings</button>
            <button type="button" className="secondary-button" onClick={handleClearSettings}>
              Remove Key
            </button>
          </div>
          {settingsMessage && <p role="status">{settingsMessage}</p>}
        </section>
      )}
      {isLoading && (
        <div className="loading">
          <img src="icons/icon_128.png" alt="Loading Animation" className="swimming-icon" />
        </div>
      )}
      {scanError && (
        <div id="results">
          <p>Error: {scanError}</p>
        </div>
      )}
      {resultsLoaded && !scanError && (
        <div id="results">
          {scanWarnings.length > 0 && (
            <div className="scan-warnings">
              <p>Partial scan warnings:</p>
              <ul>
                {scanWarnings.map((warning, index) => (
                  <li key={`scan-warning-${index}`}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
          <Dashboard
            resultsLoaded={resultsLoaded}
            moduleResults={moduleResults}
          />
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
