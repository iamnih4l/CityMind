import { GoogleGenAI, Type } from '@google/genai';
import type {
  RedevelopmentScenario,
  ZoneEntity,
  CitizenEntity,
  OrganizationEntity,
  FacilityEntity,
  InfrastructureEntity,
  EnvironmentEntity,
  EmergencyServiceEntity,
  SimulationReport,
} from '../types/city.ts';
import {
  synthesizeMultiAgentReport,
  synthesizeConsultation,
  synthesizeDraft,
} from '../utils/simulationSynthesis.ts';

// Configurable model name per Gemini API specifications
export const SIMULATION_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

// Shared server-side client
function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Runs a promise with a strict timeout to avoid long hangs when quota or network degrades.
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs = 7000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Gemini API call timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then(res => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Executes Gemini generation with transient error retry and model fallback.
 */
async function generateWithFallback(ai: GoogleGenAI, request: { contents: string; config?: any }) {
  const models = Array.from(new Set([SIMULATION_MODEL, 'gemini-3.8-flash', 'gemini-flash-latest']));
  let lastError: any = null;

  for (const model of models) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model,
          contents: request.contents,
          config: request.config,
        }),
        7000
      );
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini Call Notice] Model ${model} failed (${err.message || err}), checking next fallback...`);
    }
  }

  throw lastError || new Error('All AI generation model fallbacks exhausted.');
}

export interface SimulationPayload {
  scenario: RedevelopmentScenario;
  targetZone: ZoneEntity;
  connectedZones: ZoneEntity[];
  relevantEntities: {
    citizensSample: CitizenEntity[];
    citizensCohortSummary: {
      totalInZone: number;
      byLifeStage: Record<string, number>;
      byTenure: Record<string, number>;
      byTransport: Record<string, number>;
      byAccessibility: Record<string, number>;
      byIncome: Record<string, number>;
    };
    organizations: OrganizationEntity[];
    facilities: FacilityEntity[];
    infrastructure: InfrastructureEntity[];
    environment: EnvironmentEntity[];
    emergencyServices: EmergencyServiceEntity[];
  };
}

export async function runMultiAgentSimulation(payload: SimulationPayload): Promise<SimulationReport> {
  const ai = getGenAIClient();
  const scenario = payload?.scenario || ({} as RedevelopmentScenario);
  const targetZone = payload?.targetZone || ({} as ZoneEntity);
  const connectedZones = Array.isArray(payload?.connectedZones) ? payload.connectedZones : [];
  const rawEnts = (payload?.relevantEntities && typeof payload.relevantEntities === 'object' && !Array.isArray(payload.relevantEntities))
    ? (payload.relevantEntities as any)
    : ({} as any);

  const relevantEntities = {
    citizensSample: (Array.isArray(rawEnts.citizensSample) ? rawEnts.citizensSample : []) as CitizenEntity[],
    citizensCohortSummary: rawEnts.citizensCohortSummary || {
      totalInZone: targetZone.totalPopulation || 28500,
      byLifeStage: {},
      byTenure: {},
      byTransport: {},
      byAccessibility: {},
      byIncome: {},
    },
    organizations: (Array.isArray(rawEnts.organizations) ? rawEnts.organizations : []) as OrganizationEntity[],
    facilities: (Array.isArray(rawEnts.facilities) ? rawEnts.facilities : []) as FacilityEntity[],
    infrastructure: (Array.isArray(rawEnts.infrastructure) ? rawEnts.infrastructure : []) as InfrastructureEntity[],
    environment: (Array.isArray(rawEnts.environment) ? rawEnts.environment : []) as EnvironmentEntity[],
    emergencyServices: (Array.isArray(rawEnts.emergencyServices) ? rawEnts.emergencyServices : []) as EmergencyServiceEntity[],
  };

  const normalizedPayload: SimulationPayload = {
    scenario,
    targetZone,
    connectedZones,
    relevantEntities,
  };

  if (!ai) {
    console.warn('[Gemini Simulation] GEMINI_API_KEY is not configured. Utilizing deterministic multi-agent synthesis.');
    return synthesizeMultiAgentReport(normalizedPayload, 'DETERMINISTIC SIMULATION — Synthesized from city registry multi-agent models (No API key)');
  }

  try {
    const objectivesList = (scenario.objectives && Array.isArray(scenario.objectives) && scenario.objectives.length > 0)
      ? scenario.objectives.join('; ')
      : 'Optimize land use efficiency, enhance public mobility, and improve climate resilience.';
    const constraintsList = (scenario.knownConstraints && Array.isArray(scenario.knownConstraints) && scenario.knownConstraints.length > 0)
      ? scenario.knownConstraints.join('; ')
      : 'Maintain tenant protections, limit construction noise, and satisfy emergency ingress clearances.';

    const promptContent = `You are CityMind, a multi-agent AI urban planning simulator powered by Gemini.
