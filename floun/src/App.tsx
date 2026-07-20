/// <reference types="chrome"/>
import React, { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  EmptyState,
  Field,
  IconButton,
  Input,
  PageHeader,
  TopBar,
  TopBarActions,
  TopBarBrand,
} from '@kryv/teal';
import {
  FileDown,
  KeyRound,
  Radar,
  ScanSearch,
  Settings2,
  ShieldCheck,
} from 'lucide-react';
import './App.css';
import { AnalysisFinding } from './components/analysisFinding';
import { AnalysisModuleResult, runAnalysisModules } from './components/analysisModules';
import { ScanPayload, emptyScanMeta, scanActiveTab } from './extension/scanClient';
import {
  clearReportDraftingSettings,
  loadReportDraftingStatus,
  loadReportDraftingSettings,
  saveReportDraftingSettings,
} from './components/reportgen/reportDraftingSettings';
import type { ReportDraftingStatus } from './components/reportgen/reportDraftingSettings';

interface DashboardProps {
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

const severityVariant = (severity: AnalysisFinding['severity']) => {
  switch (severity) {
    case 'Vulnerable': return 'danger' as const;
    case 'Review': return 'warning' as const;
    case 'Safe': return 'success' as const;
    default: return 'neutral' as const;
  }
};

const FindingDetail: React.FC<{ finding: AnalysisFinding }> = ({ finding }) => (
  <div className="finding-detail">
    {finding.rationale && <p><strong>Rationale:</strong> {finding.rationale}</p>}
    {finding.details && <p><strong>Details:</strong> {finding.details}</p>}
    {finding.limitations && <p><strong>Limitations:</strong> {finding.limitations}</p>}
    {finding.recommendation && <p><strong>Recommendation:</strong> {finding.recommendation}</p>}
    {finding.evidence && <p><strong>Evidence:</strong> {finding.evidence}</p>}
    <div className="finding-attributes">
      {finding.ruleId && <Badge variant="neutral">Rule {finding.ruleId}</Badge>}
      {finding.standardStatus && <Badge variant="info">Status {formatStatus(finding.standardStatus)}</Badge>}
      {finding.updatedAt && <Badge variant="neutral">Updated {finding.updatedAt}</Badge>}
    </div>
    {finding.references && finding.references.length > 0 && (
      <div className="finding-references">
        {finding.references.map((reference, referenceIndex) => (
          <Button asChild size="sm" variant="ghost" key={reference}>
            <a href={reference} target="_blank" rel="noreferrer">
              Reference {referenceIndex + 1}
            </a>
          </Button>
        ))}
      </div>
    )}
  </div>
);

const FindingRows: React.FC<{ findings: AnalysisFinding[] }> = ({ findings }) => (
  <Accordion
    className="finding-list"
    items={findings.map((finding, index) => ({
      value: `${finding.source}-${finding.ruleId || finding.title}-${index}`,
      title: (
        <span className="finding-summary">
          <Badge variant={severityVariant(finding.severity)}>{finding.severity}</Badge>
          <span className="finding-title">{finding.title}</span>
          {(finding.confidence || finding.location) && (
            <span className="finding-meta">
              {[finding.confidence, finding.location].filter(Boolean).join(' · ')}
            </span>
          )}
        </span>
      ),
      content: <FindingDetail finding={finding} />,
    }))}
  />
);

const AnalysisSection: React.FC<{ moduleResult: AnalysisModuleResult }> = ({ moduleResult }) => (
  <div className="analysis-section">
    <div className="metric-grid" aria-label={`${moduleResult.label} result counts`}>
      <div><span>Total</span><strong>{moduleResult.summary.total}</strong></div>
      <div><span>Safe</span><strong>{moduleResult.summary.safe}</strong></div>
      <div><span>Review</span><strong>{moduleResult.summary.review}</strong></div>
      <div><span>At risk</span><strong>{moduleResult.summary.vulnerable}</strong></div>
      <div><span>Info</span><strong>{moduleResult.summary.informational}</strong></div>
    </div>
    <FindingRows findings={moduleResult.findings} />
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ moduleResults }) => {
  const totalOccurrences = moduleResults.reduce(
    (total, moduleResult) => total + moduleResult.summary.total,
    0
  );

  return (
    <section aria-label="Readiness snapshot" className="results-section">
      <PageHeader
        title="Readiness snapshot"
        titleAs="h2"
        subtitle="Review detected signals by cryptographic surface."
        actions={<Badge className="total-occurrences" variant="info">{totalOccurrences} signals</Badge>}
      />
      <Accordion
        className="results-accordion"
        items={moduleResults.map(moduleResult => ({
          value: moduleResult.id,
          title: (
            <span className="module-title">
              <span>{moduleResult.label}</span>
              <Badge variant={moduleResult.summary.vulnerable > 0 ? 'danger' : 'neutral'}>
                {moduleResult.summary.total}
              </Badge>
            </span>
          ),
          content: <AnalysisSection moduleResult={moduleResult} />,
        }))}
      />
    </section>
  );
};

