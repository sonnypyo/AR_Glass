# Stage 64: Direction Accuracy Evidence Gate

Date: 2026-05-28 KST

## What Changed

- Added `docs/22-direction-accuracy-evidence.md`.
- Added `apps/voice-direction-glass/direction-evidence/manifest.json`.
- Added `scripts/validate-direction-accuracy-evidence.mjs`.

## Reasoning

The user's core product requirement is not just detecting a trusted voice; it is telling where the caller is. The current app can run prototype left/right experiments, but front/back and wearable routes are unproven. This stage keeps that limitation explicit and makes production direction claims fail strict validation until controlled hardware evidence exists.

## Current Result

- Draft validation can pass without physical hardware.
- Strict production-direction validation is expected to fail until real phone and wearable route evidence exists.
- `front-back-direction-evidence` remains blocked.

## Verification

Run:

```bash
node scripts/validate-direction-accuracy-evidence.mjs --json
node scripts/validate-direction-accuracy-evidence.mjs --require-production-direction-ready --json
```

Strict mode should fail before controlled direction evidence is collected.
