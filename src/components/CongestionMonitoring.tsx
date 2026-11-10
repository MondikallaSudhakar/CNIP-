import React, { useState } from 'react';
import { Gauge, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight, BarChart3 } from 'lucide-react';

interface TrafficProfile {
  id: 'LOW' | 'MEDIUM' | 'HIGH';
  name: string;
  loadMbps: number;
  description: string;
  dropTail: {
    throughputMbps: number;
    avgDelayMs: number;
    packetLossPct: number;
    queueUtilizationPct: number;
    pdr: number;
    drops: number;
    retransmissions: number;
  };
  red: {
    throughputMbps: number;
    avgDelayMs: number;
    packetLossPct: number;
    queueUtilizationPct: number;
    pdr: number;
    drops: number;
    retransmissions: number;
  };
}

const TRAFFIC_PROFILES: TrafficProfile[] = [
  {
    id: 'LOW',
    name: 'Low Emergency Load (Routine Hospital Ops)',
    loadMbps: 15,
    description: 'Routine telemetry, bed assignments, and standard pharmacy requisitions well within hospital link capacity.',
    dropTail: { throughputMbps: 14.8, avgDelayMs: 2.1, packetLossPct: 0.1, queueUtilizationPct: 22, pdr: 99.9, drops: 1, retransmissions: 1 },
    red: { throughputMbps: 14.9, avgDelayMs: 1.9, packetLossPct: 0.05, queueUtilizationPct: 18, pdr: 99.95, drops: 0, retransmissions: 0 },
  },
  {
    id: 'MEDIUM',
    name: 'Medium Emergency Load (Surge / Shift Change)',
    loadMbps: 50,
    description: 'Concurrent PACS imaging transfers from Laboratory to ICU alongside continuous vital signs streams.',
    dropTail: { throughputMbps: 45.2, avgDelayMs: 4.8, packetLossPct: 2.4, queueUtilizationPct: 68, pdr: 97.6, drops: 28, retransmissions: 19 },
    red: { throughputMbps: 47.8, avgDelayMs: 3.5, packetLossPct: 1.2, queueUtilizationPct: 52, pdr: 98.8, drops: 14, retransmissions: 8 },
  },
  {
    id: 'HIGH',
    name: 'High Emergency Load (Mass Casualty / Core Saturation)',
    loadMbps: 90,
    description: 'Severe bottleneck saturation across central core switch with buffer exhaustion under bursty trauma telemetry.',
    dropTail: { throughputMbps: 62.4, avgDelayMs: 12.4, packetLossPct: 14.8, queueUtilizationPct: 98, pdr: 85.2, drops: 184, retransmissions: 122 },
    red: { throughputMbps: 74.6, avgDelayMs: 7.2, packetLossPct: 6.5, queueUtilizationPct: 76, pdr: 93.5, drops: 72, retransmissions: 41 },
  },
];

