import { createHash } from "node:crypto";
import bs58 from "bs58";
import nacl from "tweetnacl";
import { ArxPoolError } from "./errors.js";

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

const resolveKeyPair = (secretKey: string): { secretKey: Uint8Array; publicKey: string } => {
  const input = secretKey?.trim();
  if (!input) {
    throw new ArxPoolError('CONFIG_MISSING', 'Attester key is required to sign results');
  }

  const stripPrefix = (value: string): string => (value.startsWith('ed25519:') ? value.slice(8) : value);
  const sanitized = stripPrefix(input);

  const tryDecode = (value: string): Uint8Array | null => {
    try {
      return new Uint8Array(bs58.decode(value));
    } catch {
      return null;
    }
  };

  const decoded = tryDecode(sanitized);
  if (decoded) {
    if (decoded.length === 64) {
      const publicKey = bs58.encode(decoded.slice(32));
      return { secretKey: decoded, publicKey };
    }
    if (decoded.length === 32) {
      const keyPair = nacl.sign.keyPair.fromSeed(decoded);
      return { secretKey: keyPair.secretKey, publicKey: bs58.encode(keyPair.publicKey) };
    }
  }

  const hash = createHash('sha256').update(input).digest();
  const seed = new Uint8Array(hash.subarray(0, 32));
  const keyPair = nacl.sign.keyPair.fromSeed(seed);
  return { secretKey: keyPair.secretKey, publicKey: bs58.encode(keyPair.publicKey) };
};

export const derivePublicKey = (secretKey: string): string => resolveKeyPair(secretKey).publicKey;

export const signResult = (payload: unknown, secretKey: string): string => {
  const { secretKey: signingKey } = resolveKeyPair(secretKey);
  const sig = nacl.sign.detached(messageToBytes(payload), signingKey);
  return bs58.encode(sig);
};

export const verifyResult = (payload: unknown, signature: string, pubkey: string): boolean => {
  try {
    const msg = messageToBytes(payload);
    const sig = bs58.decode(signature);
    const normalized = pubkey.startsWith('ed25519:') ? pubkey.slice(8) : pubkey;
    const publicKey = bs58.decode(normalized);
    return nacl.sign.detached.verify(msg, sig, publicKey);
  } catch {
    return false;
  }
};
