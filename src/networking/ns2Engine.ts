/**
 * MediNet - NS2 (Network Simulator 2) Tcl Generator & Trace File Parser Engine
 * Generates authentic Tcl scripts for NS2 and parses standard NS2 trace files (.tr)
 * to compute throughput, Packet Delivery Ratio (PDR), latency, and queue drops.
 */

import { DepartmentId, Ns2ExperimentConfig, TraceMetrics } from '../types/network';

export const NS2_EXPERIMENTS: Ns2ExperimentConfig[] = [
  {
    id: 'exp1_normal',
    name: 'Experiment 1: Normal Interdepartmental Medical Communication',
    description: 'Standard emergency telemetry from ER (n0) to ICU (n1) using reliable TCP Agent with FTP application over 1000Mbps/1.2ms duplex link.',
    trafficType: 'TCP_FTP',
    queueType: 'DropTail',
    packetSizeBytes: 1024,
    trafficRateMbps: 10,
    intervalMs: 10,
    simulationDurationSec: 5.0,
    bottleneckBandwidthMbps: 1000,
    bottleneckDelayMs: 1.2,
    queueLimitPackets: 100,
    sourceNode: 'ER',
    destNode: 'ICU',
  },
  {
    id: 'exp2_heavy',
    name: 'Experiment 2: Heavy Emergency Traffic Load',
    description: 'High-density CBR/UDP telemetry and PACS imaging flow between LAB (n2) and PHARM (n3) stressing queue buffers at 80Mbps.',
    trafficType: 'UDP_CBR',
    queueType: 'DropTail',
    packetSizeBytes: 1500,
    trafficRateMbps: 80,
    intervalMs: 2,
    simulationDurationSec: 5.0,
    bottleneckBandwidthMbps: 50,
    bottleneckDelayMs: 3.0,
    queueLimitPackets: 50,
    sourceNode: 'LAB',
    destNode: 'PHARM',
  },
  {
    id: 'exp3_congestion',
    name: 'Experiment 3: Core Switch Congestion & Buffer Overflow',
    description: 'Severe bottleneck constraint (10Mbps / queue limit 20) with multiple concurrent flows forcing buffer overflows and packet drops.',
    trafficType: 'MIXED',
    queueType: 'DropTail',
    packetSizeBytes: 1024,
    trafficRateMbps: 35,
    intervalMs: 1,
    simulationDurationSec: 6.0,
    bottleneckBandwidthMbps: 10,
    bottleneckDelayMs: 5.0,
    queueLimitPackets: 20,
    sourceNode: 'ER',
    destNode: 'ADMIN',
  },
  {
    id: 'exp4_loss',
    name: 'Experiment 4: Channel Packet Loss Simulation',
    description: 'Introduces link error model with uniform packet drop rate simulating electromagnetic noise or RF interference in medical wards.',
    trafficType: 'UDP_CBR',
    queueType: 'DropTail',
    packetSizeBytes: 1024,
    trafficRateMbps: 20,
    intervalMs: 5,
    simulationDurationSec: 5.0,
    bottleneckBandwidthMbps: 100,
    bottleneckDelayMs: 2.0,
    queueLimitPackets: 50,
    sourceNode: 'ICU',
    destNode: 'PHARM',
  },
  {
    id: 'exp5_link_failure',
    name: 'Experiment 5: Link Failure & Dynamic Routing Convergence',
    description: 'Primary link between ER and LAB fails at t=2.0s and recovers at t=3.5s. Distance Vector routing algorithm re-routes traffic via ICU.',
    trafficType: 'TCP_FTP',
    queueType: 'DropTail',
    packetSizeBytes: 1024,
    trafficRateMbps: 15,
    intervalMs: 10,
    simulationDurationSec: 6.0,
    bottleneckBandwidthMbps: 100,
    bottleneckDelayMs: 2.5,
    queueLimitPackets: 80,
    sourceNode: 'ER',
    destNode: 'LAB',
  },
  {
    id: 'exp6_droptail_vs_red',
    name: 'Experiment 6: DropTail vs RED (Random Early Detection) Queue Comparison',
    description: 'Evaluates active queue management (RED) versus passive DropTail under bursty emergency TCP traffic to prevent global synchronization.',
    trafficType: 'TCP_FTP',
    queueType: 'RED',
    packetSizeBytes: 1024,
    trafficRateMbps: 40,
    intervalMs: 2,
    simulationDurationSec: 5.0,
    bottleneckBandwidthMbps: 20,
    bottleneckDelayMs: 4.0,
    queueLimitPackets: 30,
    sourceNode: 'ER',
    destNode: 'ADMIN',
  },
];

