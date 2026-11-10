import React from 'react';
import {
  LayoutDashboard,
  Network,
  MessageSquareShare,
  Layers,
  Binary,
  ShieldAlert,
  Sliders,
  RotateCcw,
  GitFork,
  Cpu,
  Gauge,
  SearchCode,
  LineChart,
  History,
  FileCode2,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  category: 'Operations' | 'Data Link Layer' | 'Network & Simulation' | 'Inspection & System';
  icon: React.ElementType;
}

export const NAV_ITEMS: NavItem[] = [
  // Operations
  { id: 'command-center', label: 'Command Center', category: 'Operations', icon: LayoutDashboard },
  { id: 'topology', label: 'Live Hospital Network', category: 'Operations', icon: Network },
  { id: 'communication', label: 'Department Messages', category: 'Operations', icon: MessageSquareShare },

  // Data Link Layer
  { id: 'datalink-overview', label: 'Data Link Layer', category: 'Data Link Layer', icon: Layers },
  { id: 'framing', label: 'Framing Laboratory', category: 'Data Link Layer', icon: Binary },
  { id: 'crc', label: 'CRC Error Detection', category: 'Data Link Layer', icon: ShieldAlert },
  { id: 'flow-control', label: 'Flow Control', category: 'Data Link Layer', icon: Sliders },
  { id: 'gobackn', label: 'Go-Back-N ARQ', category: 'Data Link Layer', icon: RotateCcw },

  // Network & Simulation
  { id: 'routing', label: 'Intelligent Routing', category: 'Network & Simulation', icon: GitFork },
  { id: 'ns2', label: 'NS2 Simulation Lab', category: 'Network & Simulation', icon: Cpu },
  { id: 'congestion', label: 'Congestion Monitoring', category: 'Network & Simulation', icon: Gauge },

  // Inspection & System
  { id: 'wireshark', label: 'Wireshark Inspector', category: 'Inspection & System', icon: SearchCode },
  { id: 'analytics', label: 'Network Analytics', category: 'Inspection & System', icon: LineChart },
  { id: 'history', label: 'Experiment History', category: 'Inspection & System', icon: History },
  { id: 'docs', label: 'Documentation & Tests', category: 'Inspection & System', icon: FileCode2 },
];

interface SidebarProps {
  activeModule: string;
  onSelectModule: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeModule, onSelectModule }) => {
  const categories: Array<NavItem['category']> = [
    'Operations',
    'Data Link Layer',
    'Network & Simulation',
    'Inspection & System',
  ];

  return (
    <aside className="w-64 min-w-[16rem] max-w-[16rem] h-full shrink-0 border-r border-slate-800/80 bg-slate-950 flex flex-col select-none overflow-y-auto z-20">
      {/* Subtitle / Tagline Header */}
      <div className="p-4 border-b border-slate-800/60">
        <div className="text-xs font-semibold text-slate-300">MediNet Operations</div>
        <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">
          Reliable Emergency Protocol Engine
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 py-3 px-3 space-y-5">
        {categories.map((category) => {
          const items = NAV_ITEMS.filter((item) => item.category === category);
          return (
            <div key={category}>
              <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                {category}
              </div>
              <nav className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeModule === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectModule(item.id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                        isActive
                          ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>

      {/* Bottom Node Summary Strip */}
      <div className="p-3 border-t border-slate-800/60 bg-slate-900/30 text-[11px] text-slate-500">
        <div className="flex items-center justify-between font-mono text-[10px]">
          <span>NETWORK CORE</span>
          <span className="text-emerald-400">NOMINAL</span>
        </div>
        <div className="mt-1 text-[10px] text-slate-500">
          5 Nodes · 9 Duplex Links
        </div>
      </div>
    </aside>
  );
};
