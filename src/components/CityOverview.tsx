import React, { useState } from 'react';
import {
  MapPin,
  Layers,
  Building2,
  Users,
  Shield,
  Activity,
  Trees,
  Sliders,
  ExternalLink,
  ChevronRight,
  Flame,
  Zap,
  Bell,
  Radio,
  ShieldAlert,
  Eye,
  Box,
  Compass,
  Sparkles,
  CloudRain,
  CloudFog,
  Video,
  Crosshair,
  Terminal,
  RotateCcw,
} from 'lucide-react';
import { useCity } from '../context/CityContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import { ZoneEntity, FacilityEntity } from '../types/city.ts';
import { CinematicCity3D } from './CinematicCity3D.tsx';
import { WeatherParticleSystem, WeatherMode } from './WeatherParticleSystem.tsx';
import { LiveAerialFeed } from './LiveAerialFeed.tsx';
import { UrbanGrowthWidgets } from './UrbanGrowthWidgets.tsx';
import { LocationInteractionLayer } from './LocationInteractionLayer.tsx';
import { MapFocalPoint } from '../types/location.ts';
import { retroAudio } from '../utils/retroAudio.ts';

interface CityOverviewProps {
  onOpenScenarioLab: () => void;
  onOpenImpactAnalysis: () => void;
}