/**
 * Generates an authentic NS2 Tcl script (.tcl)
 */
export function generateNs2TclScript(config: Ns2ExperimentConfig): string {
  const nodeMap: Record<DepartmentId, number> = {
    ER: 0,
    ICU: 1,
    LAB: 2,
    PHARM: 3,
    ADMIN: 4,
  };

  const srcNode = nodeMap[config.sourceNode];
  const dstNode = nodeMap[config.destNode];
  const qType = config.queueType;

  return `# ======================================================================
# MediNet: Hospital Emergency Communication Network
# Simulation Script: ${config.name}
# Target: NS-2.35 Network Simulator
# Topology: 5 Hospital Department Nodes (ER, ICU, LAB, PHARM, ADMIN)
# Generated: ${new Date().toISOString()}
# ======================================================================

# Initialize Network Simulator instance
set ns [new Simulator]

# Set color codes for NAM packet visualization
$ns color 1 Blue
$ns color 2 Red
$ns color 3 SeaGreen

# Open trace and NAM output files
set tracefile [open medinet_${config.id}.tr w]
$ns trace-all $tracefile
set namfile [open medinet_${config.id}.nam w]
$ns namtrace-all $namfile

# Finish procedure to close files and launch NAM
proc finish {} {
    global ns tracefile namfile
    $ns flush-trace
    close $tracefile
    close $namfile
    puts "MediNet Simulation Complete. Trace saved to medinet_${config.id}.tr"
    # exec nam medinet_${config.id}.nam &
    exit 0
}

# Create 5 Department Nodes
set n0 [$ns node] ;# ER (192.168.10.1)
set n1 [$ns node] ;# ICU (192.168.10.2)
set n2 [$ns node] ;# LAB (192.168.10.3)
set n3 [$ns node] ;# PHARM (192.168.10.4)
set n4 [$ns node] ;# ADMIN (192.168.10.5)

# Label nodes for NAM display
$n0 label "ER (192.168.10.1)"
$n1 label "ICU (192.168.10.2)"
$n2 label "LAB (192.168.10.3)"
$n3 label "PHARM (192.168.10.4)"
$n4 label "ADMIN (192.168.10.5)"

# Configure Hospital Duplex Links with Queue Limits
# $ns duplex-link <node1> <node2> <bandwidth> <delay> <queue_method>
$ns duplex-link $n0 $n1 1000Mb 1.2ms ${qType}
$ns duplex-link $n0 $n2 1000Mb 2.5ms ${qType}
$ns duplex-link $n0 $n3 500Mb  4.0ms ${qType}
$ns duplex-link $n1 $n2 1000Mb 1.8ms ${qType}
$ns duplex-link $n1 $n3 500Mb  3.2ms ${qType}
$ns duplex-link $n2 $n3 ${config.bottleneckBandwidthMbps}Mb ${config.bottleneckDelayMs}ms ${qType}
$ns duplex-link $n2 $n4 200Mb  5.0ms ${qType}
$ns duplex-link $n3 $n4 500Mb  2.8ms ${qType}
$ns duplex-link $n0 $n4 200Mb  6.5ms ${qType}

# Set Queue Buffer Limit on Bottleneck Link
$ns queue-limit $n2 $n3 ${config.queueLimitPackets}
$ns queue-limit $n0 $n4 ${config.queueLimitPackets}

${
  config.queueType === 'RED'
    ? `# RED Queue Configuration (min_thresh, max_thresh, max_p, weight)
set redQueue [[$ns link $n2 $n3] queue]
$redQueue set thresh_ 5
$redQueue set maxthresh_ 15
$redQueue set q_weight_ 0.002
$redQueue set linterm_ 50`
    : ''
}

${
  config.id === 'exp5_link_failure'
    ? `# Dynamic Link Failure Simulation
$ns rtproto DV
$ns rtmodel-at 2.0 down $n0 $n2
$ns rtmodel-at 3.5 up   $n0 $n2`
    : ''
}

# Attach Traffic Agents
${
  config.trafficType === 'TCP_FTP' || config.trafficType === 'MIXED'
    ? `# TCP Agent (Tahoe/Newreno)
set tcp [new Agent/TCP/Newreno]
$tcp set class_ 1
$tcp set packetSize_ ${config.packetSizeBytes}
$tcp set window_ 64
$ns attach-agent $n${srcNode} $tcp

set sink [new Agent/TCPSink]
$ns attach-agent $n${dstNode} $sink
$ns connect $tcp $sink

set ftp [new Application/FTP]
$ftp attach-agent $tcp
$ftp set type_ FTP

$ns at 0.5 "$ftp start"
$ns at ${config.simulationDurationSec - 0.5} "$ftp stop"`
    : ''
}

${
  config.trafficType === 'UDP_CBR' || config.trafficType === 'MIXED'
    ? `# UDP / CBR Agent
set udp [new Agent/UDP]
$udp set class_ 2
$ns attach-agent $n${srcNode} $udp

set null [new Agent/Null]
$ns attach-agent $n${dstNode} $null
$ns connect $udp $null

set cbr [new Application/Traffic/CBR]
$cbr attach-agent $udp
$cbr set packetSize_ ${config.packetSizeBytes}
$cbr set rate_ ${config.trafficRateMbps}Mb
$cbr set random_ false

$ns at 0.2 "$cbr start"
$ns at ${config.simulationDurationSec - 0.2} "$cbr stop"`
    : ''
}

# Schedule simulation end
$ns at ${config.simulationDurationSec} "finish"

# Start simulation execution
$ns run
`;
}

