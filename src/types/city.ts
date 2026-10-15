export type EntityType =
  | 'CITIZEN'
  | 'HOUSEHOLD'
  | 'ORGANIZATION'
  | 'FACILITY'
  | 'INFRASTRUCTURE'
  | 'ENVIRONMENT'
  | 'GOVERNMENT'
  | 'EMERGENCY_SERVICE'
  | 'COMMUNITY'
  | 'ZONE';

export type ProvenanceType = 'SYNTHETIC' | 'USER_PROVIDED' | 'EXTERNAL_VERIFIED';

export type LifeStage =
  | 'schoolchild'
  | 'teenager'
  | 'student'
  | 'young_adult'
  | 'working_adult'
  | 'parent'
  | 'middle_aged'
  | 'senior';

export type EconomicBand =
  | 'low_income'
  | 'lower_middle'
  | 'middle_income'
  | 'higher_income';

export type HousingTenure =
  | 'owner'
  | 'renter'
  | 'informal'
  | 'hostel'
  | 'pension_dependent';

export type TransportMode =
  | 'private_vehicle'
  | 'motorcycle'
  | 'bus'
  | 'rail_metro'
  | 'bicycle'
  | 'pedestrian'
  | 'accessible_transit'
  | 'delivery';

export type AccessibilityRequirement =
  | 'none'
  | 'wheelchair'
  | 'limited_mobility'
  | 'visual_impairment'
  | 'hearing_impairment'
  | 'healthcare_dependent';

export interface BaseEntity {
  id: string; // e.g. CIT-000001, ORG-000001, etc.
  type: EntityType;
  subType: string;
  name: string;
  zoneId: string; // e.g. ZONE-000001
  coordinates: { x: number; y: number }; // 0..1000 schematic coordinates
  provenance: ProvenanceType;
  lastUpdated: string;
  priorities: string[];
  constraints: string[];
  dependencies: string[]; // IDs of entities it depends on
  connectedEntityIds: string[]; // Related entity IDs
  evaluationCriteria: string[];
}

export interface CitizenEntity extends BaseEntity {
  type: 'CITIZEN';
  age: number;
  lifeStage: LifeStage;
  economicStatus: EconomicBand;
  housingTenure: HousingTenure;
  occupation: string;
  householdId: string;
  workplaceOrSchoolId?: string;
  primaryTransportMode: TransportMode;
  secondaryTransportMode?: TransportMode;
  accessibilityRequirement: AccessibilityRequirement;
  dailyRoutine: string;
  sensitivityFactors: string[]; // e.g. 'Rent hike', 'Construction noise', 'Bus route detour'
}

export interface HouseholdEntity extends BaseEntity {
  type: 'HOUSEHOLD';
  size: number;
  dependentsCount: number;
  incomeBand: EconomicBand;
  housingTenure: HousingTenure;
  vehicleCount: number;
  memberIds: string[];
}

export interface OrganizationEntity extends BaseEntity {
  type: 'ORGANIZATION';
  sector:
    | 'retail'
    | 'food_beverage'
    | 'logistics'
    | 'property_development'
    | 'construction'
    | 'technology'
    | 'manufacturing'
    | 'healthcare'
    | 'utility'
    | 'financial'
    | 'hospitality';
  employeeCount: number;
  dailyFootfall: number;
  loadingBayNeeded: boolean;
  parkingDependency: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  deliveryFrequency: 'MULTIPLE_DAILY' | 'DAILY' | 'WEEKLY' | 'RARE';
  commercialFloorAreaSqM: number;
}

export interface FacilityEntity extends BaseEntity {
  type: 'FACILITY';
  category: 'education' | 'healthcare' | 'transport' | 'utilities' | 'community';
  facilityType: string; // Primary School, General Hospital, Bus Terminal, etc.
  capacity: number;
  currentUtilizationPct: number;
  operatingHours: string;
  emergencyAccessPriority: 'CRITICAL' | 'HIGH' | 'STANDARD';
}

export interface InfrastructureEntity extends BaseEntity {
  type: 'INFRASTRUCTURE';
  assetClass:
    | 'road_network'
    | 'bridge'
    | 'rail_transit'
    | 'water_supply'
    | 'power_grid'
    | 'drainage_sewage'
    | 'telecom'
    | 'waste_processing'
    | 'flood_protection';
  conditionRating: number; // 1-5 scale
  capacityLimit: string;
  failureSensitivity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
}

