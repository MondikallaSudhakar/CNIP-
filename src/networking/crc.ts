/**
 * MediNet - Cyclic Redundancy Check (CRC) Engine
 * Implements real modulo-2 binary polynomial division for CRC-8, CRC-16, and CRC-32.
 */

import { CrcResult, CrcStep } from '../types/network';

export interface PolynomialDef {
  name: string;
  degree: number;
  polyBinary: string; // Including leading 1 bit
  polyHex: string;
}

export const CRC_POLYNOMIALS: Record<'CRC-8' | 'CRC-16' | 'CRC-32', PolynomialDef> = {
  'CRC-8': {
    name: 'CRC-8 (ATM / ITU-T: x^8 + x^2 + x + 1)',
    degree: 8,
    polyBinary: '100000111',
    polyHex: '0x07',
  },
  'CRC-16': {
    name: 'CRC-16-CCITT (x^16 + x^12 + x^5 + 1)',
    degree: 16,
    polyBinary: '10001000000100001',
    polyHex: '0x1021',
  },
  'CRC-32': {
    name: 'CRC-32 (IEEE 802.3 / Ethernet)',
    degree: 32,
    polyBinary: '100000100110000010001110110110111',
    polyHex: '0x04C11DB7',
  },
};

/** Convert text string to binary string (8 bits per character) */
export function stringToBinary(text: string): string {
  return Array.from(text)
    .map((char) => char.charCodeAt(0).toString(2).padStart(8, '0'))
    .join('');
}

/** Convert binary string back to human-readable text */
export function binaryToString(binary: string): string {
  const clean = binary.replace(/[^01]/g, '');
  let text = '';
  for (let i = 0; i < clean.length; i += 8) {
    const byte = clean.slice(i, i + 8);
    if (byte.length === 8) {
      text += String.fromCharCode(parseInt(byte, 2));
    }
  }
  return text;
}

/** Modulo-2 binary XOR subtraction */
export function xorBits(a: string, b: string): string {
  let result = '';
  for (let i = 0; i < a.length; i++) {
    result += a[i] === b[i] ? '0' : '1';
  }
  return result;
}

/**
 * Modulo-2 Polynomial Division (Long Division)
 * Divides binary dividend by divisor, collecting step snapshots.
 */
export function modulo2Divide(
  dividend: string,
  divisor: string,
  maxSteps: number = 24
): { remainder: string; steps: CrcStep[] } {
  const divisorLen = divisor.length;
  let cur = dividend.slice(0, divisorLen);
  const steps: CrcStep[] = [];
  let stepIndex = 0;

  for (let i = divisorLen; i <= dividend.length; i++) {
    const isOne = cur[0] === '1';
    const activeDivisor = isOne ? divisor : '0'.repeat(divisorLen);
    const xorResult = xorBits(cur, activeDivisor);

    if (stepIndex < maxSteps) {
      steps.push({
        stepIndex: stepIndex + 1,
        dividendSnapshot: cur,
        divisorSnapshot: activeDivisor,
        quotientBit: isOne ? '1' : '0',
        xorResult: xorResult,
      });
    }
    stepIndex++;

    if (i < dividend.length) {
      cur = xorResult.slice(1) + dividend[i];
    } else {
      cur = xorResult.slice(1);
    }
  }

  return {
    remainder: cur,
    steps,
  };
}

/**
 * Full CRC Computation & Simulation
 */
export function computeCrc(
  message: string,
  algorithm: 'CRC-8' | 'CRC-16' | 'CRC-32' = 'CRC-8',
  corruptBitIndex: number | null = null
): CrcResult {
  const polyDef = CRC_POLYNOMIALS[algorithm];
  const binaryData = stringToBinary(message || 'MED');
  const degree = polyDef.degree;
  const polyBinary = polyDef.polyBinary;

  // Append degree zeros to binary data (M(x) * x^r)
  const paddedData = binaryData + '0'.repeat(degree);

  // Divide padded data by generator polynomial G(x)
  const { remainder: crcChecksumBinary, steps } = modulo2Divide(paddedData, polyBinary);

  // Form transmitted frame T(x) = M(x) * x^r + R(x)
  const transmittedFrame = binaryData + crcChecksumBinary;

  // Simulate transmission channel (optional intentional bit corruption)
  let receivedFrame = transmittedFrame;
  let isCorrupted = false;

  if (corruptBitIndex !== null && corruptBitIndex >= 0 && corruptBitIndex < transmittedFrame.length) {
    const bitArr = transmittedFrame.split('');
    bitArr[corruptBitIndex] = bitArr[corruptBitIndex] === '1' ? '0' : '1';
    receivedFrame = bitArr.join('');
    isCorrupted = true;
  }

  // Receiver verification: divide received frame by generator G(x)
  const { remainder: syndromeBinary } = modulo2Divide(receivedFrame, polyBinary);
  const isValid = !syndromeBinary.includes('1');

  // Hex representation of checksum
  let checksumHex = '';
  for (let i = 0; i < crcChecksumBinary.length; i += 4) {
    checksumHex += parseInt(crcChecksumBinary.slice(i, i + 4), 2).toString(16).toUpperCase();
  }

  return {
    algorithm,
    polynomialHex: polyDef.polyHex,
    polynomialBinary: polyDef.polyBinary,
    polynomialName: polyDef.name,
    originalData: message,
    binaryData,
    paddedData,
    crcChecksumBinary,
    crcChecksumHex: '0x' + checksumHex,
    transmittedFrame,
    receivedFrame,
    isCorrupted,
    corruptedBitIndex: corruptBitIndex ?? undefined,
    syndromeBinary,
    isValid,
    divisionSteps: steps,
  };
}
