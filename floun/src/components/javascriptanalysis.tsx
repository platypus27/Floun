export const analyzeCryptoInJavaScript = async (
  jsScripts: any
): Promise<{
  totalScripts: number;
  cryptoScripts: number;
  cryptoDetails: {
    script: { type: string; content: string };
    findings: string[];
  }[];
}> => {
  let totalScripts = 0;
  let cryptoScripts = 0;
  const cryptoDetails: {
    script: { type: string; content: string };
    findings: string[];
  }[] = [];

  // Define keywords that indicate cryptographic operations.
  const cryptoKeywords = ['crypto', 'window.crypto', 'subtle', 'encrypt', 'decrypt'];

  if (Array.isArray(jsScripts)) {
    totalScripts = jsScripts.length;
    jsScripts.forEach(script => {
      const findings: string[] = [];
      const content = script.content || '';
      cryptoKeywords.forEach(keyword => {
        if (content.includes(keyword)) {
          findings.push(keyword);
        }
      });
      if (findings.length > 0) {
        cryptoScripts++;
        cryptoDetails.push({ script, findings });
      }
    });
  }

  return {
    totalScripts,
    cryptoScripts,
    cryptoDetails,
  };
};