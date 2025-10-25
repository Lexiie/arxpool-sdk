import { ArxPoolError } from './errors.js';
import { signedResultSchema, type SignedResult } from './types.js';
import { verifySig } from './crypto.js';

export const verifyResult = (input: unknown): boolean => {
  const parsed = signedResultSchema.safeParse(input);
  if (!parsed.success) {
    throw new ArxPoolError('INVALID_INPUT', 'Signed result payload is invalid');
  }
  return verifySig(parsed.data.result, parsed.data.signature, parsed.data.publicKey);
};

export type { SignedResult };
