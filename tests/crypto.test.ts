import bs58 from 'bs58';
import { describe, expect, it } from 'vitest';
import { canonicalStringify, signerFromSecret, verifySig } from '../src/crypto.js';

const seed = new Uint8Array(32).fill(7);
const secret = bs58.encode(seed);

describe('crypto helpers', () => {
  it('canonicalizes object keys deterministically', () => {
    const left = canonicalStringify({ b: 2, a: 1 });
    const right = canonicalStringify({ a: 1, b: 2 });
    expect(left).toEqual(right);
  });

  it('produces deterministic signatures for the same payload', () => {
    const signer = signerFromSecret(secret);
    const payload = { poolId: 'test', count: 2 };
    const first = signer.sign(payload);
    const second = signer.sign({ count: 2, poolId: 'test' });
    expect(first.signature).toEqual(second.signature);
    expect(verifySig(payload, first.signature, signer.publicKey)).toBe(true);
  });
});
