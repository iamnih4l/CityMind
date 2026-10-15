import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  TimePeriod,
  OverlayIntensity,
  DayNightColorProfile,
  DayNightContextType,
} from '../types/dayNight.ts';
import {
  getTimePeriod,
  formatSimulatedTime,
  calculateColorProfile,
} from '../utils/dayNightCalculations.ts';

const DayNightContext = createContext<DayNightContextType | undefined>(undefined);

const STORAGE_KEY = 'citymind_daynight_settings_v1';

interface StoredSettings {
  simulatedHour: number;
  speedMultiplier: number;
  intensity: OverlayIntensity;
  isOverlayEnabled: boolean;
  isRunning: boolean;
}

export const DayNightProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved settings or initialize with sensible daylight default (13:45 / 1.75 afternoon)
  const [settings] = useState<StoredSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse DayNight settings', e);
    }
    // Default: 14:00 (2:00 PM), running, 5x speed, standard intensity
    return {
      simulatedHour: 14.0,
      speedMultiplier: 5,
      intensity: 'standard' as OverlayIntensity,
      isOverlayEnabled: true,
      isRunning: true,
    };
  });

  const [simulatedHour, setSimulatedHourState] = useState<number>(settings.simulatedHour);
  const [isRunning, setIsRunning] = useState<boolean>(settings.isRunning);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(settings.speedMultiplier);
  const [intensity, setIntensity] = useState<OverlayIntensity>(settings.intensity);
  const [isOverlayEnabled, setIsOverlayEnabled] = useState<boolean>(settings.isOverlayEnabled);
  const [isControllerOpen, setIsControllerOpen] = useState<boolean>(false);

  // Keep a ref for timer to avoid re-binding interval constantly
  const hourRef = useRef(simulatedHour);
  hourRef.current = simulatedHour;

  const setSimulatedHour = useCallback((h: number) => {
    const wrapped = ((h % 24) + 24) % 24;
    setSimulatedHourState(wrapped);
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    try {
      const payload: StoredSettings = {
        simulatedHour,
        speedMultiplier,
        intensity,
        isOverlayEnabled,
        isRunning,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      // Ignore quota errors
    }
  }, [simulatedHour, speedMultiplier, intensity, isOverlayEnabled, isRunning]);

  // Simulation timer tick: runs every 500ms
  useEffect(() => {
    if (!isRunning) return;

    // At 1x: 1 real second = 0.5 simulated minute (0.00833 hours)
    // Every 500ms (0.5s): advance by (0.5 * speedMultiplier / 120) hours
    const intervalMs = 500;
    const hoursPerTick = (speedMultiplier * (intervalMs / 1000)) / 120; // 1x = 1 sim min per 2s

    const timer = setInterval(() => {
      setSimulatedHourState((prev) => {
        const next = prev + hoursPerTick;
        return ((next % 24) + 24) % 24;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isRunning, speedMultiplier]);

  const toggleRunning = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const jumpToPeriod = useCallback((targetPeriod: TimePeriod) => {
    switch (targetPeriod) {
      case 'DAWN':
        setSimulatedHour(6.25); // 06:15 AM
        break;
      case 'DAY':
        setSimulatedHour(12.5); // 12:30 PM
        break;
      case 'DUSK':
        setSimulatedHour(18.75); // 06:45 PM
        break;
      case 'NIGHT':
        setSimulatedHour(23.5); // 11:30 PM
        break;
    }
  }, [setSimulatedHour]);

  const syncWithRealTime = useCallback(() => {
    const now = new Date();
    const currentDecHour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
    setSimulatedHour(currentDecHour);
  }, [setSimulatedHour]);

  const period = useMemo(() => getTimePeriod(simulatedHour), [simulatedHour]);

  const formattedTime = useMemo(() => formatSimulatedTime(simulatedHour), [simulatedHour]);

  const colorProfile: DayNightColorProfile = useMemo(() => {
    if (!isOverlayEnabled) {
      return calculateColorProfile(simulatedHour, 'off');
    }
    return calculateColorProfile(simulatedHour, intensity);
  }, [simulatedHour, isOverlayEnabled, intensity]);

  const starsVisible = useMemo(() => {
    const h = ((simulatedHour % 24) + 24) % 24;
    return isOverlayEnabled && intensity !== 'off' && (h >= 21.0 || h < 5.25);
  }, [simulatedHour, isOverlayEnabled, intensity]);

  const value: DayNightContextType = {
    simulatedHour,
    formattedTime,
    period,
    colorProfile,
    isRunning,
    speedMultiplier,
    intensity,
    isOverlayEnabled,
    isControllerOpen,
    starsVisible,
    setSimulatedHour,
    toggleRunning,
    setIsRunning,
    setSpeedMultiplier,
    setIntensity,
    setIsOverlayEnabled,
    setIsControllerOpen,
    jumpToPeriod,
    syncWithRealTime,
  };

  return <DayNightContext.Provider value={value}>{children}</DayNightContext.Provider>;
};

export const useDayNight = (): DayNightContextType => {
  const context = useContext(DayNightContext);
  if (!context) {
    throw new Error('useDayNight must be used within a DayNightProvider');
  }
  return context;
};
