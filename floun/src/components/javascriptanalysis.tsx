export const analyzeCryptoInJavascript = (scripts: any[]): string[] => {
  const vulnerabilities: string[] = [];

  // Define patterns for cryptographic algorithms and insecure practices
  const cryptoPatterns = [
    { name: 'MD5', regex: /MD5|md5/ },
    { name: 'SHA-1', regex: /SHA-?1|sha-?1/ },
    { name: 'DES', regex: /DES|des/ },
    { name: 'RC4', regex: /RC4|rc4/ },
    { name: 'CryptoJS', regex: /CryptoJS/ },
    { name: 'Weak random number generation', regex: /Math\.random\(\)/ },
    { name: 'Insecure key size', regex: /\.generateKey\(\s*(\d+)\s*\)/ },
    { name: 'AES with ECB mode', regex: /AES\.encrypt\(.*,\s*.*,\s*{ mode: CryptoJS\.mode\.ECB\s*}\)/ },
    { name: 'RSA with weak key size', regex: /RSA\.generateKeyPair\(\s*1024\s*\)/ },
    { name: 'bcrypt with low rounds', regex: /bcrypt\.hashSync\(.*,\s*5\s*\)/ },
  ];

  // Iterate through each script
  scripts.forEach((script) => {
    const content = script.content || '';

    // Check for cryptographic patterns
    cryptoPatterns.forEach((pattern) => {
      if (pattern.regex.test(content)) {
        vulnerabilities.push(`Found ${pattern.name} in ${script.type} script: ${script.src || 'inline'}`);
      }
    });
  });

  console.log(scripts);
  console.log(vulnerabilities);

  return vulnerabilities.length > 0 ? vulnerabilities : ['No cryptographic vulnerabilities found'];
};