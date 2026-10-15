import React, { useState, useEffect } from 'react';
import { RefreshCw, Database, HardDrive, CheckCircle2 } from 'lucide-react';
import { useCity } from '../context/CityContext.tsx';

export const SyntheticBanner: React.FC = () => {
  const {
    resetToSyntheticDemoData,
    entities,
    lastAutoSavedAt,
    isAutoSaving,
    autoSaveStats,
    forceSaveNow,
  } = useCity();

  const [formattedTime, setFormattedTime] = useState<string>('Just now');

  useEffect(() => {
    if (!lastAutoSavedAt) {
      setFormattedTime('Active');
      return;
    }
    const update = () => {
      try {
        const d = new Date(lastAutoSavedAt);
        setFormattedTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch {
        setFormattedTime('Saved');
      }
    };
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, [lastAutoSavedAt]);

  const syntheticCount = entities.filter(e => e.provenance === 'SYNTHETIC').length;
  const userCount = entities.filter(e => e.provenance === 'USER_PROVIDED').length;

  return (
    <div className="bg-[#030610]/90 border-b border-white/5 text-xs px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-3 text-slate-300 no-print select-none backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 text-cyan-300 font-medium text-xs">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-white">City Baseline Dataset</span>
        </div>
        <span className="text-slate-600 hidden sm:inline">·</span>
        <span className="hidden md:inline text-xs text-slate-400">
          Metropolitan Entity Graph · Deterministic Simulation Baseline
        </span>
        <span className="hidden sm:inline text-xs text-slate-500 font-mono">
          ({syntheticCount} Entities)
        </span>
      </div>

      {/* 30-Second Background Auto-Save Service Live Indicator */}
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs transition-colors ${
            isAutoSaving
              ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
              : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
          }`}
          title="Background service automatically preserves all simulation models, scenarios, and AI audit reports to localStorage every 30 seconds."
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isAutoSaving ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'
            }`}
          />
          <span className="font-medium text-[11px]">
            {isAutoSaving ? 'Auto-saving...' : `Auto-Save: ${formattedTime}`}
          </span>
          {autoSaveStats && (
            <span className="hidden lg:inline text-slate-400 font-mono text-[10px] ml-1">
              ({autoSaveStats.saveCount} saves · {Math.round(autoSaveStats.byteSize / 1024)} KB)
            </span>
          )}
          <button
            onClick={forceSaveNow}
            disabled={isAutoSaving}
            className="ml-1 text-cyan-400 hover:text-cyan-200 underline text-[11px] font-medium cursor-pointer"
            title="Force immediate localStorage snapshot"
          >
            Save now
          </button>
        </div>

        <button
          onClick={() => {
            if (window.confirm('Reset the city dataset back to the deterministic synthetic baseline? All custom scenario edits will be reverted.')) {
              resetToSyntheticDemoData();
            }
          }}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-white/5 transition-colors"
          title="Reset to synthetic baseline"
        >
          <RefreshCw className="w-3 h-3 text-cyan-400" />
          <span>Reset Baseline</span>
        </button>
      </div>
    </div>
  );
};