Analyze the redevelopment proposal below and evaluate the consequences across 10 specialist agents.

PROPOSAL SPECIFICATION:
- ID: ${scenario.id || 'SCN-CUSTOM'}
- Title: "${scenario.title || 'Urban Development Proposal'}"
- Category: ${scenario.category || 'COMMERCIAL'}
- Target Zone: ${targetZone.name || 'Core District'} (Code: ${targetZone.code || 'ZONE-01'}, Land Use: ${targetZone.landUseClassification || 'MIXED_USE'}, Population: ${targetZone.totalPopulation || 25000}, Flood Risk: ${targetZone.floodVulnerability || 'LOW'})
- Description: ${scenario.description || 'Comprehensive urban regeneration and corridor revitalization plan.'}
- Stated Objectives: ${objectivesList}
- Known Constraints: ${constraintsList}

ADJACENT ZONES:
${connectedZones.map(z => `- ${z.name}: ${z.landUseClassification}, Pop: ${z.totalPopulation}`).join('\n') || '- Adjacent Metropolitan Buffer Zone'}

DATA FROM CITY REGISTRY:
- Residents in target zone: ${relevantEntities.citizensCohortSummary?.totalInZone || targetZone.totalPopulation || 25000}
- Sample Cohorts: ${JSON.stringify(relevantEntities.citizensCohortSummary?.byLifeStage || {})}
- Housing Tenure: ${JSON.stringify(relevantEntities.citizensCohortSummary?.byTenure || {})}
- Commercial Businesses: ${relevantEntities.organizations.map(o => `${o.name} (${o.sector}, ${o.employeeCount} staff, loading bay: ${o.loadingBayNeeded})`).join('; ') || 'Active ground floor retail storefronts'}
- Facilities: ${relevantEntities.facilities.map(f => `${f.name} (${f.category}, cap: ${f.capacity})`).join('; ') || 'Public community hubs and primary schools'}
- Infrastructure: ${relevantEntities.infrastructure.map(i => `${i.name} (${i.assetClass}, sensitivity: ${i.failureSensitivity})`).join('; ') || 'Municipal power grid and stormwater conduits'}
- Ecological: ${relevantEntities.environment.map(e => `${e.name} (${e.environmentalType}, runoff: ${e.runoffRiskLevel})`).join('; ') || 'Urban tree canopy and bioswales'}
- Emergency Services: ${relevantEntities.emergencyServices.map(s => `${s.name} (${s.serviceType}, fleet: ${s.vehicleFleetSize})`).join('; ') || 'Municipal fire station and paramedic dispatch unit'}

