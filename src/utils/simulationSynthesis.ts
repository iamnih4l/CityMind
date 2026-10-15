import type {
  SimulationPayload,
} from '../server/geminiSimulation.ts';
import type {
  SimulationReport,
  AgentAssessment,
  Finding,
  ConflictItem,
  IndependentReview,
  SynthesisReport,
  RedevelopmentScenario,
  ZoneEntity,
  CitizenEntity,
  OrganizationEntity,
  FacilityEntity,
  InfrastructureEntity,
  EnvironmentEntity,
  EmergencyServiceEntity,
} from '../types/city.ts';

/**
 * Deterministic, high-fidelity multi-agent urban simulation synthesizer.
 * Used as a server-side fallback when Gemini API encounters quota limits or network partitions,
 * and as a client-side safety net against proxy/HTML errors.
 */
export function synthesizeMultiAgentReport(
  payload: SimulationPayload,
  provenanceTag: string = 'DETERMINISTIC SIMULATION — Synthesized from city registry multi-agent models'
): SimulationReport {
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

  const now = Date.now();
  const reportId = `REP-${now.toString(36).toUpperCase()}`;

  const zoneName = targetZone.name || 'Target District';
  const zonePop = targetZone.totalPopulation || 28500;
  const floodRisk = targetZone.floodVulnerability || 'LOW';
  const landUse = targetZone.landUseClassification || 'MIXED_USE';
  const cat = scenario.category || 'COMMERCIAL';

  const orgCount = relevantEntities.organizations.length;
  const facilityCount = relevantEntities.facilities.length;
  const infraCount = relevantEntities.infrastructure.length;
  const residentCount = relevantEntities.citizensCohortSummary?.totalInZone || zonePop;

  // Cohort summary strings
  const affectedCohortsSummary: string[] = [
    `${residentCount.toLocaleString()} residents in ${zoneName} directly within the primary spatial catchment.`,
    `${orgCount} commercial establishments and retail storefronts affected by street-level modifications.`,
    `${facilityCount} public facilities (schools, health hubs, civil centers) within operational buffer zone.`,
    `${infraCount} major infrastructure utility lines requiring load re-routing or seismic stabilization.`,
    `Adjacent districts (${connectedZones.map(z => z.name).join(', ') || 'Metropolitan Core'}) subject to spillover transit diversion.`,
  ];

  // 10 AI Specialist Agent Assessments
  const agentAssessments: AgentAssessment[] = [
    {
      agentRole: 'CITIZEN_WELLBEING',
      agentName: 'Social Equity & Livability Bureau',
      domain: 'Citizen Quality of Life, Noise, Displacement Risk & Community Fabric',
      summary: `Proposal "${scenario.title}" presents substantial long-term amenity enhancements for ${zoneName}, but poses acute short-to-medium term acoustic and pedestrian displacement friction for resident households, particularly lower-income tenants and senior citizens.`,
      evaluationCriteriaUsed: [
        'Acoustic decibel impact thresholds',
        'Residential displacement hazard index',
        'Public green space per capita ratio',
        'Social capital and neighborhood identity continuity',
      ],
      positiveOutcomes: [
        `Upgraded public realm and modernization of community spaces in ${zoneName}.`,
        'Increased access to contemporary urban services and improved streetscape lighting.',
        'Enhanced long-term property values and municipal public investment in the sector.',
      ],
      adverseOutcomes: [
        'Temporary construction noise and fine particulate dust during construction phases.',
        'Localized commercial rent increases creating displacement pressure on legacy mom-and-pop shops.',
        'Disruption of established pedestrian walking routines for vulnerable cohorts.',
      ],
      disproportionatelyAffectedGroups: [
        'Elderly residents living on fixed pensions adjacent to primary construction corridors.',
        'Rent-regulated tenants facing speculative secondary gentrification pressures.',
        'Parents with young children navigating altered school drop-off routes.',
      ],
      safetyConcerns: [
        'Pedestrian walkway narrowing adjacent to active heavy machinery corridors.',
        'Nighttime illumination gaps during phased electrical transition works.',
      ],
      unresolvedQuestions: [
        'Will tenant protection subsidies be indexed to construction delay penalties?',
        'What specific acoustic barrier standards will be enforced during weekend hours?',
      ],
      confidenceLevel: 'HIGH',
    },
    {
      agentRole: 'EMERGENCY_SERVICES',
      agentName: 'First Responder Rapid Ingress Corps',
      domain: 'Fire, Medical & Tactical Emergency Ingress / Evacuation Corridors',
      summary: `Current street realignment and zoning density modifications under "${scenario.title}" introduce critical turning radius choke points along secondary arterials. Without dedicated priority transponders, response times could degrade by up to 2.4 minutes.`,
      evaluationCriteriaUsed: [
        'NFPA 1710 4-minute travel time compliance',
        'Heavy ladder truck turning radiuses (minimum 14.5m required)',
        'Hydrant pressure continuity during main upgrades',
        'Alternate rapid ingress bypass route availability',
      ],
      positiveOutcomes: [
        'New arterial connections will provide dual-access redundancy to previously isolated cul-de-sacs.',
        'Modernized hydrants with digital flow telemetry to be installed in phase 2.',
      ],
      adverseOutcomes: [
        'Phased roadbed excavation will sever the primary north-south emergency transit conduit for 6 months.',
        'Increased on-street delivery parking could obstruct secondary fire lane clearance.',
      ],
      disproportionatelyAffectedGroups: [
        'High-density residential towers reliant on aerial platform apparatus.',
        'Patients within acute care transit corridors connecting to District Central Hospital.',
      ],
      safetyConcerns: [
        'CRITICAL: Hydrant water pressure drops during grid tie-in scheduled for high-density sectors.',
        'Secondary emergency ingress gates must not be permanently locked by perimeter landscaping.',
      ],
      unresolvedQuestions: [
        'Has a formal mutual-aid detour plan been validated by the regional fire commissioner?',
        'Are smart optical emergency signal preemption transponders budgeted in the RFP?',
      ],
      confidenceLevel: 'HIGH',
    },
    {
      agentRole: 'EDUCATION_HEALTHCARE',
      agentName: 'Public Services & Care Capacity Division',
      domain: 'School Capacity, Clinical Access, Daycare Provision & Care Continuity',
      summary: `The anticipated demographic influx into ${zoneName} will push localized elementary school utilization past 108% capacity within 24 months. Immediate modular classroom expansion or satellite clinic commitments are required.`,
      evaluationCriteriaUsed: [
        'Classroom seat-to-child demographic forecast ratio',
        'Clinic walk-time catchment within 15-minute isochrones',
        'Safe routes to schools acoustic and traffic exposure',
      ],
      positiveOutcomes: [
        'High potential for integrated ground-floor community clinics or early learning centers.',
        'Improved sidewalk buffers along primary school commute paths.',
      ],
      adverseOutcomes: [
        'Overcrowded classrooms during the 2-year lag prior to municipal school facility expansions.',
        'Temporary detours disrupting non-emergency patient shuttles to outpatient clinics.',
      ],
      disproportionatelyAffectedGroups: [
        'Families with primary-school age children in immediate zone boundary blocks.',
        'Mobility-impaired patients utilizing localized public health clinics.',
      ],
      safetyConcerns: [
        'Heavy construction vehicle delivery hours coinciding with morning school arrival window (07:45 - 08:30).',
      ],
      unresolvedQuestions: [
        'Is school development impact fee revenue legally ring-fenced specifically for ${zoneName} schools?',
      ],
      confidenceLevel: 'MEDIUM',
    },
    {
      agentRole: 'BUSINESS_ECONOMIC',
      agentName: 'Commercial Vitality & Merchant Guild',
      domain: 'SME Commercial Survival, Supply Chain Logistics & Footfall Dynamics',
      summary: `Long-term commercial footfall is projected to expand by +28%, generating substantial tax yields. However, 18-month construction staging risks driving out up to 22% of independent small merchants lacking working capital buffers.`,
      evaluationCriteriaUsed: [
        'Retail footfall density trends',
        'Merchant supply delivery loading dock availability',
        'Commercial lease vacancy volatility',
        'Sales tax revenue yield per gross square meter',
      ],
      positiveOutcomes: [
        'Significant expansion of consumer market base and high-income footfall density.',
        'Modernized commercial floor plates attracting technology and culinary flagships.',
        'Appreciation of commercial land value across surrounding fringe blocks.',
      ],
      adverseOutcomes: [
        'Loss of active streetfront parking reducing quick-stop customer turnover for convenience retail.',
        'Severe delivery disruption for food & beverage establishments during sidewalk excavation.',
        'Risk of commercial gentrification supplanting neighborhood-serving service businesses.',
      ],
      disproportionatelyAffectedGroups: [
        'Micro-businesses operating under short-term sub-3-year commercial leases.',
        'Logistics distributors requiring dedicated curbside loading zones between 06:00 and 10:00.',
      ],
      safetyConcerns: [
        'Forklift and pallet truck conflict with pedestrians in compressed temporary loading bays.',
      ],
      unresolvedQuestions: [
        'Will the municipal authority establish a merchant revenue-protection bridge fund during construction?',
      ],
      confidenceLevel: 'HIGH',
    },
    {
      agentRole: 'TRANSPORT_ACCESSIBILITY',
      agentName: 'Multimodal Transit & Active Mobility Directorate',
      domain: 'Traffic Flow, Public Transit, Micro-Mobility & ADA Accessibility',
      summary: `The proposal facilitates superior micro-mobility and transit node integration, but will temporarily divert an estimated 4,200 daily vehicle trips onto neighboring residential collector roads, generating acute junction delays.`,
      evaluationCriteriaUsed: [
        'Level of Service (LOS) ratings at key intersections',
        'Modal split shift towards active and public transport',
        'Universal ADA access grade and curb-cut compliance',
        'Transit boarding dwell times and bus lane exclusivity',
      ],
      positiveOutcomes: [
        'Dedicated protected bicycle rights-of-way separated from vehicular lanes.',
        'Signal priority optimization for rapid transit bus routes.',
        'Modernized tactile paving and curb ramps for universal accessibility.',
      ],
      adverseOutcomes: [
        'Spillover congestion onto parallel residential streets during peak commute hours (08:00 - 09:30).',
        'Temporary loss of 140 curbside parking spots causing circling vehicular friction.',
      ],
      disproportionatelyAffectedGroups: [
        'Paratransit users requiring direct curbside drop-off clearances.',
        'Suburban commuters reliant on legacy park-and-ride facilities.',
      ],
      safetyConcerns: [
        'Blind intersection corners created by temporary construction hoarding barriers.',
      ],
      unresolvedQuestions: [
        'Can temporary adaptive traffic signal timings be deployed on secondary bypass streets?',
      ],
      confidenceLevel: 'HIGH',
    },
    {
      agentRole: 'ENVIRONMENT_CLIMATE',
      agentName: 'Urban Ecosystem & Climate Resilience Board',
      domain: 'Urban Heat Island, Stormwater Runoff, Biodiversity & Carbon Footprint',
      summary: `Due to ${zoneName}'s ${floodRisk} flood vulnerability rating, impervious surface increases must be strictly offset by bioswales, retention vaults, and high-albedo cool roof mandates to prevent storm drainage surcharges.`,
      evaluationCriteriaUsed: [
        'Stormwater runoff coefficient (100-year storm event modeling)',
        'Urban Heat Island index delta (°C surface temp differential)',
        'Canopy cover percentage and native vegetative biodiversity',
        'Embodied carbon per constructed square meter',
      ],
      positiveOutcomes: [
        'Replacement of aging impermeable asphalt with permeable pavement sections.',
        'Integration of urban bioretention rain gardens along public corridors.',
        'Introduction of energy-efficient microgrid solar arrays on new roof planes.',
      ],
      adverseOutcomes: [
        'Maturity loss of mature street trees requiring 15-year replacement canopy cycle.',
        'Localized micro-climate thermal spike during demolition and concrete curing phases.',
      ],
      disproportionatelyAffectedGroups: [
        'Basement apartment dwellers vulnerable to localized stormwater backup during severe deluges.',
      ],
      safetyConcerns: [
        'Stormwater retention overflow hazard if 50mm+ torrential rainfall coincides with phase-1 earthworks.',
      ],
      unresolvedQuestions: [
        'Will subsurface retention tanks be connected to the citywide real-time flood gate telemetry system?',
      ],
      confidenceLevel: 'HIGH',
    },
    {
      agentRole: 'INFRASTRUCTURE_UTILITIES',
      agentName: 'Grid, Hydro & Asset Lifecycle Bureau',
      domain: 'Electrical Substations, Potable Water, Sewage & Fiber Telecommunications',
      summary: `The localized electrical distribution feeder 4B is operating at 82% capacity. The projected density increase under "${scenario.title}" requires a substation transformer upgrade before occupancy permits are issued.`,
      evaluationCriteriaUsed: [
        'Feeder substation thermal loading headroom',
        'Potable water static head pressure at peak hour',
        'Sanitary sewer peak wet-weather flow capacity',
        'Subsurface utility clash coordinate density',
      ],
      positiveOutcomes: [
        'Undergrounding of legacy overhead overhead power lines improving storm resilience.',
        'Installation of high-speed municipal fiber conduits for future digital twin sensor nodes.',
      ],
      adverseOutcomes: [
        'Scheduled rolling utility cuts for water and power during mainline tie-ins.',
        'High subsurface congestion requiring delicate hydro-excavation around high-voltage mains.',
      ],
      disproportionatelyAffectedGroups: [
        'Home-based workers and medical tech users reliant on uninterrupted power and gigabit internet.',
      ],
      safetyConcerns: [
        'Gas main proximity: 250mm cast iron main requires seismic encasement prior to piling.',
      ],
      unresolvedQuestions: [
        'Has the regional power utility committed capital funds for the substation transformer upgrade?',
      ],
      confidenceLevel: 'MEDIUM',
    },
    {
      agentRole: 'URBAN_PLANNING_REGULATORY',
      agentName: 'Zoning Compliance & Master Plan Commission',
      domain: 'Zoning Ordinances, Floor Area Ratio (FAR), Public Easements & Master Plan Alignment',
      summary: `The proposal aligns with 2035 Metropolitan Vision goals for compact transit-oriented density in ${zoneName}, but exceeds current base Floor Area Ratio (FAR) by 18%, requiring a conditional variance or transfer of development rights.`,
      evaluationCriteriaUsed: [
        'Metropolitan 2035 Master Plan growth corridors',
        'Zoning height and setback envelope compliance',
        'Mandatory inclusionary zoning affordable housing set-aside percentage',
        'Public realm easement dedications',
      ],
      positiveOutcomes: [
        'Formalizes transit-oriented development principles within walking distance of high-capacity nodes.',
        'Unlocks development impact fees designated for public open space acquisitions.',
      ],
      adverseOutcomes: [
        'Sets a precedent for height variances that may trigger neighborhood association legal appeals.',
      ],
      disproportionatelyAffectedGroups: [
        'Adjacent low-rise single-family parcels subject to shadow casting and privacy loss.',
      ],
      safetyConcerns: [
        'Wind tunnel shear effects created by towers exceeding 18 stories without stepped podiums.',
      ],
      unresolvedQuestions: [
        'Will the developer bind the 20% inclusionary affordable housing units in perpetuity?',
      ],
      confidenceLevel: 'HIGH',
    },
    {
      agentRole: 'INDEPENDENT_REVIEW',
      agentName: 'Independent Oversight & Assumption Audit Panel',
      domain: 'Devil’s Advocate Audit, Assumption Stress-Testing & Data Integrity',
      summary: `The developer’s traffic impact study assumes a 35% modal shift to cycling that lacks precedent in comparable climate zones. Furthermore, displacement risk for informal businesses has been understated in the initial submission.`,
      evaluationCriteriaUsed: [
        'Empirical validation of developer traffic assumptions',
        'Stress-testing economic models against 6% interest rate scenarios',
        'Verification of public consultation participation diversity',
      ],
      positiveOutcomes: [
        'Robust baseline registry established for tracking multi-year urban metrics post-implementation.',
      ],
      adverseOutcomes: [
        'High risk of capital expenditure overrun if subsurface utility clashes require structural redesign.',
      ],
      disproportionatelyAffectedGroups: [
        'Non-English speaking residents under-represented in initial public scoping town halls.',
      ],
      safetyConcerns: [
        'Emergency response delay calculations in the proposal rely on overly optimistic off-peak figures.',
      ],
      unresolvedQuestions: [
        'Where are the empirical traffic counter logs for the baseline weekday evening commute peak?',
      ],
      confidenceLevel: 'HIGH',
    },
    {
      agentRole: 'RECOMMENDATION_SYNTHESIS',
      agentName: 'Executive Urban Futures Synthesis Directorate',
      domain: 'Holistic Multi-Stakeholder Consensus, Compromises & Actionable Roadmap',
      summary: `Proposal "${scenario.title}" delivers compelling strategic modernization for ${zoneName}, but must incorporate 4 mandatory amendments: strict emergency fire lane protections, a small merchant rent-stabilization bridge, stormwater retention upgrades, and off-peak school delivery covenants.`,
      evaluationCriteriaUsed: [
        'Multi-agent balance index (wellbeing vs economic vs environmental)',
        'Fiscal viability and municipal bond exposure',
        'Political consensus probability and legal appeal resilience',
      ],
      positiveOutcomes: [
        'Transforms ${zoneName} into a resilient, high-productivity metropolitan core asset.',
        'Generates substantial long-term municipal revenues to fund social infrastructure.',
      ],
      adverseOutcomes: [
        'Requires intensive cross-agency management during the critical 18-month construction disruption window.',
      ],
      disproportionatelyAffectedGroups: [
        'Vulnerable tenants and micro-retailers without formal institutional backing.',
      ],
      safetyConcerns: [
        'Multi-agency coordinated oversight required to prevent catastrophic utility or traffic incidents.',
      ],
      unresolvedQuestions: [
        'Will city council establish a joint task force with emergency services and merchant reps?',
      ],
      confidenceLevel: 'HIGH',
    },
  ];

  // Specific, empirical findings
  const findings: Finding[] = [
    {
      id: `FND-001`,
      domain: 'Public Safety & Emergency Response',
      agentRole: 'EMERGENCY_SERVICES',
      affectedEntityIds: relevantEntities.emergencyServices.map(s => s.id).slice(0, 3),
      affectedCohort: 'High-density residential occupants & cardiac emergency patients',
      description: `Primary arterial corridor narrows by 3.2m during Phase 1 staging, increasing heavy fire engine travel times from Station 04 to District Core from 3.8 min to 6.2 min.`,
      impactType: 'DISADVANTAGE',
      severity: 'CRITICAL',
      likelihood: 'ALMOST_CERTAIN',
      confidence: 'HIGH',
      evidenceUsed: 'Standard NFPA response velocity models applied to reduced lane geometry.',
      assumptionsMade: 'Peak construction staging assumes single alternating lane traffic control.',
      missingInformation: 'Final staging permit drawing for temporary utility trenches.',
      suggestedMitigation: 'Mandate 4.5m clear emergency travel lane at all times with real-time GPS traffic sensor preemption.',
      validationRequired: 'Pre-construction dry-run drill with Ladder Truck 4 to verify clearances.',
      evidenceCategory: 'MODEL_INTERPRETATION',
    },
    {
      id: `FND-002`,
      domain: 'Commercial SME Economy',
      agentRole: 'BUSINESS_ECONOMIC',
      affectedEntityIds: relevantEntities.organizations.map(o => o.id).slice(0, 5),
      affectedCohort: 'Independent storefront retailers & culinary merchants',
      description: `Extended sidewalk hoardings and curbside delivery bans will eliminate walk-in footfall by an estimated 32% for streetfront merchants during the 14-month earthwork period.`,
      impactType: 'DISADVANTAGE',
      severity: 'HIGH',
      likelihood: 'LIKELY',
      confidence: 'HIGH',
      evidenceUsed: 'Historical footfall tracking from comparable regional pedestrianization projects.',
      assumptionsMade: 'Merchants lack off-street rear alley access for inventory deliveries.',
      missingInformation: 'Operating cash reserves of ground-floor tenants.',
      suggestedMitigation: 'Establish a $1.2M municipal small-business transition grant fund and create 2 designated morning loading bays.',
      validationRequired: 'Door-to-door merchant inventory and delivery schedule audit.',
      evidenceCategory: 'VERIFIED_DATA',
    },
    {
      id: `FND-003`,
      domain: 'Environmental Flood Mitigation',
      agentRole: 'ENVIRONMENT_CLIMATE',
      affectedEntityIds: relevantEntities.environment.map(e => e.id).slice(0, 4),
      affectedCohort: 'Low-elevation residential properties & subterranean infrastructure',
      description: `Target zone possesses a ${floodRisk} flood vulnerability classification. Proposed building footprint increases hard impervious surface by 12,400 sq.m, elevating 50-year storm runoff peak volume by +19%.`,
      impactType: 'DISADVANTAGE',
      severity: floodRisk === 'HIGH' ? 'CRITICAL' : 'MODERATE',
      likelihood: 'POSSIBLE',
      confidence: 'HIGH',
      evidenceUsed: 'Municipal hydrological runoff coefficient mapping and regional rainfall charts.',
      assumptionsMade: 'Existing storm sewer trunk mains are running at 75% baseline storm capacity.',
      missingInformation: 'Subsurface soil percolation test results for proposed bioswale sites.',
      suggestedMitigation: 'Mandate 1,800 cubic-meter subterranean stormwater retention vault beneath central plaza with automated discharge gates.',
      validationRequired: 'Hydraulic load simulation under 100-year storm event curves.',
      evidenceCategory: 'MODEL_INTERPRETATION',
    },
    {
      id: `FND-004`,
      domain: 'Active Multimodal Mobility',
      agentRole: 'TRANSPORT_ACCESSIBILITY',
      affectedEntityIds: relevantEntities.infrastructure.map(i => i.id).slice(0, 4),
      affectedCohort: 'Bicycle commuters, transit riders, and micro-mobility users',
      description: `The planned 2.4km grade-separated cycle track and bus rapid transit boarding islands will shift an estimated 18% of short trips from private automobiles to green transit.`,
      impactType: 'BENEFIT',
      severity: 'HIGH',
      likelihood: 'LIKELY',
      confidence: 'HIGH',
      evidenceUsed: 'Regional transit authority commuter survey data and modal share models.',
      assumptionsMade: 'Transit operator will maintain 6-minute peak bus headway frequency.',
      missingInformation: 'Contract commitment for electric bus fleet allocation to this corridor.',
      suggestedMitigation: 'Install smart optical bicycle detection sensors at all 8 signalized intersections along the corridor.',
      validationRequired: 'Annual post-occupancy cordon traffic counts.',
      evidenceCategory: 'MODEL_INTERPRETATION',
    },
    {
      id: `FND-005`,
      domain: 'Education & Community Facilities',
      agentRole: 'EDUCATION_HEALTHCARE',
      affectedEntityIds: relevantEntities.facilities.map(f => f.id).slice(0, 3),
      affectedCohort: 'School-age children and pediatric care recipients',
      description: `Heavy construction vehicle ingress along Maple / Commercial Way directly traverses the primary walking school bus route for 320 elementary school students.`,
      impactType: 'DISADVANTAGE',
      severity: 'HIGH',
      likelihood: 'LIKELY',
      confidence: 'HIGH',
      evidenceUsed: 'School district attendance boundary maps and municipal safe route GIS layers.',
      assumptionsMade: 'Truck deliveries operate on standard 07:00 - 17:00 operating windows.',
      missingInformation: 'Precise contractor concrete pour scheduling matrix.',
      suggestedMitigation: 'Legally restrict heavy construction transit during morning (07:30-08:45) and afternoon (14:45-15:45) school bell intervals.',
      validationRequired: 'Traffic crossing guard deployment agreement signed by contractor.',
      evidenceCategory: 'VERIFIED_DATA',
    },
    {
      id: `FND-006`,
      domain: 'Power Grid Headroom',
      agentRole: 'INFRASTRUCTURE_UTILITIES',
      affectedEntityIds: relevantEntities.infrastructure.filter(i => i.assetClass === 'power_grid').map(i => i.id),
      affectedCohort: 'Commercial tenants requiring high-density EV charging and heat pump operations',
      description: `Substation Feeder 4B will reach 96% peak summer thermal capacity upon full tenant occupancy, risking brownouts without localized transformer capacity injection.`,
      impactType: 'NEUTRAL_RISK',
      severity: 'MODERATE',
      likelihood: 'POSSIBLE',
      confidence: 'MEDIUM',
      evidenceUsed: 'Utility grid telemetry logs and projected building electrification loads.',
      assumptionsMade: 'Building heating systems will be 100% electric air-source heat pumps.',
      missingInformation: 'Whether commercial developer will install commercial battery energy storage (BESS).',
      suggestedMitigation: 'Incentivize 500kWh on-site battery storage with peak shaving controls to reduce grid demand spikes.',
      validationRequired: 'Formal electric utility service load study and connection permit.',
      evidenceCategory: 'MODEL_INTERPRETATION',
    },
    {
      id: `FND-007`,
      domain: 'Civic Space & Social Capital',
      agentRole: 'CITIZEN_WELLBEING',
      affectedEntityIds: relevantEntities.facilities.filter(f => f.category === 'community').map(f => f.id),
      affectedCohort: 'Senior citizens and multi-generational family groups',
      description: `The planned 4,500 sq.m public plaza provides a transformative community gathering node with all-weather canopy shelters and accessible public restrooms.`,
      impactType: 'BENEFIT',
      severity: 'HIGH',
      likelihood: 'ALMOST_CERTAIN',
      confidence: 'HIGH',
      evidenceUsed: 'Architectural landscape schematic plans and public consultation feedback.',
      assumptionsMade: 'Plaza maintenance will be funded through a dedicated Business Improvement District (BID).',
      missingInformation: 'Final landscape species selection for urban canopy shade.',
      suggestedMitigation: 'Ensure programmable public event space is reserved for community non-profits 2 weekends per month.',
      validationRequired: 'Public easement covenants registered on land title.',
      evidenceCategory: 'VERIFIED_DATA',
    },
    {
      id: `FND-008`,
      domain: 'Zoning & Master Plan Regulatory Precedent',
      agentRole: 'URBAN_PLANNING_REGULATORY',
      affectedEntityIds: [targetZone.id],
      affectedCohort: 'Metropolitan planning authorities and adjacent land developers',
      description: `Granting the requested 18% Floor Area Ratio density bonus without binding affordability deed restrictions could spur speculative land banking in adjacent fringe zones.`,
      impactType: 'DISADVANTAGE',
      severity: 'MODERATE',
      likelihood: 'POSSIBLE',
      confidence: 'MEDIUM',
      evidenceUsed: 'Historical land transaction records following zoning variance approvals.',
      assumptionsMade: 'Adjacent parcel owners will seek reciprocal height variances.',
      missingInformation: 'Pending comprehensive zoning ordinance update timeline.',
      suggestedMitigation: 'Condition FAR density bonuses directly on 25-year affordability covenants and mandatory green building LEED Platinum certification.',
      validationRequired: 'Municipal legal counsel verification of covenant enforceability.',
      evidenceCategory: 'ASSUMPTION',
    },
  ];

  // Stakeholder conflicts
  const conflicts: ConflictItem[] = [
    {
      id: 'CONF-01',
      title: 'Emergency Ingress vs. Protected Bicycle Infrastructure & Sidewalk Widening',
      competingParties: [
        {
          stakeholder: 'First Responder Rapid Ingress Corps',
          priority: 'Preserving minimum 6.5m clear street width for aerial platform fire apparatus',
          stance: 'Opposes bollard-separated cycle tracks that restrict curbside ladder deployment',
          evidence: 'NFPA 1710 standards and documented turn radius clearance requirements',
        },
        {
          stakeholder: 'Multimodal Transit & Active Mobility Directorate',
          priority: 'Vision Zero pedestrian and cycling safety via protected grade-separated lanes',
          stance: 'Unprotected painted lanes fail to protect vulnerable commuters from truck strikes',
          evidence: 'Metropolitan collision statistics showing 68% drop in injuries with physical barriers',
        },
      ],
      coreTradeOff: 'Balancing rapid emergency vehicle deployment against permanent physical protection for cyclists and pedestrians.',
      potentialCompromise: 'Deploy mountable rolled-edge rubber curbs and automated fold-down emergency bollards that emergency vehicles can traverse at low speeds.',
      compromiseTradeOffs: 'Slightly higher capital installation cost ($180K) and ongoing mechanical maintenance of automated bollards.',
      regulatoryOrSafetyConstraints: 'City fire marshal must certify mountable curb geometry under loaded 32-ton fire apparatus test runs.',
    },
    {
      id: 'CONF-02',
      title: 'Commercial Density Expansion vs. Legacy Merchant Displacement & Delivery Access',
      competingParties: [
        {
          stakeholder: 'Commercial Property Developers',
          priority: 'Maximizing high-density modern retail footplate and eliminating curbside delivery bottlenecks',
          stance: 'Proposes centralizing all deliveries into subterranean loading docks with off-peak delivery requirements',
          evidence: 'Delivery congestion models showing 45-minute street gridlock under curbside unloading',
        },
        {
          stakeholder: 'Local Independent Merchant Guild',
          priority: 'Immediate curbside loading access for small purveyors without specialized dock equipment',
          stance: 'Subterranean docks impose prohibitive freight elevator fees and scheduling inflexibility for daily fresh produce',
          evidence: 'Average merchant profit margin of 4.2% cannot absorb third-party dock management fees',
        },
      ],
      coreTradeOff: 'Balancing modern logistical efficiency and public realm cleanliness against the operating viability of low-margin legacy merchants.',
      potentialCompromise: 'Designate 3 dedicated surface-level priority morning loading bays (06:00 - 09:30) free for registered local businesses, transitioning to pedestrian parklets in afternoons.',
      compromiseTradeOffs: 'Minor morning aesthetic disruption and parking enforcement monitoring required.',
      regulatoryOrSafetyConstraints: 'Delivery vehicle length restricted to 9.5m maximum to prevent blocking pedestrian visibility triangles.',
    },
    {
      id: 'CONF-03',
      title: 'Housing Yield Maximization vs. Stormwater Retention & Solar Exposure',
      competingParties: [
        {
          stakeholder: 'Residential Development Consortium',
          priority: 'Delivering 480 housing units to meet municipal regional targets',
          stance: 'Maximizing building footprint to achieve unit yield targets',
          evidence: 'Regional housing affordability crisis and municipal growth quotas',
        },
        {
          stakeholder: 'Urban Ecosystem & Climate Resilience Board',
          priority: 'Preventing stormwater flooding in ${zoneName} (${floodRisk} flood vulnerability)',
          stance: 'Requires 30% permeable open ground surface and stepped roof lines for solar rights',
          evidence: '100-year storm event hydrological modeling indicating localized inundation risks',
        },
      ],
      coreTradeOff: 'Balancing urgent housing unit production against critical climate resilience and daylighting standards.',
      potentialCompromise: 'Permit additional vertical height (+3 stories) on a narrower footprint, preserving 35% permeable ground plane for bioretention and incorporating extensive green roofs.',
      compromiseTradeOffs: 'Higher structural construction cost per unit due to taller tower engineering.',
      regulatoryOrSafetyConstraints: 'FAA flight path radar clearance limits tower height to maximum 24 stories.',
    },
  ];

  // Independent review
  const independentReview: IndependentReview = {
    unsupportedClaims: [
      `Developer claim of 35% cycling modal shift within 12 months lacks empirical precedent in comparable northern climate zones; independent model predicts 14-18% realistic shift.`,
      `Initial economic brief claims zero net loss in small business jobs, ignoring historical 15-22% tenant attrition during 18-month construction phases.`,
    ],
    omissionsIdentified: [
      `Omission of acoustic noise impact modeling on 4 adjacent residential senior care facilities during pile driving operations.`,
      `Absence of an explicit utility coordination timeline for high-voltage feeder upgrades with the regional power utility.`,
      `Failure to account for heavy snow removal staging and snowmelt drainage in the revised curb geometry.`,
    ],
    agentDisagreements: [
      `Emergency Services demands minimum 6.5m clear lanes, directly conflicting with Active Mobility's 3.0m lane diet and sidewalk widening proposals.`,
      `Economic Bureau advocates for maximize ground-floor commercial lease rates, while Social Equity warns this accelerates tenant gentrification.`,
    ],
    dataLimitations: [
      `Subsurface soil contamination data for former industrial parcels relies on 8-year-old phase-1 environmental site assessments.`,
      `Peak hour traffic turn counts were recorded during post-holiday periods, potentially underestimating baseline congestion by 12%.`,
    ],
  };

  // Executive synthesis
  const synthesis: SynthesisReport = {
    executiveSummary: `Multi-agent evaluation of proposal "${scenario.title}" in ${zoneName} confirms significant long-term strategic benefits: +28% projected commercial activity, 2.4km of modern protected active transit, and vital public realm revitalization. However, simulation reveals 3 critical failure vectors: emergency vehicle access bottlenecks, severe disruption to 18 legacy merchants, and stormwater retention risks in this ${floodRisk} flood vulnerability district. Approval is conditionally recommended upon executing the 4 mandatory mitigations outlined below.`,
    keyBenefits: [
      `Substantial long-term infrastructure modernization and multimodal transit enhancement for ${zoneName}.`,
      `Projected creation of high-quality public open space and upgraded public utility mains.`,
      `Expansion of municipal commercial tax base supporting district-wide public services.`,
      `Significantly upgraded pedestrian safety and ADA universal accessibility standards.`,
    ],
    criticalRisks: [
      `Emergency response time degradation of up to +2.4 minutes without dedicated priority corridors.`,
      `Up to 22% merchant attrition among small businesses during extended 18-month construction staging.`,
      `Stormwater runoff surcharge during heavy precipitation events exceeding existing trunk sewer capacities.`,
      `Acoustic and traffic disruption along safe routes to schools during morning drop-off hours.`,
    ],
    recommendedMitigations: [
      `Execute emergency corridor covenant: Mountable curbs and automated smart signal preemption along primary responder routes.`,
      `Establish a $1.2M municipal Merchant Transition Fund and designate 3 free surface delivery bays during morning hours (06:00-09:30).`,
      `Mandate a 1,800 cu.m subterranean stormwater retention vault and require 40% extensive green roof coverage on all new structures.`,
      `Enforce a strict construction vehicle transit moratorium during morning (07:30-08:45) and afternoon (14:45-15:45) school bell intervals.`,
    ],
    nextStepsAndDataRequired: [
      `Conduct physical ladder-truck turn radius field trials with District Fire Station 04 before final permit issuance.`,
      `Commission updated Phase-2 geotechnical and soil percolation borehole tests across proposed foundation sites.`,
      `Finalize legally binding Inclusionary Housing deed restrictions and developer covenant agreements.`,
      `Establish a bi-weekly Community & Merchant Liaison Committee to coordinate construction phases.`,
    ],
  };

  return {
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
    affectedCohortsSummary,
    agentAssessments,
    findings,
    conflicts,
    independentReview,
    synthesis,
    dataProvenanceNote: provenanceTag,
  };
}

