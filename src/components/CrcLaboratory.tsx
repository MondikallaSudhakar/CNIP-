import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, RefreshCw, Play, CheckCircle2, XCircle, Info } from 'lucide-react';
import { computeCrc, CRC_POLYNOMIALS } from '../networking/crc';
import { CrcResult } from '../types/network';

export const CrcLaboratory: React.FC = () => {
  const [message, setMessage] = useState('ER_STAT');
  const [algorithm, setAlgorithm] = useState<'CRC-8' | 'CRC-16' | 'CRC-32'>('CRC-8');
  const [corruptBitIndex, setCorruptBitIndex] = useState<number | null>(null);
  const [showDivisionSteps, setShowDivisionSteps] = useState(true);

  const crcResult: CrcResult = computeCrc(message, algorithm, corruptBitIndex);

  const handleIntroduceError = () => {
    // Pick a random bit index in the transmitted frame to corrupt
    const maxIdx = crcResult.transmittedFrame.length - 1;
    const randomIdx = Math.floor(Math.random() * maxIdx);
    setCorruptBitIndex(randomIdx);
  };

  const handleClearError = () => {
    setCorruptBitIndex(null);
  };

  const handleToggleBit = (index: number) => {
    if (corruptBitIndex === index) {
      setCorruptBitIndex(null);
    } else {
      setCorruptBitIndex(index);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold tracking-wide uppercase">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Cyclic Redundancy Check (CRC) Laboratory</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-1 tracking-tight">
            Modulo-2 Polynomial Division & Error Detection
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Performs exact binary modulo-2 polynomial long division. Appends the computed CRC remainder to the frame, simulates channel transmission noise, and verifies syndrome integrity at the receiver.
          </p>
        </div>
      </div>

      {/* Configuration & Input Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-5">
            <label className="block text-[11px] text-slate-400 mb-1 font-medium">Input Clinical Payload</label>
            <input
              type="text"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setCorruptBitIndex(null);
              }}
              className="w-full bg-slate-950 text-slate-100 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono focus:border-cyan-500 focus:outline-none"
              placeholder="e.g. ER_STAT"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-[11px] text-slate-400 mb-1 font-medium">CRC Polynomial Standard</label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-[11px]">
              {(['CRC-8', 'CRC-16', 'CRC-32'] as const).map((algo) => (
                <button
                  key={algo}
                  type="button"
                  onClick={() => {
                    setAlgorithm(algo);
                    setCorruptBitIndex(null);
                  }}
                  className={`py-1 rounded font-medium font-mono transition-colors ${
                    algorithm === algo
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {algo}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-3 flex items-end gap-2 pt-4 md:pt-0">
            <button
              onClick={handleIntroduceError}
              className="flex-1 py-2 px-3 text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Introduce Transmission Error</span>
            </button>
            {corruptBitIndex !== null && (
              <button
                onClick={handleClearError}
                className="py-2 px-3 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                title="Clear injected corruption"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Selected Polynomial Metadata Strip */}
        <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <span><strong>Generator Polynomial:</strong> {crcResult.polynomialName}</span>
          <span><strong>Hex:</strong> {crcResult.polynomialHex}</span>
          <span><strong>Binary Divisor G(x):</strong> <span className="text-cyan-400">{crcResult.polynomialBinary}</span></span>
        </div>
      </div>

      {/* Receiver Verification Box (PASS / ERROR) */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        crcResult.isValid
          ? 'border-emerald-500/30 bg-emerald-950/20'
          : 'border-rose-500/40 bg-rose-950/20'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            crcResult.isValid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
          }`}>
            {crcResult.isValid ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
          </div>
          <div>
            <div className={`text-base font-bold tracking-wide uppercase font-mono ${
              crcResult.isValid ? 'text-emerald-300' : 'text-rose-300'
            }`}>
              {crcResult.isValid ? 'PASS: CRC VERIFICATION SUCCESSFUL' : 'ERROR: CRC CHECKSUM MISMATCH (FRAME CORRUPTED)'}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {crcResult.isValid
                ? 'Modulo-2 division of received frame by G(x) yielded syndrome 0. Frame delivered cleanly to upper layer.'
                : `Corrupted bit detected at position ${crcResult.corruptedBitIndex} during transmission. Receiver discarded frame and requested Go-Back-N retransmission.`}
            </p>
          </div>
        </div>

        <div className="text-right font-mono text-xs shrink-0">
          <div className="text-slate-500 text-[10px]">RECEIVER SYNDROME REMAINDER</div>
          <div className={`text-sm font-bold ${crcResult.isValid ? 'text-emerald-400' : 'text-rose-400'}`}>
            {crcResult.syndromeBinary}
          </div>
        </div>
      </div>

      {/* Transmission Frames & Interactive Bit Flipper */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Transmitted Frame & Channel Bit Inspection
          </h3>
          <span className="text-[11px] text-slate-500">
            Click any bit below to manually invert (0 &harr; 1)
          </span>
        </div>

        {/* Sender Frame (M(x) + R(x)) */}
        <div className="space-y-1.5 font-mono text-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>SENDER TRANSMITTED FRAME T(x) [Data Bits + CRC Remainder]</span>
            <span className="text-cyan-400 font-semibold">Checksum: {crcResult.crcChecksumHex}</span>
          </div>
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto whitespace-pre leading-relaxed tracking-wider">
            <span className="text-slate-300">{crcResult.binaryData}</span>
            <span className="text-cyan-400 font-bold bg-cyan-950/60 px-1 rounded ml-1">
              {crcResult.crcChecksumBinary}
            </span>
          </div>
        </div>

        {/* Receiver Frame (Interactive Bit Inspection) */}
        <div className="space-y-1.5 font-mono text-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>RECEIVER INCOMING FRAME (Click any bit to flip)</span>
            {corruptBitIndex !== null && (
              <span className="text-rose-400 font-bold">Bit #{corruptBitIndex} Flipped!</span>
            )}
          </div>
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 overflow-x-auto flex flex-wrap gap-1 leading-none">
            {crcResult.receivedFrame.split('').map((bit, idx) => {
              const isCorruptedBit = corruptBitIndex === idx;
              const isChecksumBit = idx >= crcResult.binaryData.length;

              return (
                <button
                  key={idx}
                  onClick={() => handleToggleBit(idx)}
                  className={`w-5 h-6 text-xs font-mono font-bold rounded flex items-center justify-center transition-colors ${
                    isCorruptedBit
                      ? 'bg-rose-500 text-white animate-pulse'
                      : isChecksumBit
                      ? 'bg-cyan-950 text-cyan-300 hover:bg-cyan-800'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                  title={`Bit ${idx} (Click to invert)`}
                >
                  {bit}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-1">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-slate-900 border border-slate-700"></span> Payload Bits</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-cyan-950 border border-cyan-800"></span> CRC Checksum Bits</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-rose-500"></span> Inverted Channel Noise Bit</span>
          </div>
        </div>
      </div>

      {/* Visual Modulo-2 Polynomial Long Division Step-by-Step */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Modulo-2 Binary Polynomial Long Division Trace
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">
              ({crcResult.divisionSteps.length} XOR division iterations recorded)
            </span>
          </div>
          <button
            onClick={() => setShowDivisionSteps(!showDivisionSteps)}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
          >
            {showDivisionSteps ? 'Collapse Trace' : 'Expand Trace'}
          </button>
        </div>

        {showDivisionSteps && (
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 max-h-72 overflow-y-auto font-mono text-[11px] space-y-2">
            {crcResult.divisionSteps.map((step) => (
              <div key={step.stepIndex} className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
                <div className="flex items-center justify-between text-slate-400 text-[10px] pb-1 border-b border-slate-800/60">
                  <span>Iteration {step.stepIndex}</span>
                  <span>Quotient Bit: <strong className="text-cyan-400">{step.quotientBit}</strong></span>
                </div>
                <div className="pt-1.5 space-y-0.5">
                  <div className="text-slate-300">Dividend: <span className="text-slate-100">{step.dividendSnapshot}</span></div>
                  <div className="text-slate-400">XOR Divisor: <span className={step.quotientBit === '1' ? 'text-cyan-300' : 'text-slate-600'}>{step.divisorSnapshot}</span></div>
                  <div className="text-emerald-400 font-bold">XOR Remainder: {step.xorResult}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
