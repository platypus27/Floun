import React from 'react';
import * as jose from 'jose';

interface TokenData {
  token: string;
  timestamp?: number;
  source?: string;
  cookieName?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: string;
  headerName?: string;
}

interface TestResult {
  passed: boolean;
  message: string;
  details?: string;
  format?: string;
  jwtHeader?: string;
  jwtPayload?: string;
  jwtAlgorithm?: string;
}

const TokenFormatTest = ({ tokenData }: { tokenData: TokenData }): TestResult => {
  const runTest = (): TestResult => {
      const { token } = tokenData;

      if (!token || token == "No tokens found") {
          return { passed: false, message: "Token is missing.", details: "Missing" };
      }

      // 1. Check if it looks like a JWT (three parts separated by dots)
      const parts = token.split('.');
      if (parts.length === 3) {
          try {
              const [headerB64u, payloadB64u, signatureB64u] = parts;

              // 2. Try to decode the header and payload (basic format check)
            const jwtHeader = atob(headerB64u);
            const jwtPayload = atob(payloadB64u);

              // 3. If we got here, it's *probably* a JWT. Let's parse the header (optional)
              let jwtAlgorithm: string | undefined;
              try {
                  const parsedHeader = JSON.parse(jwtHeader);
                  jwtAlgorithm = parsedHeader.alg;
              } catch (headerParseError) {
                  jwtAlgorithm = undefined; // Could not parse header
              }

              // 4. It passed the basic checks, so it appears to be a valid JWT
              return {
                  passed: true,
                  message: "Token appears to be a valid JWT.",
                  details: "jwt",
                  format: "jwt",
                  jwtHeader: jwtHeader,
                  jwtPayload: jwtPayload,
                  jwtAlgorithm: jwtAlgorithm,
              };

          } catch (error) {
              // 5. If *anything* went wrong, it's a malformed JWT
              return {
                  passed: false,
                  message: "Token is a malformed JWT.",
                  details: "Invalid JWT",
              };
          }
      }
      // 6. If it doesn't look like a JWT, check for opaque token
      else if (token.length > 32) {
          return {
              passed: true,
              message: "Token appears to be an opaque token",
              details: "opaque",
          };
      }
    
      // 7. Otherwise it's an invalid opaque token
      else{
         return {
              passed: false,
              message: "Token is too short to be an opaque token.",
              details: "Invalid Opaque",
          }
      }
     
  };

  return runTest();
};

export default TokenFormatTest;