/**
 * MediNet - Data Link Layer Framing Laboratory Engine
 * Implements Character Count, Byte Stuffing, and Bit Stuffing with genuine encoding and decoding.
 */

import { FramingResult } from '../types/network';
import { stringToBinary, binaryToString } from './crc';

/**
 * Character Count Framing
 * Prepends total frame size (including count character itself) to each frame chunk.
 */
export function frameCharacterCount(text: string, chunkSize: number = 4): FramingResult {
  const original = text || 'ER_URGENT';
  const frames: FramingResult['frames'] = [];
  let index = 0;
  let frameNum = 1;
  const originalBinary = stringToBinary(original);

  while (index < original.length) {
    const rawPayload = original.slice(index, index + chunkSize);
    const totalCount = rawPayload.length + 1; // +1 for the count header character
    const encodedFrame = `${totalCount}${rawPayload}`;
    const encodedBinary = stringToBinary(encodedFrame);

    frames.push({
      frameNumber: frameNum++,
      rawPayload,
      encodedFrame,
      encodedBinary,
      frameSize: totalCount,
      overheadBytes: 1,
    });

    index += chunkSize;
  }

  // Receiver-side extraction
  let extracted = '';
  let stream = frames.map((f) => f.encodedFrame).join('');
  let readIdx = 0;
  let valid = true;

  while (readIdx < stream.length) {
    const countChar = stream[readIdx];
    const count = parseInt(countChar, 10);
    if (isNaN(count) || count <= 1 || readIdx + count > stream.length) {
      valid = false;
      break;
    }
    extracted += stream.slice(readIdx + 1, readIdx + count);
    readIdx += count;
  }

  return {
    technique: 'CHARACTER_COUNT',
    originalText: original,
    originalBinary,
    frames,
    stuffedDataDisplay: frames.map((f) => `[Len:${f.frameSize}|${f.rawPayload}]`).join(' '),
    extractedText: extracted,
    extractionValid: valid && extracted === original,
    notes: 'Character Count embeds the total frame length (header + payload) at the start of each frame. Vulnerable to framing synchronization loss if count byte is corrupted.',
  };
}

/**
 * Byte Stuffing (Character-Oriented Framing)
 * Uses [FLAG] delimiters (e.g. 'F') and [ESC] escape characters (e.g. 'E').
 */
export function frameByteStuffing(
  text: string,
  flagChar: string = 'F',
  escChar: string = 'E',
  chunkSize: number = 6
): FramingResult {
  const original = text || 'ICU_LAB_ALERT';
  const originalBinary = stringToBinary(original);
  const frames: FramingResult['frames'] = [];
  let index = 0;
  let frameNum = 1;

  while (index < original.length) {
    const rawPayload = original.slice(index, index + chunkSize);
    let stuffed = '';
    let stuffedCount = 0;

    for (const ch of rawPayload) {
      if (ch === flagChar || ch === escChar) {
        stuffed += escChar + ch;
        stuffedCount++;
      } else {
        stuffed += ch;
      }
    }

    const encodedFrame = `${flagChar}${stuffed}${flagChar}`;
    const encodedBinary = stringToBinary(encodedFrame);

    frames.push({
      frameNumber: frameNum++,
      rawPayload,
      encodedFrame,
      encodedBinary,
      frameSize: encodedFrame.length,
      overheadBytes: 2 + stuffedCount,
      stuffedFlagsCount: stuffedCount,
    });

    index += chunkSize;
  }

  // Receiver-side destuffing
  let extracted = '';
  for (const f of frames) {
    const frameContent = f.encodedFrame;
    if (frameContent.startsWith(flagChar) && frameContent.endsWith(flagChar)) {
      const inner = frameContent.slice(1, -1);
      let i = 0;
      while (i < inner.length) {
        if (inner[i] === escChar && i + 1 < inner.length) {
          extracted += inner[i + 1];
          i += 2;
        } else {
          extracted += inner[i];
          i++;
        }
      }
    }
  }

  return {
    technique: 'BYTE_STUFFING',
    originalText: original,
    originalBinary,
    frames,
    stuffedDataDisplay: frames.map((f) => f.encodedFrame).join(' '),
    extractedText: extracted,
    extractionValid: extracted === original,
    notes: `Byte stuffing surrounds payload with ${flagChar} (FLAG) and escapes accidental occurrences of ${flagChar} or ${escChar} with ${escChar} (ESC).`,
  };
}

/**
 * Bit Stuffing (Bit-Oriented Framing - HDLC / SDLC Protocol)
 * Delimiter flag: 01111110 (six 1s).
 * Whenever five consecutive 1s occur in data, sender inserts a '0'.
 * Receiver removes '0' after five consecutive 1s.
 */
export function frameBitStuffing(text: string, chunkSizeChars: number = 4): FramingResult {
  const original = text || 'PHARM_STAT';
  const originalBinary = stringToBinary(original);
  const FLAG = '01111110';
  const frames: FramingResult['frames'] = [];
  const chunkBitSize = chunkSizeChars * 8;
  let bitIndex = 0;
  let frameNum = 1;

  while (bitIndex < originalBinary.length) {
    const rawBits = originalBinary.slice(bitIndex, bitIndex + chunkBitSize);
    let stuffedBits = '';
    let consecutiveOnes = 0;
    let stuffedZeroCount = 0;

    for (let i = 0; i < rawBits.length; i++) {
      const bit = rawBits[i];
      stuffedBits += bit;
      if (bit === '1') {
        consecutiveOnes++;
        if (consecutiveOnes === 5) {
          stuffedBits += '0'; // Insert zero bit
          stuffedZeroCount++;
          consecutiveOnes = 0;
        }
      } else {
        consecutiveOnes = 0;
      }
    }

    const fullFrameBinary = FLAG + stuffedBits + FLAG;
    const rawPayload = binaryToString(rawBits);

    frames.push({
      frameNumber: frameNum++,
      rawPayload,
      encodedFrame: `[FLAG]${stuffedBits}[FLAG]`,
      encodedBinary: fullFrameBinary,
      frameSize: fullFrameBinary.length,
      overheadBytes: Math.ceil((16 + stuffedZeroCount) / 8),
      stuffedFlagsCount: stuffedZeroCount,
    });

    bitIndex += chunkBitSize;
  }

  // Receiver-side bit destuffing
  let destuffedBitsTotal = '';
  for (const f of frames) {
    const binary = f.encodedBinary;
    // Strip leading and trailing 8-bit flags
    const dataStream = binary.slice(8, binary.length - 8);
    let destuffed = '';
    let ones = 0;

    for (let i = 0; i < dataStream.length; i++) {
      const bit = dataStream[i];
      destuffed += bit;
      if (bit === '1') {
        ones++;
        if (ones === 5) {
          // The next bit should be the stuffed '0' - skip it
          if (i + 1 < dataStream.length && dataStream[i + 1] === '0') {
            i++; // skip stuffed zero
          }
          ones = 0;
        }
      } else {
        ones = 0;
      }
    }
    destuffedBitsTotal += destuffed;
  }

  const extractedText = binaryToString(destuffedBitsTotal);

  return {
    technique: 'BIT_STUFFING',
    originalText: original,
    originalBinary,
    frames,
    stuffedDataDisplay: frames.map((f) => f.encodedBinary).join(' '),
    extractedText,
    extractionValid: extractedText === original,
    notes: 'HDLC Bit Stuffing inserts a 0 bit whenever five consecutive 1s (11111) are observed in payload bits to prevent false detection of delimiter flag 01111110.',
  };
}
