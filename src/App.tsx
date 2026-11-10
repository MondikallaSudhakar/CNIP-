/**
 * MediNet - Hospital Emergency Communication Network
 * Main Application Orchestrator
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { CommandCenter } from './components/CommandCenter';
import { TopologyGraph } from './components/TopologyGraph';
import { DepartmentCommunication } from './components/DepartmentCommunication';
import { DataLinkOverview } from './components/DataLinkOverview';
import { FramingLab } from './components/FramingLab';
import { CrcLaboratory } from './components/CrcLaboratory';
import { FlowControlLab } from './components/FlowControlLab';
import { GoBackNLab } from './components/GoBackNLab';
import { ShortestPathRouting } from './components/ShortestPathRouting';
import { Ns2SimulationLab } from './components/Ns2SimulationLab';
import { CongestionMonitoring } from './components/CongestionMonitoring';
import { WiresharkInspector } from './components/WiresharkInspector';
import { NetworkAnalytics } from './components/NetworkAnalytics';
import { ExperimentHistory } from './components/ExperimentHistory';
import { DocumentationModule } from './components/DocumentationModule';

import { clinicalStore, MediNetStats } from './services/store';
import { DepartmentId, DepartmentNode, HospitalMessage, NetworkEvent, NetworkLink } from './types/network';
import { Send, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeModule, setActiveModule] = useState<string>('command-center');
  const [departments, setDepartments] = useState<DepartmentNode[]>(() => clinicalStore.getDepartments());
  const [links, setLinks] = useState<NetworkLink[]>(() => clinicalStore.getLinks());
  const [messages, setMessages] = useState<HospitalMessage[]>(() => clinicalStore.getMessages());
  const [events, setEvents] = useState<NetworkEvent[]>(() => clinicalStore.getEvents());
  const [stats, setStats] = useState<MediNetStats>(() => clinicalStore.getStatistics());

  // Quick Compose Modal State
  const [isQuickComposeOpen, setIsQuickComposeOpen] = useState(false);
  const [quickSource, setQuickSource] = useState<DepartmentId>('ER');
  const [quickDest, setQuickDest] = useState<DepartmentId>('PHARM');
  const [quickSubj, setQuickSubj] = useState('STAT IV Thrombolytic Alteplase 0.9mg/kg');
  const [quickBody, setQuickBody] = useState('Acute ischemic stroke protocol. ER Trauma Bay 1 confirms onset < 2 hours. Immediate preparation and delivery requested.');
  const [quickPriority, setQuickPriority] = useState<HospitalMessage['priority']>('CRITICAL');

  // Subscribe to clinical store updates
  useEffect(() => {
    const unsubscribe = clinicalStore.subscribe(() => {
      setDepartments(clinicalStore.getDepartments());
      setLinks(clinicalStore.getLinks());
      setMessages(clinicalStore.getMessages());
      setEvents(clinicalStore.getEvents());
      setStats(clinicalStore.getStatistics());
    });
    return unsubscribe;
  }, []);

  const handleToggleLink = (linkId: string, enabled: boolean) => {
    clinicalStore.setLinkEnabled(linkId, enabled);
  };

  const handleUpdateLinkCost = (linkId: string, cost: number) => {
    clinicalStore.updateLinkCost(linkId, cost);
  };

  const handleSendMessage = (params: {
    source: DepartmentId;
    destination: DepartmentId;
    subject: string;
    content: string;
    priority: HospitalMessage['priority'];
    framingTechnique: 'CHARACTER_COUNT' | 'BYTE_STUFFING' | 'BIT_STUFFING';
    crcAlgorithm: 'CRC-8' | 'CRC-16' | 'CRC-32';
    simulateBitError: boolean;
  }) => {
    clinicalStore.transmitMessage(params);
  };

  const handleQuickTransmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBody.trim()) return;

    clinicalStore.transmitMessage({
      source: quickSource,
      destination: quickDest,
      subject: quickSubj,
      content: quickBody,
      priority: quickPriority,
      framingTechnique: 'BIT_STUFFING',
      crcAlgorithm: 'CRC-16',
      simulateBitError: false,
    });

    setIsQuickComposeOpen(false);
    setActiveModule('communication');
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      {/* Top Bar Contract (3 zones) */}
      <Navbar
        activeModule={activeModule}
        onOpenQuickCompose={() => setIsQuickComposeOpen(true)}
        onRunQuickTests={() => setActiveModule('docs')}
        stats={{
          activeNodes: stats.activeNodesCount,
          pdr: stats.packetDeliveryRatio,
          totalMessages: stats.totalMessages,
        }}
      />

      <div className="flex-1 flex overflow-hidden min-h-0 min-w-0">
        {/* Stationary Fixed Sidebar (15 modules) */}
        <Sidebar activeModule={activeModule} onSelectModule={setActiveModule} />

        {/* Scrollable Main Content Viewport (Only this area scrolls) */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto p-6 md:p-8 bg-slate-950/50">
          <div className="max-w-7xl mx-auto">
            {activeModule === 'command-center' && (
              <CommandCenter
                stats={stats}
                departments={departments}
                links={links}
                events={events}
                messages={messages}
                onNavigate={setActiveModule}
                onOpenQuickCompose={() => setIsQuickComposeOpen(true)}
              />
            )}

            {activeModule === 'topology' && (
              <TopologyGraph
                departments={departments}
                links={links}
                onToggleLink={handleToggleLink}
                onUpdateLinkCost={handleUpdateLinkCost}
                onTransmitPath={(src, dst) => {
                  clinicalStore.transmitMessage({
                    source: src,
                    destination: dst,
                    subject: 'Campus Telemetry Ping',
                    content: `Automated diagnostic link probe from ${src} to ${dst}`,
                    priority: 'NORMAL',
                  });
                }}
              />
            )}

            {activeModule === 'communication' && (
              <DepartmentCommunication
                messages={messages}
                onSendMessage={handleSendMessage}
              />
            )}

            {activeModule === 'datalink-overview' && (
              <DataLinkOverview onNavigate={setActiveModule} />
            )}

            {activeModule === 'framing' && <FramingLab />}

            {activeModule === 'crc' && <CrcLaboratory />}

            {activeModule === 'flow-control' && <FlowControlLab />}

            {activeModule === 'gobackn' && <GoBackNLab />}

            {activeModule === 'routing' && (
              <ShortestPathRouting
                departments={departments}
                links={links}
                onToggleLink={handleToggleLink}
                onUpdateLinkCost={handleUpdateLinkCost}
              />
            )}

            {activeModule === 'ns2' && <Ns2SimulationLab />}

            {activeModule === 'congestion' && <CongestionMonitoring />}

            {activeModule === 'wireshark' && <WiresharkInspector />}

            {activeModule === 'analytics' && (
              <NetworkAnalytics stats={stats} messages={messages} />
            )}

            {activeModule === 'history' && (
              <ExperimentHistory messages={messages} events={events} />
            )}

            {activeModule === 'docs' && <DocumentationModule />}
          </div>
        </main>
      </div>

      {/* Quick Compose STAT Modal */}
      {isQuickComposeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Send className="w-4 h-4" />
                <span>Instant STAT Emergency Requisition</span>
              </div>
              <button
                onClick={() => setIsQuickComposeOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickTransmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Source Node</label>
                  <select
                    value={quickSource}
                    onChange={(e) => setQuickSource(e.target.value as DepartmentId)}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-700 rounded px-2.5 py-1.5 font-mono"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.id} ({d.name})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Destination Node</label>
                  <select
                    value={quickDest}
                    onChange={(e) => setQuickDest(e.target.value as DepartmentId)}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-700 rounded px-2.5 py-1.5 font-mono"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.id} ({d.name})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Order Priority</label>
                <select
                  value={quickPriority}
                  onChange={(e) => setQuickPriority(e.target.value as any)}
                  className="w-full bg-slate-950 text-slate-200 border border-slate-700 rounded px-2.5 py-1.5 font-mono"
                >
                  <option value="CRITICAL">CRITICAL (STAT Resuscitation)</option>
                  <option value="HIGH">HIGH (Urgent)</option>
                  <option value="NORMAL">NORMAL (Routine)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Subject</label>
                <input
                  type="text"
                  value={quickSubj}
                  onChange={(e) => setQuickSubj(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 border border-slate-700 rounded px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Message Content</label>
                <textarea
                  rows={3}
                  value={quickBody}
                  onChange={(e) => setQuickBody(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 border border-slate-700 rounded p-2.5 leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickComposeOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit Order</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
