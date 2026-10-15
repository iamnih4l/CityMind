export type TimePeriod = 'DAWN' | 'DAY' | 'DUSK' | 'NIGHT';

export type OverlayIntensity = 'subtle' | 'standard' | 'deep' | 'off';

export interface DayNightColorProfile {
  overlayRgba: string;
  gradientTop: string;
  gradientBottom: string;
  tintFilter: string; // CSS filter string e.g. "brightness(0.92) contrast(1.02) hue-rotate(-5deg)"
  ambientGlowColor: string;
  vignetteOpacity: number;
  periodLabel: string;
  description: string;
  ambientTemperature: string; // e.g. "21°C", "Cool evening breeze"
}

export interface DayNightContextType {
  simulatedHour: number; // 0.0 to 23.999
  formattedTime: string; // "HH:MM"
  period: TimePeriod;
  colorProfile: DayNightColorProfile;
  isRunning: boolean;
  speedMultiplier: number; // 1, 5, 15, 60
  intensity: OverlayIntensity;
  isOverlayEnabled: boolean;
  isControllerOpen: boolean;
  starsVisible: boolean;
  
  // Actions
  setSimulatedHour: (hour: number) => void;
  toggleRunning: () => void;
  setIsRunning: (running: boolean) => void;
  setSpeedMultiplier: (speed: number) => void;
  setIntensity: (intensity: OverlayIntensity) => void;
  setIsOverlayEnabled: (enabled: boolean) => void;
  setIsControllerOpen: (open: boolean) => void;
  jumpToPeriod: (period: TimePeriod) => void;
  syncWithRealTime: () => void;
}
