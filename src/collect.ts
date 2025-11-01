import { ArxPoolError } from "./errors.js";
import { getConfig } from "./client.js";
import {
  encryptedBlobSchema,
  poolInputSchema,
  poolSchema,
  type EncryptedBlob,
  type Pool,
  type PoolInput
} from "./types.js";

interface BlobRecord extends EncryptedBlob {
  expiresAt: number;
}

// In-memory stores keep stub mode fully local.
const poolStore = new Map<string, Pool>();
const blobStore = new Map<string, BlobRecord[]>();

const pruneExpired = (poolId: string): BlobRecord[] => {
  const existing = blobStore.get(poolId) ?? [];
  const now = Date.now();
  const filtered = existing.filter((blob) => blob.expiresAt > now);
  blobStore.set(poolId, filtered);
  return filtered;
};

const ensurePoolExists = (poolId: string): Pool => {
  const pool = poolStore.get(poolId);
  if (!pool) {
    throw new ArxPoolError('POOL_NOT_FOUND', `Pool ${poolId} not found`);
  }
  return pool;
};

const simulateCreatePool = (input: PoolInput): Pool => {
  const parsed = poolInputSchema.parse(input);
  const createdAt = new Date().toISOString();
  const ttlSeconds = parsed.ttlSeconds ?? 3600;
  const pool = poolSchema.parse({
    ...parsed,
    createdAt,
    ttlSeconds
  });
  poolStore.set(pool.id, pool);
  return pool;
};

const simulateJoinPool = (poolId: string, blobInput: EncryptedBlob): EncryptedBlob => {
  const pool = ensurePoolExists(poolId);
  const timestamp = blobInput.timestamp ?? new Date().toISOString();
  const ttlSeconds = blobInput.ttlSeconds ?? pool.ttlSeconds ?? 3600;
  const blob = encryptedBlobSchema.parse({
    ...blobInput,
    timestamp,
    ttlSeconds
  });
  const expiresAt = Date.now() + ttlSeconds * 1000;
  const record: BlobRecord = { ...blob, expiresAt };
  const retained = pruneExpired(poolId);
  retained.push(record);
  blobStore.set(poolId, retained);
  return blob;
};

const requestTestnet = async <T>(path: string, payload?: unknown): Promise<T | undefined> => {
  const { node } = getConfig();
  const url = new URL(path, node).toString();
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload ? JSON.stringify(payload) : undefined
    });
  } catch (error) {
    throw new ArxPoolError('COLLECTOR_HTTP_ERROR', 'Failed to reach testnet node', {
      cause: error,
      details: { url }
    });
  }

  if (!response.ok) {
    throw new ArxPoolError('COLLECTOR_HTTP_ERROR', `Testnet responded with HTTP ${response.status}`, {
      details: { url }
    });
  }

  const text = await response.text();
  if (!text) {
    return undefined;
  }
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new ArxPoolError('INVALID_INPUT', 'Received malformed JSON from testnet', {
      cause: error,
      details: { url }
    });
  }
};

export const createPool = async (input: PoolInput): Promise<Pool> => {
  const config = getConfig();
  if (config.mode === 'stub') {
    return simulateCreatePool(input);
  }
  const payload = poolInputSchema.parse(input);
  const result = await requestTestnet<Pool>('/api/v1/pools', payload);
  return (result ?? { ...payload, createdAt: new Date().toISOString() }) as Pool;
};

export const joinPool = async (poolId: string, blobInput: EncryptedBlob): Promise<EncryptedBlob> => {
  const parsedPoolId = poolSchema.shape.id.parse(poolId);
  const parsedBlob = encryptedBlobSchema.parse({ ...blobInput });
  const config = getConfig();
  if (config.mode === 'stub') {
    return simulateJoinPool(parsedPoolId, parsedBlob);
  }
  const result = await requestTestnet<EncryptedBlob>(
    `/api/v1/pools/${encodeURIComponent(parsedPoolId)}/join`,
    parsedBlob
  );
  return result ?? parsedBlob;
};

export const getPoolSnapshot = (poolId: string): Pool => ensurePoolExists(poolSchema.shape.id.parse(poolId));

export const drainPoolCiphertexts = (poolId: string): EncryptedBlob[] => {
  const poolIdValue = poolSchema.shape.id.parse(poolId);
  const retained = pruneExpired(poolIdValue);
  blobStore.delete(poolIdValue);
  return retained;
};
