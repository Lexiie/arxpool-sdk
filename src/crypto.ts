import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { ArxPoolError } from './errors.js';

const encoder = new TextEncoder();

type PlainObject = Record<string, unknown>;

const isPlainObject = (value: unknown): value is PlainObject =>
  typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype;

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry));
  }
  if (isPlainObject(value)) {
    return Object.keys(value)
      .sort()
      .reduce<PlainObject>((acc, key) => {
        acc[key] = canonicalize(value[key]);
        return acc;
      }, {});
  }
  return value;
};

export const canonicalStringify = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(canonicalize(value));
};

const messageToBytes = (payload: unknown): Uint8Array => encoder.encode(canonicalStringify(payload));

const normalizeSecret = (secret: string | Uint8Array): Uint8Array => {
  if (typeof secret !== 'string') {
    return new Uint8Array(secret);
  }
  try {
    return new Uint8Array(bs58.decode(secret));
  } catch {
    throw new ArxPoolError('CONFIG_INVALID', 'Attester secret must be base58-encoded Ed25519 seed');
  }
};

export interface SignatureEnvelope {
  signature: string;
  publicKey: string;
  message: string;
}

export interface Signer {
  publicKey: string;
  sign: (payload: unknown) => SignatureEnvelope;
}

export const signerFromSecret = (secret: string | Uint8Array): Signer => {
  const raw = normalizeSecret(secret);
  if (raw.length !== 32 && raw.length !== 64) {
    throw new ArxPoolError('CONFIG_INVALID', 'Ed25519 secret must be 32-byte seed or 64-byte keypair');
  }
  const seed = raw.length === 32 ? raw : raw.slice(0, 32);
  const keyPair = nacl.sign.keyPair.fromSeed(seed);
  const publicKeyB58 = bs58.encode(keyPair.publicKey);

  return {
    publicKey: publicKeyB58,
    sign: (payload: unknown) => {
      const message = canonicalStringify(payload);
      const msgBytes = encoder.encode(message);
      const signature = nacl.sign.detached(msgBytes, keyPair.secretKey);
      return {
        signature: bs58.encode(signature),
        publicKey: publicKeyB58,
        message
      };
    }
  };
};

export const verifySig = (payload: unknown, signatureB58: string, publicKeyB58: string): boolean => {
  try {
    const msgBytes = messageToBytes(payload);
    const signature = bs58.decode(signatureB58);
    const publicKey = bs58.decode(publicKeyB58);
    return nacl.sign.detached.verify(msgBytes, signature, publicKey);
  } catch {
    return false;
  }
};
