import {
  AnalysisModuleResult,
  buildFindingGroupLabels,
  buildFindingGroups,
} from "./analysisModules";
import { generateChatMessage, hasDeepseekApiKey } from "./reportgen/deepseekService";
import {
  FindingGroups,
  ReportSections,
  buildPromptFindingsText,
  buildReportContent,
  countFindingsBySeverity,
  countVulnerableFindings,
  fallbackSections,
  flattenFindingGroups,
  reportSectionPrompts,
} from "./reportgen/reportDocument";
import type { ReportDraftingSettings } from "./reportgen/reportDraftingSettings";

async function buildReportSections(
  groups: FindingGroups,
  settings: ReportDraftingSettings
): Promise<ReportSections> {
  const findingsText = buildPromptFindingsText(groups);
  const allFindings = flattenFindingGroups(groups);
  const vulnerableCount = countVulnerableFindings(allFindings);
  const reviewCount = countFindingsBySeverity(allFindings, "Review");

  if (!hasDeepseekApiKey(settings)) {
    return fallbackSections(findingsText, vulnerableCount, reviewCount);
  }

  const prompts = reportSectionPrompts(findingsText);
  let draftedSections: string[];

  try {
    draftedSections = await Promise.all([
      generateChatMessage(prompts.introduction, settings),
      generateChatMessage(prompts.executiveSummary, settings),
      generateChatMessage(prompts.vulnerabilityAnalysis, settings),
      generateChatMessage(prompts.riskAssessment, settings),
      generateChatMessage(prompts.recommendations, settings),
      generateChatMessage(prompts.nextStep, settings),
      generateChatMessage(prompts.conclusion, settings),
    ]);
  } catch {
    return fallbackSections(findingsText, vulnerableCount, reviewCount);
  }

  const [
    introduction,
    executiveSummary,
    vulnerabilityAnalysis,
    riskAssessment,
    recommendations,
    nextStep,
    conclusion,
  ] = draftedSections;

  return {
    introduction,
    executiveSummary,
    vulnerabilityAnalysis,
    riskAssessment,
    recommendations,
    nextStep,
    conclusion,
  };
}

export async function createReport(
  moduleResults: AnalysisModuleResult[],
  settings: ReportDraftingSettings = { apiKey: "", consented: false }
) {
  const groups = buildFindingGroups(moduleResults);
  const groupLabels = buildFindingGroupLabels(moduleResults);
  const sections = await buildReportSections(groups, settings);
  const { generatePDFReport } = await import("./reportgen/pdfService");

  await generatePDFReport({
    title: "Quantum Safe Cryptography Report",
    subtitle: "Reviewing Crypto-Readiness and Migration Signals",
    date: new Date().toLocaleDateString(),
    confidentialityNotice: "Confidential - For Internal Use Only",
  }, buildReportContent(groups, sections, groupLabels));
}
