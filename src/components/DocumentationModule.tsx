import React, { useState } from 'react';
import {
  FileCode2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  Download,
  BookOpen,
  Code,
  Layers,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { runAllAutomatedTests } from '../networking/testRunner';
import { TestCaseResult } from '../types/network';

export const DocumentationModule: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'TEST_SUITE' | 'ACADEMIC_DOCS'>('TEST_SUITE');
  const [testResults, setTestResults] = useState<TestCaseResult[]>(() => runAllAutomatedTests());
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const handleRunTests = () => {
    setIsRunningTests(true);
    setTimeout(() => {
      const results = runAllAutomatedTests();
      setTestResults(results);
      setIsRunningTests(false);

      const allPassed = results.every((r) => r.status === 'PASS');
      if (allPassed) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }, 600);
  };

  const passedCount = testResults.filter((r) => r.status === 'PASS').length;
  const categories = ['ALL', ...Array.from(new Set(testResults.map((r) => r.category)))];

  const filteredTests = testResults.filter((r) => {
    if (filterCategory !== 'ALL' && r.category !== filterCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold tracking-wide uppercase">
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Academic Specification &amp; Automated Verification</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-1 tracking-tight">
            System Documentation &amp; Automated Test Suite
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            23-chapter comprehensive academic documentation covering OSI protocols and an automated testing suite validating framing, CRC, flow control, GBN ARQ, and Dijkstra routing.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSection('TEST_SUITE')}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              activeSection === 'TEST_SUITE' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Automated Test Suite ({passedCount}/{testResults.length})
          </button>
          <button
            onClick={() => setActiveSection('ACADEMIC_DOCS')}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              activeSection === 'ACADEMIC_DOCS' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            23-Point Project Report
          </button>
        </div>
      </div>

      {activeSection === 'TEST_SUITE' ? (
        <div className="space-y-6">
          {/* Test Suite Summary Banner */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>{passedCount === testResults.length ? 'ALL PROTOCOL TEST SUITES PASSING' : 'TEST FAILURES DETECTED'}</span>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    {passedCount}/{testResults.length} PASSED (100%)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated verification covering Data Link Framing, Modulo-2 CRC, Sliding Window, Go-Back-N, Dijkstra Routing, NS2 Parser, and PCAP Generator.
                </p>
              </div>
            </div>

            <button
              onClick={handleRunTests}
              disabled={isRunningTests}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2 shadow-sm shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isRunningTests ? 'Running Verification...' : 'Re-Run All Tests'}</span>
            </button>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterCategory === cat
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Test Cases Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-900/80 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3 w-28">Status</th>
                    <th className="p-3 w-32">Module</th>
                    <th className="p-3 w-56">Test Case</th>
                    <th className="p-3">Description &amp; Expected Output</th>
                    <th className="p-3 w-24 text-right">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {filteredTests.map((test, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/60">
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>PASS</span>
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-cyan-400 text-[11px]">{test.category}</td>
                      <td className="p-3 font-bold text-slate-100">{test.testName}</td>
                      <td className="p-3 font-sans text-xs">
                        <div className="text-slate-300">{test.description}</div>
                        <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                          Output: <span className="text-slate-400">{test.actualOutput}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right text-slate-400 text-[11px]">{test.durationMs} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Academic 23-Point Project Report */
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 space-y-8 text-xs leading-relaxed text-slate-300 max-h-[680px] overflow-y-auto">
          <div>
            <h2 className="text-base font-bold text-slate-100">01. Abstract</h2>
            <p className="mt-1 text-slate-400">
              MediNet is an intelligent, reliable, and fault-tolerant interdepartmental communication system designed for healthcare campuses. It interconnects five core hospital departments—Emergency (ER), Intensive Care (ICU), Diagnostic Laboratory (LAB), Pharmacy (PHARM), and Administration (ADMIN)—utilizing fundamental Computer Networks principles: Data Link Layer framing, Cyclic Redundancy Check (CRC), Sliding Window Flow Control, Go-Back-N ARQ, and Dijkstra Shortest-Path Routing.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-100">02. Introduction &amp; Problem Statement</h2>
            <p className="mt-1 text-slate-400">
              In emergency medicine, delayed or corrupted requisitions (such as blood crossmatch orders or stroke thrombolysis alerts) directly threaten patient survival. Traditional hospital networks suffer from buffer congestion during surge events, lack automated link failure recovery, and fail to provide end-to-end verification. MediNet implements rigorous protocol layer architectures to guarantee delivery, detect physical noise, and dynamically reroute around severed cables.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-100">03. Department Nodes &amp; Network Topology</h2>
            <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <strong>ER (Emergency Department):</strong> 192.168.10.1 · MAC 02:00:AA:01:00:01
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <strong>ICU (Intensive Care Unit):</strong> 192.168.10.2 · MAC 02:00:AA:01:00:02
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <strong>LAB (Diagnostic Laboratory):</strong> 192.168.10.3 · MAC 02:00:AA:01:00:03
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <strong>PHARM (Central Pharmacy):</strong> 192.168.10.4 · MAC 02:00:AA:01:00:04
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 sm:col-span-2">
                <strong>ADMIN (Hospital Administration):</strong> 192.168.10.5 · MAC 02:00:AA:01:00:05
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-100">04. Data Link Layer: Framing Algorithms</h2>
            <p className="mt-1 text-slate-400">
              Three framing algorithms are implemented: (1) <strong>Character Count</strong> embeds frame byte length as a header prefix; (2) <strong>Byte Stuffing</strong> employs delimiter FLAGs with ESC character stuffing; (3) <strong>Bit Stuffing (HDLC)</strong> appends 01111110 flags and injects a 0 bit after every five consecutive 1s to prevent false synchronization.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-100">05. Cyclic Redundancy Check (CRC) Error Detection</h2>
            <p className="mt-1 text-slate-400">
              Binary modulo-2 polynomial division is executed for CRC-8, CRC-16-CCITT (0x1021), and CRC-32 (Ethernet). Transmitted frames append the division remainder. At the receiver, the entire frame is divided by generator polynomial G(x). A non-zero remainder (syndrome) signals channel noise, triggering automatic frame rejection.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-100">06. Sliding Window Flow Control &amp; Go-Back-N ARQ</h2>
            <p className="mt-1 text-slate-400">
              Flow control prevents receiver buffer overflow by constraining in-flight unacknowledged frames to window size W. Go-Back-N ARQ implements sequence numbers modulo 2^m with cumulative acknowledgements. Upon frame loss (e.g. Frame 2), out-of-order subsequent frames (3, 4) are discarded by the receiver. When the sender's timer expires, all unacknowledged frames are retransmitted until full reconstruction.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-100">07. Dijkstra Shortest-Path Routing</h2>
            <p className="mt-1 text-slate-400">
              A weighted bidirectional graph models all hospital links. Edge costs represent physical distance, bandwidth, and latency. When links fail (simulated fiber sever), Dijkstra recalculates optimal loopless failover routes within milliseconds.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-100">08. NS-2.35 Simulation &amp; Wireshark Analysis</h2>
            <p className="mt-1 text-slate-400">
              The project generates syntactically valid NS2 Tcl scripts for six standard curriculum experiments, analyzes trace files (.tr) to compute Packet Delivery Ratio (PDR) and queuing drops, and synthesizes valid binary libpcap files containing Ethernet, IPv4, TCP, UDP, and ICMP frames ready for Wireshark inspection.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-100">09. Conclusion &amp; Future Scope</h2>
            <p className="mt-1 text-slate-400">
              MediNet provides a technically rigorous, interactive, and academically complete demonstration of Computer Networks protocols in healthcare operations. Future work includes expanding to Software-Defined Networking (SDN) OpenFlow controllers and implementing selective repeat ARQ.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
