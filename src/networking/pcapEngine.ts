/**
 * MediNet - Wireshark PCAP (libpcap) Binary Generator & Inspector Engine
 * Produces genuine standard libpcap files that open directly in Wireshark, tcpdump, and tshark.
 * Decodes Ethernet, IPv4, TCP, UDP, and ICMP frames with header inspection and hex payload dump.
 */

import { ParsedPacket } from '../types/network';

/**
 * Calculates standard 16-bit Internet Checksum (RFC 1071)
 */
function calculateInternetChecksum(bytes: Uint8Array, offset: number, length: number): number {
  let sum = 0;
  for (let i = 0; i < length; i += 2) {
    if (i + 1 < length) {
      sum += (bytes[offset + i] << 8) | bytes[offset + i + 1];
    } else {
      sum += bytes[offset + i] << 8;
    }
  }
  while (sum >> 16) {
    sum = (sum & 0xffff) + (sum >> 16);
  }
  return ~sum & 0xffff;
}

/**
 * Converts IP address string (e.g. "192.168.10.1") to 4 bytes
 */
function ipToBytes(ip: string): [number, number, number, number] {
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0, parts[3] || 0];
}

/**
 * Generates a valid standard binary PCAP file containing realistic hospital emergency network packets.
 */
export function generateHospitalPcapBuffer(messageCount: number = 10): Uint8Array {
  const clinicalPackets: Array<{
    srcIp: string;
    dstIp: string;
    protocol: 'TCP' | 'UDP' | 'ICMP';
    srcPort: number;
    dstPort: number;
    payload: string;
    tcpFlags?: number;
  }> = [
    { srcIp: '192.168.10.1', dstIp: '192.168.10.2', protocol: 'TCP', srcPort: 49152, dstPort: 443, payload: 'HL7v2|MSH|^~\\&|ER_MONITOR|ICU_STATION|202611100445|STAT_CARDIAC_ALERT|PATIENT_90412', tcpFlags: 0x18 }, // PSH, ACK
    { srcIp: '192.168.10.2', dstIp: '192.168.10.3', protocol: 'TCP', srcPort: 49153, dstPort: 8080, payload: 'DICOM_REQ|PATIENT_90412|CT_ANGIOGRAPHY_CHEST|PRIORITY_EMERGENCY|URGENT_READ', tcpFlags: 0x18 },
    { srcIp: '192.168.10.3', dstIp: '192.168.10.2', protocol: 'TCP', srcPort: 8080, dstPort: 49153, payload: 'DICOM_RESP|PATIENT_90412|HEMOGLOBIN_7.2_G_DL|PLATELETS_85K|CRITICAL_VALUE', tcpFlags: 0x10 }, // ACK
    { srcIp: '192.168.10.1', dstIp: '192.168.10.4', protocol: 'UDP', srcPort: 514, dstPort: 514, payload: 'SYSLOG_MED|PHARMACY_REQUISITION|ORDER_ID_88201|O_NEG_PRBC_2_UNITS|VERIFIED' },
    { srcIp: '192.168.10.4', dstIp: '192.168.10.1', protocol: 'UDP', srcPort: 514, dstPort: 514, payload: 'SYSLOG_MED|PHARMACY_DISPENSED|ORDER_ID_88201|BLOOD_BANK_COOLER_A4_RELEASED' },
    { srcIp: '192.168.10.1', dstIp: '192.168.10.5', protocol: 'TCP', srcPort: 49154, dstPort: 8443, payload: 'REST_POST /api/v1/admissions|BED_OCCUPANCY|ICU_BED_04_ALLOCATED|DR_VAUGHN', tcpFlags: 0x18 },
    { srcIp: '192.168.10.5', dstIp: '192.168.10.1', protocol: 'TCP', srcPort: 8443, dstPort: 49154, payload: 'HTTP/1.1 200 OK|TRANSACTION_ID_ADMIN_7721|AUDIT_LOGGED_SECURELY', tcpFlags: 0x10 },
    { srcIp: '192.168.10.2', dstIp: '192.168.10.3', protocol: 'ICMP', srcPort: 0, dstPort: 0, payload: 'ECHO_REQUEST_DIAGNOSTIC_LINK_KEEPALIVE_NODE_LAB' },
    { srcIp: '192.168.10.3', dstIp: '192.168.10.2', protocol: 'ICMP', srcPort: 0, dstPort: 0, payload: 'ECHO_REPLY_DIAGNOSTIC_LINK_ACK_NODE_ICU' },
    { srcIp: '192.168.10.1', dstIp: '192.168.10.4', protocol: 'TCP', srcPort: 49155, dstPort: 5000, payload: 'TELEMETRY_HEART_RATE_MONITOR_142_BPM_VENTRICULAR_TACHYCARDIA', tcpFlags: 0x18 },
  ];

  // 1. Calculate buffer size
  const baseTimestampSec = Math.floor(Date.now() / 1000) - 120;
  const globalHeaderSize = 24;
  let totalSize = globalHeaderSize;

  const encodedPackets: Array<{
    sec: number;
    usec: number;
    rawPacket: Uint8Array;
  }> = [];

  for (let i = 0; i < Math.min(messageCount, clinicalPackets.length); i++) {
    const item = clinicalPackets[i];
    const payloadBytes = new TextEncoder().encode(item.payload);
    let l4HeaderSize = 20; // TCP default
    let protoNum = 6;     // TCP

    if (item.protocol === 'UDP') {
      l4HeaderSize = 8;
      protoNum = 17;
    } else if (item.protocol === 'ICMP') {
      l4HeaderSize = 8;
      protoNum = 1;
    }

    const ipTotalLen = 20 + l4HeaderSize + payloadBytes.length;
    const ethPacketLen = 14 + ipTotalLen;
    const packetBuf = new Uint8Array(ethPacketLen);
    const view = new DataView(packetBuf.buffer);

    // --- Ethernet II Header (14 bytes) ---
    // Dest MAC: 02:00:AA:01:00:02
    packetBuf[0] = 0x02; packetBuf[1] = 0x00; packetBuf[2] = 0xaa; packetBuf[3] = 0x01; packetBuf[4] = 0x00; packetBuf[5] = 0x02;
    // Src MAC: 02:00:AA:01:00:01
    packetBuf[6] = 0x02; packetBuf[7] = 0x00; packetBuf[8] = 0xaa; packetBuf[9] = 0x01; packetBuf[10] = 0x00; packetBuf[11] = 0x01;
    // EtherType: IPv4 (0x0800)
    view.setUint16(12, 0x0800, false);

    // --- IPv4 Header (20 bytes at offset 14) ---
    const ipOffset = 14;
    packetBuf[ipOffset] = 0x45; // Version 4, IHL 5 (20 bytes)
    packetBuf[ipOffset + 1] = 0x00; // DSCP / ECN
    view.setUint16(ipOffset + 2, ipTotalLen, false);
    view.setUint16(ipOffset + 4, 0x1000 + i, false); // Identification
    view.setUint16(ipOffset + 6, 0x4000, false); // Don't fragment flag
    packetBuf[ipOffset + 8] = 64; // TTL
    packetBuf[ipOffset + 9] = protoNum; // Protocol
    view.setUint16(ipOffset + 10, 0x0000, false); // Zero checksum initially

    const srcIpBytes = ipToBytes(item.srcIp);
    const dstIpBytes = ipToBytes(item.dstIp);
    packetBuf[ipOffset + 12] = srcIpBytes[0];
    packetBuf[ipOffset + 13] = srcIpBytes[1];
    packetBuf[ipOffset + 14] = srcIpBytes[2];
    packetBuf[ipOffset + 15] = srcIpBytes[3];
    packetBuf[ipOffset + 16] = dstIpBytes[0];
    packetBuf[ipOffset + 17] = dstIpBytes[1];
    packetBuf[ipOffset + 18] = dstIpBytes[2];
    packetBuf[ipOffset + 19] = dstIpBytes[3];

    // Compute IPv4 checksum
    const ipChecksum = calculateInternetChecksum(packetBuf, ipOffset, 20);
    view.setUint16(ipOffset + 10, ipChecksum, false);

    // --- Transport Header & Payload (offset 34) ---
    const l4Offset = 34;

    if (item.protocol === 'TCP') {
      view.setUint16(l4Offset, item.srcPort, false);
      view.setUint16(l4Offset + 2, item.dstPort, false);
      view.setUint32(l4Offset + 4, 1000000 + i * 500, false); // Sequence number
      view.setUint32(l4Offset + 8, 500000 + i * 300, false);  // Ack number
      packetBuf[l4Offset + 12] = 0x50; // Data offset: 5 (20 bytes)
      packetBuf[l4Offset + 13] = item.tcpFlags || 0x18; // Flags
      view.setUint16(l4Offset + 14, 64240, false); // Window size
      view.setUint16(l4Offset + 16, 0x3a4b, false); // TCP Checksum
      view.setUint16(l4Offset + 18, 0x0000, false); // Urgent pointer

      packetBuf.set(payloadBytes, l4Offset + 20);
    } else if (item.protocol === 'UDP') {
      view.setUint16(l4Offset, item.srcPort, false);
      view.setUint16(l4Offset + 2, item.dstPort, false);
      view.setUint16(l4Offset + 4, 8 + payloadBytes.length, false);
      view.setUint16(l4Offset + 6, 0x0000, false); // Optional UDP Checksum

      packetBuf.set(payloadBytes, l4Offset + 8);
    } else {
      // ICMP
      packetBuf[l4Offset] = 8; // Echo request
      packetBuf[l4Offset + 1] = 0; // Code 0
      view.setUint16(l4Offset + 2, 0x0000, false); // Checksum
      view.setUint16(l4Offset + 4, 0x0001, false); // Identifier
      view.setUint16(l4Offset + 6, i + 1, false);  // Sequence number
      packetBuf.set(payloadBytes, l4Offset + 8);

      const icmpChecksum = calculateInternetChecksum(packetBuf, l4Offset, 8 + payloadBytes.length);
      view.setUint16(l4Offset + 2, icmpChecksum, false);
    }

    const sec = baseTimestampSec + i * 4;
    const usec = (i * 123456) % 1000000;

    encodedPackets.push({ sec, usec, rawPacket: packetBuf });
    totalSize += 16 + packetBuf.length;
  }

  // 2. Build final PCAP byte buffer
  const pcapBuffer = new Uint8Array(totalSize);
  const pcapView = new DataView(pcapBuffer.buffer);

  // Global Header (24 bytes)
  pcapView.setUint32(0, 0xa1b2c3d4, false); // Magic Number (Big-endian / standard)
  pcapView.setUint16(4, 2, false);          // Version major
  pcapView.setUint16(6, 4, false);          // Version minor
  pcapView.setInt32(8, 0, false);           // Thiszone (GMT)
  pcapView.setUint32(12, 0, false);         // Sigfigs
  pcapView.setUint32(16, 65535, false);     // Snaplen
  pcapView.setUint32(20, 1, false);         // LinkType: LINKTYPE_ETHERNET (1)

  let writePos = 24;

  for (const pkt of encodedPackets) {
    const len = pkt.rawPacket.length;
    // Packet Header (16 bytes)
    pcapView.setUint32(writePos, pkt.sec, false);
    pcapView.setUint32(writePos + 4, pkt.usec, false);
    pcapView.setUint32(writePos + 8, len, false);  // Incl len
    pcapView.setUint32(writePos + 12, len, false); // Orig len
    writePos += 16;

    // Packet Data
    pcapBuffer.set(pkt.rawPacket, writePos);
    writePos += len;
  }

  return pcapBuffer;
}

