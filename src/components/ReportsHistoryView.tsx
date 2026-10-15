import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Scale,
  Sparkles,
  ChevronRight,
  Split,
  FileCode,
  FileDown,
  ShieldCheck,
  Disc,
  FolderArchive,
  Award,
} from 'lucide-react';
import { useCity } from '../context/CityContext.tsx';
import { SimulationReport } from '../types/city.ts';
import { exportSummaryJSON, exportSummaryPDF } from '../utils/exportSummary.ts';

export const ReportsHistoryView: React.FC = () => {
  const { simulationReports, activeReport, setActiveReportId, scenarios } = useCity();

  const [compareMode, setCompareMode] = useState(false);
  const [reportAId, setReportAId] = useState<string>(simulationReports[0]?.id || '');
  const [reportBId, setReportBId] = useState<string>(simulationReports[1]?.id || '');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const reportA = simulationReports.find(r => r.id === reportAId) || simulationReports[0] || null;
  const reportB = simulationReports.find(r => r.id === reportBId) || simulationReports[1] || null;

  const currentScenario = scenarios.find(s => s.id === activeReport?.scenarioId) || null;

  const handleExportJSON = (report: SimulationReport) => {
    try {
      exportSummaryJSON(report, currentScenario);
      setExportNotice(`Exported structured archive JSON for "${report.scenarioTitle}"`);
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      console.error('JSON export error:', err);
    }
  };

  const handleExportPDF = (report: SimulationReport) => {
    setIsExportingPDF(true);
    try {
      exportSummaryPDF(report, currentScenario);
      setExportNotice(`Generated executive audit PDF for "${report.scenarioTitle}"`);
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      console.error('PDF export error:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleDownloadCSV = (report: SimulationReport) => {
    const headers = [
      'id',
      'domain',
      'agentRole',
      'affectedCohort',
      'description',
      'impactType',
      'severity',
      'likelihood',
      'confidence',
      'evidenceCategory',
      'suggestedMitigation',
    ];
    const rows = report.findings.map(f => [
      f.id,
      `"${f.domain.replace(/"/g, '""')}"`,
      f.agentRole,
      `"${f.affectedCohort.replace(/"/g, '""')}"`,
      `"${f.description.replace(/"/g, '""')}"`,
      f.impactType,
      f.severity,
      f.likelihood,
      f.confidence,
      f.evidenceCategory,
      `"${f.suggestedMitigation.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodedUri);
    downloadAnchor.setAttribute('download', `citymind_findings_${report.id}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  if (simulationReports.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-12 text-center space-y-3 shadow-2xl backdrop-blur-xl">
        <FolderArchive className="w-12 h-12 text-slate-500 mx-auto" />
        <h2 className="font-display text-lg font-bold text-white tracking-wide">NO ARCHIVED SIMULATION REPORTS</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Navigate to the Scenario Lab and click Run Simulation to generate multi-agent evaluation reports for archiving.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 select-none font-sans">
      {/* Simulation Archive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10 no-print">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
            <FolderArchive className="w-3.5 h-3.5 text-cyan-400" />
            <span>METRO ARCHIVE & DOSSIERS</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400 font-mono">EXECUTIVE EVALUATION AUDITS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-white mt-1">
            Simulation Archive & Export Center
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {simulationReports.length > 1 && (
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`btn-3d-secondary px-3.5 py-2 text-xs flex items-center gap-2 ${
                compareMode ? 'text-cyan-300 border-cyan-500/40 shadow-sm' : 'text-slate-300'
              }`}
            >
              <Split className="w-3.5 h-3.5 text-cyan-400" />
              <span>{compareMode ? 'EXIT COMPARISON' : 'COMPARE 2 RUNS'}</span>
            </button>
          )}

          {activeReport && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportPDF(activeReport)}
                disabled={isExportingPDF}
                className="btn-3d-primary px-4 py-2 text-xs flex items-center gap-1.5 disabled:opacity-50"
                title="Generate and download PDF summary"
              >
                <FileDown className="w-3.5 h-3.5 text-slate-950" />
                <span>{isExportingPDF ? 'PRINTING PDF...' : 'EXPORT PDF'}</span>
              </button>

              <button
                onClick={() => handleExportJSON(activeReport)}
                className="btn-3d-secondary px-3.5 py-2 text-xs text-amber-300 flex items-center gap-1.5"
                title="Download JSON Archive"
              >
                <FileCode className="w-3.5 h-3.5 text-amber-400" />
                <span>EXPORT JSON</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Export Confirmation Feedback */}
      {exportNotice && (
        <div className="rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 p-3.5 flex items-center justify-between no-print backdrop-blur-md shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2.5 text-xs font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{exportNotice}</span>
          </div>
          <button
            onClick={() => setExportNotice(null)}
            className="text-xs text-emerald-400 hover:text-white px-2 py-0.5 rounded transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Archive Center Box for the Active Report */}
      {activeReport && !compareMode && (
        <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 no-print space-y-4 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="space-y-0.5">
              <h2 className="font-display font-bold text-sm text-white flex items-center gap-2">
                <Disc className="w-4 h-4 text-cyan-400" />
                <span>MUNICIPAL DOSSIER EXPORT ENGINE</span>
              </h2>
              <p className="text-xs text-slate-400">
                Archive simulation run <span className="font-mono text-cyan-300 font-semibold">{activeReport.id}</span> externally for council review or offline audits.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownloadCSV(activeReport)}
                className="btn-3d-secondary px-3 py-1.5 text-xs text-slate-300 hover:text-white"
              >
                CSV LEDGER
              </button>
              <button
                onClick={handlePrint}
                className="btn-3d-secondary px-3 py-1.5 text-xs text-slate-300 hover:text-white flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-cyan-400" />
                <span>PRINT DOCUMENT</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PDF Card */}
            <div className="rounded-xl bg-slate-950/60 border border-white/10 p-4 flex flex-col justify-between space-y-3 shadow-inner">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-xs text-rose-300 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-rose-400" />
                    <span>EXECUTIVE AUDIT DOSSIER (PDF)</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-white/10">
                    .PDF
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  Generates an A4 executive audit document formatted with municipal letterhead metadata, synthesis narrative, key benefits and risks, conflict trade-offs, and critical findings table.
                </p>
              </div>

              <button
                onClick={() => handleExportPDF(activeReport)}
                disabled={isExportingPDF}
                className="btn-3d-primary text-xs py-2 w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FileDown className="w-3.5 h-3.5 text-slate-950" />
                <span>{isExportingPDF ? 'CREATING PDF...' : 'DOWNLOAD SUMMARY PDF'}</span>
              </button>
            </div>

            {/* JSON Card */}
            <div className="rounded-xl bg-slate-950/60 border border-white/10 p-4 flex flex-col justify-between space-y-3 shadow-inner">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-xs text-amber-300 flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-amber-400" />
                    <span>STRUCTURED RUN ARCHIVE (JSON)</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-white/10">
                    .JSON
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  Downloads a machine-readable archive containing schema metadata, proposal specification, all 10 specialist agent assessments, conflict matrices, and categorized evidence.
                </p>
              </div>

              <button
                onClick={() => handleExportJSON(activeReport)}
                className="btn-3d-secondary text-xs py-2 w-full flex items-center justify-center gap-2 text-amber-300 hover:text-white"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>DOWNLOAD ARCHIVE JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-side comparison mode */}
      {compareMode && reportA && reportB ? (
        <div className="space-y-4 no-print">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl bg-slate-900/80 border border-white/10 p-4 text-xs shadow-xl backdrop-blur-xl">
            <div>
              <label className="font-display font-bold text-xs text-amber-300 block mb-1.5">
                RUN SPECIFICATION A:
              </label>
              <select
                value={reportAId}
                onChange={e => setReportAId(e.target.value)}
                className="w-full bg-slate-950 border border-white/15 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                {simulationReports.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.id} - {r.scenarioTitle}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-display font-bold text-xs text-cyan-300 block mb-1.5">
                RUN SPECIFICATION B:
              </label>
              <select
                value={reportBId}
                onChange={e => setReportBId(e.target.value)}
                className="w-full bg-slate-950 border border-white/15 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                {simulationReports.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.id} - {r.scenarioTitle}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Column A */}
            <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-3.5 text-xs shadow-xl backdrop-blur-xl">
              <div className="border-b border-white/10 pb-2.5">
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">{reportA.id}</span>
                <h3 className="font-display font-bold text-base text-white mt-1.5">{reportA.scenarioTitle}</h3>
                <span className="text-xs text-slate-400">{reportA.targetZoneName}</span>
              </div>
              <div>
                <strong className="font-display font-bold text-xs text-slate-300 block mb-1.5">
                  EXECUTIVE SYNTHESIS:
                </strong>
                <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-white/5 font-normal">
                  {reportA.synthesis.executiveSummary}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-cyan-500/30 text-cyan-300 font-semibold">
                  FINDINGS: {reportA.findings.length}
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-rose-500/30 text-rose-300 font-semibold">
                  CONFLICTS: {reportA.conflicts.length}
                </div>
              </div>
            </div>

            {/* Column B */}
            <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-3.5 text-xs shadow-xl backdrop-blur-xl">
              <div className="border-b border-white/10 pb-2.5">
                <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">{reportB.id}</span>
                <h3 className="font-display font-bold text-base text-white mt-1.5">{reportB.scenarioTitle}</h3>
                <span className="text-xs text-slate-400">{reportB.targetZoneName}</span>
              </div>
              <div>
                <strong className="font-display font-bold text-xs text-slate-300 block mb-1.5">
                  EXECUTIVE SYNTHESIS:
                </strong>
                <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-white/5 font-normal">
                  {reportB.synthesis.executiveSummary}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-cyan-500/30 text-cyan-300 font-semibold">
                  FINDINGS: {reportB.findings.length}
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-rose-500/30 text-rose-300 font-semibold">
                  CONFLICTS: {reportB.conflicts.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Standard Report History list + Active Report view */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* History list (4 cols) */}
          <div className="lg:col-span-4 space-y-2.5 no-print">
            <span className="text-xs font-display font-bold text-cyan-400 uppercase tracking-wider block px-1">
              SAVED AUDIT DOSSIERS ({simulationReports.length})
            </span>
            <div className="space-y-2.5">
              {simulationReports.map(rep => {
                const isSelected = activeReport?.id === rep.id;
                return (
                  <div
                    key={rep.id}
                    onClick={() => setActiveReportId(rep.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-slate-900/95 to-cyan-950/40 border-cyan-500/60 shadow-[0_8px_25px_-5px_rgba(6,182,212,0.35)] -translate-y-0.5'
                        : 'bg-slate-900/60 border-white/10 hover:border-white/20 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                      <span className="text-amber-300 font-mono font-bold">{rep.id}</span>
                      <span>{new Date(rep.timestamp).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-display font-bold text-sm text-white line-clamp-1 mb-1 leading-tight">
                      {rep.scenarioTitle}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                      <span>{rep.targetZoneName}</span>
                      <span className="font-mono text-cyan-300 text-[11px]">
                        {rep.findings.length} FINDINGS
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Full Printable Report Document View (8 cols) */}
          <div className="lg:col-span-8 rounded-2xl bg-slate-900/85 border border-white/10 p-6 sm:p-7 space-y-5 text-xs text-slate-300 shadow-2xl backdrop-blur-xl print:bg-white print:text-black print:border-none print:p-0">
            {activeReport && (
              <>
                {/* Header */}
                <div className="border-b border-white/10 print:border-neutral-300 pb-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-300 print:text-neutral-800 flex items-center gap-2 font-display font-bold tracking-wide">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>CITYMIND MUNICIPAL SIMULATOR · AUDIT RECORD</span>
                    </span>
                    <span className="text-cyan-300 print:text-neutral-600 font-mono font-semibold">
                      {activeReport.id}
                    </span>
                  </div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-white print:text-black tracking-tight leading-snug">
                    {activeReport.scenarioTitle}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 print:text-neutral-600 font-medium">
                    <span className="text-white">TARGET DISTRICT: {activeReport.targetZoneName}</span>
                    <span>·</span>
                    <span>AUDIT DATE: {new Date(activeReport.timestamp).toLocaleDateString()}</span>
                    <span>·</span>
                    <span className="text-emerald-400">IMPACTED ENTITIES: {activeReport.totalAffectedEntitiesCount}</span>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 print:text-neutral-800 text-xs">
                    <strong>DATA PROVENANCE:</strong> {activeReport.dataProvenanceNote}
                  </div>
                </div>

                {/* 1. Executive Summary */}
                <div className="space-y-2">
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-amber-300 print:text-black">
                    1. EXECUTIVE SUMMARY & SYNTHESIS
                  </h3>
                  <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 print:bg-neutral-50 p-4 rounded-xl border border-white/5 print:border-neutral-300 font-normal">
                    {activeReport.synthesis.executiveSummary}
                  </p>
                </div>

                {/* 2. Benefits & Risks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-display font-bold text-xs text-emerald-400 print:text-neutral-900 tracking-wide">
                      STATED STRATEGIC BENEFITS:
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-300 print:text-neutral-800 font-normal">
                      {activeReport.synthesis.keyBenefits.map((b, i) => (
                        <li key={i} className="bg-slate-950/50 p-2.5 rounded-lg border border-white/5 flex items-start gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-display font-bold text-xs text-rose-400 print:text-neutral-900 tracking-wide">
                      CRITICAL SYSTEMIC RISKS:
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-300 print:text-neutral-800 font-normal">
                      {activeReport.synthesis.criticalRisks.map((r, i) => (
                        <li key={i} className="bg-slate-950/50 p-2.5 rounded-lg border border-white/5 flex items-start gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 3. Primary Conflicts */}
                <div className="space-y-2.5 pt-3 border-t border-white/10 print:border-neutral-300">
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-amber-300 print:text-black">
                    2. STAKEHOLDER CONFLICTS & POLICY TRADE-OFFS
                  </h3>
                  <div className="space-y-2.5">
                    {activeReport.conflicts.map(c => (
                      <div
                        key={c.id}
                        className="p-4 bg-slate-950/60 print:bg-neutral-50 rounded-xl border border-white/10 print:border-neutral-300 space-y-1.5"
                      >
                        <div className="font-display font-bold text-xs text-amber-300 print:text-black">
                          {c.id}: {c.title}
                        </div>
                        <p className="text-xs text-slate-300 print:text-neutral-700 leading-relaxed font-normal">
                          <strong className="text-rose-400">Trade-Off:</strong> {c.coreTradeOff}
                        </p>
                        <p className="text-xs text-emerald-300 print:text-neutral-800 leading-relaxed font-normal">
                          <strong className="text-emerald-400">Compromise:</strong> {c.potentialCompromise}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Recommended Mitigations */}
                <div className="space-y-2 pt-3 border-t border-white/10 print:border-neutral-300">
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-cyan-300 print:text-black">
                    3. RECOMMENDED INTERVENTION ADJUSTMENTS
                  </h3>
                  <ul className="space-y-1.5 text-xs font-normal">
                    {activeReport.synthesis.recommendedMitigations.map((m, i) => (
                      <li key={i} className="bg-slate-950/50 p-2.5 rounded-lg border border-white/5 text-slate-300 print:text-neutral-800">
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 5. Required Measurements */}
                <div className="space-y-2 pt-3 border-t border-white/10 print:border-neutral-300">
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-400 print:text-black">
                    4. EMPIRICAL DATA GAPS TO RESOLVE
                  </h3>
                  <ul className="space-y-1.5 text-xs font-normal">
                    {activeReport.synthesis.nextStepsAndDataRequired.map((s, i) => (
                      <li key={i} className="bg-slate-950/50 p-2.5 rounded-lg border border-white/5 text-slate-400 print:text-neutral-700">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
