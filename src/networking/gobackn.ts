/**
 * MediNet - Go-Back-N ARQ (Automatic Repeat reQuest) Engine
 * Implements sliding window reliable transmission protocol with cumulative ACKs,
 * sequence number arithmetic modulo 2^m, out-of-order rejection, timeouts,
 * and retransmission of all unacknowledged frames.
 */

import { GbnFrameEvent, GbnState } from '../types/network';

export function createInitialGbnState(
  windowSize: number = 4,
  sequenceModulo: number = 8,
  totalFrames: number = 8
): GbnState {
  const samplePayloads = [
    'PKT_0_BLOOD_MATCH_URGENT',
    'PKT_1_CROSSMATCH_AB_POS',
    'PKT_2_PLATELET_COUNT_LOW',
    'PKT_3_TRANSFUSION_ORDERED',
    'PKT_4_VITALS_STABLE_ICU',
    'PKT_5_PHARM_REQ_HEPARIN',
    'PKT_6_ADMIN_BED_CONFIRMED',
    'PKT_7_DISCHARGE_SUMMARY',
  ];

  return {
    sequenceModulo,
    windowSize,
    base: 0,
    nextSeqNum: 0,
    expectedSeq: 0,
    totalFramesToSend: totalFrames,
    currentFrameIndex: 0,
    frames: Array.from({ length: totalFrames }, (_, i) => ({
      seq: i % sequenceModulo,
      payload: samplePayloads[i % samplePayloads.length],
      state: 'unsent',
    })),
    activeTimers: [],
    receiverAccepted: [],
    retransmittedCount: 0,
    events: [
      {
        id: `ev-init-${Date.now()}`,
        timestamp: Date.now(),
        type: 'TX',
        frameSeq: 0,
        description: `Go-Back-N initialized: Window Size = ${windowSize}, Sequence Modulo = ${sequenceModulo}. Sender base = 0, Receiver expected = 0.`,
        windowState: { base: 0, next: 0 },
      },
    ],
    isComplete: false,
    isRunning: false,
  };
}

/**
 * Step in Go-Back-N simulation
 * Returns updated state and description of what occurred.
 */
