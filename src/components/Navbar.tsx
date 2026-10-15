import React from 'react';
import { Play, Sparkles, AlertTriangle, Plus, Bell, Volume2, VolumeX, Map, BarChart3, MessageSquare, FileText } from 'lucide-react';
import { useCity } from '../context/CityContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import { DayNightClockBadge } from './DayNightControls.tsx';

interface NavbarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  onOpenNewScenarioModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  onOpenNewScenarioModal,
}) => {
  const { activeScenario, runSimulation, isSimulating, hasGeminiKey } = useCity();
  const { unreadCount, soundEnabled, toggleSound, setIsNotificationCenterOpen } = useNotifications();

  return (
    <header className="sticky top-0 z-40 bg-[#060b17]/85 backdrop-blur-2xl border-b border-white/10 shadow-[0_12px_36px_-10px_rgba(0,0,0,0.8)] px-4 sm:px-6 py-2.5 select-none no-print">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
        {/* Brand Wordmark & 3D Spatial Emblem */}
        <div className="flex items-center gap-3.5 shrink-0">
          <button
            onClick={() => onSelectView('overview')}
            className="flex items-center gap-3 text-left group"
          >
            {/* 3D Glowing Prism Emblem */}
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 p-0.5 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-transform duration-300 group-hover:scale-105">
              <div className="w-full h-full bg-[#050914] rounded-[10px] flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-sm bg-gradient-to-tr from-cyan-400 to-teal-300 rotate-45 shadow-[0_0_10px_#22d3ee]" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-extrabold tracking-wide text-white group-hover:text-cyan-300 transition-colors drop-shadow-sm">
                  CITYMIND
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold">
                  3D OS
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block tracking-wider uppercase font-medium">
                Multi-Agent Urban Simulation
              </span>
            </div>
          </button>
        </div>

        {/* 3D Segmented Navigation Deck */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-white/10 shadow-inner">
          {[
            { id: 'overview', label: 'METRO DIGITAL TWIN', icon: Map },
            { id: 'impact', label: '10-AGENT IMPACT AUDIT', icon: BarChart3 },
            { id: 'consult', label: 'AI SPECIALIST CONSULT', icon: MessageSquare },
            { id: 'reports', label: 'ARCHIVE & AUDIT DOSSIERS', icon: FileText },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectView(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-2 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-[0_4px_15px_-2px_rgba(6,182,212,0.5)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Primary Controls Strip */}
        <div className="flex items-center gap-2.5 shrink-0">
          {hasGeminiKey === false && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>KEY MISSING</span>
            </div>
          )}

          {/* Simulated Atmosphere Clock Badge */}
          <DayNightClockBadge />

          {/* 3D Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`btn-3d-secondary p-2 rounded-xl text-xs transition-colors ${
              soundEnabled ? 'text-cyan-300 border-cyan-500/40' : 'text-slate-500'
            }`}
            title={soundEnabled ? 'Spatial Audio Active' : 'Audio Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* 3D Telemetry Alerts Button */}
          <button
            onClick={() => setIsNotificationCenterOpen(true)}
            className="btn-3d-secondary px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 relative border-cyan-500/30 text-slate-200 hover:text-white"
            title="Urban Spatial Monitor & Telemetry Center"
          >
            <Bell className={`w-3.5 h-3.5 ${unreadCount > 0 ? 'text-amber-400 animate-bounce' : 'text-cyan-400'}`} />
            <span className="hidden sm:inline font-semibold">ALERTS</span>
            {unreadCount > 0 && (
              <span className="bg-rose-500 text-white font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold shadow-md">
                {unreadCount}
              </span>
            )}
          </button>

          {/* + Proposal Button */}
          <button
            onClick={onOpenNewScenarioModal}
            className="btn-3d-secondary px-3.5 py-1.5 rounded-xl text-xs text-cyan-300 hover:text-white flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="font-semibold">+ PROPOSAL</span>
          </button>

          {/* Primary Action Button */}
          {activeScenario && (
            <button
              onClick={() => {
                runSimulation(activeScenario.id);
                onSelectView('impact');
              }}
              disabled={isSimulating}
              className="btn-3d-primary px-4 py-1.5 rounded-xl text-xs flex items-center gap-2 shadow-[0_6px_20px_-3px_rgba(6,182,212,0.45)] disabled:opacity-50"
            >
              {isSimulating ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-slate-950" />
                  <span>SIMULATING...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-slate-950" />
                  <span>AUDIT SIMULATION</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="flex md:hidden items-center justify-around gap-1 pt-2 mt-2 border-t border-slate-800 text-xs">
        {[
          { id: 'overview', label: '3D TWIN', icon: Map },
          { id: 'impact', label: 'AUDIT', icon: BarChart3 },
          { id: 'consult', label: 'CONSULT', icon: MessageSquare },
          { id: 'reports', label: 'DOSSIERS', icon: FileText },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectView(tab.id)}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