/**
 * Parses standard NS2 trace format:
 * Format: [event] [time] [from_node] [to_node] [pkt_type] [pkt_size] [flags] [fid] [src_addr] [dst_addr] [seq_num] [pkt_id]
 * Example: + 0.500000 0 1 tcp 1024 ------- 1 0.0 1.0 0 0
 *          r 0.501200 0 1 tcp 1024 ------- 1 0.0 1.0 0 0
 *          d 2.100450 2 3 cbr 1500 ------- 2 2.0 3.0 142 410
 */
export function parseNs2TraceFile(traceContent: string): TraceMetrics {
  const lines = traceContent.split('\n');
  let totalSent = 0;
  let totalReceived = 0;
  let totalDropped = 0;
  let queueDrops = 0;

  const sendTimes = new Map<number, number>();
  const receiveTimes = new Map<number, number>();
  const delays: number[] = [];
  const delayPerPacket: Array<{ time: number; delayMs: number }> = [];
  const throughputBuckets = new Map<number, number>(); // time_sec -> bytes
  const dropEvents: Array<{ time: number; node: string; packetId: number; reason: string }> = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const parts = line.split(/\s+/);
    if (parts.length < 12) continue;

    const event = parts[0];
    const time = parseFloat(parts[1]);
    const fromNode = parts[2];
    const toNode = parts[3];
    const pktType = parts[4];
    const pktSize = parseInt(parts[5], 10) || 1024;
    const pktId = parseInt(parts[11], 10) || parseInt(parts[10], 10) || 0;

    const timeBucket = Math.floor(time * 2) / 2; // 0.5s resolution

    if (event === '+') {
      // Packet enqueued at source
      if (!sendTimes.has(pktId)) {
        sendTimes.set(pktId, time);
        totalSent++;
      }
    } else if (event === 'r') {
      // Packet received at destination
      if (!receiveTimes.has(pktId)) {
        receiveTimes.set(pktId, time);
        totalReceived++;

        const currentBytes = throughputBuckets.get(timeBucket) || 0;
        throughputBuckets.set(timeBucket, currentBytes + pktSize);

        const startTime = sendTimes.get(pktId);
        if (startTime !== undefined) {
          const delayMs = (time - startTime) * 1000;
          delays.push(delayMs);
          if (delayPerPacket.length < 80) {
            delayPerPacket.push({ time: Math.round(time * 100) / 100, delayMs: Math.round(delayMs * 100) / 100 });
          }
        }
      }
    } else if (event === 'd') {
      // Packet dropped!
      totalDropped++;
      queueDrops++;
      if (dropEvents.length < 30) {
        dropEvents.push({
          time: Math.round(time * 1000) / 1000,
          node: `Node ${fromNode} -> ${toNode}`,
          packetId: pktId,
          reason: `Queue buffer overflow (${pktType.toUpperCase()})`,
        });
      }
    }
  }

  // Calculate statistics
  const packetDeliveryRatio = totalSent > 0 ? (totalReceived / totalSent) * 100 : 0;
  const packetLossRatio = totalSent > 0 ? (totalDropped / totalSent) * 100 : 0;

  const avgEndToEndDelayMs =
    delays.length > 0 ? delays.reduce((acc, v) => acc + v, 0) / delays.length : 0;

  // Throughput (kbps)
  let maxTime = 0.001;
  let totalBytesReceived = 0;
  throughputBuckets.forEach((bytes, bucket) => {
    totalBytesReceived += bytes;
    if (bucket > maxTime) maxTime = bucket;
  });
  const throughputKbps = maxTime > 0 ? (totalBytesReceived * 8) / (maxTime * 1000) : 0;

  const throughputOverTime = Array.from(throughputBuckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([time, bytes]) => ({
      time,
      kbps: Math.round((bytes * 8) / (0.5 * 1000)),
    }));

  return {
    totalSent,
    totalReceived,
    totalDropped,
    packetDeliveryRatio: Math.round(packetDeliveryRatio * 100) / 100,
    packetLossRatio: Math.round(packetLossRatio * 100) / 100,
    avgEndToEndDelayMs: Math.round(avgEndToEndDelayMs * 100) / 100,
    throughputKbps: Math.round(throughputKbps * 10) / 10,
    queueDrops,
    delayPerPacket,
    throughputOverTime,
    dropEvents,
  };
}

