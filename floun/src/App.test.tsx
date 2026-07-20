import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { scanActiveTab } from './extension/scanClient';
import { createReport } from './components/ai-handler';
import type { ScanPayload } from './extension/scanTypes';

vi.mock('./extension/scanClient', () => ({
  emptyScanMeta: () => ({
    page: { status: 'unavailable', message: 'Page scan has not run.' },
    tls: { status: 'unavailable', message: 'TLS scan has not run.' },
    certificates: { status: 'unavailable', message: 'Certificate scan has not run.' },
    warnings: [],
  }),
  scanActiveTab: vi.fn(),
}));

vi.mock('./components/ai-handler', () => ({
  createReport: vi.fn(),
}));

const extensionStorage: Record<string, unknown> = {};
const storageLocal = {
  get: vi.fn(async (key: string | string[]) => Object.fromEntries(
    (Array.isArray(key) ? key : [key]).map((entry) => [entry, extensionStorage[entry]])
  )),
  set: vi.fn(async (items: Record<string, unknown>) => Object.assign(extensionStorage, items)),
  remove: vi.fn(async (keys: string | string[]) => {
    (Array.isArray(keys) ? keys : [keys]).forEach((key) => delete extensionStorage[key]);
  }),
};

beforeEach(() => {
  Object.keys(extensionStorage).forEach((key) => delete extensionStorage[key]);
  vi.stubGlobal('chrome', { storage: { local: storageLocal } });
});

afterEach(() => {
  vi.mocked(scanActiveTab).mockReset();
  vi.mocked(createReport).mockReset();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

test('shows masked status instead of repopulating a saved DeepSeek key', async () => {
  extensionStorage['floun.reportDrafting.deepseek.v2'] = {
    apiKey: 'sk-private-credential-7x9z',
    consented: true,
  };
  extensionStorage['floun.reportDrafting.deepseek.status.v2'] = {
    configured: true,
    consented: true,
    keySuffix: '7x9z',
  };

  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /ai drafting/i }));

  expect(await screen.findByText(/^saved on this device$/i)).toBeInTheDocument();
  expect(screen.getByText(/ending in 7x9z/i)).toBeInTheDocument();
  expect(screen.queryByDisplayValue('sk-private-credential-7x9z')).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/deepseek api key/i)).not.toBeInTheDocument();
});

test('replacing a saved key requires fresh consent and removal clears it', async () => {
  extensionStorage['floun.reportDrafting.deepseek.v2'] = {
    apiKey: 'sk-original-key-1234',
    consented: true,
  };
  extensionStorage['floun.reportDrafting.deepseek.status.v2'] = {
    configured: true,
    consented: true,
    keySuffix: '1234',
  };

  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /ai drafting/i }));
  await screen.findByText(/ending in 1234/i);
  fireEvent.click(screen.getByRole('button', { name: /replace key/i }));

  const replacementInput = screen.getByLabelText(/deepseek api key/i);
  const consentInput = screen.getByLabelText(/i consent/i);
  expect(consentInput).not.toBeChecked();
  fireEvent.change(replacementInput, { target: { value: 'sk-replacement-key-9876' } });
  fireEvent.click(screen.getByRole('button', { name: /save ai settings/i }));
  expect(await screen.findByText(/consent is required/i)).toBeInTheDocument();
  expect(extensionStorage['floun.reportDrafting.deepseek.v2']).toEqual({
    apiKey: 'sk-original-key-1234',
    consented: true,
  });

  fireEvent.click(consentInput);
  fireEvent.click(screen.getByRole('button', { name: /save ai settings/i }));
  expect(await screen.findByText(/ending in 9876/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /remove key/i }));

  expect(await screen.findByLabelText(/deepseek api key/i)).toBeInTheDocument();
  expect(extensionStorage['floun.reportDrafting.deepseek.v2']).toBeUndefined();
});

