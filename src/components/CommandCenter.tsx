import React from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Radio,
  ArrowRight,
  TrendingUp,
  Server,
  Zap,
  Clock,
  ShieldAlert,
  Send,
} from 'lucide-react';
import { DepartmentNode, HospitalMessage, NetworkEvent, NetworkLink } from '../types/network';
import { MediNetStats } from '../services/store';

interface CommandCenterProps {
  stats: MediNetStats;
  departments: DepartmentNode[];
  links: NetworkLink[];
  events: NetworkEvent[];
  messages: HospitalMessage[];
  onNavigate: (module: string) => void;
  onOpenQuickCompose: () => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  stats,
  departments,
  links,
  events,
  messages,
  onNavigate,
  onOpenQuickCompose,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner / Mission Statement */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold tracking-wide uppercase">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span>Hospital Telemetry Operations Center</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-1 tracking-tight">
            MediNet Interdepartmental Emergency Network
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Active monitoring and algorithmic protocol verification across 5 clinical departments.
            Demonstrating Data Link framing, CRC error detection, Sliding Window flow control, Go-Back-N ARQ, and Dijkstra shortest-path routing.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigate('topology')}
            className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <span>Inspect Topology</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenQuickCompose}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Transmit Emergency Order</span>
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/40">
          <div className="text-[11px] text-slate-400 font-medium">Departments</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-slate-100 tabular-nums">
              {stats.activeNodesCount}
            </span>
            <span className="text-xs text-slate-500">/ 5 online</span>
          </div>
          <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>All nodes operational</span>
          </div>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/40">
          <div className="text-[11px] text-slate-400 font-medium">Active Links</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-slate-100 tabular-nums">
              {stats.activeLinksCount}
            </span>
            <span className="text-xs text-slate-500">/ {links.length} duplex</span>
          </div>
          <div className="text-[10px] text-cyan-400 mt-1">
            {links.filter((l) => !l.enabled).length === 0 ? 'Full mesh enabled' : `${links.filter((l) => !l.enabled).length} disabled`}
          </div>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/40">
          <div className="text-[11px] text-slate-400 font-medium">Delivery Ratio (PDR)</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
              {stats.packetDeliveryRatio}%
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            {stats.deliveredMessages} delivered / {stats.failedMessages} failed
          </div>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/40">
          <div className="text-[11px] text-slate-400 font-medium">Average Latency</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-cyan-300 tabular-nums">
              {stats.avgDelayMs}
            </span>
            <span className="text-xs text-slate-400">ms</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Dijkstra propagation</div>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/40">
          <div className="text-[11px] text-slate-400 font-medium">CRC Error Frames</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-amber-400 tabular-nums">
              {stats.corruptedFrames}
            </span>
            <span className="text-xs text-slate-500">detected</span>
          </div>
          <div className="text-[10px] text-amber-400/80 mt-1">Modulo-2 verified</div>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/40">
          <div className="text-[11px] text-slate-400 font-medium">GBN Retransmits</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-slate-200 tabular-nums">
              {stats.retransmissions}
            </span>
            <span className="text-xs text-slate-500">timeouts</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Cumulative ACK sync</div>
        </div>
      </div>

      {/* Main 2-Column Split: Departments & Live Event Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 5 Departments Operational Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200 tracking-tight">
              Hospital Department Nodes
            </h2>
            <button
              onClick={() => onNavigate('topology')}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 font-medium"
            >
              <span>Interactive Graph</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="p-3.5 rounded-lg border border-slate-800/90 bg-slate-900/40 hover:bg-slate-900/70 transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-slate-800/80 border border-slate-700/80 flex items-center justify-center font-mono font-bold text-xs text-cyan-400">
                    {dept.id}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      {dept.name}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                      <span>{dept.ip}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-500">{dept.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs shrink-0">
                  <div className="hidden sm:block text-right">
                    <div className="text-[10px] text-slate-500 uppercase">Buffer</div>
                    <div className="font-mono text-slate-300 text-xs">
                      {dept.bufferCapacity} KB
                    </div>
                  </div>
                  <div className="hidden md:block text-right">
                    <div className="text-[10px] text-slate-500 uppercase">Staff Active</div>
                    <div className="font-mono text-slate-300 text-xs">
                      {dept.activeStaff}
                    </div>
                  </div>
                  <div className="px-2.5 py-1 rounded text-[11px] font-medium font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                    ONLINE
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Routing Matrix Snapshot */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">
                Active Duplex Physical Links
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Dijkstra Dynamic Weighting
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {links.slice(0, 6).map((link) => (
                <div
                  key={link.id}
                  className={`p-2 rounded border text-[11px] font-mono flex items-center justify-between ${
                    link.enabled
                      ? 'border-slate-800 bg-slate-950/60 text-slate-300'
                      : 'border-red-900/40 bg-red-950/20 text-red-400'
                  }`}
                >
                  <span className="font-bold">{link.source}-{link.target}</span>
                  <span className="text-slate-500">Cost: {link.cost} · {link.propagationDelayMs}ms</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Event Feed & Recent Messages (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200 tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Real-Time Network Event Log</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-500">
              {events.length} events logged
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 divide-y divide-slate-800/80 max-h-[480px] overflow-y-auto">
            {events.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No network events recorded yet. Transmit an emergency order to trigger pipeline telemetry.
              </div>
            ) : (
              events.map((evt) => {
                const isSuccess = evt.level === 'success';
                const isError = evt.level === 'error';
                const isWarning = evt.level === 'warning';

                return (
                  <div key={evt.id} className="p-3 text-xs hover:bg-slate-900/90 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-200 truncate">
                        {evt.title}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500 shrink-0">
                        {evt.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {evt.description}
                    </p>
                    {evt.source && evt.destination && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                        <span className="text-slate-400">{evt.source}</span>
                        <span>&rarr;</span>
                        <span className="text-slate-400">{evt.destination}</span>
                        <span aria-hidden="true">·</span>
                        <span className={isSuccess ? 'text-emerald-400' : isError ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-cyan-400'}>
                          {evt.type}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Clinical Requisitions Strip */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">
                Recent Clinical Messages
              </span>
              <button
                onClick={() => onNavigate('communication')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
              >
                View Inbox ({messages.length})
              </button>
            </div>
            <div className="space-y-1.5">
              {messages.slice(0, 3).map((msg) => (
                <div
                  key={msg.id}
                  className="p-2 rounded border border-slate-800/80 bg-slate-950/60 text-xs flex items-center justify-between gap-2"
                >
                  <div className="truncate">
                    <span className="font-mono text-[10px] text-cyan-400 mr-1.5">[{msg.priority}]</span>
                    <span className="text-slate-200">{msg.subject}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    msg.status === 'DELIVERED' ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                  }`}>
                    {msg.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
