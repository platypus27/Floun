interface TokenData {
    token: string;
}

interface TestResult {
    passed: boolean;
    message: string;
    details?: string;
    vulnerabilities?: string[];
    frequencyAnalysis?: { [char: string]: number }; 
}

const FrequencyTest = ({ tokenData }: { tokenData: TokenData }): TestResult => {
    const runTest = (): TestResult => {
        const token = tokenData.token;

        if (!token || token === "No tokens found") {
            return {
                passed: false,
                message: "Frequency analysis test failed: Token is empty.",
            };
        }

        const frequencies: { [char: string]: number } = {};
        for (const char of token) {
            frequencies[char] = (frequencies[char] || 0) + 1;
        }

        const totalChars = token.length;
        const threshold = totalChars < 32 ? 0.2 : totalChars < 64 ? 0.15 : 0.1; 

        let anomalyDetected = false;
        let anomalyMessage = "";

        for (const char in frequencies) {
            const frequency = frequencies[char] / totalChars;
            if (frequency > threshold) {
                anomalyDetected = true;
                anomalyMessage += `Character '${char}' appears too frequently (${(frequency * 100).toFixed(2)}%). `;
            }
        }

        const pass = !anomalyDetected; // Pass if no anomalies are detected

        return {
            passed: pass,
            message: pass
                ? "Frequency analysis test passed: Character distribution appears reasonably uniform."
                : `Frequency analysis test failed: ${anomalyMessage}`,
            details: anomalyDetected ? "Frequency Anomaly" : "Uniform Distribution",
            frequencyAnalysis: frequencies, // Return the frequency analysis data
        };
    };

    return runTest();
};

export default FrequencyTest;