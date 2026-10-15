export type NotificationSeverity = 'CRITICAL' | 'WARNING' | 'EVENT' | 'INFO';

export type NotificationCategory = 'THRESHOLD' | 'SIMULATION_EVENT' | 'SYSTEM';

export type UrbanThresholdType =
  | 'HOSPITAL_OVERCAPACITY'
  | 'INFRASTRUCTURE_FAILURE_RISK'
  | 'FLOOD_RUNOFF_HAZARD'
  | 'TRANSIT_GRIDLOCK'
  | 'HOUSING_DISPLACEMENT_STRESS'
  | 'EMERGENCY_ACCESS_DEFICIT'
  | 'POWER_GRID_STRAIN';

export type SimulationEventType =
  | 'SIMULATION_STARTED'
  | 'SIMULATION_COMPLETED'
  | 'CRITICAL_RISK_DETECTED'
  | 'STAKEHOLDER_CLASH_DETECTED'
  | 'AI_SPECIALIST_CONSULTED'
  | 'AI_DRAFT_GENERATED'
  | 'AUTOSAVE_COMPLETED'
  | 'INCIDENT_TRIGGERED';

export interface NotificationAction {
  label: string; // e.g. "INSPECT ENTITY", "VIEW AUDIT REPORT"
  viewTarget?: string; // e.g. 'overview', 'scenarios', 'impact', 'consult', 'facilities'
  entityId?: string;
  onClick?: () => void;
}

export interface RetroNotification {
  id: string;
  timestamp: string; // ISO string
  severity: NotificationSeverity;
  category: NotificationCategory;
  code: string; // e.g. "THR-HOSP-94", "EVT-SIM-START"
  title: string;
  message: string;
  details?: string;
  metricLabel?: string;
  metricValue?: string | number;
  thresholdLimit?: string | number;
  entityId?: string;
  scenarioId?: string;
  reportId?: string;
  action?: NotificationAction;
  durationMs?: number; // 0 = persistent, default 8000
  read?: boolean;
}

export interface UrbanThresholdStatus {
  id: UrbanThresholdType;
  title: string;
  currentValue: number;
  limitValue: number;
  unit: string;
  status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
  affectedEntityName?: string;
  affectedEntityId?: string;
  description: string;
  lastBreachedAt?: string;
}
