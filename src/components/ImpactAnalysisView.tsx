import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  Scale,
  FileQuestion,
  Users,
  Building,
  Activity,
  ArrowRight,
  Filter,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Sparkles,
  Swords,
  Flame,
  Zap,
  Target,
  Shield,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { useCity } from '../context/CityContext.tsx';
import { Finding, ConflictItem, AgentAssessment, EvidenceCategory } from '../types/city.ts';

export const ImpactAnalysisView: React.FC = () => {
  const {
    activeReport,
    simulationReports,
    setActiveReportId,
    activeScenario,
    runSimulation,
    isSimulating,
  } = useCity();

  const [activeTab, setActiveTab] = useState<'synthesis' | 'agents' | 'conflicts' | 'evidence' | 'findings'>('synthesis');
  const [selectedAgentRole, setSelectedAgentRole] = useState<string>('CITIZEN_WELLBEING');
  const [expandedFindingId, setExpandedFindingId] = useState<string | null>(null);

  // Findings ledger filters
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [evidenceFilter, setEvidenceFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  if (!activeReport) {
    return (
      <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-12 text-center space-y-4 shadow-2xl backdrop-blur-xl">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(6,182,212,0.3)]">
          <Activity className="w-8 h-8 text-cyan-400" />
        </div>
        <h2 className="font-display text-lg font-bold text-white tracking-wide">NO SIMULATION REPORT COMPILED YET</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Launch a multi-agent AI simulation in the Scenario Lab to evaluate consequences across residents, businesses, emergency ingress, and infrastructure networks.
        </p>
        {activeScenario && (
          <button
            onClick={() => runSimulation(activeScenario.id)}
            disabled={isSimulating}
            className="btn-3d-primary px-6 py-2.5 text-xs inline-flex items-center gap-2 mt-2 disabled:opacity-50"
          >
            {isSimulating ? 'SIMULATING 3D AUDIT...' : 'LAUNCH MULTI-AGENT AUDIT ON ACTIVE PROPOSAL'}
          </button>
        )}
      </div>
    );
  }

  // Filter findings
  const filteredFindings = activeReport.findings.filter(f => {
    if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false;
    if (typeFilter !== 'ALL' && f.impactType !== typeFilter) return false;
    if (evidenceFilter !== 'ALL' && f.evidenceCategory !== evidenceFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        f.description.toLowerCase().includes(q) ||
        f.domain.toLowerCase().includes(q) ||
        f.affectedCohort.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selectedAgent =
    activeReport.agentAssessments.find(a => a.agentRole === selectedAgentRole) ||
    activeReport.agentAssessments[0];

  return (
    <div className="space-y-5 select-none font-sans">
      {/* 1. Simulation Audit Header */}
      <div className="rounded-2xl bg-slate-900/85 border border-white/10 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl backdrop-blur-xl">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono font-bold text-cyan-300 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
              {activeReport.id}
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">{new Date(activeReport.timestamp).toLocaleDateString()}</span>
            <span className="text-slate-500">·</span>
            <span className="text-amber-300 font-semibold">{activeReport.targetZoneName}</span>
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
            {activeReport.scenarioTitle}
          </h1>
          <p className="text-xs text-slate-300">
            Simulated {activeReport.totalAffectedEntitiesCount} interconnected entities across {activeReport.agentAssessments.length} specialist domains.
          </p>
        </div>

        {/* Report Selector dropdown */}
        {simulationReports.length > 1 && (
          <div className="shrink-0 flex items-center gap-2.5">
            <label className="text-xs font-semibold text-slate-400 uppercase font-display">Select Dossier:</label>
            <select
              value={activeReport.id}
              onChange={e => setActiveReportId(e.target.value)}
              className="bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400 font-mono"
            >
              {simulationReports.map(r => (
                <option key={r.id} value={r.id}>
                  {r.id} - {r.scenarioTitle.slice(0, 24)}...
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2. Navigation Tabs: 3D Segmented Control */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 border border-white/10 rounded-2xl overflow-x-auto shadow-inner backdrop-blur-md">
        {[
          { id: 'synthesis', label: 'EXECUTIVE SYNTHESIS', icon: Sparkles },
          { id: 'agents', label: `10 SPECIALIST AGENTS (${activeReport.agentAssessments.length})`, icon: Shield },
          { id: 'conflicts', label: `TRADE-OFF MATRIX (${activeReport.conflicts.length})`, icon: Scale },
          { id: 'evidence', label: 'EVIDENCE RIGOR', icon: Eye },
          { id: 'findings', label: `FINDINGS LEDGER (${activeReport.findings.length})`, icon: Target },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-[0_4px_15px_-2px_rgba(6,182,212,0.5)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Executive Synthesis */}
      {activeTab === 'synthesis' && (
        <div className="space-y-4">
          {/* Executive Summary */}
          <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-2.5 shadow-xl backdrop-blur-xl">
            <h3 className="text-xs font-display font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>EXECUTIVE SYNTHESIS & RECOMMENDATIONS (AGENT 10)</span>
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-white/5">
              {activeReport.synthesis.executiveSummary}
            </p>
          </div>

          {/* Benefits vs Critical Risks Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-slate-900/80 border border-emerald-500/30 p-5 space-y-3 shadow-lg">
              <h3 className="text-xs font-display font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-wide">
                <CheckCircle className="w-4 h-4" />
                <span>PRIMARY STATED BENEFITS & VALUE ADDED</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-200">
                {activeReport.synthesis.keyBenefits.map((b, i) => (
                  <li key={i} className="bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/20 flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-rose-500/30 p-5 space-y-3 shadow-lg">
              <h3 className="text-xs font-display font-bold text-rose-400 flex items-center gap-2 uppercase tracking-wide">
                <ShieldAlert className="w-4 h-4" />
                <span>CRITICAL RISKS & ADVERSE IMPACTS</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-200">
                {activeReport.synthesis.criticalRisks.map((r, i) => (
                  <li key={i} className="bg-rose-950/20 p-3 rounded-xl border border-rose-500/20 flex items-start gap-2">
                    <span className="text-rose-400 font-bold">✖</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Mitigations & Next Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-2.5 shadow-lg">
              <h3 className="text-xs font-display font-bold text-cyan-300 flex items-center gap-2 uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>RECOMMENDED MODIFICATIONS & MITIGATIONS</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {activeReport.synthesis.recommendedMitigations.map((m, i) => (
                  <li key={i} className="bg-slate-950/50 p-3 rounded-xl border border-white/5">
                    {m}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-2.5 shadow-lg">
              <h3 className="text-xs font-display font-bold text-amber-300 flex items-center gap-2 uppercase tracking-wide">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>MEASUREMENTS REQUIRED BEFORE PROJECT SANCTION</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {activeReport.synthesis.nextStepsAndDataRequired.map((s, i) => (
                  <li key={i} className="bg-slate-950/50 p-3 rounded-xl border border-white/5">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Independent Review Audit Box (Agent 9) */}
          <div className="rounded-2xl bg-slate-900/80 border border-purple-500/30 p-5 space-y-3.5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between border-b border-purple-500/20 pb-2.5">
              <h3 className="font-display text-sm font-bold text-purple-300 flex items-center gap-2">
                <Scale className="w-4 h-4" />
                <span>INDEPENDENT REVIEW AGENT AUDIT (AGENT 9)</span>
              </h3>
              <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                UNBIASED SCRUTINY
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="bg-purple-950/15 p-3 rounded-xl border border-purple-500/20 space-y-1.5">
                <span className="font-bold text-amber-300 text-[11px] block">UNSUPPORTED CLAIMS:</span>
                <ul className="space-y-1 text-slate-300">
                  {activeReport.independentReview.unsupportedClaims.length > 0 ? (
                    activeReport.independentReview.unsupportedClaims.map((c, i) => <li key={i}>• {c}</li>)
                  ) : (
                    <li className="text-emerald-400 font-medium">None detected</li>
                  )}
                </ul>
              </div>

              <div className="bg-purple-950/15 p-3 rounded-xl border border-purple-500/20 space-y-1.5">
                <span className="font-bold text-amber-300 text-[11px] block">MAJOR OMISSIONS:</span>
                <ul className="space-y-1 text-slate-300">
                  {activeReport.independentReview.omissionsIdentified.length > 0 ? (
                    activeReport.independentReview.omissionsIdentified.map((o, i) => <li key={i}>• {o}</li>)
                  ) : (
                    <li className="text-emerald-400 font-medium">All scopes verified</li>
                  )}
                </ul>
              </div>

              <div className="bg-purple-950/15 p-3 rounded-xl border border-purple-500/20 space-y-1.5">
                <span className="font-bold text-amber-300 text-[11px] block">AGENT DISAGREEMENTS:</span>
                <ul className="space-y-1 text-slate-300">
                  {activeReport.independentReview.agentDisagreements.length > 0 ? (
                    activeReport.independentReview.agentDisagreements.map((d, i) => <li key={i}>• {d}</li>)
                  ) : (
                    <li className="text-emerald-400 font-medium">Consensus on risks</li>
                  )}
                </ul>
              </div>

              <div className="bg-purple-950/15 p-3 rounded-xl border border-purple-500/20 space-y-1.5">
                <span className="font-bold text-amber-300 text-[11px] block">DATA LIMITATIONS:</span>
                <ul className="space-y-1 text-slate-300">
                  {activeReport.independentReview.dataLimitations.length > 0 ? (
                    activeReport.independentReview.dataLimitations.map((l, i) => <li key={i}>• {l}</li>)
                  ) : (
                    <li>Baseline synthetic data</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Specialist Agent Assessments */}
      {activeTab === 'agents' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Agent Selector List (4 cols) */}
          <div className="lg:col-span-4 space-y-2.5">
            <span className="text-xs font-display font-bold text-slate-400 uppercase tracking-wider block px-1">
              AUTONOMOUS SPECIALIST AGENTS ({activeReport.agentAssessments.length})
            </span>
            <div className="space-y-2">
              {activeReport.agentAssessments.map(agent => {
                const isSelected = agent.agentRole === selectedAgentRole;
                return (
                  <button
                    key={agent.agentRole}
                    onClick={() => setSelectedAgentRole(agent.agentRole)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? 'bg-gradient-to-r from-slate-900/90 to-cyan-950/40 border-cyan-500/60 shadow-[0_6px_20px_-3px_rgba(6,182,212,0.35)] -translate-y-0.5'
                        : 'bg-slate-900/60 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-white font-bold font-display">{agent.agentName}</span>
                      <span className={`font-mono text-[10px] font-semibold ${agent.confidenceLevel === 'HIGH' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {agent.confidenceLevel} CONF
                      </span>
                    </div>
                    <div className="text-xs text-cyan-300 truncate">
                      {agent.domain}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Agent Details (8 cols) */}
          <div className="lg:col-span-8 rounded-2xl bg-slate-900/80 border border-white/10 p-5 sm:p-6 space-y-4 shadow-xl backdrop-blur-xl">
            {selectedAgent && (
              <>
                <div className="border-b border-white/10 pb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display text-base font-bold text-white">
                      {selectedAgent.agentName}
                    </h3>
                    <p className="text-xs text-cyan-300 mt-0.5">
                      {selectedAgent.domain}
                    </p>
                  </div>
                  <div className="text-xs px-2.5 py-1 rounded-full bg-slate-950 border border-white/10 text-amber-300 font-mono">
                    CONFIDENCE: {selectedAgent.confidenceLevel}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-xs uppercase font-display font-bold tracking-wider text-slate-400">
                    SPECIALIST ANALYSIS VERDICT
                  </h4>
                  <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-white/5">
                    {selectedAgent.summary}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                      POSITIVE OUTCOMES:
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-200">
                      {selectedAgent.positiveOutcomes.map((p, i) => (
                        <li key={i} className="bg-slate-950/50 p-2.5 rounded-lg border border-emerald-950/50">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wide">
                      ADVERSE IMPACTS:
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-200">
                      {selectedAgent.adverseOutcomes.map((a, i) => (
                        <li key={i} className="bg-slate-950/50 p-2.5 rounded-lg border border-rose-950/50">
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3 border-t border-white/10">
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                      DISPROPORTIONATELY IMPACTED:
                    </h4>
                    <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                      {selectedAgent.disproportionatelyAffectedGroups.map((g, i) => (
                        <li key={i}>{g}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wide">
                      SAFETY ALERTS:
                    </h4>
                    <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                      {selectedAgent.safetyConcerns.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-white/10">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    UNRESOLVED STATS & MISSING EVIDENCE:
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-400 list-disc list-inside">
                    {selectedAgent.unresolvedQuestions.map((u, i) => (
                      <li key={i}>{u}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Trade-Off Matrix */}
      {activeTab === 'conflicts' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-4 space-y-1">
            <h3 className="font-display text-sm font-bold text-amber-300 flex items-center gap-2">
              <Scale className="w-4 h-4 text-rose-400" />
              <span>STAKEHOLDER TRADE-OFF MATRIX & COMPROMISE SYNTHESIS</span>
            </h3>
            <p className="text-xs text-slate-300">
              Urban redevelopment proposals cause competing friction between commercial profits, pedestrian safety, emergency response access, housing stability, and environmental buffers.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {activeReport.conflicts.map(conflict => (
              <div
                key={conflict.id}
                className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-3.5 shadow-xl backdrop-blur-xl"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      {conflict.id}
                    </span>
                    <h4 className="font-display text-base font-bold text-white">{conflict.title}</h4>
                  </div>
                </div>

                {/* Competing Stakeholders Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {conflict.competingParties.map((party, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/60 p-3.5 rounded-xl border border-white/10 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-400">{party.stakeholder}</span>
                        <span className="text-[10px] text-slate-500 uppercase font-mono">PARTY {idx + 1}</span>
                      </div>
                      <div className="text-slate-300">
                        <strong className="text-cyan-300">Priority:</strong> {party.priority}
                      </div>
                      <div className="text-slate-300">
                        <strong className="text-amber-300">Stance:</strong> {party.stance}
                      </div>
                      <div className="text-slate-400 text-[11px] pt-1.5 border-t border-white/5">
                        <strong>Basis:</strong> {party.evidence}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Core Trade-Off & Compromise */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2 border-t border-white/10 text-xs">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-amber-400 block font-display">
                      CORE TRADE-OFF:
                    </span>
                    <p className="text-xs text-slate-200 bg-slate-950/60 p-3 rounded-xl border border-white/5 leading-relaxed">
                      {conflict.coreTradeOff}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-bold text-cyan-400 block font-display">
                      PROPOSED COMPROMISE:
                    </span>
                    <div className="text-xs text-slate-200 bg-slate-950/60 p-3 rounded-xl border border-white/5 space-y-1 leading-relaxed">
                      <p><strong>Compromise:</strong> {conflict.potentialCompromise}</p>
                      <p className="text-slate-400 text-[11px]"><strong>Trade-offs:</strong> {conflict.compromiseTradeOffs}</p>
                    </div>
                  </div>
                </div>

                {conflict.regulatoryOrSafetyConstraints && (
                  <div className="text-xs text-rose-300 bg-rose-950/30 border border-rose-500/30 p-2.5 rounded-xl">
                    <strong>LEGAL / SAFETY MANDATE:</strong> {conflict.regulatoryOrSafetyConstraints}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Evidence & Uncertainty */}
      {activeTab === 'evidence' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-emerald-950/20 border border-emerald-500/30 p-4 space-y-1">
              <span className="text-xs font-display font-bold text-emerald-400 block">
                VERIFIED DATA
              </span>
              <p className="text-xs text-slate-300">
                Direct empirical records present in supplied registries (population, capacities, road classes).
              </p>
            </div>

            <div className="rounded-2xl bg-cyan-950/20 border border-cyan-500/30 p-4 space-y-1">
              <span className="text-xs font-display font-bold text-cyan-300 block">
                MODEL INTERPRETATION
              </span>
              <p className="text-xs text-slate-300">
                Multi-agent deductive logic exploring interdependencies and cascading consequences.
              </p>
            </div>

            <div className="rounded-2xl bg-amber-950/20 border border-amber-500/30 p-4 space-y-1">
              <span className="text-xs font-display font-bold text-amber-300 block">
                WORKING ASSUMPTIONS
              </span>
              <p className="text-xs text-slate-300">
                Plausible baseline parameters applied where external sensor data is not yet measured.
              </p>
            </div>

            <div className="rounded-2xl bg-purple-950/20 border border-purple-500/30 p-4 space-y-1">
              <span className="text-xs font-display font-bold text-purple-300 block">
                DATA GAPS / UNRESOLVED
              </span>
              <p className="text-xs text-slate-300">
                Critical missing empirical evidence that MUST be surveyed prior to project sanction.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-4 shadow-xl">
            <h3 className="font-display text-sm font-bold text-white">
              FINDINGS GROUPED BY EPISTEMIC DISCIPLINE
            </h3>

            {(['VERIFIED_DATA', 'MODEL_INTERPRETATION', 'ASSUMPTION', 'UNRESOLVED_QUESTION'] as EvidenceCategory[]).map(cat => {
              const items = activeReport.findings.filter(f => f.evidenceCategory === cat);
              return (
                <div key={cat} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-display font-bold text-cyan-300 border-b border-white/10 pb-1.5">
                    <span>{cat.replace(/_/g, ' ')} ({items.length})</span>
                  </div>

                  <div className="space-y-2">
                    {items.map(f => (
                      <div
                        key={f.id}
                        className="bg-slate-950/60 p-3.5 rounded-xl border border-white/5 text-xs flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-cyan-300 font-mono font-bold">{f.id}</span>
                            <span className="text-slate-500">·</span>
                            <span className="text-slate-400">{f.domain}</span>
                            <span className="text-slate-500">·</span>
                            <span className="text-slate-300 font-medium">{f.affectedCohort}</span>
                          </div>
                          <p className="text-slate-200">{f.description}</p>
                          <div className="text-[11px] text-slate-400">
                            <strong>Basis:</strong> {f.evidenceUsed}
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                            f.severity === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : f.severity === 'HIGH'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {f.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 5: Detailed Findings Ledger */}
      {activeTab === 'findings' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
            <div className="flex flex-wrap items-center gap-2.5">
              <input
                type="text"
                placeholder="Search findings, cohorts..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 w-56"
              />

              <select
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
                className="bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-cyan-300"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MODERATE">Moderate</option>
                <option value="LOW">Low</option>
              </select>

              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-cyan-300"
              >
                <option value="ALL">All Impact Types</option>
                <option value="BENEFIT">Benefit</option>
                <option value="DISADVANTAGE">Disadvantage</option>
                <option value="NEUTRAL_RISK">Neutral Risk</option>
              </select>

              <select
                value={evidenceFilter}
                onChange={e => setEvidenceFilter(e.target.value)}
                className="bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-cyan-300"
              >
                <option value="ALL">All Evidence Disciplines</option>
                <option value="VERIFIED_DATA">Verified Data</option>
                <option value="MODEL_INTERPRETATION">Model Interp</option>
                <option value="ASSUMPTION">Assumption</option>
                <option value="UNRESOLVED_QUESTION">Unresolved</option>
              </select>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Showing {filteredFindings.length} / {activeReport.findings.length} findings
            </div>
          </div>

          {/* Findings Cards List */}
          <div className="space-y-2.5">
            {filteredFindings.map(finding => {
              const isExpanded = expandedFindingId === finding.id;

              return (
                <div
                  key={finding.id}
                  className="rounded-2xl bg-slate-900/80 border border-white/10 p-4 space-y-2.5 shadow-lg backdrop-blur-md"
                >
                  <div
                    className="flex items-start justify-between gap-3 cursor-pointer"
                    onClick={() => setExpandedFindingId(isExpanded ? null : finding.id)}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-bold text-amber-300">{finding.id}</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-slate-400">{finding.domain}</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-cyan-300 font-medium">{finding.affectedCohort}</span>
                      </div>
                      <h4 className="font-display text-sm font-bold text-white leading-snug">
                        {finding.description}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          finding.impactType === 'BENEFIT'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}
                      >
                        {finding.impactType}
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          finding.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                            : finding.severity === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {finding.severity}
                      </span>

                      <button className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-950/60 p-4 rounded-xl border border-white/5">
                      <div className="space-y-2">
                        <div>
                          <strong className="text-slate-400 block text-[11px] uppercase font-display">Evidence Basis:</strong>
                          <span className="text-slate-200">{finding.evidenceUsed}</span>
                        </div>
                        <div>
                          <strong className="text-slate-400 block text-[11px] uppercase font-display">Working Assumptions:</strong>
                          <span className="text-slate-200">{finding.assumptionsMade || 'None'}</span>
                        </div>
                        <div>
                          <strong className="text-slate-400 block text-[11px] uppercase font-display">Epistemic Category:</strong>
                          <span className="text-cyan-300 font-mono">{finding.evidenceCategory}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <strong className="text-emerald-400 block text-[11px] uppercase font-display">Suggested Mitigation:</strong>
                          <span className="text-emerald-200">{finding.suggestedMitigation}</span>
                        </div>
                        <div>
                          <strong className="text-amber-400 block text-[11px] uppercase font-display">Empirical Validation Required:</strong>
                          <span className="text-amber-200">{finding.validationRequired}</span>
                        </div>
                        <div>
                          <strong className="text-slate-400 block text-[11px] uppercase font-display">Confidence & Likelihood:</strong>
                          <span className="text-amber-300 font-mono">
                            {finding.confidence} Confidence · {finding.likelihood} Probability
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
