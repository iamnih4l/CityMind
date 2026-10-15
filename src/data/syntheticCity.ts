import {
  CityEntity,
  CitizenEntity,
  HouseholdEntity,
  OrganizationEntity,
  FacilityEntity,
  InfrastructureEntity,
  EnvironmentEntity,
  GovernmentEntity,
  EmergencyServiceEntity,
  CommunityEntity,
  ZoneEntity,
  RedevelopmentScenario,
  LifeStage,
  EconomicBand,
  HousingTenure,
  TransportMode,
  AccessibilityRequirement,
} from '../types/city.ts';

// Deterministic Pseudo-Random Generator (Linear Congruential Generator)
class PRNG {
  private seed: number;

  constructor(seed: number = 42879) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  sample<T>(arr: T[], count: number): T[] {
    const shuffled = [...arr].sort(() => this.next() - 0.5);
    return shuffled.slice(0, Math.min(count, arr.length));
  }
}

export function generateSyntheticDemoCity(seed: number = 42879): {
  entities: CityEntity[];
  presetScenarios: RedevelopmentScenario[];
} {
  const rng = new PRNG(seed);
  const entities: CityEntity[] = [];

  // 1. ZONES (12 Planning Zones)
  const zoneDefs: Array<{
    code: string;
    name: string;
    landUse: ZoneEntity['landUseClassification'];
    pop: number;
    density: number;
    flood: ZoneEntity['floodVulnerability'];
    greenPct: number;
    bounds: { x: number; y: number; width: number; height: number };
    desc: string;
  }> = [
    {
      code: 'Z-01',
      name: 'Old Town & Historic Market Quarter',
      landUse: 'MIXED_USE',
      pop: 34200,
      density: 12500,
      flood: 'LOW',
      greenPct: 14,
      bounds: { x: 380, y: 360, width: 240, height: 180 },
      desc: 'Historic dense street grid, vibrant traditional market square, high pedestrian footfall, narrow historic rights of way.',
    },
    {
      code: 'Z-02',
      name: 'Riverfront Quay & Waterways',
      landUse: 'COMMERCIAL',
      pop: 18400,
      density: 8900,
      flood: 'HIGH',
      greenPct: 28,
      bounds: { x: 120, y: 320, width: 240, height: 260 },
      desc: 'Riverfront promenade, tourist wharves, wetland margins, historical warehouse conversions, vulnerable tidal reaches.',
    },
    {
      code: 'Z-03',
      name: 'University & Knowledge Quarter',
      landUse: 'CIVIC',
      pop: 42100,
      density: 14200,
      flood: 'LOW',
      greenPct: 35,
      bounds: { x: 640, y: 220, width: 260, height: 220 },
      desc: 'Campus quads, student residence halls, research institutes, high bicycle and active transit dependency.',
    },
    {
      code: 'Z-04',
      name: 'Central Hospital & Health Sciences District',
      landUse: 'CIVIC',
      pop: 21500,
      density: 9800,
      flood: 'LOW',
      greenPct: 22,
      bounds: { x: 640, y: 460, width: 240, height: 200 },
      desc: 'Regional trauma centre, specialty outpatient clinics, critical ambulance corridors, medical supply warehouses.',
    },
    {
      code: 'Z-05',
      name: 'Innovation Tech Corridor',
      landUse: 'COMMERCIAL',
      pop: 28900,
      density: 11200,
      flood: 'LOW',
      greenPct: 18,
      bounds: { x: 380, y: 160, width: 240, height: 180 },
      desc: 'High-density commercial office towers, research startups, corporate cafeterias, heavy peak rail commute.',
    },
    {
      code: 'Z-06',
      name: 'South Docks & Logistics Hub',
      landUse: 'INDUSTRIAL',
      pop: 9200,
      density: 3100,
      flood: 'HIGH',
      greenPct: 8,
      bounds: { x: 120, y: 600, width: 280, height: 240 },
      desc: 'Freight terminals, cold storage warehouses, heavy multi-axle freight movement, rail sidings, industrial drainage.',
    },
    {
      code: 'Z-07',
      name: 'West Meadows Residential',
      landUse: 'RESIDENTIAL',
      pop: 56300,
      density: 9400,
      flood: 'LOW',
      greenPct: 38,
      bounds: { x: 100, y: 80, width: 260, height: 220 },
      desc: 'Family housing, municipal primary schools, local high street, neighbourhood parks, high personal vehicle reliance.',
    },
    {
      code: 'Z-08',
      name: 'Transit Hub Central',
      landUse: 'COMMERCIAL',
      pop: 31000,
      density: 18400,
      flood: 'LOW',
      greenPct: 10,
      bounds: { x: 380, y: 560, width: 240, height: 180 },
      desc: 'Grand union rail terminal, bus rapid transit interchanges, high commuter turnover, underground retail concourse.',
    },
    {
      code: 'Z-09',
      name: 'Eco-Park & Wetlands Reserve',
      landUse: 'ECOLOGICAL',
      pop: 2400,
      density: 650,
      flood: 'HIGH',
      greenPct: 82,
      bounds: { x: 40, y: 360, width: 70, height: 320 },
      desc: 'Riparian wetlands, bird sanctuary, flood catchment basin, permeable recreational trails, strict environmental buffers.',
    },
    {
      code: 'Z-10',
      name: 'Eastside Mixed-Density Suburbs',
      landUse: 'RESIDENTIAL',
      pop: 48900,
      density: 10200,
      flood: 'LOW',
      greenPct: 29,
      bounds: { x: 640, y: 680, width: 260, height: 220 },
      desc: 'Mid-rise apartment cooperatives, secondary schools, elderly care facilities, bus feeder routes.',
    },
    {
      code: 'Z-11',
      name: 'North Heights Panoramic Hill',
      landUse: 'RESIDENTIAL',
      pop: 19800,
      density: 4600,
      flood: 'LOW',
      greenPct: 45,
      bounds: { x: 380, y: 20, width: 380, height: 120 },
      desc: 'Low-density undulating terrain, scenic outlooks, winding access roads, wildfire and storm-wind sensitivities.',
    },
    {
      code: 'Z-12',
      name: 'Civic Centre & Municipal Common',
      landUse: 'CIVIC',
      pop: 14500,
      density: 8100,
      flood: 'LOW',
      greenPct: 32,
      bounds: { x: 400, y: 380, width: 140, height: 140 },
      desc: 'City Hall, Municipal Archives, Central Library, Public Forum square, planning offices, emergency coordination centre.',
    },
  ];

  const zoneEntities: ZoneEntity[] = zoneDefs.map((z, idx) => {
    const id = `ZONE-${String(idx + 1).padStart(6, '0')}`;
    return {
      id,
      type: 'ZONE',
      subType: z.landUse,
      name: z.name,
      zoneId: id,
      coordinates: {
        x: z.bounds.x + z.bounds.width / 2,
        y: z.bounds.y + z.bounds.height / 2,
      },
      provenance: 'SYNTHETIC',
      lastUpdated: '2026-10-12T00:00:00Z',
      priorities: ['Urban livability', 'Equitable services', 'Infrastructure resilience'],
      constraints: ['Zoning envelope limits', 'Stormwater drainage thresholds', 'Historic preservation easements'],
      dependencies: [],
      connectedEntityIds: [],
      evaluationCriteria: ['Pedestrian safety', 'Affordability index', 'Emergency response latency', 'Ecological runoff'],
      code: z.code,
      landUseClassification: z.landUse,
      totalPopulation: z.pop,
      densityPerSqKm: z.density,
      floodVulnerability: z.flood,
      greenCoveragePct: z.greenPct,
      bounds: z.bounds,
    };
  });

  entities.push(...zoneEntities);

  // 2. EMERGENCY SERVICES (5 Stations)
  const emergencyDefs = [
    { name: 'Fire Station 01 - Old Town Command', zoneIdx: 0, srv: 'fire' as const, fleet: 8, r: 4.5 },
    { name: 'Metro Ambulance Dispatch Central', zoneIdx: 3, srv: 'ambulance' as const, fleet: 16, r: 6.0 },
    { name: 'Police District HQ - Transit Station', zoneIdx: 7, srv: 'police' as const, fleet: 22, r: 5.0 },
    { name: 'Fire & Marine Rescue Station 04', zoneIdx: 1, srv: 'fire' as const, fleet: 6, r: 4.0 },
    { name: 'Disaster Emergency Coordination Unit', zoneIdx: 11, srv: 'disaster_response' as const, fleet: 10, r: 12.0 },
  ];

  const emergencyEntities: EmergencyServiceEntity[] = emergencyDefs.map((e, idx) => {
    const id = `SRV-${String(idx + 1).padStart(6, '0')}`;
    const z = zoneEntities[e.zoneIdx];
    return {
      id,
      type: 'EMERGENCY_SERVICE',
      subType: e.srv,
      name: e.name,
      zoneId: z.id,
      coordinates: {
        x: z.bounds.x + 20 + idx * 15,
        y: z.bounds.y + 20 + idx * 10,
      },
      provenance: 'SYNTHETIC',
      lastUpdated: '2026-10-12T00:00:00Z',
      priorities: ['Sub-6 minute response time', 'Unimpeded arterial road access', 'Reliable communications link'],
      constraints: ['Road closures directly compromise emergency dispatch', 'Hydrant water pressure minimum 3.5 bar'],
      dependencies: [],
      connectedEntityIds: [z.id],
      evaluationCriteria: ['Dispatch latency', 'Arterial route availability', 'Evacuation clearance time'],
      serviceType: e.srv,
      responseRadiusKm: e.r,
      vehicleFleetSize: e.fleet,
      criticalResponseCorridors: [],
    };
  });
  entities.push(...emergencyEntities);

  // 3. GOVERNMENT BODIES (5)
  const govDefs = [
    { name: 'Municipal Planning & Development Commission', zoneIdx: 11, scope: ['Zoning', 'Building permits', 'EIR review'] },
    { name: 'Metropolitan Transit Authority (MTA)', zoneIdx: 7, scope: ['Bus routes', 'Metro lines', 'Pedestrian right-of-ways'] },
    { name: 'Department of Public Works & Utilities', zoneIdx: 11, scope: ['Water supply', 'Sewage', 'Road surfacing'] },
    { name: 'Environmental Protection & Catchment Board', zoneIdx: 8, scope: ['Wetlands', 'Air quality', 'Stormwater permits'] },
    { name: 'Housing & Community Renewal Office', zoneIdx: 0, scope: ['Tenant protections', 'Affordable housing quotas'] },
  ];
  const govEntities: GovernmentEntity[] = govDefs.map((g, idx) => {
    const id = `GOV-${String(idx + 1).padStart(6, '0')}`;
    const z = zoneEntities[g.zoneIdx];
    return {
      id,
      type: 'GOVERNMENT',
      subType: 'regulatory',
      name: g.name,
      zoneId: z.id,
      coordinates: { x: z.coordinates.x - 20, y: z.coordinates.y - 20 },
      provenance: 'SYNTHETIC',
      lastUpdated: '2026-10-12T00:00:00Z',
      priorities: ['Statutory compliance', 'Public safety', 'Fiscal solvency', 'Long-term sustainability'],
      constraints: ['Statutory public consultation period', 'Budget appropriation limits'],
      dependencies: [],
      connectedEntityIds: [z.id],
      evaluationCriteria: ['Legal risk', 'Regulatory compliance', 'Inter-departmental alignment'],
      jurisdiction: 'Metro Demo City',
      regulatoryScope: g.scope,
    };
  });
  entities.push(...govEntities);

  // 4. COMMUNITY ORGANISATIONS (5)
  const comtyDefs = [
    { name: 'Old Town Small Merchants Alliance', zoneIdx: 0, focus: 'Small business rent stability & footfall', count: 180 },
    { name: 'Coalition for Accessible Transit & Mobility', zoneIdx: 7, focus: 'Wheelchair access, audible signals & step-free transit', count: 1200 },
    { name: 'Riverfront Residents & Environmental Association', zoneIdx: 1, focus: 'Wetland conservation, public access & flood defense', count: 650 },
    { name: 'Students & Youth Housing Guild', zoneIdx: 2, focus: 'Affordable student housing & bike corridor safety', count: 3400 },
    { name: 'Eastside Elders & Caregivers Circle', zoneIdx: 9, focus: 'Healthcare proximity, walkable pavements & benches', count: 850 },
  ];
  const comtyEntities: CommunityEntity[] = comtyDefs.map((c, idx) => {
    const id = `COMTY-${String(idx + 1).padStart(6, '0')}`;
    const z = zoneEntities[c.zoneIdx];
    return {
      id,
      type: 'COMMUNITY',
      subType: 'advocacy',
      name: c.name,
      zoneId: z.id,
      coordinates: { x: z.coordinates.x + 15, y: z.coordinates.y + 15 },
      provenance: 'SYNTHETIC',
      lastUpdated: '2026-10-12T00:00:00Z',
      priorities: [c.focus, 'Community consultation', 'Displacement prevention'],
      constraints: ['Volunteer-driven bandwidth', 'Limited legal defense funds'],
      dependencies: [],
      connectedEntityIds: [z.id],
      evaluationCriteria: ['Community displacement risk', 'Pedestrian accessibility', 'Affordability preservation'],
      focusArea: c.focus,
      representedCitizenCount: c.count,
    };
  });
  entities.push(...comtyEntities);

  // 5. FACILITIES (50 facilities across Education, Healthcare, Transport, Utilities, Community)
  const facilityCategories: Array<{
    cat: FacilityEntity['category'];
    types: string[];
    names: string[];
    priority: 'CRITICAL' | 'HIGH' | 'STANDARD';
  }> = [
    {
      cat: 'education',
      types: ['Primary School', 'Secondary School', 'Community College', 'University Campus', 'Vocational Institute'],
      names: ['St. Jude Primary', 'Riverview Academy', 'Metro Technical College', 'Central Arts Lyceum', 'Eastside High School', 'Heights Montessori', 'Knowledge Quad Lab', 'Old Town Elementary', 'Civic Polytechnic', 'Meadowlands Grammar'],
      priority: 'HIGH',
    },
    {
      cat: 'healthcare',
      types: ['General Hospital', 'Primary Healthcare Centre', 'Trauma Emergency Ward', 'Community Clinic', 'Elderly Care Home', 'Dialysis Centre'],
      names: ['Central General Hospital', 'Old Town Community Health Centre', 'Riverfront Medical Pavilion', 'Eastside Polyclinic', 'Sunrise Eldercare Lodge', 'Metro Trauma Complex', 'St. Luke Pediatric Centre', 'St. Agnes Rehabilitation Wing', 'Westview Diagnostic Centre', 'Knowledge Quarter University Clinic'],
      priority: 'CRITICAL',
    },
    {
      cat: 'transport',
      types: ['Bus Terminal', 'Metro Station', 'Railway Junction', 'Ferry Pier', 'Park-and-Ride', 'Mobility Hub'],
      names: ['Grand Central Metro Station', 'Old Town Market Bus Interchange', 'Riverfront Ferry Terminal', 'South Docks Freight Siding', 'West Meadows Park-Ride', 'Innovation Line Rapid Transit Stop', 'Eastside Transit Depot', 'North Heights Tram Stop', 'University Central Metro Hub', 'Hospital Emergency Heliport & Transit Gate'],
      priority: 'HIGH',
    },
    {
      cat: 'utilities',
      types: ['Water Pumping Station', 'Power Substation', 'Stormwater Detention Vault', 'Waste Transfer Station', 'District Heating Node'],
      names: ['Substation Alpha 132kV', 'Westside Water Booster Plant', 'Central Storm Drainage Basin', 'Docks Solid Waste Depot', 'Riverfront Pumping Sump', 'Telecom Fiber Hub Primary', 'District Chilled Water Plant', 'Clean Energy Microgrid Center', 'Bio-waste Composting Station', 'Flood Pumping Station East'],
      priority: 'CRITICAL',
    },
    {
      cat: 'community',
      types: ['Public Market', 'Central Library', 'Community Sports Center', 'Public Park & Amphitheatre', 'Senior Citizen Social Centre'],
      names: ['Historic Covered Produce Market', 'City Central Reading Library', 'Riverfront Public Esplanade', 'Eastside Cultural Hall', 'West Meadows Aquatic Center', 'Old Town Guild Hall', 'Innovation Maker Space', 'St. Michael Community Hall', 'Botanical Garden Pavilion', 'Municipal Senior Center'],
      priority: 'STANDARD',
    },
  ];

  const facilityEntities: FacilityEntity[] = [];
  let facCounter = 1;
  for (const group of facilityCategories) {
    for (let i = 0; i < group.names.length; i++) {
      const zIdx = (facCounter * 3) % zoneEntities.length;
      const zone = zoneEntities[zIdx];
      const id = `FAC-${String(facCounter).padStart(6, '0')}`;
      const fType = group.types[i % group.types.length];

      facilityEntities.push({
        id,
        type: 'FACILITY',
        category: group.cat,
        subType: fType,
        name: group.names[i],
        facilityType: fType,
        zoneId: zone.id,
        coordinates: {
          x: Math.round(zone.bounds.x + rng.range(20, zone.bounds.width - 20)),
          y: Math.round(zone.bounds.y + rng.range(20, zone.bounds.height - 20)),
        },
        provenance: 'SYNTHETIC',
        lastUpdated: '2026-10-12T00:00:00Z',
        priorities: ['Operational continuity', 'Universal accessibility', 'Public safety compliance'],
        constraints: ['Staffing schedules', 'Noise ordinances during night', 'Access road minimum width 6m'],
        dependencies: [],
        connectedEntityIds: [zone.id],
        evaluationCriteria: ['Accessibility score', 'Service radius continuity', 'Emergency vehicle ingress'],
        capacity: rng.range(120, 3500),
        currentUtilizationPct: rng.range(65, 96),
        operatingHours: group.cat === 'healthcare' ? '24/7' : '07:00 - 20:00',
        emergencyAccessPriority: group.priority,
      });
      facCounter++;
    }
  }
  entities.push(...facilityEntities);

  // 6. INFRASTRUCTURE & ENVIRONMENTAL ASSETS (70 Infrastructure + 30 Environmental = 100)
  const infraClasses: Array<InfrastructureEntity['assetClass']> = [
    'road_network',
    'bridge',
    'rail_transit',
    'water_supply',
    'power_grid',
    'drainage_sewage',
    'telecom',
    'waste_processing',
    'flood_protection',
  ];

  const infraEntities: InfrastructureEntity[] = [];
  for (let i = 1; i <= 70; i++) {
    const assetClass = infraClasses[(i - 1) % infraClasses.length];
    const zIdx = (i * 2) % zoneEntities.length;
    const zone = zoneEntities[zIdx];
    const id = `INF-${String(i).padStart(6, '0')}`;

    let name = '';
    switch (assetClass) {
      case 'road_network':
        name = `Corridor Arterial Rd ${i} (${zone.name.split(' ')[0]})`;
        break;
      case 'bridge':
        name = `River Span Viaduct #${i}`;
        break;
      case 'rail_transit':
        name = `Metro Line Track Section ${i}`;
        break;
      case 'drainage_sewage':
        name = `Stormwater Culvert Main Line #${i}`;
        break;
      case 'water_supply':
        name = `High-Pressure Potable Aqueduct #${i}`;
        break;
      case 'power_grid':
        name = `Underground High-Voltage Feeder #${i}`;
        break;
      case 'telecom':
        name = `Municipal Fiber Trunk Conduit #${i}`;
        break;
      case 'flood_protection':
        name = `Tidal Floodwall & Sluice Gate #${i}`;
        break;
      case 'waste_processing':
        name = `District Solid Waste Collection Sump #${i}`;
        break;
    }

    infraEntities.push({
      id,
      type: 'INFRASTRUCTURE',
      subType: assetClass,
      name,
      assetClass,
      zoneId: zone.id,
      coordinates: {
        x: Math.round(zone.bounds.x + rng.range(10, zone.bounds.width - 10)),
        y: Math.round(zone.bounds.y + rng.range(10, zone.bounds.height - 10)),
      },
      provenance: 'SYNTHETIC',
      lastUpdated: '2026-10-12T00:00:00Z',
      priorities: ['Grid reliability', 'Structural safety factor > 2.0', 'Minimal scheduled downtime'],
      constraints: ['Disruption causes cascading supply cutoffs', 'Sub-surface utility easements'],
      dependencies: [],
      connectedEntityIds: [zone.id],
      evaluationCriteria: ['Capacity saturation', 'Failure cascade risk', 'Maintenance access'],
      conditionRating: rng.range(2, 5),
      capacityLimit: `${rng.range(5000, 45000)} units/day peak load`,
      failureSensitivity: i % 4 === 0 ? 'CRITICAL' : i % 2 === 0 ? 'HIGH' : 'MODERATE',
    });
  }
  entities.push(...infraEntities);

  // Environmental assets (30 records)
  const envTypes: Array<EnvironmentEntity['environmentalType']> = [
    'river_corridor',
    'urban_canopy',
    'wetland',
    'floodplain',
    'heat_island',
    'air_quality_sensor',
    'acoustic_station',
  ];
  const envEntities: EnvironmentEntity[] = [];
  for (let i = 1; i <= 30; i++) {
    const envType = envTypes[(i - 1) % envTypes.length];
    const zIdx = (i * 3 + 1) % zoneEntities.length;
    const zone = zoneEntities[zIdx];
    const id = `ENV-${String(i).padStart(6, '0')}`;

    let name = '';
    switch (envType) {
      case 'river_corridor':
        name = `Blue River Riparian Buffer Reach #${i}`;
        break;
      case 'urban_canopy':
        name = `Old Growth Oak Canopy Zone #${i}`;
        break;
      case 'wetland':
        name = `Delta Estuary Marshland Sector #${i}`;
        break;
      case 'floodplain':
        name = `Lowland Retention Floodplain Basin #${i}`;
        break;
      case 'heat_island':
        name = `Thermal Concrete Heat Island Sector #${i}`;
        break;
      case 'air_quality_sensor':
        name = `Continuous PM2.5/NOx Monitoring Node #${i}`;
        break;
      case 'acoustic_station':
        name = `Ambient Noise Continuous Logger Station #${i}`;
        break;
    }

    envEntities.push({
      id,
      type: 'ENVIRONMENT',
      subType: envType,
      name,
      environmentalType: envType,
      zoneId: zone.id,
      coordinates: {
        x: Math.round(zone.bounds.x + rng.range(15, zone.bounds.width - 15)),
        y: Math.round(zone.bounds.y + rng.range(15, zone.bounds.height - 15)),
      },
      provenance: 'SYNTHETIC',
      lastUpdated: '2026-10-12T00:00:00Z',
      priorities: ['Canopy preservation', 'Stormwater infiltration', 'Biodiversity corridor preservation'],
      constraints: ['Soil compaction limits', 'Impervious surface ratio caps', 'Wetland conservation laws'],
      dependencies: [],
      connectedEntityIds: [zone.id],
      evaluationCriteria: ['Runoff coefficient', 'Heat absorption delta', 'Ecological continuity'],
      permeabilityPct: envType === 'heat_island' ? rng.range(5, 18) : rng.range(45, 95),
      runoffRiskLevel: envType === 'floodplain' || envType === 'river_corridor' ? 'HIGH' : 'MODERATE',
      ecologicalSensitivity: envType === 'wetland' || envType === 'urban_canopy' ? 'HIGH' : 'MEDIUM',
    });
  }
  entities.push(...envEntities);

  // 7. ORGANISATIONS (60 Companies & Businesses)
  const orgSectors: Array<OrganizationEntity['sector']> = [
    'retail',
    'food_beverage',
    'logistics',
    'property_development',
    'construction',
    'technology',
    'manufacturing',
    'healthcare',
    'utility',
    'financial',
    'hospitality',
  ];

  const orgNamesBySector: Record<string, string[]> = {
    retail: ['Mercer & Sons Haberdashery', 'Sunlight Green Grocers', 'Old Town Antiquities', 'Apex Electronics & Hardware', 'Riverside Bookshop', 'Corner Pantry Market', 'Artisan Pottery Studio', 'Metro Pharmacy Hub'],
    food_beverage: ['The Rusty Anchor Bistro', 'Harbor Cafe & Bakery', 'Saffron Spice Kitchen', 'Piazza Bellini Pizzeria', 'Green Leaf Organic Deli', 'Roast & Brew Coffee Guild', 'Fisherman Dock Taverna', 'Noodle Alley Express'],
    logistics: ['SwiftFreight Express Depot', 'Metro Cross-Dock Logistics', 'Harbor Courier Cargo Hub', 'ColdChain Distributors', 'Apex Parcel Deliveries', 'River Haulage Ltd'],
    property_development: ['Horizon Urban Holdings', 'Vanguard Metropolitan Real Estate', 'Pinnacle Development Partners', 'Old Town Heritage Revitalisation Corp'],
    construction: ['Terra Firma Heavy Foundations', 'Metro Civil Engineering Works', 'BuildCorp Steel & Aggregate'],
    technology: ['Quantum City Algorithms', 'BioGen Medical Informatics', 'Skyline Cloud Systems', 'SensorMesh Urban IoT', 'AeroDrone Logistics Labs'],
    manufacturing: ['Delta Precision Machining', 'Riverside Timber Joinery', 'Apex Textile Mill & Garments', 'Sunburst Solar Panels'],
    healthcare: ['CareFirst Diagnostics Clinic', 'Advanced Orthopedic Labs', 'Apex Dental Associates'],
    utility: ['Metro Clean Power Co-op', 'PureWater Infrastructure Services'],
    financial: ['Citizens Community Savings Bank', 'Harbor Maritime Insurance Bureau', 'First City Credit Union'],
    hospitality: ['The Grand Regency Hotel', 'Riverfront Boutique Inn', 'Backpackers Wharf Hostel'],
  };

  const orgEntities: OrganizationEntity[] = [];
  for (let i = 1; i <= 60; i++) {
    const sector = orgSectors[(i - 1) % orgSectors.length];
    const namesList = orgNamesBySector[sector] || ['Standard Enterprise Co.'];
    const name = `${namesList[(i - 1) % namesList.length]} #${i}`;
    const zIdx = (i * 2 + 1) % zoneEntities.length;
    const zone = zoneEntities[zIdx];
    const id = `ORG-${String(i).padStart(6, '0')}`;

    orgEntities.push({
      id,
      type: 'ORGANIZATION',
      subType: sector,
      name,
      sector,
      zoneId: zone.id,
      coordinates: {
        x: Math.round(zone.bounds.x + rng.range(25, zone.bounds.width - 25)),
        y: Math.round(zone.bounds.y + rng.range(25, zone.bounds.height - 25)),
      },
      provenance: 'SYNTHETIC',
      lastUpdated: '2026-10-12T00:00:00Z',
      priorities: [
        sector === 'retail' || sector === 'food_beverage'
          ? 'Pedestrian footfall and accessible customer entrances'
          : sector === 'logistics'
          ? 'Unimpeded multi-axle freight loading zones'
          : sector === 'property_development'
          ? 'Commercial floor area yield and expedited permitting'
          : 'Business continuity and manageable lease overhead',
        'Customer accessibility',
        'Supply chain reliability',
      ],
      constraints: [
        sector === 'retail' || sector === 'food_beverage'
          ? 'Cannot survive > 4 months road construction disruption'
          : sector === 'logistics'
          ? 'Weight-restricted access roads prohibit operations'
          : 'Lease escalation limits',
      ],
      dependencies: [],
      connectedEntityIds: [zone.id],
      evaluationCriteria: ['Revenue impact', 'Footfall disruption', 'Logistics access', 'Commercial rent vulnerability'],
      employeeCount: rng.range(4, 380),
      dailyFootfall: sector === 'retail' || sector === 'food_beverage' ? rng.range(120, 1800) : rng.range(10, 200),
      loadingBayNeeded: sector === 'logistics' || sector === 'manufacturing' || sector === 'retail',
      parkingDependency: sector === 'retail' || sector === 'hospitality' ? 'HIGH' : sector === 'logistics' ? 'MEDIUM' : 'LOW',
      deliveryFrequency: sector === 'food_beverage' || sector === 'retail' ? 'MULTIPLE_DAILY' : 'DAILY',
      commercialFloorAreaSqM: rng.range(80, 4500),
    });
  }
  entities.push(...orgEntities);

  // 8. HOUSEHOLDS (120 Households)
  const householdEntities: HouseholdEntity[] = [];
  const incomeBands: EconomicBand[] = ['low_income', 'lower_middle', 'middle_income', 'higher_income'];
  const tenures: HousingTenure[] = ['owner', 'renter', 'informal', 'hostel', 'pension_dependent'];

  for (let i = 1; i <= 120; i++) {
    const id = `HHD-${String(i).padStart(6, '0')}`;
    const zIdx = (i * 5) % zoneEntities.length;
    const zone = zoneEntities[zIdx];
    const size = rng.range(1, 5);
    const dependents = size > 1 ? rng.range(0, size - 1) : 0;
    const incomeBand = incomeBands[(i - 1) % incomeBands.length];
    const tenure = tenures[i % tenures.length];

    householdEntities.push({
      id,
      type: 'HOUSEHOLD',
      subType: tenure,
      name: `Household ${id} (${zone.name.split(' ')[0]})`,
      zoneId: zone.id,
      coordinates: {
        x: Math.round(zone.bounds.x + rng.range(15, zone.bounds.width - 15)),
        y: Math.round(zone.bounds.y + rng.range(15, zone.bounds.height - 15)),
      },
      provenance: 'SYNTHETIC',
      lastUpdated: '2026-10-12T00:00:00Z',
      priorities: [
        tenure === 'renter' || tenure === 'informal'
          ? 'Rent affordability and eviction protection'
          : 'Property value stability and local amenities',
        'Safe school commute for dependents',
        'Convenient public transport access',
      ],
      constraints: [
        incomeBand === 'low_income'
          ? 'Zero financial buffer for forced relocation costs'
          : 'School district zoning constraints',
      ],
      dependencies: [],
      connectedEntityIds: [zone.id],
      evaluationCriteria: ['Housing cost pressure', 'Commute burden', 'Community disruption'],
      size,
      dependentsCount: dependents,
      incomeBand,
      housingTenure: tenure,
      vehicleCount: incomeBand === 'low_income' ? (rng.next() > 0.7 ? 1 : 0) : rng.range(1, 2),
      memberIds: [],
    });
  }
  entities.push(...householdEntities);

  // 9. CITIZENS (500 Individuals)
  const lifeStages: LifeStage[] = [
    'schoolchild',
    'teenager',
    'student',
    'young_adult',
    'working_adult',
    'parent',
    'middle_aged',
    'senior',
  ];

  const occupationsByStage: Record<LifeStage, string[]> = {
    schoolchild: ['Primary Student'],
    teenager: ['High School Student', 'Apprentice Technician'],
    student: ['University Undergraduate', 'Graduate Researcher', 'Vocational Trainee'],
    young_adult: ['Barista & Freelancer', 'Junior Software Developer', 'Retail Sales Associate', 'Logistics Dispatcher', 'Paramedic Trainee'],
    working_adult: ['Construction Carpenter', 'Staff Nurse', 'Primary Teacher', 'Delivery Courier', 'Bus Driver', 'Civil Engineer', 'Restaurateur', 'Sanitation Worker', 'Police Constable', 'Accountant', 'Electrician', 'Hospitality Worker'],
    parent: ['Secondary School Teacher', 'Senior Radiologist', 'Small Business Owner', 'Factory Shift Lead', 'Public Librarian', 'Postal Carrier', 'Plumber', 'Community Health Worker'],
    middle_aged: ['General Contractor', 'Municipal Admin Officer', 'Wholesale Trader', 'Supermarket Manager', 'Clinic Doctor', 'Landscape Gardener'],
    senior: ['Retired Transit Operator', 'Pensioner', 'Retired School Principal', 'Community Volunteer', 'Retired Dock Worker', 'Artisan Woodworker'],
  };

  const transportModes: TransportMode[] = [
    'private_vehicle',
    'motorcycle',
    'bus',
    'rail_metro',
    'bicycle',
    'pedestrian',
    'accessible_transit',
    'delivery',
  ];

  const accessReqs: AccessibilityRequirement[] = [
    'none',
    'wheelchair',
    'limited_mobility',
    'visual_impairment',
    'hearing_impairment',
    'healthcare_dependent',
  ];

  const citizenEntities: CitizenEntity[] = [];

  for (let i = 1; i <= 500; i++) {
    const id = `CIT-${String(i).padStart(6, '0')}`;
    const hhd = householdEntities[(i - 1) % householdEntities.length];
    hhd.memberIds.push(id);

    const lifeStage = lifeStages[(i - 1) % lifeStages.length];
    let age = 35;
    switch (lifeStage) {
      case 'schoolchild':
        age = rng.range(6, 12);
        break;
      case 'teenager':
        age = rng.range(13, 18);
        break;
      case 'student':
        age = rng.range(19, 25);
        break;
      case 'young_adult':
        age = rng.range(22, 30);
        break;
      case 'working_adult':
        age = rng.range(28, 48);
        break;
      case 'parent':
        age = rng.range(32, 52);
        break;
      case 'middle_aged':
        age = rng.range(50, 64);
        break;
      case 'senior':
        age = rng.range(65, 88);
        break;
    }

    const occList = occupationsByStage[lifeStage];
    const occupation = occList[(i - 1) % occList.length];

    // Assign transport mode and accessibility
    let primaryTransport: TransportMode = transportModes[(i * 3) % transportModes.length];
    let accessReq: AccessibilityRequirement = 'none';

    if (i % 14 === 0) {
      accessReq = 'wheelchair';
      primaryTransport = 'accessible_transit';
    } else if (i % 19 === 0) {
      accessReq = 'limited_mobility';
      primaryTransport = 'bus';
    } else if (i % 27 === 0) {
      accessReq = 'visual_impairment';
      primaryTransport = 'pedestrian';
    } else if (lifeStage === 'senior' && i % 4 === 0) {
      accessReq = 'healthcare_dependent';
    }

    // Connect to facility or workplace
    const connectedFacilities = facilityEntities.filter(f => f.zoneId === hhd.zoneId);
    const assignedSchoolOrWork =
      lifeStage === 'schoolchild' || lifeStage === 'teenager'
        ? facilityEntities.find(f => f.category === 'education')?.id
        : orgEntities[(i * 2) % orgEntities.length]?.id;

    // Daily routine
    const dailyRoutine =
      lifeStage === 'schoolchild'
        ? 'Departs 07:45 on foot along local neighbourhood pavement, attends school until 15:30, plays in neighbourhood park.'
        : lifeStage === 'senior'
        ? 'Morning walk to local bakery at 08:30, bi-weekly transit trip to Community Health Centre, afternoon community center visits.'
        : primaryTransport === 'bus'
        ? 'Walks 400m to Route 42 bus stop, 35 min commute to central commercial quarter, returns 18:30.'
        : primaryTransport === 'bicycle'
        ? 'Commutes via designated cycleway across river viaduct, relies on safe intersections without heavy lorry traffic.'
        : 'Drives private vehicle along arterial corridor, depends on available short-term parking and predictable traffic times.';

    const sensitivityFactors: string[] = [];
    if (accessReq === 'wheelchair' || accessReq === 'limited_mobility') {
      sensitivityFactors.push('Kerb ramps & step-free paving', 'Pedestrian detour > 150m is prohibitive');
    }
    if (hhd.housingTenure === 'renter' || hhd.housingTenure === 'informal') {
      sensitivityFactors.push('Commercial gentrification causing rent spikes', 'Risk of displacement');
    }
    if (lifeStage === 'schoolchild' || lifeStage === 'parent') {
      sensitivityFactors.push('Unsafe arterial road crossings for children', 'Construction dust & noise near schools');
    }
    if (primaryTransport === 'delivery' || occupation.includes('Courier')) {
      sensitivityFactors.push('Loading bay closures', 'Road narrowing increases delivery times');
    }
    if (accessReq === 'healthcare_dependent') {
      sensitivityFactors.push('Ambulance / clinic route disruption');
    }
    if (sensitivityFactors.length === 0) {
      sensitivityFactors.push('Traffic congestion changes', 'Local green space availability');
    }

    citizenEntities.push({
      id,
      type: 'CITIZEN',
      subType: lifeStage,
      name: `Resident ${id}`,
      zoneId: hhd.zoneId,
      coordinates: {
        x: Math.round(hhd.coordinates.x + rng.range(-15, 15)),
        y: Math.round(hhd.coordinates.y + rng.range(-15, 15)),
      },
      provenance: 'SYNTHETIC',
      lastUpdated: '2026-10-12T00:00:00Z',
      priorities: [
        accessReq !== 'none'
          ? 'Barrier-free accessible pedestrian infrastructure'
          : hhd.incomeBand === 'low_income'
          ? 'Affordable living costs and transit access'
          : 'Quality of life, air quality and safety',
        'Reliable daily transit connections',
      ],
      constraints: [
        accessReq === 'wheelchair' ? 'Requires 1.8m continuous step-free footpaths' : 'Daily commute schedule bound to work shift',
      ],
      dependencies: assignedSchoolOrWork ? [assignedSchoolOrWork, hhd.id] : [hhd.id],
      connectedEntityIds: [
        hhd.id,
        hhd.zoneId,
        ...(assignedSchoolOrWork ? [assignedSchoolOrWork] : []),
        ...(connectedFacilities[0] ? [connectedFacilities[0].id] : []),
      ],
      evaluationCriteria: [
        'Pedestrian safety',
        'Affordability impact',
        'Noise and air quality',
        'Commute duration change',
      ],
      age,
      lifeStage,
      economicStatus: hhd.incomeBand,
      housingTenure: hhd.housingTenure,
      occupation,
      householdId: hhd.id,
      workplaceOrSchoolId: assignedSchoolOrWork,
      primaryTransportMode: primaryTransport,
      secondaryTransportMode: primaryTransport === 'bus' ? 'pedestrian' : undefined,
      accessibilityRequirement: accessReq,
      dailyRoutine,
      sensitivityFactors,
    });
  }

  entities.push(...citizenEntities);

  // 10. PRESET ILLUSTRATIVE SCENARIOS
  const presetScenarios: RedevelopmentScenario[] = [
    {
      id: 'SCN-000001',
      title: 'Old Town Historic Market Pedestrianisation & Light Rail Integration',
      zoneId: 'ZONE-000001',
      category: 'Pedestrianisation of a street',
      description:
        'Proposal to fully pedestrianise Market Street and surrounding alleys, removing 140 curbside parking bays, expanding paved sidewalks, and laying a dedicated surface light rail corridor connecting Transit Hub Central to the Historic Market Quarter.',
      objectives: [
        'Eliminate through-traffic vehicular emissions and road casualties in Market Square.',
        'Boost visitor and pedestrian footfall for ground-floor shops and eateries.',
        'Increase active transit and public rail access into the historic core.',
      ],
      knownConstraints: [
        'Existing delivery trucks access shops between 06:00 and 10:00 via curbside bays.',
        'Emergency response vehicles from Fire Station 01 use Market St as primary eastbound artery.',
        'Underground 1920s stormwater drainage culvert runs directly beneath the proposed tram track bed.',
      ],
      existingConditions:
        'Dual-lane one-way vehicular traffic, 140 metered parking stalls, 1.2m narrow sidewalks with uneven cobbles causing wheelchair accessibility hazards, frequent peak-hour congestion.',
      proposedConditions:
        'Step-free shared transit plaza, 4.5m wide pedestrian avenues, dedicated twin light rail tracks with grass median, morning-only retractable bollards for delivery vans, zero general private car parking.',
      affectedAreaSqKm: 0.45,
      supportingNotes:
        'Supported by Old Town Small Merchants Alliance conditionally, but strong objections raised regarding early-morning delivery access and emergency access routes.',
      createdAt: '2026-10-12T10:00:00Z',
      isIllustrativeDemo: true,
    },
    {
      id: 'SCN-000002',
      title: 'Riverfront Quay Commercial High-Rise Tech District & Arterial Road Widening',
      zoneId: 'ZONE-000002',
      category: 'New commercial district',
      description:
        'Demolish 18 historical low-rise brick warehouses and light industrial sheds along Riverfront Quay to build a 280,000 m² commercial high-tech corporate campus, widened 6-lane waterfront arterial boulevard, and 2,400 underground parking stalls.',
      objectives: [
        'Attract multinational corporate technology offices and high-wage tech jobs.',
        'Relieve regional traffic congestion by widening the riverfront boulevard to 6 lanes.',
        'Generate municipal commercial property tax revenues.',
      ],
      knownConstraints: [
        'Zone is designated high flood vulnerability with coastal storm surge risk.',
        'Displaces 42 tenant-occupied artisan workshops, local cafés, and 28 low-income informal households.',
        'Increases impervious concrete surface by 65,000 m², compounding tidal stormwater runoff.',
      ],
      existingConditions:
        'Mixed low-density warehouses, waterfront boardwalk, small maritime supply shops, high soil permeability along river edge, 2-lane roadway with traffic chokepoints.',
      proposedConditions:
        'Four 24-storey glazed office towers, 6-lane elevated arterial roadway with concrete crash barriers, multi-storey underground parking, hardened rip-rap embankment.',
      affectedAreaSqKm: 0.85,
      supportingNotes:
        'Property developers praise economic yield; environmental board and tenant coalition raise critical flood runoff and displacement red flags.',
      createdAt: '2026-10-12T10:15:00Z',
      isIllustrativeDemo: true,
    },
    {
      id: 'SCN-000003',
      title: 'University District Affordable Student Housing & Protected Cycle Superhighway',
      zoneId: 'ZONE-000003',
      category: 'Public housing',
      description:
        'Construction of an 800-unit municipal cooperative student & key-worker housing block on underutilised surface parking, accompanied by a 3.2km grade-separated bi-directional cycle superhighway connecting campus directly to the Central Hospital.',
      objectives: [
        'Alleviate severe student housing rent pressure and reduce long commutes.',
        'Provide safe, continuous active transit corridors for hospital shift workers and students.',
        'Eliminate auto trips along the campus spine.',
      ],
      knownConstraints: [
        'Local homeowners in adjacent residential fringe express concern over building height and on-street parking spillover.',
        'Utility substations require transformer upgrades to support heat pumps and EV mobility chargers.',
      ],
      existingConditions:
        'Surface asphalt parking lot with 380 spaces, paint-only cycle lanes frequently blocked by delivery vans, rising student rent rent-burden index.',
      proposedConditions:
        '8-storey cross-laminated timber residential cooperative, ground floor community clinic, separated bi-directional cycle track with physical bollards, zero car parking provided.',
      affectedAreaSqKm: 0.32,
      supportingNotes:
        'Broad student and hospital worker support; concerns about electrical grid capacity and parking restrictions from adjacent suburban fringe.',
      createdAt: '2026-10-12T10:30:00Z',
      isIllustrativeDemo: true,
    },
    {
      id: 'SCN-000004',
      title: 'South Docks Stormwater Retention Wetland & Eco-Park Flood Barrier',
      zoneId: 'ZONE-000006',
      category: 'Drainage improvements',
      description:
        'Convert 12 hectares of derelict docklands and contaminated rail sidings into a natural stormwater retention wetland, automated tidal sluice gates, and a public eco-park acting as a regional flood protection buffer.',
      objectives: [
        'Protect adjacent industrial logistics facilities and residential sectors from 1-in-50-year storm surges.',
        'Restore tidal wetland ecology, increase carbon sequestration and urban cooling.',
        'Create accessible green recreation space in an underserved industrial neighbourhood.',
      ],
      knownConstraints: [
        'Requires brownfield soil remediation of historical hydrocarbon contaminants.',
        'Heavy freight trucks currently use dock access roads that would be re-routed through a longer bypass.',
      ],
      existingConditions:
        'Compacted asphalt and gravel rail yards, deteriorating concrete bulkheads, frequent minor flood pooling during spring tides.',
      proposedConditions:
        'Tiered bioswales, reed-bed filtration ponds, reinforced tidal earth berms with public elevated boardwalk, re-routed freight corridor with sound barriers.',
      affectedAreaSqKm: 0.95,
      supportingNotes:
        'Strong alignment with regional climate adaptation goals; freight logistics companies request guarantees on bypass corridor clearance times.',
      createdAt: '2026-10-12T10:45:00Z',
      isIllustrativeDemo: true,
    },
  ];

  return {
    entities,
    presetScenarios,
  };
}
