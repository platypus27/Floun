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

const coverDetails = {
    title: "Quantum Safe Cryptography Report",
    logoBase64: logoBase64 // Use the imported base64 string
};

export async function createReport(jsResults: string[], tokenResults: string[]) {
    console.log("Generating AI report...");

    try {
        // Combine jsResults and tokenResults into a single array
        const results = [...jsResults, ...tokenResults];

        // Generate AI content for each section
        const executiveSummary = await generateChatMessage(
            `Write a concise executive summary (max 150 words) on quantum-safe cryptography based on the following findings:\n${results.join("\n")}`
        );
        const vulnerableMethodsCount = await generateChatMessage(
            `Summarize the number of vulnerable cryptographic methods found in 2-3 sentences based on the following findings:\n${results.join("\n")}`
        );
        const vulnerabilityLocations = await generateChatMessage(
            `Summarize where the vulnerabilities are located in 2-3 sentences based on the following findings:\n${results.join("\n")}`
        );
        const replacementMethods = await generateChatMessage(
            `Suggest cryptographic methods to replace the vulnerable ones in 2-3 sentences based on the following findings:\n${results.join("\n")}`
        );
        const backgroundContext = await generateChatMessage(
            `Provide some background context about quantum-safe cryptography in 2-3 sentences based on the following findings:\n${results.join("\n")}`
        );

        // Sanitize the AI-generated content
        const reportContent = {
            executiveSummary: sanitizeContent(executiveSummary),
            vulnerableMethodsCount: parseInt(vulnerableMethodsCount, 10) || 0,
            vulnerabilityLocations: sanitizeContent(vulnerabilityLocations),
            replacementMethods: sanitizeContent(replacementMethods),
            backgroundContext: sanitizeContent(backgroundContext)
        };

        // Generate the PDF report
        await generatePDFReport(coverDetails, reportContent);

        console.log("Report successfully generated ✅");
    } catch (error) {
        console.error("Error during report generation:", error);
    }
}