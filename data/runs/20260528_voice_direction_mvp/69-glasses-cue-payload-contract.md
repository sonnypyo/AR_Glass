# Stage 69: Glasses Cue Payload Contract

Date: 2026-05-28 KST

## Goal

Prepare the app for real Meta DAT and Android XR adapters by separating display payload from non-PII evidence text.

## Implemented

- Added `GlassesCuePayload`.
- The payload keeps display fields for glasses UI:
  - display title
  - direction enum and localized direction label
  - confidence percent and label
  - speaker-label-present flag
- The payload also exposes `evidenceSummary`, which contains only direction, confidence percent, and whether a speaker label exists.
- Updated Meta DAT and Android XR stub adapters so their debug delivery messages do not echo speaker labels.
- Updated `GlassesProjectedActivity` and `GlassesCueScreen` to render from the shared payload contract.
- Added tests proving display labels can exist while evidence summaries and stub adapter delivery messages omit the speaker label.

## Privacy Constraints

- Real glasses UIs may display the trusted speaker label because that is part of the product experience.
- Logs, generated evidence, stub delivery messages, and validator-facing outputs must not include speaker labels.
- The evidence summary does not include raw audio, transcripts, PCM, embeddings, private alert body text, or Bluetooth device owner names.

## Trial/Error Notes

- The previous stub adapters echoed `cue.title` and `cue.body`; this was acceptable for a stub but unsafe as a future logging/evidence pattern.
- This stage does not implement real Meta DAT or Android XR APIs. It only fixes the contract those adapters should consume.
- Real adapter work remains blocked until credentials, SDK/runtime proof, and hardware evidence exist.

## Verification

- `node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json`: passed with `"ok": true`.
- `bash -n scripts/android-device-smoke-test.sh`: passed.
- `JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk ./gradlew --no-daemon test assembleDebug`: passed.
- `JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk ./gradlew --no-daemon test assembleDebug bundleRelease`: passed.
- `node scripts/validate-release-artifact-readiness.mjs --json`: passed default mode with `uploadReady=false`.
