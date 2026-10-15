import React, { useState, useMemo } from 'react';
import { Search, Building2, ChevronRight, Truck, Car, ShoppingBag } from 'lucide-react';
import { useCity } from '../context/CityContext.tsx';
import { OrganizationEntity } from '../types/city.ts';

export const OrganizationsView: React.FC = () => {
  const { entities, setSelectedEntityId } = useCity();

  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [loadingBayFilter, setLoadingBayFilter] = useState('ALL');
  const [zoneFilter, setZoneFilter] = useState('ALL');

  const orgs = useMemo(() => entities.filter(e => e.type === 'ORGANIZATION') as OrganizationEntity[], [entities]);
  const zones = useMemo(() => entities.filter(e => e.type === 'ZONE'), [entities]);

  const filteredOrgs = useMemo(() => {
    return orgs.filter(o => {
      if (zoneFilter !== 'ALL' && o.zoneId !== zoneFilter) return false;
      if (sectorFilter !== 'ALL' && o.sector !== sectorFilter) return false;
      if (loadingBayFilter === 'YES' && !o.loadingBayNeeded) return false;
      if (loadingBayFilter === 'NO' && o.loadingBayNeeded) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return o.name.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || o.sector.toLowerCase().includes(q);
      }
      return true;
    });
  }, [orgs, zoneFilter, sectorFilter, loadingBayFilter, searchQuery]);

  return (
    <div className="space-y-5 select-none font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>COMMERCIAL & ECONOMIC GRAPH</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400 font-mono">ENTERPRISES & LOCAL BUSINESSES</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-white mt-1">
            Commercial & Enterprise Registry ({orgs.length})
          </h1>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-4 space-y-3 shadow-xl backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search enterprise name, sector, ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-950/80 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-500 w-72 shadow-inner"
            />
          </div>

          <select
            value={sectorFilter}
            onChange={e => setSectorFilter(e.target.value)}
            className="bg-slate-950/80 border border-white/15 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">ALL SECTORS</option>
            <option value="retail">Retail & High Street</option>
            <option value="food_beverage">Food & Beverage</option>
            <option value="logistics">Logistics & Freight</option>
            <option value="property_development">Property Developers</option>
            <option value="technology">Technology & Labs</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="healthcare">Healthcare Services</option>
            <option value="financial">Banking & Finance</option>
            <option value="hospitality">Hospitality & Tourism</option>
          </select>

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

          <select
            value={loadingBayFilter}
            onChange={e => setLoadingBayFilter(e.target.value)}
            className="bg-slate-950/80 border border-white/15 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">FREIGHT BAY (ALL)</option>
            <option value="YES">Requires Dedicated Loading Bay</option>
            <option value="NO">Standard Curb Ingress</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 pt-2 border-t border-white/10 font-medium">
          Showing <strong className="text-white">{filteredOrgs.length}</strong> of {orgs.length} registered commercial enterprises
        </div>
      </div>

      {/* Main Table: 3D Cinematic Glass */}
      <div className="rounded-2xl bg-slate-900/80 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/90 border-b border-white/10 font-display font-semibold text-slate-300">
              <tr>
                <th className="py-3 px-4">ENTERPRISE ID</th>
                <th className="py-3 px-4">ORGANIZATION NAME</th>
                <th className="py-3 px-4">SECTOR</th>
                <th className="py-3 px-4">STAFF & FOOTFALL</th>
                <th className="py-3 px-4">COMMERCIAL AREA</th>
                <th className="py-3 px-4">FREIGHT & ACCESS</th>
                <th className="py-3 px-4">DISTRICT</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrgs.map(org => (
                <tr
                  key={org.id}
                  onClick={() => setSelectedEntityId(org.id)}
                  className="hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-mono font-bold text-amber-300 text-xs">
                    {org.id}
                  </td>
                  <td className="py-3 px-4 font-display font-bold text-white text-xs">
                    {org.name}
                  </td>
                  <td className="py-3 px-4 uppercase text-slate-300">
                    {org.sector.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-4 text-cyan-300 font-mono text-xs">
                    {org.employeeCount} staff · {org.dailyFootfall}/day
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-mono text-xs">
                    {org.commercialFloorAreaSqM} m²
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {org.loadingBayNeeded && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-300 font-semibold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                          <Truck className="w-3 h-3" /> Dedicated Bay
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 capitalize">
                        {org.parkingDependency}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-xs">
                    {org.zoneId}
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
      </div>
    </div>
  );
};
