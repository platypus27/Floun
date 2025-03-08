//// filepath: /g:/Git Projects/ICT2214/floun/src/components/tokenAnalysis.tsx
import FormatTest from './sessiontokenanalysis/formattest';
import EntropyTest from './sessiontokenanalysis/entropytest';
import PatternTest from './sessiontokenanalysis/patterntest';
import FrequencyTest from './sessiontokenanalysis/frequencytest';

export const analyzeTokens = (tokens: any[]): string[] => {
  const results: string[] = [];

  tokens.forEach(token => {
    // Skip empty or whitespace-only tokens.
    if (!token || token.trim() === "") {
      return;
    }

    const formatTestResult = FormatTest({ tokenData: { token } });
    const entropyTestResult = EntropyTest({ tokenData: { token } });
    const patternTestResult = PatternTest({ tokenData: { token } });
    const frequencyTestResult = FrequencyTest({ tokenData: { token } });

    if (
      formatTestResult.passed &&
      entropyTestResult.passed &&
      patternTestResult.passed &&
      frequencyTestResult.passed
    ) {
      results.push(`Found token ${token} [Safe] in Tokens`);
    } else {
      results.push(`Found token ${token} [Vulnerable] in Tokens`);
    }
  });

  return results;
};