test('a user can explicitly configure and consent to DeepSeek report drafting', async () => {
  vi.mocked(scanActiveTab).mockResolvedValue({
    jsScripts: [],
    tokens: [],
    headers: {},
    TLS: null,
    certificates: null,
    scanMeta: {
      page: { status: 'complete' },
      tls: { status: 'unavailable', message: 'No TLS data.' },
      certificates: { status: 'unavailable', message: 'No certificate data.' },
      warnings: [],
    },
  });

  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /ai drafting/i }));

  expect(screen.getByText(/optionally send redacted report findings to DeepSeek/i)).toBeInTheDocument();
  fireEvent.change(await screen.findByLabelText(/deepseek api key/i), {
    target: { value: 'sk-user-owned-key' },
  });
  fireEvent.click(screen.getByLabelText(/i consent/i));
  fireEvent.click(screen.getByRole('button', { name: /save ai settings/i }));
  expect(await screen.findByText(/^saved on this device$/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /^close$/i }));

  fireEvent.click(screen.getByRole('button', { name: /scan current site/i }));
  await screen.findByRole('button', { name: /generate report/i });
  fireEvent.click(screen.getByRole('button', { name: /generate report/i }));

  await waitFor(() => {
    expect(createReport).toHaveBeenCalledWith(expect.any(Array), {
      apiKey: 'sk-user-owned-key',
      consented: true,
    });
  });
});

test('renders the Floun v3 scan workspace', async () => {
  render(<App />);

  await screen.findByText(/ready to inspect this site/i);
  expect(screen.getByRole('heading', { name: 'floun' })).toBeInTheDocument();
  expect(screen.getByText(/crypto readiness, clearly mapped/i)).toBeInTheDocument();
  expect(screen.queryByAltText(/floun v3 mark/i)).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /scan current site/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /ai drafting/i })).toBeInTheDocument();
  expect(screen.getByText(/ready to inspect this site/i)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /generate report/i })).not.toBeInTheDocument();
});

test('shows informational counts so module totals reconcile', async () => {
  vi.mocked(scanActiveTab).mockResolvedValue({
    jsScripts: [],
    tokens: [],
    headers: {},
    TLS: null,
    certificates: null,
    scanMeta: {
      page: { status: 'complete' },
      tls: { status: 'unavailable', message: 'No TLS data.' },
      certificates: { status: 'unavailable', message: 'No certificate data.' },
      warnings: [],
    },
  });

  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /scan current site/i }));
  fireEvent.click(await screen.findByRole('button', { name: /^tokens\s*1$/i }));

  expect(screen.getByLabelText(/tokens result counts/i)).toHaveTextContent('Info1');
});

test('announces a branded scanning state while work is in progress', async () => {
  vi.mocked(scanActiveTab).mockReturnValue(new Promise(() => undefined));

  render(<App />);
  await screen.findByText(/ready to inspect this site/i);
  fireEvent.click(screen.getByRole('button', { name: /scan current site/i }));

  expect(await screen.findByRole('status', { name: /scanning current site/i })).toBeInTheDocument();
  expect(screen.getByAltText(/floun scanning mark/i)).toBeInTheDocument();
});

test('renders expandable finding rows with structured explanation fields', async () => {
  const payload: ScanPayload = {
    jsScripts: [{ type: 'inline', content: 'const digest = MD5(input);' }],
    tokens: ['secretRawToken'],
    headers: {},
    TLS: {
      provider: 'ssl-labs',
      endpoints: [{
        protocolVersions: ['1.3'],
        cipherSuites: ['TLS_AES_128_GCM_SHA256'],
      }],
    },
    certificates: { provider: 'ssl-labs', signatureAlgorithm: 'sha256WithRSAEncryption' },
    scanMeta: {
      page: { status: 'complete' },
      tls: { status: 'complete' },
      certificates: { status: 'complete' },
      warnings: [],
    },
  };
  vi.mocked(scanActiveTab).mockResolvedValue(payload);

  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /scan current site/i }));

  const javascriptSection = await screen.findByRole('button', { name: /javascript/i });
  fireEvent.click(javascriptSection);
  const findingTitle = await screen.findByText('Found MD5 Hashing');
  expect(screen.getByRole('button', { name: /^tls\s*1$/i })).toBeInTheDocument();
  expect(screen.queryByText('Header Results')).not.toBeInTheDocument();

  const findingSummary = findingTitle.closest('button');

  expect(findingSummary).toBeTruthy();
  fireEvent.click(findingSummary as HTMLElement);
  expect(screen.getByText(/MD5 is a known deprecated hash/)).toBeInTheDocument();
  expect(screen.getByText(/The match does not determine whether usage is security-sensitive/)).toBeInTheDocument();
  expect(screen.getByText(/Remove MD5/)).toBeInTheDocument();
  expect(screen.getByText(/Status Deprecated/)).toBeInTheDocument();

  const links = screen.getAllByRole('link', { name: /reference 1/i });
  expect(links[0]).toHaveAttribute('target', '_blank');
  expect(links[0]).toHaveAttribute('rel', 'noreferrer');

  await waitFor(() => {
    expect(document.body.textContent).not.toContain('secretRawToken');
  });
});
