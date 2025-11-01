import { ArxPoolError } from "./errors.js";
import { signedResultSchema, type SignedResult } from "./types.js";
import { verifyResult as verifySignature } from "./crypto.js";

export const verifyResult = (input: unknown): boolean => {
  const parsed = signedResultSchema.safeParse(input);
  if (!parsed.success) {
    throw new ArxPoolError('INVALID_INPUT', 'Signed result payload is invalid');
  }
  return verifySignature(parsed.data.payload, parsed.data.signature, parsed.data.signer_pubkey);
};

export type { SignedResult };
