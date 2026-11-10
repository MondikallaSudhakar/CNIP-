import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Play,
  Pause,
  StepForward,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { createInitialGbnState, stepGbnSimulation } from '../networking/gobackn';
import { GbnState } from '../types/network';

export const GoBackNLab: React.FC = () => {
  const [windowSize, setWindowSize] = useState<number>(4);
  const [sequenceModulo, setSequenceModulo] = useState<number>(8);
  const [totalFrames, setTotalFrames] = useState<number>(8);
  const [loseTargetSeq, setLoseTargetSeq] = useState<number | null>(2); // Default lose Frame 2 as requested!
  const [corruptTargetSeq, setCorruptTargetSeq] = useState<number | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);

  const [state, setState] = useState<GbnState>(() =>
    createInitialGbnState(4, 8, 8)
  );

  const handleReset = (w = windowSize, m = sequenceModulo, total = totalFrames) => {
    setIsAutoPlaying(false);
    setState(createInitialGbnState(w, m, total));
  };

  const handleStep = () => {
    setState((prev) =>
      stepGbnSimulation(prev, {
        loseSeqNumber: loseTargetSeq,
        corruptSeqNumber: corruptTargetSeq,
      })
    );
  };

  const handleForceTimeout = () => {
    setState((prev) =>
      stepGbnSimulation(prev, {
        forceTimeout: true,
      })
    );
  };

  // Auto-play loop
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setState((prev) => {
        if (prev.isComplete) {
          setIsAutoPlaying(false);
          return prev;
        }
        return stepGbnSimulation(prev, {
          loseSeqNumber: loseTargetSeq,
          corruptSeqNumber: corruptTargetSeq,
        });
      });
    }, 1200);

    return () => clearInterval(timer);
  }, [isAutoPlaying, loseTargetSeq, corruptTargetSeq]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold tracking-wide uppercase">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reliable Transmission Protocol Engine</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-1 tracking-tight">
            Go-Back-N ARQ (Automatic Repeat reQuest) Laboratory
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Demonstrates cumulative acknowledgements, sliding send windows modulo 2^m, out-of-order frame rejection, sender timeout detection, and full window retransmission.
          </p>
        </div>

        {/* Step / Play / Pause Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleStep}
            disabled={state.isComplete || isAutoPlaying}
            className="px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700"
          >
            <StepForward className="w-3.5 h-3.5" />
            <span>Step Event</span>
          </button>

          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            disabled={state.isComplete}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              isAutoPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
            }`}
          >
            {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAutoPlaying ? 'Pause' : 'Auto Play'}</span>
          </button>

          <button
            onClick={handleForceTimeout}
            disabled={state.isComplete || state.nextSeqNum <= state.base}
            className="px-3 py-1.5 text-xs font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 disabled:opacity-40 rounded-lg transition-colors flex items-center gap-1.5"
            title="Force immediate timer expiration to trigger GBN retransmission"
          >
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            <span>Force Timeout</span>
          </button>

          <button
            onClick={() => handleReset()}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors"
            title="Reset Protocol State"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Protocol Parameter Configuration & Experiment Scenario */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Send Window Size (W)</span>
              <span className="font-mono font-bold text-cyan-400">{windowSize} frames</span>
            </div>
            <input
              type="range"
              min="1"
              max={sequenceModulo - 1}
              value={windowSize}
              onChange={(e) => {
                const w = parseInt(e.target.value, 10);
                setWindowSize(w);
                handleReset(w, sequenceModulo, totalFrames);
              }}
              className="w-full accent-cyan-400"
            />
            <span className="text-[10px] text-slate-500 font-mono">Max W &le; 2^m - 1 ({sequenceModulo - 1})</span>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Sequence Space (2^m)</span>
              <span className="font-mono font-bold text-slate-200">Modulo {sequenceModulo}</span>
            </div>
            <select
              value={sequenceModulo}
              onChange={(e) => {
                const m = parseInt(e.target.value, 10);
                setSequenceModulo(m);
                handleReset(windowSize, m, totalFrames);
              }}
              className="w-full bg-slate-950 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono"
            >
              <option value="4">m=2 (Modulo 4: 0..3)</option>
              <option value="8">m=3 (Modulo 8: 0..7) [Recommended]</option>
              <option value="16">m=4 (Modulo 16: 0..15)</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Simulated Frame Loss</span>
              <span className="font-mono font-bold text-rose-400">
                {loseTargetSeq !== null ? `Lose Frame ${loseTargetSeq}` : 'None'}
              </span>
            </div>
            <select
              value={loseTargetSeq === null ? 'none' : loseTargetSeq.toString()}
              onChange={(e) => setLoseTargetSeq(e.target.value === 'none' ? null : parseInt(e.target.value, 10))}
              className="w-full bg-slate-950 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono"
            >
              <option value="none">No Loss (Clean Channel)</option>
              <option value="1">Lose Frame 1</option>
              <option value="2">Lose Frame 2 (Standard Test Scenario)</option>
              <option value="3">Lose Frame 3</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Simulated Frame Corruption</span>
              <span className="font-mono font-bold text-amber-400">
                {corruptTargetSeq !== null ? `Corrupt Frame ${corruptTargetSeq}` : 'None'}
              </span>
            </div>
            <select
              value={corruptTargetSeq === null ? 'none' : corruptTargetSeq.toString()}
              onChange={(e) => setCorruptTargetSeq(e.target.value === 'none' ? null : parseInt(e.target.value, 10))}
              className="w-full bg-slate-950 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono"
            >
              <option value="none">No Noise (Clean CRC)</option>
              <option value="1">Corrupt Frame 1 (CRC Failure)</option>
              <option value="2">Corrupt Frame 2 (CRC Failure)</option>
              <option value="3">Corrupt Frame 3 (CRC Failure)</option>
            </select>
          </div>
        </div>

        {/* Experiment Case Scenario Description */}
        <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>
            <strong className="text-slate-200">Standard Test Execution:</strong> Sender transmits Frames 0, 1, 2, 3, 4. Lose Frame 2 in transit. Receiver accepts 0 &amp; 1, rejects out-of-order 3 &amp; 4. Sender timer expires and retransmits 2, 3, 4 until reconstructed.
          </span>
          <span className="font-mono text-cyan-400 text-xs shrink-0 ml-2">
            Retransmissions: {state.retransmittedCount}
          </span>
        </div>
      </div>

      {/* Protocol State Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
          <span className="text-slate-500 text-[10px] block">SENDER BASE (OLDEST UNACKED)</span>
          <span className="text-slate-100 font-bold text-lg">
            Frame #{state.base % sequenceModulo} (Index {state.base})
          </span>
        </div>
        <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
          <span className="text-slate-500 text-[10px] block">NEXT SEQ NUM (SEND BUFFER)</span>
          <span className="text-cyan-400 font-bold text-lg">
            Frame #{state.nextSeqNum % sequenceModulo} (Index {state.nextSeqNum})
          </span>
        </div>
        <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
          <span className="text-slate-500 text-[10px] block">RECEIVER EXPECTED SEQUENCE</span>
          <span className="text-emerald-400 font-bold text-lg">
            Frame #{state.expectedSeq % sequenceModulo}
          </span>
        </div>
        <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
          <span className="text-slate-500 text-[10px] block">ACCEPTED FRAMES</span>
          <span className="text-slate-200 font-bold text-lg">
            {state.receiverAccepted.length} / {state.frames.length}
          </span>
        </div>
      </div>

      {/* Visual Sender & Receiver Sequence Window */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Sender Window & Frame State Pipeline
          </h3>
          <span className="text-[11px] font-mono text-cyan-400">
            Window Slots: [{state.base} .. {Math.min(state.frames.length - 1, state.base + state.windowSize - 1)}]
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 font-mono text-xs">
          {state.frames.map((frame, idx) => {
            const isInsideWindow = idx >= state.base && idx < state.base + state.windowSize;
            const isBase = idx === state.base;
            const isNext = idx === state.nextSeqNum;

            let borderClass = 'border-slate-800 bg-slate-950 text-slate-500';
            if (frame.state === 'acked') {
              borderClass = 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300';
            } else if (frame.state === 'lost') {
              borderClass = 'border-rose-500/60 bg-rose-950/30 text-rose-300';
            } else if (frame.state === 'rejected') {
              borderClass = 'border-purple-500/60 bg-purple-950/30 text-purple-300';
            } else if (frame.state === 'corrupted') {
              borderClass = 'border-amber-500/60 bg-amber-950/30 text-amber-300';
            } else if (frame.state === 'in_transit') {
              borderClass = 'border-cyan-500/60 bg-cyan-950/30 text-cyan-300 animate-pulse';
            } else if (isInsideWindow) {
              borderClass = 'border-slate-700 bg-slate-900/60 text-slate-300';
            }

            return (
              <div
                key={idx}
                className={`p-2 rounded-lg border text-center flex flex-col justify-between min-h-[96px] ${borderClass}`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>#{frame.seq}</span>
                  {isBase && <span className="text-cyan-400 font-bold">BASE</span>}
                </div>
                <div className="text-[10px] text-slate-300 font-bold truncate">
                  {frame.payload.replace('PKT_', '')}
                </div>
                <div className="text-[9px] uppercase font-bold tracking-tight">
                  {frame.state}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Sender-Receiver Timeline Feed */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Interactive Sender-Receiver Protocol Timeline</span>
          </h3>
          <span className="text-[10px] font-mono text-slate-500">
            {state.events.length} state transitions
          </span>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950 divide-y divide-slate-800/80 max-h-72 overflow-y-auto font-mono text-[11px]">
          {state.events.slice().reverse().map((evt) => {
            const isLoss = evt.type === 'LOST';
            const isOoo = evt.type === 'OUT_OF_ORDER';
            const isTimeout = evt.type === 'TIMEOUT' || evt.type === 'RETRANSMIT';
            const isAck = evt.type === 'ACK_TX' || evt.type === 'ACK_RX';
            const isRx = evt.type === 'RX';

            return (
              <div key={evt.id} className="p-2.5 hover:bg-slate-900/60 transition-colors flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isLoss
                        ? 'bg-rose-500/20 text-rose-300'
                        : isOoo
                        ? 'bg-purple-500/20 text-purple-300'
                        : isTimeout
                        ? 'bg-amber-500/20 text-amber-300'
                        : isAck || isRx
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-cyan-500/20 text-cyan-300'
                    }`}>
                      {evt.type}
                    </span>
                    <span className="text-slate-200">{evt.description}</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 shrink-0 font-sans">
                  Window: [{evt.windowState.base}..{evt.windowState.next}]
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
