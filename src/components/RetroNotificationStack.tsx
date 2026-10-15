import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Sparkles,
  Info,
  X,
  ExternalLink,
  Volume2,
  VolumeX,
  ArrowRight,
  ShieldAlert,
  Activity,
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext.tsx';
import { RetroNotification } from '../types/notification.ts';

interface RetroNotificationStackProps {
  onNavigateView?: (view: string) => void;
  onSelectEntity?: (entityId: string) => void;
}

export const RetroNotificationStack: React.FC<RetroNotificationStackProps> = ({
  onNavigateView,
  onSelectEntity,
}) => {
  const {
    notifications,
    dismissNotification,
    dismissAll,
    soundEnabled,
    toggleSound,
    setIsNotificationCenterOpen,
  } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3.5 max-w-[440px] w-full pointer-events-none select-none px-3 sm:px-0 font-sans"
      role="region"
      aria-label="Urban Spatial Alerts"
    >
      {/* Top action strip if multiple alerts */}
      {notifications.length > 1 && (
        <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-xl border border-white/10 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8)] px-3.5 py-1.5 rounded-xl flex items-center justify-between w-full text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-semibold text-amber-300">{notifications.length} Active Spatial Alerts</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSound}
              className="text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              title={soundEnabled ? 'Mute audio' : 'Enable audio'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            </button>
            <button
              onClick={() => setIsNotificationCenterOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 hover:underline font-medium"
            >
              Log
            </button>
            <button
              onClick={dismissAll}
              className="text-rose-400 hover:text-rose-300 hover:underline font-medium"
            >
              Dismiss all
            </button>
          </div>
        </div>
      )}

      {/* 3D Pop-up Cards Stack */}
      <div className="flex flex-col gap-3.5 w-full">
        {notifications.map(notif => (
          <CinematicNotificationItem
            key={notif.id}
            notification={notif}
            onDismiss={() => dismissNotification(notif.id)}
            onNavigateView={onNavigateView}
            onSelectEntity={onSelectEntity}
          />
        ))}
      </div>
    </div>
  );
};

interface ItemProps {
  notification: RetroNotification;
  onDismiss: () => void;
  onNavigateView?: (view: string) => void;
  onSelectEntity?: (entityId: string) => void;
}

