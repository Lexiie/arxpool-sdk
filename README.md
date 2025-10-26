
---

# ArxPool SDK

> **Encrypted Pooling SDK for Arcium**  
> Collect encrypted inputs from users, compute privately inside Arcium’s Multi-party Execution (MXE), and verify results without revealing individual data.

[![npm version](https://img.shields.io/badge/npm-arxpool--sdk-green)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-ESM-blue)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-lightgrey.svg)](#)

---

## ✨ What is ArxPool

**ArxPool** is a reusable, privacy-first SDK that provides a simple API for:

- Collecting encrypted user inputs (votes, metrics, AI updates)
- Performing private aggregation inside **Arcium MXE**
- Verifying attested results offline (`job_commit`, signature)

Use-cases:
- 🗳️ Private DAO voting  
- 📊 Encrypted analytics  
- 🤖 Federated AI collaboration  
- 💸 Confidential DeFi data  

> ⚠️ ArxPool currently runs in **stub mode** (local compute) until Arcium public API access is open.  
> Once available, flip one flag to go live.

---

## 🚀 Features

- 🔒 Privacy by design — no plaintext data ever leaves the user  
- 🧩 Simple API — `createPool → joinPool → computePool → verifyResult`  
- ✅ Ed25519 attestation for verifiable results  
- 🔁 Stub ↔ Live switch in one line  
- ⚙️ Written in TypeScript (ESM ready)

---

## 📦 Installation

```bash
npm install @arxpool-hq/sdk
# or
yarn add @arxpool-hq/sdk


---

⚙️ Configuration

Create a .env file:

# Demo (default)
USE_STUB=true
ARXPOOL_ATTESTER_SECRET=local-dev

# Live (once Arcium API access is granted)
# USE_STUB=false
# ARCIUM_API_KEY=your_api_key
# ARXPOOL_MXE_ID=your_mxe_id

Initialize in your app:

import { configure } from "@arxpool-hq/sdk";

configure({
  useStub: process.env.USE_STUB === "true",
  attesterSecret: process.env.ARXPOOL_ATTESTER_SECRET,
  arciumApiKey: process.env.ARCIUM_API_KEY,
  mxeId: process.env.ARXPOOL_MXE_ID,
});

> 🔐 Never expose secrets (ARCIUM_API_KEY, ARXPOOL_ATTESTER_SECRET) to frontend code.




---

🧪 Quickstart

import {
  configure,
  createPool,
  joinPool,
  computePool,
  verifyResult,
} from "@arxpool/sdk";

configure({ useStub: true, attesterSecret: "local-dev" });

// 1. Create a new pool
await createPool({ id: "poll-123", mode: "tally" });

// 2. Submit encrypted inputs
await joinPool("poll-123", {
  ciphertext: "b64:...",
  senderPubkey: "BASE58_PUBKEY",
});

// 3. Compute (stub or live)
const result = await computePool("poll-123", { demoCounts: [4, 3, 2] });

// 4. Verify result
console.log(verifyResult(result)); // true


---

🧰 API Reference

configure(config)

Configure global SDK behavior.

type ArxPoolConfig = {
  useStub?: boolean;
  apiBase?: string;
  attesterSecret?: string;
  mxeId?: string;
  arciumApiKey?: string;
};


---

createPool(pool)

Create a new pool.

type Pool = {
  id: string;
  mode: "tally" | "sum" | "avg";
};


---

joinPool(poolId, blob)

Submit encrypted data to a pool.

type EncryptedBlob = {
  ciphertext: string;   // base64 or HPKE payload
  senderPubkey: string; // wallet/public key
};


---

computePool(poolId, options)

Run the computation.

type ComputeOptions = {
  demoCounts?: number[]; // stub-only
};

Returns a signed result:

type SignedResult = {
  payload: {
    poolId: string;
    counts?: number[];
    job_commit: string;
    timestamp: number;
  };
  signer_pubkey: string;
  signature: string;
};


---

verifyResult(result)

Verify the Ed25519 signature locally.

verifyResult(result); // returns true or false


---

🔐 Security

Policy	Description

No plaintext	SDK never decrypts user data
Secrets in ENV	Never hardcode sensitive keys
Deterministic signing	Ed25519 + canonical JSON
Offline verification	No network required
Redacted logs	[ENCRYPTED_PAYLOAD] instead of raw data
HTTPS only	Required for backend/collector



---

🧭 Modes

Mode	Use Case	Behavior

Stub	Local dev, demo	Deterministic simulated compute
Live	Arcium MXE	Actual encrypted aggregation


Toggle using USE_STUB=true/false.


---

🌐 Example (Node Script)

import {
  configure, createPool, joinPool, computePool, verifyResult
} from "@arxpool-hq/sdk";

async function main() {
  configure({ useStub: true, attesterSecret: "local-dev" });

  await createPool({ id: "poll-xyz", mode: "tally" });
  await joinPool("poll-xyz", { ciphertext: "b64:...", senderPubkey: "BASE58..." });

  const res = await computePool("poll-xyz", { demoCounts: [5, 4, 3] });
  console.log("Signed:", res);
  console.log("Verified:", verifyResult(res));
}
main();


---

🌐 Related Project

ArxPool Web Portal
Interactive demo + docs + collector API.
🔗 https://arxpool-web-test.vercel.app


---

🗺️ Roadmap

[ ] Integrate Arcium MXE client once public

[ ] Reader proof verification

[ ] Support for new aggregation modes

[ ] Wallet bindings (EVM, Solana)

[ ] On-chain anchoring of compute receipts



---

🤝 Contributing

1. Use TypeScript strict mode


2. Include unit tests for crypto logic


3. Never log or commit secrets


4. Avoid telemetry / analytics




---

📄 License

MIT — 2025 ArxPool


---

🧠 Notes

Arcium MXE access may still be gated during public testnet.

Keep USE_STUB=true until credentials are issued.

Same SDK runs live without any code changes once access is granted.


---

📌 **Tips biar tampil full di GitHub:**
- Pastikan file disimpan sebagai `UTF-8` tanpa BOM.  
- Jangan taruh indentation sebelum triple backticks ``` untuk code blocks.  
- Hindari tab di awal baris (gunakan 2–4 spasi aja).  
- Kalau kamu edit di VSCode, pilih *"Markdown: Preview"* untuk cek format.  

---


