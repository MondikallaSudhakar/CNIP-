import React, { useState } from 'react';
import { DepartmentId, HospitalMessage } from '../types/network';
import { Send, CheckCircle2, XCircle, AlertCircle, FileText, ArrowRight, ShieldCheck, Layers, RefreshCw } from 'lucide-react';

interface DepartmentCommunicationProps {
  messages: HospitalMessage[];
  onSendMessage: (params: {
    source: DepartmentId;
    destination: DepartmentId;
    subject: string;
    content: string;
    priority: HospitalMessage['priority'];
    framingTechnique: 'CHARACTER_COUNT' | 'BYTE_STUFFING' | 'BIT_STUFFING';
    crcAlgorithm: 'CRC-8' | 'CRC-16' | 'CRC-32';
    simulateBitError: boolean;
  }) => void;
}

export const DepartmentCommunication: React.FC<DepartmentCommunicationProps> = ({
  messages,
  onSendMessage,
}) => {
  const [source, setSource] = useState<DepartmentId>('ER');
  const [destination, setDestination] = useState<DepartmentId>('LAB');
  const [subject, setSubject] = useState('STAT Blood Crossmatch & Cardiac Troponin');
  const [content, setContent] = useState('Trauma Bay 2: 45yo male acute STEMI. Immediate type and crossmatch 4 units O-negative PRBC requested.');
  const [priority, setPriority] = useState<HospitalMessage['priority']>('CRITICAL');
  const [framingTechnique, setFramingTechnique] = useState<'CHARACTER_COUNT' | 'BYTE_STUFFING' | 'BIT_STUFFING'>('BIT_STUFFING');
  const [crcAlgorithm, setCrcAlgorithm] = useState<'CRC-8' | 'CRC-16' | 'CRC-32'>('CRC-16');
  const [simulateBitError, setSimulateBitError] = useState(false);
  const [viewFolder, setViewFolder] = useState<'ALL' | 'INBOX' | 'SENT'>('ALL');
  const [selectedMessage, setSelectedMessage] = useState<HospitalMessage | null>(messages[0] || null);

  const sampleTemplates = [
    {
      title: 'STAT Blood Test (ER -> LAB)',
      src: 'ER' as DepartmentId,
      dst: 'LAB' as DepartmentId,
      prio: 'CRITICAL' as const,
      subj: 'STAT Blood Crossmatch & Cardiac Troponin',
      body: 'Trauma Bay 2: 45yo male acute STEMI. Immediate type and crossmatch 4 units O-negative PRBC requested.',
    },
    {
      title: 'Emergency Pharmacy Requisition (ER -> PHARM)',
      src: 'ER' as DepartmentId,
      dst: 'PHARM' as DepartmentId,
      prio: 'CRITICAL' as const,
      subj: 'STAT Tissue Plasminogen Activator (tPA) Request',
      body: 'Emergency Department requests immediate pharmacy availability confirmation and dispensing of IV Alteplase 0.9mg/kg.',
    },
    {
      title: 'Diagnostic Diagnostic Info (ICU -> LAB)',
      src: 'ICU' as DepartmentId,
      dst: 'LAB' as DepartmentId,
      prio: 'HIGH' as const,
      subj: 'Diagnostic Microbiology & Blood Culture Sensitivities',
      body: 'ICU requests patient diagnostic microbiology report for Bed 04: Blood culture gram-negative rod sensitivities.',
    },
    {
      title: 'Bed Allocation (ER -> ADMIN)',
      src: 'ER' as DepartmentId,
      dst: 'ADMIN' as DepartmentId,
      prio: 'HIGH' as const,
      subj: 'Mass Casualty Inbound - Critical Bed Reservation',
      body: 'Emergency Department requests 4 immediate critical care bed reservations and surge protocol activation.',
    },
  ];

  const handleApplyTemplate = (tmpl: typeof sampleTemplates[0]) => {
    setSource(tmpl.src);
    setDestination(tmpl.dst);
    setPriority(tmpl.prio);
    setSubject(tmpl.subj);
    setContent(tmpl.body);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onSendMessage({
      source,
      destination,
      subject,
      content,
      priority,
      framingTechnique,
      crcAlgorithm,
      simulateBitError,
    });
  };

  const filteredMessages = messages.filter((m) => {
    if (viewFolder === 'INBOX') return m.destination === source;
    if (viewFolder === 'SENT') return m.source === source;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold tracking-wide uppercase">
            <FileText className="w-3.5 h-3.5" />
            <span>Hospital Telemetry Protocol Messenger</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-1 tracking-tight">
            Interdepartmental Emergency Communication
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Every message passes through genuine computer networking pipeline stages: Dijkstra path discovery, Data Link Layer framing, CRC checksum calculation, channel transmission, and receiver acknowledgement.
          </p>
        </div>
      </div>

      {/* Main 2-Column Layout: Message Composer & Message Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Composer (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Quick Academic Clinical Templates */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
              Academic Demonstration Presets:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sampleTemplates.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyTemplate(t)}
                  className="p-2 text-left text-xs rounded border border-slate-800 bg-slate-950/70 hover:bg-slate-800/60 hover:border-cyan-500/40 transition-colors"
                >
                  <div className="font-semibold text-cyan-300 text-[11px] truncate">{t.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{t.src} &rarr; {t.dst} ({t.prio})</div>
                </button>
              ))}
            </div>
          </div>

          {/* Form Composer */}
          <form onSubmit={handleSubmit} className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-4">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Emergency Message Composer
            </h3>

            {/* Source & Destination */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-medium">Source Department</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as DepartmentId)}
                  className="w-full bg-slate-950 text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono focus:border-cyan-500 focus:outline-none"
                >
                  <option value="ER">ER (192.168.10.1)</option>
                  <option value="ICU">ICU (192.168.10.2)</option>
                  <option value="LAB">LAB (192.168.10.3)</option>
                  <option value="PHARM">PHARM (192.168.10.4)</option>
                  <option value="ADMIN">ADMIN (192.168.10.5)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-medium">Destination Department</label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value as DepartmentId)}
                  className="w-full bg-slate-950 text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono focus:border-cyan-500 focus:outline-none"
                >
                  <option value="ER">ER (192.168.10.1)</option>
                  <option value="ICU">ICU (192.168.10.2)</option>
                  <option value="LAB">LAB (192.168.10.3)</option>
                  <option value="PHARM">PHARM (192.168.10.4)</option>
                  <option value="ADMIN">ADMIN (192.168.10.5)</option>
                </select>
              </div>
            </div>

            {/* Priority & Subject */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-medium">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as HospitalMessage['priority'])}
                  className="w-full bg-slate-950 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:border-cyan-500 focus:outline-none"
                >
                  <option value="CRITICAL">CRITICAL (STAT)</option>
                  <option value="HIGH">HIGH</option>
                  <option value="NORMAL">NORMAL</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1 font-medium">Message Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g. STAT Blood Crossmatch"
                />
              </div>
            </div>

            {/* Message Body Content */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1 font-medium">Clinical Message Payload</label>
              <textarea
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 border border-slate-700 rounded-lg p-3 text-xs focus:border-cyan-500 focus:outline-none leading-relaxed"
                placeholder="Enter clinical order text..."
              />
            </div>

            {/* Protocol Engine Configuration Strip */}
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/80 space-y-2.5 text-xs">
              <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Protocol Pipeline Configuration</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Framing Method</span>
                  <select
                    value={framingTechnique}
                    onChange={(e) => setFramingTechnique(e.target.value as any)}
                    className="w-full bg-slate-900 text-slate-200 border border-slate-700 rounded px-2 py-1 text-[11px] font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="BIT_STUFFING">HDLC Bit Stuffing</option>
                    <option value="BYTE_STUFFING">Byte Stuffing (FLAG/ESC)</option>
                    <option value="CHARACTER_COUNT">Character Count</option>
                  </select>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">CRC Checksum</span>
                  <select
                    value={crcAlgorithm}
                    onChange={(e) => setCrcAlgorithm(e.target.value as any)}
                    className="w-full bg-slate-900 text-slate-200 border border-slate-700 rounded px-2 py-1 text-[11px] font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="CRC-16">CRC-16-CCITT (0x1021)</option>
                    <option value="CRC-32">CRC-32 Ethernet (0x04C11DB7)</option>
                    <option value="CRC-8">CRC-8 ATM (0x07)</option>
                  </select>
                </div>
              </div>

              {/* Channel Corruption Injection Toggle */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simulateBitError}
                    onChange={(e) => setSimulateBitError(e.target.checked)}
                    className="accent-rose-500 rounded"
                  />
                  <span className="text-[11px] text-slate-300">
                    Inject Channel Bit Error (Test Frame Corruption & GBN Retry)
                  </span>
                </label>
                {simulateBitError && (
                  <span className="text-[10px] text-rose-400 font-mono">Will trigger CRC failure</span>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Transmit via Protocol Pipeline</span>
            </button>
          </form>
        </div>

        {/* Right Column: Message History & Detailed Receipt (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Folder Filter Tabs */}
          <div className="flex items-center justify-between p-1 bg-slate-900/60 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewFolder('ALL')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewFolder === 'ALL' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Messages ({messages.length})
              </button>
              <button
                onClick={() => setViewFolder('INBOX')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewFolder === 'INBOX' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Inbox ({messages.filter((m) => m.destination === source).length})
              </button>
              <button
                onClick={() => setViewFolder('SENT')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewFolder === 'SENT' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sent ({messages.filter((m) => m.source === source).length})
              </button>
            </div>
            <span className="text-[10px] text-slate-500 font-mono pr-2">Active: {source}</span>
          </div>

          {/* Messages List */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 divide-y divide-slate-800/80 max-h-[300px] overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No messages found in this folder.
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                const isDelivered = msg.status === 'DELIVERED';
                return (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    className={`p-3 text-xs cursor-pointer transition-colors ${
                      isSelected ? 'bg-slate-800/70 border-l-2 border-l-cyan-400' : 'hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          msg.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' : 'bg-cyan-500/20 text-cyan-300'
                        }`}>
                          {msg.priority}
                        </span>
                        <span className="font-semibold text-slate-200 truncate">{msg.subject}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 shrink-0">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400 font-mono">
                      <span>{msg.source} &rarr; {msg.destination} ({msg.framesCount} frames)</span>
                      <span className={isDelivered ? 'text-emerald-400' : 'text-rose-400'}>
                        {msg.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Transmission Receipt & Inspection Box */}
          {selectedMessage && (
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Protocol Transmission Receipt: {selectedMessage.id}</span>
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  selectedMessage.status === 'DELIVERED' ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                }`}>
                  {selectedMessage.status}
                </span>
              </div>

              <div className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded border border-slate-800 leading-relaxed font-mono">
                "{selectedMessage.content}"
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">DIJKSTRA ROUTE</span>
                  <span className="text-cyan-300">{selectedMessage.route.join(' → ') || 'Unreachable'}</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">ROUTE COST / LATENCY</span>
                  <span className="text-slate-200">Cost: {selectedMessage.totalCost} · {selectedMessage.latencyMs} ms</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">FRAMES & INTEGRITY</span>
                  <span className="text-slate-200">{selectedMessage.framesCount} frames · {selectedMessage.crcAlgorithm}</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">CRC SYNDROME STATUS</span>
                  <span className={selectedMessage.crcValid ? 'text-emerald-400' : 'text-rose-400'}>
                    {selectedMessage.crcValid ? 'ZERO SYNDROME (PASSED)' : 'CORRUPTED (RETRY TRIGGERED)'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
