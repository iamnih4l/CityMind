import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Users,
  Home,
  Briefcase,
  ChevronRight,
  Plus,
  UserCheck,
  MapPin,
  Accessibility,
} from 'lucide-react';
import { useCity } from '../context/CityContext.tsx';
import { CitizenEntity, HouseholdEntity } from '../types/city.ts';

export const CitizensView: React.FC = () => {
  const { entities, setSelectedEntityId } = useCity();

  const [activeTab, setActiveTab] = useState<'citizens' | 'households'>('citizens');
  const [searchQuery, setSearchQuery] = useState('');
  const [lifeStageFilter, setLifeStageFilter] = useState<string>('ALL');
  const [incomeFilter, setIncomeFilter] = useState<string>('ALL');
  const [accessFilter, setAccessFilter] = useState<string>('ALL');
  const [tenureFilter, setTenureFilter] = useState<string>('ALL');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');

  const [page, setPage] = useState(1);
  const pageSize = 20;

  const zones = useMemo(() => entities.filter(e => e.type === 'ZONE'), [entities]);
  const citizens = useMemo(() => entities.filter(e => e.type === 'CITIZEN') as CitizenEntity[], [entities]);
  const households = useMemo(() => entities.filter(e => e.type === 'HOUSEHOLD') as HouseholdEntity[], [entities]);

  // Filter citizens
  const filteredCitizens = useMemo(() => {
    return citizens.filter(c => {
      if (zoneFilter !== 'ALL' && c.zoneId !== zoneFilter) return false;
      if (lifeStageFilter !== 'ALL' && c.lifeStage !== lifeStageFilter) return false;
      if (incomeFilter !== 'ALL' && c.economicStatus !== incomeFilter) return false;
      if (accessFilter !== 'ALL' && c.accessibilityRequirement !== accessFilter) return false;
      if (tenureFilter !== 'ALL' && c.housingTenure !== tenureFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.occupation.toLowerCase().includes(q) ||
          c.dailyRoutine.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [citizens, zoneFilter, lifeStageFilter, incomeFilter, accessFilter, tenureFilter, searchQuery]);

  // Filter households
  const filteredHouseholds = useMemo(() => {
    return households.filter(h => {
      if (zoneFilter !== 'ALL' && h.zoneId !== zoneFilter) return false;
      if (incomeFilter !== 'ALL' && h.incomeBand !== incomeFilter) return false;
      if (tenureFilter !== 'ALL' && h.housingTenure !== tenureFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return h.name.toLowerCase().includes(q) || h.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [households, zoneFilter, incomeFilter, tenureFilter, searchQuery]);

  // Pagination slice
  const currentCitizensPage = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCitizens.slice(start, start + pageSize);
  }, [filteredCitizens, page]);

  const totalPages = Math.ceil(
    (activeTab === 'citizens' ? filteredCitizens.length : filteredHouseholds.length) / pageSize
  );

  return (
    <div className="space-y-5 select-none font-sans">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>METROPOLITAN DEMOGRAPHICS</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400 font-mono">POPULATION & HOUSEHOLD GRAPH</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-white mt-1">
            Metropolitan Citizen Registry
          </h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-white/10 shadow-lg">
          <button
            onClick={() => { setActiveTab('citizens'); setPage(1); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'citizens'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>CITIZENS ({citizens.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('households'); setPage(1); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'households'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>HOUSEHOLDS ({households.length})</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar: 3D Frosted Deck */}
      <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-4 space-y-3 shadow-xl backdrop-blur-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search box */}
          <div className="relative sm:col-span-2">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, occupation..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full bg-slate-950/80 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-500 shadow-inner"
            />
          </div>

          {/* Zone filter */}
          <select
            value={zoneFilter}
            onChange={e => { setZoneFilter(e.target.value); setPage(1); }}
            className="bg-slate-950/80 border border-white/15 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">ALL DISTRICTS</option>
            {zones.map(z => (
              <option key={z.id} value={z.id}>{z.code} - {z.name.slice(0, 18)}</option>
            ))}
          </select>

          {activeTab === 'citizens' && (
            <>
              <select
                value={lifeStageFilter}
                onChange={e => { setLifeStageFilter(e.target.value); setPage(1); }}
                className="bg-slate-950/80 border border-white/15 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="ALL">ALL AGE COHORTS</option>
                <option value="child">Child</option>
                <option value="teenager">Teenager</option>
                <option value="student">Student</option>
                <option value="young_adult">Young Adult</option>
                <option value="working_adult">Working Adult</option>
                <option value="parent">Parent</option>
                <option value="middle_aged">Middle-Aged</option>
                <option value="senior">Senior</option>
              </select>

              <select
                value={accessFilter}
                onChange={e => { setAccessFilter(e.target.value); setPage(1); }}
                className="bg-slate-950/80 border border-white/15 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="ALL">ACCESSIBILITY</option>
                <option value="wheelchair">Wheelchair User</option>
                <option value="limited_mobility">Limited Mobility</option>
                <option value="visual_impairment">Visual Impairment</option>
                <option value="healthcare_dependent">Healthcare Dependent</option>
                <option value="none">Standard Step Mobility</option>
              </select>
            </>
          )}

          <select
            value={incomeFilter}
            onChange={e => { setIncomeFilter(e.target.value); setPage(1); }}
            className="bg-slate-950/80 border border-white/15 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">ALL INCOME BANDS</option>
            <option value="low_income">Low Income</option>
            <option value="lower_middle">Lower-Middle</option>
            <option value="middle_income">Middle Income</option>
            <option value="higher_income">Higher Income</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/10 font-medium">
          <span>
            Matching: <strong className="text-white">{activeTab === 'citizens' ? filteredCitizens.length : filteredHouseholds.length}</strong> records
          </span>
          <span className="font-mono">Page {page} of {Math.max(totalPages, 1)}</span>
        </div>
      </div>

      {/* Main Table View: 3D Cinematic Glass Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden">
        {activeTab === 'citizens' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 border-b border-white/10 font-display font-semibold text-slate-300">
                <tr>
                  <th className="py-3 px-4">RECORD ID</th>
                  <th className="py-3 px-4">CITIZEN & AGE</th>
                  <th className="py-3 px-4">OCCUPATION</th>
                  <th className="py-3 px-4">STATUS & TENURE</th>
                  <th className="py-3 px-4">TRAVEL MODE</th>
                  <th className="py-3 px-4">MOBILITY PROFILE</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {currentCitizensPage.map(citizen => {
                  return (
                    <tr
                      key={citizen.id}
                      onClick={() => setSelectedEntityId(citizen.id)}
                      className="hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-amber-300 text-xs">
                        {citizen.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-display font-bold text-white text-xs">{citizen.name}</div>
                        <div className="text-[11px] text-slate-400 capitalize">
                          {citizen.lifeStage.replace('_', ' ')} · <span className="text-cyan-300 font-mono">{citizen.age} yrs</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-200">
                        {citizen.occupation}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-200 capitalize font-medium">{citizen.economicStatus.replace('_', ' ')}</div>
                        <div className="text-[11px] text-slate-400 capitalize">{citizen.housingTenure}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-300 capitalize text-[11px]">
                        {citizen.primaryTransportMode.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4">
                        {citizen.accessibilityRequirement !== 'none' ? (
                          <span className="text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase">
                            {citizen.accessibilityRequirement.replace('_', ' ')}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">Standard</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-xs text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1">
                          <span>Inspect</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 border-b border-white/10 font-display font-semibold text-slate-300">
                <tr>
                  <th className="py-3 px-4">HOUSEHOLD ID</th>
                  <th className="py-3 px-4">FAMILY NAME</th>
                  <th className="py-3 px-4">FAMILY SIZE</th>
                  <th className="py-3 px-4">INCOME BAND</th>
                  <th className="py-3 px-4">HOUSING TENURE</th>
                  <th className="py-3 px-4">DISTRICT</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredHouseholds.slice((page - 1) * pageSize, page * pageSize).map(hhd => (
                  <tr
                    key={hhd.id}
                    onClick={() => setSelectedEntityId(hhd.id)}
                    className="hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-amber-300 text-xs">
                      {hhd.id}
                    </td>
                    <td className="py-3 px-4 font-display font-bold text-white text-xs">
                      {hhd.name}
                    </td>
                    <td className="py-3 px-4 text-cyan-300 font-mono text-xs">
                      {hhd.size} members ({hhd.dependentsCount} deps)
                    </td>
                    <td className="py-3 px-4 text-slate-200 capitalize">
                      {hhd.incomeBand.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-slate-300 capitalize">
                      {hhd.housingTenure}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-xs">
                      {hhd.zoneId}
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 font-medium">
          <button
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="btn-3d-secondary px-4 py-2 text-xs disabled:opacity-40"
          >
            ← Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="btn-3d-secondary px-4 py-2 text-xs disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};
