export interface EncryptionPattern {
    name: string;
    regex: RegExp;
    safety: 'Safe' | 'Vulnerable';
  }
  
  /**
   * Returns a list of regex patterns that detect encryption-related code,
   * including both classical and quantum-safe methods as well as vulnerable ones.
   */
  export const getEncryptionPatterns = (): EncryptionPattern[] => [
    { 
      name: 'AES Encryption', 
      regex: /\bAES\b\s*\.\s*encrypt\s*\([^)]*\)/gi,
      safety: 'Safe'
    },
    { 
      name: 'RSA Key Generation', 
      regex: /\bRSA\b\s*\.\s*generate(?:KeyPair|Key)\s*\(\s*\d+\s*\)/gi,
      safety: 'Safe'
    },
    { 
      name: 'Triple DES Encryption', 
      regex: /\b(?:Triple\s+DES|3DES)\b\s*\.\s*encrypt\s*\([^)]*\)/gi,
      safety: 'Vulnerable'
    },
    { 
      name: 'DES Encryption', 
      regex: /\bDES\b\s*\.\s*encrypt\s*\([^)]*\)/gi,
      safety: 'Vulnerable'
    },
    { 
      name: 'RC4 Encryption', 
      regex: /\bRC4\b\s*\.\s*encrypt\s*\([^)]*\)/gi,
      safety: 'Vulnerable'
    },
    { 
      name: 'CryptoJS Usage', 
      regex: /\bCryptoJS\b/gi,
      safety: 'Safe'
    },
    // Quantum-safe / Post-quantum cryptographic methods:
    {
      name: 'NTRU Encryption',
      regex: /\bNTRUEncrypt\b\s*\([^)]*\)/gi,
      safety: 'Safe'
    },
    {
      name: 'FrodoKEM Encryption',
      regex: /\bFrodoKEM\b\s*\([^)]*\)/gi,
      safety: 'Safe'
    },
    {
      name: 'Kyber Encryption',
      regex: /\bKyber\b\s*\([^)]*\)/gi,
      safety: 'Safe'
    },
    {
      name: 'McEliece Encryption',
      regex: /\bMcEliece\b\s*\([^)]*\)/gi,
      safety: 'Safe'
    },
    {
      name: 'SABER Encryption',
      regex: /\bSABER\b\s*\([^)]*\)/gi,
      safety: 'Safe'
    },
    // Additional vulnerable / legacy methods:
    {
      name: 'MD5 Hashing',
      regex: /\bMD5\b\s*\(/gi,
      safety: 'Vulnerable'
    },
    {
      name: 'SHA-1 Hashing',
      regex: /\bSHA-1\b\s*\(/gi,
      safety: 'Vulnerable'
    },
  ];