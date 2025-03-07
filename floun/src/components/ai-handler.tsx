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
        const executiveSummary = await generateChatMessage(
            `Write a concise executive summary (max 150 words) on quantum-safe cryptography based on the following findings:\n${allResults.join("\n")}`
        );
        const vulnerabilityLocations = await generateChatMessage(
            `Summarize where the vulnerabilities are located in 2-3 sentences based on the following findings:\n${allResults.join("\n")}`
        );
        const replacementMethods = await generateChatMessage(
            `Suggest quantum safe cryptographic methods to replace the vulnerable ones in 2-3 sentences based on the following findings:\n${allResults.join("\n")}`
        );
        const backgroundContext = await generateChatMessage(
            `Provide some background context about quantum-safe cryptography in 2-3 sentences based on the following findings:\n${allResults.join("\n")}`
        );
        const riskAssessment = await generateChatMessage(
            `Assess the risk of the identified vulnerabilities in 2-3 sentences based on the following findings:\n${allResults.join("\n")}`
        );
        const recommendations = await generateChatMessage(
            `Provide short-term and long-term recommendations for mitigating the identified vulnerabilities in 2-3 sentences based on the following findings:\n${allResults.join("\n")}`
        );

        // Sanitize the AI-generated content
        const reportContent = {
            executiveSummary: sanitizeContent(executiveSummary),
            vulnerabilityLocations: sanitizeContent(vulnerabilityLocations),
            replacementMethods: sanitizeContent(replacementMethods),
            backgroundContext: sanitizeContent(backgroundContext),
            riskAssessment: sanitizeContent(riskAssessment),
            recommendations: sanitizeContent(recommendations),
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