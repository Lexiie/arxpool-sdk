import { z } from 'zod';

export const poolModeSchema = z.enum(['tally', 'compute']);

export const poolSchema = z.object({
  id: z.string().min(3).max(128),
  mode: poolModeSchema,
  description: z.string().max(256).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().datetime(),
  ttlSeconds: z.number().int().positive().max(604800).optional()
});

export const poolInputSchema = poolSchema.omit({ createdAt: true });

export const encryptedBlobSchema = z.object({
  ciphertext: z.string().min(16),
  senderPubkey: z.string().min(32),
  nonce: z.string().min(16).optional(),
  timestamp: z.string().datetime().optional(),
  ttlSeconds: z.number().int().positive().max(604800).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const tallyResultSchema = z.object({
  poolId: z.string().min(3),
  mxeId: z.string().min(1),
  jobCommitment: z.string().min(16),
  participantCount: z.number().int().nonnegative(),
  computedAt: z.string().datetime(),
  checksum: z.string().min(16),
  summary: z.record(z.string(), z.unknown()).optional()
});

export const signedResultSchema = z.object({
  result: tallyResultSchema,
  signature: z.string().min(32),
  publicKey: z.string().min(32)
});

export const computeOptionsSchema = z
  .object({
    metadata: z.record(z.string(), z.unknown()).optional(),
    dryRun: z.boolean().optional(),
    pollIntervalMs: z.number().int().min(250).max(60000).optional()
  })
  .default({});

export type Pool = z.infer<typeof poolSchema>;
export type PoolInput = z.infer<typeof poolInputSchema>;
export type EncryptedBlob = z.infer<typeof encryptedBlobSchema>;
export type TallyResult = z.infer<typeof tallyResultSchema>;
export type SignedResult = z.infer<typeof signedResultSchema>;
export type ComputeOptions = z.infer<typeof computeOptionsSchema>;
