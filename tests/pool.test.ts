import bs58 from "bs58";
import { afterEach, describe, expect, it, vi } from "vitest";
import { computePool, configure, createPool, joinPool } from "../src/index.js";

const buildSecret = (value: number) => {
  const seed = Uint8Array.from({ length: 32 }, () => value);
  return `ed25519:${bs58.encode(seed)}`;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('pool integration', () => {
  it('should run stub compute', async () => {
    configure({ mode: 'stub', attesterSecret: buildSecret(3) });
    const pool = await createPool({ id: 'demo-stub', mode: 'tally' });
    await joinPool(pool.id, {
      ciphertext: 'ciphertext-placeholder-value',
      senderPubkey: 'sender-public-key-placeholder-1234567890',
      ttlSeconds: 60
    });
    const result = await computePool(pool.id);
    expect(result.signature).toBeDefined();
    expect(typeof result.signer_pubkey).toBe('string');
  });

  it('should call testnet endpoint', async () => {
    const poolResponse = { id: 'demo2', mode: 'tally', createdAt: new Date().toISOString() };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(poolResponse)
    });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
    configure({ mode: 'testnet', node: 'https://testnet.arx.arcium.com', attesterKey: buildSecret(5) });
    const pool = await createPool({ id: 'demo2', mode: 'tally' });
    expect(pool.id).toBe('demo2');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://testnet.arx.arcium.com/api/v1/pools',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
