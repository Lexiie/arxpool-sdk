import { createHash } from "node:crypto";
import { ArxPoolError } from "./errors.js";
import { getConfig, type ArxPoolConfig } from "./client.js";
import { drainPoolCiphertexts, getPoolSnapshot } from "./collect.js";
import { derivePublicKey, signResult } from "./crypto.js";
import {
  computeOptionsSchema,
  poolSchema,
  type ComputeOptions,
  type SignedResult
} from "./types.js";

const hashCiphertexts = (ciphertexts: { ciphertext: string }[]): string => {
  const hash = createHash('sha256');
  for (const blob of ciphertexts) {
    hash.update(blob.ciphertext);
  }
  return hash.digest('hex');
};

const resolveSigningSecret = (mode: string, attesterSecret?: string, attesterKey?: string): string => {
  const candidate = mode === 'testnet' ? attesterKey ?? attesterSecret : attesterSecret ?? attesterKey;
  if (!candidate) {
    throw new ArxPoolError('CONFIG_MISSING', 'Attester key material is required to sign results');
  }
  return candidate;
};

const buildSignedResult = (payload: unknown, signingKey: string): SignedResult => ({
  payload,
  signature: signResult(payload, signingKey),
  signer_pubkey: derivePublicKey(signingKey)
});

const computeStub = (poolId: string, options: ComputeOptions, config: ArxPoolConfig): SignedResult => {
  const pool = getPoolSnapshot(poolId);
  const blobs = drainPoolCiphertexts(poolId);
  const signingKey = resolveSigningSecret(config.mode, config.attesterSecret, config.attesterKey);
  const payload = {
    pool_id: pool.id,
    mode: pool.mode,
    computed_at: new Date().toISOString(),
    participant_count: blobs.length,
    ciphertexts_digest: hashCiphertexts(blobs),
    metadata: {
      ...(pool.metadata ?? {}),
      ...(options.metadata ?? {})
    }
  };
  return buildSignedResult(payload, signingKey);
};

const computeTestnet = async (poolId: string, options: ComputeOptions, config: ArxPoolConfig): Promise<SignedResult> => {
  const signingKey = resolveSigningSecret(config.mode, config.attesterSecret, config.attesterKey);
  const url = new URL(`/api/v1/pools/${encodeURIComponent(poolId)}/compute`, config.node).toString();
  const body = options.metadata ? JSON.stringify({ metadata: options.metadata }) : undefined;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
  } catch (error) {
    throw new ArxPoolError('COMPUTE_SUBMISSION_FAILED', 'Failed to reach testnet compute endpoint', {
      cause: error,
      details: { poolId, url }
    });
  }

  if (!response.ok) {
    throw new ArxPoolError('COMPUTE_SUBMISSION_FAILED', `Compute request failed with HTTP ${response.status}`, {
      details: { poolId, url }
    });
  }

  const text = await response.text();
  let payload: unknown;
  if (!text) {
    payload = { pool_id: poolId, computed_at: new Date().toISOString() };
  } else {
    try {
      payload = JSON.parse(text);
    } catch (error) {
      throw new ArxPoolError('INVALID_INPUT', 'Received malformed JSON from compute endpoint', {
        cause: error,
        details: { poolId, url }
      });
    }
  }

  return buildSignedResult(payload, signingKey);
};

export const computePool = async (poolId: string, options?: ComputeOptions): Promise<SignedResult> => {
  const parsedPoolId = poolSchema.shape.id.parse(poolId);
  const parsedOptions = computeOptionsSchema.parse(options ?? {});
  const config = getConfig();
  if (config.mode === 'stub') {
    return computeStub(parsedPoolId, parsedOptions, config);
  }
  return computeTestnet(parsedPoolId, parsedOptions, config);
};
