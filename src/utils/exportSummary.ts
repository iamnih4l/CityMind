import { jsPDF } from 'jspdf';
import { SimulationReport, RedevelopmentScenario } from '../types/city.ts';

export interface ExportArchiveMetadata {
  platform: string;
  version: string;
  exportTimestamp: string;
  reportId: string;
  scenarioId: string;
  scenarioTitle: string;
  targetZone: string;
  engine: string;
  provenance: string;
  provenanceDisclaimer: string;
}

/**
 * Generates and downloads a clean, structured JSON archive summary of the simulation.
 */
export function exportSummaryJSON(
  report: SimulationReport,
  scenario?: RedevelopmentScenario | null
): void {
  const exportPayload = {
    $schema: 'https://citymind.urban-futures.ai/schemas/simulation-summary-v1.json',
    archiveMetadata: {
      platform: 'CityMind — AI-Powered Urban Futures Simulator',
      version: '1.0.0',
      exportTimestamp: new Date().toISOString(),
      reportId: report.id,
      scenarioId: report.scenarioId,
      scenarioTitle: report.scenarioTitle,
      targetZoneId: report.targetZoneId,
      targetZoneName: report.targetZoneName,
      sampledStakeholdersCount: report.totalAffectedEntitiesCount,
      systemEngine: 'Multi-Agent Urban Simulation (Google Gemini)',
      provenanceStatus: 'SYNTHETIC DEMO DATA',
      provenanceDisclaimer:
        'This dataset and simulation report are generated for exploratory decision support and simulation purposes. They do not represent real-world municipal facts or validated census records.',
    },
    scenarioSpecification: scenario
      ? {
          id: scenario.id,
          title: scenario.title,
          category: scenario.category,
          zoneId: scenario.zoneId,
          description: scenario.description,
          objectives: scenario.objectives,
          knownConstraints: scenario.knownConstraints,
          existingConditions: scenario.existingConditions || 'Not specified',
          proposedConditions: scenario.proposedConditions || 'Not specified',
          affectedAreaSqKm: scenario.affectedAreaSqKm,
          createdAt: scenario.createdAt,
        }
      : {
          id: report.scenarioId,
          title: report.scenarioTitle,
          zoneId: report.targetZoneId,
        },
    executiveSynthesis: {
      executiveSummary: report.synthesis.executiveSummary,
      keyBenefits: report.synthesis.keyBenefits,
      criticalRisks: report.synthesis.criticalRisks,
      recommendedMitigations: report.synthesis.recommendedMitigations,
      empiricalDataRequiredBeforeImplementation: report.synthesis.nextStepsAndDataRequired,
    },
    stakeholderConflicts: report.conflicts.map(c => ({
      id: c.id,
      title: c.title,
      coreTradeOff: c.coreTradeOff,
      potentialCompromise: c.potentialCompromise,
      tradeOffsOfCompromise: c.compromiseTradeOffs,
      regulatoryOrSafetyConstraints: c.regulatoryOrSafetyConstraints,
      competingParties: c.competingParties,
    })),
    independentReviewAudit: {
      unsupportedClaimsFlagged: report.independentReview.unsupportedClaims,
      majorOmissionsIdentified: report.independentReview.omissionsIdentified,
      agentDisagreements: report.independentReview.agentDisagreements,
      dataLimitations: report.independentReview.dataLimitations,
    },
    findingsLedger: {
      totalCount: report.findings.length,
      severityBreakdown: {
        critical: report.findings.filter(f => f.severity === 'CRITICAL').length,
        high: report.findings.filter(f => f.severity === 'HIGH').length,
        moderate: report.findings.filter(f => f.severity === 'MODERATE').length,
        low: report.findings.filter(f => f.severity === 'LOW').length,
      },
      epistemicCategoryBreakdown: {
        verifiedData: report.findings.filter(f => f.evidenceCategory === 'VERIFIED_DATA').length,
        modelInterpretation: report.findings.filter(f => f.evidenceCategory === 'MODEL_INTERPRETATION').length,
        assumption: report.findings.filter(f => f.evidenceCategory === 'ASSUMPTION').length,
        unresolvedQuestion: report.findings.filter(f => f.evidenceCategory === 'UNRESOLVED_QUESTION').length,
      },
      findings: report.findings,
    },
    specialistAgentAssessments: report.agentAssessments.map(a => ({
      role: a.agentRole,
      name: a.agentName,
      domain: a.domain,
      confidenceLevel: a.confidenceLevel,
      summary: a.summary,
      positiveOutcomes: a.positiveOutcomes,
      adverseOutcomes: a.adverseOutcomes,
      disproportionatelyAffectedGroups: a.disproportionatelyAffectedGroups,
      safetyConcerns: a.safetyConcerns,
      unresolvedQuestions: a.unresolvedQuestions,
      criteriaUsed: a.evaluationCriteriaUsed,
    })),
  };

  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const filename = `citymind-summary-${report.scenarioId || report.id}-${new Date().toISOString().slice(0, 10)}.json`;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a clean, multi-page PDF summary document.
 */
export function exportSummaryPDF(
  report: SimulationReport,
  scenario?: RedevelopmentScenario | null
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  // Helper to add new page if needed
  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - margin - 12) {
      doc.addPage();
      cursorY = margin;
      drawPageHeader();
    }
  };

  const drawPageHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('CITYMIND URBAN FUTURES SIMULATOR — EXECUTIVE AUDIT REPORT', margin, cursorY);
    doc.setFont('helvetica', 'normal');
    doc.text(`REPORT ID: ${report.id}`, pageWidth - margin, cursorY, { align: 'right' });
    cursorY += 4;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, cursorY, pageWidth - margin, cursorY);
    cursorY += 6;
  };

  // --- Cover / Document Header ---
  drawPageHeader();

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  const titleLines = doc.splitTextToSize(report.scenarioTitle, contentWidth);
  doc.text(titleLines, margin, cursorY);
  cursorY += titleLines.length * 7 + 2;

  // Metadata block
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600

  const dateFormatted = new Date(report.timestamp).toLocaleString();
  const metaText = `Target Zone: ${report.targetZoneName} (${report.targetZoneId})  |  Generated: ${dateFormatted}  |  Sampled Stakeholders: ${report.totalAffectedEntitiesCount}`;
  doc.text(metaText, margin, cursorY);
  cursorY += 6;

  // Provenance disclaimer box
  doc.setFillColor(254, 243, 199); // amber-100
  doc.setDrawColor(245, 158, 11); // amber-500
  doc.roundedRect(margin, cursorY, contentWidth, 12, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(146, 64, 14); // amber-800
  doc.text('SYNTHETIC DEMO DATASET', margin + 3, cursorY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 83, 9);
  doc.text(
    'Exploratory simulation model based on deterministic synthetic entities. Not for official regulatory filing.',
    margin + 3,
    cursorY + 8.5
  );
  cursorY += 16;

  // --- Section 1: Executive Synthesis ---
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Executive Synthesis & Strategic Findings', margin, cursorY);
  cursorY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const summaryLines = doc.splitTextToSize(report.synthesis.executiveSummary, contentWidth);
  doc.text(summaryLines, margin, cursorY);
  cursorY += summaryLines.length * 4.5 + 6;

  // --- Section 2: Key Benefits & Critical Risks ---
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(22, 101, 52); // emerald-800
  doc.text('Anticipated Benefits:', margin, cursorY);
  cursorY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  report.synthesis.keyBenefits.forEach(b => {
    checkPageBreak(10);
    const bulletLines = doc.splitTextToSize(`• ${b}`, contentWidth - 4);
    doc.text(bulletLines, margin + 2, cursorY);
    cursorY += bulletLines.length * 4 + 1;
  });
  cursorY += 3;

  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(153, 27, 27); // red-800
  doc.text('Critical Identified Risks:', margin, cursorY);
  cursorY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  report.synthesis.criticalRisks.forEach(r => {
    checkPageBreak(10);
    const bulletLines = doc.splitTextToSize(`• ${r}`, contentWidth - 4);
    doc.text(bulletLines, margin + 2, cursorY);
    cursorY += bulletLines.length * 4 + 1;
  });
  cursorY += 6;

  // --- Section 3: Recommended Mitigations ---
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Recommended Project Modifications & Mitigations', margin, cursorY);
  cursorY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  report.synthesis.recommendedMitigations.forEach((m, idx) => {
    checkPageBreak(10);
    const mLines = doc.splitTextToSize(`${idx + 1}. ${m}`, contentWidth);
    doc.text(mLines, margin, cursorY);
    cursorY += mLines.length * 4 + 2;
  });
  cursorY += 5;

  // --- Section 4: Primary Stakeholder Conflicts ---
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Multi-Stakeholder Conflicts & Trade-offs', margin, cursorY);
  cursorY += 5;

  report.conflicts.forEach(c => {
    checkPageBreak(35);
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.roundedRect(margin, cursorY, contentWidth, 24, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`${c.id}: ${c.title}`, margin + 3, cursorY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const tradeOffLines = doc.splitTextToSize(`Trade-off: ${c.coreTradeOff}`, contentWidth - 6);
    doc.text(tradeOffLines.slice(0, 2), margin + 3, cursorY + 9);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // emerald
    const compLines = doc.splitTextToSize(`Compromise: ${c.potentialCompromise}`, contentWidth - 6);
    doc.text(compLines.slice(0, 2), margin + 3, cursorY + 16);

    cursorY += 28;
  });
  cursorY += 3;

  // --- Section 5: Independent Review Audit ---
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('4. Independent Review Audit (Agent 9)', margin, cursorY);
  cursorY += 5;

  if (report.independentReview.unsupportedClaims.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(180, 83, 9);
    doc.text('Flagged Unsupported Claims:', margin, cursorY);
    cursorY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    report.independentReview.unsupportedClaims.forEach(claim => {
      checkPageBreak(8);
      const lines = doc.splitTextToSize(`- ${claim}`, contentWidth - 4);
      doc.text(lines, margin + 2, cursorY);
      cursorY += lines.length * 3.8 + 1;
    });
  }

  if (report.independentReview.dataLimitations.length > 0) {
    cursorY += 2;
    checkPageBreak(15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Data Gaps & Limitations:', margin, cursorY);
    cursorY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    report.independentReview.dataLimitations.forEach(lim => {
      checkPageBreak(8);
      const lines = doc.splitTextToSize(`- ${lim}`, contentWidth - 4);
      doc.text(lines, margin + 2, cursorY);
      cursorY += lines.length * 3.8 + 1;
    });
  }
  cursorY += 6;

  // --- Section 6: Findings Ledger Sample ---
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`5. Key Impact Findings Summary (${report.findings.length} Total Findings)`, margin, cursorY);
  cursorY += 5;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, cursorY, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('ID', margin + 2, cursorY + 4);
  doc.text('Domain / Cohort', margin + 18, cursorY + 4);
  doc.text('Severity', margin + 70, cursorY + 4);
  doc.text('Epistemic Basis', margin + 92, cursorY + 4);
  doc.text('Description / Mitigation', margin + 125, cursorY + 4);
  cursorY += 8;

  // Top 10 critical/high findings
  const topFindings = report.findings.slice(0, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  topFindings.forEach(f => {
    checkPageBreak(12);
    doc.setTextColor(15, 23, 42);
    doc.text(f.id, margin + 2, cursorY);
    doc.text(f.affectedCohort.slice(0, 26), margin + 18, cursorY);

    if (f.severity === 'CRITICAL') {
      doc.setTextColor(220, 38, 38);
    } else if (f.severity === 'HIGH') {
      doc.setTextColor(217, 119, 6);
    } else {
      doc.setTextColor(71, 85, 105);
    }
    doc.text(f.severity, margin + 70, cursorY);

    doc.setTextColor(100, 116, 139);
    doc.text(f.evidenceCategory.slice(0, 14), margin + 92, cursorY);

    doc.setTextColor(51, 65, 85);
    const desc = `${f.description.slice(0, 48)}...`;
    doc.text(desc, margin + 125, cursorY);

    cursorY += 6;
  });

  // Footer for each page
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `CityMind Simulation Summary · Archive Export · Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  // Save the document directly
  const filename = `citymind-summary-${report.scenarioId || report.id}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
