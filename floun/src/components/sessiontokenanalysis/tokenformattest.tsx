interface TokenData {
    token: string;
    timestamp?: number;
    source?: string;
    cookieName?: string;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: string;
    headerName?: string;
    storageKey?: string;
}

interface TestResult {
    passed: boolean;
    message: string;
    details?: string;
    format?: string;
    jwtHeader?: string;
    jwtPayload?: string;
    jwtAlgorithm?: string;
    vulnerabilities?: string[];
}

const TokenFormatTest = ({ tokenData }: { tokenData: TokenData }): TestResult => {
    const runTest = (): TestResult => {
        const { token } = tokenData;

        if (!token || token === "No tokens found") {
            return { passed: false, message: "Token is missing.", details: "Missing" };
        }

        // Base64URL decoding function (Correct)
        const base64urlDecode = (str: string) => {
            str = str.replace(/-/g, '+').replace(/_/g, '/');
            while (str.length % 4) {
                str += '=';
            }
            try {
                return atob(str);
            } catch (error) {
                return null;
            }
        };

        // 1. JWT Check with Vulnerability Analysis
        const parts = token.split('.');
        if (parts.length === 3) {
            const [headerB64u, payloadB64u] = parts;
            const jwtHeader = base64urlDecode(headerB64u);
            const jwtPayload = base64urlDecode(payloadB64u);

            if (jwtHeader && jwtPayload) {
                let jwtAlgorithm: string | undefined;
                let jwtExp: number | undefined;
                const vulnerabilities: string[] = [];

                try {
                    const parsedHeader = JSON.parse(jwtHeader);
                    jwtAlgorithm = parsedHeader.alg;

                    // Check for "none" algorithm (major vulnerability)
                    if (jwtAlgorithm === "none") {
                        vulnerabilities.push("JWT uses 'none' algorithm, which is insecure.");
                    }

                    // Check for missing "kid" (optional but important for key rotation)
                    if (!parsedHeader.kid) {
                        vulnerabilities.push("JWT does not have a 'kid' claim, which may be insecure for key rotation.");
                    }
                } catch (headerParseError) {
                    jwtAlgorithm = undefined;
                }

                try {
                    const parsedPayload = JSON.parse(jwtPayload);
                    jwtExp = parsedPayload.exp;

                    // Check if expiration is missing or very short-lived
                    if (typeof jwtExp !== 'number') {
                        vulnerabilities.push("JWT 'exp' claim is missing or not a number.");
                    } else {
                        const expTime = new Date(jwtExp * 1000);
                        if (expTime < new Date()) {
                            vulnerabilities.push("JWT is expired.");
                        }
                    }
                } catch (payloadParseError: any) {
                    vulnerabilities.push(`Error parsing JWT payload: ${payloadParseError.message}`);
                }

                return {
                    passed: vulnerabilities.length === 0,
                    message: vulnerabilities.length === 0 ? "Token appears to be a valid JWT." : "JWT has potential vulnerabilities!",
                    details: "jwt",
                    format: "jwt",
                    jwtHeader,
                    jwtPayload,
                    jwtAlgorithm,
                    vulnerabilities,
                };
            }
        }

        // 2. Hexadecimal Token Check
        if (token.length >= 32 && /^[a-f0-9]+$/i.test(token)) {
            return {
                passed: true,
                message: "Token likely matches hex format.",
                format: "hex",
                details: "hex",
            };
        }

        // 3. UUID + Alphanumeric Check
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[a-zA-Z0-9]+$/.test(token)) {
            return {
                passed: true,
                message: "Token likely matches UUID + alphanumeric format.",
                format: "uuid_alphanumeric",
                details: "uuid_alphanumeric",
            };
        }

        // 4. Improved Base64URL Check
        if (/^[A-Za-z0-9_-]+$/.test(token) && token.length % 4 !== 1) {
            const decoded = base64urlDecode(token);
            if (decoded) {
                return {
                    passed: true,
                    message: "Token likely matches base64url format.",
                    format: "base64url",
                    details: "base64url",
                };
            }
        }

        // 5. Structured Opaque Token Check
        if (/^(v\d+_).+/.test(token) || token.includes("_")) {
            return {
                passed: true,
                message: "Token likely matches structured opaque format.",
                format: "opaque_structured",
                details: "opaque_structured",
            };
        }

        // 6. General Opaque Token Check (last fallback)
        if (token.length >= 16) {
            return {
                passed: true,
                message: "Token does not match known formats and is likely an opaque token.",
                details: "opaque",
                format: "opaque",
            };
        }

        // 7. Fallback: Unknown
        return {
            passed: false,
            message: "Token format could not be determined (too short).",
            details: "Unknown Format",
        };
    };

    return runTest();
};

export default TokenFormatTest;