export const CongestionMonitoring: React.FC = () => {
  const [activeProfileId, setActiveProfileId] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [selectedQueueMode, setSelectedQueueMode] = useState<'COMPARISON' | 'DROPTAIL' | 'RED'>('COMPARISON');

  const profile = TRAFFIC_PROFILES.find((p) => p.id === activeProfileId)!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold tracking-wide uppercase">
            <Gauge className="w-3.5 h-3.5" />
            <span>Network Congestion & Buffer Management</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-1 tracking-tight">
            Congestion Monitoring & Active Queue Evaluation
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Compare network performance under Low, Medium, and High traffic loads. Evaluate active queue management (RED) versus passive DropTail to prevent TCP global synchronization during hospital emergencies.
          </p>
        </div>

        {/* Profile Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
          {(['LOW', 'MEDIUM', 'HIGH'] as const).map((id) => (
            <button
              key={id}
              onClick={() => setActiveProfileId(id)}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                activeProfileId === id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {id === 'LOW' ? '15 Mbps (Low)' : id === 'MEDIUM' ? '50 Mbps (Med)' : '90 Mbps (High)'}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Profile Banner */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="font-bold text-slate-200 text-sm block">{profile.name}</span>
          <p className="text-slate-400 mt-0.5">{profile.description}</p>
        </div>
        <div className="font-mono text-cyan-400 font-bold text-sm bg-slate-950 px-3 py-1.5 rounded border border-slate-800 shrink-0">
          Target Traffic Rate: {profile.loadMbps} Mbps
        </div>
      </div>

      {/* Head-to-Head Comparison: DropTail vs RED */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DropTail Card */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-200">DropTail Queue (Passive FIFO)</h3>
              <span className="text-[11px] text-slate-500">Tail drops packets only when queue is completely full</span>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              Default Standard
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* Throughput Bar */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Effective Throughput</span>
                <span className="text-slate-200 font-bold">{profile.dropTail.throughputMbps} Mbps</span>
              </div>
              <div className="w-full h-2 rounded bg-slate-950 overflow-hidden">
                <div
                  className="h-full bg-slate-400"
                  style={{ width: `${(profile.dropTail.throughputMbps / profile.loadMbps) * 100}%` }}
                />
              </div>
            </div>

            {/* Queue Utilization Bar */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Queue Buffer Occupancy</span>
                <span className={profile.dropTail.queueUtilizationPct > 80 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                  {profile.dropTail.queueUtilizationPct}%
                </span>
              </div>
              <div className="w-full h-2 rounded bg-slate-950 overflow-hidden">
                <div
                  className={`h-full ${profile.dropTail.queueUtilizationPct > 80 ? 'bg-rose-500' : 'bg-slate-400'}`}
                  style={{ width: `${profile.dropTail.queueUtilizationPct}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">AVG QUEUE DELAY</span>
                <span className="text-slate-200 font-bold">{profile.dropTail.avgDelayMs} ms</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">PACKET LOSS RATE</span>
                <span className="text-rose-400 font-bold">{profile.dropTail.packetLossPct}%</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">DELIVERY RATIO (PDR)</span>
                <span className="text-slate-200 font-bold">{profile.dropTail.pdr}%</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">RETRANSMISSIONS</span>
                <span className="text-amber-400 font-bold">{profile.dropTail.retransmissions}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RED Card */}
        <div className="p-5 rounded-xl border border-cyan-500/30 bg-slate-900/60 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-cyan-300">RED (Random Early Detection)</h3>
              <span className="text-[11px] text-slate-400">Probabilistic early dropping signals TCP backoff</span>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              Active AQM
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* Throughput Bar */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Effective Throughput</span>
                <span className="text-cyan-300 font-bold">{profile.red.throughputMbps} Mbps</span>
              </div>
              <div className="w-full h-2 rounded bg-slate-950 overflow-hidden">
                <div
                  className="h-full bg-cyan-400"
                  style={{ width: `${(profile.red.throughputMbps / profile.loadMbps) * 100}%` }}
                />
              </div>
            </div>

            {/* Queue Utilization Bar */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Queue Buffer Occupancy</span>
                <span className="text-emerald-400 font-bold">{profile.red.queueUtilizationPct}%</span>
              </div>
              <div className="w-full h-2 rounded bg-slate-950 overflow-hidden">
                <div
                  className="h-full bg-emerald-400"
                  style={{ width: `${profile.red.queueUtilizationPct}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">AVG QUEUE DELAY</span>
                <span className="text-emerald-400 font-bold">{profile.red.avgDelayMs} ms (-{((profile.dropTail.avgDelayMs - profile.red.avgDelayMs) / profile.dropTail.avgDelayMs * 100).toFixed(0)}%)</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">PACKET LOSS RATE</span>
                <span className="text-emerald-400 font-bold">{profile.red.packetLossPct}%</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">DELIVERY RATIO (PDR)</span>
                <span className="text-cyan-300 font-bold">{profile.red.pdr}%</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">RETRANSMISSIONS</span>
                <span className="text-cyan-300 font-bold">{profile.red.retransmissions} (-{((profile.dropTail.retransmissions - profile.red.retransmissions) / profile.dropTail.retransmissions * 100).toFixed(0)}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hospital Network Congestion Analysis Insight */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30 text-xs text-slate-300 space-y-2">
        <h4 className="font-bold text-slate-200">
          Academic Finding: Queue Management in Clinical Real-Time Telemetry
        </h4>
        <p className="text-slate-400 leading-relaxed text-[11px]">
          Under bursty emergency conditions (e.g. 90 Mbps mass casualty surge), passive <strong>DropTail</strong> experiences queue lockouts and TCP global synchronization, spiking queuing delay to 12.4ms and losing 14.8% of packets. In contrast, <strong>RED (Random Early Detection)</strong> drops single packets probabilistically before buffer exhaustion, keeping average queuing delay under 7.2ms and preserving critical cardiac monitor telemetry.
        </p>
      </div>
    </div>
  );
};
