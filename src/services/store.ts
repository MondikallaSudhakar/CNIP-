/**
 * MediNet - Central Clinical Communication & Network Operations Store
 * Manages interdepartmental message transmission, routing execution,
 * framing/CRC processing, live event feeds, and telemetry statistics.
 */

import { DepartmentId, DepartmentNode, HospitalMessage, NetworkEvent, NetworkLink } from '../types/network';
import { DEPARTMENTS, INITIAL_LINKS, computeDijkstra } from '../networking/dijkstra';
import { computeCrc } from '../networking/crc';
import { frameCharacterCount, frameByteStuffing, frameBitStuffing } from '../networking/framing';

export interface MediNetStats {
  totalMessages: number;
  deliveredMessages: number;
  failedMessages: number;
  corruptedFrames: number;
  lostFrames: number;
  retransmissions: number;
  avgDelayMs: number;
  currentThroughputMbps: number;
  packetDeliveryRatio: number;
  activeNodesCount: number;
  activeLinksCount: number;
}

const INITIAL_MESSAGES: HospitalMessage[] = [
  {
    id: 'MSG-901',
    timestamp: new Date(Date.now() - 420000).toISOString(),
    source: 'ER',
    destination: 'LAB',
    subject: 'STAT Blood Crossmatch & Cardiac Troponin',
    content: 'Trauma Bay 2: 45yo male acute STEMI. Immediate type and crossmatch 4 units O-negative PRBC requested.',
    priority: 'CRITICAL',
    status: 'DELIVERED',
    route: ['ER', 'LAB'],
    totalCost: 4,
    framesCount: 3,
    crcAlgorithm: 'CRC-16',
    crcValid: true,
    retryCount: 0,
    latencyMs: 2.5,
  },
  {
    id: 'MSG-902',
    timestamp: new Date(Date.now() - 280000).toISOString(),
    source: 'ICU',
    destination: 'PHARM',
    subject: 'Emergency Norepinephrine Continuous Infusion',
    content: 'ICU Bed 07: Septic shock unresponsive to bolus. Immediate dispensing of Norepinephrine 4mg/250mL D5W required.',
    priority: 'CRITICAL',
    status: 'DELIVERED',
    route: ['ICU', 'LAB', 'PHARM'],
    totalCost: 5,
    framesCount: 4,
    crcAlgorithm: 'CRC-32',
    crcValid: true,
    retryCount: 0,
    latencyMs: 3.3,
  },
  {
    id: 'MSG-903',
    timestamp: new Date(Date.now() - 150000).toISOString(),
    source: 'ER',
    destination: 'ADMIN',
    subject: 'Emergency Resuscitation Bed Allocation Request',
    content: 'Mass casualty transport inbound from Highway 101 pileup. ER requests 3 ICU bed reservations and emergency surgical suite clearance.',
    priority: 'HIGH',
    status: 'DELIVERED',
    route: ['ER', 'ICU', 'LAB', 'PHARM', 'ADMIN'],
    totalCost: 10,
    framesCount: 5,
    crcAlgorithm: 'CRC-16',
    crcValid: true,
    retryCount: 1,
    latencyMs: 7.3,
  },
];

const INITIAL_EVENTS: NetworkEvent[] = [
  {
    id: 'EV-101',
    timestamp: new Date(Date.now() - 420000).toLocaleTimeString(),
    type: 'MSG_CREATED',
    title: 'Emergency Order Created',
    description: 'ER issued STAT Blood Crossmatch to LAB',
    source: 'ER',
    destination: 'LAB',
    level: 'info',
  },
  {
    id: 'EV-102',
    timestamp: new Date(Date.now() - 418000).toLocaleTimeString(),
    type: 'CRC_CALC',
    title: 'CRC-16 Checksum Generated',
    description: 'Payload verified with CRC-16-CCITT polynomial (0x1021)',
    source: 'ER',
    destination: 'LAB',
    level: 'info',
  },
  {
    id: 'EV-103',
    timestamp: new Date(Date.now() - 417000).toLocaleTimeString(),
    type: 'DELIVERED',
    title: 'Packet Delivered & Acknowledged',
    description: 'Direct duplex link ER-LAB confirmed zero packet loss (RTT 2.5ms)',
    source: 'ER',
    destination: 'LAB',
    level: 'success',
  },
  {
    id: 'EV-104',
    timestamp: new Date(Date.now() - 280000).toLocaleTimeString(),
    type: 'MSG_CREATED',
    title: 'Medication Order Dispatched',
    description: 'ICU requested Norepinephrine from PHARM via Dijkstra route [ICU -> LAB -> PHARM]',
    source: 'ICU',
    destination: 'PHARM',
    level: 'info',
  },
  {
    id: 'EV-105',
    timestamp: new Date(Date.now() - 278000).toLocaleTimeString(),
    type: 'ACK_RX',
    title: 'ACK Received by Sender',
    description: 'Cumulative ACK 4 received; window advanced to base 4',
    source: 'ICU',
    destination: 'PHARM',
    level: 'success',
  },
];

