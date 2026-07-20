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

afterEach(() => {
  vi.mocked(scanActiveTab).mockReset();
  vi.mocked(createReport).mockReset();
  window.localStorage.clear();
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
  fireEvent.click(screen.getByRole('button', { name: /ai settings/i }));

  expect(screen.getByText(/^When enabled, Floun sends redacted report findings to DeepSeek/i)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(/deepseek api key/i), {
    target: { value: 'sk-user-owned-key' },
  });
  fireEvent.click(screen.getByLabelText(/i consent/i));
  fireEvent.click(screen.getByRole('button', { name: /save ai settings/i }));

  fireEvent.click(screen.getByRole('button', { name: /^scan$/i }));
  await screen.findByRole('button', { name: /generate report/i });
  fireEvent.click(screen.getByRole('button', { name: /generate report/i }));

  await waitFor(() => {
    expect(createReport).toHaveBeenCalledWith(expect.any(Array), {
      apiKey: 'sk-user-owned-key',
      consented: true,
    });
  });
});

test('renders the Floun popup shell', () => {
  render(<App />);

  expect(screen.getByAltText(/floun logo/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /scan/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /generate report/i })).not.toBeInTheDocument();
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
  fireEvent.click(screen.getByRole('button', { name: /scan/i }));

  const findingTitle = await screen.findByText('Found MD5 Hashing');
  expect(screen.getAllByText('TLS Results')).toHaveLength(2);
  expect(screen.queryByText('Header Results')).not.toBeInTheDocument();

  const findingSummary = findingTitle.closest('summary');

  expect(findingSummary).toBeTruthy();
  fireEvent.click(findingSummary as HTMLElement);
  expect(screen.getByText(/MD5 is a known deprecated hash/)).toBeInTheDocument();
  expect(screen.getByText(/The match does not determine whether usage is security-sensitive/)).toBeInTheDocument();
  expect(screen.getByText(/Remove MD5/)).toBeInTheDocument();
  expect(screen.getByText(/Status: Deprecated/)).toBeInTheDocument();

  const links = screen.getAllByRole('link', { name: /reference 1/i });
  expect(links[0]).toHaveAttribute('target', '_blank');
  expect(links[0]).toHaveAttribute('rel', 'noreferrer');

  await waitFor(() => {
    expect(document.body.textContent).not.toContain('secretRawToken');
  });
});
