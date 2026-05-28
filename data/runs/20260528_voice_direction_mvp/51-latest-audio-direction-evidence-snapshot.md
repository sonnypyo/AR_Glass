# 51. Latest Audio Direction Evidence Snapshot

## Objective

Persist the latest direction sample evidence label so generated device evidence can report it after a physical test.

## Changes

- Added `AudioDirectionSampleSnapshot`.
- Added repository support for `latestAudioDirectionSample`.
- Added secure preference codec support for the latest audio direction sample snapshot.
- Stored the latest audio direction sample after `방향 샘플 점검` and `현재 방향 기록`.
- Added non-PII evidence snapshot fields:
  - `latestAudioDirectionSamplePresent`
  - `latestAudioDirectionStatus`
  - `latestAudioDirectionEvidenceLevel`
  - `latestAudioDirectionDirection`
  - `latestAudioDirectionConfidenceBucket`
  - `latestAudioDirectionSampleRateHz`
  - `latestAudioDirectionSamplesRead`
- Updated validator fixture coverage.

## Privacy Shape

The snapshot stores only status, direction enum, confidence bucket source value, evidence level, sample rate, sample count, and estimator source. It does not store PCM, raw audio, transcripts, speaker names, alert messages, Bluetooth owner names, or embeddings.

## Current Limits

- This does not run a direction sample automatically in the smoke script.
- Physical testers still need to tap `방향 샘플 점검` or record a direction validation trial before collecting evidence.
- This does not prove front/back direction; it records the evidence level that keeps that limitation visible.

## Verification

Checked on 2026-05-28T05:12:00+09:00.

- `./gradlew --no-daemon test assembleDebug --rerun-tasks`: passed.
- Canonical JSON parse check: passed for candidate, product plan, backend contract, QA report, and implementation lock.
- `bash -n scripts/android-device-smoke-test.sh`: passed.
- `bash -n scripts/glasses-integration-preflight.sh`: passed.
- `node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json`: passed with no warnings.
- APK manifest check: debug QA receivers, Meta DAT metadata, Android XR projected display category, and required permissions were present.
- `scripts/android-device-smoke-test.sh --skip-build --write-evidence`: returned expected code `2` because no ADB device is attached.
- `scripts/glasses-integration-preflight.sh --write-evidence --evidence-dir data/runs/20260528_voice_direction_mvp/30-glasses-preflight-evidence`: completed and wrote blocked preflight evidence.
