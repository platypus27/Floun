// session token analysis, autoscan getTokens() will return all session tokens
// including cookies, local storage, and session storage
// try get the logic for session token analysis

import FormatTest from './sessiontokenanalysis/formattest';
import EntropyTest from './sessiontokenanalysis/entropytest';
import PatternTest from './sessiontokenanalysis/patterntest';

export const analyzeTokens = (tokens: any[]): string[] => {
  const results: string[] = [];
  const vulnerableTokens: string[] = [];

  tokens.forEach(token => {
    const formatTestResult = FormatTest({ tokenData: { token: token } });
    const entropyTestResult = EntropyTest({ tokenData: { token: token } });
    const patternTestResult = PatternTest({ tokenData: { token: token } });

    const results = [formatTestResult, entropyTestResult, patternTestResult];

    const tokenErrors = new Map();

    for (const result of results) {
      if (!result.passed || (result.vulnerabilities && result.vulnerabilities.length > 0)) {
        // Get existing errors for this token, or create a new array if none exist
        const existingErrors = tokenErrors.get(token) || [];

        // Add the new error message to the array
        existingErrors.push(result.message);

        // Store (or update) the errors for this token in the map
        tokenErrors.set(token, existingErrors);
      }
    }

    // Iterate over the map and format the output for each token with multiple error messages
    for (const [token, messages] of tokenErrors) {
      vulnerableTokens.push(`Token: ${token}, Messages: ${messages.join('; ')}`);
    }

    // console.log(`Token: ${token}, Entropy Test Passed: ${entropyTestResult.passed}, Entropy Test Message: ${entropyTestResult.message}`);
    // console.log(`Token: ${token}, Format Test Passed: ${formatTestResult.passed}, Format Test Message: ${formatTestResult.message}, Entropy Test Passed: ${entropyTestResult.passed}, Entropy Test Message: ${entropyTestResult.message}, Pattern Test Passed: ${patternTestResult.passed}, Pattern Test Message: ${patternTestResult.message}`);
  });
  return vulnerableTokens;
};

// Example Usage (for testing)
// const validJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'; // Example valid JWT
// const invalidJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
// const opaqueToken = 'this_is_a_long_opaque_token_string_1234567890abcdef';
// const shortOpaqueToken = 'shorttoken';
// const emptyToken = '';
// const sequentialToken = "abcdefghijklmnop"; // Sequential Token
// const repetitiveToken = "abababababababab"; // Repetitive Token
// const longSequentialToken = "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz"; // long sequential
// const similarTokens = ["abcdefghijklmnop", "abcdefghijklmn12345", "abcdefghijklmn67890"]; //similar tokens
// const testTokens = [validJwt, invalidJwt, opaqueToken, shortOpaqueToken, emptyToken, sequentialToken, repetitiveToken, longSequentialToken, similarTokens];

// analyzeTokens(testTokens);
