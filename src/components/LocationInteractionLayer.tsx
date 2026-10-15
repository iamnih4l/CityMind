import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MapPin,
  Crosshair,
  Search,
  Sliders,
  Compass,
  RotateCcw,
  Building2,
  Activity,
  Trees,
  Shield,
  Zap,
  Radio,
  ChevronDown,
  X,
  Target,
  Sparkles,
  ExternalLink,
  Users,
  Flame,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { CityEntity, ZoneEntity, FacilityEntity, EmergencyServiceEntity, EnvironmentEntity } from '../types/city.ts';
import { MapFocalPoint, FocalLocationType, LocationTelemetryStats } from '../types/location.ts';
import { retroAudio } from '../utils/retroAudio.ts';

interface LocationInteractionLayerProps {
  entities: CityEntity[];
  focalPoint: MapFocalPoint | null;
  onSelectFocalPoint: (focal: MapFocalPoint | null) => void;
  isPickMode: boolean;
  onTogglePickMode: (active: boolean) => void;
  radiusKm: number;
  onChangeRadiusKm: (radius: number) => void;
  onResetOverview: () => void;
  onTriggerCameraPreset?: (view: 'cinematic' | 'skyline' | 'topdown') => void;
}

export const LocationInteractionLayer: React.FC<LocationInteractionLayerProps> = ({
  entities,
  focalPoint,
  onSelectFocalPoint,
  isPickMode,
  onTogglePickMode,
  radiusKm,
  onChangeRadiusKm,
  onResetOverview,
  onTriggerCameraPreset,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('ALL');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filterable locations inventory derived from city entities
  const locationsList = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      category: string;
      type: FocalLocationType;
      coordinates: { x: number; y: number };
      zoneId: string;
      zoneName: string;
      description: string;
      code?: string;
      themeColor: string;
      entity: CityEntity;
    }> = [];

    const zones = entities.filter(e => e.type === 'ZONE') as ZoneEntity[];
    const zoneMap = new Map(zones.map(z => [z.id, z.name]));

    // 1. Zones / Districts
    zones.forEach(z => {
      list.push({
        id: z.id,
        name: z.name,
        category: 'DISTRICT',
        type: 'ZONE',
        coordinates: { ...z.coordinates },
        zoneId: z.id,
        zoneName: z.name,
        description: `${z.landUseClassification} District · Pop: ${z.totalPopulation.toLocaleString()} · Density: ${z.densityPerSqKm.toLocaleString()}/km²`,
        code: z.code,
        themeColor: z.landUseClassification === 'COMMERCIAL' ? '#38bdf8' : z.landUseClassification === 'CIVIC' ? '#fbbf24' : z.landUseClassification === 'ECOLOGICAL' ? '#34d399' : '#818cf8',
        entity: z,
      });
    });

    // 2. Facilities (Hospitals, Schools, Transit, Civic)
    const facilities = entities.filter(e => e.type === 'FACILITY') as FacilityEntity[];
    facilities.forEach(f => {
      let cat = 'CIVIC';
      let themeColor = '#fbbf24';
      if (f.category === 'healthcare') {
        cat = 'HEALTHCARE';
        themeColor = '#f43f5e';
      } else if (f.category === 'transport') {
        cat = 'TRANSIT';
        themeColor = '#06b6d4';
      } else if (f.category === 'education') {
        cat = 'EDUCATION';
        themeColor = '#3b82f6';
      } else if (f.category === 'utilities') {
        cat = 'UTILITY';
        themeColor = '#eab308';
      }

      list.push({
        id: f.id,
        name: f.name,
        category: cat,
        type: 'FACILITY',
        coordinates: { ...f.coordinates },
        zoneId: f.zoneId,
        zoneName: zoneMap.get(f.zoneId) || 'Metro District',
        description: `${f.facilityType} · Capacity: ${f.capacity} · Util: ${f.currentUtilizationPct}%`,
        code: f.id,
        themeColor,
        entity: f,
      });
    });

    // 3. Emergency Services
    const emergencyStations = entities.filter(e => e.type === 'EMERGENCY_SERVICE') as EmergencyServiceEntity[];
    emergencyStations.forEach(s => {
      list.push({
        id: s.id,
        name: s.name,
        category: 'EMERGENCY',
        type: 'EMERGENCY',
        coordinates: { ...s.coordinates },
        zoneId: s.zoneId,
        zoneName: zoneMap.get(s.zoneId) || 'Metro District',
        description: `${s.serviceType.toUpperCase()} First Responder Depot · Fleet: ${s.vehicleFleetSize} Units`,
        code: s.id,
        themeColor: '#ef4444',
        entity: s,
      });
    });

    // 4. Environmental Reserves & Parks
    const envAssets = entities.filter(e => e.type === 'ENVIRONMENT') as EnvironmentEntity[];
    envAssets.forEach(env => {
      list.push({
        id: env.id,
        name: env.name,
        category: 'ECO_PARK',
        type: 'ENVIRONMENT',
        coordinates: { ...env.coordinates },
        zoneId: env.zoneId,
        zoneName: zoneMap.get(env.zoneId) || 'Metro District',
        description: `${env.environmentalType.replace('_', ' ').toUpperCase()} · Permeability: ${env.permeabilityPct}%`,
        code: env.id,
        themeColor: '#10b981',
        entity: env,
      });
    });

    return list;
  }, [entities]);

  // Filtered list based on search and category
  const filteredLocations = useMemo(() => {
    return locationsList.filter(item => {
      const matchesCategory =
        selectedFilterCategory === 'ALL' || item.category === selectedFilterCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.code && item.code.toLowerCase().includes(q)) ||
        item.zoneName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [locationsList, selectedFilterCategory, searchQuery]);

  // Helper to compute realistic telemetry stats around any focal point
  const computeFocalTelemetry = (coords: { x: number; y: number }, entity?: CityEntity): LocationTelemetryStats => {
    const zones = entities.filter(e => e.type === 'ZONE') as ZoneEntity[];
    // Find closest zone
    let closestZone = zones[0];
    let minZoneDist = 999999;
    zones.forEach(z => {
      const d = Math.hypot(z.coordinates.x - coords.x, z.coordinates.y - coords.y);
      if (d < minZoneDist) {
        minZoneDist = d;
        closestZone = z;
      }
    });

    // Count facilities within radius (1 coordinate unit approx 20 meters, 1km = 50 units)
    const radiusUnits = radiusKm * 50;
    const facilities = entities.filter(e => e.type === 'FACILITY') as FacilityEntity[];
    const facilitiesNearby = facilities.filter(f => {
      const d = Math.hypot(f.coordinates.x - coords.x, f.coordinates.y - coords.y);
      return d <= radiusUnits;
    }).length;

    // Estimate population within this circle
    const baseDensity = closestZone?.densityPerSqKm || 11000;
    const areaSqKm = Math.PI * Math.pow(radiusKm, 2);
    const estimatedPop = Math.min(
      Math.round(baseDensity * areaSqKm * 0.75),
      closestZone?.totalPopulation || 45000
    );

    // Emergency ETA (calculated based on distance to nearest fire/ambulance depot)
    const emergencyStations = entities.filter(e => e.type === 'EMERGENCY_SERVICE');
    let minEta = 3.2;
    if (emergencyStations.length > 0) {
      let minStationDist = 999999;
      emergencyStations.forEach(s => {
        const d = Math.hypot(s.coordinates.x - coords.x, s.coordinates.y - coords.y);
        if (d < minStationDist) minStationDist = d;
      });
      // Convert to estimated response minutes: base 2.5 min + travel speed
      minEta = Number((2.5 + (minStationDist / 120) * 3.8).toFixed(1));
    }

    return {
      populationNearby: estimatedPop,
      density: baseDensity,
      floodRisk: closestZone?.floodVulnerability || 'LOW',
      greenCoveragePct: closestZone?.greenCoveragePct || 24,
      criticalFacilitiesNearby: Math.max(1, facilitiesNearby),
      emergencyEtaMinutes: minEta,
      noiseDecibels: closestZone?.landUseClassification === 'COMMERCIAL' ? 68 : closestZone?.landUseClassification === 'INDUSTRIAL' ? 74 : 52,
    };
  };

  const handleSelectLocationItem = (item: typeof locationsList[0]) => {
    retroAudio.play('CLICK');
    const stats = computeFocalTelemetry(item.coordinates, item.entity);
    const focal: MapFocalPoint = {
      id: item.id,
      name: item.name,
      type: item.type,
      categoryLabel: item.category,
      coordinates: item.coordinates,
      zoneId: item.zoneId,
      zoneName: item.zoneName,
      description: item.description,
      radiusKm,
      entityId: item.id,
      stats,
      themeColor: item.themeColor,
    };
    onSelectFocalPoint(focal);
    setIsDropdownOpen(false);
    onTogglePickMode(false);
  };

  // Quick Preset Locations
  const presetLocationChips = [
    { label: 'Downtown Market', id: 'Z-01', query: 'Old Town' },
    { label: 'Hospital District', id: 'Z-04', query: 'Central Hospital' },
    { label: 'Transit Central', id: 'Z-08', query: 'Transit Hub' },
    { label: 'Innovation Tech', id: 'Z-05', query: 'Innovation Tech' },
    { label: 'Riverfront Quay', id: 'Z-02', query: 'Riverfront Quay' },
    { label: 'South Docks', id: 'Z-06', query: 'South Docks' },
    { label: 'Wetlands Reserve', id: 'Z-09', query: 'Eco-Park' },
    { label: 'University Quad', id: 'Z-03', query: 'University' },
  ];

  return (
    <div className="w-full space-y-2 select-none relative z-20">
      {/* 1. Main Floating Location Tactical Deck */}
      <div className="rounded-xl bg-slate-950/90 border border-cyan-500/30 p-2.5 sm:p-3 shadow-[0_8px_30px_rgba(0,0,0,0.7)] backdrop-blur-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left Side: Search & Location Selector */}
        <div className="flex-1 flex flex-wrap sm:flex-nowrap items-center gap-2">
          {/* Location Focus Mode Badge */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-cyan-950/50 border border-cyan-500/40 shrink-0">
            <Target className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="font-display text-xs font-bold text-cyan-200 tracking-wider hidden sm:inline">
              MAP FOCUS LAYER
            </span>
          </div>

          {/* Searchable Location Input with Dropdown */}
          <div className="relative flex-1 min-w-[200px]" ref={dropdownRef}>
            <div
              onClick={() => setIsDropdownOpen(true)}
              className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 hover:border-cyan-500/50 cursor-pointer transition-all text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {focalPoint ? (
                  <span className="font-semibold text-white truncate flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full inline-block shrink-0"
                      style={{ backgroundColor: focalPoint.themeColor || '#38bdf8' }}
                    />
                    {focalPoint.name}
                    <span className="text-[10px] text-cyan-400 font-mono hidden md:inline">
                      [{focalPoint.categoryLabel}]
                    </span>
                  </span>
                ) : (
                  <span className="text-slate-400 truncate">
                    Search or select city location to base map around...
                  </span>
                )}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </div>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 max-h-[380px] rounded-xl bg-slate-950/95 border border-cyan-500/40 shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col z-50">
                {/* Search Input Bar */}
                <div className="p-2 border-b border-slate-800 bg-slate-900/90 flex items-center gap-2">
                  <Search className="w-4 h-4 text-cyan-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Filter by name, district, hospital, transit, park..."
                    autoFocus
                    className="w-full bg-transparent text-xs text-white placeholder-slate-500 outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-slate-400 hover:text-white p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Pills Bar inside Dropdown */}
                <div className="flex items-center gap-1 p-2 border-b border-slate-800/80 bg-slate-950/80 overflow-x-auto text-[10px] font-mono scrollbar-none">
                  {['ALL', 'DISTRICT', 'HEALTHCARE', 'TRANSIT', 'EMERGENCY', 'EDUCATION', 'ECO_PARK'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedFilterCategory(cat)}
                      className={`px-2 py-0.5 rounded-md transition-all shrink-0 ${
                        selectedFilterCategory === cat
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {cat.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                {/* Locations Item List */}
                <div className="flex-1 overflow-y-auto p-1.5 space-y-1 divide-y divide-slate-800/40">
                  {filteredLocations.length > 0 ? (
                    filteredLocations.map(item => {
                      const isCurrent = focalPoint?.id === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectLocationItem(item)}
                          className={`p-2 rounded-lg cursor-pointer transition-all flex items-start justify-between gap-2.5 ${
                            isCurrent
                              ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-200'
                              : 'hover:bg-slate-900/90 text-slate-300 hover:text-white'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: item.themeColor }}
                              />
                              <span className="font-semibold text-xs text-white truncate">
                                {item.name}
                              </span>
                              {item.code && (
                                <span className="font-mono text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.2 rounded">
                                  {item.code}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 pl-4">
                              {item.description}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                              {item.category}
                            </span>
                            <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                              X:{item.coordinates.x} Y:{item.coordinates.y}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No matching locations found for "{searchQuery}". Try selecting "ALL" or enter a different term.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Map Centering Tools & Pick Crosshair Mode */}
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          {/* Interactive "Click on Map to Pick" Toggle */}
          <button
            onClick={() => {
              retroAudio.play('INFO');
              onTogglePickMode(!isPickMode);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              isPickMode
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)] font-bold animate-pulse'
                : 'bg-slate-900 text-slate-300 hover:text-white border-slate-700 hover:border-amber-500/50'
            }`}
            title="Click anywhere on the 3D or schematic map to pinpoint location coordinates"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isPickMode ? 'text-slate-950 animate-spin' : 'text-amber-400'}`} />
            <span>{isPickMode ? 'CLICK MAP TO PINPOINT' : 'PICK ON MAP'}</span>
          </button>

          {/* Focal Perimeter Radius Selector */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-700">
            <span className="px-2 text-[10px] text-slate-400 font-mono hidden xl:inline">RADIUS:</span>
            {[0.25, 0.5, 1.0, 2.5].map(r => (
              <button
                key={r}
                onClick={() => {
                  retroAudio.play('CLICK');
                  onChangeRadiusKm(r);
                }}
                className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  radiusKm === r
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r < 1 ? `${r * 1000}m` : `${r}km`}
              </button>
            ))}
          </div>

          {/* Reset Overview Action */}
          {focalPoint && (
            <button
              onClick={() => {
                retroAudio.play('CLICK');
                onResetOverview();
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs border border-slate-700 transition-all flex items-center gap-1"
              title="Reset to full metropolitan overview"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">RESET</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Quick Location Preset Jump Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-semibold shrink-0 flex items-center gap-1 pl-1">
          <MapPin className="w-3 h-3 text-cyan-400" />
          QUICK JUMP:
        </span>
        {presetLocationChips.map(chip => {
          const match = locationsList.find(l => l.name.includes(chip.query) || l.code === chip.id);
          const isSelected = focalPoint && match && focalPoint.id === match.id;
          return (
            <button
              key={chip.id}
              onClick={() => {
                if (match) handleSelectLocationItem(match);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium shrink-0 transition-all border flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)] font-semibold'
                  : 'bg-slate-950/70 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border-white/5'
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full inline-block"
                style={{ backgroundColor: match?.themeColor || '#38bdf8' }}
              />
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Pick Mode Active Banner Notification */}
      {isPickMode && (
        <div className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between gap-3 animate-pulse shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-amber-400 animate-spin" />
            <span>
              <strong>INTERACTION CROSSHAIR ACTIVE:</strong> Move your cursor over the map and click any building, district platform, or intersection to pin that exact focal location.
            </span>
          </div>
          <button
            onClick={() => onTogglePickMode(false)}
            className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[11px] hover:bg-amber-400"
          >
            CANCEL
          </button>
        </div>
      )}

      {/* 4. Active Location Telemetry HUD Strip (when a focal point is chosen) */}
      {focalPoint && (
        <div className="rounded-xl bg-gradient-to-r from-slate-950/95 via-slate-900/90 to-cyan-950/50 border border-cyan-500/40 p-3 shadow-xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-3">
          {/* Focal Details */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4 text-cyan-400 animate-[spin_8s_linear_infinite]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-bold text-white tracking-wide truncate">
                  {focalPoint.name}
                </span>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  {focalPoint.categoryLabel}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  GRID: [{focalPoint.coordinates.x}, {focalPoint.coordinates.y}]
                </span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
                {focalPoint.description} · District: <strong className="text-white">{focalPoint.zoneName || 'Metro Central'}</strong>
              </p>
            </div>
          </div>

          {/* Focal Radius Live Telemetry Metrics */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-center">
              <span className="text-[10px] text-slate-400 block uppercase">POP IN RADIUS</span>
              <span className="font-bold text-white">
                {focalPoint.stats.populationNearby.toLocaleString()}
              </span>
            </div>

            <div className="text-center">
              <span className="text-[10px] text-slate-400 block uppercase">EMERGENCY ETA</span>
              <span className="font-bold text-emerald-400">
                {focalPoint.stats.emergencyEtaMinutes} min
              </span>
            </div>

            <div className="text-center">
              <span className="text-[10px] text-slate-400 block uppercase">FLOOD HAZARD</span>
              <span className={`font-bold ${focalPoint.stats.floodRisk === 'HIGH' ? 'text-rose-400' : 'text-cyan-400'}`}>
                {focalPoint.stats.floodRisk}
              </span>
            </div>

            <div className="text-center">
              <span className="text-[10px] text-slate-400 block uppercase">CIVIC HUBS</span>
              <span className="font-bold text-amber-400">
                {focalPoint.stats.criticalFacilitiesNearby} within {radiusKm}km
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
