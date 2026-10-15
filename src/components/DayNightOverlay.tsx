import React, { useMemo } from 'react';
import { useDayNight } from '../context/DayNightContext.tsx';

/**
 * DayNightOverlay
 * Overlays a subtle semi-transparent dark layer on the UI with color shifting
 * based on the simulated time of day.
 * Uses pointer-events: none to ensure all buttons, inputs, and charts remain 100% interactable.
 */
export const DayNightOverlay: React.FC = () => {
  const { colorProfile, isOverlayEnabled, starsVisible, simulatedHour } = useDayNight();

  // Deterministic star positions for authentic retro sky at night
  const stars = useMemo(() => {
    return [
      { top: '3%', left: '12%', size: 'w-1 h-1', delay: '0s', opacity: 'opacity-70' },
      { top: '7%', left: '28%', size: 'w-1.5 h-1.5', delay: '0.8s', opacity: 'opacity-90' },
      { top: '4%', left: '46%', size: 'w-1 h-1', delay: '1.4s', opacity: 'opacity-60' },
      { top: '8%', left: '62%', size: 'w-1 h-1', delay: '0.4s', opacity: 'opacity-80' },
      { top: '5%', left: '79%', size: 'w-1.5 h-1.5', delay: '1.9s', opacity: 'opacity-75' },
      { top: '9%', left: '91%', size: 'w-1 h-1', delay: '1.1s', opacity: 'opacity-85' },
      { top: '12%', left: '22%', size: 'w-1 h-1', delay: '2.2s', opacity: 'opacity-50' },
      { top: '14%', left: '71%', size: 'w-1 h-1', delay: '1.6s', opacity: 'opacity-65' },
    ];
  }, []);

  if (!isOverlayEnabled) {
    return null;
  }

  return (
    <>
      {/* Primary Atmospheric Dark Layer & Color Shift Gradient */}
      <div
        className="pointer-events-none fixed inset-0 z-20 transition-all duration-1000 ease-in-out"
        style={{
          backgroundColor: colorProfile.overlayRgba,
          backgroundImage: `linear-gradient(180deg, ${colorProfile.gradientTop} 0%, transparent 45%, ${colorProfile.gradientBottom} 100%)`,
          boxShadow: `inset 0 0 120px rgba(0, 0, 0, ${colorProfile.vignetteOpacity})`,
        }}
        aria-hidden="true"
      />

      {/* Subtle Color Temperature Ambient Wash */}
      <div
        className="pointer-events-none fixed inset-0 z-20 transition-all duration-1000 ease-in-out mix-blend-color"
        style={{
          backgroundColor: colorProfile.ambientGlowColor,
        }}
        aria-hidden="true"
      />

      {/* Ambient Night Stars Effect (Only visible during deep night hours 21:00 - 05:00) */}
      {starsVisible && (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 h-48 z-20 overflow-hidden transition-opacity duration-1000 ease-in-out"
          aria-hidden="true"
        >
          {stars.map((star, i) => (
            <div
              key={i}
              className={`absolute bg-cyan-100 ${star.size} ${star.opacity} shadow-[0_0_4px_#38bdf8]`}
              style={{
                top: star.top,
                left: star.left,
                animation: `retro-blink 2.2s infinite ease-in-out ${star.delay}`,
              }}
            />
          ))}
          {/* Subtle Moon Indicator at Night */}
          <div
            className="absolute top-4 right-16 w-6 h-6 rounded-full bg-amber-100/80 shadow-[0_0_12px_rgba(254,240,138,0.4)] flex items-center justify-center pointer-events-none"
            style={{
              opacity: (simulatedHour >= 22 || simulatedHour < 4.5) ? 0.75 : 0.35,
              transition: 'opacity 1s ease',
            }}
          >
            {/* Moon crater details */}
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300/40 absolute top-1 left-1.5" />
            <div className="w-1 h-1 rounded-full bg-slate-400/40 absolute bottom-1.5 right-1.5" />
          </div>
        </div>
      )}
    </>
  );
};
