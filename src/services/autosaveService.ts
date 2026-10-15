import { CityEntity, RedevelopmentScenario, SimulationReport } from '../types/city.ts';

export interface AutoSavePayload {
  version: string;
  savedAt: string; // ISO string
  activeScenarioId: string | null;
  activeReportId: string | null;
  selectedEntityId: string | null;
  entities: CityEntity[];
  scenarios: RedevelopmentScenario[];
  simulationReports: SimulationReport[];
  stats: {
    entityCount: number;
    scenarioCount: number;
    reportCount: number;
  };
}

export interface AutoSaveMeta {
  lastSavedAt: string | null;
  saveCount: number;
  entityCount: number;
  scenarioCount: number;
  reportCount: number;
  byteSize: number;
}

export const AUTOSAVE_STORAGE_KEYS = {
  SNAPSHOT: 'citymind_autosave_state_v1',
  META: 'citymind_autosave_meta_v1',
  BACKUP: 'citymind_autosave_backup_v1',
};

const DEFAULT_INTERVAL_MS = 30000; // 30 seconds

/**
 * Saves full simulation snapshot to localStorage.
 */
export function saveSimulationSnapshot(payload: Omit<AutoSavePayload, 'version' | 'savedAt' | 'stats'>): AutoSaveMeta {
  const timestamp = new Date().toISOString();
  const snapshot: AutoSavePayload = {
    version: '1.0.0',
    savedAt: timestamp,
    activeScenarioId: payload.activeScenarioId,
    activeReportId: payload.activeReportId,
    selectedEntityId: payload.selectedEntityId,
    entities: payload.entities,
    scenarios: payload.scenarios,
    simulationReports: payload.simulationReports,
    stats: {
      entityCount: payload.entities.length,
      scenarioCount: payload.scenarios.length,
      reportCount: payload.simulationReports.length,
    },
  };

  const serialized = JSON.stringify(snapshot);

  // Rotate previous snapshot to backup before overwriting to prevent corruptions
  try {
    const existing = localStorage.getItem(AUTOSAVE_STORAGE_KEYS.SNAPSHOT);
    if (existing) {
      localStorage.setItem(AUTOSAVE_STORAGE_KEYS.BACKUP, existing);
    }
  } catch (err) {
    console.warn('[AutoSave] Backup rotation warning:', err);
  }

  // Save current snapshot
  localStorage.setItem(AUTOSAVE_STORAGE_KEYS.SNAPSHOT, serialized);

  // Read existing save count
  let saveCount = 1;
  try {
    const existingMetaStr = localStorage.getItem(AUTOSAVE_STORAGE_KEYS.META);
    if (existingMetaStr) {
      const parsed = JSON.parse(existingMetaStr);
      saveCount = (parsed.saveCount || 0) + 1;
    }
  } catch {
    saveCount = 1;
  }

  const meta: AutoSaveMeta = {
    lastSavedAt: timestamp,
    saveCount,
    entityCount: snapshot.stats.entityCount,
    scenarioCount: snapshot.stats.scenarioCount,
    reportCount: snapshot.stats.reportCount,
    byteSize: serialized.length,
  };

  localStorage.setItem(AUTOSAVE_STORAGE_KEYS.META, JSON.stringify(meta));
  return meta;
}

/**
 * Reads existing auto-save snapshot from localStorage.
 */
export function loadSimulationSnapshot(): AutoSavePayload | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_STORAGE_KEYS.SNAPSHOT);
    if (raw) {
      return JSON.parse(raw);
    }
    // Fallback to backup if primary is empty
    const backup = localStorage.getItem(AUTOSAVE_STORAGE_KEYS.BACKUP);
    if (backup) {
      return JSON.parse(backup);
    }
  } catch (err) {
    console.error('[AutoSave] Failed to restore snapshot:', err);
  }
  return null;
}

/**
 * Returns metadata about the last auto-save.
 */
export function getAutoSaveMetadata(): AutoSaveMeta | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_STORAGE_KEYS.META);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore parse error
  }
  return null;
}

/**
 * Starts a 30-second recurring background service with cleanup and beforeunload handler.
 */
export function initBackgroundAutoSaveService(
  getState: () => Omit<AutoSavePayload, 'version' | 'savedAt' | 'stats'>,
  callbacks?: {
    onBeforeSave?: () => void;
    onSaveSuccess?: (meta: AutoSaveMeta) => void;
    onSaveError?: (error: unknown) => void;
  },
  intervalMs: number = DEFAULT_INTERVAL_MS
): () => void {
  // Execute save logic
  const performSave = () => {
    try {
      callbacks?.onBeforeSave?.();
      const state = getState();
      const meta = saveSimulationSnapshot(state);
      callbacks?.onSaveSuccess?.(meta);
    } catch (err) {
      console.error('[AutoSave Service] Error saving simulation state:', err);
      callbacks?.onSaveError?.(err);
    }
  };

  // Run periodic 30s background timer
  const intervalId = window.setInterval(performSave, intervalMs);

  // Also hook into beforeunload/pagehide to safeguard unsaved state during navigation/refresh
  const handlePageUnload = () => {
    performSave();
  };

  window.addEventListener('beforeunload', handlePageUnload);
  window.addEventListener('pagehide', handlePageUnload);

  // Return teardown function
  return () => {
    window.clearInterval(intervalId);
    window.removeEventListener('beforeunload', handlePageUnload);
    window.removeEventListener('pagehide', handlePageUnload);
  };
}
