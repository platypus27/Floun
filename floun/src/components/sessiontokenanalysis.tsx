// session token analysis, autoscan getTokens() will return all session tokens
// including cookies, local storage, and session storage
// try get the logic for session token analysis

import TokenFormatTest from './sessiontokenanalysis/tokenformattest';
import EntropyTest from './sessiontokenanalysis/entropytest';

export const analyzeTokens = (tokens: any[]): string[] => {
  const results: string[] = [];

  tokens.forEach(token => {    
    const formatTestResult = TokenFormatTest({ tokenData: { token: token } });
    const entropyTestResult = EntropyTest({ tokenData: { token: token } });

    // console.log(`Token: ${token}, Entropy Test Passed: ${entropyTestResult.passed}, Entropy Test Message: ${entropyTestResult.message}`);

    results.push(`Token: ${token}, Format Test Passed: ${formatTestResult.passed}, Format Test Message: ${formatTestResult.message}, Entropy Test Passed: ${entropyTestResult.passed}, Entropy Test Message: ${entropyTestResult.message}`);
  });

  return results;
};

// Example Usage (for testing)
// const validJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'; // Example valid JWT
// const invalidJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
// const opaqueToken = 'this_is_a_long_opaque_token_string_1234567890abcdef'; 
// const shortOpaqueToken = 'shorttoken';
// const emptyToken = '';

// const testTokens = [validJwt, invalidJwt, opaqueToken, shortOpaqueToken, emptyToken];

// analyzeTokens(testTokens);