const CinematicNotificationItem: React.FC<ItemProps> = ({
  notification,
  onDismiss,
  onNavigateView,
  onSelectEntity,
}) => {
  const [progress, setProgress] = useState(100);
  const [isHovered, setIsHovered] = useState(false);

  const duration = notification.durationMs || 8000;

  useEffect(() => {
    if (isHovered || duration <= 0) return;

    const intervalTime = 50;
    const decrement = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev - decrement;
        return next > 0 ? next : 0;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [duration, isHovered]);

  const getStyleConfigs = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          bg: 'bg-gradient-to-b from-[#1c080d]/95 to-[#120508]/95',
          border: 'border-rose-500/40',
          shadow: 'shadow-[0_25px_50px_-12px_rgba(225,29,72,0.4)]',
          glow: 'from-rose-500/20 to-transparent',
          headerBg: 'text-rose-200 border-b border-rose-500/20',
          badgeText: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
          icon: ShieldAlert,
          iconColor: 'text-rose-400',
          meterFill: 'bg-gradient-to-r from-rose-500 to-red-400',
          btnBg: 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white',
          pulse: 'bg-rose-400',
        };
      case 'WARNING':
        return {
          bg: 'bg-gradient-to-b from-[#1c1406]/95 to-[#120d04]/95',
          border: 'border-amber-500/40',
          shadow: 'shadow-[0_25px_50px_-12px_rgba(245,158,11,0.35)]',
          glow: 'from-amber-500/20 to-transparent',
          headerBg: 'text-amber-200 border-b border-amber-500/20',
          badgeText: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
          icon: AlertTriangle,
          iconColor: 'text-amber-400',
          meterFill: 'bg-gradient-to-r from-amber-500 to-yellow-400',
          btnBg: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold',
          pulse: 'bg-amber-400',
        };
      case 'EVENT':
        return {
          bg: 'bg-gradient-to-b from-[#08182b]/95 to-[#040e1a]/95',
          border: 'border-cyan-500/40',
          shadow: 'shadow-[0_25px_50px_-12px_rgba(6,182,212,0.35)]',
          glow: 'from-cyan-500/20 to-transparent',
          headerBg: 'text-cyan-200 border-b border-cyan-500/20',
          badgeText: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300',
          icon: Sparkles,
          iconColor: 'text-cyan-400',
          meterFill: 'bg-gradient-to-r from-cyan-400 to-blue-500',
          btnBg: 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold',
          pulse: 'bg-cyan-400',
        };
      default:
        return {
          bg: 'bg-gradient-to-b from-[#061c16]/95 to-[#03110d]/95',
          border: 'border-emerald-500/40',
          shadow: 'shadow-[0_25px_50px_-12px_rgba(16,185,129,0.35)]',
          glow: 'from-emerald-500/20 to-transparent',
          headerBg: 'text-emerald-200 border-b border-emerald-500/20',
          badgeText: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
          icon: Info,
          iconColor: 'text-emerald-400',
          meterFill: 'bg-gradient-to-r from-emerald-500 to-teal-400',
          btnBg: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold',
          pulse: 'bg-emerald-400',
        };
    }
  };

  const theme = getStyleConfigs(notification.severity);
  const Icon = theme.icon;

  const handleActionClick = () => {
    if (notification.action?.onClick) {
      notification.action.onClick();
    }
    if (notification.action?.entityId && onSelectEntity) {
      onSelectEntity(notification.action.entityId);
    }
    if (notification.action?.viewTarget && onNavigateView) {
      onNavigateView(notification.action.viewTarget);
    }
    onDismiss();
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`pointer-events-auto rounded-2xl ${theme.bg} border ${theme.border} ${theme.shadow} backdrop-blur-2xl transition-all duration-300 animate-in fade-in slide-in-from-right-4 w-full relative overflow-hidden`}
    >
      {/* 3D Top Edge Rim Highlight */}
      <div className={`absolute top-0 inset-x-0 h-px bg-gradient-to-r ${theme.glow}`} />

      {/* Header Bar */}
      <div className={`px-4 py-2.5 flex items-center justify-between ${theme.headerBg}`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full ${theme.pulse} animate-ping shrink-0`} />
          <Icon className={`w-4 h-4 shrink-0 ${theme.iconColor}`} />
          <span className="font-display text-xs font-bold uppercase tracking-wider truncate">
            {notification.severity === 'CRITICAL' && 'CRITICAL BOUNDARY BREACH'}
            {notification.severity === 'WARNING' && 'URBAN THRESHOLD ALERT'}
            {notification.severity === 'EVENT' && 'SIMULATION EVENT'}
            {notification.severity === 'INFO' && 'SYSTEM TELEMETRY'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${theme.badgeText}`}>
            {notification.code}
          </span>
          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 space-y-2.5 font-sans">
        <h4 className="font-display text-sm font-bold text-white leading-snug drop-shadow-sm">
          {notification.title}
        </h4>

        <p className="text-xs text-slate-300 leading-relaxed font-normal">
          {notification.message}
        </p>

        {notification.details && (
          <p className="text-[11px] text-slate-400 bg-black/40 p-2.5 rounded-xl border border-white/5 leading-relaxed font-mono">
            {notification.details}
          </p>
        )}

        {/* 3D Metric Value Indicator Block */}
        {notification.metricValue && (
          <div className="bg-slate-950/80 rounded-xl border border-white/10 p-2.5 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-display font-semibold tracking-wider">
                {notification.metricLabel || 'CURRENT VALUE'}
              </span>
              <span className="text-white font-mono font-bold text-sm">{notification.metricValue}</span>
            </div>
            {notification.thresholdLimit && (
              <div className="text-right">
                <span className="text-slate-400 block text-[10px] uppercase font-display font-semibold tracking-wider">
                  SAFETY LIMIT
                </span>
                <span className="text-amber-400 font-mono font-bold text-sm">{notification.thresholdLimit}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons Strip */}
        <div className="pt-1 flex items-center justify-between gap-3">
          {notification.action ? (
            <button
              onClick={handleActionClick}
              className={`px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md ${theme.btnBg}`}
            >
              <span>{notification.action.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onDismiss}
            className="btn-3d-secondary px-3 py-1.5 text-xs text-slate-300 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      </div>

      {/* Smooth Gradient Countdown Progress Bar */}
      {duration > 0 && (
        <div className="h-1 bg-black/60 w-full overflow-hidden">
          <div
            className={`h-full ${theme.meterFill} transition-all duration-75`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
