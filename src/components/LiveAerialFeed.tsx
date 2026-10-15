import React, { useState, useEffect } from 'react';
import {
  Video,
  Eye,
  Maximize2,
  Minimize2,
  Crosshair,
  Compass,
  Radio,
  Sliders,
  Battery,
  Flame,
  Moon,
  Sun,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useDayNight } from '../context/DayNightContext.tsx';

import { MapFocalPoint } from '../types/location.ts';

type OpticalSensorMode = 'OPTICAL' | 'FLIR' | 'NVG';

interface LiveAerialFeedProps {
  isCompact?: boolean;
  onExpandToggle?: () => void;
  focalPoint?: MapFocalPoint | null;
}

export const LiveAerialFeed: React.FC<LiveAerialFeedProps> = ({
  isCompact = false,
  onExpandToggle,
  focalPoint,
}) => {
  const { period, formattedTime, colorProfile, simulatedHour } = useDayNight();
  const [sensorMode, setSensorMode] = useState<OpticalSensorMode>('OPTICAL');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [coordinates, setCoordinates] = useState({ lat: '42°21\'34.8"N', lon: '71°03\'48.2"W', alt: 14250 });

  // Recalibrate coordinates when focal point changes
  useEffect(() => {
    if (focalPoint) {
      const latMin = 20 + Math.floor((focalPoint.coordinates.y / 780) * 10);
      const latSec = ((focalPoint.coordinates.y % 78) * 0.77).toFixed(1);
      const lonMin = 0o1 + Math.floor((focalPoint.coordinates.x / 1000) * 12);
      const lonSec = ((focalPoint.coordinates.x % 100) * 0.6).toFixed(1);
      setCoordinates({
        lat: `42°${latMin}'${latSec}"N`,
        lon: `71°${lonMin.toString().padStart(2, '0')}'${lonSec}"W`,
        alt: 14250,
      });
    }
  }, [focalPoint]);

  // Subtle coordinate jitter to simulate UAV GPS drift
  useEffect(() => {
    const timer = setInterval(() => {
      setCoordinates(prev => ({
        ...prev,
        alt: 14240 + Math.floor(Math.sin(Date.now() / 2000) * 18),
      }));
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  // Compute feed tinting & lighting based on DayNight cycle & Sensor Mode
  const getSensorStyles = () => {
    if (sensorMode === 'FLIR') {
      return {
        filter: 'invert(0.9) hue-rotate(180deg) saturate(2.4) contrast(1.4)',
        ambientColor: 'rgba(239, 68, 68, 0.15)',
        hudColor: 'text-rose-400',
        borderColor: 'border-rose-500/40',
        label: 'FLIR THERMAL INFRARED',
      };
    }
    if (sensorMode === 'NVG') {
      return {
        filter: 'sepia(1) hue-rotate(85deg) saturate(4.5) brightness(1.1) contrast(1.3)',
        ambientColor: 'rgba(34, 197, 94, 0.2)',
        hudColor: 'text-emerald-400',
        borderColor: 'border-emerald-500/40',
        label: 'NVG NIGHT OPTICAL AMPLIFIER',
      };
    }

    // Default 'OPTICAL' adapts to the Day/Night environment
    switch (period) {
      case 'NIGHT':
        return {
          filter: 'brightness(0.55) contrast(1.25) saturate(0.85) hue-rotate(-10deg)',
          ambientColor: 'rgba(15, 23, 42, 0.65)',
          hudColor: 'text-cyan-400',
          borderColor: 'border-cyan-500/40',
          label: 'OPTICAL · LOW-LIGHT STAGED',
        };
      case 'DUSK':
        return {
          filter: 'brightness(0.85) contrast(1.1) saturate(1.4) hue-rotate(15deg)',
          ambientColor: 'rgba(124, 45, 18, 0.25)',
          hudColor: 'text-amber-400',
          borderColor: 'border-amber-500/40',
          label: 'OPTICAL · GOLDEN HOUR FEED',
        };
      case 'DAWN':
        return {
          filter: 'brightness(0.8) contrast(1.15) saturate(1.2) hue-rotate(-20deg)',
          ambientColor: 'rgba(88, 28, 135, 0.25)',
          hudColor: 'text-purple-400',
          borderColor: 'border-purple-500/40',
          label: 'OPTICAL · DAWN RECON FEED',
        };
      case 'DAY':
      default:
        return {
          filter: 'brightness(1.02) contrast(1.05) saturate(1.1)',
          ambientColor: 'rgba(56, 189, 248, 0.08)',
          hudColor: 'text-cyan-400',
          borderColor: 'border-cyan-500/40',
          label: 'OPTICAL · TRUECOLOR DAYLIGHT',
        };
    }
  };

  const sensorConfig = getSensorStyles();

  return (
    <div className={`relative overflow-hidden rounded-2xl command-panel hud-brackets ${sensorConfig.borderColor} flex flex-col select-none transition-all duration-300 shadow-2xl`}>
      {/* Top HUD Telemetry Bar */}
      <div className="relative z-20 flex items-center justify-between px-3.5 py-2 border-b border-white/10 bg-slate-950/80 backdrop-blur-md text-[11px] font-mono">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
            <span className="font-bold text-rose-400 tracking-wider">REC</span>
          </div>
          <span className="text-slate-400">|</span>
          <span className="text-slate-200 font-semibold font-display tracking-wider">
            UAV-RECON [DELTA-04]
          </span>
          <span className="text-slate-500 hidden sm:inline">·</span>
          <span className={`${sensorConfig.hudColor} font-semibold hidden sm:inline`}>
            {sensorConfig.label}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-slate-400">
            <span>ALT: <span className="text-white font-semibold">{coordinates.alt.toLocaleString()} FT</span></span>
            <span>·</span>
            <span>SIM: <span className="text-amber-300 font-semibold">{formattedTime}</span></span>
          </div>

          {/* Sensor Mode Switcher */}
          <div className="flex items-center bg-slate-900/90 rounded-lg p-0.5 border border-white/10 text-[10px]">
            <button
              onClick={() => setSensorMode('OPTICAL')}
              className={`px-2 py-0.5 rounded font-semibold transition-all ${
                sensorMode === 'OPTICAL'
                  ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              RGB
            </button>
            <button
              onClick={() => setSensorMode('FLIR')}
              className={`px-2 py-0.5 rounded font-semibold transition-all ${
                sensorMode === 'FLIR'
                  ? 'bg-rose-500/30 text-rose-200 border border-rose-500/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              FLIR
            </button>
            <button
              onClick={() => setSensorMode('NVG')}
              className={`px-2 py-0.5 rounded font-semibold transition-all ${
                sensorMode === 'NVG'
                  ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              NVG
            </button>
          </div>

          {onExpandToggle && (
            <button
              onClick={onExpandToggle}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-white/5"
              title="Toggle View Size"
            >
              {isCompact ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Drone Camera Viewport */}
      <div className={`relative w-full ${isCompact ? 'h-52' : 'h-64 sm:h-76'} bg-[#02050e] overflow-hidden flex items-center justify-center`}>
        {/* Animated Camera Drone Sway / Drift Stage */}
        <div
          className="absolute inset-0 transition-transform duration-700 ease-out"
          style={{
            transform: `scale(${zoomLevel})`,
            filter: sensorConfig.filter,
          }}
        >
          {/* High-Altitude Stylized Synthetic Aerial Ortho Canvas / Vector Simulation */}
          <svg
            viewBox="0 0 800 500"
            className="w-full h-full object-cover animate-[fogLayerDrift_35s_ease-in-out_infinite_alternate]"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Drone Camera Grid */}
              <pattern id="aerialGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
                <circle cx="30" cy="30" r="1.5" fill="rgba(56,189,248,0.3)" />
              </pattern>

              {/* Highway Arterial Glow */}
              <linearGradient id="arteryGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.8" />
              </linearGradient>

              {/* Waterway Basin */}
              <linearGradient id="droneWater" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#082f49" />
                <stop offset="100%" stopColor="#0c4a6e" />
              </linearGradient>
            </defs>

            {/* Base Terrain Surface */}
            <rect width="800" height="500" fill="#091224" />
            <rect width="800" height="500" fill="url(#aerialGrid)" />

            {/* Major River / Coastal Basin */}
            <path
              d="M 180 -20 C 220 120, 140 240, 160 380 C 180 460, 240 510, 260 540"
              fill="none"
              stroke="url(#droneWater)"
              strokeWidth="52"
              strokeLinecap="round"
            />

            {/* Neon Transit Expressways */}
            <line x1="50" y1="210" x2="750" y2="210" stroke="#1e293b" strokeWidth="8" />
            <line x1="50" y1="210" x2="750" y2="210" stroke="url(#arteryGlow)" strokeWidth="2.5" strokeDasharray="14 10" />

            <line x1="420" y1="20" x2="420" y2="480" stroke="#1e293b" strokeWidth="8" />
            <line x1="420" y1="20" x2="420" y2="480" stroke="#38bdf8" strokeWidth="2" strokeDasharray="18 12" />

            {/* High-Altitude City Blocks & Extruded Roof Footprints */}
            {[
              { x: 260, y: 70, w: 90, h: 70, heat: '#0284c7', label: 'METRO CORE' },
              { x: 380, y: 80, w: 110, h: 80, heat: '#0369a1', label: 'FINANCIAL SECTOR' },
              { x: 520, y: 90, w: 80, h: 60, heat: '#075985', label: 'TECH PARK' },
              { x: 250, y: 250, w: 100, h: 90, heat: '#0284c7', label: 'CIVIC PLAZA' },
              { x: 380, y: 250, w: 120, h: 100, heat: '#0284c7', label: 'PORT TERMINAL' },
              { x: 540, y: 240, w: 90, h: 70, heat: '#0369a1', label: 'INNOVATION HUB' },
              { x: 120, y: 120, w: 60, h: 120, heat: '#047857', label: 'WEST ECO-CORRIDOR' },
              { x: 650, y: 140, w: 80, h: 160, heat: '#1e293b', label: 'EAST RESIDENTIAL' },
            ].map((blk, i) => (
              <g key={i}>
                {/* Building Shadow */}
                <rect x={blk.x + 8} y={blk.y + 10} width={blk.w} height={blk.h} rx="3" fill="#030712" opacity="0.7" />
                {/* Building Roof */}
                <rect
                  x={blk.x}
                  y={blk.y}
                  width={blk.w}
                  height={blk.h}
                  rx="3"
                  fill={sensorMode === 'FLIR' ? '#f43f5e' : blk.heat}
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                  opacity={sensorMode === 'FLIR' ? 0.9 : 0.75}
                />
                {/* Structural Roof Machinery / Helipad / Solar Arrays */}
                <rect x={blk.x + 8} y={blk.y + 8} width={blk.w - 16} height={blk.h - 16} rx="2" fill="#0f172a" opacity="0.6" />
                <circle cx={blk.x + blk.w / 2} cy={blk.y + blk.h / 2} r="6" fill="none" stroke="#e0f2fe" strokeWidth="0.8" opacity="0.5" />
              </g>
            ))}

            {/* Simulated Live Traffic Transit Pulses */}
            <circle cx="210" cy="210" r="3.5" fill="#facc15">
              <animate attributeName="cx" from="50" to="750" dur="12s" repeatCount="indefinite" />
            </circle>
            <circle cx="580" cy="210" r="3" fill="#38bdf8">
              <animate attributeName="cx" from="750" to="50" dur="14s" repeatCount="indefinite" />
            </circle>
            <circle cx="420" cy="180" r="3.5" fill="#f43f5e">
              <animate attributeName="cy" from="20" to="480" dur="10s" repeatCount="indefinite" />
            </circle>

            {/* Targeted Object Tracking Box (HUD In-Feed Target Lock) */}
            {(() => {
              const tx = focalPoint
                ? Math.max(30, Math.min(680, (focalPoint.coordinates.x / 1000) * 800 - 40))
                : 320;
              const ty = focalPoint
                ? Math.max(30, Math.min(400, (focalPoint.coordinates.y / 780) * 500 - 35))
                : 110;
              const lockLabel = focalPoint
                ? `TARGET LOCK [${focalPoint.name.toUpperCase().slice(0, 18)}]`
                : 'TARGET LOCK [METRO CORE]';

              return (
                <g transform={`translate(${tx}, ${ty})`}>
                  <rect
                    x="0"
                    y="0"
                    width="80"
                    height="70"
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="1.5"
                    strokeDasharray="6 4"
                  />
                  {/* Corner crosshairs */}
                  <path d="M -4 10 L -4 -4 L 10 -4" fill="none" stroke="#22d3ee" strokeWidth="2" />
                  <path d="M 84 10 L 84 -4 L 70 -4" fill="none" stroke="#22d3ee" strokeWidth="2" />
                  <path d="M -4 60 L -4 74 L 10 74" fill="none" stroke="#22d3ee" strokeWidth="2" />
                  <path d="M 84 60 L 84 74 L 70 74" fill="none" stroke="#22d3ee" strokeWidth="2" />
                  <text
                    x="4"
                    y="-8"
                    fill="#22d3ee"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {lockLabel}
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>

        {/* Tactical Scanlines & Film Grain Overlay */}
        <div className="absolute inset-0 tactical-scanlines z-10 pointer-events-none" />

        {/* Ambient Film Grain Texture Simulation */}
        <div
          className="absolute inset-0 pointer-events-none z-10 opacity-30 mix-blend-overlay"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.12) 0%, transparent 60%)`,
          }}
        />

        {/* Central Tactical Reticle Crosshairs */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-15">
          <div className="relative w-36 h-36">
            {/* Center Circle */}
            <div className="absolute inset-0 border border-cyan-400/40 rounded-full animate-spin duration-[40000ms]" />
            <div className="absolute inset-4 border border-dashed border-cyan-400/30 rounded-full" />
            {/* Horizontal & Vertical Crosshair Lines */}
            <div className="absolute top-1/2 -left-8 -right-8 h-px bg-cyan-400/30 -translate-y-1/2" />
            <div className="absolute left-1/2 -top-8 -bottom-8 w-px bg-cyan-400/30 -translate-x-1/2" />
            {/* Center Dot */}
            <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
          </div>
        </div>

        {/* Telemetry OSD Corner Readouts */}
        <div className="absolute inset-0 p-3 flex flex-col justify-between pointer-events-none z-20 text-[10px] font-mono text-cyan-300">
          {/* Top telemetry */}
          <div className="flex justify-between items-start">
            <div className="space-y-0.5 bg-slate-950/60 p-1.5 rounded border border-white/10 backdrop-blur-sm">
              <div>LAT: <span className="text-white font-bold">{coordinates.lat}</span></div>
              <div>LON: <span className="text-white font-bold">{coordinates.lon}</span></div>
              <div>HDG: <span className="text-white font-bold">184° SSE</span></div>
            </div>

            <div className="space-y-0.5 bg-slate-950/60 p-1.5 rounded border border-white/10 backdrop-blur-sm text-right">
              <div>PITCH: <span className="text-white font-bold">-64.2°</span></div>
              <div>ROLL: <span className="text-white font-bold">+1.8°</span></div>
              <div>SPEED: <span className="text-white font-bold">42 KTS</span></div>
            </div>
          </div>

          {/* Bottom telemetry */}
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded border border-white/10 backdrop-blur-sm">
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
              <span>BAT: 86%</span>
              <span className="text-slate-500">|</span>
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>LINK: 99.4%</span>
            </div>

            {/* Interactive Zoom Buttons (Pointer-events-auto) */}
            <div className="pointer-events-auto flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-white/10">
              {[1.0, 1.5, 2.0].map(z => (
                <button
                  key={z}
                  onClick={() => setZoomLevel(z)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                    zoomLevel === z
                      ? 'bg-cyan-500/40 text-cyan-200 border border-cyan-400/60'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {z}X
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Command Strip */}
      <div className="px-3.5 py-2 bg-slate-950/90 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-200">SECTOR FOCUS:</span>
          <span className="text-cyan-300 font-mono font-medium uppercase truncate max-w-[200px]">
            {focalPoint ? `${focalPoint.code ? `[${focalPoint.code}] ` : ''}${focalPoint.name}` : 'METRO CORE DOWNTOWN'}
          </span>
        </div>

        <button
          onClick={() => setIsLocked(!isLocked)}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
            isLocked
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          {isLocked ? 'TARGET ACQUIRED' : 'SCANNING HORIZON...'}
        </button>
      </div>
    </div>
  );
};
