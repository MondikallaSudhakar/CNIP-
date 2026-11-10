import React, { useState, useEffect } from 'react';
import { Sliders, Send, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Play, Pause, Database } from 'lucide-react';
import { createInitialFlowState, sendNextFrame, receiveAndAckFrame, drainReceiverBuffer } from '../networking/flowControl';
import { SlidingWindowState } from '../types/network';

export const FlowControlLab: React.FC = () => {
  const [windowSize, setWindowSize] = useState<number>(4);
  const [bufferCapacity, setBufferCapacity] = useState<number>(6);
  const [state, setState] = useState<SlidingWindowState>(() => createInitialFlowState(4, 6, 12));
  const [isAutoRunning, setIsAutoRunning] = useState<boolean>(false);

  // Reinitialize when settings change
  const handleReset = (w = windowSize, b = bufferCapacity) => {
    setIsAutoRunning(false);
    setState(createInitialFlowState(w, b, 12));
  };

  const handleSend = () => {
    setState((prev) => sendNextFrame(prev));
  };

  const handleAck = () => {
    setState((prev) => receiveAndAckFrame(prev));
  };

  const handleDrain = () => {
    setState((prev) => drainReceiverBuffer(prev));
  };

  // Auto-run loop
  useEffect(() => {
    if (!isAutoRunning) return;
    const interval = setInterval(() => {
      setState((prev) => {
        const inFlight = prev.nextSeqNum - prev.baseSeq;
        if (inFlight < prev.windowSize && prev.nextSeqNum < prev.frames.length && prev.receiverBuffer.length < prev.bufferCapacity) {
          return sendNextFrame(prev);
        } else if (inFlight > 0) {
          return receiveAndAckFrame(prev);
        } else if (prev.receiverBuffer.length > 0) {
          return drainReceiverBuffer(prev);
        } else {
          setIsAutoRunning(false);
          return prev;
        }
      });
    }, 700);

    return () => clearInterval(interval);
  }, [isAutoRunning]);

  const inFlightCount = state.nextSeqNum - state.baseSeq;
  const isWindowFull = inFlightCount >= state.windowSize || state.nextSeqNum >= state.frames.length;
  const isBufferFull = state.receiverBuffer.length >= state.bufferCapacity;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold tracking-wide uppercase">
            <Sliders className="w-3.5 h-3.5" />
            <span>Transport & Data Link Layer Protocol Lab</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-1 tracking-tight">
            Sliding Window Flow Control Laboratory
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Demonstrates rate regulation between fast sender hospital monitors and slower clinical receiver buffers. Prevents buffer overflow by restricting outstanding in-flight frames to window size W.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsAutoRunning(!isAutoRunning)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              isAutoRunning
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
            }`}
          >
            {isAutoRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAutoRunning ? 'Pause Stream' : 'Auto Simulate'}</span>
          </button>
          <button
            onClick={() => handleReset()}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors"
            title="Reset Simulation"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Control Configuration Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Sender Window Size (W)</span>
              <span className="font-mono font-bold text-cyan-400">{windowSize} frames</span>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              value={windowSize}
              onChange={(e) => {
                const w = parseInt(e.target.value, 10);
                setWindowSize(w);
                handleReset(w, bufferCapacity);
              }}
              className="w-full accent-cyan-400"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Receiver Buffer Capacity</span>
              <span className="font-mono font-bold text-slate-200">{bufferCapacity} frames</span>
            </div>
            <input
              type="range"
              min="2"
              max="10"
              value={bufferCapacity}
              onChange={(e) => {
                const b = parseInt(e.target.value, 10);
                setBufferCapacity(b);
                handleReset(windowSize, b);
              }}
              className="w-full accent-cyan-400"
            />
          </div>

          <div className="col-span-2 flex items-center gap-2">
            <button
              onClick={handleSend}
              disabled={isWindowFull || isBufferFull || isAutoRunning}
              className="flex-1 py-2 px-3 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Next Frame</span>
            </button>
            <button
              onClick={handleAck}
              disabled={inFlightCount === 0 || isAutoRunning}
              className="flex-1 py-2 px-3 text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 disabled:opacity-40 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>ACK Oldest Frame</span>
            </button>
            <button
              onClick={handleDrain}
              disabled={state.receiverBuffer.length === 0 || isAutoRunning}
              className="py-2 px-3 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              title="Consumer drains one message from receiver buffer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Read (Drain)</span>
            </button>
          </div>
        </div>

        {/* Status Warning if Window or Buffer is Full */}
        {(isWindowFull || isBufferFull) && (
          <div className="p-2.5 rounded bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 font-mono">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              {isBufferFull
                ? 'FLOW CONTROL ENGAGED: Receiver buffer is FULL! Sender transmission halted to prevent buffer overflow.'
                : `SENDER WINDOW FULL: In-flight frames (${inFlightCount}) reached window size W=${state.windowSize}. Waiting for ACK.`}
            </span>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
          <span className="text-slate-500 text-[10px] block">SENDER BASE SEQ</span>
          <span className="text-slate-100 font-bold text-lg">{state.baseSeq}</span>
        </div>
        <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
          <span className="text-slate-500 text-[10px] block">NEXT SEQ TO TRANSMIT</span>
          <span className="text-cyan-400 font-bold text-lg">{state.nextSeqNum}</span>
        </div>
        <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
          <span className="text-slate-500 text-[10px] block">IN-FLIGHT FRAMES</span>
          <span className="text-amber-400 font-bold text-lg">{inFlightCount} / {state.windowSize}</span>
        </div>
        <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
          <span className="text-slate-500 text-[10px] block">RECEIVER BUFFER OCCUPANCY</span>
          <span className="text-emerald-400 font-bold text-lg">
            {state.receiverBuffer.length} / {state.bufferCapacity}
          </span>
        </div>
      </div>

      {/* Sliding Window Visualizer Strip */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Sender Sliding Window & Sequence Space
          </h3>
          <span className="text-[11px] font-mono text-cyan-400">
            Active Window: [{state.baseSeq} .. {Math.min(state.frames.length - 1, state.baseSeq + state.windowSize - 1)}]
          </span>
        </div>

        {/* Frames Sequence Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 font-mono text-xs">
          {state.frames.map((frame) => {
            const isInsideWindow = frame.seq >= state.baseSeq && frame.seq < state.baseSeq + state.windowSize;
            const isAcked = frame.status === 'acked';
            const isInFlight = frame.status === 'in-flight';

            return (
              <div
                key={frame.seq}
                className={`p-2 rounded-lg border text-center flex flex-col justify-between min-h-[90px] transition-all ${
                  isAcked
                    ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                    : isInFlight
                    ? 'border-amber-500/50 bg-amber-950/20 text-amber-300 shadow-sm animate-pulse'
                    : isInsideWindow
                    ? 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300'
                    : 'border-slate-800 bg-slate-950 text-slate-500 opacity-60'
                }`}
              >
                <div className="font-bold text-sm">
                  #{frame.seq}
                </div>
                <div className="text-[9px] truncate text-slate-400 px-0.5">
                  {frame.data.split('_')[0]}
                </div>
                <div className="text-[9px] uppercase font-bold tracking-tight">
                  {frame.status}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/30 border border-emerald-500"></span> Acknowledged</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500/30 border border-amber-500"></span> In-Flight</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-cyan-500/30 border border-cyan-500"></span> Window Slot Available</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-900 border border-slate-700"></span> Outside Window</span>
          </div>
        </div>
      </div>

      {/* Receiver Buffer Inspection Box */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Clinical Receiver Ingest Buffer ({state.receiverBuffer.length} / {state.bufferCapacity} Slots Occupied)</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            Buffer Consumption Queue
          </span>
        </div>

        {state.receiverBuffer.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 font-mono">
            Receiver buffer is empty. Send frames to populate consumer ingest queue.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 font-mono text-xs">
            {state.receiverBuffer.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-200 flex items-center justify-between"
              >
                <span className="truncate">{item}</span>
                <span className="text-[10px] text-emerald-400 px-1 rounded bg-emerald-500/10 shrink-0">BUFFERED</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