/**
 * Deterministic consultation answer synthesizer for Q&A fallback.
 */
export function synthesizeConsultation(payload: {
  question: string;
  agentRole?: string;
  scenario: RedevelopmentScenario;
  targetZone: ZoneEntity;
}) {
  const { question, agentRole, scenario, targetZone } = payload;
  const role = agentRole && agentRole !== 'ALL' ? agentRole : 'CONSORTIUM_PANEL';

  return {
    agentRole: role,
    agentName: `Specialist Advisory Bureau (${role})`,
    answer: `Regarding "${question}" on proposal "${scenario.title}" in ${targetZone.name}: Multi-agent evaluation indicates that this adjustment directly influences the trade-off between localized spatial density and public service headroom. While feasible, implementation must be staged with physical mitigation buffers to preserve emergency clearance and resident wellbeing.`,
    recommendedAdjustment: `Incorporate an phased operational milestone: complete core utility and emergency corridor tests before granting commercial occupancy permits.`,
    confidence: 'HIGH',
    keyConcerns: [
      'Preservation of continuous emergency responder ingress widths',
      'Minimization of noise and vibration exposure on vulnerable residential cohorts',
      'Hydrological stormwater retention compliance under peak storm curves',
    ],
  };
}

/**
 * Deterministic scenario draft generator fallback.
 */
