// ai-handler.tsx
import { generateChatMessage } from "./reportgen/geminiService";
import { generatePDFReport } from "./reportgen/pdfService";
import { logoBase64 } from "./reportgen/logoBase64";

function sanitizeContent(text: string): string {
    return text
        .replace(/[^\x00-\x7F]/g, "") // eslint-disable-line no-control-regex
        .replace(/–/g, "-")
        .replace(/—/g, "--")
        .replace(/“|”/g, '"')
        .replace(/‘|’/g, "'")
        .replace(/\r?\n|\r/g, " "); // Remove unnecessary line breaks
}

// Function to count vulnerable methods
function countVulnerableMethods(results: string[]): number {
    return results.filter(result => result.includes("[Vulnerable]")).length;
}

const coverDetails = {
    title: "Quantum Safe Cryptography Report",
    subtitle: "Identifying and Mitigating Cryptographic Vulnerabilities",
    logoBase64: logoBase64, // Use the imported base64 string
    date: new Date().toLocaleDateString(),
    confidentialityNotice: "Confidential – For Internal Use Only"
};

export async function createReport(jsResults: string[], tokenResults: string[], headerResults: string[], certResults: string[]) {
    try {
        // Count the number of vulnerable cryptographic methods from jsResults and tokenResults
        const jsVulnerableCount = countVulnerableMethods(jsResults);
        const tokenVulnerableCount = countVulnerableMethods(tokenResults);
        const headerVulnerableCount = countVulnerableMethods(headerResults);
        const certVulnerableCount = countVulnerableMethods(certResults);
        const totalVulnerableCount = jsVulnerableCount + tokenVulnerableCount + headerVulnerableCount + certVulnerableCount;

        // Combine all results into a single array
        const allResults = [...jsResults, ...tokenResults, ...headerResults, ...certResults];

        // Generate AI content for each section
        const introduction = await generateChatMessage(
            'Write in paragraphs an introduction highlighting the purpose, scope and audience of quantum cryptography report for web security.'
        );
        const executiveSummary = await generateChatMessage(
            `Write in paragraphs an concise executive summary on quantum-safe cryptography based on the following findings. Do not output the tokens, hashes or certificates directly and no special characters, do include punctuations when necessary:\n${allResults.join("\n")}`
        );
        const vulnerabilityAnalysis = await generateChatMessage(
            `Write in paragraphs an analysis of the quantum cryptographic vulnerabilities found. Do not output the tokens, hashes or certificates directly no special characters, do include punctuations when necessary: \n${allResults.join("\n")}`
        );
        const riskAssessment = await generateChatMessage(
            `Write in paragraphs a risk assessment based on the quantum cryptographic vulnerabilities found. Do not output the tokens, hashes or certificates directly no special characters, do include punctuations when necessary:\n${allResults.join("\n")}`
        );
        const recommendations = await generateChatMessage(
            `Write in paragraphs providing short-term and long-term recommendations for mitigating the identified vulnerabilities based on the following findings Do not output the tokens, hashes or certificates directly no special characters, do include punctuations when necessary:\n${allResults.join("\n")}`
        );
        const nextStep = await generateChatMessage(
            `Write in paragraphs the next steps for implementing quantum-safe cryptography based on the quantum vulnerabilities found. Do not output the tokens, hashes or certificates directly no special characters, do include punctuations when necessary:\n${allResults.join("\n")}`
        );
        const conclusion = await generateChatMessage(
            `Write in paragraphs a conclusion summarizing the key findings and recommendations for quantum-safe cryptography based on the vulnerabilities found Do not output the tokens, hashes or certificates directly no special characters, do include punctuations when necessary:\n${allResults.join("\n")}`
        );

        // Sanitize the AI-generated content
        const reportContent = {
            introduction: sanitizeContent(introduction),
            executiveSummary: sanitizeContent(executiveSummary),
            vulnerabilityAnalysis: sanitizeContent(vulnerabilityAnalysis),
            riskAssessment: sanitizeContent(riskAssessment),
            recommendations: sanitizeContent(recommendations),
            nextStep: sanitizeContent(nextStep),
            conclusion: sanitizeContent(conclusion),
            appendix: `
                        Javascript Results: \n${jsResults.join("\n")}\n
                        Token Results: \n${tokenResults.join("\n")}\n
                        Header Results: \n${headerResults.join("\n")}\n
                        Certificate Results: \n${certResults.join("\n")}\n`,
            vulnerableMethodsCount: totalVulnerableCount,
            vulnerableMethodsBreakdown: `JS: ${jsVulnerableCount}, Tokens: ${tokenVulnerableCount}, Headers: ${headerVulnerableCount}, Certificates: ${certVulnerableCount}`
        };

        // Generate the PDF report
        await generatePDFReport(coverDetails, reportContent);

        console.log("Report successfully generated ✅");
    } catch (error) {
        console.error("Error during report generation:", error);
    }
}