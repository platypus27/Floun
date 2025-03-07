import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { saveAs } from "file-saver";
import { logoBase64 } from "./logoBase64"; // adjust the path as needed

interface ReportContent {
  executiveSummary: string;
  vulnerabilityLocations: string;
  replacementMethods: string;
  backgroundContext: string;
  riskAssessment: string;
  recommendations: string;
  vulnerableMethodsCount: number;
  vulnerableMethodsBreakdown: string;
}

interface CoverDetails {
  title: string;
  subtitle: string;
  logoBase64?: string;
  date: string;
  confidentialityNotice: string;
}

/**
 * Generate a PDF report with dynamic content.
 * @param coverDetails - Report title, subtitle, logo, date, and confidentiality notice
 * @param content - Report content
 */
export async function generatePDFReport(
  coverDetails: CoverDetails,
  content: ReportContent
): Promise<void> {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const rawLogoData = coverDetails.logoBase64 || logoBase64;
    let logoImage;
    if (rawLogoData) {
      if (rawLogoData.startsWith("data:image/png;base64,")) {
        const cleanData = rawLogoData.split(",")[1];
        logoImage = await pdfDoc.embedPng(cleanData);
      } else if (rawLogoData.startsWith("data:image/jpeg;base64,")) {
        const cleanData = rawLogoData.split(",")[1];
        logoImage = await pdfDoc.embedJpg(cleanData);
      }
    }

    if (logoImage) {
      const logoDims = logoImage.scale(200 / logoImage.width);
      page.drawImage(logoImage, {
        x: 50,
        y: page.getHeight() - logoDims.height - 50, // Adjusted y-position so full logo is visible
        width: logoDims.width,
        height: logoDims.height,
      });
    }

    page.drawText(coverDetails.title, {
      x: 50,
      y: page.getHeight() - 200,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    page.drawText(coverDetails.subtitle, {
      x: 50,
      y: page.getHeight() - 230,
      size: 18,
      font: font,
      color: rgb(0, 0, 0),
    });
    page.drawText(`Date: ${coverDetails.date}`, {
      x: 50,
      y: page.getHeight() - 270,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });
    page.drawText(coverDetails.confidentialityNotice, {
      x: 50,
      y: page.getHeight() - 290,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText("Table of Contents", {
      x: 50,
      y: page.getHeight() - 350,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    const toc = [
      "1. Introduction",
      "2. Executive Summary",
      "3. Methodology",
      "4. Vulnerability Analysis",
      "5. Risk Assessment",
      "6. Recommendations",
      "7. Case Studies",
      "8. Next Steps",
      "9. Conclusion",
      "10. Appendices",
    ];
    toc.forEach((item, index) => {
      page.drawText(item, {
        x: 50,
        y: page.getHeight() - 380 - index * 20,
        size: 12,
        font: font,
        color: rgb(0, 0, 0),
      });
    });

    const introductionPage = pdfDoc.addPage([600, 800]);
    introductionPage.drawText("1. Introduction", {
      x: 50,
      y: introductionPage.getHeight() - 50,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    const introductionText = `
      Purpose:
      - "This report identifies cryptographic vulnerabilities in the system and provides recommendations for transitioning to quantum-safe cryptography."

      Scope:
      - "The analysis focuses on SSL/TLS configurations, certificates, and JavaScript codebase."

      Audience:
      - "This report is intended for IT administrators, cybersecurity teams, and decision-makers."
    `;
    drawWrappedText(introductionPage, introductionText, 50, introductionPage.getHeight() - 80, 500, 12, font);

    const executiveSummaryPage = pdfDoc.addPage([600, 800]);
    executiveSummaryPage.drawText("2. Executive Summary", {
      x: 50,
      y: executiveSummaryPage.getHeight() - 50,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    drawWrappedText(executiveSummaryPage, content.executiveSummary, 50, executiveSummaryPage.getHeight() - 80, 500, 12, font);

    const methodologyPage = pdfDoc.addPage([600, 800]);
    methodologyPage.drawText("3. Methodology", {
      x: 50,
      y: methodologyPage.getHeight() - 50,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    const methodologyText = `
      Tools Used:
      - "Floun browser extension, SSL Labs API, OpenSSL."

      Process:
      - "We scanned the system for cryptographic vulnerabilities, analyzed SSL/TLS configurations, and reviewed JavaScript code for encryption practices."

      Limitations:
      - "The analysis did not include network-level vulnerabilities or hardware-based encryption."
    `;
    drawWrappedText(methodologyPage, methodologyText, 50, methodologyPage.getHeight() - 80, 500, 12, font);

    const vulnerabilityPage = pdfDoc.addPage([600, 800]);
    vulnerabilityPage.drawText("4. Vulnerability Analysis", {
      x: 50,
      y: vulnerabilityPage.getHeight() - 50,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    const vulnerabilityText = `
      SSL/TLS Vulnerabilities:
      - "AES-CBC is used in 300 instances, 3DES in 200 instances, and ecdsa-with-SHA256 in 13 instances."

      JavaScript Vulnerabilities:
      - "No encryption was found in the JavaScript codebase, which could expose sensitive data to client-side attacks."

      Certificate Vulnerabilities:
      - "The ecdsa-with-SHA256 certificate is vulnerable to quantum attacks and should be replaced with a quantum-safe alternative."
    `;
    drawWrappedText(vulnerabilityPage, vulnerabilityText, 50, vulnerabilityPage.getHeight() - 80, 500, 12, font);

    const riskAssessmentPage = pdfDoc.addPage([600, 800]);
    riskAssessmentPage.drawText("5. Risk Assessment", {
      x: 50,
      y: riskAssessmentPage.getHeight() - 50,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    drawWrappedText(riskAssessmentPage, content.riskAssessment, 50, riskAssessmentPage.getHeight() - 80, 500, 12, font);

    const recommendationsPage = pdfDoc.addPage([600, 800]);
    recommendationsPage.drawText("6. Recommendations", {
      x: 50,
      y: recommendationsPage.getHeight() - 50,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    drawWrappedText(recommendationsPage, content.recommendations, 50, recommendationsPage.getHeight() - 80, 500, 12, font);

    const caseStudiesPage = pdfDoc.addPage([600, 800]);
    caseStudiesPage.drawText("7. Case Studies", {
      x: 50,
      y: caseStudiesPage.getHeight() - 50,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    const caseStudiesText = `
      Real-World Examples:
      - "Google has implemented post-quantum cryptography in Chrome to protect against future quantum threats."

      Lessons Learned:
      - "Early adoption of quantum-safe cryptography can reduce the risk of future data breaches."
    `;
    drawWrappedText(caseStudiesPage, caseStudiesText, 50, caseStudiesPage.getHeight() - 80, 500, 12, font);

    const nextStepsPage = pdfDoc.addPage([600, 800]);
    nextStepsPage.drawText("8. Next Steps", {
      x: 50,
      y: nextStepsPage.getHeight() - 50,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    const nextStepsText = `
      Immediate Actions:
      - "Review the report findings with the cybersecurity team. Begin implementing the recommended changes."

      Long-Term Goals:
      - "Regularly update cryptographic protocols and conduct annual security audits."

      Stakeholder Involvement:
      - "IT administrators will be responsible for updating server configurations, while the cybersecurity team will oversee the transition to quantum-safe certificates."
    `;
    drawWrappedText(nextStepsPage, nextStepsText, 50, nextStepsPage.getHeight() - 80, 500, 12, font);

    const conclusionPage = pdfDoc.addPage([600, 800]);
    conclusionPage.drawText("9. Conclusion", {
      x: 50,
      y: conclusionPage.getHeight() - 50,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    const conclusionText = `
      Summary of Findings:
      - "The analysis identified 513 cryptographic vulnerabilities, primarily in the SSL/TLS configuration and certificates."

      Call to Action:
      - "Immediate action is required to mitigate these risks and ensure long-term security."

      Final Thoughts:
      - "By adopting quantum-safe cryptography now, we can future-proof our systems and protect against emerging threats."
    `;
    drawWrappedText(conclusionPage, conclusionText, 50, conclusionPage.getHeight() - 80, 500, 12, font);

    const appendicesPage = pdfDoc.addPage([600, 800]);
    appendicesPage.drawText("10. Appendices", {
      x: 50,
      y: appendicesPage.getHeight() - 50,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    const appendicesText = `
      Glossary:
      - "AES-CBC: A block cipher mode that is vulnerable to certain attacks."

      References:
      - "NIST Post-Quantum Cryptography Project, SSL Labs API documentation."

      Additional Resources:
      - "OpenSSL documentation, Kyber implementation guide."
    `;
    drawWrappedText(appendicesPage, appendicesText, 50, appendicesPage.getHeight() - 80, 500, 12, font);

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    saveAs(blob, "Quantum_Safe_Cryptography_Report.pdf");

    console.log("PDF report generated successfully ✅");
  } catch (error) {
    console.error("Error generating PDF report:", error);
  }
}

/**
 * Helper function to draw wrapped text on a PDF page.
 * @param page - The PDF page to draw on.
 * @param text - The text to draw.
 * @param x - The x-coordinate for the text.
 * @param y - The y-coordinate for the text.
 * @param maxWidth - The maximum width for the text.
 * @param fontSize - The font size.
 * @param font - The font to use.
 */
function drawWrappedText(
  page: any,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  font: any
): void {
  // Remove newline characters to prevent encoding errors
  const cleanText = text.replace(/[\r\n]+/g, " ");
  const lines = wrapText(cleanText, maxWidth, font, fontSize);
  lines.forEach((line, index) => {
    page.drawText(line, {
      x,
      y: y - index * 15, // Adjust line height
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
      maxWidth,
    });
  });
}

/**
 * Helper function to wrap text based on max width.
 * @param text - The text to wrap.
 * @param maxWidth - The maximum width for the text.
 * @param font - The font used for the text.
 * @param fontSize - The font size.
 * @returns An array of wrapped lines.
 */
function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = font.widthOfTextAtSize(currentLine + " " + word, fontSize);
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}