export interface EnvironmentEntity extends BaseEntity {
  type: 'ENVIRONMENT';
  environmentalType:
    | 'river_corridor'
    | 'urban_canopy'
    | 'wetland'
    | 'floodplain'
    | 'heat_island'
    | 'air_quality_sensor'
    | 'acoustic_station';
  permeabilityPct: number;
  runoffRiskLevel: 'HIGH' | 'MODERATE' | 'LOW';
  ecologicalSensitivity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface GovernmentEntity extends BaseEntity {
  type: 'GOVERNMENT';
  jurisdiction: string;
  regulatoryScope: string[];
}

export interface EmergencyServiceEntity extends BaseEntity {
  type: 'EMERGENCY_SERVICE';
  serviceType: 'fire' | 'ambulance' | 'police' | 'disaster_response';
  responseRadiusKm: number;
  vehicleFleetSize: number;
  criticalResponseCorridors: string[]; // infrastructure IDs
}

export interface CommunityEntity extends BaseEntity {
  type: 'COMMUNITY';
  focusArea: string;
  representedCitizenCount: number;
}

export interface ZoneEntity extends BaseEntity {
  type: 'ZONE';
  code: string;
  landUseClassification: 'COMMERCIAL' | 'RESIDENTIAL' | 'MIXED_USE' | 'INDUSTRIAL' | 'ECOLOGICAL' | 'CIVIC';
  totalPopulation: number;
  densityPerSqKm: number;
  floodVulnerability: 'HIGH' | 'MODERATE' | 'LOW';
  greenCoveragePct: number;
  bounds: { x: number; y: number; width: number; height: number };
}

export type CityEntity =
  | CitizenEntity
  | HouseholdEntity
  | OrganizationEntity
  | FacilityEntity
  | InfrastructureEntity
  | EnvironmentEntity
  | GovernmentEntity
  | EmergencyServiceEntity
  | CommunityEntity
  | ZoneEntity;

// Scenario Model
export interface RedevelopmentScenario {
  id: string; // SCN-000001
  title: string;
  zoneId: string;
  category:
    | 'Road widening'
    | 'Flyover or bridge construction'
    | 'New commercial district'
    | 'Residential redevelopment'
    | 'High-rise development'
    | 'Public housing'
    | 'Industrial development'
    | 'School or hospital construction'
    | 'Public transport expansion'
    | 'Pedestrianisation of a street'
    | 'Parking restrictions'
    | 'Creation of parks or public spaces'
    | 'Urban renewal'
    | 'Waterfront development'
    | 'Drainage improvements'
    | 'Redevelopment of an existing market'
    | 'Mixed-use development'
    | 'Custom proposals';
  description: string;
  objectives: string[];
  knownConstraints: string[];
  existingConditions?: string;
  proposedConditions?: string;
  affectedAreaSqKm?: number;
  supportingNotes?: string;
  createdAt: string;
  isIllustrativeDemo?: boolean;
}

// Agent Specialist Roles
export type AgentRole =
  | 'CITIZEN_WELLBEING'
  | 'EMERGENCY_SERVICES'
  | 'EDUCATION_HEALTHCARE'
  | 'BUSINESS_ECONOMIC'
  | 'TRANSPORT_ACCESSIBILITY'
  | 'ENVIRONMENT_CLIMATE'
  | 'INFRASTRUCTURE_UTILITIES'
  | 'URBAN_PLANNING_REGULATORY'
  | 'INDEPENDENT_REVIEW'
  | 'RECOMMENDATION_SYNTHESIS';

export type EvidenceCategory =
  | 'VERIFIED_DATA'
  | 'MODEL_INTERPRETATION'
  | 'ASSUMPTION'
  | 'UNRESOLVED_QUESTION';

export interface Finding {
  id: string; // FND-0001
  domain: string;
  agentRole: AgentRole;
  affectedEntityIds: string[];
  affectedCohort: string;
  description: string;
  impactType: 'BENEFIT' | 'DISADVANTAGE' | 'NEUTRAL_RISK';
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  likelihood: 'ALMOST_CERTAIN' | 'LIKELY' | 'POSSIBLE' | 'UNLIKELY';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  evidenceUsed: string;
  assumptionsMade: string;
  missingInformation: string;
  suggestedMitigation: string;
  validationRequired: string;
  evidenceCategory: EvidenceCategory;
}

export interface AgentAssessment {
  agentRole: AgentRole;
  agentName: string;
  domain: string;
  summary: string;
  evaluationCriteriaUsed: string[];
  positiveOutcomes: string[];
  adverseOutcomes: string[];
  disproportionatelyAffectedGroups: string[];
  safetyConcerns: string[];
  unresolvedQuestions: string[];
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface CompetingParty {
  stakeholder: string;
  priority: string;
  stance: string;
  evidence: string;
}

export interface ConflictItem {
  id: string;
  title: string;
  competingParties: CompetingParty[];
  coreTradeOff: string;
  potentialCompromise: string;
  compromiseTradeOffs: string;
  regulatoryOrSafetyConstraints: string;
}

export interface IndependentReview {
  unsupportedClaims: string[];
  omissionsIdentified: string[];
  agentDisagreements: string[];
  dataLimitations: string[];
}

export interface SynthesisReport {
  executiveSummary: string;
  keyBenefits: string[];
  criticalRisks: string[];
  recommendedMitigations: string[];
  nextStepsAndDataRequired: string[];
}

export interface SimulationReport {
  id: string; // REP-000001
  scenarioId: string;
  scenarioTitle: string;
  targetZoneId: string;
  targetZoneName: string;
  timestamp: string;
  totalAffectedEntitiesCount: number;
  affectedCohortsSummary: string[];
  agentAssessments: AgentAssessment[];
  findings: Finding[];
  conflicts: ConflictItem[];
  independentReview: IndependentReview;
  synthesis: SynthesisReport;
  dataProvenanceNote: string;
}
