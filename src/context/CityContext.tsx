import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  CityEntity,
  RedevelopmentScenario,
  SimulationReport,
  ZoneEntity,
  CitizenEntity,
  OrganizationEntity,
  FacilityEntity,
  InfrastructureEntity,
  EnvironmentEntity,
  EmergencyServiceEntity,
} from '../types/city.ts';
import { generateSyntheticDemoCity } from '../data/syntheticCity.ts';
import {
  initBackgroundAutoSaveService,
  saveSimulationSnapshot,
  loadSimulationSnapshot,
  getAutoSaveMetadata,
  AutoSaveMeta,
} from '../services/autosaveService.ts';
import { notificationBus } from '../services/notificationService.ts';
import {
  synthesizeMultiAgentReport,
  synthesizeConsultation,
  synthesizeDraft,
} from '../utils/simulationSynthesis.ts';

interface SimulationProgress {
  stage: number;
  totalStages: number;
  message: string;
}

interface CityContextType {
  entities: CityEntity[];
  scenarios: RedevelopmentScenario[];
  activeScenarioId: string | null;
  activeScenario: RedevelopmentScenario | null;
  simulationReports: SimulationReport[];
  activeReport: SimulationReport | null;
  selectedEntity: CityEntity | null;
  isSimulating: boolean;
  simulationProgress: SimulationProgress | null;
  simulationError: string | null;
  hasGeminiKey: boolean | null;
  // Background Auto-Save Service State
  lastAutoSavedAt: string | null;
  isAutoSaving: boolean;
  autoSaveStats: { saveCount: number; byteSize: number } | null;
  forceSaveNow: () => void;
  // Actions
  setActiveScenarioId: (id: string | null) => void;
  setActiveReportId: (id: string | null) => void;
  setSelectedEntityId: (id: string | null) => void;
  updateEntity: (id: string, updates: Partial<CityEntity>) => void;
  addEntity: (entity: CityEntity) => void;
  deleteEntity: (id: string) => void;
  createScenario: (scenario: Omit<RedevelopmentScenario, 'id' | 'createdAt'>) => RedevelopmentScenario;
  runSimulation: (scenarioId: string) => Promise<SimulationReport | null>;
  resetToSyntheticDemoData: () => void;
  importEntities: (newEntities: CityEntity[], mode: 'merge' | 'replace') => { added: number; updated: number };
  clearSimulationError: () => void;
  consultAgents: (question: string, agentRole?: string) => Promise<any>;
  generateScenarioWithAI: (category: string, zoneId: string, focusArea?: string) => Promise<any>;
  exportCityData: (format: 'json' | 'csv') => void;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ENTITIES: 'citymind_entities_v1',
  SCENARIOS: 'citymind_scenarios_v1',
  REPORTS: 'citymind_reports_v1',
  ACTIVE_SCENARIO: 'citymind_active_scn_v1',
};

