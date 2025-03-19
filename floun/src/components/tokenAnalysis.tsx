import FormatTest from './sessiontokenanalysis/formattest';
import EntropyTest from './sessiontokenanalysis/entropytest';
import PatternTest from './sessiontokenanalysis/patterntest';
import FrequencyTest from './sessiontokenanalysis/frequencytest';

export const analyzeTokens = (tokens: any[]): string[] => {
  const results: string[] = [];

  tokens.forEach(token => {
    // Skip empty, whitespace-only tokens, or tokens that equal "No tokens found"
    if (!token || token.trim() === "" || token === "No tokens found") {
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