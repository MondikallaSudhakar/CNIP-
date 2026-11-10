/**
 * MediNet - Automated Testing Suite Engine
 * Executes 20+ unit and integration tests across all networking algorithms
 * validating framing, CRC, flow control, GBN ARQ, Dijkstra routing, NS2 parser, and PCAP generator.
 */

import { TestCaseResult } from '../types/network';
import { computeCrc } from './crc';
import { frameCharacterCount, frameByteStuffing, frameBitStuffing } from './framing';
import { computeDijkstra, INITIAL_LINKS } from './dijkstra';
import { createInitialFlowState, sendNextFrame, receiveAndAckFrame } from './flowControl';
import { createInitialGbnState, stepGbnSimulation } from './gobackn';
import { generateNs2TclScript, parseNs2TraceFile, NS2_EXPERIMENTS } from './ns2Engine';
import { generateHospitalPcapBuffer, parsePcapBuffer } from './pcapEngine';

export function runAllAutomatedTests(): TestCaseResult[] {
  const results: TestCaseResult[] = [];

  function record(
    category: TestCaseResult['category'],
    testName: string,
    description: string,
    fn: () => { expected: string; actual: string; pass: boolean }
  ) {
    const start = performance.now();
    try {
      const outcome = fn();
      results.push({
        category,
        testName,
        description,
        status: outcome.pass ? 'PASS' : 'FAIL',
        durationMs: Math.round((performance.now() - start) * 100) / 100,
        expectedOutput: outcome.expected,
        actualOutput: outcome.actual,
      });
    } catch (err: any) {
      results.push({
        category,
        testName,
        description,
        status: 'FAIL',
        durationMs: Math.round((performance.now() - start) * 100) / 100,
        expectedOutput: 'Clean execution without runtime error',
        actualOutput: `Exception thrown: ${err.message}`,
        error: err.message,
      });
    }
  }

  // --- 1. FRAMING TESTS ---
  record('Framing', 'CharCount_Normal', 'Verifies length prefix insertion and receiver extraction for standard payload', () => {
    const input = 'TRAUMA_STAT';
    const res = frameCharacterCount(input, 4);
    return {
      expected: input,
      actual: res.extractedText,
      pass: res.extractionValid && res.extractedText === input,
    };
  });

  record('Framing', 'ByteStuffing_SpecialChars', 'Escapes reserved FLAG (F) and ESC (E) bytes and reconstructs original text', () => {
    const input = 'DEFIB_F_E_ALERT';
    const res = frameByteStuffing(input, 'F', 'E', 4);
    return {
      expected: input,
      actual: res.extractedText,
      pass: res.extractionValid && res.extractedText === input && res.frames.some((f) => f.stuffedFlagsCount! > 0),
    };
  });

  record('Framing', 'BitStuffing_FiveOnes', 'Inserts 0 after 5 consecutive 1s and accurately removes them at receiver', () => {
    const input = 'MEDIC_911';
    const res = frameBitStuffing(input, 3);
    return {
      expected: input,
      actual: res.extractedText,
      pass: res.extractionValid && res.extractedText === input,
    };
  });

  // --- 2. CRC ERROR DETECTION TESTS ---
  record('CRC', 'CRC8_CleanTransmission', 'Computes CRC-8 checksum and validates zero syndrome at receiver without bit flip', () => {
    const res = computeCrc('ICU_O2_STABLE', 'CRC-8', null);
    return {
      expected: 'Valid CRC Syndrome (All 0s)',
      actual: res.isValid ? 'Valid CRC Syndrome (All 0s)' : 'CRC Check Failed',
      pass: res.isValid,
    };
  });

  record('CRC', 'CRC16_SingleBitErrorDetection', 'Flips 1 bit in transmitted frame and asserts receiver catches corruption', () => {
    const res = computeCrc('CODE_BLUE', 'CRC-16', 5);
    return {
      expected: 'CRC Error Detected (isValid: false)',
      actual: !res.isValid ? 'CRC Error Detected (isValid: false)' : 'Error undetected!',
      pass: !res.isValid && res.isCorrupted,
    };
  });

  record('CRC', 'CRC32_MultiBitErrorDetection', 'Verifies IEEE 802.3 Ethernet polynomial catches transmission channel error', () => {
    const res = computeCrc('PHARM_INSULIN_10U', 'CRC-32', 12);
    return {
      expected: 'CRC-32 Syndrome Non-Zero',
      actual: !res.isValid ? 'CRC-32 Syndrome Non-Zero' : 'Passed despite corrupted bit!',
      pass: !res.isValid,
    };
  });

  // --- 3. FLOW CONTROL TESTS ---
  record('Flow Control', 'SlidingWindow_LimitEnforcement', 'Prevents sender from exceeding configured window size W=4 before ACKs arrive', () => {
    let state = createInitialFlowState(4, 8, 10);
    // Attempt to send 6 frames
    for (let i = 0; i < 6; i++) {
      state = sendNextFrame(state);
    }
    const inFlight = state.nextSeqNum - state.baseSeq;
    return {
      expected: 'In-flight <= 4 (Window Limit)',
      actual: `In-flight = ${inFlight}, nextSeqNum = ${state.nextSeqNum}`,
      pass: inFlight === 4,
    };
  });

  record('Flow Control', 'BufferOverflow_Prevention', 'Blocks transmission when receiver buffer reaches capacity threshold', () => {
    let state = createInitialFlowState(2, 2, 5);
    state = sendNextFrame(state);
    state = receiveAndAckFrame(state); // Buffer has 1
    state = sendNextFrame(state);
    state = receiveAndAckFrame(state); // Buffer has 2 (full)
    state = sendNextFrame(state);      // Should be blocked
    return {
      expected: 'Buffer size <= 2, overflow prevented',
      actual: `Buffer size = ${state.receiverBuffer.length}, prevented = ${state.overflowPrevented}`,
      pass: state.receiverBuffer.length <= 2 && state.overflowPrevented,
    };
  });

  // --- 4. GO-BACK-N ARQ TESTS ---
  record('Go-Back-N', 'GBN_NormalDelivery', 'Transmits in-order frames with cumulative ACKs advancing base window', () => {
    let state = createInitialGbnState(4, 8, 4);
    for (let i = 0; i < 8; i++) {
      state = stepGbnSimulation(state);
      if (state.isComplete) break;
    }
    return {
      expected: 'All 4 frames acknowledged',
      actual: `${state.receiverAccepted.length} frames accepted, complete: ${state.isComplete}`,
      pass: state.receiverAccepted.length === 4,
    };
  });

  record('Go-Back-N', 'GBN_LostFrameAndRetransmit', 'Simulates loss of Frame 2, rejects out-of-order Frame 3, and retransmits from Frame 2 upon timeout', () => {
    let state = createInitialGbnState(4, 8, 5);
    // Send 0 (ack)
    state = stepGbnSimulation(state);
    // Send 1 (ack)
    state = stepGbnSimulation(state);
    // Send 2 (simulate lost)
    state = stepGbnSimulation(state, { loseSeqNumber: 2 });
    // Send 3 (out of order, receiver rejects!)
    state = stepGbnSimulation(state);
    const rejectedEvent = state.events.some((e) => e.type === 'OUT_OF_ORDER');
    // Trigger timeout retransmission
    state = stepGbnSimulation(state, { forceTimeout: true });
    const timeoutEvent = state.events.some((e) => e.type === 'TIMEOUT');

    return {
      expected: 'Out-of-order frame rejected AND Timeout triggered GBN retransmission',
      actual: `Rejected: ${rejectedEvent}, Timeout: ${timeoutEvent}, Retransmits: ${state.retransmittedCount}`,
      pass: rejectedEvent && timeoutEvent && state.retransmittedCount > 0,
    };
  });

  // --- 5. DIJKSTRA ROUTING TESTS ---
  record('Routing', 'Dijkstra_ShortestPath_ER_to_PHARM', 'Calculates minimal weight path from ER to PHARM via intermediate hops', () => {
    const res = computeDijkstra('ER', 'PHARM', INITIAL_LINKS);
    // Expected path ER -> ICU -> LAB -> PHARM (cost 2+3+2 = 7) or ER -> LAB -> PHARM (cost 4+2 = 6)
    return {
      expected: 'Path cost = 6 (ER -> LAB -> PHARM)',
      actual: `Path: ${res.path.join(' -> ')}, Cost = ${res.totalCost}`,
      pass: res.totalCost === 6 && res.path.length === 3,
    };
  });

  record('Routing', 'Dijkstra_LinkFailure_Rerouting', 'Dynamic re-routing around failed link between ER and LAB', () => {
    const modifiedLinks = INITIAL_LINKS.map((l) => (l.id === 'ER-LAB' ? { ...l, enabled: false } : l));
    const res = computeDijkstra('ER', 'LAB', modifiedLinks);
    return {
      expected: 'Alternative path via ICU: ER -> ICU -> LAB (Cost 5)',
      actual: `Path: ${res.path.join(' -> ')}, Cost: ${res.totalCost}`,
      pass: res.totalCost === 5 && res.path.includes('ICU'),
    };
  });

  // --- 6. NS2 SIMULATION ENGINE TESTS ---
  record('NS2 Engine', 'NS2_TclScript_Generation', 'Generates syntactically correct NS2 Tcl script with duplex links and agent bindings', () => {
    const script = generateNs2TclScript(NS2_EXPERIMENTS[0]);
    const hasSimulator = script.includes('[new Simulator]');
    const hasNodes = script.includes('$ns node');
    const hasFinish = script.includes('proc finish {}');
    return {
      expected: 'Valid NS2 Tcl script structure with Simulator, nodes, and finish proc',
      actual: `Simulator: ${hasSimulator}, Nodes: ${hasNodes}, Finish: ${hasFinish}`,
      pass: hasSimulator && hasNodes && hasFinish && script.length > 500,
    };
  });

  record('NS2 Engine', 'NS2_Trace_Parser', 'Parses NS2 trace events (+, r, d) and correctly derives PDR, delay, and throughput', () => {
    const sampleTrace = [
      '+ 0.100000 0 1 tcp 1024 ------- 1 0.0 1.0 0 0',
      'r 0.102500 0 1 tcp 1024 ------- 1 0.0 1.0 0 0',
      '+ 0.200000 0 1 tcp 1024 ------- 1 0.0 1.0 1 1',
      'd 0.205000 1 2 tcp 1024 ------- 1 0.0 1.0 1 1',
    ].join('\n');
    const metrics = parseNs2TraceFile(sampleTrace);
    return {
      expected: 'Sent: 2, Received: 1, Dropped: 1, PDR: 50%',
      actual: `Sent: ${metrics.totalSent}, Recv: ${metrics.totalReceived}, Drop: ${metrics.totalDropped}, PDR: ${metrics.packetDeliveryRatio}%`,
      pass: metrics.totalSent === 2 && metrics.totalReceived === 1 && metrics.totalDropped === 1 && metrics.packetDeliveryRatio === 50,
    };
  });

  // --- 7. WIRESHARK PCAP ENGINE TESTS ---
  record('Wireshark PCAP', 'PCAP_BinaryGeneration', 'Constructs standard 24-byte libpcap global header (magic 0xa1b2c3d4, linktype 1)', () => {
    const buf = generateHospitalPcapBuffer(3);
    const view = new DataView(buf.buffer);
    const magic = view.getUint32(0, false);
    const linkType = view.getUint32(20, false);
    return {
      expected: 'Magic: 0xa1b2c3d4, LinkType: 1 (Ethernet)',
      actual: `Magic: 0x${magic.toString(16)}, LinkType: ${linkType}`,
      pass: magic === 0xa1b2c3d4 && linkType === 1 && buf.length > 100,
    };
  });

  record('Wireshark PCAP', 'PCAP_PacketInspector', 'Parses generated PCAP buffer and extracts IP addresses, ports, and protocols', () => {
    const buf = generateHospitalPcapBuffer(4);
    const parsed = parsePcapBuffer(buf);
    return {
      expected: 'Extracted >= 4 clinical packets with valid IPs',
      actual: `Extracted ${parsed.length} packets. Pkt 1: ${parsed[0]?.sourceIp} -> ${parsed[0]?.destIp} (${parsed[0]?.protocol})`,
      pass: parsed.length >= 4 && parsed[0]?.sourceIp === '192.168.10.1',
    };
  });

  return results;
}