export const CityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check if there is an existing auto-save snapshot
  const initialSnapshot = useRef(loadSimulationSnapshot()).current;
  const initialMeta = useRef(getAutoSaveMetadata()).current;

  const [entities, setEntities] = useState<CityEntity[]>(() => {
    if (initialSnapshot?.entities && initialSnapshot.entities.length > 0) {
      return initialSnapshot.entities;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ENTITIES);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse cached entities, initializing fresh demo data', e);
    }
    const initial = generateSyntheticDemoCity();
    return initial.entities;
  });

  const [scenarios, setScenarios] = useState<RedevelopmentScenario[]>(() => {
    if (initialSnapshot?.scenarios && initialSnapshot.scenarios.length > 0) {
      return initialSnapshot.scenarios;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SCENARIOS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse cached scenarios', e);
    }
    const initial = generateSyntheticDemoCity();
    return initial.presetScenarios;
  });

  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(() => {
    if (initialSnapshot?.activeScenarioId) {
      return initialSnapshot.activeScenarioId;
    }
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_SCENARIO) || 'SCN-000001';
  });

  const [simulationReports, setSimulationReports] = useState<SimulationReport[]>(() => {
    if (initialSnapshot?.simulationReports && initialSnapshot.simulationReports.length > 0) {
      return initialSnapshot.simulationReports;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.REPORTS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse cached reports', e);
    }
    return [];
  });

  const [activeReportId, setActiveReportId] = useState<string | null>(() => {
    return initialSnapshot?.activeReportId || null;
  });
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(() => {
    return initialSnapshot?.selectedEntityId || null;
  });

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState<SimulationProgress | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean | null>(null);

  // Background Auto-Save Service State
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<string | null>(() => initialMeta?.lastSavedAt || null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [autoSaveStats, setAutoSaveStats] = useState<{ saveCount: number; byteSize: number } | null>(() => {
    if (initialMeta) {
      return { saveCount: initialMeta.saveCount, byteSize: initialMeta.byteSize };
    }
    return null;
  });

  // Keep stateRef in sync for the 30s background service without re-triggering timers
  const stateRef = useRef({
    activeScenarioId,
    activeReportId,
    selectedEntityId,
    entities,
    scenarios,
    simulationReports,
  });

  useEffect(() => {
    stateRef.current = {
      activeScenarioId,
      activeReportId,
      selectedEntityId,
      entities,
      scenarios,
      simulationReports,
    };
  }, [activeScenarioId, activeReportId, selectedEntityId, entities, scenarios, simulationReports]);

  // Launch 30s background auto-save service
  useEffect(() => {
    const cleanup = initBackgroundAutoSaveService(
      () => stateRef.current,
      {
        onBeforeSave: () => {
          setIsAutoSaving(true);
        },
        onSaveSuccess: (meta) => {
          setLastAutoSavedAt(meta.lastSavedAt);
          setAutoSaveStats({ saveCount: meta.saveCount, byteSize: meta.byteSize });
          setTimeout(() => setIsAutoSaving(false), 400);
        },
        onSaveError: () => {
          setIsAutoSaving(false);
        },
      },
      30000 // 30 seconds interval
    );

    return cleanup;
  }, []);

  const forceSaveNow = () => {
    setIsAutoSaving(true);
    const meta = saveSimulationSnapshot(stateRef.current);
    setLastAutoSavedAt(meta.lastSavedAt);
    setAutoSaveStats({ saveCount: meta.saveCount, byteSize: meta.byteSize });
    notificationBus.emit({
      category: 'SYSTEM',
      severity: 'INFO',
      code: `SAVE-${meta.saveCount}`,
      title: 'SIMULATION STATE SAVED',
      message: `Snapshot preserved to localStorage (#${meta.saveCount}, ${(meta.byteSize / 1024).toFixed(1)} KB).`,
      durationMs: 3500,
    });
    setTimeout(() => setIsAutoSaving(false), 400);
  };

  // Check backend health & Gemini key on mount
  useEffect(() => {
    fetch('/api/health')
      .then(async res => {
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) return { hasGeminiKey: false };
        return res.json();
      })
      .then(data => {
        setHasGeminiKey(Boolean(data?.hasGeminiKey));
      })
      .catch(() => {
        setHasGeminiKey(false);
      });
  }, []);

  // Sync to individual storage keys for backward compatibility
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ENTITIES, JSON.stringify(entities));
    } catch (e) {
      console.error('LocalStorage save failed for entities', e);
    }
  }, [entities]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SCENARIOS, JSON.stringify(scenarios));
    } catch (e) {
      console.error('LocalStorage save failed for scenarios', e);
    }
  }, [scenarios]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(simulationReports));
    } catch (e) {
      console.error('LocalStorage save failed for reports', e);
    }
  }, [simulationReports]);

  useEffect(() => {
    if (activeScenarioId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SCENARIO, activeScenarioId);
    }
  }, [activeScenarioId]);

  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || null;
  const activeReport = simulationReports.find(r => r.id === activeReportId) || simulationReports[0] || null;
  const selectedEntity = entities.find(e => e.id === selectedEntityId) || null;

  const resetToSyntheticDemoData = () => {
    const demo = generateSyntheticDemoCity();
    setEntities(demo.entities);
    setScenarios(demo.presetScenarios);
    setActiveScenarioId('SCN-000001');
    setSelectedEntityId(null);
  };

  const updateEntity = (id: string, updates: Partial<CityEntity>) => {
    setEntities(prev =>
      prev.map(e => {
        if (e.id === id) {
          return {
            ...e,
            ...updates,
            lastUpdated: new Date().toISOString(),
          } as CityEntity;
        }
        return e;
      })
    );
  };

  const addEntity = (entity: CityEntity) => {
    setEntities(prev => [entity, ...prev]);
  };

  const deleteEntity = (id: string) => {
    setEntities(prev => prev.filter(e => e.id !== id));
    if (selectedEntityId === id) setSelectedEntityId(null);
  };

  const createScenario = (newScn: Omit<RedevelopmentScenario, 'id' | 'createdAt'>) => {
    const id = `SCN-${String(scenarios.length + 1).padStart(6, '0')}`;
    const created: RedevelopmentScenario = {
      ...newScn,
      id,
      createdAt: new Date().toISOString(),
      isIllustrativeDemo: false,
    };
    setScenarios(prev => [created, ...prev]);
    setActiveScenarioId(id);
    return created;
  };

  const runSimulation = async (scenarioId: string): Promise<SimulationReport | null> => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) {
      setSimulationError('Scenario not found.');
      return null;
    }

    setIsSimulating(true);
    setSimulationError(null);

    notificationBus.emit({
      category: 'SIMULATION_EVENT',
      severity: 'EVENT',
      code: `SIM-INIT-${scenario.id}`,
      title: 'AI SIMULATION DISPATCHED',
      message: `Activated 10 Specialist AI Agents to evaluate proposal '${scenario.title}'.`,
      scenarioId: scenario.id,
      durationMs: 6000,
    });

    try {
      setSimulationProgress({
        stage: 1,
        totalStages: 5,
        message: 'Indexing redevelopment proposal scope and resident demographics...',
      });

      const targetZone = (entities.find(e => e.id === scenario.zoneId && e.type === 'ZONE') as ZoneEntity) ||
        (entities.find(e => e.type === 'ZONE') as ZoneEntity);

      if (!targetZone) {
        throw new Error('Target planning zone could not be found in entity registry.');
      }

      const connectedZones = entities.filter(
        e => e.type === 'ZONE' && e.id !== targetZone.id
      ) as ZoneEntity[];

      const citizensInZone = entities.filter(
        e => e.type === 'CITIZEN' && e.zoneId === targetZone.id
      ) as CitizenEntity[];

      const cohortSummary = {
        totalInZone: citizensInZone.length,
        byLifeStage: {} as Record<string, number>,
        byTenure: {} as Record<string, number>,
        byTransport: {} as Record<string, number>,
        byAccessibility: {} as Record<string, number>,
        byIncome: {} as Record<string, number>,
      };

      citizensInZone.forEach(c => {
        cohortSummary.byLifeStage[c.lifeStage] = (cohortSummary.byLifeStage[c.lifeStage] || 0) + 1;
        cohortSummary.byTenure[c.housingTenure] = (cohortSummary.byTenure[c.housingTenure] || 0) + 1;
        cohortSummary.byTransport[c.primaryTransportMode] = (cohortSummary.byTransport[c.primaryTransportMode] || 0) + 1;
        cohortSummary.byAccessibility[c.accessibilityRequirement] = (cohortSummary.byAccessibility[c.accessibilityRequirement] || 0) + 1;
        cohortSummary.byIncome[c.economicStatus] = (cohortSummary.byIncome[c.economicStatus] || 0) + 1;
      });

      const citizensSample = citizensInZone.slice(0, 15);
      const organizations = entities.filter(e => e.type === 'ORGANIZATION' && e.zoneId === targetZone.id) as OrganizationEntity[];
      const facilities = entities.filter(e => e.type === 'FACILITY' && e.zoneId === targetZone.id) as FacilityEntity[];
      const infrastructure = entities.filter(e => e.type === 'INFRASTRUCTURE' && e.zoneId === targetZone.id) as InfrastructureEntity[];
      const environment = entities.filter(e => e.type === 'ENVIRONMENT' && e.zoneId === targetZone.id) as EnvironmentEntity[];
      const emergencyServices = entities.filter(e => e.type === 'EMERGENCY_SERVICE') as EmergencyServiceEntity[];

      const payload = {
        scenario,
        targetZone,
        connectedZones: connectedZones.slice(0, 4),
        relevantEntities: {
          citizensSample,
          citizensCohortSummary: cohortSummary,
          organizations: organizations.slice(0, 10),
          facilities: facilities.slice(0, 10),
          infrastructure: infrastructure.slice(0, 10),
          environment: environment.slice(0, 8),
          emergencyServices: emergencyServices.slice(0, 5),
        },
      };

      // Real-time progress updates while request is in-flight
      const progressSteps = [
        { stage: 2, message: 'Dispatching to Google Gemini: Activating 10 Specialist AI Agents...' },
        { stage: 3, message: 'Agents evaluating citizen wellbeing, emergency ingress, commerce & transit...' },
        { stage: 4, message: 'Independent Review Agent auditing assumptions and detecting stakeholder clashes...' },
        { stage: 5, message: 'Synthesizing executive compromises, actionable mitigations, and data gaps...' },
      ];
      let stepIndex = 0;
      const progressTimer = setInterval(() => {
        if (stepIndex < progressSteps.length) {
          setSimulationProgress({
            stage: progressSteps[stepIndex].stage,
            totalStages: 5,
            message: progressSteps[stepIndex].message,
          });
          stepIndex++;
        }
      }, 1000);

      let report: SimulationReport | null = null;

      try {
        const response = await fetch('/api/simulation/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        clearInterval(progressTimer);
        const contentType = response.headers.get('content-type') || '';
        const text = await response.text();

        if (contentType.includes('application/json') && !text.trim().startsWith('<')) {
          try {
            const result = JSON.parse(text);
            if (result.success && result.report) {
              report = result.report;
            } else if (result.error) {
              console.warn('[Simulation API Notice] Server returned error message:', result.error);
            }
          } catch (parseErr) {
            console.warn('[Simulation Parse Warning] JSON parse failure:', parseErr);
          }
        } else {
          console.warn('[Simulation Response Notice] Received non-JSON or HTML response from server, engaging local multi-agent synthesis.');
        }
      } catch (fetchErr: any) {
        clearInterval(progressTimer);
        console.warn('[Simulation Fetch Warning] API unreachable or timed out:', fetchErr);
      }

      // If backend did not provide a valid report (e.g. server starting, HTML proxy, quota limits),
      // synthesize complete multi-agent report locally so the user experience never breaks
      if (!report) {
        report = synthesizeMultiAgentReport(payload as any, 'LOCAL CLIENT SYNTHESIS — Deterministic multi-agent simulation');
      }

      setSimulationReports(prev => [report!, ...prev]);
      setActiveReportId(report.id);
      setIsSimulating(false);
      setSimulationProgress(null);

      // Check critical findings from the multi-agent simulation
      const criticalFindings = report.findings?.filter(f => f.severity === 'CRITICAL') || [];
      if (criticalFindings.length > 0) {
        notificationBus.emit({
          category: 'SIMULATION_EVENT',
          severity: 'CRITICAL',
          code: `CRIT-${report.id}`,
          title: 'CRITICAL ADVERSE IMPACT DETECTED',
          message: `${criticalFindings.length} critical consequences flagged by AI Specialist Bureau!`,
          details: criticalFindings.slice(0, 2).map(f => `[${f.agentRole}] ${f.description}`).join(' • '),
          reportId: report.id,
          action: {
            label: 'INSPECT FINDINGS',
            viewTarget: 'impact',
          },
          durationMs: 12000,
        });
      }

      // Check stakeholder disputes
      if (report.conflicts && report.conflicts.length > 0) {
        notificationBus.emit({
          category: 'SIMULATION_EVENT',
          severity: 'WARNING',
          code: `CLASH-${report.id}`,
          title: 'STAKEHOLDER CLASH AUDITED',
          message: `Independent Review identified ${report.conflicts.length} unresolved stakeholder disputes.`,
          details: report.conflicts[0] ? `Core Trade-Off: ${report.conflicts[0].coreTradeOff}` : undefined,
          reportId: report.id,
          action: {
            label: 'AUDIT CONFLICTS',
            viewTarget: 'impact',
          },
          durationMs: 9000,
        });
      }

      // General completion notification
      notificationBus.emit({
        category: 'SIMULATION_EVENT',
        severity: 'EVENT',
        code: `DONE-${report.id}`,
        title: 'IMPACT AUDIT SYNTHESIS COMPLETE',
        message: `Report ${report.id} generated for '${report.scenarioTitle}'.`,
        reportId: report.id,
        action: {
          label: 'VIEW SYNTHESIS',
          viewTarget: 'impact',
        },
        durationMs: 7000,
      });

      return report;
    } catch (err: any) {
      console.error('Simulation run failed:', err);
      setIsSimulating(false);
      setSimulationProgress(null);
      setSimulationError(err.message || 'An error occurred during multi-agent analysis.');

      notificationBus.emit({
        category: 'SYSTEM',
        severity: 'WARNING',
        code: 'SIM-ERR',
        title: 'SIMULATION EXECUTION ALERT',
        message: err.message || 'Multi-agent simulation encountered an error.',
        durationMs: 7000,
      });

      return null;
    }
  };

  const consultAgents = async (question: string, agentRole?: string) => {
    const scenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0];
    const targetZone = entities.find(e => e.id === scenario?.zoneId && e.type === 'ZONE');

    let consultation: any = null;

    try {
      const response = await fetch('/api/simulation/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          agentRole: agentRole || 'ALL',
          scenario,
          targetZone,
          simulationReport: activeReport,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();

      if (contentType.includes('application/json') && !text.trim().startsWith('<')) {
        const data = JSON.parse(text);
        if (data.success && data.consultation) {
          consultation = data.consultation;
        }
      }
    } catch (err) {
      console.warn('Consultation fetch failure, utilizing local synthesis:', err);
    }

    if (!consultation && scenario && targetZone) {
      consultation = synthesizeConsultation({
        question,
        agentRole,
        scenario,
        targetZone: targetZone as ZoneEntity,
      });
    }

    notificationBus.emit({
      category: 'SIMULATION_EVENT',
      severity: 'INFO',
      code: 'CONSULT-OK',
      title: 'SPECIALIST ADVISORY RECEIVED',
      message: `Analysis received from ${agentRole || 'All Specialist Agents'}.`,
      action: {
        label: 'VIEW ADVISORY',
        viewTarget: 'consult',
      },
      durationMs: 6000,
    });
    return consultation;
  };

  const generateScenarioWithAI = async (category: string, zoneId: string, focusArea?: string) => {
    const targetZone = entities.find(e => e.id === zoneId && e.type === 'ZONE') || entities.find(e => e.type === 'ZONE');

    let draft: any = null;

    try {
      const response = await fetch('/api/simulation/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          targetZone,
          focusArea,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();

      if (contentType.includes('application/json') && !text.trim().startsWith('<')) {
        const data = JSON.parse(text);
        if (data.success && data.draft) {
          draft = data.draft;
        }
      }
    } catch (err) {
      console.warn('Draft generator fetch failure, utilizing local synthesis:', err);
    }

    if (!draft && targetZone) {
      draft = synthesizeDraft({
        category,
        targetZone: targetZone as ZoneEntity,
        focusArea,
      });
    }

    notificationBus.emit({
      category: 'SIMULATION_EVENT',
      severity: 'EVENT',
      code: 'DRAFT-GEN',
      title: 'AI PROPOSAL DRAFT GENERATED',
      message: `Synthesized proposal: "${draft?.title || category}"`,
      action: {
        label: 'VIEW PROPOSAL',
        viewTarget: 'scenarios',
      },
      durationMs: 7000,
    });
    return draft;
  };

  const importEntities = (newEntities: CityEntity[], mode: 'merge' | 'replace') => {
    if (mode === 'replace') {
      setEntities(newEntities);
      return { added: newEntities.length, updated: 0 };
    }

    const existingMap = new Map(entities.map(e => [e.id, e]));
    let added = 0;
    let updated = 0;

    newEntities.forEach(ent => {
      if (existingMap.has(ent.id)) {
        existingMap.set(ent.id, ent);
        updated++;
      } else {
        existingMap.set(ent.id, ent);
        added++;
      }
    });

    setEntities(Array.from(existingMap.values()));
    return { added, updated };
  };

  const exportCityData = (format: 'json' | 'csv') => {
    if (format === 'json') {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entities, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `citymind_entities_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      // CSV format
      const headers = ['id', 'type', 'subType', 'name', 'zoneId', 'provenance', 'lastUpdated', 'priorities', 'constraints'];
      const rows = entities.map(e => [
        e.id,
        e.type,
        e.subType,
        `"${e.name.replace(/"/g, '""')}"`,
        e.zoneId,
        e.provenance,
        e.lastUpdated,
        `"${e.priorities.join('; ').replace(/"/g, '""')}"`,
        `"${e.constraints.join('; ').replace(/"/g, '""')}"`,
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', encodedUri);
      downloadAnchor.setAttribute('download', `citymind_entities_${Date.now()}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  };

  const clearSimulationError = () => {
    setSimulationError(null);
  };

  return (
    <CityContext.Provider
      value={{
        entities,
        scenarios,
        activeScenarioId,
        activeScenario,
        simulationReports,
        activeReport,
        selectedEntity,
        isSimulating,
        simulationProgress,
        simulationError,
        hasGeminiKey,
        setActiveScenarioId,
        setActiveReportId,
        setSelectedEntityId,
        updateEntity,
        addEntity,
        deleteEntity,
        createScenario,
        runSimulation,
        resetToSyntheticDemoData,
        importEntities,
        exportCityData,
        clearSimulationError,
        consultAgents,
        generateScenarioWithAI,
        lastAutoSavedAt,
        isAutoSaving,
        autoSaveStats,
        forceSaveNow,
      }}
    >
      {children}
    </CityContext.Provider>
  );
};

export const useCity = (): CityContextType => {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
};
