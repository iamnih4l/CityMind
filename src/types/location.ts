export type FocalLocationType =
  | 'ZONE'
  | 'FACILITY'
  | 'INFRASTRUCTURE'
  | 'ENVIRONMENT'
  | 'EMERGENCY'
  | 'COORDINATE_PIN';

export interface LocationTelemetryStats {
  populationNearby: number;
  density: number;
  floodRisk: 'LOW' | 'MODERATE' | 'HIGH';
  greenCoveragePct: number;
  criticalFacilitiesNearby: number;
  emergencyEtaMinutes: number;
  noiseDecibels?: number;
}

export interface MapFocalPoint {
  id: string;
  name: string;
  code?: string;
  type: FocalLocationType;
  subType?: string;
  categoryLabel: string;
  coordinates: { x: number; y: number }; // 0..1000 coordinate plane
  elevationMeters?: number;
  zoneId?: string;
  zoneName?: string;
  description: string;
  radiusKm: number; // 0.25, 0.5, 1.0, 2.5, 5.0
  entityId?: string;
  stats: LocationTelemetryStats;
  themeColor?: string; // hex or tailwind token
}
