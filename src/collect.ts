import { ArxPoolError } from './errors.js';
import { getConfig } from './client.js';
import {
  encryptedBlobSchema,
  poolInputSchema,
  poolSchema,
  type EncryptedBlob,
  type Pool,
  type PoolInput
} from './types.js';

interface BlobRecord extends EncryptedBlob {
  expiresAt: number;
}

const poolStore = new Map<string, Pool>();
const blobStore = new Map<string, BlobRecord[]>();

const NETWORK_ENABLED = process.env.ARXPOOL_ENABLE_NETWORK === 'true';

const pruneExpired = (poolId: string): BlobRecord[] => {
  const existing = blobStore.get(poolId) ?? [];
  const now = Date.now();
  const filtered = existing.filter((blob) => blob.expiresAt > now);
  blobStore.set(poolId, filtered);
  return filtered;
};

const dispatchCollector = async (path: string, payload: Record<string, unknown>) => {
  if (!NETWORK_ENABLED) {
    return;
  }
  const { apiBase } = getConfig();
  const url = new URL(path, apiBase).toString();
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new ArxPoolError('COLLECTOR_HTTP_ERROR', `Collector responded with HTTP ${response.status}`);
    }
  } catch (error) {
    throw new ArxPoolError('COLLECTOR_HTTP_ERROR', 'Failed to reach collector API', {
      cause: error,
      details: { url }
    });
  }
};

const ensurePoolExists = (poolId: string): Pool => {
  const pool = poolStore.get(poolId);
  if (!pool) {
    throw new ArxPoolError('POOL_NOT_FOUND', `Pool ${poolId} not found`);
  }
  return pool;
};

export const createPool = async (input: PoolInput): Promise<Pool> => {
  const parsed = poolInputSchema.parse(input);
  const createdAt = new Date().toISOString();
  const pool = poolSchema.parse({
    ...parsed,
    createdAt,
    ttlSeconds: parsed.ttlSeconds ?? 3600
  });
  poolStore.set(pool.id, pool);
  await dispatchCollector('/pools', {
    id: pool.id,
    mode: pool.mode,
    createdAt: pool.createdAt
  });
  return pool;
};

export const joinPool = async (poolId: string, blobInput: EncryptedBlob): Promise<EncryptedBlob> => {
  const poolIdValue = poolSchema.shape.id.parse(poolId);
  const pool = ensurePoolExists(poolIdValue);
  const timestamp = blobInput.timestamp ?? new Date().toISOString();
  const blob = encryptedBlobSchema.parse({ ...blobInput, timestamp });
  const ttlSeconds = blob.ttlSeconds ?? pool.ttlSeconds ?? 3600;
  const expiresAt = Date.now() + ttlSeconds * 1000;
  const record: BlobRecord = { ...blob, ttlSeconds, expiresAt };
  const retained = pruneExpired(poolIdValue);
  retained.push(record);
  blobStore.set(poolIdValue, retained);

  await dispatchCollector(`/pools/${encodeURIComponent(poolIdValue)}/join`, {
    poolId: poolIdValue,
    senderPubkey: blob.senderPubkey,
    ciphertext: blob.ciphertext
  });

  return blob;
};

export const getPoolSnapshot = (poolId: string): Pool => ensurePoolExists(poolSchema.shape.id.parse(poolId));

export const drainPoolCiphertexts = (poolId: string): EncryptedBlob[] => {
  const poolIdValue = poolSchema.shape.id.parse(poolId);
  const retained = pruneExpired(poolIdValue);
  blobStore.delete(poolIdValue);
  return retained;
};