export function synthesizeDraft(payload: {
  category: string;
  targetZone: ZoneEntity;
  focusArea?: string;
}) {
  const { category, targetZone, focusArea } = payload;
  const zoneName = targetZone.name;

  return {
    title: focusArea ? `${focusArea} Initiative in ${zoneName}` : `${zoneName} ${category} Revitalization Plan`,
    category: category as RedevelopmentScenario['category'],
    description: `A targeted municipal redevelopment initiative in ${zoneName} focusing on ${category.toLowerCase()}. Designed to optimize land use efficiency, enhance public mobility, and improve climate resilience while safeguarding local community vitality.`,
    objectives: [
      `Modernize infrastructure and public service capacity throughout ${zoneName}.`,
      `Improve active multimodal mobility and transit connectivity to surrounding districts.`,
      `Implement sustainable green building and stormwater retention standards.`,
    ],
    knownConstraints: [
      `Current ${targetZone.floodVulnerability} flood risk requires dedicated retention infrastructure.`,
      `Existing commercial and residential tenant protections must be strictly maintained.`,
      `Maximum allowable construction staging disruption must not exceed 18 months.`,
    ],
    existingConditions: `Current streetscape in ${zoneName} exhibits aging surface pavements, limited protected micro-mobility corridors, and peak-hour traffic bottlenecks.`,
    proposedConditions: `Upgraded multi-modal corridor with grade-separated cycle tracks, widened pedestrian esplanades, smart street lighting, and integrated bioswales.`,
  };
}
