export function entropy(s: string): number {
    if (!s || s.length === 0) {
      return 0; // Empty string has 0 entropy
    }
  
    const charCounts = new Map<string, number>();
    for (const char of s) {
      charCounts.set(char, (charCounts.get(char) || 0) + 1);
    }
  
    let entropyValue = 0;
    const totalChars = s.length;
    for (const count of charCounts.values()) {
      const probability = count / totalChars;
      entropyValue -= probability * Math.log2(probability);
    }
      
    // Normalize by the string length to return entropy per character
    return entropyValue;
  }