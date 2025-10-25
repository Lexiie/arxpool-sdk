import * as arciumClient from '@arcium-hq/client';
import { createHash } from 'node:crypto';
import { ArxPoolError } from './errors.js';
import { getConfig } from './client.js';
import { drainPoolCiphertexts, getPoolSnapshot } from './collect.js';
import { signerFromSecret, canonicalStringify } from './crypto.js';
import {
  computeOptionsSchema,
  signedResultSchema,
  tallyResultSchema,
  poolSchema,
  type ComputeOptions,
  type SignedResult,
  type TallyResult
} from './types.js';

interface RemoteJobHandle {
  jobId: string;
}

interface RemoteJobReceipt {
  job_commit?: string;
  jobCommit?: string;
  counts?: {
    participants?: number;
  };
}

interface RemoteJobClient {
  submitJob: (payload: Record<string, unknown>, opts?: Record<string, unknown>) => Promise<RemoteJobHandle>;
  waitForJob: (jobId: string, opts?: Record<string, unknown>) => Promise<RemoteJobReceipt>;
}

const resolveRemoteClient = (): RemoteJobClient | null => {
  const candidate = arciumClient as unknown as Partial<RemoteJobClient>;
  if (typeof candidate.submitJob === 'function' && typeof candidate.waitForJob === 'function') {
    return candidate as RemoteJobClient;
  }
  return null;
};

const hashPayload = (payload: unknown): string =>
  createHash('sha256').update(canonicalStringify(payload)).digest('hex');

const buildTally = (input: Omit<TallyResult, 'checksum'>): TallyResult =>
  tallyResultSchema.parse({
    ...input,
    checksum: hashPayload({
      poolId: input.poolId,
      mxeId: input.mxeId,
      jobCommitment: input.jobCommitment,
      participantCount: input.participantCount,
      computedAt: input.computedAt
    })
  });

export const computePool = async (poolId: string, options?: ComputeOptions): Promise<SignedResult> => {
  const parsedPoolId = poolSchema.shape.id.parse(poolId);
  const pool = getPoolSnapshot(parsedPoolId);
  const blobs = drainPoolCiphertexts(parsedPoolId);
  const config = getConfig(['mxeId', 'attesterSecret']);
  const parsedOptions = computeOptionsSchema.parse(options ?? {});
  const remoteClient = resolveRemoteClient();
  const dryRun = parsedOptions.dryRun ?? !remoteClient;

  if (!dryRun) {
    getConfig(['arciumApiKey']);
  }

  const payload = {
    poolId: pool.id,
    mxeId: config.mxeId,
    mode: pool.mode,
    blobCount: blobs.length,
    metadata: parsedOptions.metadata ?? {},
    submittedAt: new Date().toISOString()
  } satisfies Record<string, unknown>;

  let jobCommitment: string;
  let participantCount = blobs.length;

  if (!dryRun && remoteClient) {
    try {
      const job = await remoteClient.submitJob(payload, {
        apiKey: config.arciumApiKey,
        poolId: pool.id
      });
      const receipt = await remoteClient.waitForJob(job.jobId, {
        pollIntervalMs: parsedOptions.pollIntervalMs ?? 2000
      });
      jobCommitment = receipt.job_commit ?? receipt.jobCommit ?? job.jobId;
      participantCount = receipt.counts?.participants ?? participantCount;
    } catch (error) {
      throw new ArxPoolError('COMPUTE_SUBMISSION_FAILED', 'Failed to execute compute job', {
        cause: error,
        details: { poolId: pool.id }
      });
    }
  } else {
    jobCommitment = hashPayload(payload);
  }

  const computedAt = new Date().toISOString();
  const tally = buildTally({
    poolId: pool.id,
    mxeId: config.mxeId!,
    jobCommitment,
    participantCount,
    computedAt,
    summary: parsedOptions.metadata ?? {}
  });

  const signer = signerFromSecret(config.attesterSecret!);
  const envelope = signer.sign(tally);

  return signedResultSchema.parse({
    result: tally,
    signature: envelope.signature,
    publicKey: envelope.publicKey
  });
};
