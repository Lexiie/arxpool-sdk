import { z } from "zod";

export type Mode = "stub" | "testnet";

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

export const computeOptionsSchema = z
  .object({
    metadata: z.record(z.string(), z.unknown()).optional()
  })
  .default({});

export const signedResultSchema = z.object({
  payload: z.unknown(),
  signature: z.string().min(32),
  signer_pubkey: z.string().min(32)
});

export type Pool = z.infer<typeof poolSchema>;
export type PoolInput = z.infer<typeof poolInputSchema>;
export type EncryptedBlob = z.infer<typeof encryptedBlobSchema>;
export type ComputeOptions = z.infer<typeof computeOptionsSchema>;
export type SignedResult = z.infer<typeof signedResultSchema>;
