# Direction Accuracy Evidence

Date: 2026-05-28 KST

Direction evidence status: NOT_COLLECTED

Production direction claim: BLOCKED

External submission: not performed

## Purpose

This document defines the evidence required before Voice Direction Glass can claim that a trusted voice came from front, back, left, or right.

It is not production direction proof, not a hardware certification, not a guarantee of caller location, and not permission to advertise front/back direction accuracy.

## Official Source Snapshot

Checked on 2026-05-28 KST.

| Source | URL | Relevance |
| --- | --- | --- |
| Android `MicrophoneInfo` | https://developer.android.com/reference/android/media/MicrophoneInfo | Defines microphone location, orientation, position, directionality, and channel metadata available from Android API 28+. |
| Android `AudioManager.getMicrophones()` | https://developer.android.com/reference/android/media/AudioManager.html#getMicrophones() | Lists available microphone characteristics and can fail with `IOException`; useful before making device-specific direction claims. |
| Android `AudioRecord.getActiveMicrophones()` | https://developer.android.google.cn/reference/android/media/AudioRecord#getActiveMicrophones() | Reports the active microphones and channel mapping used by a capture stream; the active set can change during recording. |
| Android XR projected context hardware access | https://developer.android.com/develop/xr/jetpack-xr-sdk/access-hardware-projected-context | Documents projected-context microphone access for glasses, including multiple microphones on XR glasses and Bluetooth HFP as a single-microphone fallback. |
| Meta Wearables DAT Android repository | https://github.com/facebook/meta-wearables-dat-android | Official Android DAT public repository; current integration remains gated by credentials, device sessions, terms, and actual capability proof. |
| Meta Wearables developer docs | https://wearables.developer.meta.com/docs/develop | Project source requested by the user; authenticated/current docs must be checked again before DAT direction or display claims. |

## Current App State

| Area | Current state | Release meaning |
| --- | --- | --- |
| Direction estimator | `StereoPcmDirectionEstimator` compares two-channel PCM energy. | Useful for controlled left/right experiments only. |
| Evidence label | `AudioDirectionEvidenceClassifier` marks front/back as unproven. | Product copy must not imply full 4-way direction. |
| Device probe | App can probe microphone support and sample one transient stereo buffer. | Physical evidence still missing. |
| Stored evidence | App stores counts, statuses, direction enums, sample-rate metadata, and confidence buckets. | No PCM or raw audio is kept. |
| Service bridge | Foreground service can try a short direction sample after prototype voice match. | Runtime device behavior is not yet proven. |
| Glasses path | Meta DAT and Android XR adapters are still stubbed. | Wearable direction claims are blocked. |

## Direction Evidence Manifest

The current manifest is:

```text
apps/voice-direction-glass/direction-evidence/manifest.json
```

It must stay in `DRAFT_DIRECTION_EVIDENCE_NOT_COLLECTED` until controlled device evidence exists.

Current claim level:

```text
LEFT_RIGHT_REFERENCE_ONLY
```

## Evaluation Protocol

Before changing `front-back-direction-evidence` from `BLOCKED`, run a controlled direction evaluation that records only aggregate evidence:

1. Use consented test participants only.
2. Keep raw audio outside this repository unless a separate secure test-data policy exists.
3. Mount or hold the phone/glasses in a documented orientation for every trial.
4. Record microphone inventory from `AudioManager.getMicrophones()`.
5. Record active microphone metadata from `AudioRecord.getActiveMicrophones()` during capture.
6. Record channel mapping when available.
7. Run left, right, front, and back trials in a quiet room.
8. Repeat representative trials with normal room noise and phone-in-hand or glasses-worn posture.
9. Record observed direction, expected direction, confidence bucket, status, and latency only.
10. Treat `UNKNOWN` as valid when confidence is weak; do not replace it with a guessed direction.
11. Separate phone-microphone, Bluetooth HFP, Meta DAT, and Android XR projected-context runs.
12. Do not store raw audio, PCM, transcripts, or raw embedding vectors in generated evidence.

Before the run, generate a dedicated session folder:

```bash
scripts/create-controlled-direction-trial-session.mjs --run-dir data/runs/<run>/controlled-direction-trial-session --json
scripts/validate-controlled-direction-trial-session.mjs data/runs/<run>/controlled-direction-trial-session --json
```

## Minimum Promotion Criteria

These are the minimum gates before a production-facing four-direction claim. They can be tightened after real data exists, but they must not be loosened without a documented reason.

