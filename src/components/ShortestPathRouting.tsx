import React, { useState } from 'react';
import { GitFork, ArrowRight, Power, Sliders, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { DepartmentId, DepartmentNode, NetworkLink } from '../types/network';
import { computeDijkstra } from '../networking/dijkstra';

interface ShortestPathRoutingProps {
  departments: DepartmentNode[];
  links: NetworkLink[];
  onToggleLink: (linkId: string, enabled: boolean) => void;
  onUpdateLinkCost: (linkId: string, cost: number) => void;
}

export const ShortestPathRouting: React.FC<ShortestPathRoutingProps> = ({
  departments,
  links,
  onToggleLink,
  onUpdateLinkCost,
}) => {
  const [source, setSource] = useState<DepartmentId>('ER');
  const [destination, setDestination] = useState<DepartmentId>('PHARM');
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);

  const dijkstraResult = computeDijkstra(source, destination, links);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold tracking-wide uppercase">
            <GitFork className="w-3.5 h-3.5" />
            <span>Network Layer Shortest-Path Routing</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-1 tracking-tight">
            Dijkstra Shortest-Path Algorithm & Link Convergence
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Computes the globally optimal routing path across all five hospital departments using actual edge weights. Simulates link failure to demonstrate dynamic topological rerouting.
          </p>
        </div>

        {/* Source & Destination Selector */}
        <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">Source:</span>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as DepartmentId)}
              className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-medium"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.id} ({d.name})</option>
              ))}
            </select>
          </div>

          <span className="text-slate-600">&rarr;</span>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">Destination:</span>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value as DepartmentId)}
              className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-medium"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.id} ({d.name})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Primary Shortest Path Result Card */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        dijkstraResult.path.length > 0
          ? 'border-cyan-500/30 bg-cyan-950/20'
          : 'border-rose-500/40 bg-rose-950/20'
      }`}>
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-cyan-400">
            <span>Dijkstra Shortest Path Result:</span>
          </div>
          <div className="text-lg font-bold font-mono text-slate-100 mt-1 flex items-center gap-2">
            {dijkstraResult.path.length > 0 ? (
              dijkstraResult.path.map((node, i) => (
                <React.Fragment key={node}>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-cyan-500/40 text-cyan-300">
                    {node}
                  </span>
                  {i < dijkstraResult.path.length - 1 && <span className="text-slate-500">&rarr;</span>}
                </React.Fragment>
              ))
            ) : (
              <span className="text-rose-400">NO ACTIVE ROUTE AVAILABLE (ISOLATED PARTITION)</span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            {dijkstraResult.path.length > 0
              ? `Visited Nodes Exploration Order: [${dijkstraResult.visitedNodesOrder.join(', ')}]`
              : 'All candidate physical links between partitions have been severed.'}
          </p>
        </div>

        <div className="flex items-center gap-6 font-mono text-xs shrink-0">
          <div>
            <div className="text-slate-500 text-[10px]">TOTAL ROUTING COST</div>
            <div className="text-base font-bold text-slate-100">
              {dijkstraResult.totalCost >= 0 ? dijkstraResult.totalCost : 'Infinity'}
            </div>
          </div>
          <div>
            <div className="text-slate-500 text-[10px]">TOTAL PROPAGATION DELAY</div>
            <div className="text-base font-bold text-cyan-300">
              {dijkstraResult.totalLatencyMs.toFixed(1)} ms
            </div>
          </div>
        </div>
      </div>

      {/* Edge Weights & Interactive Failure Injection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Link Weights & Failure Toggles (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Network Links & Dynamic Edge Weights
            </h3>
            <span className="text-[11px] font-mono text-slate-500">
              {links.filter((l) => l.enabled).length}/{links.length} Active Links
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {links.map((link) => {
              const isInPath = dijkstraResult.path.some((u, i) => {
                if (i === dijkstraResult.path.length - 1) return false;
                const v = dijkstraResult.path[i + 1];
                return (link.source === u && link.target === v) || (link.source === v && link.target === u);
              });

              return (
                <div
                  key={link.id}
                  className={`p-3 rounded-lg border text-xs transition-colors ${
                    !link.enabled
                      ? 'border-rose-900/50 bg-rose-950/20 text-slate-500'
                      : isInPath
                      ? 'border-cyan-500/50 bg-cyan-950/20'
                      : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/70'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                    <span className="font-mono font-bold text-slate-200">
                      {link.source} &harr; {link.target}
                    </span>
                    <button
                      onClick={() => onToggleLink(link.id, !link.enabled)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors flex items-center gap-1 ${
                        link.enabled
                          ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                      }`}
                    >
                      <Power className="w-2.5 h-2.5" />
                      <span>{link.enabled ? 'Sever' : 'Restore'}</span>
                    </button>
                  </div>

                  <div className="pt-2 space-y-1.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Routing Weight: <strong className="text-cyan-300">{link.cost}</strong></span>
                      <span>Delay: {link.propagationDelayMs} ms</span>
                    </div>

                    <input
                      type="range"
                      min="1"
                      max="15"
                      disabled={!link.enabled}
                      value={link.cost}
                      onChange={(e) => onUpdateLinkCost(link.id, parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Alternative Routes & Distance Vector State (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Candidate Alternative Routes
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              If the primary shortest path suffers congestion or fiber cuts, the routing engine fails over to these pre-computed loopless alternatives:
            </p>

            {dijkstraResult.alternativeRoutes.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 font-mono">
                No alternative redundant routes found.
              </div>
            ) : (
              <div className="space-y-2 font-mono text-xs">
                {dijkstraResult.alternativeRoutes.map((alt, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between"
                  >
                    <span className="text-slate-200">{alt.path.join(' → ')}</span>
                    <span className="text-slate-400 text-[11px]">
                      Cost: <strong className="text-cyan-400">{alt.totalCost}</strong> (+{alt.differenceFromShortest})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Node Distance Table */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Dijkstra Distance Matrix from {source}
            </h3>
            <div className="rounded border border-slate-800 overflow-hidden font-mono text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-500 text-[10px]">
                  <tr>
                    <th className="p-2">Node</th>
                    <th className="p-2">Cost from {source}</th>
                    <th className="p-2">Previous Hop</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {departments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-slate-900/60">
                      <td className="p-2 font-bold text-cyan-400">{dept.id}</td>
                      <td className="p-2">
                        {dijkstraResult.distances[dept.id] === Infinity
                          ? 'Infinity (Unreachable)'
                          : dijkstraResult.distances[dept.id]}
                      </td>
                      <td className="p-2 text-slate-400">
                        {dijkstraResult.previous[dept.id] || 'Source Root'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
