import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  MapPin,
  ExternalLink,
  Share2,
  Network,
} from 'lucide-react';
import { useCity } from '../context/CityContext.tsx';
import { CityEntity, EntityType } from '../types/city.ts';

interface GraphNode {
  id: string;
  name: string;
  type: EntityType;
  zoneId: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  isScenarioAffected: boolean;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  sourceNode?: GraphNode;
  targetNode?: GraphNode;
  relationType: 'DEPENDS_ON' | 'LOCATED_IN' | 'CONNECTED_TO';
}

export const NetworkGraphView: React.FC = () => {
  const { entities, activeScenario, setSelectedEntityId } = useCity();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [highlightScenarioOnly, setHighlightScenarioOnly] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Pan and Zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const activeZoneId = activeScenario?.zoneId;

  // Build nodes and edges from genuine stored relationships
  const { nodes, edges, nodeMap } = useMemo(() => {
    const selectedEntities: CityEntity[] = [];

    // All zones
    const zones = entities.filter(e => e.type === 'ZONE');
    selectedEntities.push(...zones);

    // Facilities & Emergency in active zone and adjacent
    const facilities = entities.filter(e => e.type === 'FACILITY' || e.type === 'EMERGENCY_SERVICE');
    selectedEntities.push(...facilities.slice(0, 30));

    // Organizations
    const orgs = entities.filter(e => e.type === 'ORGANIZATION');
    selectedEntities.push(...orgs.slice(0, 25));

    // Infrastructure
    const infra = entities.filter(e => e.type === 'INFRASTRUCTURE');
    selectedEntities.push(...infra.slice(0, 25));

    // Citizens (sample around active zone)
    const citizens = entities.filter(
      e => e.type === 'CITIZEN' && (activeZoneId ? e.zoneId === activeZoneId : true)
    );
    selectedEntities.push(...citizens.slice(0, 45));

    const nMap = new Map<string, GraphNode>();

    const graphNodes: GraphNode[] = selectedEntities.map((ent, idx) => {
      let color = '#38bdf8';
      let radius = 7;

      if (ent.type === 'ZONE') {
        color = '#3b82f6';
        radius = 18;
      } else if (ent.type === 'FACILITY') {
        color = '#f43f5e';
        radius = 11;
      } else if (ent.type === 'EMERGENCY_SERVICE') {
        color = '#f59e0b';
        radius = 11;
      } else if (ent.type === 'ORGANIZATION') {
        color = '#a855f7';
        radius = 9;
      } else if (ent.type === 'INFRASTRUCTURE') {
        color = '#eab308';
        radius = 9;
      } else if (ent.type === 'ENVIRONMENT') {
        color = '#10b981';
        radius = 8;
      } else if (ent.type === 'CITIZEN') {
        color = '#38bdf8';
        radius = 5.5;
      }

      // Lay nodes out in orbital clusters around their zone
      const zoneIdx = zones.findIndex(z => z.id === ent.zoneId);
      const centerAngle = ((zoneIdx >= 0 ? zoneIdx : idx) / zones.length) * 2 * Math.PI;
      const clusterRadius = 260;
      const zoneCenterX = 500 + Math.cos(centerAngle) * clusterRadius;
      const zoneCenterY = 400 + Math.sin(centerAngle) * clusterRadius;

      let x = zoneCenterX;
      let y = zoneCenterY;

      if (ent.type !== 'ZONE') {
        const offsetAngle = (idx % 12) * ((2 * Math.PI) / 12) + (idx % 3);
        const subRadius = 40 + ((idx * 17) % 80);
        x = zoneCenterX + Math.cos(offsetAngle) * subRadius;
        y = zoneCenterY + Math.sin(offsetAngle) * subRadius;
      }

      const nodeObj: GraphNode = {
        id: ent.id,
        name: ent.name,
        type: ent.type,
        zoneId: ent.zoneId,
        x,
        y,
        radius,
        color,
        isScenarioAffected: activeZoneId ? ent.zoneId === activeZoneId : false,
      };

      nMap.set(ent.id, nodeObj);
      return nodeObj;
    });

    // Build edges from real relations
    const graphEdges: GraphEdge[] = [];
    selectedEntities.forEach(ent => {
      // Zone placement edge
      if (ent.type !== 'ZONE' && nMap.has(ent.zoneId) && nMap.has(ent.id)) {
        graphEdges.push({
          id: `${ent.id}-in-${ent.zoneId}`,
          source: ent.id,
          target: ent.zoneId,
          sourceNode: nMap.get(ent.id),
          targetNode: nMap.get(ent.zoneId),
          relationType: 'LOCATED_IN',
        });
      }

      // Dependencies
      ent.dependencies.forEach(depId => {
        if (nMap.has(depId) && nMap.has(ent.id)) {
          graphEdges.push({
            id: `${ent.id}-dep-${depId}`,
            source: ent.id,
            target: depId,
            sourceNode: nMap.get(ent.id),
            targetNode: nMap.get(depId),
            relationType: 'DEPENDS_ON',
          });
        }
      });

      // Connected entities
      ent.connectedEntityIds.forEach(connId => {
        if (nMap.has(connId) && nMap.has(ent.id)) {
          if (!graphEdges.some(e => e.source === connId && e.target === ent.id)) {
            graphEdges.push({
              id: `${ent.id}-conn-${connId}`,
              source: ent.id,
              target: connId,
              sourceNode: nMap.get(ent.id),
              targetNode: nMap.get(connId),
              relationType: 'CONNECTED_TO',
            });
          }
        }
      });
    });

    return { nodes: graphNodes, edges: graphEdges, nodeMap: nMap };
  }, [entities, activeZoneId]);

  const selectedNode = selectedNodeId ? nodeMap.get(selectedNodeId) : null;
  const selectedFullEntity = selectedNodeId ? entities.find(e => e.id === selectedNodeId) : null;

  // Direct connected node IDs for selected
  const connectedNodeIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const set = new Set<string>();
    edges.forEach(e => {
      if (e.source === selectedNodeId) set.add(e.target);
      if (e.target === selectedNodeId) set.add(e.source);
    });
    return set;
  }, [selectedNodeId, edges]);

  // Handle pan drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Filtered nodes
  const visibleNodes = nodes.filter(n => {
    if (selectedTypeFilter !== 'ALL' && n.type !== selectedTypeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return n.name.toLowerCase().includes(q) || n.id.toLowerCase().includes(q);
    }
    return true;
  });

  const visibleNodeIdSet = new Set(visibleNodes.map(n => n.id));

  return (
    <div className="space-y-5 select-none font-sans">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
            <Network className="w-3.5 h-3.5 text-cyan-400" />
            <span>METROPOLITAN RELATIONAL GRAPH</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400 font-mono">TOPOLOGY & CORRIDORS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-white mt-1">
            Interconnected Entity Network Graph
          </h1>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setHighlightScenarioOnly(!highlightScenarioOnly)}
            className={`btn-3d-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 ${
              highlightScenarioOnly ? 'text-amber-300 border-amber-500/40 shadow-sm' : 'text-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>HIGHLIGHT CORRIDOR</span>
          </button>

          <button
            onClick={() => setZoom(z => Math.min(z + 0.2, 2.5))}
            className="btn-3d-secondary p-2 text-xs text-slate-300 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}
            className="btn-3d-secondary p-2 text-xs text-slate-300 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="btn-3d-secondary p-2 text-xs text-slate-300 hover:text-white"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
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
              placeholder="Search entity by ID or name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-950/80 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-500 w-64 shadow-inner"
            />
          </div>

          <select
            value={selectedTypeFilter}
            onChange={e => setSelectedTypeFilter(e.target.value)}
            className="bg-slate-950/80 border border-white/15 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">ALL ENTITY TYPES</option>
            <option value="CITIZEN">Citizens & Demographics</option>
            <option value="FACILITY">Civic & Health Facilities</option>
            <option value="ORGANIZATION">Commercial Enterprises</option>
            <option value="INFRASTRUCTURE">Power & Networks</option>
            <option value="ZONE">District Zones</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 pt-2 border-t border-white/10 flex items-center justify-between font-medium">
          <span><strong className="text-white">{visibleNodes.length}</strong> nodes rendered</span>
          <span className="font-mono text-cyan-300">{edges.length} relational edges</span>
        </div>
      </div>

      {/* Main Graph Canvas & Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Graph Canvas (3 cols) */}
        <div
          className="lg:col-span-3 rounded-2xl bg-[#070d18] border border-white/10 h-[580px] overflow-hidden relative cursor-grab active:cursor-grabbing select-none shadow-2xl backdrop-blur-xl"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <svg
            viewBox="0 0 1000 800"
            className="w-full h-full"
            style={{
              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            <defs>
              <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Grid Backdrop */}
            <pattern id="graphGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            </pattern>
            <rect width="1000" height="800" fill="url(#graphGrid)" />

            {/* Edges */}
            <g opacity="0.6">
              {edges.map(e => {
                if (!e.sourceNode || !e.targetNode) return null;
                if (!visibleNodeIdSet.has(e.source) || !visibleNodeIdSet.has(e.target)) return null;

                const isConnectedToSelected =
                  selectedNodeId && (e.source === selectedNodeId || e.target === selectedNodeId);
                const isHighlight =
                  highlightScenarioOnly &&
                  e.sourceNode.isScenarioAffected &&
                  e.targetNode.isScenarioAffected;

                let stroke = '#1e293b';
                let strokeWidth = '1';
                let strokeOpacity = 0.4;

                if (isConnectedToSelected) {
                  stroke = '#38bdf8';
                  strokeWidth = '2.5';
                  strokeOpacity = 1;
                } else if (isHighlight) {
                  stroke = '#0ea5e9';
                  strokeWidth = '1.8';
                  strokeOpacity = 0.8;
                }

                return (
                  <line
                    key={e.id}
                    x1={e.sourceNode.x}
                    y1={e.sourceNode.y}
                    x2={e.targetNode.x}
                    y2={e.targetNode.y}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    strokeOpacity={strokeOpacity}
                    strokeDasharray={e.relationType === 'DEPENDS_ON' ? '4 2' : undefined}
                  />
                );
              })}
            </g>

            {/* Nodes */}
            <g>
              {visibleNodes.map(n => {
                const isSelected = selectedNodeId === n.id;
                const isConnected = connectedNodeIds.has(n.id);

                return (
                  <g
                    key={n.id}
                    className="cursor-pointer transition-transform duration-200"
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedNodeId(n.id);
                    }}
                    transform={`translate(${n.x}, ${n.y})`}
                  >
                    {/* Pulsing Aura if selected or connected */}
                    {(isSelected || isConnected) && (
                      <circle
                        r={n.radius + 6}
                        fill="none"
                        stroke={isSelected ? '#38bdf8' : '#818cf8'}
                        strokeWidth="2"
                        className="animate-pulse"
                      />
                    )}

                    <circle
                      r={n.radius}
                      fill={n.color}
                      stroke={isSelected ? '#ffffff' : 'rgba(0,0,0,0.4)'}
                      strokeWidth={isSelected ? '2.5' : '1.5'}
                      filter="url(#nodeGlow)"
                    />

                    {/* Node Label on zones or when selected */}
                    {(n.type === 'ZONE' || isSelected) && (
                      <text
                        y={n.radius + 12}
                        textAnchor="middle"
                        className="font-display text-[10px] font-bold fill-white pointer-events-none drop-shadow-md"
                      >
                        {n.name.length > 14 ? n.name.slice(0, 12) + '…' : n.name}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Floating Canvas Legend */}
          <div className="absolute bottom-3 left-3 rounded-xl bg-slate-950/80 border border-white/10 px-3.5 py-2 text-xs text-slate-300 backdrop-blur-md shadow-lg flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" /> District Zone
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" /> Facility
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" /> Enterprise
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" /> Network
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" /> Citizen
            </span>
          </div>
        </div>

        {/* Selected Entity Inspector (1 col) */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-3.5 shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="font-display font-bold text-xs text-amber-300">NODE INSPECTOR</span>
              {selectedNode && (
                <span className="text-[10px] font-mono font-semibold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                  {selectedNode.type}
                </span>
              )}
            </div>

            {selectedNode && selectedFullEntity ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-mono text-xs font-bold text-amber-300">{selectedNode.id}</span>
                  <h4 className="font-display font-bold text-sm text-white leading-tight mt-1">{selectedNode.name}</h4>
                  <span className="text-slate-400 text-xs uppercase font-medium">{selectedFullEntity.subType}</span>
                </div>

                <div className="space-y-1.5 border-t border-white/10 pt-2.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target District:</span>
                    <span className="text-white font-semibold">{selectedNode.zoneId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Proposal Scope:</span>
                    <span className={selectedNode.isScenarioAffected ? 'text-cyan-300 font-semibold' : 'text-slate-400'}>
                      {selectedNode.isScenarioAffected ? 'Directly Impacted' : 'Peripheral'}
                    </span>
                  </div>
                </div>

                {/* Direct Connections List */}
                <div className="border-t border-white/10 pt-2.5 space-y-1.5">
                  <span className="font-display font-bold text-xs text-cyan-300 block">
                    INTERCONNECTED NODES ({connectedNodeIds.size}):
                  </span>
                  <div className="max-h-40 overflow-y-auto space-y-1.5">
                    {Array.from(connectedNodeIds).map(cId => {
                      const cEntity = entities.find(e => e.id === cId);
                      return (
                        <div
                          key={cId}
                          onClick={() => setSelectedNodeId(cId)}
                          className="p-2 rounded-lg bg-slate-950/60 border border-white/10 hover:border-cyan-400/50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <span className="text-white truncate">{cEntity?.name || cId}</span>
                          <span className="font-mono text-[10px] text-slate-400">{cEntity?.type}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2.5 border-t border-white/10">
                  <button
                    onClick={() => setSelectedEntityId(selectedNode.id)}
                    className="btn-3d-primary py-2 text-xs w-full flex items-center justify-center gap-1.5"
                  >
                    <span>OPEN ENTITY DOSSIER</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-8 text-center leading-relaxed">
                Click any node on the graph canvas to inspect relational dependencies and attributes.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