TASK:
Produce a comprehensive JSON response adhering strictly to this schema:
{
  "affectedCohortsSummary": ["summary strings"],
  "agentAssessments": [
    {
      "agentRole": "CITIZEN_WELLBEING | EMERGENCY_SERVICES | EDUCATION_HEALTHCARE | BUSINESS_ECONOMIC | TRANSPORT_ACCESSIBILITY | ENVIRONMENT_CLIMATE | INFRASTRUCTURE_UTILITIES | URBAN_PLANNING_REGULATORY",
      "agentName": "Name",
      "domain": "Domain description",
      "summary": "Specialist analysis",
      "evaluationCriteriaUsed": ["criteria"],
      "positiveOutcomes": ["positive"],
      "adverseOutcomes": ["adverse"],
      "disproportionatelyAffectedGroups": ["groups"],
      "safetyConcerns": ["concerns"],
      "unresolvedQuestions": ["missing data questions"],
      "confidenceLevel": "HIGH | MEDIUM | LOW"
    }
  ],
  "findings": [
    {
      "id": "FND-0001",
      "domain": "domain",
      "agentRole": "agent role",
      "affectedEntityIds": ["ids"],
      "affectedCohort": "affected cohort",
      "description": "finding description",
      "impactType": "BENEFIT | DISADVANTAGE | NEUTRAL_RISK",
      "severity": "CRITICAL | HIGH | MODERATE | LOW",
      "likelihood": "ALMOST_CERTAIN | LIKELY | POSSIBLE | UNLIKELY",
      "confidence": "HIGH | MEDIUM | LOW",
      "evidenceUsed": "empirical basis",
      "assumptionsMade": "assumptions",
      "missingInformation": "missing info",
      "suggestedMitigation": "mitigation action",
      "validationRequired": "validation step",
      "evidenceCategory": "VERIFIED_DATA | MODEL_INTERPRETATION | ASSUMPTION | UNRESOLVED_QUESTION"
    }
  ],
  "conflicts": [
    {
      "id": "CONF-01",
      "title": "Title of conflict",
      "competingParties": [
        { "stakeholder": "Party 1", "priority": "priority", "stance": "stance", "evidence": "basis" },
        { "stakeholder": "Party 2", "priority": "priority", "stance": "stance", "evidence": "basis" }
      ],
      "coreTradeOff": "trade-off explanation",
      "potentialCompromise": "compromise solution",
      "compromiseTradeOffs": "trade-offs of compromise",
      "regulatoryOrSafetyConstraints": "safety constraints"
    }
  ],
  "independentReview": {
    "unsupportedClaims": ["claims"],
    "omissionsIdentified": ["omissions"],
    "agentDisagreements": ["disagreements"],
    "dataLimitations": ["data limitations"]
  },
  "synthesis": {
    "executiveSummary": "Concise high-level decision summary",
    "keyBenefits": ["key benefits"],
    "criticalRisks": ["critical risks"],
    "recommendedMitigations": ["actionable recommendations"],
    "nextStepsAndDataRequired": ["empirical steps before approval"]
  }
}

Return ONLY valid JSON. Include 8-10 agent assessments and 6-10 findings.`;

    const response = await generateWithFallback(ai, {
      contents: promptContent,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const rawText = response.text;
    if (!rawText) {
      throw new Error('Gemini API returned an empty response.');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawText.trim());
    } catch {
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    const reportId = `REP-${Date.now().toString(36).toUpperCase()}`;

    const report: SimulationReport = {
      id: reportId,
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      targetZoneId: targetZone.id,
      targetZoneName: targetZone.name,
      timestamp: new Date().toISOString(),
      totalAffectedEntitiesCount:
        relevantEntities.citizensSample.length +
        relevantEntities.organizations.length +
        relevantEntities.facilities.length +
        relevantEntities.infrastructure.length +
        relevantEntities.environment.length,
      affectedCohortsSummary: parsed.affectedCohortsSummary || [],
      agentAssessments: parsed.agentAssessments || [],
      findings: parsed.findings || [],
      conflicts: parsed.conflicts || [],
      independentReview: parsed.independentReview || {
        unsupportedClaims: [],
        omissionsIdentified: [],
        agentDisagreements: [],
        dataLimitations: [],
      },
      synthesis: parsed.synthesis || {
        executiveSummary: 'Simulation completed with standard findings.',
        keyBenefits: [],
        criticalRisks: [],
        recommendedMitigations: [],
        nextStepsAndDataRequired: [],
      },
      dataProvenanceNote: 'LIVE GEMINI AI ANALYSIS — Multi-agent evaluation across 10 specialist bureaus.',
    };

    return report;
  } catch (err: any) {
    console.warn(`[Gemini Simulation Warning] Gemini generation failed (${err.message || err}). Falling back to deterministic multi-agent synthesis.`);
    return synthesizeMultiAgentReport(payload, 'DETERMINISTIC SIMULATION — Synthesized from city registry multi-agent models (AI quota limit fallback)');
  }
}

export interface ConsultPayload {
  question: string;
  agentRole?: string;
  scenario: RedevelopmentScenario;
  targetZone: ZoneEntity;
  simulationReport?: SimulationReport | null;
}

export interface ConsultResponse {
  agentRole: string;
  agentName: string;
  answer: string;
  recommendedAdjustment: string;
  confidence: string;
  keyConcerns: string[];
}

export async function consultSpecialistAgents(payload: ConsultPayload): Promise<ConsultResponse> {
  const ai = getGenAIClient();
  const { question, agentRole, scenario, targetZone, simulationReport } = payload;

  if (!ai) {
    return synthesizeConsultation(payload);
  }

  try {
    const rolePrompt = agentRole && agentRole !== 'ALL'
      ? `You are speaking as the specialist agent: ${agentRole}.`
      : `You are speaking as the lead panel of CityMind multi-agent urban specialists.`;

    const zoneName = targetZone?.name || 'the targeted district';
    const objectives = Array.isArray(scenario?.objectives) && scenario.objectives.length > 0
      ? scenario.objectives.join('; ')
      : 'Standard sustainable development targets';
    const constraints = Array.isArray(scenario?.knownConstraints) && scenario.knownConstraints.length > 0
      ? scenario.knownConstraints.join('; ')
      : 'Standard municipal zoning & budget constraints';

    const prompt = `${rolePrompt}
