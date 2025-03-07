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
    logoBase64: logoBase64 // Use the imported base64 string
};

export async function createReport(jsResults: string[], tokenResults: string[], headerResults: string[], certResults: string[]) {
    // console.log("Generating AI report...");

    try {
        // Count the number of vulnerable cryptographic methods from jsResults and tokenResults
        const jsVulnerableCount = countVulnerableMethods(jsResults);
        const tokenVulnerableCount = countVulnerableMethods(tokenResults);
        const headerVulnerableCount = countVulnerableMethods(headerResults);
        const certVulnerableCount = countVulnerableMethods(certResults);
        const totalVulnerableCount = jsVulnerableCount + tokenVulnerableCount + headerVulnerableCount + certVulnerableCount;

        // Generate a formatted string for the vulnerable methods count
        const vulnerableMethodsBreakdown = `Number of cases: ${totalVulnerableCount} (JS: ${jsVulnerableCount}, Tokens: ${tokenVulnerableCount}, Headers: ${headerVulnerableCount}, Certificates: ${certVulnerableCount})`;

        // Combine all results into a single array
        const allResults = [...jsResults, ...tokenResults, ...headerResults, ...certResults];

        // console.log('allResults is: ', allResults.join("\n"));

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

        // Sanitize the AI-generated content
        const reportContent = {
            executiveSummary: sanitizeContent(executiveSummary),
            vulnerableMethodsCount: totalVulnerableCount, // Keep this as a number
            vulnerableMethodsBreakdown: vulnerableMethodsBreakdown, // Add this for the formatted string
            vulnerabilityLocations: sanitizeContent(vulnerabilityLocations),
            replacementMethods: sanitizeContent(replacementMethods),
            backgroundContext: sanitizeContent(backgroundContext)
        };

        // Generate the PDF report
        await generatePDFReport(coverDetails, reportContent);

        // console.log("Report successfully generated ✅");
    } catch (error) {
        console.error("Error during report generation:", error);
    }
}