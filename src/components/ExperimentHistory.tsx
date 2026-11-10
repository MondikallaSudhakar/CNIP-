import React, { useState } from 'react';
import { History, Search, Download, Database, Filter, Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { HospitalMessage, NetworkEvent } from '../types/network';

interface ExperimentHistoryProps {
  messages: HospitalMessage[];
  events: NetworkEvent[];
}

export const ExperimentHistory: React.FC<ExperimentHistoryProps> = ({ messages, events }) => {
  const [activeTab, setActiveTab] = useState<'MESSAGES' | 'EVENTS' | 'SCHEMA'>('MESSAGES');
  const [searchQuery, setSearchQuery] = useState('');

  const handleExportJson = () => {
    const data = {
      project: 'MediNet - Hospital Emergency Communication Network',
      exportedAt: new Date().toISOString(),
      messages,
      events,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medinet_database_export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredMessages = messages.filter((m) =>
    m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold tracking-wide uppercase">
            <History className="w-3.5 h-3.5" />
            <span>Database Storage &amp; Audit Trail</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-1 tracking-tight">
            Experiment History &amp; SQLite Schema Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Persistent storage and querying of interdepartmental messages, Data Link frames, CRC results, routing paths, and simulation logs.
          </p>
        </div>

        <button
          onClick={handleExportJson}
          className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Database (JSON)</span>
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/40">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('MESSAGES')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'MESSAGES' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Messages Table ({messages.length})
          </button>
          <button
            onClick={() => setActiveTab('EVENTS')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'EVENTS' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Audit Events ({events.length})
          </button>
          <button
            onClick={() => setActiveTab('SCHEMA')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'SCHEMA' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SQLite Schema
          </button>
        </div>

        {activeTab !== 'SCHEMA' && (
          <div className="w-full sm:w-64 relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Content Panel */}
      {activeTab === 'MESSAGES' && (
        <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-900/80 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Route</th>
                  <th className="p-3">Subject &amp; Body</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Cost / Latency</th>
                  <th className="p-3">CRC Integrity</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredMessages.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-cyan-400">{m.id}</td>
                    <td className="p-3 text-slate-400 text-[11px]">{new Date(m.timestamp).toLocaleTimeString()}</td>
                    <td className="p-3 text-slate-200">{m.source} &rarr; {m.destination}</td>
                    <td className="p-3 max-w-xs truncate text-[11px] font-sans">
                      <strong className="text-slate-200 block truncate">{m.subject}</strong>
                      <span className="text-slate-500 truncate block">{m.content}</span>
                    </td>
                    <td className="p-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                        {m.priority}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">Cost: {m.totalCost} · {m.latencyMs}ms</td>
                    <td className="p-3">
                      <span className={m.crcValid ? 'text-emerald-400' : 'text-rose-400'}>
                        {m.crcAlgorithm} ({m.crcValid ? 'PASS' : 'FAIL'})
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'EVENTS' && (
        <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-900/80 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Event ID</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Title &amp; Description</th>
                  <th className="p-3">Source / Destination</th>
                  <th className="p-3">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-cyan-400">{evt.id}</td>
                    <td className="p-3 text-slate-400 text-[11px]">{evt.timestamp}</td>
                    <td className="p-3 font-bold text-slate-200">{evt.type}</td>
                    <td className="p-3 font-sans text-[11px]">
                      <div className="font-semibold text-slate-200">{evt.title}</div>
                      <div className="text-slate-400">{evt.description}</div>
                    </td>
                    <td className="p-3 text-slate-400">
                      {evt.source && evt.destination ? `${evt.source} → ${evt.destination}` : '-'}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        evt.level === 'success'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : evt.level === 'error'
                          ? 'bg-rose-500/10 text-rose-400'
                          : evt.level === 'warning'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-cyan-500/10 text-cyan-400'
                      }`}>
                        {evt.level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'SCHEMA' && (
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs space-y-4">
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <Database className="w-4 h-4" />
            <span>SQLite Database Relational Architecture (schema.sql)</span>
          </div>
          <pre className="p-4 rounded bg-slate-900/80 border border-slate-800 text-slate-300 max-h-96 overflow-y-auto text-[11px] leading-relaxed">
{`-- MediNet Hospital Emergency Communication Network
-- SQLite Database Schema Definition

CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    ip_address TEXT NOT NULL UNIQUE,
    mac_address TEXT NOT NULL UNIQUE,
    subnet_mask TEXT NOT NULL,
    location TEXT NOT NULL,
    status TEXT CHECK(status IN ('ONLINE', 'DEGRADED', 'OFFLINE')) DEFAULT 'ONLINE'
);

CREATE TABLE IF NOT EXISTS network_links (
    id TEXT PRIMARY KEY,
    source_dept TEXT REFERENCES departments(id),
    target_dept TEXT REFERENCES departments(id),
    bandwidth_mbps INTEGER NOT NULL,
    propagation_delay_ms REAL NOT NULL,
    packet_loss_prob REAL DEFAULT 0.001,
    queue_capacity INTEGER DEFAULT 100,
    routing_cost INTEGER DEFAULT 1,
    enabled BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS hospital_messages (
    id TEXT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_dept TEXT REFERENCES departments(id),
    dest_dept TEXT REFERENCES departments(id),
    subject TEXT NOT NULL,
    payload TEXT NOT NULL,
    priority TEXT CHECK(priority IN ('CRITICAL', 'HIGH', 'NORMAL', 'LOW')),
    status TEXT CHECK(status IN ('PENDING', 'ROUTING', 'DELIVERED', 'FAILED')),
    dijkstra_route TEXT, -- JSON Array of hops
    total_cost INTEGER,
    frames_count INTEGER,
    crc_algorithm TEXT,
    crc_valid BOOLEAN,
    retransmissions INTEGER DEFAULT 0,
    latency_ms REAL
);

CREATE TABLE IF NOT EXISTS simulation_experiments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    traffic_type TEXT,
    queue_type TEXT,
    packet_delivery_ratio REAL,
    avg_delay_ms REAL,
    throughput_kbps REAL,
    trace_log TEXT
);`}
          </pre>
        </div>
      )}
    </div>
  );
};
