# Stage 76 - Glasses Hardware Evidence

Date: 2026-05-28 KST

## Goal

Make Meta Ray-Ban Display, Ray-Ban Meta Gen 1 fallback, and Android XR projected proof machine-checkable before glasses private alpha.

## Changes

- Added `docs/25-glasses-hardware-evidence.md`.
- Added `apps/voice-direction-glass/glasses-evidence/manifest.json`.
- Added `scripts/validate-glasses-hardware-evidence.mjs`.
- The default validator mode accepts the draft evidence shape.
- Strict mode requires real evidence paths and passed fields for Meta Display, Ray-Ban Gen 1 fallback or documented limitation, Android XR projected runtime, and haptics/fallback status.

## Trial/Error Notes

- A projected phone preview is not Android XR runtime proof.
- A Bluetooth route probe is not display proof or direction proof.
- Credential validation is not hardware evidence.
- Haptics remains documented unavailable unless official API and device proof exist.

## Verification

Passed:

```bash
node --check scripts/validate-glasses-hardware-evidence.mjs
node scripts/validate-glasses-hardware-evidence.mjs --json
```

Expected strict failure:

```bash
node scripts/validate-glasses-hardware-evidence.mjs --require-glasses-alpha-ready --json
```

Result: strict mode fails because real Meta Ray-Ban Display, Ray-Ban Gen 1 fallback, Android XR projected, evidence paths, and service-audit proof do not exist yet.