Analyze this user query regarding the redevelopment proposal: "${scenario?.title || 'Urban Development'}" in ${zoneName}.

PROPOSAL:
- Title: ${scenario?.title || 'Urban Proposal'}
- Category: ${scenario?.category || 'Mixed Use'}
- Description: ${scenario?.description || 'Urban redevelopment initiative'}
- Objectives: ${objectives}
- Constraints: ${constraints}

${simulationReport ? `LATEST SIMULATION FINDINGS SYNTHESIS:
${simulationReport.synthesis.executiveSummary}
Key Risks: ${simulationReport.synthesis.criticalRisks.join('; ')}
Mitigations: ${simulationReport.synthesis.recommendedMitigations.join('; ')}` : ''}

USER INQUIRY / MODIFICATION IDEA:
"${question}"

Provide a specialist answer evaluating the impact, feasibility, and specific adjustments needed.
Respond in valid JSON with schema:
{
  "agentRole": "${agentRole || 'CONSORTIUM_PANEL'}",
  "agentName": "Agent Name or Panel",
  "answer": "Clear, direct, evidence-based assessment",
  "recommendedAdjustment": "Actionable proposal tweak or mitigation",
  "confidence": "HIGH | MEDIUM | LOW",
  "keyConcerns": ["specific concern 1", "specific concern 2"]
}`;

    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const rawText = response.text || '{}';
    try {
      return JSON.parse(rawText.trim());
    } catch {
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    }
  } catch (err: any) {
    console.warn(`[Gemini Consult Warning] Gemini consultation failed (${err.message || err}). Falling back to synthesized advisory.`);
    return synthesizeConsultation(payload);
  }
}

export interface GenerateScenarioPayload {
  category: string;
  targetZone: ZoneEntity;
  focusArea?: string;
}

export async function generateScenarioDraft(payload: GenerateScenarioPayload): Promise<{
  title: string;
  category: RedevelopmentScenario['category'];
  description: string;
  objectives: string[];
  knownConstraints: string[];
  existingConditions: string;
  proposedConditions: string;
}> {
  const ai = getGenAIClient();
  const { category, targetZone, focusArea } = payload;

  if (!ai) {
    return synthesizeDraft(payload);
  }

  try {
    const prompt = `You are CityMind, an urban planning AI.
Create a comprehensive, realistic redevelopment scenario proposal in the zone "${targetZone.name}" (Code: ${targetZone.code}, Land Use: ${targetZone.landUseClassification}, Population: ${targetZone.totalPopulation}, Flood Risk: ${targetZone.floodVulnerability}).
Category requested: "${category}"
${focusArea ? `Specific focus/instruction: "${focusArea}"` : ''}

Generate a detailed urban proposal with authentic local trade-offs. Return ONLY valid JSON with this schema:
{
  "title": "Creative and realistic project title",
  "category": "${category}",
  "description": "Comprehensive 3-4 sentence project brief outlining scope, intervention, and rationale",
  "objectives": ["Specific measurable objective 1", "Specific measurable objective 2", "Specific measurable objective 3"],
  "knownConstraints": ["Major constraint or risk 1", "Major constraint or risk 2", "Major constraint or risk 3"],
  "existingConditions": "Brief summary of current street layout, congestion, or structural status",
  "proposedConditions": "Summary of target layout after intervention"
}`;

    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    });

    const rawText = response.text || '{}';
    try {
      return JSON.parse(rawText.trim());
    } catch {
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    }
  } catch (err: any) {
    console.warn(`[Gemini Draft Warning] Gemini draft generation failed (${err.message || err}). Falling back to synthesized proposal.`);
    return synthesizeDraft(payload);
  }
}

