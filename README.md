# @arxpool-hq/sdk

Privacy-first TypeScript SDK for building encrypted pooling workflows that target the Arcium MXE. The SDK collects encrypted blobs, submits compute jobs, produces signed attestations, and lets verifiers confirm signatures offline.

## Installation

```bash
npm install @arxpool-hq/sdk
```

Peer dependencies: Node.js 18+, npm 9+.

## Configuration

Set secrets via environment variables (no hard-coding):

- `ARXPOOL_ATTESTER_SECRET` – base58-encoded Ed25519 seed used for signing results.
- `ARCIUM_API_KEY` – Arcium API key for compute submissions.
- `ARXPOOL_MXE_ID` – target MXE identifier.
- `ARXPOOL_API_BASE` – HTTPS collector endpoint (defaults to `https://collector.arxpool.dev`).

Then initialize the SDK once per process:

```ts
import { configure } from '@arxpool-hq/sdk';

configure({
  attesterSecret: process.env.ARXPOOL_ATTESTER_SECRET,
  arciumApiKey: process.env.ARCIUM_API_KEY,
  mxeId: process.env.ARXPOOL_MXE_ID
});
```

## API Surface

- `configure(config)` / `getConfig()` – manage runtime configuration.
- `createPool(input)` – register a new encrypted pool (local store + future network POST).
- `joinPool(poolId, blob)` – append encrypted blobs (never logs plaintext).
- `computePool(poolId, options?)` – compose compute payloads, optionally submit to Arcium, return signed tallies.
- `verifyResult(signed)` – deterministic Ed25519 verification, pure & offline.
- `signerFromSecret(secret)` / `verifySig(...)` / `canonicalStringify(value)` – crypto utilities.

All inputs are validated through Zod schemas exported from `src/types`.

## Example

See `examples/basic.ts` for a full flow:

```ts
import { computePool, configure, createPool, joinPool, verifyResult } from '@arxpool-hq/sdk';

configure({ attesterSecret: process.env.ARXPOOL_ATTESTER_SECRET, mxeId: 'demo-mxe' });

await createPool({ id: 'poll-123', mode: 'tally' });
await joinPool('poll-123', {
  ciphertext: 'b64-DUMMY-CIPHERTEXT',
  senderPubkey: 'Base58DummyPubKey11111111111111111111111111111111111'
});

const signed = await computePool('poll-123', { dryRun: true });
const verified = verifyResult(signed);
console.log('Verification passed?', verified);
```

## Development

```bash
npm run lint       # ESLint (strict, TypeScript aware)
npm run test       # Vitest (crypto + verify coverage)
npm run build      # tsc → dist/
```

Prepublish hook enforces `lint`, `test`, and `build`. Only `dist` is published thanks to the `files` field.

## Security Notice

- Secrets are **never** logged; ciphertexts are redacted as `***ENCRYPTED***`.
- Verification is pure, does not touch the network, and relies on canonical JSON signing.
- Local ciphertext cache is cleared after `computePool` runs to avoid lingering sensitive data.

## License

MIT © ArxPool SDK contributors
