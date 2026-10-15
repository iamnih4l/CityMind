import React, { useMemo } from 'react';
import { CloudRain, CloudFog, Zap, CloudSun, Wind, Droplets } from 'lucide-react';

export type WeatherMode = 'CLEAR' | 'RAIN' | 'FOG' | 'STORM';

interface WeatherParticleSystemProps {
  weather: WeatherMode;
  onWeatherChange?: (mode: WeatherMode) => void;
  showControls?: boolean;
}

export const WeatherParticleSystem: React.FC<WeatherParticleSystemProps> = ({
  weather,
  onWeatherChange,
  showControls = false,
}) => {
  // Generate random rain streak positions and delays
  const raindrops = useMemo(() => {
    return Array.from({ length: 48 }).map((_, i) => ({
      id: i,
      left: `${(i * 2.1) + (Math.random() * 1.5)}%`,
      delay: `${(Math.random() * 1.2).toFixed(2)}s`,
      duration: `${(0.65 + Math.random() * 0.35).toFixed(2)}s`,
      opacity: 0.3 + Math.random() * 0.5,
      height: `${28 + Math.floor(Math.random() * 22)}px`,
    }));
  }, []);

  return (
    <>
      {/* 1. Rain Particle Layer */}
      {(weather === 'RAIN' || weather === 'STORM') && (
        <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden">
          {/* Subtle wet sheen overlay */}
          <div className="absolute inset-0 bg-blue-950/15 mix-blend-overlay pointer-events-none" />

          {raindrops.map(drop => (
            <div
              key={drop.id}
              className="weather-rain-streak"
              style={{
                left: drop.left,
                top: '-30px',
                height: drop.height,
                animationDelay: drop.delay,
                animationDuration: drop.duration,
                opacity: drop.opacity,
              }}
            />
          ))}

          {/* Storm lightning flash effect */}
          {weather === 'STORM' && (
            <div className="absolute inset-0 pointer-events-none bg-cyan-200/20 animate-pulse duration-1000 mix-blend-color-dodge" />
          )}
        </div>
      )}

      {/* 2. Volumetric Fog Layer */}
      {(weather === 'FOG' || weather === 'STORM') && (
        <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden">
          {/* Primary low-altitude drift cloud */}
          <div
            className="absolute inset-0 weather-fog-drift bg-gradient-to-t from-slate-400/10 via-cyan-900/15 to-transparent blur-2xl"
            style={{ transform: 'scale(1.2)' }}
          />

          {/* Secondary rolling mist veil */}
          <div
            className="absolute -inset-x-12 bottom-0 h-2/3 weather-fog-drift bg-radial from-slate-300/10 via-slate-700/5 to-transparent blur-3xl"
            style={{ animationDuration: '34s', animationDirection: 'reverse' }}
          />
        </div>
      )}

      {/* Optional Integrated Inline Controls Bar */}
      {showControls && onWeatherChange && (
        <div className="flex items-center gap-1 bg-slate-950/85 p-1 rounded-xl border border-white/10 shadow-lg backdrop-blur-md">
          <button
            onClick={() => onWeatherChange('CLEAR')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
              weather === 'CLEAR'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Clear Atmospheric Visibility"
          >
            <CloudSun className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CLEAR</span>
          </button>

          <button
            onClick={() => onWeatherChange('RAIN')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
              weather === 'RAIN'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Precipitation Particulate Simulation"
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">RAIN</span>
          </button>

          <button
            onClick={() => onWeatherChange('FOG')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
              weather === 'FOG'
                ? 'bg-slate-500/20 text-slate-200 border border-slate-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Volumetric Atmospheric Fog"
          >
            <CloudFog className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">FOG</span>
          </button>

          <button
            onClick={() => onWeatherChange('STORM')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
              weather === 'STORM'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Storm & Lightning Electrical Surge"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">STORM</span>
          </button>
        </div>
      )}
    </>
  );
};
