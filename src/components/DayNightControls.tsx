import React, { useRef, useEffect } from 'react';
import {
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Play,
  Pause,
  Clock,
  Sliders,
  X,
  Compass,
  Sparkles,
  Zap,
  Eye,
  EyeOff,
  RotateCcw,
} from 'lucide-react';
import { useDayNight } from '../context/DayNightContext.tsx';
import { OverlayIntensity, TimePeriod } from '../types/dayNight.ts';

/**
 * Navbar clock badge showing simulated time and period icon
 */
export const DayNightClockBadge: React.FC = () => {
  const {
    formattedTime,
    period,
    isRunning,
    isOverlayEnabled,
    setIsControllerOpen,
    isControllerOpen,
  } = useDayNight();

  const getPeriodBadge = () => {
    switch (period) {
      case 'DAWN':
        return {
          icon: Sunrise,
          label: 'DAWN',
          textColor: 'text-amber-300',
          borderColor: 'border-amber-500/40',
          bgColor: 'bg-amber-950/40',
        };
      case 'DAY':
        return {
          icon: Sun,
          label: 'DAY',
          textColor: 'text-yellow-300',
          borderColor: 'border-yellow-500/40',
          bgColor: 'bg-yellow-950/40',
        };
      case 'DUSK':
        return {
          icon: Sunset,
          label: 'DUSK',
          textColor: 'text-purple-300',
          borderColor: 'border-purple-500/40',
          bgColor: 'bg-purple-950/40',
        };
      case 'NIGHT':
      default:
        return {
          icon: Moon,
          label: 'NIGHT',
          textColor: 'text-cyan-300',
          borderColor: 'border-cyan-500/40',
          bgColor: 'bg-cyan-950/40',
        };
    }
  };

  const badge = getPeriodBadge();
  const Icon = badge.icon;

  return (
    <button
      onClick={() => setIsControllerOpen(!isControllerOpen)}
      className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl border ${badge.borderColor} ${badge.bgColor} hover:bg-slate-900/80 transition-all duration-200 shadow-md backdrop-blur-md cursor-pointer`}
      title="Click to adjust Day/Night Atmosphere & Clock Speed"
    >
      <div className="flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 ${badge.textColor} transition-transform group-hover:scale-110`} />
        <span className="font-mono text-xs font-bold text-white tracking-wide">
          {formattedTime}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <span className={`text-[10px] font-display font-bold uppercase tracking-wider ${badge.textColor}`}>
          {badge.label}
        </span>
        {isRunning && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Time progressing" />
        )}
      </div>
    </button>
  );
};

/**
 * Detailed 3D Cinematic Day/Night Controller Modal
 */