| Criterion | Required before production direction claim |
| --- | --- |
| Phone baseline | At least one physical Android phone has controlled evidence with microphone inventory, active microphone metadata, channel mapping, and mounting/orientation notes. |
| Direction coverage | At least 20 aggregate trials each for front, back, left, and right. |
| Left/right rate | Left/right match rate is at least 90% on the controlled evaluation set. |
| Front/back rate | Front/back match rate is at least 80% on the controlled evaluation set. |
| Overall rate | Overall four-direction match rate is at least 85% on the controlled evaluation set. |
| False direction rate | Confident wrong-direction rate is at most 10%. |
| Unknown/unusable rate | Unknown or unusable outcomes are at most 15% under the claimed conditions. |
| Latency | p95 direction processing latency is at most 500 ms after the trusted-voice match decision. |
| Wearable proof | Each claimed wearable route has platform-specific evidence. Bluetooth HFP is single-microphone fallback unless a richer route is proven. |
| Privacy | Evidence contains only aggregate counts, statuses, booleans, enum values, confidence buckets, and device-class notes. |
| Public copy | Listing/release copy must say "direction cue" only for directions and devices that passed the evidence gate. |

## Hardware Evidence Matrix

| Route | Required proof before claim |
| --- | --- |
| Android phone built-in microphones | Microphone inventory, active microphone metadata, channel mapping, controlled direction trials, latency, and no-PCM evidence. |
| Ray-Ban Meta Gen 1 Bluetooth fallback | Bluetooth HFP route visibility, single-microphone limitation notes, audible/TTS cue proof, and no four-direction claim unless a richer signal is proven. |
| Meta Ray-Ban Display DAT | DAT session proof, display cue proof, available microphone/capability proof, and direction trial results from the exact adapter path. |
| Android XR projected context | Projected activity proof, projected-context microphone permission proof, active microphone metadata, and direction trial results from the projected-context audio path. |

## Integration Contract

Production integration must provide:

- a versioned direction algorithm id
- input route metadata, including phone built-in, Bluetooth HFP, DAT, or Android XR projected context
- microphone inventory and active microphone metadata capture
- confidence calibration for `UNKNOWN`
- per-device and per-route aggregate match rates
- no-alert or weak-alert fallback when confidence is low
- public copy that mirrors the measured route and direction limits
- migration rules that keep the current stereo-energy prototype out of production claims

## Validation Command

Extract a generated phone evidence report into a non-PII direction summary:

```bash
node scripts/extract-direction-evidence-summary.mjs <device-evidence.md> --json
```

Validate the extracted direction summary:

```bash
node scripts/validate-direction-evidence-summary.mjs <direction-evidence-summary.json> --json
```

Dry-run manifest application:

```bash
node scripts/apply-direction-evidence-summary.mjs <direction-evidence-summary.json> --json
```

Strict summary validation after controlled phone and wearable direction evidence exists:

```bash
node scripts/validate-direction-evidence-summary.mjs <direction-evidence-summary.json> --require-production-direction-candidate --json
node scripts/apply-direction-evidence-summary.mjs <direction-evidence-summary.json> --write --json
```

Default draft validation:

```bash
node scripts/validate-direction-accuracy-evidence.mjs --json
```

Strict validation after controlled phone and wearable evidence exists:

```bash
node scripts/validate-direction-accuracy-evidence.mjs --require-production-direction-ready --json
```

The strict mode must fail until real aggregate trials, microphone metadata, route evidence, latency, privacy proof, and platform-specific notes exist.

Validate a planned controlled trial session before hardware collection:

```bash
node scripts/validate-controlled-direction-trial-session.mjs data/runs/<run>/controlled-direction-trial-session --json
```

## Release Gate

This document does not close the direction evidence gate.

- `front-back-direction-evidence` remains `BLOCKED`.
- `store-and-sdk-policy-clearance` remains `BLOCKED`.
- `production-speaker-model` remains `BLOCKED`.
- `privacy-consent-copy` remains `MANUAL_REQUIRED`.

## Trial/Error Notes

- The current left/right estimator can pass unit tests with synthetic stereo data while still failing on real phone or glasses microphones.
- Front/back needs more than a left/right energy balance. It needs device geometry, active microphone metadata, pose/mounting notes, and controlled trial evidence.
- Bluetooth HFP should be treated as an alert-output and fallback-input route first, not as a reliable direction-estimation route.
- Android XR projected context may expose richer microphone access, but it still needs device-specific proof before any four-direction claim.
- Meta DAT availability and capability claims must be checked against current authenticated docs and actual device sessions before implementation replaces stubs.
- The direction evidence extractor writes a manifest update template only. Use `scripts/apply-direction-evidence-summary.mjs` for dry-run/apply, and do not update `apps/voice-direction-glass/direction-evidence/manifest.json` while `productionDirectionCandidate=false`.
- The controlled direction trial session prepares rows and templates only. It must not be treated as evidence until real observed values are recorded and reviewed.
