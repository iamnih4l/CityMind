import { TimePeriod, DayNightColorProfile, OverlayIntensity } from '../types/dayNight.ts';

/**
 * Calculates time period from decimal hours (0 - 24)
 */
export function getTimePeriod(hour: number): TimePeriod {
  const normHour = ((hour % 24) + 24) % 24;
  if (normHour >= 5 && normHour < 8) {
    return 'DAWN';
  } else if (normHour >= 8 && normHour < 17.5) {
    return 'DAY';
  } else if (normHour >= 17.5 && normHour < 20.5) {
    return 'DUSK';
  } else {
    return 'NIGHT';
  }
}

/**
 * Formats fractional hour (e.g. 14.5) to "14:30" string
 */
export function formatSimulatedTime(hour: number): string {
  const normHour = ((hour % 24) + 24) % 24;
  const hours = Math.floor(normHour);
  const minutes = Math.floor((normHour - hours) * 60);
  const hStr = hours.toString().padStart(2, '0');
  const mStr = minutes.toString().padStart(2, '0');
  return `${hStr}:${mStr}`;
}

/**
 * Calculates smooth color profile and dark overlay parameters for the given hour
 */
export function calculateColorProfile(
  hour: number,
  intensity: OverlayIntensity
): DayNightColorProfile {
  const normHour = ((hour % 24) + 24) % 24;
  const period = getTimePeriod(normHour);

  // Multiplier based on intensity setting
  const intensityFactor =
    intensity === 'off' ? 0 : intensity === 'subtle' ? 0.65 : intensity === 'deep' ? 1.35 : 1.0;

  let overlayRgba = 'rgba(0, 0, 0, 0)';
  let gradientTop = 'rgba(0, 0, 0, 0)';
  let gradientBottom = 'rgba(0, 0, 0, 0)';
  let tintFilter = 'none';
  let ambientGlowColor = 'rgba(0, 0, 0, 0)';
  let vignetteOpacity = 0;
  let periodLabel = 'DAY';
  let description = 'Bright daylight';
  let ambientTemperature = '22°C (Clear)';

  // Calculate smoothly based on time of day
  if (normHour >= 5 && normHour < 8) {
    // DAWN: 05:00 -> 08:00
    // Progress from 0.0 at 5:00 to 1.0 at 8:00
    const progress = (normHour - 5) / 3;
    const nightFade = 1 - progress;

    const alpha = (0.28 * nightFade + 0.08) * intensityFactor;
    overlayRgba = `rgba(30, 20, 50, ${alpha.toFixed(3)})`;
    gradientTop = `rgba(15, 10, 35, ${(0.32 * nightFade * intensityFactor).toFixed(3)})`;
    gradientBottom = `rgba(245, 158, 11, ${(0.14 * (1 - nightFade * 0.5) * intensityFactor).toFixed(3)})`;

    // Warm morning amber shift
    const hueShift = Math.round(nightFade * 15 - 5);
    const brightness = (0.94 + progress * 0.06).toFixed(2);
    tintFilter = `hue-rotate(${hueShift}deg) brightness(${brightness})`;
    ambientGlowColor = 'rgba(251, 191, 36, 0.15)';
    vignetteOpacity = 0.15 * nightFade * intensityFactor;
    periodLabel = 'DAWN • SUNRISE';
    description = 'Morning sun awakening city grids; traffic ramping up';
    ambientTemperature = '16°C (Brisk Morning)';
  } else if (normHour >= 8 && normHour < 17.5) {
    // DAY: 08:00 -> 17:30
    // High noon peak at 12:00
    const noonDist = Math.abs(normHour - 12.5) / 5; // 0 at noon, 1 at ends

    const alpha = (0.02 + noonDist * 0.04) * intensityFactor;
    overlayRgba = `rgba(14, 20, 35, ${alpha.toFixed(3)})`;
    gradientTop = `rgba(56, 189, 248, ${(0.03 * intensityFactor).toFixed(3)})`;
    gradientBottom = `rgba(254, 240, 138, ${(0.02 * intensityFactor).toFixed(3)})`;

    tintFilter = `brightness(1.0) contrast(1.0)`;
    ambientGlowColor = 'rgba(250, 204, 21, 0.05)';
    vignetteOpacity = 0.04 * intensityFactor;
    periodLabel = 'DAYLIGHT • PEAK';
    description = 'Full solar illumination; peak municipal transit and commerce';
    ambientTemperature = '24°C (Warm & Sunny)';
  } else if (normHour >= 17.5 && normHour < 20.5) {
    // DUSK: 17:30 -> 20:30
    // Progress from 0.0 at 17:30 to 1.0 at 20:30
    const progress = (normHour - 17.5) / 3;

    const alpha = (0.12 + progress * 0.28) * intensityFactor;
    // Twilight violet-indigo and sunset amber
    overlayRgba = `rgba(28, 15, 45, ${alpha.toFixed(3)})`;
    gradientTop = `rgba(76, 29, 149, ${(0.22 * progress * intensityFactor).toFixed(3)})`;
    gradientBottom = `rgba(225, 29, 72, ${(0.16 * (1 - progress * 0.4) * intensityFactor).toFixed(3)})`;

    // Subtle violet-red hue shift
    const hueShift = Math.round(-12 + progress * 8);
    const brightness = (0.98 - progress * 0.10).toFixed(2);
    tintFilter = `hue-rotate(${hueShift}deg) brightness(${brightness}) contrast(1.02)`;
    ambientGlowColor = 'rgba(236, 72, 153, 0.18)';
    vignetteOpacity = (0.12 + progress * 0.18) * intensityFactor;
    periodLabel = 'DUSK • TWILIGHT';
    description = 'Evening transition; street lighting activated, residential peak';
    ambientTemperature = '19°C (Sunset Cool)';
  } else {
    // NIGHT: 20:30 -> 05:00
    // Deepest midnight around 01:00 - 03:00
    let nightDepth = 0.8;
    if (normHour >= 20.5) {
      nightDepth = 0.5 + ((normHour - 20.5) / 3.5) * 0.5; // ramps up to 1.0 at 24:00
    } else {
      nightDepth = 1.0 - (normHour / 5) * 0.4; // descends from 1.0 down to 0.6 at 05:00
    }

    const alpha = (0.34 + nightDepth * 0.16) * intensityFactor;
    // Deep navy / midnight indigo
    overlayRgba = `rgba(4, 8, 24, ${alpha.toFixed(3)})`;
    gradientTop = `rgba(2, 6, 23, ${(0.42 * intensityFactor).toFixed(3)})`;
    gradientBottom = `rgba(15, 23, 42, ${(0.32 * intensityFactor).toFixed(3)})`;

    // Cool blueish tint, slightly dimmed brightness for night feel
    const brightness = (0.86 + (1 - nightDepth) * 0.06).toFixed(2);
    tintFilter = `hue-rotate(8deg) brightness(${brightness}) contrast(1.04)`;
    ambientGlowColor = 'rgba(56, 189, 248, 0.12)';
    vignetteOpacity = (0.32 * nightDepth) * intensityFactor;
    periodLabel = 'NIGHT • MIDNIGHT';
    description = 'Night curfew & off-peak grid; nocturnal service maintenance';
    ambientTemperature = '14°C (Night Chill)';
  }

  return {
    overlayRgba,
    gradientTop,
    gradientBottom,
    tintFilter,
    ambientGlowColor,
    vignetteOpacity,
    periodLabel,
    description,
    ambientTemperature,
  };
}
