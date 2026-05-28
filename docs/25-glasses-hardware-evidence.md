# Glasses Hardware Evidence

Date: 2026-05-28 KST

## Purpose

This document defines the evidence gate for real Meta Ray-Ban Display, Ray-Ban Meta Gen 1 fallback, and Android XR projected glasses proof.

Glasses hardware evidence status: NOT_COLLECTED.

The setup gate in `docs/24-glasses-setup-readiness.md` proves only local credential/template readiness. This document defines the proof needed before calling the glasses integration itself alpha-ready.

## Official Source Snapshot

Checked on 2026-05-28 KST:

| Area | Source | Current implication |
| --- | --- | --- |
| Meta Wearables develop docs | https://wearables.developer.meta.com/docs/develop | Real DAT work requires developer account/device setup and logged-in review. |
| Meta DAT Android repository | https://github.com/facebook/meta-wearables-dat-android | Android DAT access is package/credential gated and still preview-oriented. |
| Meta DAT lifecycle | https://wearables.developer.meta.com/docs/develop/dat/lifecycle-events/ | Session lifecycle must be observed before considering a display cue delivered. |
| Android XR SDK | https://developer.android.com/develop/xr/jetpack-xr-sdk | Android XR glasses APIs are preview/developer-preview oriented. |
| Android XR glasses first activity | https://developer.android.com/develop/xr/jetpack-xr-sdk/glasses/first-activity | Projected activities launch with projected context options and can use Compose Glimmer. |
| Android XR projected hardware access | https://developer.android.com/develop/xr/jetpack-xr-sdk/access-hardware-projected-context | Glasses hardware access requires projected context; Bluetooth remains fallback. |
| Android XR support different glasses | https://developer.android.com/develop/xr/jetpack-xr-sdk/glasses/support-different-types | Projected context is the device-aware path for connected audio/display glasses. |

## Current App State

- `MetaDatDisplayStubAdapter` is still active.
- `AndroidXrDisplayStubAdapter` is still active.
- `GlassesProjectedActivity` can render the latest locally stored cue, but projected runtime proof is not recorded.
- Ray-Ban Gen 1 Bluetooth fallback route proof is not recorded.
- Glasses-side haptics and per-side haptics are not confirmed.
- The `meta-display-cue`, `android-xr-device-proof`, and wearable proof gates remain open.

## Hardware Evidence Manifest

The draft manifest lives at:

```text
apps/voice-direction-glass/glasses-evidence/manifest.json
```

Current manifest status: `DRAFT_GLASSES_HARDWARE_EVIDENCE_NOT_COLLECTED`.

The manifest records only statuses, booleans, enum values, aggregate counts, and workspace-relative evidence paths. It must not contain raw audio, PCM buffers, transcripts, speaker names, contact names, voice embeddings, encrypted payload values, Bluetooth owner/device names, private alert text, or exact locations.

## Meta Ray-Ban Display Proof

Minimum evidence before marking the Display path ready:

- Meta DAT credentials and package access are configured outside source control.
- Real DAT adapter replaces `MetaDatDisplayStubAdapter`.
- DAT registration/session lifecycle is observed.
- Latest actionable cue renders on Ray-Ban Display.
- Evidence confirms display cue uses direction/status only or redacts private speaker text.
- Offline/failure state is documented.
- Evidence file path exists and passes the privacy scan.

## Ray-Ban Meta Gen 1 Fallback Proof

Minimum evidence before using Gen 1 as a fallback route:

- Bluetooth route probe runs with Ray-Ban connected.
- Route candidate count/type is recorded without device names.
- Route select/clear is tested when a candidate appears.
- TTS direction cue is heard or documented unavailable.
- Phone vibration fallback is observed or documented unavailable.
- Display unavailable behavior is documented.
- Evidence file path exists and passes the privacy scan.

## Android XR Projected Proof

Minimum evidence before marking Android XR projected path ready:

- Android XR device/emulator/runtime is available.
- Jetpack Projected dependency setup is validated.
- `scripts/validate-android-xr-projected-contract.mjs --json` passes in default mode before any Android XR code change is treated as workflow-safe.
- `scripts/validate-android-xr-projected-contract.mjs --require-real-android-xr --json` passes before any real Android XR runtime claim.
- `GlassesProjectedActivity` launches in projected context.
- Latest actionable cue is visible on projected display.
- Empty/no-cue state is visible.
- Projected-context microphone access is tested or explicitly documented unavailable.
- Bluetooth fallback is tested when projected microphone access is unavailable.
- Evidence file path exists and passes the privacy scan.

## Haptics Evidence

Do not claim glasses-side haptics until an official API and device session prove it. `docs/38-glasses-haptics-intent-contract.md` is app-side design metadata only.

Allowed current outcome:

- `status`: `documented_not_available`
- `perSideHapticsVerified`: `false`
- Phone vibration fallback remains the current MVP output.

## Validation Command

Default validation checks the draft runbook and manifest:

```bash
node scripts/validate-glasses-hardware-evidence.mjs --json
```

Strict validation is allowed to pass only after real Meta/Ray-Ban/Android XR evidence exists:

```bash
node scripts/validate-glasses-hardware-evidence.mjs --require-glasses-alpha-ready --json
```

Expected current result: default validation passes; strict validation fails until real hardware evidence files exist and the manifest is deliberately updated.

## Release Gate

This document does not make glasses private alpha ready. It makes the remaining hardware proof blocker machine-checkable.

Before glasses private alpha:

- Phone private alpha device evidence must pass.
- The hardware test operator pack should pass in default mode, then the glasses lane should run through `RUN_GLASSES=1` only when real glasses evidence can be collected.
- A reviewed glasses hardware session folder should be generated with `scripts/create-glasses-hardware-session.mjs` and validated with `scripts/validate-glasses-hardware-session.mjs`.
- `scripts/validate-glasses-setup-readiness.mjs --require-credentials --json` must pass for Meta DAT work.
- `scripts/glasses-integration-preflight.sh --write-evidence` must have no relevant blocked rows for the target platform.
- `scripts/validate-android-xr-projected-contract.mjs --require-real-android-xr --json` must pass before Android XR evidence is used as real projected-runtime proof.
- Real Meta/Ray-Ban/Android XR evidence files must exist.
- `scripts/validate-glasses-hardware-evidence.mjs --require-glasses-alpha-ready --json` must pass.
- `scripts/audit-service-readiness.mjs --write-report` must be regenerated after the hardware session.

## Trial/Error Notes

- A projected phone preview is useful, but it is not Android XR runtime proof.
- A Bluetooth route probe is useful, but it does not prove display behavior or direction accuracy.
- A DAT credential pass is useful, but it does not prove a displayed cue.
- Haptics stays out of product claims until official API and device proof exist.