export const CityOverview: React.FC<CityOverviewProps> = ({
  onOpenScenarioLab,
  onOpenImpactAnalysis,
}) => {
  const {
    entities,
    activeScenario,
    setSelectedEntityId,
    runSimulation,
    isSimulating,
    simulationReports,
  } = useCity();

  const {
    thresholdStatuses,
    setIsNotificationCenterOpen,
    triggerIncident,
  } = useNotifications();

  // 3D Twin View Mode: 'webgl' (Three.js 3D) vs 'schematic' (Vector Blueprint)
  const [twinMode, setTwinMode] = useState<'webgl' | 'schematic'>('webgl');

  // 3D View mode toggle: 'isometric' vs 'ortho'
  const [viewMode, setViewMode] = useState<'isometric' | 'ortho'>('isometric');

  // Weather Particle System State
  const [weather, setWeather] = useState<WeatherMode>('CLEAR');

  // Live Aerial Drone Recon Feed Dock
  const [showAerialFeed, setShowAerialFeed] = useState<boolean>(true);
  const [aerialFeedExpanded, setAerialFeedExpanded] = useState<boolean>(false);

  // Layer filters
  const [showSchools, setShowSchools] = useState(true);
  const [showHospitals, setShowHospitals] = useState(true);
  const [showEmergency, setShowEmergency] = useState(true);
  const [showTransit, setShowTransit] = useState(true);
  const [showUtilities, setShowUtilities] = useState(true);
  const [showGreen, setShowGreen] = useState(true);

  const [selectedZone, setSelectedZone] = useState<ZoneEntity | null>(null);
  const [focalPoint, setFocalPoint] = useState<MapFocalPoint | null>(null);
  const [isPickMode, setIsPickMode] = useState<boolean>(false);
  const [radiusKm, setRadiusKm] = useState<number>(1.0);

  const zones = entities.filter(e => e.type === 'ZONE') as ZoneEntity[];
  const facilities = entities.filter(e => e.type === 'FACILITY') as FacilityEntity[];
  const emergencyStations = entities.filter(e => e.type === 'EMERGENCY_SERVICE');
  const envAssets = entities.filter(e => e.type === 'ENVIRONMENT');

  const citizensCount = entities.filter(e => e.type === 'CITIZEN').length;
  const hhdCount = entities.filter(e => e.type === 'HOUSEHOLD').length;
  const orgCount = entities.filter(e => e.type === 'ORGANIZATION').length;
  const facCount = facilities.length;
  const infraCount = entities.filter(e => e.type === 'INFRASTRUCTURE').length;

  const activeZoneEntity = zones.find(z => z.id === activeScenario?.zoneId);
  const latestReport = simulationReports[0] || null;

  // Handle Pick on Map coordinates
  const handlePickCoordinates = (x: number, y: number) => {
    retroAudio.play('INFO');
    let closestZone = zones[0];
    let minD = 999999;
    zones.forEach(z => {
      const d = Math.hypot(z.coordinates.x - x, z.coordinates.y - y);
      if (d < minD) {
        minD = d;
        closestZone = z;
      }
    });

    const nearestFacility = facilities.find(f => Math.hypot(f.coordinates.x - x, f.coordinates.y - y) < 40);
    const radiusUnits = radiusKm * 50;
    const facilitiesNearby = facilities.filter(f => Math.hypot(f.coordinates.x - x, f.coordinates.y - y) <= radiusUnits).length;
    const baseDensity = closestZone?.densityPerSqKm || 11000;
    const estimatedPop = Math.min(
      Math.round(baseDensity * Math.PI * Math.pow(radiusKm, 2) * 0.75),
      closestZone?.totalPopulation || 40000
    );

    let minEta = 3.2;
    if (emergencyStations.length > 0) {
      let minStationDist = 999999;
      emergencyStations.forEach(s => {
        const d = Math.hypot(s.coordinates.x - x, s.coordinates.y - y);
        if (d < minStationDist) minStationDist = d;
      });
      minEta = Number((2.5 + (minStationDist / 120) * 3.8).toFixed(1));
    }

    const newFocal: MapFocalPoint = {
      id: `PIN-${Date.now()}`,
      name: nearestFacility ? nearestFacility.name : `Grid Focal Pin [${x}, ${y}]`,
      type: nearestFacility ? 'FACILITY' : 'COORDINATE_PIN',
      categoryLabel: nearestFacility ? nearestFacility.category.toUpperCase() : 'CUSTOM PIN',
      coordinates: { x, y },
      zoneId: closestZone?.id,
      zoneName: closestZone?.name,
      description: nearestFacility
        ? `${nearestFacility.facilityType} in ${closestZone?.name}`
        : `Custom pinpoint coordinate focal location in ${closestZone?.name}`,
      radiusKm,
      entityId: nearestFacility?.id || closestZone?.id,
      stats: {
        populationNearby: estimatedPop,
        density: baseDensity,
        floodRisk: closestZone?.floodVulnerability || 'LOW',
        greenCoveragePct: closestZone?.greenCoveragePct || 20,
        criticalFacilitiesNearby: Math.max(1, facilitiesNearby),
        emergencyEtaMinutes: minEta,
        noiseDecibels: 60,
      },
      themeColor: nearestFacility ? '#f43f5e' : '#f59e0b',
    };

    setFocalPoint(newFocal);
    if (closestZone) setSelectedZone(closestZone);
    setIsPickMode(false);
  };

  const handleSelectZoneAndFocus = (z: ZoneEntity) => {
    setSelectedZone(z);
    const radiusUnits = radiusKm * 50;
    const facilitiesNearby = facilities.filter(f => Math.hypot(f.coordinates.x - z.coordinates.x, f.coordinates.y - z.coordinates.y) <= radiusUnits).length;
    const estimatedPop = Math.min(
      Math.round(z.densityPerSqKm * Math.PI * Math.pow(radiusKm, 2) * 0.75),
      z.totalPopulation
    );
    setFocalPoint({
      id: z.id,
      name: z.name,
      type: 'ZONE',
      categoryLabel: 'DISTRICT',
      coordinates: { ...z.coordinates },
      zoneId: z.id,
      zoneName: z.name,
      description: `${z.landUseClassification} District · Pop: ${z.totalPopulation.toLocaleString()} · Density: ${z.densityPerSqKm.toLocaleString()}/km²`,
      radiusKm,
      entityId: z.id,
      stats: {
        populationNearby: estimatedPop,
        density: z.densityPerSqKm,
        floodRisk: z.floodVulnerability,
        greenCoveragePct: z.greenCoveragePct,
        criticalFacilitiesNearby: Math.max(1, facilitiesNearby),
        emergencyEtaMinutes: 3.4,
        noiseDecibels: z.landUseClassification === 'COMMERCIAL' ? 68 : 55,
      },
      themeColor: z.landUseClassification === 'COMMERCIAL' ? '#38bdf8' : z.landUseClassification === 'CIVIC' ? '#fbbf24' : '#818cf8',
    });
  };

  const handleResetOverview = () => {
    setFocalPoint(null);
    setSelectedZone(null);
    setIsPickMode(false);
  };

  return (
    <div className="space-y-5 select-none font-sans">
      {/* 0. Command Centre C4ISR Tactical Operations Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-slate-950/90 border border-cyan-500/30 text-xs font-mono shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            DEFCON 4 · MUNICIPAL NOMINAL
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">
            SECTOR: <span className="text-cyan-400 font-bold">ALPHA-METRO-01</span>
          </span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-slate-300 hidden sm:inline">
            COORDINATES: <span className="text-white">42°21'36"N 71°03'42"W</span>
          </span>
        </div>

        <div className="flex items-center gap-3 text-slate-400">
          <span className="flex items-center gap-1.5 text-cyan-300">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>SAT-UPLINK: LOCKED</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400">
            ATMOSPHERE: {weather}
          </span>
        </div>
      </div>

      {/* 1. Active Proposal Hero Banner: Cinematic 3D Glass Surface */}
      {activeScenario && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-cyan-950/40 border border-cyan-500/30 p-5 shadow-[0_20px_50px_-15px_rgba(6,182,212,0.25)] backdrop-blur-xl">
          {/* Ambient Top Glow */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />
          <div className="absolute -top-24 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold text-[11px] tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  ACTIVE REDEVELOPMENT INITIATIVE
                </span>
                <span className="text-slate-500">·</span>
                <span className="font-mono font-semibold text-amber-300">{activeScenario.id}</span>
                <span className="text-slate-500">·</span>
                <span className="text-white font-medium">{activeZoneEntity?.name || activeScenario.zoneId}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-white drop-shadow-md">
                {activeScenario.title}
              </h2>
              <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed font-normal">
                {activeScenario.description}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={onOpenScenarioLab}
                className="btn-3d-secondary px-4 py-2.5 text-xs text-slate-200 hover:text-white"
              >
                SELECT PROPOSAL
              </button>
              <button
                onClick={() => {
                  runSimulation(activeScenario.id);
                  onOpenImpactAnalysis();
                }}
                disabled={isSimulating}
                className="btn-3d-primary px-5 py-2.5 text-xs flex items-center gap-2 shadow-[0_8px_25px_-4px_rgba(6,182,212,0.5)] disabled:opacity-50"
              >
                {isSimulating ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin text-slate-900" />
                    <span>SIMULATING IN 3D...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-900" />
                    <span>LAUNCH MULTI-AGENT AUDIT</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Real-Time Urban Telemetry Strip: 3D Frosted Glass Deck */}
      <div className="relative overflow-hidden rounded-xl bg-slate-900/70 border border-white/10 p-4 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.6)] backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-semibold text-white tracking-wide">
                SPATIAL URBAN TELEMETRY MONITOR
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {thresholdStatuses.filter(t => t.status === 'CRITICAL').length > 0 ? (
                <span className="text-rose-400 font-semibold inline-flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {thresholdStatuses.filter(t => t.status === 'CRITICAL').length} Critical Urban Boundary Breached
                </span>
              ) : thresholdStatuses.filter(t => t.status === 'WARNING').length > 0 ? (
                <span className="text-amber-400 font-semibold">
                  ⚠ {thresholdStatuses.filter(t => t.status === 'WARNING').length} Urban Indicators Approaching Threshold Limits
                </span>
              ) : (
                <span className="text-emerald-400 font-medium">
                  ✓ All 7 Municipal Safety Indices Operating Nominally
                </span>
              )}
              <span className="text-slate-500 ml-2 hidden md:inline">
                · Continuous 3D spatial telemetry across healthcare, grid load, transit friction, and watershed drainage.
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => triggerIncident('HOSPITAL_SURGE')}
            className="btn-3d-secondary px-3 py-2 text-xs text-rose-300 hover:text-white border-rose-500/30 hover:border-rose-500/60"
            title="Trigger synthetic emergency admissions breach"
          >
            <Zap className="w-3.5 h-3.5 text-rose-400 mr-1.5" />
            <span>TEST CRISIS ALERT</span>
          </button>

          <button
            onClick={() => setIsNotificationCenterOpen(true)}
            className="btn-3d-secondary px-3.5 py-2 text-xs text-cyan-300 hover:text-white border-cyan-500/30 hover:border-cyan-500/60"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400 mr-1.5" />
            <span>VIEW 7 THRESHOLD GAUGES</span>
          </button>
        </div>
      </div>

      {/* 3. KPI Metrics Strip: 3D Tilt Cards with Depth */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'RESIDENTS', val: citizensCount, sub: `${hhdCount} Households`, color: 'from-cyan-500/20 to-transparent border-cyan-500/30 text-cyan-400', icon: Users },
          { label: 'COMMERCE', val: orgCount, sub: '11 Industry Sectors', color: 'from-indigo-500/20 to-transparent border-indigo-500/30 text-indigo-400', icon: Building2 },
          { label: 'CIVIC HUBS', val: facCount, sub: 'Health, Ed & Transit', color: 'from-rose-500/20 to-transparent border-rose-500/30 text-rose-400', icon: Activity },
          { label: 'INFRASTRUCTURE', val: infraCount, sub: 'Power, Water & Rail', color: 'from-amber-500/20 to-transparent border-amber-500/30 text-amber-400', icon: Zap },
          { label: 'ECO ASSETS', val: envAssets.length, sub: 'Canopy & Wetlands', color: 'from-emerald-500/20 to-transparent border-emerald-500/30 text-emerald-400', icon: Trees },
          { label: 'PLANNING ZONES', val: zones.length, sub: '12 Urban Districts', color: 'from-blue-500/20 to-transparent border-blue-500/30 text-blue-400', icon: Layers },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`relative overflow-hidden rounded-xl bg-gradient-to-b ${kpi.color.split(' ')[0]} ${kpi.color.split(' ')[1]} bg-slate-900/80 border ${kpi.color.split(' ')[2]} p-3.5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.7)]`}
            >
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-300 font-display">
                  {kpi.label}
                </span>
                <Icon className={`w-3.5 h-3.5 ${kpi.color.split(' ')[3]}`} />
              </div>
              <div className="text-xl font-display font-bold tracking-tight text-white">
                {kpi.val.toLocaleString()}
              </div>
              <div className="text-xs text-slate-400 mt-0.5 font-normal">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* 4. Main 3D Isometric Urban Simulator & District Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* 3D Isometric Viewport Container (3 cols) */}
        <div className="lg:col-span-3 rounded-2xl bg-gradient-to-b from-[#0a1020] to-[#040813] border border-cyan-500/20 p-4 flex flex-col space-y-3.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-xl relative overflow-hidden">
          {/* Subtle 3D Horizon Grid Background Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(14,165,233,0.08)_0%,transparent_60%)] pointer-events-none" />

          {/* Viewport Header Controls Bar */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span className="font-display font-bold text-sm text-white tracking-wide">
                  METROPOLITAN DIGITAL TWIN
                </span>
              </div>

              {/* Engine Switcher */}
              <div className="flex items-center bg-slate-950/90 p-0.5 rounded-xl border border-white/10 shadow-inner">
                <button
                  onClick={() => setTwinMode('webgl')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                    twinMode === 'webgl'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Real-Time 3D WebGL Digital Twin"
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>3D WEBGL ENGINE</span>
                </button>
                <button
                  onClick={() => setTwinMode('schematic')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                    twinMode === 'schematic'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Architectural Vector Blueprint"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>BLUEPRINT SCHEMATIC</span>
                </button>
              </div>

              {/* Weather Particle Toggle Controls */}
              <div className="flex items-center bg-slate-950/90 p-0.5 rounded-xl border border-white/10 shadow-inner">
                <span className="px-2 text-[10px] text-slate-400 font-mono hidden xl:inline">ATMOSPHERE:</span>
                {(['CLEAR', 'RAIN', 'FOG', 'STORM'] as WeatherMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setWeather(mode)}
                    className={`px-2 py-1 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-all ${
                      weather === mode
                        ? mode === 'CLEAR'
                          ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
                          : mode === 'RAIN'
                          ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-sm'
                          : mode === 'FOG'
                          ? 'bg-slate-400/25 text-slate-200 border border-slate-400/40 shadow-sm'
                          : 'bg-rose-500/25 text-rose-300 border border-rose-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {mode === 'CLEAR' && 'CLEAR'}
                    {mode === 'RAIN' && (
                      <>
                        <CloudRain className="w-3 h-3 text-cyan-400" />
                        <span>RAIN</span>
                      </>
                    )}
                    {mode === 'FOG' && (
                      <>
                        <CloudFog className="w-3 h-3 text-slate-300" />
                        <span>FOG</span>
                      </>
                    )}
                    {mode === 'STORM' && (
                      <>
                        <Zap className="w-3 h-3 text-rose-400" />
                        <span>STORM</span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAerialFeed(!showAerialFeed)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all border ${
                  showAerialFeed
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white'
                }`}
                title="Toggle High-Altitude Drone Recon Feed"
              >
                <Video className={`w-3.5 h-3.5 ${showAerialFeed ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
                <span>UAV RECON FEED</span>
                {showAerialFeed && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />}
              </button>
            </div>

            {/* If Schematic, show 2D/3D and layer toggles */}
            {twinMode === 'schematic' && (
              <div className="w-full flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                {/* 3D / Ortho Switcher */}
                <div className="flex items-center bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setViewMode('isometric')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
                      viewMode === 'isometric'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="3D Isometric Projection"
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>3D ISOMETRIC</span>
                  </button>
                  <button
                    onClick={() => setViewMode('ortho')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
                      viewMode === 'ortho'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="2D Overhead Orthographic View"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>TOP-DOWN</span>
                  </button>
                </div>

                {/* Layer Toggles */}
                <div className="flex items-center gap-1 text-xs">
                  <button
                    onClick={() => setShowSchools(!showSchools)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${
                      showSchools ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-sm' : 'bg-slate-900/60 text-slate-500 border-slate-800'
                    }`}
                  >
                    Schools
                  </button>
                  <button
                    onClick={() => setShowHospitals(!showHospitals)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${
                      showHospitals ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm' : 'bg-slate-900/60 text-slate-500 border-slate-800'
                    }`}
                  >
                    Hospitals
                  </button>
                  <button
                    onClick={() => setShowEmergency(!showEmergency)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${
                      showEmergency ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm' : 'bg-slate-900/60 text-slate-500 border-slate-800'
                    }`}
                  >
                    Emergency
                  </button>
                  <button
                    onClick={() => setShowTransit(!showTransit)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${
                      showTransit ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm' : 'bg-slate-900/60 text-slate-500 border-slate-800'
                    }`}
                  >
                    Transit
                  </button>
                  <button
                    onClick={() => setShowGreen(!showGreen)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${
                      showGreen ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm' : 'bg-slate-900/60 text-slate-500 border-slate-800'
                    }`}
                  >
                    Canopy
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Location Selection Layer: Choose location to base map around */}
          <LocationInteractionLayer
            entities={entities}
            focalPoint={focalPoint}
            onSelectFocalPoint={focal => {
              setFocalPoint(focal);
              if (focal?.zoneId) {
                const z = zones.find(zn => zn.id === focal.zoneId);
                if (z) setSelectedZone(z);
              }
            }}
            isPickMode={isPickMode}
            onTogglePickMode={setIsPickMode}
            radiusKm={radiusKm}
            onChangeRadiusKm={setRadiusKm}
            onResetOverview={handleResetOverview}
          />

          {/* Real-Time 3D WebGL Digital Twin or Blueprint Schematic */}
          {twinMode === 'webgl' ? (
            <div className="relative w-full overflow-hidden rounded-xl">
              <CinematicCity3D
                selectedZoneId={selectedZone?.id}
                onSelectZone={handleSelectZoneAndFocus}
                onSelectEntity={setSelectedEntityId}
                focalPoint={focalPoint}
                isPickMode={isPickMode}
                onPickCoordinates={handlePickCoordinates}
                radiusKm={radiusKm}
              />
              {/* Weather Particle System (Rain, Fog, Storm) */}
              <WeatherParticleSystem weather={weather} />
            </div>
          ) : (
            <div className={`relative w-full aspect-[16/10] bg-[#070d18] rounded-xl border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center select-none perspective-container ${isPickMode ? 'cursor-crosshair' : ''}`}>
              {/* Weather Particle System (Rain, Fog, Storm) */}
              <WeatherParticleSystem weather={weather} />

              {/* Cinematic Camera Stage */}
            <div
              className={`w-full h-full relative transition-transform duration-700 ease-out origin-center ${
                viewMode === 'isometric' ? 'isometric-map-stage' : 'isometric-map-stage-flat'
              }`}
            >
              <svg
                viewBox={
                  focalPoint
                    ? (() => {
                        const spanW = Math.max(340, Math.min(1000, 260 + radiusKm * 260));
                        const spanH = spanW * (780 / 1000);
                        const minX = Math.max(0, Math.min(1000 - spanW, focalPoint.coordinates.x - spanW / 2));
                        const minY = Math.max(0, Math.min(780 - spanH, focalPoint.coordinates.y - spanH / 2));
                        return `${minX} ${minY} ${spanW} ${spanH}`;
                      })()
                    : '0 0 1000 780'
                }
                className={`w-full h-full overflow-visible transition-all duration-700 ease-out ${isPickMode ? 'cursor-crosshair' : ''}`}
                xmlns="http://www.w3.org/2000/svg"
                onClick={e => {
                  if (isPickMode) {
                    const svg = e.currentTarget;
                    const pt = svg.createSVGPoint();
                    pt.x = e.clientX;
                    pt.y = e.clientY;
                    const ctm = svg.getScreenCTM();
                    if (ctm) {
                      const svgP = pt.matrixTransform(ctm.inverse());
                      const x = Math.round(Math.max(20, Math.min(980, svgP.x)));
                      const y = Math.round(Math.max(20, Math.min(760, svgP.y)));
                      handlePickCoordinates(x, y);
                    }
                  }
                }}
              >
                <defs>
                  {/* Subtle 3D Topographical Grid */}
                  <pattern id="modernGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <circle cx="0" cy="0" r="1.5" fill="rgba(56,189,248,0.15)" />
                  </pattern>

                  {/* Shimmering Reflective Water Gradient */}
                  <linearGradient id="riverWater" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.85" />
                    <stop offset="50%" stopColor="#0369a1" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#082f49" stopOpacity="0.95" />
                  </linearGradient>

                  {/* Volumetric Beacon Radial Gradient for Active Scenario */}
                  <radialGradient id="activeBeaconGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
                    <stop offset="40%" stopColor="#0284c7" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#0369a1" stopOpacity="0" />
                  </radialGradient>

                  {/* 3D Drop Shadows */}
                  <filter id="shadow3d" x="-20%" y="-20%" width="150%" height="150%">
                    <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#000000" floodOpacity="0.75" />
                  </filter>
                  <filter id="glow3d" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Ground Base Terrain Field */}
                <rect width="1000" height="780" fill="#080e1a" />
                <rect width="1000" height="780" fill="url(#modernGrid)" />

                {/* S-Curve River / Deep Water Channel with Shimmer and Depth */}
                <path
                  d="M 300 0 C 330 180, 240 320, 220 480 C 200 620, 260 720, 280 780"
                  fill="none"
                  stroke="#021424"
                  strokeWidth="58"
                  strokeLinecap="round"
                />
                <path
                  d="M 300 0 C 330 180, 240 320, 220 480 C 200 620, 260 720, 280 780"
                  fill="none"
                  stroke="url(#riverWater)"
                  strokeWidth="44"
                  strokeLinecap="round"
                />
                <path
                  d="M 300 0 C 330 180, 240 320, 220 480 C 200 620, 260 720, 280 780"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3"
                  strokeOpacity="0.6"
                  strokeDasharray="20 15"
                />

                {/* Elevated Neon Transit & Expressway Arterials */}
                <g filter="url(#shadow3d)">
                  {/* East-West Expressway Corridor */}
                  <line x1="80" y1="280" x2="920" y2="280" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
                  <line x1="80" y1="280" x2="920" y2="280" stroke="#0ea5e9" strokeWidth="2.5" strokeDasharray="16 10" />

                  {/* South Beltway Corridor */}
                  <line x1="80" y1="520" x2="920" y2="520" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
                  <line x1="80" y1="520" x2="920" y2="520" stroke="#0ea5e9" strokeWidth="2.5" strokeDasharray="16 10" />

                  {/* North-South Rapid Rail Spine */}
                  <line x1="480" y1="40" x2="480" y2="740" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
                  <line x1="480" y1="40" x2="480" y2="740" stroke="#38bdf8" strokeWidth="3" strokeDasharray="24 12" />
                </g>

                {/* 3D District Platforms & Extruded City Blocks */}
                {zones.map(z => {
                  const isActive = activeScenario?.zoneId === z.id;
                  const isSelected = selectedZone?.id === z.id;

                  // Architectural land-use color schemes
                  let baseFill = '#0f172a';
                  let wallFill = '#090d16';
                  let borderStroke = 'rgba(255,255,255,0.15)';
                  let towerCount = 3;
                  let towerHeight = 28;

                  if (z.landUseClassification === 'COMMERCIAL') {
                    baseFill = '#1e1b4b';
                    wallFill = '#110e2e';
                    borderStroke = '#818cf8';
                    towerCount = 5;
                    towerHeight = 44; // Skyscrapers
                  } else if (z.landUseClassification === 'RESIDENTIAL') {
                    baseFill = '#082f49';
                    wallFill = '#041d2e';
                    borderStroke = '#38bdf8';
                    towerCount = 4;
                    towerHeight = 24;
                  } else if (z.landUseClassification === 'CIVIC') {
                    baseFill = '#451a03';
                    wallFill = '#290f02';
                    borderStroke = '#fbbf24';
                    towerCount = 2;
                    towerHeight = 20;
                  } else if (z.landUseClassification === 'INDUSTRIAL') {
                    baseFill = '#1e293b';
                    wallFill = '#0f172a';
                    borderStroke = '#94a3b8';
                    towerCount = 3;
                    towerHeight = 16;
                  } else if (z.landUseClassification === 'ECOLOGICAL') {
                    baseFill = '#064e3b';
                    wallFill = '#022c22';
                    borderStroke = '#34d399';
                    towerCount = 1;
                    towerHeight = 12;
                  }

                  if (isSelected) {
                    borderStroke = '#f59e0b';
                  }
                  if (isActive) {
                    borderStroke = '#38bdf8';
                  }

                  // Extrusion 3D offset for isometric height
                  const extrudeY = viewMode === 'isometric' ? towerHeight : 0;

                  return (
                    <g
                      key={z.id}
                      className="cursor-pointer transition-all duration-300 group"
                      onClick={() => setSelectedZone(z)}
                    >
                      {/* Active Holographic Beacon Aura */}
                      {isActive && (
                        <circle
                          cx={z.coordinates.x}
                          cy={z.coordinates.y}
                          r={Math.max(z.bounds.width, z.bounds.height) * 0.85}
                          fill="url(#activeBeaconGlow)"
                          className="animate-pulse"
                        />
                      )}

                      {/* District Base Ground Pedestal */}
                      <rect
                        x={z.bounds.x}
                        y={z.bounds.y}
                        width={z.bounds.width}
                        height={z.bounds.height}
                        rx="8"
                        fill={wallFill}
                        stroke={borderStroke}
                        strokeWidth={isActive ? '3' : isSelected ? '2.5' : '1'}
                        filter="url(#shadow3d)"
                      />

                      {/* 3D Extruded Top Face (Elevated Platform) */}
                      <rect
                        x={z.bounds.x}
                        y={z.bounds.y - (viewMode === 'isometric' ? 6 : 0)}
                        width={z.bounds.width}
                        height={z.bounds.height}
                        rx="8"
                        fill={baseFill}
                        fillOpacity="0.85"
                        stroke={borderStroke}
                        strokeWidth={isActive ? '2' : '1'}
                        className="group-hover:fill-opacity-100 transition-all"
                      />

                      {/* 3D Extruded Architectural Tower Blocks inside zone */}
                      {viewMode === 'isometric' && (
                        <g>
                          {/* Tower 1 (Center-Left) */}
                          <g transform={`translate(${z.bounds.x + 20}, ${z.bounds.y + 25})`}>
                            {/* Front Wall */}
                            <rect x="0" y={-extrudeY} width="22" height={extrudeY} fill="#1e293b" stroke="#334155" strokeWidth="0.5" />
                            {/* Roof Face */}
                            <polygon
                              points={`0,${-extrudeY} 10,${-extrudeY - 6} 32,${-extrudeY - 6} 22,${-extrudeY}`}
                              fill="#38bdf8"
                              fillOpacity={isActive ? "0.9" : "0.5"}
                            />
                            {/* Illuminated Window Matrix */}
                            <line x1="6" y1={-extrudeY + 4} x2="16" y2={-extrudeY + 4} stroke="#bae6fd" strokeWidth="1.5" />
                            <line x1="6" y1={-extrudeY + 10} x2="16" y2={-extrudeY + 10} stroke="#bae6fd" strokeWidth="1.5" />
                          </g>

                          {/* Tower 2 (Center-Right if Commercial/Dense) */}
                          {towerCount >= 3 && (
                            <g transform={`translate(${z.bounds.x + z.bounds.width - 45}, ${z.bounds.y + 35})`}>
                              <rect x="0" y={-extrudeY * 0.8} width="26" height={extrudeY * 0.8} fill="#0f172a" stroke="#334155" strokeWidth="0.5" />
                              <polygon
                                points={`0,${-extrudeY * 0.8} 10,${-extrudeY * 0.8 - 6} 36,${-extrudeY * 0.8 - 6} 26,${-extrudeY * 0.8}`}
                                fill="#818cf8"
                                fillOpacity="0.6"
                              />
                            </g>
                          )}
                        </g>
                      )}

                      {/* Sleek Modern District Tag Badge */}
                      <g transform={`translate(${z.bounds.x + 8}, ${z.bounds.y + (viewMode === 'isometric' ? -14 : 6)})`}>
                        <rect
                          x="0"
                          y="0"
                          width={z.bounds.width - 16}
                          height="22"
                          rx="4"
                          fill="#050811"
                          fillOpacity="0.85"
                          stroke="rgba(255,255,255,0.15)"
                        />
                        <text
                          x="8"
                          y="15"
                          className="font-mono text-[10px] font-bold fill-cyan-300 pointer-events-none"
                        >
                          {z.code}
                        </text>
                        <text
                          x="60"
                          y="15"
                          className="font-sans text-[11px] font-medium fill-slate-200 pointer-events-none"
                        >
                          {z.name.length > 20 ? z.name.slice(0, 18) + '…' : z.name}
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* Ecological Canopy Trees & Parks */}
                {showGreen &&
                  envAssets.map(env => (
                    <g
                      key={env.id}
                      className="cursor-pointer hover:scale-125 transition-transform"
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedEntityId(env.id);
                      }}
                      transform={`translate(${env.coordinates.x}, ${env.coordinates.y})`}
                    >
                      <circle cx="0" cy="0" r="8" fill="#10b981" fillOpacity="0.2" />
                      <circle cx="0" cy="-2" r="5" fill="#10b981" stroke="#059669" strokeWidth="1" />
                      <title>{`${env.name} (${env.environmentalType})`}</title>
                    </g>
                  ))}

                {/* Civic Facilities: Modern 3D Holographic Location Pins */}
                {facilities.map(fac => {
                  let renderThis = false;
                  let pinColor = '#38bdf8';
                  let symbol = 'F';

                  if (fac.category === 'education' && showSchools) {
                    renderThis = true;
                    pinColor = '#3b82f6';
                    symbol = 'E'; // Education
                  } else if (fac.category === 'healthcare' && showHospitals) {
                    renderThis = true;
                    pinColor = '#f43f5e';
                    symbol = 'H'; // Healthcare
                  } else if (fac.category === 'transport' && showTransit) {
                    renderThis = true;
                    pinColor = '#06b6d4';
                    symbol = 'T'; // Transit
                  } else if (fac.category === 'utilities' && showUtilities) {
                    renderThis = true;
                    pinColor = '#a855f7';
                    symbol = 'U'; // Utility
                  } else if (fac.category === 'community' && showGreen) {
                    renderThis = true;
                    pinColor = '#10b981';
                    symbol = 'C'; // Community
                  }

                  if (!renderThis) return null;

                  return (
                    <g
                      key={fac.id}
                      className="cursor-pointer hover:scale-125 transition-transform"
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedEntityId(fac.id);
                      }}
                      transform={`translate(${fac.coordinates.x}, ${fac.coordinates.y - (viewMode === 'isometric' ? 16 : 0)})`}
                      filter="url(#shadow3d)"
                    >
                      {/* 3D Pin Head */}
                      <circle cx="0" cy="-6" r="9" fill={pinColor} stroke="#ffffff" strokeWidth="1.5" />
                      <text
                        x="0"
                        y="-3"
                        textAnchor="middle"
                        className="font-display text-[9px] font-bold fill-white pointer-events-none"
                      >
                        {symbol}
                      </text>
                      {/* Pin Stem */}
                      <line x1="0" y1="3" x2="0" y2="10" stroke={pinColor} strokeWidth="2" strokeLinecap="round" />
                      <circle cx="0" cy="10" r="2.5" fill="#ffffff" />
                      <title>{`${fac.name} (${fac.facilityType}) - Utilization: ${fac.currentUtilizationPct}%`}</title>
                    </g>
                  );
                })}

                {/* Emergency Services */}
                {showEmergency &&
                  emergencyStations.map(srv => (
                    <g
                      key={srv.id}
                      className="cursor-pointer hover:scale-125 transition-transform"
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedEntityId(srv.id);
                      }}
                      transform={`translate(${srv.coordinates.x}, ${srv.coordinates.y - (viewMode === 'isometric' ? 16 : 0)})`}
                      filter="url(#shadow3d)"
                    >
                      <polygon
                        points="0,-12 9,0 0,12 -9,0"
                        fill="#f59e0b"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        className="font-display text-[8px] font-bold fill-slate-950 pointer-events-none"
                      >
                        !
                      </text>
                      <title>{`${srv.name} (${srv.subType})`}</title>
                    </g>
                  ))}

                {/* 3D Dynamic Focal Point Target Reticle & Radar Rings */}
                {focalPoint && (
                  <g className="pointer-events-none">
                    {/* Concentric Pulsing Radar Area */}
                    <circle
                      cx={focalPoint.coordinates.x}
                      cy={focalPoint.coordinates.y}
                      r={Math.max(20, radiusKm * 50)}
                      fill={focalPoint.themeColor || '#38bdf8'}
                      fillOpacity="0.12"
                      stroke={focalPoint.themeColor || '#38bdf8'}
                      strokeWidth="2"
                      strokeDasharray="6 4"
                      className="animate-pulse"
                    />
                    <circle
                      cx={focalPoint.coordinates.x}
                      cy={focalPoint.coordinates.y}
                      r={Math.max(12, radiusKm * 25)}
                      fill="none"
                      stroke={focalPoint.themeColor || '#38bdf8'}
                      strokeWidth="1.2"
                      opacity="0.5"
                    />

                    {/* Concentric Rotating Sonar Ring */}
                    <circle
                      cx={focalPoint.coordinates.x}
                      cy={focalPoint.coordinates.y}
                      r="8"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <circle
                      cx={focalPoint.coordinates.x}
                      cy={focalPoint.coordinates.y}
                      r="3.5"
                      fill={focalPoint.themeColor || '#38bdf8'}
                    />

                    {/* Crosshairs */}
                    <line
                      x1={focalPoint.coordinates.x - 22}
                      y1={focalPoint.coordinates.y}
                      x2={focalPoint.coordinates.x + 22}
                      y2={focalPoint.coordinates.y}
                      stroke={focalPoint.themeColor || '#38bdf8'}
                      strokeWidth="2"
                    />
                    <line
                      x1={focalPoint.coordinates.x}
                      y1={focalPoint.coordinates.y - 22}
                      x2={focalPoint.coordinates.x}
                      y2={focalPoint.coordinates.y + 22}
                      stroke={focalPoint.themeColor || '#38bdf8'}
                      strokeWidth="2"
                    />

                    {/* Floating Tactical Tag Badge */}
                    <g transform={`translate(${focalPoint.coordinates.x + 10}, ${focalPoint.coordinates.y - 28})`}>
                      <rect
                        x="0"
                        y="0"
                        width={Math.max(120, focalPoint.name.length * 6.5 + 24)}
                        height="20"
                        rx="4"
                        fill="#020617"
                        fillOpacity="0.95"
                        stroke={focalPoint.themeColor || '#38bdf8'}
                        strokeWidth="1.2"
                      />
                      <circle cx="8" cy="10" r="3" fill={focalPoint.themeColor || '#38bdf8'} />
                      <text
                        x="16"
                        y="14"
                        fill="#ffffff"
                        fontSize="10"
                        fontFamily="sans-serif"
                        fontWeight="bold"
                      >
                        {focalPoint.name.length > 22 ? focalPoint.name.slice(0, 20) + '…' : focalPoint.name}
                      </text>
                    </g>
                  </g>
                )}
              </svg>

              {/* Floating 3D Map Legend HUD */}
              <div className="absolute bottom-3 left-3 rounded-lg bg-slate-950/80 border border-white/10 px-3.5 py-2 text-xs text-slate-300 backdrop-blur-md shadow-lg flex items-center gap-3.5">
                <span className="flex items-center gap-1.5 text-rose-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" /> Hospitals
                </span>
                <span className="flex items-center gap-1.5 text-blue-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" /> Schools
                </span>
                <span className="flex items-center gap-1.5 text-cyan-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" /> Transit Hubs
                </span>
                <span className="flex items-center gap-1.5 text-amber-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" /> Emergency
                </span>
                <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" /> Eco Reserves
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

        {/* District Spatial Inspector & Audit Status (1 col) */}
        <div className="space-y-4">
          {/* Live Aerial Drone Reconnaissance Feed */}
          {showAerialFeed && (
            <LiveAerialFeed
              isCompact={!aerialFeedExpanded}
              onExpandToggle={() => setAerialFeedExpanded(!aerialFeedExpanded)}
              focalPoint={focalPoint}
            />
          )}

          {/* Selected Location / District Card: Cinematic 3D Glass Surface */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-700/60 p-4 space-y-3.5 shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="font-mono text-xs text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                {focalPoint ? focalPoint.categoryLabel : selectedZone ? selectedZone.code : activeZoneEntity?.code || 'ZONE-001'}
              </span>
              <span className="text-[11px] font-semibold text-cyan-300 tracking-wide font-display">
                {focalPoint ? (focalPoint.zoneName || 'FOCAL TARGET') : selectedZone ? selectedZone.landUseClassification : activeZoneEntity?.landUseClassification}
              </span>
            </div>

            <div>
              <h3 className="font-display text-base font-bold text-white tracking-tight leading-snug">
                {focalPoint ? focalPoint.name : selectedZone ? selectedZone.name : activeZoneEntity?.name || 'Selected Metro District'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {focalPoint ? focalPoint.description : 'Target Zone Infrastructure & Demographics'}
              </p>
            </div>

            <div className="space-y-2.5 text-xs border-t border-slate-800 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">
                  {focalPoint ? `Population (${radiusKm}km):` : 'Total Population:'}
                </span>
                <span className="font-mono font-bold text-white">
                  {(focalPoint ? focalPoint.stats.populationNearby : (selectedZone || activeZoneEntity)?.totalPopulation || 0).toLocaleString()} residents
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Density per km²:</span>
                <span className="font-mono font-semibold text-slate-200">
                  {(focalPoint ? focalPoint.stats.density : (selectedZone || activeZoneEntity)?.densityPerSqKm || 0).toLocaleString()} / km²
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Flood Hazard:</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                    (focalPoint ? focalPoint.stats.floodRisk : (selectedZone || activeZoneEntity)?.floodVulnerability) === 'HIGH'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {(focalPoint ? focalPoint.stats.floodRisk : (selectedZone || activeZoneEntity)?.floodVulnerability || 'LOW')} RISK
                </span>
              </div>

              {focalPoint ? (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Emergency ETA:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {focalPoint.stats.emergencyEtaMinutes} min
                  </span>
                </div>
              ) : null}

              {/* Canopy Progress Meter */}
              <div className="pt-1.5 space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Green Canopy Cover</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {(focalPoint ? focalPoint.stats.greenCoveragePct : (selectedZone || activeZoneEntity)?.greenCoveragePct || 0)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${focalPoint ? focalPoint.stats.greenCoveragePct : (selectedZone || activeZoneEntity)?.greenCoveragePct || 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex gap-2">
              <button
                onClick={() => {
                  const targetId = focalPoint?.entityId || selectedZone?.id || activeZoneEntity?.id;
                  if (targetId) setSelectedEntityId(targetId);
                }}
                className="btn-3d-secondary flex-1 py-2 text-xs text-cyan-300 hover:text-white"
              >
                INSPECT DOSSIER
              </button>
              {focalPoint && (
                <button
                  onClick={handleResetOverview}
                  className="btn-3d-secondary px-3 py-2 text-xs text-slate-400 hover:text-white"
                  title="Reset to City Overview"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Recent Multi-Agent Simulation Dossier Card */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-amber-950/20 border border-amber-500/30 p-4 space-y-3 shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
              <span className="font-display text-xs font-bold text-amber-300 tracking-wide">
                EXECUTIVE IMPACT DOSSIER
              </span>
              {latestReport && (
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  READY
                </span>
              )}
            </div>

            {latestReport ? (
              <div className="space-y-2.5 text-xs">
                <p className="font-display font-semibold text-sm text-white line-clamp-1">
                  {latestReport.scenarioTitle}
                </p>
                <div className="text-slate-300 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>{latestReport.findings.length} Specialist Findings Recorded</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>{latestReport.conflicts.length} Stakeholder Trade-Offs Audited</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>10 Autonomous AI Specialist Bureaus Consulted</span>
                  </div>
                </div>

                <button
                  onClick={onOpenImpactAnalysis}
                  className="btn-3d-primary w-full mt-2 py-2 text-xs flex items-center justify-center gap-1.5"
                >
                  <span>INSPECT FULL IMPACT AUDIT</span>
                  <ChevronRight className="w-4 h-4 text-slate-950" />
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-400 space-y-2.5">
                <p>No multi-agent simulation report compiled yet for current session.</p>
                <button
                  onClick={() => {
                    if (activeScenario) {
                      runSimulation(activeScenario.id);
                      onOpenImpactAnalysis();
                    }
                  }}
                  disabled={!activeScenario || isSimulating}
                  className="btn-3d-primary w-full py-2 text-xs disabled:opacity-50"
                >
                  START MULTI-AGENT AUDIT
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Real-Time Urban Growth Trends & Sector Strain Telemetry (Recharts) */}
      <UrbanGrowthWidgets />
    </div>
  );
};
