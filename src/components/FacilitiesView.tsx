import React, { useState, useMemo } from 'react';
import { Search, Building, Zap, Trees, ChevronRight, Activity, ShieldAlert, Sparkles } from 'lucide-react';
import { useCity } from '../context/CityContext.tsx';
import { FacilityEntity, InfrastructureEntity, EnvironmentEntity } from '../types/city.ts';

export const FacilitiesView: React.FC = () => {
  const { entities, setSelectedEntityId } = useCity();

  const [activeCategory, setActiveCategory] = useState<'facilities' | 'infrastructure' | 'environment'>('facilities');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoneFilter, setZoneFilter] = useState('ALL');

  const facilities = useMemo(() => entities.filter(e => e.type === 'FACILITY') as FacilityEntity[], [entities]);
  const infrastructure = useMemo(() => entities.filter(e => e.type === 'INFRASTRUCTURE') as InfrastructureEntity[], [entities]);
  const environment = useMemo(() => entities.filter(e => e.type === 'ENVIRONMENT') as EnvironmentEntity[], [entities]);
  const zones = useMemo(() => entities.filter(e => e.type === 'ZONE'), [entities]);

  const filteredFacilities = useMemo(() => {
    return facilities.filter(f => {
      if (zoneFilter !== 'ALL' && f.zoneId !== zoneFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return f.name.toLowerCase().includes(q) || f.id.toLowerCase().includes(q) || f.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [facilities, zoneFilter, searchQuery]);

  const filteredInfrastructure = useMemo(() => {
    return infrastructure.filter(i => {
      if (zoneFilter !== 'ALL' && i.zoneId !== zoneFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q) || i.assetClass.toLowerCase().includes(q);
      }
      return true;
    });
  }, [infrastructure, zoneFilter, searchQuery]);

  const filteredEnvironment = useMemo(() => {
    return environment.filter(e => {
      if (zoneFilter !== 'ALL' && e.zoneId !== zoneFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || e.environmentalType.toLowerCase().includes(q);
      }
      return true;
    });
  }, [environment, zoneFilter, searchQuery]);

  return (
    <div className="space-y-5 select-none font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
            <Building className="w-3.5 h-3.5 text-cyan-400" />
            <span>MUNICIPAL INFRASTRUCTURE ASSETS</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400 font-mono">FACILITIES, NETWORKS & ECOSYSTEMS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-white mt-1">
            Facilities, Power Grids & Ecological Assets
          </h1>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-white/10 shadow-lg">
          <button
            onClick={() => setActiveCategory('facilities')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeCategory === 'facilities'
                ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>FACILITIES ({facilities.length})</span>
          </button>
          <button
            onClick={() => setActiveCategory('infrastructure')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeCategory === 'infrastructure'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>POWER & UTILITIES ({infrastructure.length})</span>
          </button>
          <button
            onClick={() => setActiveCategory('environment')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeCategory === 'environment'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trees className="w-3.5 h-3.5" />
            <span>ECOLOGY & CANOPY ({environment.length})</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-4 space-y-3 shadow-xl backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search asset name, category, ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-950/80 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-500 w-72 shadow-inner"
            />
          </div>

          <select
            value={zoneFilter}
            onChange={e => setZoneFilter(e.target.value)}
            className="bg-slate-950/80 border border-white/15 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">ALL DISTRICTS</option>
            {zones.map(z => (
              <option key={z.id} value={z.id}>{z.code} - {z.name.slice(0, 18)}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400 pt-2 border-t border-white/10 font-medium">
          Showing{' '}
          <strong className="text-white">
            {activeCategory === 'facilities'
              ? filteredFacilities.length
              : activeCategory === 'infrastructure'
              ? filteredInfrastructure.length
              : filteredEnvironment.length}
          </strong>{' '}
          registered metropolitan assets
        </div>
      </div>

      {/* Main Assets Table: 3D Cinematic Glass */}
      <div className="rounded-2xl bg-slate-900/80 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden">
        {activeCategory === 'facilities' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 border-b border-white/10 font-display font-semibold text-slate-300">
                <tr>
                  <th className="py-3 px-4">FACILITY ID</th>
                  <th className="py-3 px-4">NAME</th>
                  <th className="py-3 px-4">CATEGORY</th>
                  <th className="py-3 px-4">CAPACITY & UTILIZATION</th>
                  <th className="py-3 px-4">HOURS</th>
                  <th className="py-3 px-4">PRIORITY</th>
                  <th className="py-3 px-4">DISTRICT</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredFacilities.map(fac => (
                  <tr
                    key={fac.id}
                    onClick={() => setSelectedEntityId(fac.id)}
                    className="hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-amber-300 text-xs">
                      {fac.id}
                    </td>
                    <td className="py-3 px-4 font-display font-bold text-white text-xs">
                      {fac.name}
                    </td>
                    <td className="py-3 px-4 uppercase text-slate-300">
                      {fac.category} ({fac.facilityType})
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-cyan-300 text-xs">
                        {fac.capacity} cap · {fac.currentUtilizationPct}% util
                      </div>
                      <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            fac.currentUtilizationPct > 90
                              ? 'bg-rose-500'
                              : fac.currentUtilizationPct > 75
                              ? 'bg-amber-400'
                              : 'bg-cyan-400'
                          }`}
                          style={{ width: `${Math.min(fac.currentUtilizationPct, 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {fac.operatingHours}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          fac.emergencyAccessPriority === 'CRITICAL'
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            : fac.emergencyAccessPriority === 'HIGH'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border-white/10'
                        }`}
                      >
                        {fac.emergencyAccessPriority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-xs">
                      {fac.zoneId}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-xs text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1">
                        <span>Inspect</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeCategory === 'infrastructure' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 border-b border-white/10 font-display font-semibold text-slate-300">
                <tr>
                  <th className="py-3 px-4">NETWORK ID</th>
                  <th className="py-3 px-4">ASSET NAME</th>
                  <th className="py-3 px-4">ASSET CLASS</th>
                  <th className="py-3 px-4">CONDITION RATING</th>
                  <th className="py-3 px-4">FAILURE SENSITIVITY</th>
                  <th className="py-3 px-4">DISTRICT</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredInfrastructure.map(infra => (
                  <tr
                    key={infra.id}
                    onClick={() => setSelectedEntityId(infra.id)}
                    className="hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-amber-300 text-xs">
                      {infra.id}
                    </td>
                    <td className="py-3 px-4 font-display font-bold text-white text-xs">
                      {infra.name}
                    </td>
                    <td className="py-3 px-4 uppercase text-slate-300">
                      {infra.assetClass.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 font-mono text-cyan-300">
                      {infra.conditionRating}/5
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          infra.failureSensitivity === 'CRITICAL'
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            : infra.failureSensitivity === 'HIGH'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {infra.failureSensitivity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-xs">
                      {infra.zoneId}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-xs text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1">
                        <span>Inspect</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeCategory === 'environment' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 border-b border-white/10 font-display font-semibold text-slate-300">
                <tr>
                  <th className="py-3 px-4">ASSET ID</th>
                  <th className="py-3 px-4">CANOPY / HABITAT NAME</th>
                  <th className="py-3 px-4">TYPE</th>
                  <th className="py-3 px-4">PERMEABILITY</th>
                  <th className="py-3 px-4">RUNOFF RISK</th>
                  <th className="py-3 px-4">ECOLOGICAL SENSITIVITY</th>
                  <th className="py-3 px-4">DISTRICT</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredEnvironment.map(env => (
                  <tr
                    key={env.id}
                    onClick={() => setSelectedEntityId(env.id)}
                    className="hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-amber-300 text-xs">
                      {env.id}
                    </td>
                    <td className="py-3 px-4 font-display font-bold text-white text-xs">
                      {env.name}
                    </td>
                    <td className="py-3 px-4 uppercase text-slate-300">
                      {env.environmentalType.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-300">
                      {env.permeabilityPct}%
                    </td>
                    <td className="py-3 px-4 font-mono text-cyan-300">
                      {env.runoffRiskLevel}
                    </td>
                    <td className="py-3 px-4 text-slate-200">
                      {env.ecologicalSensitivity}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-xs">
                      {env.zoneId}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-xs text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1">
                        <span>Inspect</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
