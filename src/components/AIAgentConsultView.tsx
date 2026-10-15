import React, { useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  Shield,
  Activity,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  Layers,
  ArrowRight,
  Bot,
  User,
} from 'lucide-react';
import { useCity } from '../context/CityContext.tsx';

interface ConsultationMessage {
  id: string;
  sender: 'user' | 'agent';
  agentRole?: string;
  agentName?: string;
  question?: string;
  answer?: string;
  recommendedAdjustment?: string;
  confidence?: string;
  keyConcerns?: string[];
  timestamp: string;
}

export const AIAgentConsultView: React.FC = () => {
  const { activeScenario, activeReport, entities, consultAgents, isSimulating } = useCity();

  const [question, setQuestion] = useState('');
  const [selectedAgentRole, setSelectedAgentRole] = useState('ALL');
  const [isAsking, setIsAsking] = useState(false);
  const [history, setHistory] = useState<ConsultationMessage[]>([
    {
      id: 'welcome-1',
      sender: 'agent',
      agentRole: 'CONSORTIUM_PANEL',
      agentName: 'CONSORTIUM LEAD & 10 SPECIALIST AGENTS',
      answer:
        'System connected. We are the CityMind Specialist AI Swarm. Ask us questions regarding the active proposal, evaluate unintended consequences on residents, or request evidence-backed mitigations.',
      recommendedAdjustment: 'Inquire about freight delivery windows, stormwater retention, or transit accessibility.',
      confidence: 'HIGH',
      keyConcerns: ['Emergency response ingress times', 'Footfall disruption for ground-floor retail'],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const targetZone = entities.find(e => e.id === activeScenario?.zoneId && e.type === 'ZONE');

  const specialistAgents = [
    { role: 'ALL', name: 'PLENARY CONSORTIUM (ALL 10)', icon: '★', desc: 'Holistic cross-discipline synthesis across all city systems' },
    { role: 'CITIZEN_WELLBEING', name: 'HOUSING & CITIZEN DEMOGRAPHICS', icon: '👥', desc: 'Housing tenure, displacement vulnerability, noise impact' },
    { role: 'EMERGENCY_SERVICES', name: 'EMERGENCY & FIRST RESPONDERS', icon: '🚨', desc: 'Ambulance ingress, fire apparatus access, evacuation routes' },
    { role: 'BUSINESS_ECONOMIC', name: 'COMMERCIAL & ECONOMIC VITALITY', icon: '💼', desc: 'Retail footfall, loading bays, commercial displacement' },
    { role: 'TRANSPORT_ACCESSIBILITY', name: 'TRANSIT & PEDESTRIAN ACCESS', icon: '🚆', desc: 'Universal step-free routes, transit headways, micromobility' },
    { role: 'ENVIRONMENT_CLIMATE', name: 'ENVIRONMENTAL & CLIMATE RESILIENCE', icon: '🌿', desc: 'Urban heat island mitigation, stormwater permeability, canopy' },
    { role: 'INFRASTRUCTURE_UTILITIES', name: 'MUNICIPAL INFRASTRUCTURE & UTILITIES', icon: '⚡', desc: 'Grid capacity, stormwater drainage, structural load strain' },
    { role: 'INDEPENDENT_REVIEW', name: 'INDEPENDENT OVERSIGHT & ADVERSARIAL AUDIT', icon: '🔍', desc: 'Stress-testing unverified assumptions & trade-off exposure' },
  ];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !activeScenario || isAsking) return;

    const userQ = question.trim();
    setQuestion('');
    setIsAsking(true);

    const userMsg: ConsultationMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      question: userQ,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setHistory(prev => [...prev, userMsg]);

    try {
      const res = await consultAgents(userQ, selectedAgentRole);
      if (res) {
        const agentMsg: ConsultationMessage = {
          id: `agent-${Date.now()}`,
          sender: 'agent',
          agentRole: res.agentRole,
          agentName: res.agentName,
          answer: res.answer,
          recommendedAdjustment: res.recommendedAdjustment,
          confidence: res.confidence,
          keyConcerns: res.keyConcerns || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setHistory(prev => [...prev, agentMsg]);
      }
    } catch (err: any) {
      const errorMsg: ConsultationMessage = {
        id: `err-${Date.now()}`,
        sender: 'agent',
        agentRole: 'SYSTEM',
        agentName: 'AI ENGINE ADVISORY',
        answer: `Could not reach the specialist agents: ${err.message || 'Please check API connection.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsAsking(false);
    }
  };

  const samplePrompts = [
    'How do we prevent displacing small shopkeepers during the pedestrianisation?',
    'Will emergency ambulances face delays if Market Street is closed to motor traffic?',
    'What if we introduce a dedicated electric delivery shuttle window from 5am to 9am?',
    'How will elderly residents with mobility aids access the nearby health clinic?',
  ];

  if (!activeScenario) {
    return (
      <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-12 text-center text-xs text-slate-400 backdrop-blur-xl shadow-2xl">
        Please select a redevelopment scenario on the Metro Digital Twin to consult with the AI Specialist Agents.
      </div>
    );
  }

  return (
    <div className="space-y-5 select-none font-sans">
      {/* Cinematic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
            <Bot className="w-3.5 h-3.5 text-amber-400" />
            <span>AI AGENT ADVISORY</span>
            <span className="text-slate-500">·</span>
            <span className="text-cyan-400 font-mono">10-SPECIALIST MUNICIPAL SWARM</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-white mt-1">
            Specialist Urban AI Agent Consultation
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-white/10 text-slate-300 shadow-md">
          <span className="text-slate-500">Active Scenario:</span>
          <span className="font-semibold text-white truncate max-w-[200px]">{activeScenario.title}</span>
        </div>
      </div>

      {/* Main Split: Specialist Agent Selector on Left, Chat Transcript on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Specialist Agents List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-display font-bold text-cyan-400 uppercase tracking-wider px-1">
            TARGET SPECIALIST DOMAIN
          </div>

          <div className="space-y-2">
            {specialistAgents.map(ag => {
              const isSelected = selectedAgentRole === ag.role;
              return (
                <button
                  key={ag.role}
                  onClick={() => setSelectedAgentRole(ag.role)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 backdrop-blur-md ${
                    isSelected
                      ? 'bg-gradient-to-r from-slate-900/95 to-cyan-950/40 border-cyan-500/60 shadow-[0_8px_25px_-5px_rgba(6,182,212,0.35)] -translate-y-0.5'
                      : 'bg-slate-900/60 border-white/10 hover:border-white/20 hover:bg-slate-900/80'
                  }`}
                >
                  <span className="text-base shrink-0 mt-0.5">{ag.icon}</span>
                  <div className="min-w-0">
                    <div className="font-display font-bold text-xs text-white leading-tight">
                      {ag.name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 font-normal">
                      {ag.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Scenario Context Box */}
          <div className="rounded-2xl bg-slate-900/70 border border-white/10 p-4 space-y-2 text-xs backdrop-blur-xl shadow-lg">
            <span className="font-display font-bold text-xs text-amber-300 block">
              ACTIVE PROPOSAL BLUEPRINT:
            </span>
            <p className="text-slate-300 text-xs leading-relaxed line-clamp-3 font-normal">
              {activeScenario.description}
            </p>
            <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-white/10">
              TARGET ZONE: {targetZone?.name || activeScenario.zoneId}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Consultation Dialogue (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          {/* Chat Transcript Screen: 3D Frosted Glass Container */}
          <div className="rounded-2xl bg-slate-950/80 border border-white/10 p-5 flex-1 min-h-[460px] max-h-[580px] overflow-y-auto space-y-4 shadow-2xl backdrop-blur-xl">
            {history.map(msg => {
              if (msg.sender === 'user') {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="bg-gradient-to-r from-cyan-600/90 to-blue-600/90 border border-cyan-400/40 text-white p-4 max-w-lg rounded-2xl rounded-tr-sm shadow-[0_8px_25px_-4px_rgba(6,182,212,0.4)] space-y-1">
                      <div className="text-[11px] font-medium text-cyan-200 flex items-center justify-between gap-4">
                        <span className="font-semibold">Planner Inquiry</span>
                        <span className="text-cyan-300/80 font-mono text-[10px]">{msg.timestamp}</span>
                      </div>
                      <p className="text-xs text-white leading-relaxed">{msg.question}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className="flex justify-start">
                  <div className="bg-slate-900/90 border border-white/10 p-4 max-w-2xl rounded-2xl rounded-tl-sm shadow-[0_12px_30px_-5px_rgba(0,0,0,0.8)] space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="font-display font-bold text-xs text-white flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{msg.agentName || 'SPECIALIST AGENT'}</span>
                      </span>
                      {msg.confidence && (
                        <span className="text-[10px] font-mono font-semibold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          {msg.confidence} CONFIDENCE
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-white/5 font-normal">
                      {msg.answer}
                    </p>

                    {msg.recommendedAdjustment && (
                      <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-1">
                        <span className="font-display font-bold text-xs text-emerald-300 flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
                          <span>RECOMMENDED PROPOSAL ADJUSTMENT:</span>
                        </span>
                        <p className="text-xs text-emerald-200 font-normal leading-relaxed">
                          {msg.recommendedAdjustment}
                        </p>
                      </div>
                    )}

                    {msg.keyConcerns && msg.keyConcerns.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="font-display font-bold text-[11px] text-rose-400 uppercase tracking-wide">
                          CRITICAL RISK FACTORS TO MONITOR:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.keyConcerns.map((c, i) => (
                            <span
                              key={i}
                              className="text-xs bg-rose-500/10 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 rounded-lg"
                            >
                              ⚠ {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isAsking && (
              <div className="p-3.5 bg-slate-900/90 border border-cyan-500/40 rounded-xl inline-flex items-center gap-2 text-xs font-semibold text-cyan-300 shadow-lg animate-pulse">
                <Activity className="w-4 h-4 animate-spin text-cyan-400" />
                <span>CONSULTING GEMINI MULTI-AGENT SWARM...</span>
              </div>
            )}
          </div>

          {/* Preset Inquiries / Suggested Prompts */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium mr-1">SUGGESTED QUERIES:</span>
            {samplePrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => setQuestion(p)}
                className="text-xs text-cyan-300 hover:text-white bg-slate-900/70 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
              >
                "{p.slice(0, 42)}..."
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="flex gap-2.5">
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Ask the specialist AI agents any proposal question or mitigation inquiry..."
              disabled={isAsking}
              className="flex-1 bg-slate-900/80 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 shadow-inner placeholder:text-slate-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!question.trim() || isAsking}
              className="btn-3d-primary px-5 py-2.5 text-xs flex items-center gap-2 disabled:opacity-50 shrink-0"
            >
              <Send className="w-3.5 h-3.5 text-slate-950" />
              <span>{isAsking ? 'CONSULTING...' : 'TRANSMIT QUERY'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
