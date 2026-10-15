import React, { useState } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  Info,
  Trash2,
  CheckCheck,
  Zap,
  Activity,
  ArrowRight,
  Flame,
  Radio,
  Sliders,
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext.tsx';
import { RetroNotification } from '../types/notification.ts';

interface RetroNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateView?: (view: string) => void;
  onSelectEntity?: (entityId: string) => void;
}

export const RetroNotificationCenter: React.FC<RetroNotificationCenterProps> = ({
  isOpen,
  onClose,
  onNavigateView,
  onSelectEntity,
}) => {
  const {
    history,
    unreadCount,
    markAllAsRead,
    clearHistory,
    soundEnabled,
    toggleSound,
    triggerIncident,
    thresholdStatuses,
  } = useNotifications();

  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'EVENT' | 'INFO'>('ALL');
  const [activeTab, setActiveTab] = useState<'feed' | 'thresholds' | 'simulator'>('feed');

  if (!isOpen) return null;

  const filteredHistory = history.filter(n => {
    if (filter === 'ALL') return true;
    return n.severity === filter;
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in select-none font-sans"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#080e1c]/95 border border-white/15 rounded-3xl shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)] w-full max-w-4xl max-h-[88vh] flex flex-col text-slate-100 overflow-hidden backdrop-blur-3xl relative">
        {/* Top Rim Light */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent" />

        {/* Cinematic Header Bar */}
        <div className="bg-slate-900/80 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-white tracking-wide">
                SPATIAL URBAN TELEMETRY & ALERT CENTER
              </h3>
              <p className="text-xs text-slate-400">
                Continuous municipal telemetry across 7 structural & environmental indices
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleSound}
              className={`btn-3d-secondary px-3 py-1.5 text-xs rounded-xl flex items-center gap-1.5 ${
                soundEnabled ? 'text-cyan-300 border-cyan-500/30' : 'text-slate-500'
              }`}
              title={soundEnabled ? 'Spatial Audio Active' : 'Audio Muted'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{soundEnabled ? 'Audio On' : 'Muted'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center border border-white/10 transition-colors"
              title="Close Notification Center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Deck */}
        <div className="bg-slate-950/60 border-b border-white/10 px-6 pt-2 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-2">
            {[
              { id: 'feed', label: 'INCIDENT & EVENT LOG', icon: Radio, count: unreadCount },
              { id: 'thresholds', label: '7 SPATIAL THRESHOLDS', icon: Activity },
              { id: 'simulator', label: 'CRISIS STRESS SIMULATOR', icon: Zap },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 font-display text-xs font-semibold rounded-t-xl flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-slate-900 text-cyan-300 border-t border-x border-cyan-500/30 shadow-[0_-4px_15px_rgba(6,182,212,0.15)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {activeTab === 'feed' && history.length > 0 && (
            <div className="flex items-center gap-2 pb-2">
              <button
                onClick={markAllAsRead}
                className="text-xs text-cyan-400 hover:text-cyan-200 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-cyan-500/10 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
              <button
                onClick={clearHistory}
                className="text-xs text-rose-400 hover:text-rose-200 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Incident & Event Feed */}
        {activeTab === 'feed' && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#060a14]">
            {/* Filter Strip */}
            <div className="p-3.5 bg-slate-950/40 border-b border-white/5 flex items-center gap-2 flex-wrap px-6">
              <span className="text-xs text-slate-400 font-medium mr-1">Filter Severity:</span>
              {(['ALL', 'CRITICAL', 'WARNING', 'EVENT', 'INFO'] as const).map(sev => (
                <button
                  key={sev}
                  onClick={() => setFilter(sev)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filter === sev
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                      : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            {/* Event List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-20 space-y-2 text-slate-500">
                  <Activity className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="font-display font-semibold text-sm text-slate-300">NO TELEMETRY EVENTS IN LOG</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Launch multi-agent simulations or trigger crisis stress tests to monitor real-time spatial events.
                  </p>
                </div>
              ) : (
                filteredHistory.map(item => (
                  <CinematicHistoryCard
                    key={item.id}
                    notification={item}
                    onNavigateView={onNavigateView}
                    onSelectEntity={onSelectEntity}
                    onCloseCenter={onClose}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: 7 Spatial Urban Thresholds */}
        {activeTab === 'thresholds' && (
          <div className="flex-1 overflow-y-auto p-6 bg-[#060a14] space-y-4">
            <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-4 space-y-1">
              <h4 className="font-display text-sm font-bold text-cyan-300">
                ACTIVE SPATIAL TELEMETRY BOUNDARIES
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Autonomous monitors actively evaluate municipal load against sustainability and safety bounds. When indicators breach threshold limits, instant spatial pop-up alerts trigger with audio feedback.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {thresholdStatuses.map(t => {
                const isCritical = t.status === 'CRITICAL';
                const isWarning = t.status === 'WARNING';
                const pct = Math.min(100, Math.round((t.currentValue / (t.limitValue || 100)) * 100));

                return (
                  <div
                    key={t.id}
                    className={`rounded-2xl p-4 space-y-3 border backdrop-blur-md transition-all ${
                      isCritical
                        ? 'bg-rose-950/20 border-rose-500/40 shadow-[0_8px_25px_-5px_rgba(225,29,72,0.25)]'
                        : isWarning
                        ? 'bg-amber-950/20 border-amber-500/40 shadow-[0_8px_25px_-5px_rgba(245,158,11,0.2)]'
                        : 'bg-slate-900/60 border-white/10 shadow-lg'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display text-xs font-bold text-white tracking-wide">{t.title}</span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                          isCritical
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                            : isWarning
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Current: <strong className="text-white font-mono">{t.currentValue} {t.unit}</strong></span>
                        <span>Safety Bound: <strong className="text-amber-400 font-mono">{t.limitValue} {t.unit}</strong></span>
                      </div>

                      {/* 3D Progress Gauge */}
                      <div className="h-2 rounded-full bg-slate-950 overflow-hidden border border-white/5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCritical
                              ? 'bg-gradient-to-r from-rose-500 to-red-400'
                              : isWarning
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                              : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed font-normal">
                      {t.description}
                    </p>

                    {t.affectedEntityName && (
                      <div className="pt-1 flex items-center justify-between text-xs text-cyan-400">
                        <span className="truncate">Key Asset: {t.affectedEntityName}</span>
                        {t.affectedEntityId && onSelectEntity && (
                          <button
                            onClick={() => {
                              onSelectEntity(t.affectedEntityId!);
                              onClose();
                            }}
                            className="hover:underline font-semibold ml-2 shrink-0"
                          >
                            Inspect Asset →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Crisis Stress Simulator */}
        {activeTab === 'simulator' && (
          <div className="flex-1 overflow-y-auto p-6 bg-[#060a14] space-y-4">
            <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-4 space-y-1">
              <h4 className="font-display text-sm font-bold text-cyan-300">
                DISPATCH SPATIAL CRISIS EVENTS
              </h4>
              <p className="text-xs text-slate-300">
                Trigger simulated municipal stress events below to experience cinematic 3D alerts, sound chimes, metric gauges, and automated action routing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  id: 'FLASH_FLOOD',
                  title: '100-YEAR FLASH FLOOD SURGE',
                  desc: 'Watershed gauge surcharge to 118% capacity in Waterfront District.',
                  severity: 'CRITICAL',
                  border: 'border-rose-500/40 bg-rose-950/15',
                },
                {
                  id: 'POWER_BROWNOUT',
                  title: 'SUBSTATION TRANSFORMER OVERLOAD',
                  desc: 'Thermal overload alarm at Industrial Substation Beta with grid load at 96%.',
                  severity: 'CRITICAL',
                  border: 'border-rose-500/40 bg-rose-950/15',
                },
                {
                  id: 'HOSPITAL_SURGE',
                  title: 'EMERGENCY INTAKE CAPACITY BREACH',
                  desc: 'General Hospital ER utilization reaches 96.2% triggering regional reroutes.',
                  severity: 'CRITICAL',
                  border: 'border-rose-500/40 bg-rose-950/15',
                },
                {
                  id: 'TRANSIT_GRIDLOCK',
                  title: 'EXPRESSWAY CHOKEPOINT GRIDLOCK',
                  desc: 'Arterial drops speeds below 8 km/h, delaying emergency response corridors.',
                  severity: 'WARNING',
                  border: 'border-amber-500/40 bg-amber-950/15',
                },
                {
                  id: 'RENT_HIKE_PROTEST',
                  title: 'TENANT DISPLACEMENT STRESS WARNING',
                  desc: 'Citizen Wellbeing Agent reports 72% renter eviction vulnerability.',
                  severity: 'WARNING',
                  border: 'border-amber-500/40 bg-amber-950/15',
                },
              ].map(sim => (
                <div
                  key={sim.id}
                  className={`rounded-2xl p-4 space-y-3 flex flex-col justify-between border backdrop-blur-md ${sim.border}`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-xs font-bold text-white tracking-wide">{sim.title}</span>
                      <span className="font-mono text-[10px] font-semibold text-amber-400">[{sim.severity}]</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{sim.desc}</p>
                  </div>

                  <button
                    onClick={() => triggerIncident(sim.id as any)}
                    className="btn-3d-primary w-full py-2 text-xs flex items-center justify-center gap-1.5 mt-2"
                  >
                    <Zap className="w-3.5 h-3.5 text-slate-950" />
                    <span>DISPATCH SIMULATED CRISIS</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface CardProps {
  notification: RetroNotification;
  onNavigateView?: (view: string) => void;
  onSelectEntity?: (entityId: string) => void;
  onCloseCenter: () => void;
}

const CinematicHistoryCard: React.FC<CardProps> = ({
  notification,
  onNavigateView,
  onSelectEntity,
  onCloseCenter,
}) => {
  const isCritical = notification.severity === 'CRITICAL';
  const isWarning = notification.severity === 'WARNING';
  const isEvent = notification.severity === 'EVENT';

  const dateStr = new Date(notification.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const handleAction = () => {
    if (notification.action?.onClick) notification.action.onClick();
    if (notification.action?.entityId && onSelectEntity) onSelectEntity(notification.action.entityId);
    if (notification.action?.viewTarget && onNavigateView) onNavigateView(notification.action.viewTarget);
    onCloseCenter();
  };

  return (
    <div
      className={`rounded-2xl p-4 space-y-2 border backdrop-blur-md transition-all ${
        isCritical
          ? 'bg-rose-950/20 border-rose-500/30'
          : isWarning
          ? 'bg-amber-950/20 border-amber-500/30'
          : isEvent
          ? 'bg-cyan-950/20 border-cyan-500/30'
          : 'bg-emerald-950/20 border-emerald-500/30'
      }`}
    >
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isCritical
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : isWarning
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : isEvent
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {notification.severity}
          </span>
          <span className="font-mono text-slate-300 font-semibold">{notification.code}</span>
        </div>
        <span className="font-mono text-xs text-slate-500">{dateStr}</span>
      </div>

      <h5 className="font-display text-sm font-bold text-white tracking-tight">{notification.title}</h5>
      <p className="text-xs text-slate-300 leading-relaxed">{notification.message}</p>

      {notification.details && (
        <p className="text-xs text-slate-400 bg-black/40 p-2.5 rounded-xl border border-white/5 font-mono leading-relaxed">
          {notification.details}
        </p>
      )}

      {notification.action && (
        <div className="pt-1 flex justify-end">
          <button
            onClick={handleAction}
            className="btn-3d-secondary px-3 py-1 text-xs text-cyan-300 hover:text-white flex items-center gap-1.5"
          >
            <span>{notification.action.label}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
