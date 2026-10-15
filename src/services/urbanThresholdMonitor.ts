import { CityEntity, FacilityEntity, InfrastructureEntity, EnvironmentEntity, ZoneEntity, CitizenEntity } from '../types/city.ts';
import { RetroNotification, UrbanThresholdStatus, UrbanThresholdType } from '../types/notification.ts';

export class UrbanThresholdMonitor {
  // Evaluates live city entities and returns status of all city indicators
  public static evaluateAllStatuses(entities: CityEntity[]): UrbanThresholdStatus[] {
    const facilities = entities.filter(e => e.type === 'FACILITY') as FacilityEntity[];
    const infrastructure = entities.filter(e => e.type === 'INFRASTRUCTURE') as InfrastructureEntity[];
    const environment = entities.filter(e => e.type === 'ENVIRONMENT') as EnvironmentEntity[];
    const citizens = entities.filter(e => e.type === 'CITIZEN') as CitizenEntity[];
    const zones = entities.filter(e => e.type === 'ZONE') as ZoneEntity[];

    // 1. Hospital / Healthcare Facility Utilization
    const healthcareFacs = facilities.filter(f => f.category === 'healthcare');
    const maxHospital = healthcareFacs.reduce<FacilityEntity | null>(
      (max, curr) => (!max || curr.currentUtilizationPct > max.currentUtilizationPct ? curr : max),
      null
    );
    const hospitalUtil = maxHospital ? maxHospital.currentUtilizationPct : 75;
    const hospitalStatus: 'OPTIMAL' | 'WARNING' | 'CRITICAL' =
      hospitalUtil >= 92 ? 'CRITICAL' : hospitalUtil >= 85 ? 'WARNING' : 'OPTIMAL';

    // 2. Power Grid Strain
    const powerGrid = infrastructure.filter(i => i.assetClass === 'power_grid');
    const criticalPower = powerGrid.find(p => p.conditionRating <= 2);
    const powerHealth = criticalPower ? criticalPower.conditionRating * 20 : 85;
    const powerStatus: 'OPTIMAL' | 'WARNING' | 'CRITICAL' =
      criticalPower && criticalPower.failureSensitivity === 'CRITICAL'
        ? 'CRITICAL'
        : criticalPower
        ? 'WARNING'
        : 'OPTIMAL';

    // 3. Infrastructure Structural Health
    const worstInfra = infrastructure.reduce<InfrastructureEntity | null>(
      (min, curr) => (!min || curr.conditionRating < min.conditionRating ? curr : min),
      null
    );
    const worstCondition = worstInfra ? worstInfra.conditionRating : 3;
    const infraStatus: 'OPTIMAL' | 'WARNING' | 'CRITICAL' =
      worstCondition <= 2 && worstInfra?.failureSensitivity === 'CRITICAL'
        ? 'CRITICAL'
        : worstCondition <= 2
        ? 'WARNING'
        : 'OPTIMAL';

    // 4. Flood & Stormwater Runoff Hazard
    const highRiskEnv = environment.filter(e => e.runoffRiskLevel === 'HIGH');
    const minPermeability = highRiskEnv.reduce(
      (min, curr) => Math.min(min, curr.permeabilityPct),
      100
    );
    const floodStatus: 'OPTIMAL' | 'WARNING' | 'CRITICAL' =
      minPermeability <= 20 ? 'CRITICAL' : minPermeability <= 35 ? 'WARNING' : 'OPTIMAL';

    // 5. Transit Network Saturation
    const transitInfra = infrastructure.filter(i => i.assetClass === 'road_network' || i.assetClass === 'rail_transit');
    const degradedTransit = transitInfra.find(t => t.conditionRating <= 2);
    const transitStatus: 'OPTIMAL' | 'WARNING' | 'CRITICAL' =
      degradedTransit ? 'CRITICAL' : 'OPTIMAL';

    // 6. Renter Displacement & Rent Stress
    const renters = citizens.filter(c => c.housingTenure === 'renter');
    const vulnerableRenters = renters.filter(
      c => c.economicStatus === 'low_income' && c.sensitivityFactors.some(s => s.toLowerCase().includes('rent'))
    );
    const renterStressPct = renters.length > 0 ? Math.round((vulnerableRenters.length / renters.length) * 100) : 40;
    const rentStatus: 'OPTIMAL' | 'WARNING' | 'CRITICAL' =
      renterStressPct >= 65 ? 'CRITICAL' : renterStressPct >= 45 ? 'WARNING' : 'OPTIMAL';

    // 7. Zone Density & Overcrowding
    const maxDensityZone = zones.reduce<ZoneEntity | null>(
      (max, curr) => (!max || curr.densityPerSqKm > max.densityPerSqKm ? curr : max),
      null
    );
    const maxDensity = maxDensityZone ? maxDensityZone.densityPerSqKm : 9500;
    const densityStatus: 'OPTIMAL' | 'WARNING' | 'CRITICAL' =
      maxDensity >= 13500 ? 'CRITICAL' : maxDensity >= 11000 ? 'WARNING' : 'OPTIMAL';

    return [
      {
        id: 'HOSPITAL_OVERCAPACITY',
        title: 'HEALTHCARE ADMISSIONS THRESHOLD',
        currentValue: hospitalUtil,
        limitValue: 90,
        unit: '%',
        status: hospitalStatus,
        affectedEntityName: maxHospital?.name || 'Central Hospital Hub',
        affectedEntityId: maxHospital?.id,
        description: `Peak medical facility utilization is at ${hospitalUtil}%. Breaching 90% triggers emergency ambulance diversions.`,
      },
      {
        id: 'INFRASTRUCTURE_FAILURE_RISK',
        title: 'CRITICAL ASSET STRUCTURAL RATING',
        currentValue: worstCondition,
        limitValue: 2,
        unit: '/ 5 Stars',
        status: infraStatus,
        affectedEntityName: worstInfra?.name || 'Primary Utility Corridors',
        affectedEntityId: worstInfra?.id,
        description: worstInfra
          ? `Asset rating degraded to ${worstCondition}/5 with ${worstInfra.failureSensitivity} sensitivity.`
          : 'All structural assets within nominal operating range.',
      },
      {
        id: 'FLOOD_RUNOFF_HAZARD',
        title: 'WATERSHED RUNOFF & RETENTION',
        currentValue: minPermeability,
        limitValue: 25,
        unit: '% Soil Perm.',
        status: floodStatus,
        affectedEntityName: highRiskEnv[0]?.name || 'Basin Drainage Corridor',
        affectedEntityId: highRiskEnv[0]?.id,
        description: `Impervious ground cover detected. Retention capacity at ${minPermeability}% increases flash flooding vulnerability.`,
      },
      {
        id: 'TRANSIT_GRIDLOCK',
        title: 'TRANSIT & MOBILITY BOTTLENECK',
        currentValue: degradedTransit ? 88 : 42,
        limitValue: 75,
        unit: '% Saturation',
        status: transitStatus,
        affectedEntityName: degradedTransit?.name || 'Regional Metro Spine',
        affectedEntityId: degradedTransit?.id,
        description: degradedTransit
          ? `Infrastructure asset '${degradedTransit.name}' degraded to Rating ${degradedTransit.conditionRating}.`
          : 'Surface and rail transit flowing within nominal parameters.',
      },
      {
        id: 'POWER_GRID_STRAIN',
        title: 'ELECTRICAL SUBSTATION LOAD',
        currentValue: 100 - powerHealth,
        limitValue: 80,
        unit: '% Grid Load',
        status: powerStatus,
        affectedEntityName: criticalPower?.name || 'District Substation Network',
        affectedEntityId: criticalPower?.id,
        description: criticalPower
          ? `Transformer asset under strain: Rating ${criticalPower.conditionRating}/5.`
          : 'High voltage distribution within thermal safety margins.',
      },
      {
        id: 'HOUSING_DISPLACEMENT_STRESS',
        title: 'TENANT RENT SENSITIVITY INDEX',
        currentValue: renterStressPct,
        limitValue: 50,
        unit: '% Low-Income',
        status: rentStatus,
        affectedEntityName: 'Low-Income Renter Cohort',
        description: `${renterStressPct}% of tracked tenants report severe displacement sensitivity to redevelopment rent hikes.`,
      },
      {
        id: 'EMERGENCY_ACCESS_DEFICIT',
        title: 'PEAK METRO DENSITY CAPACITY',
        currentValue: maxDensity,
        limitValue: 12000,
        unit: 'per km²',
        status: densityStatus,
        affectedEntityName: maxDensityZone?.name || 'Downtown High-Density Core',
        affectedEntityId: maxDensityZone?.id,
        description: maxDensityZone
          ? `District density reaches ${maxDensity.toLocaleString()} citizens/km². Emergency evacuation clearance slows.`
          : 'District densities within standard civic planning parameters.',
      },
    ];
  }

