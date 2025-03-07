// pdfService.tsx
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { saveAs } from "file-saver";

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

        // Add title (centered)
        const titleSize = 20;
        const titleWidth = font.widthOfTextAtSize(coverDetails.title, titleSize);
        const titleX = (width - titleWidth) / 2; // Center the title
        page.drawText(coverDetails.title, {
            x: titleX,
            y: yOffset,
            size: titleSize,
            font,
            color: rgb(0.2, 0.2, 0.2),
        });
        yOffset -= 40;

        // Add sections dynamically
        const addSection = (title: string, text: string, fontSize = 12) => {
            const titleSize = 14; // Font size for section titles
            const lineHeight = fontSize * 1.5; // Line height for spacing

            // Draw the section title
            const titleWidth = font.widthOfTextAtSize(title, titleSize);
            const titleX = (width - titleWidth) / 2; // Center the title
            page.drawText(title, {
                x: titleX,
                y: yOffset,
                size: titleSize,
                font,
                color: rgb(0.2, 0.2, 0.2),
            });
            yOffset -= titleSize + 10; // Move down after the title

            // Split text into lines based on maxWidth
            const words = text.split(" ");
            let line = "";
            const lines = [];

            for (const word of words) {
                const testLine = line ? `${line} ${word}` : word;
                const textWidth = font.widthOfTextAtSize(testLine, fontSize);

                if (textWidth > width - 2 * margin) {
                    lines.push(line);
                    line = word;
                } else {
                    line = testLine;
                }
            }
            lines.push(line); // Add the last line

            // Draw each line of text
            for (const line of lines) {
                page.drawText(line, {
                    x: margin,
                    y: yOffset,
                    size: fontSize,
                    font,
                    color: rgb(0, 0, 0),
                });
                yOffset -= lineHeight; // Move down for the next line
            }

            yOffset -= 20; // Add extra spacing between sections
        };

        // Add sections to the PDF
        addSection("Executive Summary", content.executiveSummary);
        addSection("Number of Vulnerable Cryptographic Methods", `Number of cases: ${content.vulnerableMethodsCount}`);
        addSection("Where are the vulnerabilities at?", content.vulnerabilityLocations);
        addSection("Recommendations", content.replacementMethods);
        addSection("Background", content.backgroundContext);

        // Add footer (centered)
        const footerText = "Confidential for internal use only";
        const footerSize = 10;
        const footerWidth = font.widthOfTextAtSize(footerText, footerSize);
        const footerX = (width - footerWidth) / 2; // Center the footer
        page.drawText(footerText, {
            x: footerX,
            y: margin,
            size: footerSize,
            font,
            color: rgb(0.5, 0.5, 0.5),
        });

        // Serialize the PDF to bytes
        const pdfBytes = await pdfDoc.save();

        // Trigger download
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        saveAs(blob, "Quantum_Safe_Report.pdf");

        // console.log("PDF successfully generated ✅");
    } catch (error) {
        console.error("Error generating PDF:", error);
    }
}