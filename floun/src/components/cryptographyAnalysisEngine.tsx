export interface EncryptionPattern {
    name: string;
    regex: RegExp;
}

/**
 * Returns a list of regex patterns that detect encryption-related code.
 * Update or extend these patterns as needed.
 */
export const getEncryptionPatterns = (): EncryptionPattern[] => [
    { 
        name: 'AES Encryption', 
        // Matches "AES.encrypt(...)" with proper boundaries
        regex: /\bAES\b\s*\.\s*encrypt\s*\([^)]*\)/gi 
    },
    { 
        name: 'RSA Key Generation', 
        // Matches "RSA.generateKeyPair(1024)" or similar with proper boundaries
        regex: /\bRSA\b\s*\.\s*generate(?:KeyPair|Key)\s*\(\s*\d+\s*\)/gi 
    },
    { 
        name: 'Triple DES Encryption', 
        // Matches "Triple DES.encrypt(...)" or "3DES.encrypt(...)" ensuring DES is isolated.
        regex: /\b(?:Triple\s+DES|3DES)\b\s*\.\s*encrypt\s*\([^)]*\)/gi 
    },
    { 
        name: 'DES Encryption', 
        // Matches "DES.encrypt(...)" with DES as a full word
        regex: /\bDES\b\s*\.\s*encrypt\s*\([^)]*\)/gi 
    },
    { 
        name: 'RC4 Encryption', 
        regex: /\bRC4\b\s*\.\s*encrypt\s*\([^)]*\)/gi 
    },
    { 
        name: 'CryptoJS Usage', 
        // Looks for CryptoJS usage properly
        regex: /\bCryptoJS\b/gi 
    },
];