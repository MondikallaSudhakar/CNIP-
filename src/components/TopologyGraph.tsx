import React, { useState } from 'react';
import { DepartmentId, DepartmentNode, NetworkLink } from '../types/network';
import { computeDijkstra } from '../networking/dijkstra';
import { Network, Sliders, Power, ArrowRight, ShieldAlert, Cpu, Activity, Send } from 'lucide-react';

interface TopologyGraphProps {
  departments: DepartmentNode[];
  links: NetworkLink[];
  onToggleLink: (linkId: string, enabled: boolean) => void;
  onUpdateLinkCost: (linkId: string, cost: number) => void;
  onTransmitPath: (source: DepartmentId, dest: DepartmentId) => void;
}

export const TopologyGraph: React.FC<TopologyGraphProps> = ({
  departments,
  links,
  onToggleLink,
  onUpdateLinkCost,
  onTransmitPath,
}) => {
  const [selectedSource, setSelectedSource] = useState<DepartmentId>('ER');
  const [selectedDest, setSelectedDest] = useState<DepartmentId>('PHARM');
  const [activeLinkId, setActiveLinkId] = useState<string | null>(null);
  const [isPacketTransmitting, setIsPacketTransmitting] = useState(false);

  // Run Dijkstra
  const dijkstraResult = computeDijkstra(selectedSource, selectedDest, links);
  const activePathNodes = dijkstraResult.path;

  // Determine which links are in the active shortest path
  const isLinkInActivePath = (source: DepartmentId, target: DepartmentId): boolean => {
    for (let i = 0; i < activePathNodes.length - 1; i++) {
      const u = activePathNodes[i];
      const v = activePathNodes[i + 1];
      if ((u === source && v === target) || (u === target && v === source)) {
        return true;
      }
    }
    return false;
  };

  const handleSimulatePulse = () => {
    setIsPacketTransmitting(true);
    setTimeout(() => {
      setIsPacketTransmitting(false);
      onTransmitPath(selectedSource, selectedDest);
    }, 1800);
  };

  const selectedLinkObj = links.find((l) => l.id === activeLinkId);

  return (
    <div className="space-y-6">
      {/* Module Header & Path Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold tracking-wide uppercase">
            <Network className="w-3.5 h-3.5" />
            <span>Interactive Hospital Mesh Topology</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-1 tracking-tight">
            Interdepartmental Physical Links & Dynamic Routing
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Click any duplex link to inspect link parameters (bandwidth, propagation delay, queue capacity, cost) or simulate physical link failure.
          </p>
        </div>

        {/* Source & Destination Routing Selector */}
        <div className="flex flex-wrap items-center gap-2.5 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px]">Src:</span>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value as DepartmentId)}
              className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-medium focus:outline-none focus:border-cyan-500"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.id} - {d.name}</option>
              ))}
            </select>
          </div>

          <span className="text-slate-600">&rarr;</span>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px]">Dst:</span>
            <select
              value={selectedDest}
              onChange={(e) => setSelectedDest(e.target.value as DepartmentId)}
              className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-medium focus:outline-none focus:border-cyan-500"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.id} - {d.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSimulatePulse}
            disabled={isPacketTransmitting || activePathNodes.length === 0}
            className="px-3.5 py-1 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Send className="w-3 h-3" />
            <span>{isPacketTransmitting ? 'Transmitting...' : 'Send Pulse'}</span>
          </button>
        </div>
      </div>

      {/* Path Cost & Metrics Bar */}
      <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/40 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">OPTIMAL DIJKSTRA PATH:</span>
          {activePathNodes.length > 0 ? (
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
              {activePathNodes.map((n, idx) => (
                <React.Fragment key={n}>
                  <span className="px-1.5 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded">
                    {n}
                  </span>
                  {idx < activePathNodes.length - 1 && <span className="text-slate-600">&rarr;</span>}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <span className="text-rose-400 font-bold">NO VALID ROUTE (SEVERED LINKS)</span>
          )}
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <span>Total Weight: <strong className="text-slate-200">{dijkstraResult.totalCost >= 0 ? dijkstraResult.totalCost : 'Infinity'}</strong></span>
          <span>Latency: <strong className="text-slate-200">{dijkstraResult.totalLatencyMs.toFixed(1)} ms</strong></span>
          <span>Alternative Paths: <strong className="text-slate-200">{dijkstraResult.alternativeRoutes.length}</strong></span>
        </div>
      </div>

      {/* Interactive Network Graph Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SVG Canvas Area (8 cols) */}
        <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-slate-950 p-4 relative overflow-hidden min-h-[460px] flex flex-col justify-between shadow-inner">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Hospital Campus Backbone (Interactive SVG Topology)</span>
            <span>Click any node or link to configure</span>
          </div>

          <svg
            className="w-full h-[400px] select-none"
            viewBox="0 0 950 400"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Grid Pattern */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Links / Edges */}
            {links.map((link) => {
              const srcNode = departments.find((d) => d.id === link.source);
              const dstNode = departments.find((d) => d.id === link.target);
              if (!srcNode || !dstNode) return null;

              const isPath = isLinkInActivePath(link.source, link.target);
              const isSelected = activeLinkId === link.id;

              const midX = (srcNode.x + dstNode.x) / 2;
              const midY = (srcNode.y + dstNode.y) / 2;

              let strokeColor = '#334155'; // default slate-700
              if (!link.enabled) {
                strokeColor = '#b91c1c'; // disabled red
              } else if (isPath) {
                strokeColor = '#06b6d4'; // cyan path
              } else if (isSelected) {
                strokeColor = '#38bdf8'; // sky blue
              }

              return (
                <g key={link.id} className="cursor-pointer" onClick={() => setActiveLinkId(link.id)}>
                  {/* Outer clickable hit area */}
                  <line
                    x1={srcNode.x}
                    y1={srcNode.y}
                    x2={dstNode.x}
                    y2={dstNode.y}
                    stroke="transparent"
                    strokeWidth="20"
                  />
                  {/* Base Line */}
                  <line
                    x1={srcNode.x}
                    y1={srcNode.y}
                    x2={dstNode.x}
                    y2={dstNode.y}
                    stroke={strokeColor}
                    strokeWidth={isPath ? '3.5' : isSelected ? '3' : '2'}
                    strokeDasharray={!link.enabled ? '6 4' : undefined}
                    strokeOpacity={!link.enabled ? 0.6 : 0.9}
                  />

                  {/* Pulsing Packet Animation along the Active Shortest Path */}
                  {isPacketTransmitting && isPath && (
                    <circle r="5" fill="#22d3ee" className="animate-ping">
                      <animateMotion
                        path={`M ${srcNode.x} ${srcNode.y} L ${dstNode.x} ${dstNode.y}`}
                        dur="1.2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Link Cost Badge */}
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x="-22"
                      y="-11"
                      width="44"
                      height="22"
                      rx="4"
                      fill={isSelected ? '#0f172a' : '#030712'}
                      stroke={isSelected ? '#06b6d4' : link.enabled ? '#334155' : '#7f1d1d'}
                      strokeWidth="1.2"
                    />
                    <text
                      textAnchor="middle"
                      dy="4"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="600"
                      fill={!link.enabled ? '#f87171' : isPath ? '#22d3ee' : '#94a3b8'}
                    >
                      {link.enabled ? `w:${link.cost}` : 'CUT'}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Department Nodes */}
            {departments.map((dept) => {
              const isSource = selectedSource === dept.id;
              const isDest = selectedDest === dept.id;
              const isInPath = activePathNodes.includes(dept.id);

              return (
                <g
                  key={dept.id}
                  transform={`translate(${dept.x}, ${dept.y})`}
                  className="cursor-pointer"
                  onClick={() => {
                    if (selectedSource === dept.id) {
                      // Already source
                    } else if (selectedDest === dept.id) {
                      // Swap
                      setSelectedDest(selectedSource);
                      setSelectedSource(dept.id);
                    } else {
                      setSelectedDest(dept.id);
                    }
                  }}
                >
                  {/* Outer aura for source/dest */}
                  {(isSource || isDest) && (
                    <circle
                      r="36"
                      fill={isSource ? '#06b6d4' : '#10b981'}
                      fillOpacity="0.15"
                      className="animate-pulse"
                    />
                  )}

                  {/* Main Node Circle */}
                  <circle
                    r="26"
                    fill="#0f172a"
                    stroke={
                      isSource
                        ? '#06b6d4'
                        : isDest
                        ? '#10b981'
                        : isInPath
                        ? '#38bdf8'
                        : '#334155'
                    }
                    strokeWidth={isSource || isDest ? '3' : isInPath ? '2.5' : '1.8'}
                  />

                  {/* Department ID Acronym */}
                  <text
                    textAnchor="middle"
                    dy="-2"
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="700"
                    fill={isSource ? '#22d3ee' : isDest ? '#34d399' : '#f1f5f9'}
                  >
                    {dept.id}
                  </text>

                  {/* Node IP Text */}
                  <text
                    textAnchor="middle"
                    dy="13"
                    fontSize="8.5"
                    fontFamily="monospace"
                    fill="#64748b"
                  >
                    {dept.ip.replace('192.168.', '')}
                  </text>

                  {/* Department Label Outside Circle */}
                  <text
                    textAnchor="middle"
                    dy="42"
                    fontSize="10"
                    fontFamily="sans-serif"
                    fontWeight="600"
                    fill="#cbd5e1"
                  >
                    {dept.name}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span> Source Node</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span> Destination Node</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block"></span> Intermediate Hop</span>
            </div>
            <span>Click any node to assign Destination</span>
          </div>
        </div>

        {/* Link Configuration & Properties Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-semibold text-slate-200">
                  {selectedLinkObj ? `Link: ${selectedLinkObj.source} ↔ ${selectedLinkObj.target}` : 'Select a Link to Inspect'}
                </h3>
              </div>
              {selectedLinkObj && (
                <button
                  onClick={() => onToggleLink(selectedLinkObj.id, !selectedLinkObj.enabled)}
                  className={`px-2.5 py-1 text-xs font-mono font-medium rounded flex items-center gap-1.5 transition-colors ${
                    selectedLinkObj.enabled
                      ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  <span>{selectedLinkObj.enabled ? 'Sever Link' : 'Restore Link'}</span>
                </button>
              )}
            </div>

            {selectedLinkObj ? (
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span>Routing Cost (Dijkstra Weight)</span>
                    <span className="font-mono text-cyan-400 font-bold">{selectedLinkObj.cost}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={selectedLinkObj.cost}
                    onChange={(e) => onUpdateLinkCost(selectedLinkObj.id, parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                    <span>1 (High Priority / High Bandwidth)</span>
                    <span>15 (High Cost)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">BANDWIDTH</span>
                    <span className="text-slate-200 font-semibold">{selectedLinkObj.bandwidthMbps} Mbps</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">PROPAGATION DELAY</span>
                    <span className="text-slate-200 font-semibold">{selectedLinkObj.propagationDelayMs} ms</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">LOSS PROBABILITY</span>
                    <span className="text-slate-200 font-semibold">{(selectedLinkObj.packetLossProb * 100).toFixed(2)}%</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">QUEUE CAPACITY</span>
                    <span className="text-slate-200 font-semibold">{selectedLinkObj.queueCapacity} pkts</span>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                  <span className="font-semibold text-slate-300">Fault Tolerance Test:</span> Click <em>Sever Link</em> to simulate physical cable failure. Dijkstra's algorithm immediately recalculates the next lowest-cost path without interrupting hospital communication.
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">
                Click any line on the topology canvas to view link properties and adjust edge costs.
              </div>
            )}
          </div>

          {/* Alternative Routes Card */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30 text-xs">
            <h4 className="font-semibold text-slate-300 mb-2">
              Alternative Redundant Paths ({selectedSource} &rarr; {selectedDest})
            </h4>
            {dijkstraResult.alternativeRoutes.length === 0 ? (
              <div className="text-[11px] text-slate-500">
                No alternative redundant routes available.
              </div>
            ) : (
              <div className="space-y-1.5 font-mono text-[11px]">
                {dijkstraResult.alternativeRoutes.map((alt, i) => (
                  <div
                    key={i}
                    className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between text-slate-300"
                  >
                    <span>{alt.path.join(' → ')}</span>
                    <span className="text-slate-500">Cost: {alt.totalCost} (+{alt.differenceFromShortest})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
