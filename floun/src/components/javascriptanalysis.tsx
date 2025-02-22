export const analyzeCryptoInJavascript = (scripts: any[]): string[] => {
  console.log("running analyzeCryptoInJavascript");
  const vulnerabilities: string[] = [];
  
  const encryptionPatterns = [
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
        // Matches "DES.encrypt(...)" with DES as a full word (won't flag "describe")
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
    { 
        name: 'Insecure Random (Math.random)', 
        regex: /Math\s*\.\s*random\s*\(\s*\)/gi 
    },
];

  // For each script, search for vulnerabilities and include a code snippet sample.
  scripts.forEach((script) => {
    const content = script.content || '';
    encryptionPatterns.forEach((pattern) => {
      // Reset pointer in case regex is global
      pattern.regex.lastIndex = 0;
      let match;
      while ((match = pattern.regex.exec(content)) !== null) {
        // Determine a snippet range (30 characters before and after the match)
        const snippetStart = Math.max(match.index - 30, 0);
        const snippetEnd = Math.min(match.index + match[0].length + 30, content.length);
        const snippet = content.substring(snippetStart, snippetEnd).replace(/\n/g, ' ');
        vulnerabilities.push(
          `Found ${pattern.name} in ${script.type} script: ${script.src || 'inline'}\nSample code: ${snippet}`
        );
      }
    });
  });

  console.log("scripts", scripts);
  console.log("vuln", vulnerabilities);

  return vulnerabilities.length > 0
    ? vulnerabilities
    : ['No cryptographic vulnerabilities found'];
};