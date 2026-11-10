/**
 * MediNet - Hospital Emergency Communication Network
 * Core Type Definitions
 */

export type DepartmentId = 'ER' | 'ICU' | 'LAB' | 'PHARM' | 'ADMIN';

export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';

export interface DepartmentNode {
  id: DepartmentId;
  name: string;
  ip: string;
  mac: string;
  subnet: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  role: string;
  location: string;
  activeStaff: number;
  bufferCapacity: number; // in KB
  x: number;
  y: number;
}

export interface NetworkLink {
  id: string;
  source: DepartmentId;
  target: DepartmentId;
  bandwidthMbps: number;
  propagationDelayMs: number;
  packetLossProb: number; // 0 to 1
  queueCapacity: number;  // packets
  cost: number;           // Dijkstra weight
  enabled: boolean;
  activePackets?: number;
}

export interface HospitalMessage {
  id: string;
  timestamp: string;
  source: DepartmentId;
  destination: DepartmentId;
  subject: string;
  content: string;
  priority: PriorityLevel;
  status: 'PENDING' | 'ROUTING' | 'FRAMING' | 'CRC_CHECK' | 'DELIVERED' | 'FAILED';
  route: DepartmentId[];
  totalCost: number;
  framesCount: number;
  crcAlgorithm: 'CRC-8' | 'CRC-16' | 'CRC-32';
  crcValid: boolean;
  retryCount: number;
  latencyMs: number;
}

export interface NetworkEvent {
  id: string;
  timestamp: string;
  type: 'MSG_CREATED' | 'FRAME_GEN' | 'CRC_CALC' | 'PACKET_TX' | 'ACK_RX' | 'FRAME_REJECT' | 'RETRY_INIT' | 'DELIVERED' | 'LINK_DOWN' | 'LINK_UP';
  title: string;
  description: string;
  source?: DepartmentId;
  destination?: DepartmentId;
  details?: Record<string, any>;
  level: 'info' | 'success' | 'warning' | 'error';
}

export interface FramingResult {
  technique: 'CHARACTER_COUNT' | 'BYTE_STUFFING' | 'BIT_STUFFING';
  originalText: string;
  originalBinary: string;
  frames: Array<{
    frameNumber: number;
    rawPayload: string;
    encodedFrame: string;
    encodedBinary: string;
    frameSize: number;
    overheadBytes: number;
    stuffedFlagsCount?: number;
  }>;
  stuffedDataDisplay: string;
  extractedText: string;
  extractionValid: boolean;
  notes: string;
}

export interface CrcStep {
  stepIndex: number;
  dividendSnapshot: string;
  divisorSnapshot: string;
  quotientBit: string;
  xorResult: string;
}

export interface CrcResult {
  algorithm: 'CRC-8' | 'CRC-16' | 'CRC-32';
  polynomialHex: string;
  polynomialBinary: string;
  polynomialName: string;
  originalData: string;
  binaryData: string;
  paddedData: string;
  crcChecksumBinary: string;
  crcChecksumHex: string;
  transmittedFrame: string;
  receivedFrame: string;
  isCorrupted: boolean;
  corruptedBitIndex?: number;
  syndromeBinary: string;
  isValid: boolean;
  divisionSteps: CrcStep[];
}

export interface SlidingWindowFrame {
  seq: number;
  data: string;
  status: 'unsent' | 'in-flight' | 'acked' | 'lost';
  sentTimestamp?: number;
  ackTimestamp?: number;
}

export interface SlidingWindowState {
  windowSize: number;
  bufferCapacity: number;
  baseSeq: number;
  nextSeqNum: number;
  expectedSeqNum: number;
  frames: SlidingWindowFrame[];
  receiverBuffer: string[];
  acknowledgedCount: number;
  bufferedCount: number;
  overflowPrevented: boolean;
}

export interface GbnFrameEvent {
  id: string;
  timestamp: number;
  type: 'TX' | 'RX' | 'LOST' | 'CORRUPTED' | 'OUT_OF_ORDER' | 'ACK_TX' | 'ACK_RX' | 'TIMEOUT' | 'RETRANSMIT';
  frameSeq: number;
  description: string;
  windowState: { base: number; next: number };
}

export interface GbnState {
  sequenceModulo: number; // e.g. 8 (3 bits)
  windowSize: number;     // e.g. 4
  base: number;
  nextSeqNum: number;
  expectedSeq: number;
  totalFramesToSend: number;
  currentFrameIndex: number;
  frames: Array<{
    seq: number;
    payload: string;
    state: 'unsent' | 'in_transit' | 'acked' | 'lost' | 'corrupted' | 'rejected';
  }>;
  activeTimers: Array<{ seq: number; startedAt: number; duration: number }>;
  receiverAccepted: number[];
  retransmittedCount: number;
  events: GbnFrameEvent[];
  isComplete: boolean;
  isRunning: boolean;
}

export interface DijkstraResult {
  source: DepartmentId;
  destination: DepartmentId;
  path: DepartmentId[];
  totalCost: number;
  totalLatencyMs: number;
  visitedNodesOrder: DepartmentId[];
  distances: Record<DepartmentId, number>;
  previous: Record<DepartmentId, DepartmentId | null>;
  alternativeRoutes: Array<{
    path: DepartmentId[];
    totalCost: number;
    differenceFromShortest: number;
  }>;
}

export interface Ns2ExperimentConfig {
  id: string;
  name: string;
  description: string;
  trafficType: 'TCP_FTP' | 'UDP_CBR' | 'MIXED';
  queueType: 'DropTail' | 'RED';
  packetSizeBytes: number;
  trafficRateMbps: number;
  intervalMs: number;
  simulationDurationSec: number;
  bottleneckBandwidthMbps: number;
  bottleneckDelayMs: number;
  queueLimitPackets: number;
  sourceNode: DepartmentId;
  destNode: DepartmentId;
}

export interface TraceMetrics {
  totalSent: number;
  totalReceived: number;
  totalDropped: number;
  packetDeliveryRatio: number; // %
  packetLossRatio: number;     // %
  avgEndToEndDelayMs: number;
  throughputKbps: number;
  queueDrops: number;
  delayPerPacket: Array<{ time: number; delayMs: number }>;
  throughputOverTime: Array<{ time: number; kbps: number }>;
  dropEvents: Array<{ time: number; node: string; packetId: number; reason: string }>;
}

export interface ParsedPacket {
  id: number;
  timestamp: string;
  sourceIp: string;
  destIp: string;
  protocol: 'TCP' | 'UDP' | 'ICMP';
  length: number;
  sourcePort: number;
  destPort: number;
  tcpFlags?: {
    syn: boolean;
    ack: boolean;
    fin: boolean;
    rst: boolean;
    psh: boolean;
  };
  seqNumber?: number;
  ackNumber?: number;
  hexDump: string;
  asciiPayload: string;
  summary: string;
}

export interface TestCaseResult {
  category: 'Framing' | 'CRC' | 'Flow Control' | 'Go-Back-N' | 'Routing' | 'NS2 Engine' | 'Wireshark PCAP' | 'System';
  testName: string;
  description: string;
  status: 'PASS' | 'FAIL' | 'PENDING';
  durationMs: number;
  expectedOutput: string;
  actualOutput: string;
  error?: string;
}
