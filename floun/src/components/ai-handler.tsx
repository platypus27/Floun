import { generateChatMessage } from "./reportgen/geminiService";
import * as fs from "fs-extra";
import { generatePDFReport } from "./reportgen/pdfService";

// Function to sanitize and clean content
function sanitizeContent(text: string): string {
    return text
        .replace(/[^\x00-\x7F]/g, "") // Remove non-ASCII characters
        .replace(/–/g, "-")
        .replace(/—/g, "--")
        .replace(/“|”/g, '"')
        .replace(/‘|’/g, "'")
        .replace(/\r?\n|\r/g, " "); // Remove unnecessary line breaks
}

const coverDetails = {
    title: "Quantum Safe Cryptography Report",
    logoPath: "assets/logo.jpg"
};

// Function to parse results into a structured format
function parseResults(results: string[]): string {
    let parsedResults = "";

    results.forEach((result) => {
        if (result.includes("Found AES Encryption")) {
            parsedResults += "AES Encryption found in inline script.\n";
        } else if (result.includes("Found CryptoJS Usage")) {
            parsedResults += "CryptoJS usage found in inline script.\n";
        } else if (result.includes("Certificate Not Quantum-Safe")) {
            parsedResults += "Non-quantum-safe certificate detected (SHA-256 with RSA).\n";
        } else if (result.includes("Token")) {
            if (result.includes("Format Test Passed: false")) {
                parsedResults += "Vulnerable token format detected.\n";
            } else {
                parsedResults += "Token format test passed, but entropy test failed.\n";
            }
        }
    });

    return parsedResults;
}

async function createReport() {
    console.log("Generating AI report...");

    try {
        // Example results from the program
        const results = [
            "Found AES Encryption in inline script: inline",
            "Found CryptoJS Usage in inline script: inline",
            "Certificate Not Quantum-Safe, Hash Result: sha256WithRSAEncryption",
            "Token: 4294%2C5164%2C1788%2C5176%2C6249%2C9902, Format Test Passed: true, Format Test Message: Token does not match known formats and is likely an opaque token., Entropy Test Passed: false, Entropy Test Message: Entropy test failed. Actual: 3.27, Max Possible: 3.46",
            "Token: 77af778b51abd4a3c51c5ddd97204a9c3ae614ebccb75a606c3b6865aed6744e, Format Test Passed: false, Format Test Message: (should show type of vulnerable hash), entropy test can disregard"
        ];

        // Parse the results into a structured format
        const parsedResults = parseResults(results);

        // Generate AI content for each section
        const executiveSummary = await generateChatMessage(
            `Write a concise executive summary (max 150 words) on quantum-safe cryptography based on the following findings:\n${parsedResults}`
        );
        const vulnerableMethodsCount = await generateChatMessage(
            `Summarize the number of vulnerable cryptographic methods found in 2-3 sentences based on the following findings:\n${parsedResults}`
        );
        const vulnerabilityLocations = await generateChatMessage(
            `Summarize where the vulnerabilities are located in 2-3 sentences based on the following findings:\n${parsedResults}`
        );
        const replacementMethods = await generateChatMessage(
            `Suggest cryptographic methods to replace the vulnerable ones in 2-3 sentences based on the following findings:\n${parsedResults}`
        );
        const backgroundContext = await generateChatMessage(
            `Provide some background context about quantum-safe cryptography in 2-3 sentences based on the following findings:\n${parsedResults}`
        );

        const reportContent = {
            executiveSummary: sanitizeContent(executiveSummary),
            vulnerableMethodsCount: parseInt(vulnerableMethodsCount, 10) || 0, // Default to 0 if parsing fails
            vulnerabilityLocations: sanitizeContent(vulnerabilityLocations),
            replacementMethods: sanitizeContent(replacementMethods),
            backgroundContext: sanitizeContent(backgroundContext)
        };

        // Generate the PDF report
        await generatePDFReport(coverDetails, reportContent, "Quantum_Safe_Report.pdf");

        console.log("Report successfully generated at: Quantum_Safe_Report.pdf ✅");
    } catch (error) {
        console.error("Error during report generation:", error);
    }
}

// Start the report generation
createReport();