export const DayNightControllerModal: React.FC = () => {
  const {
    simulatedHour,
    formattedTime,
    period,
    colorProfile,
    isRunning,
    speedMultiplier,
    intensity,
    isOverlayEnabled,
    isControllerOpen,
    setSimulatedHour,
    toggleRunning,
    setSpeedMultiplier,
    setIntensity,
    setIsOverlayEnabled,
    setIsControllerOpen,
    jumpToPeriod,
    syncWithRealTime,
  } = useDayNight();

  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isControllerOpen) {
        setIsControllerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isControllerOpen, setIsControllerOpen]);

  if (!isControllerOpen) return null;

  // Calculate sun/moon timeline position (0% - 100%)
  const timelinePercent = ((simulatedHour / 24) * 100).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md font-sans">
      <div
        ref={modalRef}
        className="w-full max-w-lg command-panel hud-brackets rounded-2xl border-cyan-500/30 text-slate-100 p-5 relative shadow-[0_25px_60px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-amber-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              {period === 'DAY' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : period === 'DAWN' ? (
                <Sunrise className="w-5 h-5 text-amber-300" />
              ) : period === 'DUSK' ? (
                <Sunset className="w-5 h-5 text-purple-400" />
              ) : (
                <Moon className="w-5 h-5 text-cyan-300" />
              )}
            </div>
            <div>
              <div className="font-display font-bold text-xs text-cyan-300 tracking-wider">
                ATMOSPHERIC & DAY/NIGHT SIMULATION
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>SIMULATED TIME: <b className="text-white font-mono">{formattedTime}</b></span>
                <span>•</span>
                <span className="text-amber-300 font-semibold">{colorProfile.periodLabel}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsControllerOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Atmosphere Telemetry Strip */}
        <div className="bg-slate-950/80 border border-white/10 p-3.5 mb-4 rounded-xl space-y-2 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-display font-bold text-[11px]">SIMULATION PHASE:</span>
            <span className="font-mono text-xs font-bold text-amber-300">{period}</span>
          </div>
          <p className="text-xs text-slate-300 italic border-l-2 border-cyan-400 pl-2.5">
            {colorProfile.description}
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-slate-400 font-mono">
            <div>
              <span className="text-slate-500">AMBIENT TEMP:</span>{' '}
              <span className="text-slate-200 font-semibold">{colorProfile.ambientTemperature}</span>
            </div>
            <div>
              <span className="text-slate-500">ATMOSPHERE OVERLAY:</span>{' '}
              <span className={isOverlayEnabled ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                {isOverlayEnabled ? `ACTIVE (${intensity.toUpperCase()})` : 'DISABLED'}
              </span>
            </div>
          </div>
        </div>

        {/* 24-Hour Sky Scrubber */}
        <div className="mb-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-cyan-400 font-bold">24-HOUR CELESTIAL TIMELINE</span>
            <span className="text-slate-300">{formattedTime} ({timelinePercent}%)</span>
          </div>

          {/* Sky Gradient Bar with Celestial marker */}
          <div className="relative h-8 w-full border border-white/15 bg-gradient-to-r from-[#030712] via-[#f59e0b] via-[#38bdf8] via-[#a855f7] to-[#030712] rounded-xl overflow-hidden shadow-inner">
            {/* Celestial marker */}
            <div
              className="absolute top-0 bottom-0 w-3 -ml-1.5 bg-white border border-slate-900 shadow-[0_0_12px_#fff] flex items-center justify-center transition-all duration-75 rounded-sm"
              style={{ left: `${timelinePercent}%` }}
            >
              <div className="w-1 h-3 bg-cyan-500 rounded-full" />
            </div>

            {/* Hour ticks */}
            <div className="absolute inset-0 flex justify-between px-3 items-center pointer-events-none text-[9px] font-mono text-black/80 font-bold">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>24:00</span>
            </div>
          </div>

          {/* Interactive Range Slider */}
          <input
            type="range"
            min="0"
            max="23.95"
            step="0.05"
            value={simulatedHour}
            onChange={(e) => setSimulatedHour(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-900 rounded-lg border border-slate-700"
          />
        </div>

        {/* Quick Period Presets */}
        <div className="mb-4">
          <div className="text-xs font-display font-bold text-slate-300 mb-2">QUICK TIME PERIOD PRESETS:</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => jumpToPeriod('DAWN')}
              className={`py-2 px-2.5 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                period === 'DAWN'
                  ? 'bg-amber-500/30 text-amber-200 border-amber-500/60 shadow-md'
                  : 'bg-amber-950/30 text-amber-300/70 border-amber-500/20 hover:text-white hover:bg-amber-950/60'
              }`}
            >
              <Sunrise className="w-3.5 h-3.5" />
              <span>DAWN 06:15</span>
            </button>

            <button
              onClick={() => jumpToPeriod('DAY')}
              className={`py-2 px-2.5 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                period === 'DAY'
                  ? 'bg-yellow-500/30 text-yellow-200 border-yellow-500/60 shadow-md'
                  : 'bg-yellow-950/30 text-yellow-300/70 border-yellow-500/20 hover:text-white hover:bg-yellow-950/60'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>NOON 12:30</span>
            </button>

            <button
              onClick={() => jumpToPeriod('DUSK')}
              className={`py-2 px-2.5 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                period === 'DUSK'
                  ? 'bg-purple-500/30 text-purple-200 border-purple-500/60 shadow-md'
                  : 'bg-purple-950/30 text-purple-300/70 border-purple-500/20 hover:text-white hover:bg-purple-950/60'
              }`}
            >
              <Sunset className="w-3.5 h-3.5" />
              <span>DUSK 18:45</span>
            </button>

            <button
              onClick={() => jumpToPeriod('NIGHT')}
              className={`py-2 px-2.5 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                period === 'NIGHT'
                  ? 'bg-cyan-500/30 text-cyan-200 border-cyan-500/60 shadow-md'
                  : 'bg-indigo-950/30 text-cyan-300/70 border-cyan-500/20 hover:text-white hover:bg-indigo-950/60'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>NIGHT 23:30</span>
            </button>
          </div>
        </div>

        {/* Simulation Clock Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {/* Play/Pause & Real-Time Sync */}
          <div className="bg-slate-950/70 border border-white/10 p-3 rounded-xl space-y-2">
            <div className="text-xs font-display font-semibold text-slate-300">SIMULATION ENGINE CLOCK:</div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleRunning}
                className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  isRunning
                    ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50 hover:bg-amber-500/40'
                    : 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/50 hover:bg-emerald-500/40'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>PAUSE CLOCK</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>RESUME CLOCK</span>
                  </>
                )}
              </button>

              <button
                onClick={syncWithRealTime}
                title="Sync simulated clock with device real time"
                className="btn-3d-secondary p-2 rounded-lg text-slate-200"
              >
                <Clock className="w-4 h-4 text-cyan-300" />
              </button>
            </div>

            {/* Speed Multipliers */}
            <div className="flex items-center gap-1 pt-1 text-xs">
              <span className="text-slate-400 mr-1 font-mono text-[11px]">RATE:</span>
              {[1, 5, 15, 60].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeedMultiplier(s)}
                  className={`px-2.5 py-0.5 text-xs font-mono font-semibold rounded-md border transition-all ${
                    speedMultiplier === s
                      ? 'bg-cyan-500/30 text-cyan-200 border-cyan-500/50 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Overlay Toggle & Intensity */}
          <div className="bg-slate-950/70 border border-white/10 p-3 rounded-xl space-y-2">
            <div className="text-xs font-display font-semibold text-slate-300 flex items-center justify-between">
              <span>ATMOSPHERIC WASH:</span>
              <button
                onClick={() => setIsOverlayEnabled(!isOverlayEnabled)}
                className="text-xs flex items-center gap-1 font-mono text-cyan-300 hover:text-cyan-200"
              >
                {isOverlayEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{isOverlayEnabled ? 'ACTIVE' : 'MUTED'}</span>
              </button>
            </div>

            {/* Intensity Buttons */}
            <div className="grid grid-cols-3 gap-1">
              {(['subtle', 'standard', 'deep'] as OverlayIntensity[]).map((level) => (
                <button
                  key={level}
                  onClick={() => {
                    setIsOverlayEnabled(true);
                    setIntensity(level);
                  }}
                  className={`py-1 text-[11px] font-semibold rounded-md border uppercase font-mono transition-all ${
                    isOverlayEnabled && intensity === level
                      ? 'bg-purple-500/30 text-purple-200 border-purple-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 leading-tight">
              Adjusts photometric light absorption and color temperature.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
          <div className="text-[11px] text-slate-400 font-mono">
            Press [ESC] to return to simulation
          </div>
          <button
            onClick={() => setIsControllerOpen(false)}
            className="btn-3d-primary px-4 py-1.5 text-xs font-bold"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