export class MediNetStore {
  private departments: DepartmentNode[];
  private links: NetworkLink[];
  private messages: HospitalMessage[];
  private events: NetworkEvent[];
  private listeners: Array<() => void> = [];

  constructor() {
    this.departments = DEPARTMENTS.map((d) => ({
      ...d,
      status: 'ONLINE',
      activeStaff: d.id === 'ER' ? 24 : d.id === 'ICU' ? 18 : d.id === 'LAB' ? 12 : d.id === 'PHARM' ? 8 : 15,
      bufferCapacity: 256,
    }));
    this.links = [...INITIAL_LINKS];
    this.messages = [...INITIAL_MESSAGES];
    this.events = [...INITIAL_EVENTS];
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public getDepartments(): DepartmentNode[] {
    return [...this.departments];
  }

  public getLinks(): NetworkLink[] {
    return [...this.links];
  }

  public getMessages(): HospitalMessage[] {
    return [...this.messages];
  }

  public getEvents(): NetworkEvent[] {
    return [...this.events];
  }

  public setLinkEnabled(linkId: string, enabled: boolean) {
    this.links = this.links.map((link) => (link.id === linkId ? { ...link, enabled } : link));
    const targetLink = this.links.find((l) => l.id === linkId);
    if (targetLink) {
      this.addEvent({
        id: `EV-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: enabled ? 'LINK_UP' : 'LINK_DOWN',
        title: enabled ? `Link Online: ${targetLink.source}-${targetLink.target}` : `Link Disabled: ${targetLink.source}-${targetLink.target}`,
        description: enabled
          ? `Duplex link reconnected at ${targetLink.bandwidthMbps} Mbps.`
          : `Link taken offline. Dijkstra routing recalculating alternate hospital paths.`,
        source: targetLink.source,
        destination: targetLink.target,
        level: enabled ? 'success' : 'warning',
      });
    }
    this.notify();
  }

  public updateLinkCost(linkId: string, cost: number) {
    this.links = this.links.map((link) => (link.id === linkId ? { ...link, cost: Math.max(1, cost) } : link));
    this.notify();
  }

  public addEvent(event: NetworkEvent) {
    this.events = [event, ...this.events].slice(0, 100);
    this.notify();
  }

  /**
   * Transmit a message through the full 5-stage Computer Networks pipeline:
   * 1. Shortest-path routing (Dijkstra)
   * 2. Framing (Character count / Byte / Bit stuffing)
   * 3. CRC Error Detection calculation
   * 4. Simulated transmission across intermediate hops
   * 5. Delivery and logging
   */
  public transmitMessage(params: {
    source: DepartmentId;
    destination: DepartmentId;
    subject: string;
    content: string;
    priority: HospitalMessage['priority'];
    framingTechnique?: 'CHARACTER_COUNT' | 'BYTE_STUFFING' | 'BIT_STUFFING';
    crcAlgorithm?: 'CRC-8' | 'CRC-16' | 'CRC-32';
    simulateBitError?: boolean;
  }): HospitalMessage {
    const {
      source,
      destination,
      subject,
      content,
      priority,
      framingTechnique = 'BIT_STUFFING',
      crcAlgorithm = 'CRC-16',
      simulateBitError = false,
    } = params;

    const timeStr = new Date().toLocaleTimeString();

    // Step 1: Dijkstra Shortest Path
    const dijkstraRes = computeDijkstra(source, destination, this.links);
    const hasRoute = dijkstraRes.path.length > 0 && dijkstraRes.totalCost >= 0;

    this.addEvent({
      id: `EV-ROUT-${Date.now()}`,
      timestamp: timeStr,
      type: 'MSG_CREATED',
      title: `New Emergency Message [${priority}]`,
      description: `From ${source} to ${destination}: "${subject}"`,
      source,
      destination,
      level: 'info',
    });

    if (!hasRoute) {
      this.addEvent({
        id: `EV-FAIL-${Date.now()}`,
        timestamp: timeStr,
        type: 'FRAME_REJECT',
        title: 'Routing Failure: Destination Unreachable',
        description: `Dijkstra algorithm found no active path between ${source} and ${destination} due to severed links.`,
        source,
        destination,
        level: 'error',
      });

      const failedMsg: HospitalMessage = {
        id: `MSG-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        source,
        destination,
        subject,
        content,
        priority,
        status: 'FAILED',
        route: [],
        totalCost: -1,
        framesCount: 0,
        crcAlgorithm,
        crcValid: false,
        retryCount: 3,
        latencyMs: 0,
      };

      this.messages = [failedMsg, ...this.messages];
      this.notify();
      return failedMsg;
    }

    // Step 2: Framing
    let framesCount = 1;
    if (framingTechnique === 'CHARACTER_COUNT') {
      const fRes = frameCharacterCount(content, 8);
      framesCount = fRes.frames.length;
    } else if (framingTechnique === 'BYTE_STUFFING') {
      const fRes = frameByteStuffing(content, 'F', 'E', 8);
      framesCount = fRes.frames.length;
    } else {
      const fRes = frameBitStuffing(content, 4);
      framesCount = fRes.frames.length;
    }

    this.addEvent({
      id: `EV-FRAME-${Date.now()}`,
      timestamp: timeStr,
      type: 'FRAME_GEN',
      title: `Data Link Framing: ${framingTechnique}`,
      description: `Divided clinical payload into ${framesCount} discrete Data Link frames.`,
      source,
      destination,
      level: 'info',
    });

    // Step 3: CRC Calculation
    const crcRes = computeCrc(content, crcAlgorithm, simulateBitError ? 5 : null);

    this.addEvent({
      id: `EV-CRC-${Date.now()}`,
      timestamp: timeStr,
      type: 'CRC_CALC',
      title: `${crcAlgorithm} Checksum: ${crcRes.crcChecksumHex}`,
      description: simulateBitError
        ? `Intentional bit corruption injected in channel! Syndrome: ${crcRes.syndromeBinary}`
        : `Modulo-2 polynomial division verified zero syndrome.`,
      source,
      destination,
      level: simulateBitError ? 'warning' : 'info',
    });

    // Step 4: Transmission & ACK
    const retryCount = simulateBitError ? 1 : 0;
    const finalValid = crcRes.isValid;
    const finalLatency = Math.round(dijkstraRes.totalLatencyMs * 10) / 10;

    if (finalValid) {
      this.addEvent({
        id: `EV-DELIV-${Date.now()}`,
        timestamp: timeStr,
        type: 'DELIVERED',
        title: `Message Delivered via [${dijkstraRes.path.join(' -> ')}]`,
        description: `Delivered to ${destination}. Cumulative ACK received by ${source} in ${finalLatency}ms.`,
        source,
        destination,
        level: 'success',
      });
    } else {
      this.addEvent({
        id: `EV-REJ-${Date.now()}`,
        timestamp: timeStr,
        type: 'FRAME_REJECT',
        title: 'Corrupted Frame Rejected by Receiver',
        description: `CRC syndrome check failed at ${destination}. Frame dropped. Go-Back-N retransmission requested.`,
        source,
        destination,
        level: 'error',
      });
    }

    const newMsg: HospitalMessage = {
      id: `MSG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      source,
      destination,
      subject,
      content,
      priority,
      status: finalValid ? 'DELIVERED' : 'FAILED',
      route: dijkstraRes.path,
      totalCost: dijkstraRes.totalCost,
      framesCount,
      crcAlgorithm,
      crcValid: finalValid,
      retryCount,
      latencyMs: finalLatency,
    };

    this.messages = [newMsg, ...this.messages];
    this.notify();
    return newMsg;
  }

  public getStatistics(): MediNetStats {
    const total = this.messages.length;
    const delivered = this.messages.filter((m) => m.status === 'DELIVERED').length;
    const failed = this.messages.filter((m) => m.status === 'FAILED').length;
    const corrupted = this.messages.filter((m) => !m.crcValid).length;
    const retransmissions = this.messages.reduce((acc, m) => acc + m.retryCount, 0);

    const latencies = this.messages.filter((m) => m.status === 'DELIVERED').map((m) => m.latencyMs);
    const avgDelay = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 2.5;

    const pdr = total > 0 ? Math.round((delivered / total) * 1000) / 10 : 100;
    const activeNodes = this.departments.filter((d) => d.status === 'ONLINE').length;
    const activeLinks = this.links.filter((l) => l.enabled).length;

    return {
      totalMessages: total,
      deliveredMessages: delivered,
      failedMessages: failed,
      corruptedFrames: corrupted,
      lostFrames: failed,
      retransmissions,
      avgDelayMs: Math.round(avgDelay * 100) / 100,
      currentThroughputMbps: 142.8,
      packetDeliveryRatio: pdr,
      activeNodesCount: activeNodes,
      activeLinksCount: activeLinks,
    };
  }
}

export const clinicalStore = new MediNetStore();
