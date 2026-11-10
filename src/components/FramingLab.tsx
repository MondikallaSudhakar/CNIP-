import React, { useState } from 'react';
import { Binary, Play, ArrowRight, CheckCircle2, AlertTriangle, Layers, Info } from 'lucide-react';
import { frameCharacterCount, frameByteStuffing, frameBitStuffing } from '../networking/framing';
import { FramingResult } from '../types/network';

export const FramingLab: React.FC = () => {
  const [inputText, setInputText] = useState('STAT_BLOOD_MATCH');
  const [technique, setTechnique] = useState<'BIT_STUFFING' | 'BYTE_STUFFING' | 'CHARACTER_COUNT'>('BIT_STUFFING');
  const [chunkSize, setChunkSize] = useState<number>(4);
  const [flagChar, setFlagChar] = useState<string>('F');
  const [escChar, setEscChar] = useState<string>('E');

  // Compute framing result on the fly
  let result: FramingResult;
  if (technique === 'CHARACTER_COUNT') {
    result = frameCharacterCount(inputText, chunkSize);
  } else if (technique === 'BYTE_STUFFING') {
    result = frameByteStuffing(inputText, flagChar, escChar, chunkSize);
  } else {
    result = frameBitStuffing(inputText, chunkSize);
  }

  const sampleInputs = [
    { label: 'Standard Clinical Code', text: 'STAT_BLOOD_MATCH' },
    { label: 'Byte Stuffing Trigger (Contains F & E)', text: 'DEFIB_F_E_ALERT' },
    { label: 'Bit Stuffing Trigger (Binary Consecutive 1s)', text: 'MEDIC_911' },
    { label: 'ICU Telemetry Data', text: 'SPO2_99_HR_82' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold tracking-wide uppercase">
            <Binary className="w-3.5 h-3.5" />
            <span>Data Link Layer Protocol Laboratory</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-1 tracking-tight">
            Framing Laboratory (Framing & Delimitation)
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Examine how raw byte and bit streams are segmented into manageable, synchronizable transmission frames using Character Count, Byte Stuffing, and Bit Stuffing.
          </p>
        </div>
      </div>

      {/* Preset Quick Buttons & Configuration Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-300">
            Sample Clinical Payloads:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {sampleInputs.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => setInputText(sample.text)}
                className="px-2.5 py-1 text-xs rounded border border-slate-700 bg-slate-950 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors font-mono"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-slate-800/80">
          <div className="md:col-span-5">
            <label className="block text-[11px] text-slate-400 mb-1 font-medium">Input Clinical Message Payload</label>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full bg-slate-950 text-slate-100 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono focus:border-cyan-500 focus:outline-none"
              placeholder="Type message text..."
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-[11px] text-slate-400 mb-1 font-medium">Framing Technique</label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setTechnique('BIT_STUFFING')}
                className={`py-1 rounded font-medium transition-colors ${
                  technique === 'BIT_STUFFING' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Bit Stuffing
              </button>
              <button
                type="button"
                onClick={() => setTechnique('BYTE_STUFFING')}
                className={`py-1 rounded font-medium transition-colors ${
                  technique === 'BYTE_STUFFING' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Byte Stuffing
              </button>
              <button
                type="button"
                onClick={() => setTechnique('CHARACTER_COUNT')}
                className={`py-1 rounded font-medium transition-colors ${
                  technique === 'CHARACTER_COUNT' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Char Count
              </button>
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="block text-[11px] text-slate-400 mb-1 font-medium">Chunk Size (Chars/Frame)</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="2"
                max="8"
                value={chunkSize}
                onChange={(e) => setChunkSize(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400"
              />
              <span className="font-mono text-cyan-400 font-bold text-xs">{chunkSize}</span>
            </div>
          </div>
        </div>

        {technique === 'BYTE_STUFFING' && (
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-1.5">
              <span>Delimiter [FLAG]:</span>
              <input
                type="text"
                maxLength={1}
                value={flagChar}
                onChange={(e) => setFlagChar(e.target.value.toUpperCase() || 'F')}
                className="w-8 text-center bg-slate-950 border border-slate-700 rounded py-0.5 text-cyan-300 font-bold"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span>Escape [ESC]:</span>
              <input
                type="text"
                maxLength={1}
                value={escChar}
                onChange={(e) => setEscChar(e.target.value.toUpperCase() || 'E')}
                className="w-8 text-center bg-slate-950 border border-slate-700 rounded py-0.5 text-cyan-300 font-bold"
              />
            </div>
          </div>
        )}
      </div>

      {/* Results Overview Strip */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-200">
              Framing Extraction Status:
            </span>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
              result.extractionValid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400'
            }`}>
              {result.extractionValid ? 'VERIFIED · PERFECT EXTRACTION' : 'EXTRACTION ERROR'}
            </span>
          </div>

          <div className="text-xs font-mono text-slate-400">
            <span>Generated: <strong className="text-slate-200">{result.frames.length} frames</strong></span>
          </div>
        </div>

        {/* Binary representation of original payload */}
        <div className="text-xs font-mono">
          <span className="text-slate-500 block text-[10px] mb-1">ORIGINAL PAYLOAD (ASCII &rarr; 8-BIT BINARY)</span>
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto whitespace-pre leading-relaxed tracking-wider">
            {result.originalBinary.match(/.{1,8}/g)?.join(' ') || result.originalBinary}
          </div>
        </div>

        {/* Extracted message verification */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono pt-1">
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">ORIGINAL TRANSMITTED PAYLOAD</span>
            <span className="text-slate-200 font-bold">{result.originalText}</span>
          </div>
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">RECEIVER DE-STUFFED / EXTRACTED TEXT</span>
            <span className="text-emerald-400 font-bold">{result.extractedText}</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed font-sans bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
          <strong className="text-slate-300">Algorithm Theory: </strong>
          {result.notes}
        </p>
      </div>

      {/* Detailed Per-Frame Inspection Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Individual Frame Generation & Encoded Enclosure
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {result.frames.map((frame) => (
            <div
              key={frame.frameNumber}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2.5 text-xs font-mono"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-cyan-400">
                  Frame #{frame.frameNumber}
                </span>
                <span className="text-[11px] text-slate-400">
                  Size: {frame.frameSize} {technique === 'BIT_STUFFING' ? 'bits' : 'bytes'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block">PAYLOAD CHUNK</span>
                <span className="text-slate-200 font-bold">"{frame.rawPayload}"</span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block">ENCODED / STUFFED FRAME</span>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-cyan-300 break-all">
                  {frame.encodedFrame}
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block">BINARY SEQUENCE ON WIRE</span>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 break-all text-[11px]">
                  {frame.encodedBinary}
                </div>
              </div>

              {frame.stuffedFlagsCount !== undefined && frame.stuffedFlagsCount > 0 && (
                <div className="text-[10px] text-amber-400 font-sans flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Stuffed {frame.stuffedFlagsCount} escape/zero bit(s) to prevent false flag delimiter detection.</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
