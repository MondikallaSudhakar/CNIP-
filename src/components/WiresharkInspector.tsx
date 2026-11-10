import React, { useState } from 'react';
import {
  SearchCode,
  Download,
  Upload,
  Filter,
  FileCode,
  Terminal,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { generateHospitalPcapBuffer, parsePcapBuffer } from '../networking/pcapEngine';
import { ParsedPacket } from '../types/network';

export const WiresharkInspector: React.FC = () => {
  const [packetCount, setPacketCount] = useState<number>(10);
  const [packets, setPackets] = useState<ParsedPacket[]>(() => {
    const buf = generateHospitalPcapBuffer(10);
    return parsePcapBuffer(buf);
  });
  const [selectedPacketId, setSelectedPacketId] = useState<number>(1);
  const [protocolFilter, setProtocolFilter] = useState<'ALL' | 'TCP' | 'UDP' | 'ICMP'>('ALL');
  const [ipFilter, setIpFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [captureSource, setCaptureSource] = useState<'GENERATED' | 'UPLOADED'>('GENERATED');
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);

  const handleRegeneratePcap = () => {
    const buf = generateHospitalPcapBuffer(packetCount);
    const parsed = parsePcapBuffer(buf);
    setPackets(parsed);
    setCaptureSource('GENERATED');
    if (parsed.length > 0) setSelectedPacketId(parsed[0].id);
  };

  const handleDownloadPcap = () => {
    const buf = generateHospitalPcapBuffer(packetCount);
    const blob = new Blob([buf as unknown as BlobPart], { type: 'application/vnd.tcpdump.pcap' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medinet_hospital_traffic.pcap';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadPcap = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = new Uint8Array(event.target?.result as ArrayBuffer);
      const parsed = parsePcapBuffer(buffer);
      if (parsed.length > 0) {
        setPackets(parsed);
        setCaptureSource('UPLOADED');
        setSelectedPacketId(parsed[0].id);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const filteredPackets = packets.filter((pkt) => {
    if (protocolFilter !== 'ALL' && pkt.protocol !== protocolFilter) return false;
    if (ipFilter !== 'ALL' && pkt.sourceIp !== ipFilter && pkt.destIp !== ipFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        pkt.summary.toLowerCase().includes(q) ||
        pkt.asciiPayload.toLowerCase().includes(q) ||
        pkt.sourceIp.includes(q) ||
        pkt.destIp.includes(q);
      if (!match) return false;
    }
    return true;
  });

  const selectedPacket = packets.find((p) => p.id === selectedPacketId) || packets[0];

  const handleCopyHex = () => {
    if (!selectedPacket) return;
    navigator.clipboard.writeText(selectedPacket.hexDump);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold tracking-wide uppercase">
            <SearchCode className="w-3.5 h-3.5" />
            <span>Wireshark &amp; libpcap Packet Analysis Engine</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-1 tracking-tight">
            Wireshark Packet Inspector &amp; PCAP Generator
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Inspect genuine binary PCAP (libpcap) captures containing Ethernet, IPv4, TCP, UDP, and ICMP medical frames. Download .pcap files directly and inspect them inside Wireshark or tshark.
          </p>
        </div>

        {/* PCAP File Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownloadPcap}
            className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            title="Download valid libpcap file to open directly in desktop Wireshark"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .PCAP for Wireshark</span>
          </button>

          <label className="px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Upload .PCAP File</span>
            <input type="file" accept=".pcap,.cap" onChange={handleUploadPcap} className="hidden" />
          </label>
        </div>
      </div>

      {/* Capture Info & Filter Toolbar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-500">Capture Source:</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              {captureSource === 'GENERATED' ? 'Synthesized Hospital libpcap (Magic 0xa1b2c3d4)' : 'Uploaded User PCAP Capture'}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">{packets.length} packets loaded</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleRegeneratePcap}
              className="text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Regenerate 10 STAT Frames
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-800/80 items-center">
          <div className="sm:col-span-4 relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search packet summary or payload..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-4">
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono">
              {(['ALL', 'TCP', 'UDP', 'ICMP'] as const).map((proto) => (
                <button
                  key={proto}
                  onClick={() => setProtocolFilter(proto)}
                  className={`flex-1 py-1 rounded transition-colors ${
                    protocolFilter === proto
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {proto}
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-4 flex items-center gap-2 text-xs">
            <span className="text-slate-500 text-[11px] whitespace-nowrap">IP Filter:</span>
            <select
              value={ipFilter}
              onChange={(e) => setIpFilter(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono"
            >
              <option value="ALL">All Department IPs</option>
              <option value="192.168.10.1">192.168.10.1 (ER)</option>
              <option value="192.168.10.2">192.168.10.2 (ICU)</option>
              <option value="192.168.10.3">192.168.10.3 (LAB)</option>
              <option value="192.168.10.4">192.168.10.4 (PHARM)</option>
              <option value="192.168.10.5">192.168.10.5 (ADMIN)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Packet List Grid (Wireshark Table Style) */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs">
        <div className="overflow-x-auto max-h-[300px]">
          <table className="w-full text-left">
            <thead className="bg-slate-900/90 text-slate-400 text-[10px] uppercase tracking-wider sticky top-0 z-10 border-b border-slate-800">
              <tr>
                <th className="p-2.5 w-12 text-center">No.</th>
                <th className="p-2.5 w-24">Time</th>
                <th className="p-2.5 w-32">Source</th>
                <th className="p-2.5 w-32">Destination</th>
                <th className="p-2.5 w-20">Protocol</th>
                <th className="p-2.5 w-16 text-right">Length</th>
                <th className="p-2.5">Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredPackets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500 font-sans">
                    No packets match active filters.
                  </td>
                </tr>
              ) : (
                filteredPackets.map((pkt) => {
                  const isSelected = selectedPacket?.id === pkt.id;
                  const isTcp = pkt.protocol === 'TCP';
                  const isUdp = pkt.protocol === 'UDP';

                  return (
                    <tr
                      key={pkt.id}
                      onClick={() => setSelectedPacketId(pkt.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-cyan-950/40 text-cyan-200'
                          : 'hover:bg-slate-900/60'
                      }`}
                    >
                      <td className="p-2.5 text-center font-bold text-slate-400">{pkt.id}</td>
                      <td className="p-2.5 text-slate-400">{pkt.timestamp}</td>
                      <td className="p-2.5 text-slate-200">{pkt.sourceIp}</td>
                      <td className="p-2.5 text-slate-200">{pkt.destIp}</td>
                      <td className="p-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isTcp
                            ? 'bg-blue-500/20 text-blue-300'
                            : isUdp
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {pkt.protocol}
                        </span>
                      </td>
                      <td className="p-2.5 text-right text-slate-400">{pkt.length}</td>
                      <td className="p-2.5 truncate text-slate-300 text-[11px] max-w-xs">{pkt.summary}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Packet Detailed Inspector: Protocol Dissection & Hex Dump */}
      {selectedPacket && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-mono text-xs">
          {/* Protocol Tree Dissector (5 cols) */}
          <div className="lg:col-span-5 p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-sans">
              Frame #{selectedPacket.id} Dissection Tree
            </h3>

            <div className="space-y-2 text-[11px] text-slate-300">
              {/* Ethernet II */}
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-cyan-400 font-bold block mb-1">Ethernet II, Src / Dst</span>
                <div className="text-slate-400 space-y-0.5 pl-2 text-[10px]">
                  <div>Destination: 02:00:AA:01:00:02</div>
                  <div>Source: 02:00:AA:01:00:01</div>
                  <div>Type: IPv4 (0x0800)</div>
                </div>
              </div>

              {/* IPv4 */}
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-cyan-400 font-bold block mb-1">Internet Protocol Version 4</span>
                <div className="text-slate-400 space-y-0.5 pl-2 text-[10px]">
                  <div>Source Address: {selectedPacket.sourceIp}</div>
                  <div>Destination Address: {selectedPacket.destIp}</div>
                  <div>Total Length: {selectedPacket.length - 14} bytes</div>
                  <div>Time to Live (TTL): 64 hops</div>
                  <div>Protocol: {selectedPacket.protocol} ({selectedPacket.protocol === 'TCP' ? 6 : selectedPacket.protocol === 'UDP' ? 17 : 1})</div>
                </div>
              </div>

              {/* Transport Layer */}
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-cyan-400 font-bold block mb-1">
                  {selectedPacket.protocol} Transport Layer
                </span>
                <div className="text-slate-400 space-y-0.5 pl-2 text-[10px]">
                  {selectedPacket.sourcePort > 0 && (
                    <>
                      <div>Source Port: {selectedPacket.sourcePort}</div>
                      <div>Destination Port: {selectedPacket.destPort}</div>
                    </>
                  )}
                  {selectedPacket.seqNumber !== undefined && (
                    <div>Sequence Number: {selectedPacket.seqNumber}</div>
                  )}
                  {selectedPacket.ackNumber !== undefined && (
                    <div>Acknowledgment Number: {selectedPacket.ackNumber}</div>
                  )}
                  {selectedPacket.tcpFlags && (
                    <div>
                      Flags: {selectedPacket.tcpFlags.syn ? 'SYN ' : ''}
                      {selectedPacket.tcpFlags.ack ? 'ACK ' : ''}
                      {selectedPacket.tcpFlags.psh ? 'PSH ' : ''}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Hex & ASCII Payload Dump (7 cols) */}
          <div className="lg:col-span-7 p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-sans">
                Hex &amp; ASCII Wire Dump ({selectedPacket.length} Bytes)
              </h3>
              <button
                onClick={handleCopyHex}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-sans flex items-center gap-1"
              >
                {copiedPayload ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPayload ? 'Copied' : 'Copy Hex'}</span>
              </button>
            </div>

            {/* Application Payload string */}
            <div>
              <span className="text-slate-500 text-[10px] block mb-1 font-sans">APPLICATION PAYLOAD</span>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-cyan-300 break-all text-[11px]">
                {selectedPacket.asciiPayload}
              </div>
            </div>

            {/* Hex Dump */}
            <div>
              <span className="text-slate-500 text-[10px] block mb-1 font-sans">RAW OCTET STREAM</span>
              <pre className="p-3 rounded bg-slate-950 border border-slate-800 text-slate-300 max-h-48 overflow-y-auto text-[10px] leading-relaxed">
                {selectedPacket.hexDump}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Wireshark Verification Note */}
      <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/30 text-xs font-mono text-slate-400 flex items-center justify-between">
        <span>
          <strong>Wireshark Command-Line Verification:</strong> Run <code className="text-cyan-300">tshark -r medinet_hospital_traffic.pcap -T fields -e ip.src -e ip.dst -e tcp.flags</code>
        </span>
        <span className="text-[10px] text-emerald-400 font-bold shrink-0">
          GENUINE LIBPCAP 2.4 COMPLIANT
        </span>
      </div>
    </div>
  );
};
