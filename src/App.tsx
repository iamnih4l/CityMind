import React, { useState, useEffect } from 'react';
import { CityProvider, useCity } from './context/CityContext.tsx';
import { NotificationProvider, useNotifications } from './context/NotificationContext.tsx';
import { DayNightProvider } from './context/DayNightContext.tsx';
import { DayNightOverlay } from './components/DayNightOverlay.tsx';
import { DayNightControllerModal } from './components/DayNightControls.tsx';
import { RetroNotificationStack } from './components/RetroNotificationStack.tsx';
import { RetroNotificationCenter } from './components/RetroNotificationCenter.tsx';
import { SyntheticBanner } from './components/SyntheticBanner.tsx';
import { Navbar } from './components/Navbar.tsx';
import { CityOverview } from './components/CityOverview.tsx';
import { ScenarioLab } from './components/ScenarioLab.tsx';
import { CitizensView } from './components/CitizensView.tsx';
import { OrganizationsView } from './components/OrganizationsView.tsx';
import { FacilitiesView } from './components/FacilitiesView.tsx';
import { NetworkGraphView } from './components/NetworkGraphView.tsx';
import { ImpactAnalysisView } from './components/ImpactAnalysisView.tsx';
import { ReportsHistoryView } from './components/ReportsHistoryView.tsx';
import { DataManagementView } from './components/DataManagementView.tsx';
import { AIAgentConsultView } from './components/AIAgentConsultView.tsx';
import { EntityDrawer } from './components/EntityDrawer.tsx';
import { retroAudio } from './utils/retroAudio.ts';
import {
  Map,
  Compass,
  MessageSquare,
  BarChart3,
  FileText,
  Sparkles,
  Users,
  Building2,
  Activity,
  Share2,
  Database,
  Radio,
  Terminal,
} from 'lucide-react';

