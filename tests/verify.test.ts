import bs58 from 'bs58';
import { describe, expect, it } from 'vitest';
import { signerFromSecret } from '../src/crypto.js';
import { verifyResult } from '../src/verify.js';
import { tallyResultSchema } from '../src/types.js';

const seed = Uint8Array.from({ length: 32 }, (_, idx) => idx + 1);
const secret = bs58.encode(seed);

const buildSigned = () => {
  const tally = tallyResultSchema.parse({
    poolId: 'pool-test',
    mxeId: 'demo-mxe',
    jobCommitment: 'job-commit-demo-12345',
    participantCount: 3,
    computedAt: new Date().toISOString(),
    checksum: 'checksum-placeholder'
  });
  const signer = signerFromSecret(secret);
  const envelope = signer.sign(tally);
  return {
    result: tally,
    signature: envelope.signature,
    publicKey: envelope.publicKey
  };
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
