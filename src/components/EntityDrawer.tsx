import React, { useState, useEffect } from 'react';
import { X, Edit2, Save, Trash2, ExternalLink, AlertTriangle, Sparkles, Shield, User, Building2, MapPin, CheckCircle2 } from 'lucide-react';
import { useCity } from '../context/CityContext.tsx';
import { CityEntity, CitizenEntity, OrganizationEntity, FacilityEntity, InfrastructureEntity } from '../types/city.ts';

export const EntityDrawer: React.FC = () => {
  const { selectedEntity, setSelectedEntityId, updateEntity, deleteEntity, entities } = useCity();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPriorities, setEditPriorities] = useState('');
  const [editConstraints, setEditConstraints] = useState('');

  useEffect(() => {
    if (selectedEntity) {
      setEditName(selectedEntity.name);
      setEditPriorities(selectedEntity.priorities.join('\n'));
      setEditConstraints(selectedEntity.constraints.join('\n'));
      setIsEditing(false);
    }
  }, [selectedEntity]);

  if (!selectedEntity) return null;

  const handleSave = () => {
    updateEntity(selectedEntity.id, {
      name: editName.trim(),
      priorities: editPriorities.split('\n').map(p => p.trim()).filter(Boolean),
      constraints: editConstraints.split('\n').map(c => c.trim()).filter(Boolean),
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Delete entity record ${selectedEntity.id} (${selectedEntity.name}) from the municipal database?`)) {
      deleteEntity(selectedEntity.id);
    }
  };

  // Resolve connected entities
  const connectedEntities = entities.filter(e =>
    selectedEntity.connectedEntityIds.includes(e.id) || selectedEntity.dependencies.includes(e.id)
  );

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#080e1c]/95 border-l border-white/15 shadow-[0_0_100px_rgba(0,0,0,0.9)] flex flex-col no-print select-none backdrop-blur-3xl animate-in slide-in-from-right duration-300">
      {/* 3D Top Rim Light */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

      {/* Cinematic Header */}
      <div className="p-4 border-b border-white/10 bg-slate-900/80 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Building2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <span className="font-mono text-xs font-bold text-amber-300 block">
              {selectedEntity.id}
            </span>
            <span className="text-[11px] text-slate-400 uppercase font-semibold font-display">
              {selectedEntity.type} · {selectedEntity.subType}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-white/10 transition-colors"
            title={isEditing ? 'Cancel Editing' : 'Edit Record'}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="w-8 h-8 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 transition-colors"
            title="Delete Record"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setSelectedEntityId(null)}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center border border-white/10 transition-colors"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interior Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-300">
        {/* Name Box */}
        <div className="rounded-xl bg-slate-950/60 border border-white/10 p-4 space-y-1.5 shadow-inner">
          <label className="text-[10px] uppercase font-display font-bold text-slate-400 tracking-wider block">
            ENTITY DOSSIER NAME:
          </label>
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full bg-slate-900 border border-cyan-400/50 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          ) : (
            <h3 className="font-display text-base font-bold text-white leading-snug">
              {selectedEntity.name}
            </h3>
          )}
        </div>

        {/* Provenance Badge */}
        <div className="rounded-xl bg-slate-900/60 border border-white/10 p-3 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Data Provenance:</span>
          <span className="text-amber-300 font-mono text-[11px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 font-semibold">
            {selectedEntity.provenance}
          </span>
        </div>

        {/* Type-Specific Details */}
        {selectedEntity.type === 'CITIZEN' && (
          <div className="space-y-3 rounded-xl bg-slate-950/60 border border-white/10 p-4 shadow-inner">
            <span className="font-display font-bold text-xs text-cyan-300 block">
              CITIZEN PROFILE & DEMOGRAPHICS:
            </span>
            {(() => {
              const cit = selectedEntity as CitizenEntity;
              return (
                <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-300">
                  <div>Age: <span className="text-white font-mono font-bold">{cit.age}</span> ({cit.lifeStage})</div>
                  <div>Income: <span className="text-white capitalize">{cit.economicStatus.replace('_', ' ')}</span></div>
                  <div>Housing: <span className="text-white capitalize">{cit.housingTenure}</span></div>
                  <div>Occupation: <span className="text-white">{cit.occupation}</span></div>
                  <div>Transport: <span className="text-white capitalize">{cit.primaryTransportMode}</span></div>
                  <div>Mobility: <span className={cit.accessibilityRequirement !== 'none' ? 'text-amber-300 font-semibold' : 'text-slate-400'}>{cit.accessibilityRequirement}</span></div>
                </div>
              );
            })()}

            <div className="pt-2.5 border-t border-white/10">
              <span className="text-[10px] uppercase font-display font-bold text-slate-400 block mb-1">DAILY ROUTINE:</span>
              <p className="text-slate-200 text-xs italic bg-slate-900/80 p-2.5 rounded-lg border border-white/5">
                {(selectedEntity as CitizenEntity).dailyRoutine}
              </p>
            </div>

            <div className="pt-2.5 border-t border-white/10">
              <span className="text-[10px] uppercase font-display font-bold text-slate-400 block mb-1">VULNERABILITY & SENSITIVITY FACTORS:</span>
              <div className="flex flex-wrap gap-1.5">
                {(selectedEntity as CitizenEntity).sensitivityFactors.map((s, i) => (
                  <span key={i} className="text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-md">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedEntity.type === 'ORGANIZATION' && (
          <div className="space-y-3 rounded-xl bg-slate-950/60 border border-white/10 p-4 shadow-inner">
            <span className="font-display font-bold text-xs text-amber-300 block">
              COMMERCIAL ENTERPRISE SPECIFICATIONS:
            </span>
            {(() => {
              const org = selectedEntity as OrganizationEntity;
              return (
                <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-300">
                  <div>Sector: <span className="text-white capitalize">{org.sector}</span></div>
                  <div>Employees: <span className="text-white font-mono font-bold">{org.employeeCount}</span></div>
                  <div>Daily Footfall: <span className="text-cyan-300 font-mono">{org.dailyFootfall}/day</span></div>
                  <div>Floor Area: <span className="text-white font-mono">{org.commercialFloorAreaSqM} m²</span></div>
                  <div>Freight Bay: <span className="text-amber-300 font-semibold">{org.loadingBayNeeded ? 'REQUIRED' : 'STANDARD'}</span></div>
                  <div>Parking: <span className="text-white capitalize">{org.parkingDependency}</span></div>
                </div>
              );
            })()}
          </div>
        )}

        {selectedEntity.type === 'FACILITY' && (
          <div className="space-y-3 rounded-xl bg-slate-950/60 border border-white/10 p-4 shadow-inner">
            <span className="font-display font-bold text-xs text-rose-300 block">
              FACILITY OPERATIONAL METRICS:
            </span>
            {(() => {
              const fac = selectedEntity as FacilityEntity;
              return (
                <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-300">
                  <div>Category: <span className="text-white capitalize">{fac.category}</span></div>
                  <div>Type: <span className="text-white capitalize">{fac.facilityType}</span></div>
                  <div>Capacity: <span className="text-white font-mono font-bold">{fac.capacity}</span></div>
                  <div>Utilization: <span className="text-cyan-300 font-mono">{fac.currentUtilizationPct}%</span></div>
                  <div>Hours: <span className="text-white">{fac.operatingHours}</span></div>
                  <div>Emergency Priority: <span className="text-rose-400 font-bold">{fac.emergencyAccessPriority}</span></div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Priorities & Objectives */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-display font-bold text-slate-400 tracking-wider block">
            STATED PRIORITIES & REQUIREMENTS:
          </label>
          {isEditing ? (
            <textarea
              rows={3}
              value={editPriorities}
              onChange={e => setEditPriorities(e.target.value)}
              className="w-full bg-slate-900 border border-white/15 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          ) : (
            <ul className="space-y-1.5 text-xs text-slate-200">
              {selectedEntity.priorities.map((p, i) => (
                <li key={i} className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">›</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Constraints */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-display font-bold text-amber-400 tracking-wider block">
            KNOWN CONSTRAINTS & LIMITATIONS:
          </label>
          {isEditing ? (
            <textarea
              rows={3}
              value={editConstraints}
              onChange={e => setEditConstraints(e.target.value)}
              className="w-full bg-slate-900 border border-white/15 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          ) : (
            <ul className="space-y-1.5 text-xs text-slate-300">
              {selectedEntity.constraints.map((c, i) => (
                <li key={i} className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 flex items-start gap-2">
                  <span className="text-amber-400 font-bold">⚠</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Connected Entities List */}
        <div className="space-y-2 border-t border-white/10 pt-3">
          <span className="font-display font-bold text-xs text-cyan-300 block">
            INTERCONNECTED ENTITY NETWORK ({connectedEntities.length}):
          </span>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {connectedEntities.map(conn => (
              <div
                key={conn.id}
                onClick={() => setSelectedEntityId(conn.id)}
                className="p-2.5 bg-slate-950/60 rounded-xl border border-white/10 hover:border-cyan-400/50 cursor-pointer flex items-center justify-between transition-colors"
              >
                <div>
                  <span className="font-semibold text-white text-xs">{conn.name}</span>
                  <div className="font-mono text-[10px] text-slate-400">{conn.id} · {conn.type}</div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drawer Footer if editing */}
      {isEditing && (
        <div className="p-4 border-t border-white/10 bg-slate-900/90 flex items-center justify-end gap-2.5">
          <button
            onClick={() => setIsEditing(false)}
            className="btn-3d-secondary px-4 py-2 text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-3d-primary px-4 py-2 text-xs flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5 text-slate-950" />
            <span>Save Changes</span>
          </button>
        </div>
      )}
    </div>
  );
};