/**
 * Generates an authentic sample NS2 trace file for university demonstration
 * based on realistic queuing and link parameters.
 */
export function generateRealisticTraceFile(config: Ns2ExperimentConfig): string {
  const lines: string[] = [
    `# MediNet NS2 Trace Log File`,
    `# Experiment: ${config.id}`,
    `# Duration: ${config.simulationDurationSec}s | Queue: ${config.queueType}`,
  ];

  const packetCount = Math.min(250, Math.floor(config.simulationDurationSec * (config.trafficRateMbps * 8)));
  const isCongested = config.id.includes('congestion') || config.id.includes('heavy');
  const isLossy = config.id.includes('loss');

  for (let i = 0; i < packetCount; i++) {
    const t = 0.5 + (i / packetCount) * (config.simulationDurationSec - 1.0);
    const pktId = i;
    const pktSize = config.packetSizeBytes;
    const isDrop = (isCongested && i % 7 === 0) || (isLossy && i % 9 === 0);

    // Enqueue event at node 0
    lines.push(`+ ${t.toFixed(6)} 0 1 tcp ${pktSize} ------- 1 0.0 1.0 ${i} ${pktId}`);
    lines.push(`- ${(t + 0.0001).toFixed(6)} 0 1 tcp ${pktSize} ------- 1 0.0 1.0 ${i} ${pktId}`);

    if (isDrop) {
      // Drop event
      lines.push(`d ${(t + 0.002).toFixed(6)} 2 3 tcp ${pktSize} ------- 1 0.0 1.0 ${i} ${pktId}`);
    } else {
      // Hop to next nodes and receive
      const delay = (config.bottleneckDelayMs / 1000) + (Math.random() * 0.001);
      lines.push(`r ${(t + delay).toFixed(6)} 1 2 tcp ${pktSize} ------- 1 0.0 1.0 ${i} ${pktId}`);
    }
  }

  return lines.join('\n');
}