export function stepGbnSimulation(
  state: GbnState,
  options: {
    loseSeqNumber?: number | null;
    corruptSeqNumber?: number | null;
    forceTimeout?: boolean;
  } = {}
): GbnState {
  if (state.isComplete) return state;

  const now = Date.now();
  const { windowSize, sequenceModulo, base, nextSeqNum, expectedSeq, frames, receiverAccepted } = state;
  const events = [...state.events];

  // 1. Check if all frames have been acknowledged
  if (base >= frames.length) {
    events.push({
      id: `ev-done-${now}`,
      timestamp: now,
      type: 'ACK_RX',
      frameSeq: (base - 1) % sequenceModulo,
      description: 'All frames successfully transmitted, verified, and acknowledged by receiver!',
      windowState: { base, next: nextSeqNum },
    });
    return {
      ...state,
      events,
      isComplete: true,
      isRunning: false,
    };
  }

  // 2. Check for Timeout on Base Frame (or forced timeout)
  const isTimedOut = options.forceTimeout || state.activeTimers.some((t) => now - t.startedAt > 4000);

  if (isTimedOut && nextSeqNum > base) {
    // Timeout! Go-Back-N triggers: retransmit from base to nextSeqNum - 1
    const unackedCount = nextSeqNum - base;
    const retransmittedSeqs: number[] = [];

    const updatedFrames = [...frames];
    for (let i = base; i < nextSeqNum; i++) {
      updatedFrames[i] = {
        ...updatedFrames[i],
        state: 'in_transit',
      };
      retransmittedSeqs.push(updatedFrames[i].seq);
    }

    events.push({
      id: `ev-timeout-${now}`,
      timestamp: now,
      type: 'TIMEOUT',
      frameSeq: frames[base].seq,
      description: `TIMEOUT: Timer expired for Frame ${frames[base].seq} (base index ${base}). Retransmitting all ${unackedCount} unacknowledged frames: [${retransmittedSeqs.join(', ')}].`,
      windowState: { base, next: nextSeqNum },
    });

    events.push({
      id: `ev-retransmit-${now + 1}`,
      timestamp: now + 1,
      type: 'RETRANSMIT',
      frameSeq: frames[base].seq,
      description: `GBN RETRANSMISSION: Frames ${retransmittedSeqs.join(', ')} re-queued in transit.`,
      windowState: { base, next: nextSeqNum },
    });

    // Reset timer for base
    return {
      ...state,
      frames: updatedFrames,
      events,
      activeTimers: [{ seq: frames[base].seq, startedAt: now, duration: 4000 }],
      retransmittedCount: state.retransmittedCount + unackedCount,
    };
  }

  // 3. Sender Transmission: Send next frame within window (nextSeqNum < base + windowSize)
  if (nextSeqNum < base + windowSize && nextSeqNum < frames.length) {
    const frameIdx = nextSeqNum;
    const frame = frames[frameIdx];
    const frameSeq = frame.seq;
    const updatedFrames = [...frames];

    // Check if user requested to lose this specific frame
    if (options.loseSeqNumber !== undefined && options.loseSeqNumber === frameSeq) {
      updatedFrames[frameIdx] = { ...frame, state: 'lost' };
      events.push({
        id: `ev-lost-${now}`,
        timestamp: now,
        type: 'LOST',
        frameSeq,
        description: `FRAME LOST IN TRANSIT: Frame ${frameSeq} dropped due to simulated channel link failure. Receiver will not receive this frame!`,
        windowState: { base, next: nextSeqNum + 1 },
      });

      return {
        ...state,
        nextSeqNum: nextSeqNum + 1,
        frames: updatedFrames,
        events,
        activeTimers:
          state.activeTimers.length === 0
            ? [{ seq: frames[base].seq, startedAt: now, duration: 4000 }]
            : state.activeTimers,
      };
    }

    // Normal or Corrupted transmission
    const isCorrupted = options.corruptSeqNumber !== undefined && options.corruptSeqNumber === frameSeq;
    updatedFrames[frameIdx] = { ...frame, state: isCorrupted ? 'corrupted' : 'in_transit' };

    events.push({
      id: `ev-tx-${now}`,
      timestamp: now,
      type: 'TX',
      frameSeq,
      description: `SENDER TX: Sent Frame ${frameSeq} (${frame.payload.slice(0, 20)}...). Window: [${base}..${Math.min(frames.length - 1, base + windowSize - 1)}].`,
      windowState: { base, next: nextSeqNum + 1 },
    });

    // Receiver evaluation
    const expectedModuloSeq = expectedSeq % sequenceModulo;

    if (isCorrupted) {
      events.push({
        id: `ev-corrupt-${now + 1}`,
        timestamp: now + 1,
        type: 'CORRUPTED',
        frameSeq,
        description: `CRC ERROR DETECTED: Frame ${frameSeq} corrupted by transmission noise. Discarded by receiver.`,
        windowState: { base, next: nextSeqNum + 1 },
      });
      return {
        ...state,
        nextSeqNum: nextSeqNum + 1,
        frames: updatedFrames,
        events,
        activeTimers:
          state.activeTimers.length === 0
            ? [{ seq: frames[base].seq, startedAt: now, duration: 4000 }]
            : state.activeTimers,
      };
    }

    if (frameSeq === expectedModuloSeq && frameIdx === expectedSeq) {
      // In-order frame received!
      const newExpected = expectedSeq + 1;
      const newReceiverAccepted = [...receiverAccepted, frameIdx];
      updatedFrames[frameIdx] = { ...updatedFrames[frameIdx], state: 'acked' };

      events.push({
        id: `ev-rx-${now + 1}`,
        timestamp: now + 1,
        type: 'RX',
        frameSeq,
        description: `RECEIVER ACCEPTED: Frame ${frameSeq} received in order. Delivered to upper layer.`,
        windowState: { base: newExpected, next: nextSeqNum + 1 },
      });

      events.push({
        id: `ev-ack-tx-${now + 2}`,
        timestamp: now + 2,
        type: 'ACK_TX',
        frameSeq,
        description: `CUMULATIVE ACK SENT: Receiver sent ACK ${frameSeq} (expecting Frame ${newExpected % sequenceModulo}).`,
        windowState: { base: newExpected, next: nextSeqNum + 1 },
      });

      // Window advances at sender
      return {
        ...state,
        base: newExpected,
        nextSeqNum: nextSeqNum + 1,
        expectedSeq: newExpected,
        frames: updatedFrames,
        receiverAccepted: newReceiverAccepted,
        events,
        // Restart timer if still outstanding frames
        activeTimers:
          newExpected < nextSeqNum + 1
            ? [{ seq: frames[newExpected].seq, startedAt: now, duration: 4000 }]
            : [],
      };
    } else {
      // Out-of-order frame!
      updatedFrames[frameIdx] = { ...updatedFrames[frameIdx], state: 'rejected' };
      events.push({
        id: `ev-ooo-${now + 1}`,
        timestamp: now + 1,
        type: 'OUT_OF_ORDER',
        frameSeq,
        description: `OUT-OF-ORDER FRAME REJECTED: Received Frame ${frameSeq}, but expected Frame ${expectedModuloSeq}. Discarding Frame ${frameSeq}!`,
        windowState: { base, next: nextSeqNum + 1 },
      });

      const lastValidAck = (expectedSeq - 1 + sequenceModulo) % sequenceModulo;
      events.push({
        id: `ev-dup-ack-${now + 2}`,
        timestamp: now + 2,
        type: 'ACK_TX',
        frameSeq: lastValidAck,
        description: `RESENDING DUP ACK ${lastValidAck}: Cumulative ACK remains at last in-order frame.`,
        windowState: { base, next: nextSeqNum + 1 },
      });

      return {
        ...state,
        nextSeqNum: nextSeqNum + 1,
        frames: updatedFrames,
        events,
        activeTimers:
          state.activeTimers.length === 0
            ? [{ seq: frames[base].seq, startedAt: now, duration: 4000 }]
            : state.activeTimers,
      };
    }
  }

  // 4. Window is currently full or waiting on timeout
  events.push({
    id: `ev-blocked-${now}`,
    timestamp: now,
    type: 'TIMEOUT',
    frameSeq: frames[base].seq,
    description: `WINDOW FULL: Sender window [${base}..${base + windowSize - 1}] is exhausted. Waiting for ACK or timeout.`,
    windowState: { base, next: nextSeqNum },
  });

  return {
    ...state,
    events,
  };
}