/**
 * Parses PCAP buffer into human-readable Wireshark inspector table rows
 */
export function parsePcapBuffer(buffer: Uint8Array): ParsedPacket[] {
  if (buffer.length < 24) return [];

  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const magic = view.getUint32(0, false);
  const isLittleEndian = magic === 0xd4c3b2a1;

  let offset = 24;
  let packetId = 1;
  const packets: ParsedPacket[] = [];

  while (offset + 16 <= buffer.length) {
    const sec = view.getUint32(offset, isLittleEndian);
    const usec = view.getUint32(offset + 4, isLittleEndian);
    const inclLen = view.getUint32(offset + 8, isLittleEndian);
    offset += 16;

    if (offset + inclLen > buffer.length) break;

    const pktData = buffer.subarray(offset, offset + inclLen);
    offset += inclLen;

    // Decode Ethernet & IP
    if (pktData.length < 34) continue;

    const etherType = (pktData[12] << 8) | pktData[13];
    if (etherType !== 0x0800) continue; // Only IPv4 for now

    const ipOffset = 14;
    const protoNum = pktData[ipOffset + 9];
    const srcIp = `${pktData[ipOffset + 12]}.${pktData[ipOffset + 13]}.${pktData[ipOffset + 14]}.${pktData[ipOffset + 15]}`;
    const dstIp = `${pktData[ipOffset + 16]}.${pktData[ipOffset + 17]}.${pktData[ipOffset + 18]}.${pktData[ipOffset + 19]}`;

    let protocol: 'TCP' | 'UDP' | 'ICMP' = 'TCP';
    let srcPort = 0;
    let dstPort = 0;
    let tcpFlags: ParsedPacket['tcpFlags'] = undefined;
    let seqNumber: number | undefined = undefined;
    let ackNumber: number | undefined = undefined;
    let payloadOffset = 34;

    const pktView = new DataView(pktData.buffer, pktData.byteOffset, pktData.byteLength);

    if (protoNum === 6) {
      protocol = 'TCP';
      srcPort = pktView.getUint16(34, false);
      dstPort = pktView.getUint16(36, false);
      seqNumber = pktView.getUint32(38, false);
      ackNumber = pktView.getUint32(42, false);
      const flagsByte = pktData[47];
      tcpFlags = {
        syn: Boolean(flagsByte & 0x02),
        ack: Boolean(flagsByte & 0x10),
        fin: Boolean(flagsByte & 0x01),
        rst: Boolean(flagsByte & 0x04),
        psh: Boolean(flagsByte & 0x08),
      };
      const dataOffset = (pktData[46] >> 4) * 4;
      payloadOffset = 14 + 20 + dataOffset;
    } else if (protoNum === 17) {
      protocol = 'UDP';
      srcPort = pktView.getUint16(34, false);
      dstPort = pktView.getUint16(36, false);
      payloadOffset = 34 + 8;
    } else if (protoNum === 1) {
      protocol = 'ICMP';
      payloadOffset = 34 + 8;
    }

    const payloadBytes = pktData.subarray(Math.min(payloadOffset, pktData.length));
    let asciiPayload = '';
    let hexDump = '';

    for (let i = 0; i < pktData.length; i++) {
      hexDump += pktData[i].toString(16).padStart(2, '0') + (i % 16 === 15 ? '\n' : ' ');
    }

    for (let i = 0; i < payloadBytes.length; i++) {
      const b = payloadBytes[i];
      asciiPayload += b >= 32 && b <= 126 ? String.fromCharCode(b) : '.';
    }

    const date = new Date(sec * 1000 + Math.floor(usec / 1000));
    const timestamp = date.toISOString().split('T')[1].replace('Z', '');

    packets.push({
      id: packetId++,
      timestamp,
      sourceIp: srcIp,
      destIp: dstIp,
      protocol,
      length: pktData.length,
      sourcePort: srcPort,
      destPort: dstPort,
      tcpFlags,
      seqNumber,
      ackNumber,
      hexDump: hexDump.trim(),
      asciiPayload: asciiPayload || '[No application payload]',
      summary: `${protocol} ${srcPort ? srcPort + ' -> ' + dstPort : ''} Len=${pktData.length} ${
        tcpFlags?.syn ? '[SYN] ' : ''
      }${tcpFlags?.ack ? '[ACK] ' : ''}${tcpFlags?.psh ? '[PSH] ' : ''}`,
    });
  }

  return packets;
}
