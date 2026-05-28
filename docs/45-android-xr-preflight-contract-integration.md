# Android XR Preflight Contract Integration

Date: 2026-05-28 KST

## Purpose

This document records the integration between the Android XR projected-contract validator and the glasses integration preflight.

The goal is to make one preflight report show both facts at the same time:

- The current Android XR projected preview/stub path is workflow-safe.
- Real Android XR runtime proof is still not ready.

## Integrated Command

Run from the repository root:

```bash
scripts/glasses-integration-preflight.sh --write-evidence --evidence-dir data/runs/20260528_voice_direction_mvp/30-glasses-preflight-evidence
```

The generated evidence is:

```text
data/runs/20260528_voice_direction_mvp/30-glasses-preflight-evidence/glasses-preflight.md
```

## Added Preflight Rows

The preflight now includes:

- `Android XR / Projected contract default validation`: passes when `scripts/validate-android-xr-projected-contract.mjs --json` passes.
- `Android XR / Strict real projected contract`: remains manual-required until `scripts/validate-android-xr-projected-contract.mjs --require-real-android-xr --json` passes.

Current expected values:

```text
Projected contract default validation = pass
Strict real projected contract = manual-required
```

## Current Result

The latest preflight status remains blocked because:

- no authorized ADB device is attached,
- Meta DAT token and application id are not configured,
- DAT Maven/dependency setup is not configured,
- Jetpack Projected is not configured,
- real adapters are not installed,
- strict real Android XR projected contract is not ready.

This is the correct state before physical phone, Ray-Ban, or Android XR evidence exists.

## Privacy Guardrail

The preflight stores only status rows, counts, booleans, and local workspace paths. It must not store raw page bodies, raw command output, ADB serials, Bluetooth device names, raw audio, transcripts, speaker names, embeddings, private alert text, tokens, or application id values.
