import PDFDocument from "pdfkit";
import fs from "fs";

interface ReportContent {
    executiveSummary: string;
    vulnerableMethodsCount: number;
    vulnerabilityLocations: string;
    replacementMethods: string;
    backgroundContext: string;
}

/**
 * Generate a PDF report with a logo, centralized headers, and a footer.
 * @param coverDetails - Report title and logo path
 * @param content - Report content
 * @param outputPath - File path to save the PDF
 */
export function generatePDFReport(
    coverDetails: { title: string; logoPath: string },
    content: ReportContent,
    outputPath: string
): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: "A4",
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            // ========== LOGO ==========
            if (fs.existsSync(coverDetails.logoPath)) {
                doc.image(coverDetails.logoPath, 50, 50, { width: 100 });
            }

            // ========== TITLE ==========
            doc.fontSize(20)
                .font("Helvetica-Bold")
                .fillColor("#333")
                .text(coverDetails.title, { align: "center" })
                .moveDown(2);

            // ========== EXECUTIVE SUMMARY ==========
            doc.fontSize(14)
                .font("Helvetica-Bold")
                .fillColor("#333")
                .text("Executive Summary", { align: "center" })
                .moveDown(1);

            doc.fontSize(12)
                .font("Helvetica")
                .fillColor("#000")
                .text(content.executiveSummary, { align: "left", lineGap: 5 })
                .moveDown(2);

            // ========== VULNERABLE CRYPTOGRAPHIC METHODS ==========
            doc.fontSize(14)
                .font("Helvetica-Bold")
                .fillColor("#333")
                .text("Number of Vulnerable Cryptographic Methods", { align: "center" })
                .moveDown(1);

            doc.fontSize(12)
                .font("Helvetica")
                .fillColor("#000")
                .text(`Number of cases: ${content.vulnerableMethodsCount}`, { align: "left", lineGap: 5 })
                .moveDown(2);

            // ========== LOCATION OF VULNERABILITIES ==========
            doc.fontSize(14)
                .font("Helvetica-Bold")
                .fillColor("#333")
                .text("Where are the vulnerabilities at?", { align: "center" })
                .moveDown(1);

            doc.fontSize(12)
                .font("Helvetica")
                .fillColor("#000")
                .text(content.vulnerabilityLocations, { align: "left", lineGap: 5 })
                .moveDown(2);

            // ========== REPLACEMENT METHODS ==========
            doc.fontSize(14)
                .font("Helvetica-Bold")
                .fillColor("#333")
                .text("Recommendations", { align: "center" })
                .moveDown(1);

            doc.fontSize(12)
                .font("Helvetica")
                .fillColor("#000")
                .text(content.replacementMethods, { align: "left", lineGap: 5 })
                .moveDown(2);

            // ========== BACKGROUND CONTEXT ==========
            doc.fontSize(14)
                .font("Helvetica-Bold")
                .fillColor("#333")
                .text("Background", { align: "center" })
                .moveDown(1);

            doc.fontSize(12)
                .font("Helvetica")
                .fillColor("#000")
                .text(content.backgroundContext, { align: "left", lineGap: 5 })
                .moveDown(2);

            // ========== CONFIDENTIAL MESSAGE ==========
            doc.fontSize(12)
                .font("Helvetica-Bold")
                .fillColor("#333")
                .text("Confidential for internal use only", { align: "center" });

            // Finalize the PDF
            doc.end();

            stream.on("finish", () => {
                console.log(`PDF saved successfully at: ${outputPath}`);
                resolve();
            });

            stream.on("error", (err) => {
                console.error("Error writing PDF:", err);
                reject(err);
            });

        } catch (error) {
            console.error("Error generating PDF:", error);
            reject(error);
        }
    });
}