  // Scans for critical/warning thresholds and produces notification objects
  public static scanForBreaches(
    entities: CityEntity[],
    acknowledgedCodes: Set<string>
  ): RetroNotification[] {
    const statuses = this.evaluateAllStatuses(entities);
    const notifications: RetroNotification[] = [];

    statuses.forEach(status => {
      if (status.status === 'CRITICAL' || status.status === 'WARNING') {
        const code = `THR-${status.id}-${status.currentValue}`;
        if (!acknowledgedCodes.has(code)) {
          notifications.push({
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            timestamp: new Date().toISOString(),
            severity: status.status,
            category: 'THRESHOLD',
            code,
            title: status.status === 'CRITICAL' ? `CRITICAL THRESHOLD BREACH` : `URBAN THRESHOLD WARNING`,
            message: `${status.title}: Exceeded safe threshold (${status.currentValue}${status.unit} vs limit ${status.limitValue}${status.unit})`,
            details: status.description,
            metricLabel: status.title,
            metricValue: `${status.currentValue}${status.unit}`,
            thresholdLimit: `${status.limitValue}${status.unit}`,
            entityId: status.affectedEntityId,
            action: status.affectedEntityId
              ? {
                  label: 'INSPECT ASSET',
                  entityId: status.affectedEntityId,
                  viewTarget: 'overview',
                }
              : undefined,
            durationMs: status.status === 'CRITICAL' ? 10000 : 7000,
          });
        }
      }
    });

    return notifications;
  }

