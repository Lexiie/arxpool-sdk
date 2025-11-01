import bs58 from "bs58";
import { describe, expect, it } from "vitest";
import { canonicalStringify, derivePublicKey, signResult, verifyResult } from "../src/crypto.js";

const seed = Uint8Array.from({ length: 32 }, (_, idx) => idx + 1);
const secret = `ed25519:${bs58.encode(seed)}`;

describe('crypto helpers', () => {
  it('canonicalizes object keys deterministically', () => {
    const left = canonicalStringify({ b: 2, a: 1 });
    const right = canonicalStringify({ a: 1, b: 2 });
    expect(left).toEqual(right);
  });

  it('produces deterministic signatures for the same payload', () => {
    const payload = { poolId: 'test', count: 2 };
    const signatureA = signResult(payload, secret);
    const signatureB = signResult({ count: 2, poolId: 'test' }, secret);
    expect(signatureA).toEqual(signatureB);
    const publicKey = derivePublicKey(secret);
    expect(verifyResult(payload, signatureA, publicKey)).toBe(true);
  });
});