const ScanningState = () => (
  <Card className="scanning-state" role="status" aria-label="Scanning current site">
    <div className="scanner-orbit" aria-hidden="true">
      <span className="scanner-ring scanner-ring-one" />
      <span className="scanner-ring scanner-ring-two" />
      <span className="scanner-sweep" />
      <img src="icons/floun.png" alt="" />
    </div>
    <img className="sr-only-image" src="icons/floun.png" alt="Floun scanning mark" />
    <CardTitle titleAs="h2">Mapping cryptographic signals</CardTitle>
    <CardDescription>Inspecting scripts, tokens, TLS, and certificate evidence.</CardDescription>
  </Card>
);

const App: React.FC = () => {
  const [scanError, setScanError] = useState<string | null>(null);
  const [moduleResults, setModuleResults] = useState<AnalysisModuleResult[]>([]);
  const [scanWarnings, setScanWarnings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resultsLoaded, setResultsLoaded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsReady, setSettingsReady] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState<ReportDraftingStatus>({
    configured: false,
    consented: false,
    keySuffix: '',
  });
  const [editingKey, setEditingKey] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [consented, setConsented] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadReportDraftingStatus().then((status) => {
      if (!active) return;
      setSettingsStatus(status);
      setEditingKey(!status.configured);
      setSettingsReady(true);
    });
    return () => { active = false; };
  }, []);

  const scanState = useMemo(() => {
    if (isLoading) return { label: 'Scanning', variant: 'info' as const };
    if (resultsLoaded) return { label: 'Scan complete', variant: 'success' as const };
    return { label: 'Ready', variant: 'neutral' as const };
  }, [isLoading, resultsLoaded]);

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
      await createReport(moduleResults, await loadReportDraftingSettings());
    } catch (error) {
      setScanError(getErrorMessage(error));
    }
  };

  const handleSaveSettings = async () => {
    if (!apiKey.trim()) {
      setSettingsMessage('Enter a DeepSeek API key before saving.');
      return;
    }
    if (!consented) {
      setSettingsMessage('Consent is required before DeepSeek drafting can be enabled.');
      return;
    }
    try {
      const status = await saveReportDraftingSettings({ apiKey, consented });
      setSettingsStatus(status);
      setEditingKey(false);
      setApiKey('');
      setConsented(false);
      setSettingsMessage('DeepSeek drafting is enabled with your key saved on this device.');
    } catch {
      setSettingsMessage('AI settings could not be saved in this browser profile.');
    }
  };

  const handleReplaceSettings = () => {
    setEditingKey(true);
    setApiKey('');
    setConsented(false);
    setSettingsMessage('Enter the replacement key and consent again before saving.');
  };

  const handleCancelReplace = () => {
    setEditingKey(false);
    setApiKey('');
    setConsented(false);
    setSettingsMessage(null);
  };

  const handleClearSettings = async () => {
    try {
      await clearReportDraftingSettings();
      setSettingsStatus({ configured: false, consented: false, keySuffix: '' });
      setEditingKey(true);
      setApiKey('');
      setConsented(false);
      setSettingsMessage('DeepSeek settings were removed. Local PDF drafting remains available.');
    } catch {
      setSettingsMessage('DeepSeek settings could not be removed from this browser profile.');
    }
  };

  return (
    <div className="app-shell">
      <TopBar sticky={false} className="brand-bar">
        <TopBarBrand>
          <div className="brand-copy">
            <div className="brand-title-row">
              <h1>floun</h1>
              <Badge variant="info">v3</Badge>
            </div>
            <p>Crypto readiness, clearly mapped.</p>
          </div>
        </TopBarBrand>
        <TopBarActions>
          <IconButton label="AI drafting" variant="secondary" onClick={() => setSettingsOpen(true)}>
            <Settings2 aria-hidden="true" />
          </IconButton>
        </TopBarActions>
      </TopBar>

      <main className="workspace">
        <Card className="scan-card">
          <CardHeader>
            <div>
              <CardTitle titleAs="h2">Current site</CardTitle>
              <CardDescription>On-demand analysis. Nothing runs until you start it.</CardDescription>
            </div>
            <Badge variant={scanState.variant}>{scanState.label}</Badge>
          </CardHeader>
          <CardContent className="scan-card-content">
            <div className="scan-symbol" aria-hidden="true"><Radar /></div>
            <p>Map JavaScript, session tokens, TLS, and certificate migration signals.</p>
          </CardContent>
          <CardFooter>
            <Button id="scanBtn" className="primary-action" size="lg" onClick={handleScan} loading={isLoading}>
              <ScanSearch aria-hidden="true" />
              {isLoading ? 'Scanning site' : 'Scan current site'}
            </Button>
          </CardFooter>
        </Card>

        <Dialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          size="sm"
          title="AI drafting"
          description="Optionally send redacted report findings to DeepSeek. Raw token evidence is always omitted."
        >
          {!settingsReady ? (
            <p role="status">Loading saved AI settings...</p>
          ) : settingsStatus.configured && !editingKey ? (
            <Card className="saved-key-card">
              <CardHeader>
                <div className="saved-key-title">
                  <span className="key-icon"><KeyRound aria-hidden="true" /></span>
                  <div>
                    <CardTitle titleAs="h3">Saved on this device</CardTitle>
                    <CardDescription>Key ending in {settingsStatus.keySuffix}</CardDescription>
                  </div>
                </div>
                <Badge variant="success">Enabled</Badge>
              </CardHeader>
              <CardFooter>
                <Button type="button" size="sm" onClick={handleReplaceSettings}>Replace Key</Button>
                <Button type="button" size="sm" variant="danger" onClick={handleClearSettings}>Remove Key</Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="settings-form">
              <Field
                id="deepseekApiKey"
                label="DeepSeek API key"
                description="Stored only in this Chrome profile and never synced."
                required
              >
                <Input
                  type="password"
                  autoComplete="off"
                  value={apiKey}
                  onChange={(event) => {
                    setApiKey(event.target.value);
                    setSettingsMessage(null);
                  }}
                />
              </Field>
              <Checkbox
                id="deepseekConsent"
                checked={consented}
                onCheckedChange={(checked) => {
                  setConsented(checked === true);
                  setSettingsMessage(null);
                }}
                label="I consent to DeepSeek drafting"
                description="Only redacted findings are sent when I generate a report."
              />
              <div className="settings-actions">
                <Button type="button" onClick={handleSaveSettings}>Save AI Settings</Button>
                {settingsStatus.configured && (
                  <Button type="button" variant="secondary" onClick={handleCancelReplace}>Cancel</Button>
                )}
              </div>
            </div>
          )}
          {settingsMessage && (
            <Alert className="settings-message" variant={settingsMessage.includes('enabled') ? 'success' : 'info'}>
              {settingsMessage}
            </Alert>
          )}
        </Dialog>

        {isLoading && <ScanningState />}

        {!isLoading && !resultsLoaded && !scanError && (
          <EmptyState
            className="ready-state"
            icon={<ShieldCheck />}
            title="Ready to inspect this site"
            description="Start a scan to build a focused crypto-readiness map."
          />
        )}

        {scanError && (
          <Alert data-scan-error="true" variant="danger" title="Scan could not complete">{scanError}</Alert>
        )}

        {resultsLoaded && !scanError && (
          <>
            {scanWarnings.length > 0 && (
              <Alert variant="warning" title="Partial scan">
                <ul className="warning-list scan-warnings">
                  {scanWarnings.map((warning, index) => <li key={`scan-warning-${index}`}>{warning}</li>)}
                </ul>
              </Alert>
            )}
            <Dashboard moduleResults={moduleResults} />
            <Button id="generateReportBtn" className="report-action" size="lg" onClick={handleGenerateReport}>
              <FileDown aria-hidden="true" />
              Generate Report
            </Button>
          </>
        )}
      </main>
    </div>
  );
};

export default App;
