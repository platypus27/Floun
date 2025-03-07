// session token analysis, autoscan getTokens() will return all session tokens
// including cookies, local storage, and session storage
// try get the logic for session token analysis

import FormatTest from './sessiontokenanalysis/formattest';
import EntropyTest from './sessiontokenanalysis/entropytest';
import PatternTest from './sessiontokenanalysis/patterntest';
import FrequencyTest from './sessiontokenanalysis/frequencytest';

export const analyzeTokens = (tokens: any[]): string[] => {
  const results: string[] = [];

  tokens.forEach(token => {
    const formatTestResult = FormatTest({ tokenData: { token: token } });
    const entropyTestResult = EntropyTest({ tokenData: { token: token } });
    const patternTestResult = PatternTest({ tokenData: { token: token } });
    const frequencyTestResult = FrequencyTest({ tokenData: { token: token } });

    if (formatTestResult.passed && entropyTestResult.passed && patternTestResult.passed && frequencyTestResult.passed) {
      results.push(`Found token ${token} [Safe] in Tokens`); // Push to safe if all tests pass
    } else {
      results.push(`Found token ${token} [Vulnerable] in Tokens`); // Push to vulnerable if any test fails
    }
  });
  // console.log(results);
  return results;
};


// Example Usage (for testing)
// ✅ Valid
const validJWT = "eyJhbGciOiJIUzI1NiIsImtpZCI6IkhTMjU2LUJlc3Qta2V5IiwidHlwIjoiSldUIn0.eyJ1c2VyX2lkIjoiOTkwNjQxZjAtYjQ2MS00ZjAxLWFhZmItNjFlNmY1YmI0NjYzIiwibmFtZSI6IldXWm0wV1lBdTltM2hXZ3Z1IiwiZW50cm9weSI6IkV4dHJhU3RyUjFfRmx1c0hrNGJvNlBRMFh4cmh4NmpRUmp3OGNpVzJha0IiLCJleHAiOjE4OTM0NTYwMDB9.n2sQLZhHQswQ97AHPxPav0ZBdcO1Snvd3klRPfK8c34";
const HexToken = "9f6a2d3c8b5e6f47a1c29d0f5b7e8d3a4c6f2b9d7e1a8c3f5d0b2e6a9c8f4d7b";
const UuidToken = "4f68c69b-2d0f-4a91-8f1e-cb7a3d2e5f0c";
const Base64Token = "QW5vZHV0eS1oMXJ5anVkZWFxZ3pyMTJmdnI0NnNxb3c";
const OpaqueToken = "v2_5bG9jYWxfcmFuZG9tXzE2eFVhSnZ3T1N5cG5rbQ";

// ❌ Invalid JWT #1 - Fails Format (None Algorithm)
const invalidJWT1 = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyX2lkIjoiMTIzNDU2IiwibmFtZSI6IkFsaWNlIiwiZXhwIjoxODkzNDU2MDAwfQ.";

// ❌ Invalid JWT #2 - Fails Entropy (Too Predictable)
const invalidJWT2 = "eyJhbGciOiJIUzI1NiIsImtpZCI6IkxPVy1FbnRyb3B5IiwidHlwIjoiSldUIn0.eyJ1c2VyX2lkIjoiMTIzNDU2NzgiLCJuYW1lIjoiU2ltcGxlTmFtZSIsImV4cCI6MTg5MzQ1NjAwMH0.ZFy_FQvSPpwbOOh5JGJmUNx5MLy9mHt_pjHvQ8XsZ1c";

// ❌ Invalid JWT #3 - Fails Pattern (Repeating Characters)
const invalidJWT3 = "eyJhbGciOiJIUzI1NiIsImtpZCI6IlJFRkVSRU5DRV8xMjMiLCJ0eXAiOiJKV1QifQ.eyJ1c2VyX2lkIjoiQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBIiwiZXhwIjoxODkzNDU2MDAwfQ.XXz5a1pUp7GXX5a1pUp7GXX5a1pUp7GXX5a1pUp7GXX5a1pUp7G";

// ❌ Invalid JWT #4 - Fails Frequency (Character Overuse)
const invalidJWT4 = "eyJhbGciOiJIUzI1NiIsImtpZCI6IlRPTy1NQU5ZLUktQ0hBUlMiLCJ0eXAiOiJKV1QifQ.eyJ1c2VyX2lkIjoiSXhJSGFJSGFJSGFJSGFJSGFJSGFJSGFJSGFJSGFJSGFJSGFJSGFJSGFJSGFJSGFJSGFJSGEiLCJleHAiOjE4OTM0NTYwMDB9.AAAAAAAx23456789abcdefghiABCDEFGHI123456789abcdefghiABCDEFGHI";

const invalidHexToken = "abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef";
const invalidUuidToken = "123e4567-e89b-12d3-a456-426614174000";
const invalidBase64Token = "QUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFB";


const testTokens = [validJWT, HexToken, UuidToken, Base64Token, OpaqueToken, invalidJWT1, invalidJWT2, invalidJWT3, invalidJWT4, invalidHexToken, invalidUuidToken, invalidBase64Token];

// analyzeTokens(testTokens);
