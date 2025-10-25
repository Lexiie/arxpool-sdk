🧩 tasks.md — ArxPool SDK Build Tasks

🎯 Goal

Bangun SDK reusable bernama @arxpool/sdk, library TypeScript untuk private pooling di atas jaringan Arcium.
SDK menyediakan fungsi untuk mengumpulkan data terenkripsi dari banyak user, menjalankan compute di Arcium MXE, dan memverifikasi hasil (attestation).


---

📁 Project Structure

arxpool-sdk/
├─ src/
│  ├─ index.ts
│  ├─ client.ts
│  ├─ types.ts
│  ├─ collect.ts
│  ├─ compute.ts
│  ├─ verify.ts
│  └─ crypto.ts
├─ examples/
│  └─ basic.ts
├─ tests/
│  └─ verify.test.ts
├─ package.json
├─ tsconfig.json
├─ .npmrc
└─ README.md


---

⚙️ Core Tasks

1️⃣ Setup & Config

Init project: npm init -y

Add deps: tweetnacl, bs58, zod, @arcium-hq/client

Configure TypeScript (ES2022, ESM, strict).

Add scripts:

build = tsc
test = vitest run
lint = eslint .
prepublishOnly = npm run lint && npm run test && npm run build


2️⃣ Implement Modules

src/client.ts

Function configure(cfg) dan getConfig().

Configurable: apiBase, mxeId, attesterSecret, arciumApiKey.


src/types.ts

Define schemas (zod): Pool, EncryptedBlob, TallyResult, SignedResult.

Export TypeScript types.


src/crypto.ts

Utility Ed25519 (tweetnacl + bs58):

signerFromSecret(secret)

verifySig(msg, sigB58, pubB58)


Use deterministic encoding: JSON.stringify canonical.


src/collect.ts

Function createPool(), joinPool().

Validate inputs, no plaintext logs.

Future-proof for network POST (collector API).


src/compute.ts

Function computePool(poolId, opts?)

Compose payload → call @arcium-hq/client.submitJob().

Wait job receipt (waitForJob).

Extract counts, job_commit.

Build TallyResult, sign payload (Ed25519).


Return SignedResult.


src/verify.ts

verifyResult(result) → validate signature → boolean.

Must be pure (no network).


src/index.ts

Re-export all.



---

3️⃣ Example

examples/basic.ts

import { configure, createPool, joinPool, computePool, verifyResult } from "@arxpool/sdk";
configure({ attesterSecret: "local-dev", mxeId: "demo" });

await createPool({ id: "poll-123", mode: "tally" });
await joinPool("poll-123", { ciphertext: "b64...", senderPubkey: "BASE58..." });
const res = await computePool("poll-123", { demoCounts: [3,2,1] });
console.log(verifyResult(res) ? "VALID" : "INVALID");


---

4️⃣ Testing

Unit test for:

sign/verify works correctly

invalid schema throws

missing ENV triggers error


Use vitest.

Ensure no console logs leak secrets.



---

5️⃣ Build & Publish

Compile: npm run build

Verify tests pass.

Add .env.example:

ARXPOOL_ATTESTER_SECRET=...
ARCIUM_API_KEY=...
ARXPOOL_MXE_ID=...

Publish: npm publish --access public



---

6️⃣ Docs

README.md

Install instructions

Configuration

API reference

Example usage

Security notice: “No plaintext data stored or logged.”



---

🛡 guardrails.md — ArxPool SDK Security & Quality Rules

🔐 Security Rules

1. No plaintext handling: SDK never decrypts user data.


2. Secrets via ENV only: ARXPOOL_ATTESTER_SECRET and ARCIUM_API_KEY cannot be hardcoded.


3. No secret or ciphertext logging. Replace with ***ENCRYPTED***.


4. Validation mandatory: All function inputs validated via zod.


5. Signature integrity: Ed25519 (tweetnacl), canonical JSON, base58 encoding.


6. Verification purity: verifyResult() deterministic & offline.


7. Network safety: Only outbound HTTPS → Arcium endpoints.


8. TTL for examples: Local ciphertext store must expire after job compute.


9. Error transparency: Typed error { code, message }, no secret info in logs.


10. Dependency hygiene: No telemetry or analytics dependencies.




---

⚙️ Code Quality Guardrails

1. TypeScript strict mode ON.


2. ESLint & Prettier pass required before publish.


3. Tests required for crypto & verify modules.


4. Dist-only publish: only compiled JS/typings in npm package.


5. No eval / dynamic import from user input.


6. Consistent naming: camelCase functions, PascalCase types.


7. Public API surface minimal.


8. No mutation of globals.


9. Deterministic build: same input → same output.


10. License: MIT.




---

🧩 Release checklist

[ ] All zod schemas validated.

[ ] No plaintext in logs.

[ ] Tests pass 100%.

[ ] Lint & typecheck clean.

[ ] Verified signature determinism.

[ ] README complete.

[ ] .env.example included.

[ ] Version bumped semver.

[ ] Tag & npm publish.



---

Summary:
ArxPool SDK = safe-by-default, privacy-first, reusable aggregation SDK for Arcium ecosystem.

