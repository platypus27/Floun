import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { saveAs } from "file-saver";
import { logoBase64 } from "./logoBase64"; // adjust the path as needed

interface ReportContent {
  introduction: string; 
  executiveSummary: string;
  vulnerabilityAnalysis: string;
  riskAssessment: string;
  recommendations: string;
  nextStep: string;
  conclusion: string;
  appendix: string;
  vulnerableMethodsCount: number;
  vulnerableMethodsBreakdown: string;
}

interface CoverDetails {
  title: string;
  subtitle: string;
  logoBase64?: string;
  date: string;
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
      "3. Vulnerability Analysis",
      "4. Risk Assessment",
      "5. Recommendations",
      "6. Next Steps",
      "7. Conclusion",
      "8. Appendices",
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
    const introductionText = content.introduction;
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

    const vulnerabilityPage = pdfDoc.addPage([600, 800]);
    vulnerabilityPage.drawText("3. Vulnerability Analysis", {
      x: 50,
      y: vulnerabilityPage.getHeight() - 50,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    const vulnerabilityText = content.vulnerabilityAnalysis;
    drawWrappedText(vulnerabilityPage, vulnerabilityText, 50, vulnerabilityPage.getHeight() - 80, 500, 12, font);

    const riskAssessmentPage = pdfDoc.addPage([600, 800]);
    riskAssessmentPage.drawText("4. Risk Assessment", {
      x: 50,
      y: riskAssessmentPage.getHeight() - 50,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    drawWrappedText(riskAssessmentPage, content.riskAssessment, 50, riskAssessmentPage.getHeight() - 80, 500, 12, font);

    const recommendationsPage = pdfDoc.addPage([600, 800]);
    recommendationsPage.drawText("5. Recommendations", {
      x: 50,
      y: recommendationsPage.getHeight() - 50,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    drawWrappedText(recommendationsPage, content.recommendations, 50, recommendationsPage.getHeight() - 80, 500, 12, font);

    const nextStepsPage = pdfDoc.addPage([600, 800]);
    nextStepsPage.drawText("6. Next Steps", {
      x: 50,
      y: nextStepsPage.getHeight() - 50,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    const nextStepsText = content.nextStep;
    drawWrappedText(nextStepsPage, nextStepsText, 50, nextStepsPage.getHeight() - 80, 500, 12, font);

    const conclusionPage = pdfDoc.addPage([600, 800]);
    conclusionPage.drawText("7. Conclusion", {
      x: 50,
      y: conclusionPage.getHeight() - 50,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    const conclusionText = content.conclusion;
    drawWrappedText(conclusionPage, conclusionText, 50, conclusionPage.getHeight() - 80, 500, 12, font);

    const appendicesPage = pdfDoc.addPage([600, 800]);
    appendicesPage.drawText("8. Appendices", {
      x: 50,
      y: appendicesPage.getHeight() - 50,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    const appendicesText = content.appendix;
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
  const lines = wrapText(text, maxWidth, font, fontSize);
  lines.forEach((line, index) => {
    if (y - index * fontSize < 50) {
      page = page.doc.addPage([600, 800]);
      y = page.getHeight() - 50;
    }
    page.drawText(line, {
      x,
      y: y - index * fontSize, // Adjust line height
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
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
  const words = text.replace(/\n/g, " ").split(" ");
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