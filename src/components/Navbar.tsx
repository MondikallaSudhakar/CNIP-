import React from 'react';
import { Activity, ShieldCheck, Terminal, Send, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  activeModule: string;
  onOpenQuickCompose: () => void;
  onRunQuickTests: () => void;
  stats: {
    activeNodes: number;
    pdr: number;
    totalMessages: number;
  };
}

export const Navbar: React.FC<NavbarProps> = ({
  activeModule,
  onOpenQuickCompose,
  onRunQuickTests,
  stats,
}) => {
  // Map module ID to breadcrumb title
  const moduleTitles: Record<string, string> = {
    'command-center': 'Command Center',
    'topology': 'Live Hospital Topology',
    'communication': 'Interdepartmental Messaging',
    'datalink-overview': 'Data Link Layer Architecture',
    'framing': 'Framing Laboratory',
    'crc': 'CRC Error Detection Lab',
    'flow-control': 'Sliding Window Flow Control',
    'gobackn': 'Go-Back-N ARQ Protocol',
    'routing': 'Dijkstra Shortest-Path Routing',
    'ns2': 'NS2 Simulation Laboratory',
    'congestion': 'Congestion & Queue Analysis',
    'wireshark': 'Wireshark Packet Inspector',
    'analytics': 'Network Performance Analytics',
    'history': 'Experiment & Transmission Logs',
    'docs': 'System Documentation & Tests',
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/95 backdrop-blur px-6 flex items-center justify-between gap-8 z-30 sticky top-0 shrink-0">
      {/* Brand & Breadcrumb Zone */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm">
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-100 whitespace-nowrap">
            MediNet
          </span>
        </div>
        <span className="text-slate-700 hidden sm:inline" aria-hidden="true">/</span>
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 truncate">
          <span>Hospital Emergency Network</span>
          <span aria-hidden="true">·</span>
          <span className="text-cyan-400 font-medium truncate">
            {moduleTitles[activeModule] || 'System Overview'}
          </span>
        </div>
      </div>

      {/* Network Status Metadata Zone */}
      <div className="hidden lg:flex items-center gap-6 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Nodes</span>
          <span className="font-mono font-semibold text-slate-200 tabular-nums">
            {stats.activeNodes}/5 Online
          </span>
        </div>
        <span className="text-slate-800" aria-hidden="true">|</span>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">PDR</span>
          <span className="font-mono font-semibold text-emerald-400 tabular-nums">
            {stats.pdr}%
          </span>
        </div>
        <span className="text-slate-800" aria-hidden="true">|</span>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Messages</span>
          <span className="font-mono font-semibold text-slate-200 tabular-nums">
            {stats.totalMessages}
          </span>
        </div>
      </div>

      {/* Actions Zone */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onRunQuickTests}
          className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          title="Run unit and integration verification test suites"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Run Test Suite</span>
        </button>
        <button
          onClick={onOpenQuickCompose}
          className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Compose STAT Order</span>
        </button>
      </div>
    </header>
  );
};
