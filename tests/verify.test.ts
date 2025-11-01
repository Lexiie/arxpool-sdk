import bs58 from "bs58";
import { describe, expect, it } from "vitest";
import { derivePublicKey, signResult } from "../src/crypto.js";
import { verifyResult } from "../src/verify.js";

const seed = Uint8Array.from({ length: 32 }, (_, idx) => idx + 7);
const secret = `ed25519:${bs58.encode(seed)}`;

const buildSigned = () => {
  const payload = {
    pool_id: 'pool-test',
    computed_at: new Date().toISOString(),
    participant_count: 3,
    ciphertexts_digest: 'digest-placeholder'
  };
  const signature = signResult(payload, secret);
  const signerPubkey = derivePublicKey(secret);
  return { payload, signature, signer_pubkey: signerPubkey };
};

describe('verifyResult', () => {
  it('returns true for a valid signature', () => {
    const signed = buildSigned();
    expect(verifyResult(signed)).toBe(true);
  });

  it('returns false when signature is tampered', () => {
    const signed = buildSigned();
    const lastChar = signed.signature.at(-1) ?? '1';
    const tamperedChar = lastChar === '1' ? '2' : '1';
    signed.signature = `${signed.signature.slice(0, -1)}${tamperedChar}`;
    expect(verifyResult(signed)).toBe(false);
  });

  it('throws on invalid payload shape', () => {
    // @ts-expect-error - intentionally malformed payload
    expect(() => verifyResult({})).toThrow('Signed result payload is invalid');
  });
});