function CityMindMain() {
  const [currentView, setCurrentView] = useState<string>('overview');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { entities, setSelectedEntityId } = useCity();
  const { evaluateThresholds, isNotificationCenterOpen, setIsNotificationCenterOpen } = useNotifications();

  // Initial and periodic urban threshold scan
  useEffect(() => {
    evaluateThresholds(entities);
  }, [entities, evaluateThresholds]);

  const handleSelectView = (view: string) => {
    if (view !== currentView) {
      retroAudio.play('CLICK');
      setCurrentView(view);
    }
  };

  const primaryNavItems = [
    { id: 'overview', label: 'C4ISR DIGITAL TWIN', icon: Map, color: 'text-cyan-400' },
    { id: 'scenarios', label: 'SCENARIO LAB & OPS', icon: Compass, color: 'text-amber-400' },
    { id: 'impact', label: '10-AGENT IMPACT AUDIT', icon: BarChart3, color: 'text-rose-400' },
    { id: 'consult', label: 'AI SPECIALIST BUREAU', icon: MessageSquare, color: 'text-emerald-400' },
    { id: 'reports', label: 'EXECUTIVE DOSSIERS', icon: FileText, color: 'text-blue-400' },
  ];

  const registryNavItems = [
    { id: 'citizens', label: 'CITIZEN REGISTRY', icon: Users, color: 'text-cyan-400' },
    { id: 'organizations', label: 'COMMERCE MATRIX', icon: Building2, color: 'text-indigo-400' },
    { id: 'facilities', label: 'CIVIC FACILITIES', icon: Activity, color: 'text-rose-400' },
    { id: 'network', label: 'GRID TOPOLOGY', icon: Share2, color: 'text-amber-400' },
    { id: 'data', label: 'MASTER DATA REGISTRY', icon: Database, color: 'text-slate-400' },
  ];

  return (
    <div className="min-h-screen bg-[#040711] text-slate-100 flex flex-col font-sans relative">
      {/* Dynamic Day/Night Atmospheric Photometric Overlay */}
      <DayNightOverlay />

      {/* 1. Persistent Data Provenance Disclosure Banner */}
      <SyntheticBanner />

      {/* 2. Top Navigation Header with Command Center Badges & Clock */}
      <Navbar
        currentView={currentView}
        onSelectView={handleSelectView}
        onOpenNewScenarioModal={() => {
          handleSelectView('scenarios');
          setIsCreateModalOpen(true);
        }}
      />

      {/* 3. Main Workspace Layout */}
      <div className="flex-1 flex w-full max-w-[1600px] mx-auto p-3 sm:p-5 gap-5">
        {/* Sidebar Navigation: Command Center Dock */}
        <aside className="w-64 shrink-0 rounded-2xl command-panel hud-brackets border-cyan-500/20 p-3.5 hidden md:flex flex-col justify-between shadow-[0_20px_45px_-15px_rgba(0,0,0,0.8)] backdrop-blur-xl select-none no-print">
          <div className="space-y-4">
            {/* Primary Command Modules */}
            <div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-white/5 flex items-center justify-between mb-2">
                <span className="font-display text-[10px] font-bold text-cyan-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Terminal className="w-3 h-3 text-cyan-400" />
                  COMMAND MODULES
                </span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              </div>

              <div className="space-y-1">
                {primaryNavItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectView(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 text-left border ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500/25 via-blue-500/15 to-transparent text-cyan-200 border-cyan-500/50 shadow-[0_4px_20px_-2px_rgba(6,182,212,0.35)] translate-x-1'
                          : 'bg-transparent text-slate-400 border-transparent hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : item.color}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tactical Municipal Registries */}
            <div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-white/5 flex items-center justify-between mb-2">
                <span className="font-display text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-slate-500" />
                  SECTOR REGISTRIES
                </span>
                <span className="text-[10px] font-mono text-slate-500">5 LIVE</span>
              </div>

              <div className="space-y-1">
                {registryNavItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectView(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 text-left border ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500/25 via-blue-500/15 to-transparent text-cyan-200 border-cyan-500/50 shadow-[0_4px_20px_-2px_rgba(6,182,212,0.35)] translate-x-1'
                          : 'bg-transparent text-slate-400 border-transparent hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-400' : item.color}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Telemetry Badge */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/20 space-y-1.5 mt-3">
            <div className="font-display text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>C4ISR URBAN SYNTHESIS</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
              10 AI Specialist Bureaus evaluating multi-stakeholder consequences in real-time.
            </p>
          </div>
        </aside>

        {/* Viewport Content with Cinematic Camera Pan Animation on view switch */}
        <main className="flex-1 min-w-0">
          <div key={currentView} className="cinematic-view-pan">
            {currentView === 'overview' && (
              <CityOverview
                onOpenScenarioLab={() => handleSelectView('scenarios')}
                onOpenImpactAnalysis={() => handleSelectView('impact')}
              />
            )}

            {currentView === 'scenarios' && (
              <ScenarioLab
                onOpenImpactAnalysis={() => handleSelectView('impact')}
                isCreateModalOpen={isCreateModalOpen}
                setIsCreateModalOpen={setIsCreateModalOpen}
              />
            )}

            {currentView === 'impact' && <ImpactAnalysisView />}
            {currentView === 'consult' && <AIAgentConsultView />}
            {currentView === 'reports' && <ReportsHistoryView />}
            {currentView === 'citizens' && <CitizensView />}
            {currentView === 'organizations' && <OrganizationsView />}
            {currentView === 'facilities' && <FacilitiesView />}
            {currentView === 'network' && <NetworkGraphView />}
            {currentView === 'data' && <DataManagementView />}
          </div>
        </main>
      </div>

      {/* Global Slide-Over Entity Inspector Drawer */}
      <EntityDrawer />

      {/* Atmospheric Day/Night Detailed Controller Modal */}
      <DayNightControllerModal />

      {/* Floating Retro Notification Pop-up Stack */}
      <RetroNotificationStack
        onNavigateView={handleSelectView}
        onSelectEntity={setSelectedEntityId}
      />

      {/* Telemetry & Alert Center Drawer / Modal */}
      <RetroNotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        onNavigateView={handleSelectView}
        onSelectEntity={setSelectedEntityId}
      />
    </div>
  );
}

export default function App() {
  return (
    <CityProvider>
      <NotificationProvider>
        <DayNightProvider>
          <CityMindMain />
        </DayNightProvider>
      </NotificationProvider>
    </CityProvider>
  );
}
