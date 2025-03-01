import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { saveAs } from "file-saver"; // Correct import for file-saver

interface ReportContent {
    executiveSummary: string;
    vulnerableMethodsCount: number;
    vulnerabilityLocations: string;
    replacementMethods: string;
    backgroundContext: string;
}

/**
 * Generate a PDF report with dynamic content.
 * @param coverDetails - Report title and optional logo path
 * @param content - Report content
 */
export async function generatePDFReport(
    coverDetails: { title: string; logoBase64?: string }, // Logo is optional
    content: ReportContent
): Promise<void> {
    try {
        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();

        // Load a standard font
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // Define layout constants
        const { width, height } = page.getSize();
        const margin = 50;
        let yOffset = height - margin; // Start from the top

        // Add logo (if provided)
        if (coverDetails.logoBase64) {
            const logoImage = await pdfDoc.embedJpg(coverDetails.logoBase64);
            const logoDims = logoImage.scale(0.2); // Adjust logo size
            page.drawImage(logoImage, {
                x: margin,
                y: yOffset - logoDims.height,
                width: logoDims.width,
                height: logoDims.height,
            });
            yOffset -= logoDims.height + 20; // Move down after logo
        }

        // Add title
        page.drawText(coverDetails.title, {
            x: width / 2,
            y: yOffset,
            size: 20,
            font,
            color: rgb(0.2, 0.2, 0.2),
            maxWidth: width - 2 * margin,
        });
        yOffset -= 40;

        // Add sections dynamically
        const addSection = (title: string, text: string, fontSize = 12) => {
            page.drawText(title, {
                x: margin,
                y: yOffset,
                size: 14,
                font,
                color: rgb(0.2, 0.2, 0.2),
                maxWidth: width - 2 * margin,
            });
            yOffset -= 20;

            page.drawText(text, {
                x: margin,
                y: yOffset,
                size: fontSize,
                font,
                color: rgb(0, 0, 0),
                maxWidth: width - 2 * margin,
            });
            yOffset -= (text.split("\n").length + 1) * fontSize + 20;
        };

        // Add sections to the PDF
        addSection("Executive Summary", content.executiveSummary);
        addSection("Number of Vulnerable Cryptographic Methods", `Number of cases: ${content.vulnerableMethodsCount}`);
        addSection("Where are the vulnerabilities at?", content.vulnerabilityLocations);
        addSection("Recommendations", content.replacementMethods);
        addSection("Background", content.backgroundContext);

        // Add footer
        page.drawText("Confidential for internal use only", {
            x: width / 2,
            y: margin,
            size: 10,
            font,
            color: rgb(0.5, 0.5, 0.5),
        });

        // Serialize the PDF to bytes
        const pdfBytes = await pdfDoc.save();

        // Trigger download
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        saveAs(blob, "Quantum_Safe_Report.pdf"); // Correct usage of saveAs

        console.log("PDF successfully generated ✅");
    } catch (error) {
        console.error("Error generating PDF:", error);
    }
}