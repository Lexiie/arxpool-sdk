# Changelog — ArxPool SDK

All notable changes to this project will be documented in this file.  
This project follows [Semantic Versioning](https://semver.org/).

---

## [0.2.0] — 2025-10-26
### Added
- Public `@arxpool/sdk` TypeScript package structure.
- Core API: `configure`, `createPool`, `joinPool`, `computePool`, `verifyResult`.
- Support for **stub mode** with deterministic demo results.
- Basic Ed25519 signature + verification.
- In-memory collector simulation for local tests.
- `.env`-based configuration for secrets & Arcium MXE IDs.
- Unit tests for signing and verification.

### Changed
- Updated README & docs to align with **ArxPool Web Portal**.
- Improved type definitions and error messages.
- Updated build scripts for Node + ESM compatibility.

### Security
- Implemented canonical JSON signing to prevent signature drift.
- Redacted all ciphertext logs (`[ENCRYPTED_PAYLOAD]`).

---

## [0.1.0] — 2025-10-15
### Initial release
- Proof of concept for encrypted data pooling SDK.
- Local-only stub of Arcium MXE compute.
- Basic API documentation and tests.
