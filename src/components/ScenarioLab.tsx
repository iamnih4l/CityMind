import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  MapPin,
  Clock,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  X,
  Target,
  Compass,
} from 'lucide-react';
import { useCity } from '../context/CityContext.tsx';
import { RedevelopmentScenario, ZoneEntity } from '../types/city.ts';

interface ScenarioLabProps {
  onOpenImpactAnalysis: () => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
}

export const ScenarioLab: React.FC<ScenarioLabProps> = ({
  onOpenImpactAnalysis,
  isCreateModalOpen,
  setIsCreateModalOpen,
}) => {
  const {
    scenarios,
    activeScenarioId,
    setActiveScenarioId,
    entities,
    runSimulation,
    isSimulating,
    simulationProgress,
    simulationError,
    clearSimulationError,
    createScenario,
    generateScenarioWithAI,
  } = useCity();

  const [isGeneratingAIDraft, setIsGeneratingAIDraft] = useState(false);
  const [aiDraftPrompt, setAiDraftPrompt] = useState('');

  const zones = entities.filter(e => e.type === 'ZONE') as ZoneEntity[];
  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0];

  // New Proposal Form State
  const [newTitle, setNewTitle] = useState('');
  const [newZoneId, setNewZoneId] = useState(zones[0]?.id || 'ZONE-000001');
  const [newCategory, setNewCategory] = useState<RedevelopmentScenario['category']>('Pedestrianisation of a street');
  const [newDescription, setNewDescription] = useState('');
  const [newObjectives, setNewObjectives] = useState('');
  const [newConstraints, setNewConstraints] = useState('');
  const [newExistingCond, setNewExistingCond] = useState('');
  const [newProposedCond, setNewProposedCond] = useState('');

  const handleAIGenerateDraft = async () => {
    if (isGeneratingAIDraft) return;
    setIsGeneratingAIDraft(true);
    try {
      const draft = await generateScenarioWithAI(newCategory, newZoneId, aiDraftPrompt.trim() || undefined);
      if (draft) {
        if (draft.title) setNewTitle(draft.title);
        if (draft.description) setNewDescription(draft.description);
        if (Array.isArray(draft.objectives)) setNewObjectives(draft.objectives.join('\n'));
        if (Array.isArray(draft.knownConstraints)) setNewConstraints(draft.knownConstraints.join('\n'));
        if (draft.existingConditions) setNewExistingCond(draft.existingConditions);
        if (draft.proposedConditions) setNewProposedCond(draft.proposedConditions);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate proposal draft.');
    } finally {
      setIsGeneratingAIDraft(false);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    const created = createScenario({
      title: newTitle.trim(),
      zoneId: newZoneId,
      category: newCategory,
      description: newDescription.trim(),
      objectives: newObjectives
        .split('\n')
        .map(o => o.trim())
        .filter(Boolean),
      knownConstraints: newConstraints
        .split('\n')
        .map(c => c.trim())
        .filter(Boolean),
      existingConditions: newExistingCond.trim() || undefined,
      proposedConditions: newProposedCond.trim() || undefined,
    });

    setIsCreateModalOpen(false);
    // Reset form
    setNewTitle('');
    setNewDescription('');
    setNewObjectives('');
    setNewConstraints('');
    setNewExistingCond('');
    setNewProposedCond('');
  };

  const handleStartSimulation = async () => {
    if (!activeScenario) return;
    const report = await runSimulation(activeScenario.id);
    if (report) {
      onOpenImpactAnalysis();
    }
  };

  const activeZone = zones.find(z => z.id === activeScenario?.zoneId);

  return (
    <div className="space-y-5 font-sans select-none">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>SCENARIO LABORATORY</span>
            <span className="text-slate-500">·</span>
            <span className="text-cyan-400 font-mono">MULTI-AGENT AI SIMULATOR</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-white mt-1">
            Redevelopment Proposals & Policy Interventions
          </h1>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-3d-primary px-4 py-2.5 text-xs flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>+ NEW PROPOSAL</span>
        </button>
      </div>

      {/* Main 2-column view: Scenario List on Left, Active Inspector & Simulation Controls on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Proposals List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-display font-bold text-cyan-400 uppercase tracking-wider px-1 flex items-center justify-between">
            <span>PROPOSAL REGISTRY ({scenarios.length})</span>
            <span className="text-slate-500 text-[11px] font-mono">SELECT TO AUDIT</span>
          </div>

          <div className="space-y-2.5">
            {scenarios.map(scn => {
              const isSelected = scn.id === activeScenarioId;
              const scnZone = zones.find(z => z.id === scn.zoneId);

              return (
                <div
                  key={scn.id}
                  onClick={() => setActiveScenarioId(scn.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 backdrop-blur-md ${
                    isSelected
                      ? 'bg-gradient-to-r from-slate-900/90 to-cyan-950/40 border-cyan-500/60 shadow-[0_8px_25px_-5px_rgba(6,182,212,0.35)] -translate-y-0.5'
                      : 'bg-slate-900/60 border-white/10 hover:border-white/20 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span className="font-mono font-bold text-amber-300">{scn.id}</span>
                    <span className="truncate max-w-[150px] text-cyan-300 text-[11px] font-medium">{scn.category}</span>
                  </div>
                  <h3 className="font-display font-bold text-sm text-white line-clamp-1 mb-2 leading-tight">
                    {scn.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{scnZone ? scnZone.name.split(' ')[0] : scn.zoneId}</span>
                    </span>
                    {scn.isIllustrativeDemo && (
                      <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                        BASELINE
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Scenario Details & Simulation Trigger (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {activeScenario ? (
            <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 sm:p-6 space-y-5 shadow-2xl backdrop-blur-xl">
              {/* Proposal Header */}
              <div className="space-y-2 border-b border-white/10 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                      {activeScenario.id}
                    </span>
                    <span className="text-slate-500">·</span>
                    <span className="text-cyan-300 font-medium">{activeScenario.category}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="text-slate-500">Target District:</span>
                    <span className="text-white font-semibold">{activeZone?.name}</span>
                  </div>
                </div>

                <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                  {activeScenario.title}
                </h2>
              </div>

              {/* Proposal Description */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-display font-bold tracking-wider text-slate-400">
                  INTERVENTION BLUEPRINT & SPATIAL SCOPE
                </h4>
                <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-white/5 font-normal">
                  {activeScenario.description}
                </p>
              </div>

              {/* Stated Objectives & Known Constraints */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-display font-bold tracking-wider text-emerald-400">
                    STATED STRATEGIC OBJECTIVES
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {activeScenario.objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2 bg-slate-950/50 p-2.5 rounded-lg border border-white/5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-display font-bold tracking-wider text-amber-400">
                    KNOWN CONSTRAINTS & SENSITIVITIES
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {activeScenario.knownConstraints.map((con, i) => (
                      <li key={i} className="flex items-start gap-2 bg-slate-950/50 p-2.5 rounded-lg border border-white/5">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Simulation Action Box: Cinematic 3D Multi-Agent Dispatch */}
              <div className="rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-cyan-950/30 border border-cyan-500/30 p-5 space-y-4 shadow-[0_15px_40px_-10px_rgba(6,182,212,0.2)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>MULTI-AGENT AI SIMULATION ENGINE</span>
                    </h3>
                    <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                      Dispatches 10 Specialized AI Agents via Gemini to evaluate residential welfare, commercial vitality, emergency ingress, transit friction, and ecological stability.
                    </p>
                  </div>

                  <button
                    onClick={handleStartSimulation}
                    disabled={isSimulating}
                    className="btn-3d-primary px-5 py-2.5 text-xs flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                  >
                    {isSimulating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                        <span>DISPATCHING AGENTS...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current text-slate-950" />
                        <span>COMMENCE SIMULATION</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Simulation Progress Live Display */}
                {isSimulating && simulationProgress && (
                  <div className="space-y-2 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
                      <span className="text-cyan-300 font-semibold">
                        STAGE {simulationProgress.stage} OF {simulationProgress.totalStages}
                      </span>
                      <span>
                        {Math.round((simulationProgress.stage / simulationProgress.totalStages) * 100)}% COMPLETE
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-slate-950 overflow-hidden border border-white/10">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(simulationProgress.stage / simulationProgress.totalStages) * 100}%`,
                        }}
                      />
                    </div>

                    <p className="text-xs text-slate-200 animate-pulse flex items-center gap-2 font-medium">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span>{simulationProgress.message}</span>
                    </p>
                  </div>
                )}

                {/* Error Banner with Retry */}
                {simulationError && (
                  <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 text-xs text-red-200 space-y-2">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-red-300 block font-semibold">Simulation Execution Warning</strong>
                        <span>{simulationError}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={handleStartSimulation}
                        className="btn-3d-secondary px-3 py-1 text-xs text-white bg-red-800/80"
                      >
                        Retry Audit
                      </button>
                      <button
                        onClick={clearSimulationError}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-12 text-center text-xs text-slate-400">
              Select or create a proposal to begin multi-agent urban testing.
            </div>
          )}
        </div>
      </div>

      {/* New Redevelopment Proposal Modal: 3D Frosted Glass Dialog */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none">
          <div className="bg-[#090f1d]/95 border border-white/15 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)] backdrop-blur-3xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-xs font-semibold text-cyan-400 block font-mono">
                  NEW INTERVENTION BLUEPRINT
                </span>
                <h3 className="font-display text-lg font-bold text-white mt-0.5">
                  Create Redevelopment Proposal
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* AI Proposal Draft Generator Card */}
            <div className="rounded-2xl bg-gradient-to-r from-slate-900/90 via-cyan-950/30 to-slate-900/90 border border-cyan-500/40 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-display text-xs font-bold text-cyan-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>AI PROPOSAL DRAFT GENERATOR (GEMINI)</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  AUTO-SYNTHESIZE
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Enter an optional focus theme or policy instruction, then click Generate to have Gemini construct complete objectives, constraints, and scope automatically.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiDraftPrompt}
                  onChange={e => setAiDraftPrompt(e.target.value)}
                  placeholder="e.g. Focus on solar microgrid, bike lanes, and affordable infill..."
                  className="flex-1 bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={handleAIGenerateDraft}
                  disabled={isGeneratingAIDraft}
                  className="btn-3d-primary px-4 py-2 text-xs flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAIDraft ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingAIDraft ? 'Synthesizing...' : 'AI Draft'}</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-amber-300 uppercase mb-1">
                  Proposal / Initiative Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Westside Transit Corridor Widening & Flyover"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-cyan-300 uppercase mb-1">
                    Target Planning District *
                  </label>
                  <select
                    value={newZoneId}
                    onChange={e => setNewZoneId(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                  >
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>
                        {z.code} - {z.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-cyan-300 uppercase mb-1">
                    Intervention Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Road widening">Road widening</option>
                    <option value="Flyover or bridge construction">Flyover or bridge construction</option>
                    <option value="New commercial district">New commercial district</option>
                    <option value="Residential redevelopment">Residential redevelopment</option>
                    <option value="High-rise development">High-rise development</option>
                    <option value="Public housing">Public housing</option>
                    <option value="Industrial development">Industrial development</option>
                    <option value="School or hospital construction">School or hospital construction</option>
                    <option value="Public transport expansion">Public transport expansion</option>
                    <option value="Pedestrianisation of a street">Pedestrianisation of a street</option>
                    <option value="Parking restrictions">Parking restrictions</option>
                    <option value="Creation of parks or public spaces">Creation of parks or public spaces</option>
                    <option value="Urban renewal">Urban renewal</option>
                    <option value="Waterfront development">Waterfront development</option>
                    <option value="Drainage improvements">Drainage improvements</option>
                    <option value="Redevelopment of an existing market">Redevelopment of an existing market</option>
                    <option value="Mixed-use development">Mixed-use development</option>
                    <option value="Custom proposals">Custom proposals</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Description of Proposed Intervention *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Describe demolition, new buildings, road widths, public space changes, parking additions/removals..."
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-600 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-emerald-400 uppercase mb-1">
                    Stated Objectives (1 Per Line)
                  </label>
                  <textarea
                    rows={2}
                    value={newObjectives}
                    onChange={e => setNewObjectives(e.target.value)}
                    placeholder="e.g. Relieve peak vehicle congestion&#10;Generate commercial jobs"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-400 uppercase mb-1">
                    Known Constraints (1 Per Line)
                  </label>
                  <textarea
                    rows={2}
                    value={newConstraints}
                    onChange={e => setNewConstraints(e.target.value)}
                    placeholder="e.g. Displaces 30 small market vendors&#10;Emergency route intersects work zone"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn-3d-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-3d-primary px-5 py-2 text-xs"
                >
                  Save Proposal Blueprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
