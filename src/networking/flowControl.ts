/**
 * MediNet - Sliding Window Flow Control Engine
 * Demonstrates sender/receiver buffer synchronization, sequence number tracking,
 * and prevention of receiver buffer overflow.
 */

import { SlidingWindowState } from '../types/network';

export function createInitialFlowState(
  windowSize: number = 4,
  bufferCapacity: number = 8,
  totalFrames: number = 12
): SlidingWindowState {
  const sampleData = [
    'VITALS_BP_120_80',
    'HEART_RATE_78BPM',
    'O2_SAT_99_PCT',
    'TEMP_37_2C',
    'BLOOD_GLUCOSE_105',
    'ECG_SINUS_RHYTHM',
    'LAB_CBC_NORMAL',
    'MED_IV_NORMAL_SALINE',
    'VENT_PEEP_5_CMH2O',
    'URINE_OUT_50ML_HR',
    'GCS_15_ALERT',
    'DISCHARGE_PENDING',
  ];

  return {
    windowSize,
    bufferCapacity,
    baseSeq: 0,
    nextSeqNum: 0,
    expectedSeqNum: 0,
    frames: Array.from({ length: totalFrames }, (_, i) => ({
      seq: i,
      data: sampleData[i % sampleData.length],
      status: 'unsent',
    })),
    receiverBuffer: [],
    acknowledgedCount: 0,
    bufferedCount: 0,
    overflowPrevented: true,
  };
}

/**
 * Transmits the next available frame within current window limit
 */
export function sendNextFrame(state: SlidingWindowState): SlidingWindowState {
  const { windowSize, bufferCapacity, baseSeq, nextSeqNum, frames, receiverBuffer } = state;

  // Flow control check: Cannot send if window limit is reached or receiver buffer would overflow
  const inFlightCount = nextSeqNum - baseSeq;
  if (inFlightCount >= windowSize || nextSeqNum >= frames.length) {
    return state;
  }

  // Prevent receiver buffer overflow
  if (receiverBuffer.length >= bufferCapacity) {
    return {
      ...state,
      overflowPrevented: true,
    };
  }

  const updatedFrames = [...frames];
  updatedFrames[nextSeqNum] = {
    ...updatedFrames[nextSeqNum],
    status: 'in-flight',
    sentTimestamp: Date.now(),
  };

  return {
    ...state,
    nextSeqNum: nextSeqNum + 1,
    frames: updatedFrames,
  };
}

/**
 * Receiver processes in-flight frame and delivers ACK to sender
 */
export function receiveAndAckFrame(state: SlidingWindowState): SlidingWindowState {
  const { frames, baseSeq, nextSeqNum, expectedSeqNum, receiverBuffer } = state;

  if (baseSeq >= nextSeqNum) return state; // Nothing in flight

  // Find oldest in-flight frame
  const targetFrame = frames[expectedSeqNum];
  if (!targetFrame || targetFrame.status !== 'in-flight') return state;

  const updatedFrames = [...frames];
  updatedFrames[expectedSeqNum] = {
    ...updatedFrames[expectedSeqNum],
    status: 'acked',
    ackTimestamp: Date.now(),
  };

  const newBuffer = [...receiverBuffer, targetFrame.data];

  return {
    ...state,
    baseSeq: expectedSeqNum + 1,
    expectedSeqNum: expectedSeqNum + 1,
    frames: updatedFrames,
    receiverBuffer: newBuffer,
    acknowledgedCount: state.acknowledgedCount + 1,
    bufferedCount: newBuffer.length,
  };
}

/**
 * Consumer reads from receiver buffer, freeing space
 */
export function drainReceiverBuffer(state: SlidingWindowState): SlidingWindowState {
  if (state.receiverBuffer.length === 0) return state;
  return {
    ...state,
    receiverBuffer: state.receiverBuffer.slice(1),
    bufferedCount: Math.max(0, state.receiverBuffer.length - 1),
  };
}
