export const analyzeCryptoInJavascript = (scripts: any[]): string[] => {
  const vulnerabilities: string[] = [];

  // Define patterns for cryptographic algorithms and insecure practices (global flag added)
  const cryptoPatterns = [
    { name: 'MD5', regex: /MD5|md5/g },
    { name: 'SHA-1', regex: /SHA-?1|sha-?1/g },
    { name: 'DES', regex: /DES|des/g },
    { name: 'RC4', regex: /RC4|rc4/g },
    { name: 'CryptoJS', regex: /CryptoJS/g },
    { name: 'Weak random number generation', regex: /Math\.random\(\)/g },
    { name: 'Insecure key size', regex: /\.generateKey\(\s*(\d+)\s*\)/g },
    {
      name: 'AES with ECB mode',
      regex: /AES\.encrypt\(.*,\s*.*,\s*{ mode: CryptoJS\.mode\.ECB\s*}\)/g,
    },
    { name: 'RSA with weak key size', regex: /RSA\.generateKeyPair\(\s*1024\s*\)/g },
    { name: 'bcrypt with low rounds', regex: /bcrypt\.hashSync\(.*,\s*5\s*\)/g },
  ];

  // For each script, search for vulnerabilities and include a code snippet sample.
  scripts.forEach((script) => {
    const content = script.content || '';
    cryptoPatterns.forEach((pattern) => {
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

  console.log(scripts);
  console.log(vulnerabilities);

  return vulnerabilities.length > 0
    ? vulnerabilities
    : ['No cryptographic vulnerabilities found'];
};