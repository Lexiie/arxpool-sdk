---

ArxPool SDK

> Encrypted Pooling SDK for Arcium — collect encrypted inputs from many users, compute privately inside Arcium’s Multi-party Execution (MXE), and verify results without revealing individual data.



  


---

✨ What is ArxPool?

ArxPool is a reusable, privacy-first SDK that gives builders a simple API to:

Collect encrypted user inputs (votes, data points, metrics).

Compute privately (tally/sum/avg or custom aggregations) in Arcium MXE.

Verify the attested result (job_commit, signature) offline.


It’s designed as a developer primitive for many apps: private voting, encrypted analytics, AI collaboration, DeFi risk sharing, research, and more.

> Until Arcium’s public MXE endpoints are broadly available, the SDK ships with a stub mode for demos and tests. Switching to live compute is a one-line config change once you have API credentials.




---

🚀 Features

🔒 Privacy by default — SDK never handles plaintext user data.

🧩 Composable API — createPool → joinPool → computePool → verifyResult.

✅ Verifiable outputs — Ed25519-signed attestation + job_commit.

🔁 Stub → Live switch — develop now, flip to live MXE later.

📦 TypeScript ESM — strict types, small footprint.



---

📦 Install

npm install @arxpool-hq/sdk
# or
yarn add @arxpool-hq/sdk


---

⚙️ Configuration

Add a .env (or equivalent) to your project:

# Demo/dev by default
USE_STUB=true
ARXPOOL_ATTESTER_SECRET=local-dev

# Live (set these once you have access)
# USE_STUB=false
# ARCIUM_API_KEY=...
# ARXPOOL_MXE_ID=...

Initialize once in your app:

import { configure } from "@arxpool-hq/sdk";

configure({
  useStub: process.env.USE_STUB === "true",
  attesterSecret: process.env.ARXPOOL_ATTESTER_SECRET, // required for signing results (server-side)
  mxeId: process.env.ARXPOOL_MXE_ID,                   // for live mode
  arciumApiKey: process.env.ARCIUM_API_KEY,            // for live mode (backend only)
  apiBase: process.env.ARXPOOL_API_BASE,               // optional: your collector API base
});

> Security note: never expose ARCIUM_API_KEY or ARXPOOL_ATTESTER_SECRET to the browser. Keep secrets on the server.




---

🧪 Quickstart

import {
  configure,
  createPool,
  joinPool,
  computePool,
  verifyResult,
} from "@arxpool-hq/sdk";

configure({ useStub: true, attesterSecret: "local-dev" });

// 1) Create a pool (e.g., a poll)
await createPool({ id: "poll-123", mode: "tally" });

// 2) Users submit encrypted blobs (ciphertext strings)
await joinPool("poll-123", {
  ciphertext: "b64:... (opaque)",
  senderPubkey: "BASE58_WALLET",
});

// 3) Run the private compute (stub or live)
const signed = await computePool("poll-123", { demoCounts: [12, 9, 7] });

// 4) Verify offline
const ok = verifyResult(signed);
console.log("Verified:", ok); // true


---

🧰 Public API

configure(cfg: ArxPoolConfig): void

Set global SDK config.

type ArxPoolConfig = {
  useStub?: boolean;           // default: true (recommended for dev)
  apiBase?: string;            // your collector API (optional)
  attesterSecret?: string;     // required on server to sign results
  mxeId?: string;              // Arcium MXE target (live)
  arciumApiKey?: string;       // Arcium API key (live, server only)
};

createPool(pool: Pool): Promise<Pool>

Register a new pool (ID + mode).

type PoolMode = "tally" | "sum" | "avg";

type Pool = {
  id: string;
  mode: PoolMode;
  meta?: Record<string, any>;
};

joinPool(poolId: string, blob: EncryptedBlob): Promise<{ ok: true }>

Submit an encrypted input to the pool. The SDK treats ciphertext as an opaque string.

type EncryptedBlob = {
  ciphertext: string;   // base64 / HPKE payload
  senderPubkey: string; // e.g., wallet pubkey (base58)
};

computePool(poolId: string, opts?: ComputeOptions): Promise<SignedResult>

Run the aggregation in Arcium (or stub).

type ComputeOptions = {
  // For stub/demo only:
  demoCounts?: number[]; // tally mode example output
};

type TallyResult = {
  poolId: string;
  counts?: number[];     // for "tally"
  value?: number;        // for "sum"/"avg" (future)
  job_commit: string;    // verifiable compute commit
  mxe_id?: string;       // MXE ID (live)
  timestamp: number;
};

type SignedResult = {
  payload: TallyResult;
  signer_pubkey: string; // base58
  signature: string;     // base58 Ed25519
};

verifyResult(res: SignedResult): boolean

Offline verification (no network). Checks Ed25519 signature over a canonicalized JSON payload.


---

🧱 Error Codes

All thrown errors are typed objects: { code: string; message: string; hint?: string }

E_INVALID_SCHEMA — inputs failed validation.

E_MISSING_CONFIG — required config/secret is missing.

E_COMPUTE_FAILED — compute job failed (network or MXE).

E_VERIFICATION_FAILED — signature mismatch.



---

🔐 Security Model

No plaintext: SDK never decrypts user data; ciphertext is opaque.

Secrets in ENV only: no hardcoding ARCIUM_API_KEY / ARXPOOL_ATTESTER_SECRET.

Deterministic signatures: Ed25519 (tweetnacl) + canonical JSON.

Pure verification: verifyResult() is offline & deterministic.

Redacted logs: never log ciphertext or secrets (use ***ENCRYPTED***).

HTTPS everywhere (enforced by your hosting/infra).


> See: security.mdx in the web portal for a longer write-up.




---

🧭 Modes (Stub vs Live)

Mode	When to use	Behavior

Stub	Local dev, demos, CI smoke tests	computePool returns deterministic outputs and signs locally.
Live	Once Arcium MXE API is available	Submits to Arcium MXE; returns real job_commit / receipt.


Toggle via USE_STUB=true/false and proper env vars.


---

🧬 Example (Node script)

// examples/basic.ts
import {
  configure, createPool, joinPool, computePool, verifyResult
} from "@arxpool-hq/sdk";

async function main() {
  configure({ useStub: true, attesterSecret: "local-dev" });
  await createPool({ id: "poll-xyz", mode: "tally" });
  await joinPool("poll-xyz", { ciphertext: "b64:...", senderPubkey: "BASE58..." });

  const res = await computePool("poll-xyz", { demoCounts: [5, 4, 3] });
  console.log("Signed:", res);
  console.log("Verify:", verifyResult(res));
}
main();

Run:

node examples/basic.ts


---

🌐 Example Web Portal

A companion site shows the SDK in action (landing + docs + demo + collector API):

Demo (stub mode): create → join → compute → verify

Docs: Intro, Install, API, Security, Architecture

Branding: Arcium-style dark theme


> Deployed preview: https://arxpool-web-test.vercel.app
(Swap with your production domain when ready.)




---

🗺️ Roadmap

[ ] Live MXE integration via @arcium-hq/client (when access opens)

[ ] Reader integration for richer receipt proofs

[ ] More aggregations: median, min/max, custom reducers

[ ] Wallet helpers (Solana, EVM) for user identity binding

[ ] Optional on-chain anchoring of result hashes



---

🤝 Contributing

PRs welcome! Please:

1. Follow TypeScript strict and lint rules.


2. Add/keep unit tests for crypto & verification.


3. Do not add telemetry/analytics deps.


4. Never log or commit secrets.




---

📄 License

MIT — see LICENSE.


---
