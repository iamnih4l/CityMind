import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import {
  TrendingUp,
  Activity,
  Zap,
  ShieldCheck,
  Radio,
  Layers,
  Sparkles,
  Maximize2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface GrowthDataPoint {
  time: string;
  population: number;
  energyLoad: number;
  greenBuffer: number;
  economicIndex: number;
}

export const UrbanGrowthWidgets: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'LIVE' | '24H' | '30D' | '5Y'>('LIVE');
  const [tick, setTick] = useState(0);

  // Live real-time tick increment simulating live telemetry streaming
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Dynamic real-time growth trend data based on timeframe and live ticks
  const growthData = useMemo<GrowthDataPoint[]>(() => {
    const jitter = Math.sin(tick * 0.5) * 1.8;
    if (timeframe === 'LIVE') {
      return [
        { time: 'T-10m', population: 142.1 + jitter * 0.2, energyLoad: 312 + jitter * 4, greenBuffer: 38.4, economicIndex: 82.1 },
        { time: 'T-8m', population: 142.3 + jitter * 0.3, energyLoad: 316 + jitter * 5, greenBuffer: 38.4, economicIndex: 82.5 },
        { time: 'T-6m', population: 142.6 + jitter * 0.1, energyLoad: 322 + jitter * 3, greenBuffer: 38.3, economicIndex: 83.2 },
        { time: 'T-4m', population: 142.8 + jitter * 0.4, energyLoad: 328 + jitter * 6, greenBuffer: 38.2, economicIndex: 83.8 },
        { time: 'T-2m', population: 143.1 + jitter * 0.2, energyLoad: 334 + jitter * 4, greenBuffer: 38.1, economicIndex: 84.4 },
        { time: 'CURRENT', population: 143.5 + jitter * 0.5, energyLoad: 341 + jitter * 7, greenBuffer: 38.0, economicIndex: 85.1 + jitter * 0.3 },
      ];
    }
    if (timeframe === '24H') {
      return [
        { time: '00:00', population: 138.0, energyLoad: 240, greenBuffer: 38.5, economicIndex: 78.0 },
        { time: '04:00', population: 138.2, energyLoad: 210, greenBuffer: 38.5, economicIndex: 76.5 },
        { time: '08:00', population: 140.5, energyLoad: 360, greenBuffer: 38.4, economicIndex: 82.0 },
        { time: '12:00', population: 142.8, energyLoad: 385, greenBuffer: 38.2, economicIndex: 85.5 },
        { time: '16:00', population: 143.2, energyLoad: 370, greenBuffer: 38.1, economicIndex: 86.0 },
        { time: '20:00', population: 141.5, energyLoad: 340, greenBuffer: 38.0, economicIndex: 83.5 },
      ];
    }
    if (timeframe === '30D') {
      return [
        { time: 'Week 1', population: 139.2, energyLoad: 310, greenBuffer: 39.1, economicIndex: 80.2 },
        { time: 'Week 2', population: 140.4, energyLoad: 318, greenBuffer: 38.8, economicIndex: 81.6 },
        { time: 'Week 3', population: 141.9, energyLoad: 329, greenBuffer: 38.4, economicIndex: 83.1 },
        { time: 'Week 4', population: 143.5, energyLoad: 341, greenBuffer: 38.0, economicIndex: 85.0 },
      ];
    }
    // 5Y Master Plan Projection
    return [
      { time: '2024', population: 135.0, energyLoad: 290, greenBuffer: 41.2, economicIndex: 75.0 },
      { time: '2025', population: 143.5, energyLoad: 341, greenBuffer: 38.0, economicIndex: 85.0 },
      { time: '2026', population: 154.2, energyLoad: 380, greenBuffer: 36.8, economicIndex: 94.5 },
      { time: '2027', population: 168.0, energyLoad: 425, greenBuffer: 39.5, economicIndex: 106.0 },
      { time: '2028', population: 182.5, energyLoad: 460, greenBuffer: 42.0, economicIndex: 118.5 },
    ];
  }, [timeframe, tick]);

  // Sector capacity and stress indices
  const sectorCapacityData = [
    { name: 'Power Grid', load: 88, threshold: 85, color: '#f59e0b', status: 'WARNING' },
    { name: 'Water Basin', load: 64, threshold: 90, color: '#06b6d4', status: 'NOMINAL' },
    { name: 'Transit Corridors', load: 82, threshold: 80, color: '#3b82f6', status: 'HEAVY' },
    { name: 'Emergency ICU', load: 71, threshold: 85, color: '#10b981', status: 'NOMINAL' },
    { name: 'Waste Reclamation', load: 58, threshold: 80, color: '#8b5cf6', status: 'NOMINAL' },
  ];

  // Radar resilience equilibrium matrix
  const resilienceMatrix = [
    { subject: 'Transit Flow', value: 84, baseline: 70 },
    { subject: 'Grid Stability', value: 76, baseline: 80 },
    { subject: 'Eco Buffer', value: 68, baseline: 75 },
    { subject: 'Housing Equity', value: 62, baseline: 70 },
    { subject: 'Fiscal Health', value: 91, baseline: 80 },
    { subject: 'Disaster Safety', value: 88, baseline: 75 },
  ];

  // Custom Glassmorphic Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#070d1a]/95 border border-cyan-500/40 p-3 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.8)] backdrop-blur-xl text-xs space-y-1.5 font-mono">
          <div className="text-cyan-300 font-bold font-display border-b border-white/10 pb-1 flex items-center justify-between gap-4">
            <span>INTERVAL: {label}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 text-slate-300">
              <span className="flex items-center gap-1.5 text-[11px]">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-bold text-white font-mono">
                {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
                {entry.name.includes('Canopy') ? '%' : entry.name.includes('Power') ? ' MWh' : 'k'}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Telemetry Header with Timeframe Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-cyan-500/25 shadow-lg backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-sm sm:text-base text-white tracking-wide">
                REAL-TIME URBAN GROWTH & STRAIN TELEMETRY
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE SYNC
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous multi-agent forecasting of population density, grid load, and ecological buffer
            </p>
          </div>
        </div>

        {/* Timeframe Controls */}
        <div className="flex items-center bg-slate-950/90 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
          {(['LIVE', '24H', '30D', '5Y'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                timeframe === tf
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tf === 'LIVE' ? '● LIVE STREAM' : tf}
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Growth Dynamics Area Chart (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl command-panel hud-brackets border-cyan-500/30 p-4 space-y-3 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="font-display font-bold text-xs sm:text-sm text-white tracking-wide">
                POPULATION DENSITY VS. ENERGY GRID DISPATCH
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" /> Population (k)
              </span>
              <span className="flex items-center gap-1.5 text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" /> Energy Load (MWh)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-300 hidden sm:flex">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" /> Canopy (%)
              </span>
            </div>
          </div>

          <div className="w-full h-56 sm:h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {/* Cyan Glowing 3D Area Gradient */}
                  <linearGradient id="pop3dGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.65} />
                    <stop offset="60%" stopColor="#0891b2" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#040814" stopOpacity={0.0} />
                  </linearGradient>
                  {/* Amber Energy Gradient */}
                  <linearGradient id="energy3dGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6} />
                    <stop offset="60%" stopColor="#d97706" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#040814" stopOpacity={0.0} />
                  </linearGradient>
                  {/* Emerald Buffer Gradient */}
                  <linearGradient id="green3dGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#040814" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  domain={['dataMin - 5', 'dataMax + 10']}
                />
                <Tooltip content={<CustomTooltip />} />

                <Area
                  type="monotone"
                  dataKey="population"
                  name="Population (k)"
                  stroke="#22d3ee"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#pop3dGlow)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="energyLoad"
                  name="Power Grid (MWh)"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#energy3dGlow)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="greenBuffer"
                  name="Green Buffer (%)"
                  stroke="#34d399"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#green3dGlow)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Real-Time Live Status Bar */}
          <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 font-mono">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>PROJECTED VELOCITY: +1.4% / QTR</span>
            </span>
            <span className="text-slate-500">·</span>
            <span>GRID PEAK OCCURS AT 18:30 LOCAL</span>
            <span className="text-slate-500 hidden sm:inline">·</span>
            <span className="text-emerald-400 hidden sm:inline">CANOPY OFFSET STABLE</span>
          </div>
        </div>

        {/* Tactical Municipal Strain & Equilibrium Matrix (1 col) */}
        <div className="rounded-2xl command-panel hud-brackets border-cyan-500/30 p-4 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="font-display font-bold text-xs sm:text-sm text-white tracking-wide">
                  SECTOR STRAIN GAUGES
                </span>
              </div>
              <span className="font-mono text-[10px] text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                CRITICAL THRESHOLD: 85%
              </span>
            </div>

            {/* Tactical Linear Sector Strain Meters */}
            <div className="space-y-3 pt-3">
              {sectorCapacityData.map(sector => (
                <div key={sector.name} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-medium font-sans flex items-center gap-1.5">
                      {sector.load >= sector.threshold && (
                        <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                      )}
                      {sector.name}
                    </span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className={sector.load >= sector.threshold ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                        {sector.load}%
                      </span>
                      <span className={`text-[10px] px-1 rounded ${
                        sector.status === 'WARNING'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : sector.status === 'HEAVY'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {sector.status}
                      </span>
                    </div>
                  </div>
                  {/* 3D Gauge Progress Track */}
                  <div className="h-2 rounded-full bg-slate-950 overflow-hidden border border-white/5 relative">
                    {/* Threshold indicator marker line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10"
                      style={{ left: `${sector.threshold}%` }}
                      title="Threshold Limit"
                    />
                    <div
                      className="h-full rounded-full transition-all duration-700 shadow-inner"
                      style={{
                        width: `${sector.load}%`,
                        backgroundColor: sector.color,
                        boxShadow: `0 0 10px ${sector.color}80`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mini Radar Equilibrium Hexagon */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
              <span className="font-display font-semibold flex items-center gap-1.5 text-cyan-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>6-AXIS URBAN EQUILIBRIUM</span>
              </span>
              <span className="font-mono text-emerald-400 text-[11px] font-bold">SCORE: 81.2/100</span>
            </div>

            <div className="w-full h-36 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={resilienceMatrix} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.05)" tick={false} />
                  <Radar
                    name="Equilibrium"
                    dataKey="value"
                    stroke="#22d3ee"
                    fill="#06b6d4"
                    fillOpacity={0.45}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
