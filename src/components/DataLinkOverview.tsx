import React from 'react';
import { Layers, Binary, ShieldAlert, Sliders, RotateCcw, ArrowRight } from 'lucide-react';

interface DataLinkOverviewProps {
  onNavigate: (module: string) => void;
}

export const DataLinkOverview: React.FC<DataLinkOverviewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur">
        <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold tracking-wide uppercase">
          <Layers className="w-3.5 h-3.5" />
          <span>OSI Layer 2 Computer Networks Fundamentals</span>
        </div>
        <h1 className="text-xl font-bold text-slate-100 mt-1 tracking-tight">
          Data Link Layer Architecture in MediNet
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
          The Data Link Layer transforms an unreliable physical transmission medium into an error-free, sequenced communication channel between adjacent hospital network nodes. It accomplishes this through framing, error detection, flow control, and ARQ retransmission.
        </p>
      </div>

      {/* 4 Interactive Pillars of Layer 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Binary className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">1. Framing Laboratory</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Breaks raw bit streams into discrete frames using Character Count, Byte Stuffing (FLAG/ESC), and HDLC Bit Stuffing (5-ones rule).
            </p>
          </div>
          <button
            onClick={() => onNavigate('framing')}
            className="w-full py-1.5 px-3 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center justify-between"
          >
            <span>Open Framing Lab</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">2. CRC Error Detection</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculates cyclic polynomial modulo-2 division remainder (CRC-8, CRC-16, CRC-32) and validates frame integrity with single-bit corruption injection.
            </p>
          </div>
          <button
            onClick={() => onNavigate('crc')}
            className="w-full py-1.5 px-3 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center justify-between"
          >
            <span>Open CRC Lab</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sliders className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">3. Flow Control</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Implements Sliding Window protocol to prevent fast sender hospital nodes from overwhelming slower clinical receiver buffers.
            </p>
          </div>
          <button
            onClick={() => onNavigate('flow-control')}
            className="w-full py-1.5 px-3 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center justify-between"
          >
            <span>Open Flow Control</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <RotateCcw className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">4. Go-Back-N ARQ</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sliding window error control protocol with sequence numbers, timeouts, cumulative acknowledgements, out-of-order rejection, and window retransmissions.
            </p>
          </div>
          <button
            onClick={() => onNavigate('gobackn')}
            className="w-full py-1.5 px-3 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center justify-between"
          >
            <span>Open Go-Back-N Lab</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Protocol Pipeline Diagram */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 tracking-tight">
          MediNet Transmission Pipeline Architecture
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-cyan-400 font-bold mb-1">STAGE 1</div>
            <div className="text-slate-200 font-semibold">Clinical Order</div>
            <p className="text-[11px] text-slate-400 mt-1 font-sans">
              HL7/DICOM medical requisition generated at ER/ICU.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-cyan-400 font-bold mb-1">STAGE 2</div>
            <div className="text-slate-200 font-semibold">Dijkstra Routing</div>
            <p className="text-[11px] text-slate-400 mt-1 font-sans">
              Calculates lowest cost path across campus topology.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-cyan-400 font-bold mb-1">STAGE 3</div>
            <div className="text-slate-200 font-semibold">Framing Engine</div>
            <p className="text-[11px] text-slate-400 mt-1 font-sans">
              Encapsulates payload into frames with bit/byte stuffing.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-cyan-400 font-bold mb-1">STAGE 4</div>
            <div className="text-slate-200 font-semibold">CRC Calculation</div>
            <p className="text-[11px] text-slate-400 mt-1 font-sans">
              Computes polynomial checksum and appends remainder.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-cyan-400 font-bold mb-1">STAGE 5</div>
            <div className="text-slate-200 font-semibold">GBN & Delivery</div>
            <p className="text-[11px] text-slate-400 mt-1 font-sans">
              Window flow control, cumulative ACK, and timeout recovery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
