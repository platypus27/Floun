import { getEncryptionPatterns } from './cryptographyAnalysisEngine';

export const analyzeCryptoInJavascript = (scripts: any[]): string[] => {
  const vulnerabilities: string[] = [];
  const encryptionPatterns = getEncryptionPatterns();

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
          `Found ${pattern.name} in ${script.type || 'unknown'} script: ${script.src || 'inline'}\nSample code: ${snippet}`
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