  // Generates real-time synthetic simulation events / incidents for on-demand stress testing
  public static createSimulatedIncident(
    type: 'FLASH_FLOOD' | 'POWER_BROWNOUT' | 'HOSPITAL_SURGE' | 'TRANSIT_GRIDLOCK' | 'RENT_HIKE_PROTEST'
  ): RetroNotification {
    const timestamp = new Date().toISOString();
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    switch (type) {
      case 'FLASH_FLOOD':
        return {
          id,
          timestamp,
          severity: 'CRITICAL',
          category: 'THRESHOLD',
          code: 'INC-STORM-101',
          title: 'WATERSHED RUNOFF BREACH: 100-YR STORM',
          message: 'River Corridor stormwater gauge surged to 118% drainage capacity.',
          details: 'Heavy precipitation has overwhelmed impermeable pavement in District Waterfront. Soil runoff risk is CRITICAL.',
          metricLabel: 'DRAINAGE SURCHARGE',
          metricValue: '118%',
          thresholdLimit: '85%',
          action: {
            label: 'VIEW ZONING MAP',
            viewTarget: 'overview',
          },
          durationMs: 12000,
        };

      case 'POWER_BROWNOUT':
        return {
          id,
          timestamp,
          severity: 'CRITICAL',
          category: 'THRESHOLD',
          code: 'INC-GRID-502',
          title: 'SUBSTATION TRANSFORMER OVERLOAD',
          message: 'Thermal overload alarm at Industrial Substation Beta.',
          details: 'Cooling fluid temperature exceeded 92°C. Voltage instability reported across connected manufacturing and civic feeds.',
          metricLabel: 'SUBSTATION LOAD',
          metricValue: '96.4%',
          thresholdLimit: '85.0%',
          action: {
            label: 'INSPECT GRID',
            viewTarget: 'facilities',
          },
          durationMs: 10000,
        };

      case 'HOSPITAL_SURGE':
        return {
          id,
          timestamp,
          severity: 'CRITICAL',
          category: 'THRESHOLD',
          code: 'INC-MED-911',
          title: 'EMERGENCY INTAKE CAPACITY BREACH',
          message: 'General Hospital ER utilization reached 96% capacity.',
          details: 'Bed occupancy threshold exceeded. Emergency response protocol dictates rerouting ambulances to regional clinics.',
          metricLabel: 'ER OCCUPANCY',
          metricValue: '96.2%',
          thresholdLimit: '90.0%',
          action: {
            label: 'INSPECT FACILITY',
            viewTarget: 'facilities',
          },
          durationMs: 10000,
        };

      case 'TRANSIT_GRIDLOCK':
        return {
          id,
          timestamp,
          severity: 'WARNING',
          category: 'SIMULATION_EVENT',
          code: 'INC-MOB-304',
          title: 'ARTERIAL FLYOVER CHOKEPOINT DETECTED',
          message: 'East-West Expressway corridor average speed dropped below 8 km/h.',
          details: 'Severe congestion is throttling emergency vehicle ingress corridors and bus transit schedules by +28 minutes.',
          metricLabel: 'CORRIDOR DELAY',
          metricValue: '+28 MIN',
          thresholdLimit: '+10 MIN',
          action: {
            label: 'AUDIT IMPACT',
            viewTarget: 'impact',
          },
          durationMs: 8000,
        };

      case 'RENT_HIKE_PROTEST':
        return {
          id,
          timestamp,
          severity: 'WARNING',
          category: 'SIMULATION_EVENT',
          code: 'INC-TEN-201',
          title: 'TENANT DISPLACEMENT STRESS WARNING',
          message: '72% of surveyed residential tenants flag unmitigated eviction risk.',
          details: 'Proposed rezoning lacks inclusionary housing protections. Citizen Wellbeing Agent flags disproportionate economic hardship.',
          metricLabel: 'DISPLACEMENT RISK',
          metricValue: '72.4%',
          thresholdLimit: '45.0%',
          action: {
            label: 'VIEW FINDINGS',
            viewTarget: 'impact',
          },
          durationMs: 8000,
        };
    }
  }
}
