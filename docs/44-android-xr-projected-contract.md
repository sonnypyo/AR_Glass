# Android XR Projected Contract

Date: 2026-05-28 KST

## Purpose

This document defines the Android XR projected-contract validator for Voice Direction Glass.

The contract exists because the current app has a projected cue screen, but it is still a phone-hosted preview with `AndroidXrDisplayStubAdapter`. The validator prevents that preview from being mistaken for real Android XR runtime proof.

## Source Basis

The current source basis is the generated platform freshness report:

```text
data/runs/20260528_voice_direction_mvp/82-platform-source-freshness/platform-source-freshness.json
```

The report tracks official Android XR source pages for:

- Jetpack XR SDK overview.
- Audio/display glasses first activity.
- Projected hardware access.
- Support for different glasses types.

As of the latest generated report, Android XR pages report Last updated `2026-05-19 UTC`.

Meta Wearables docs remain credential/login gated for some DAT details, so Android XR projected work should not be used to infer Meta Ray-Ban Display readiness.

## Validator

Run from the repository root:

```bash
scripts/validate-android-xr-projected-contract.mjs --write-report --json
```

Generated report:

```text
data/runs/20260528_voice_direction_mvp/97-android-xr-projected-contract/android-xr-projected-contract.md
```

## Default Contract

Default mode passes when all of these are true:

- `GlassesProjectedActivity` is declared in `AndroidManifest.xml`.
- The activity has `android:requiredDisplayCategory="xr_projected"`.
- `GlassesProjectedActivity` renders `GlassesCueScreen`.
- The phone app can open the screen as a local preview.
- `AndroidXrDisplayStubAdapter` is still explicit in the app output factory.
- Platform source freshness for Android XR is available and passing.

Default mode does not claim real Android XR runtime support.

## Strict Contract

Strict mode is for future real Android XR work:

```bash
scripts/validate-android-xr-projected-contract.mjs --require-real-android-xr --json
```

Strict mode must fail until all of these are true:

- Jetpack XR dependency is configured.
- Compose Glimmer dependency is configured.
- The launch path uses `ProjectedContext.createProjectedActivityOptions`.
- Projected-device hardware access uses `ProjectedContext.createProjectedDeviceContext` or a documented supported fallback.
- `AndroidXrDisplayStubAdapter` is replaced by a real Android XR adapter.
- Real hardware or emulator evidence is recorded through the glasses hardware evidence flow.

## Current Result

Current state is:

```text
currentMode=phone_preview_stub
phonePreviewOnly=true
realAndroidXrCandidate=false
```

This is correct for the current MVP. It lets us keep Android XR UI and evidence workflow visible without claiming that connected Android XR glasses have been verified.

## Privacy Guardrail

The validator stores only booleans, workspace-relative paths, source ids, and dates. It must not include raw audio, transcripts, speaker names, Bluetooth names, MAC addresses, private alert text, embeddings, or projected display screenshots.

## Preflight Integration

`scripts/glasses-integration-preflight.sh` now calls this validator in two ways:

- Default mode must pass before an Android XR projected change is considered workflow-safe.
- Strict mode is recorded as manual-required until Jetpack XR, Glimmer, ProjectedContext launch/device context, real adapter, and runtime evidence exist.

The generated preflight evidence intentionally keeps strict Android XR unavailable visible instead of hiding it behind the phone preview.
