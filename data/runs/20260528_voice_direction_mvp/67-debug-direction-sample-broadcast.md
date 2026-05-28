# Stage 67: Debug Direction Sample Broadcast

Date: 2026-05-28 KST

## Goal

Make the first physical-phone smoke run collect direction-sample status and microphone metadata automatically, without asking the tester to tap the manual direction sample button before the evidence snapshot.

## Implemented

- Added debug-only `DirectionSampleTestReceiver`.
- Wired `com.voicedirection.glass.qa.DEBUG_DIRECTION_SAMPLE_TEST` in the debug manifest.
- Updated `scripts/android-device-smoke-test.sh` to run the direction sample broadcast after the alert output test and before the non-PII evidence snapshot.
- Updated `scripts/validate-device-evidence.mjs` to require the debug direction setup row, functional row, broadcast output block, and status/evidence/microphone metadata markers.
- Updated the fixture report, physical-test checklist, template, release gate, and service process docs.

## Privacy Constraints

- The broadcast stores `AudioDirectionSampleSnapshot` only.
- Evidence includes status, evidence level, direction enum, confidence bucket, sample count, and microphone metadata counts.
- It does not persist raw audio, PCM, transcript text, speaker names, voice embeddings, or encrypted payload values.

## Trial/Error Notes

- `NO_STEREO_INPUT` is treated as script-pass because it documents the hardware route limitation without inventing direction.
- `NO_PERMISSION` remains a script failure because the smoke script grants microphone permission before this step.
- This is not a production direction accuracy gate; controlled direction evidence still lives in `docs/22-direction-accuracy-evidence.md`.

## Verification

- `node --check scripts/validate-device-evidence.mjs`: passed.
- `node --check scripts/validate-physical-test-session.mjs`: passed.
- `node --check scripts/create-physical-test-session.mjs`: passed.
- `bash -n scripts/android-device-smoke-test.sh`: passed.
- `node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json`: passed with `"ok": true`.
- `node scripts/validate-physical-test-session.mjs data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack --json`: passed with expected missing-hardware warnings.
- `JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk ./gradlew --no-daemon test assembleDebug`: passed.
- `JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk ./gradlew --no-daemon test assembleDebug bundleRelease`: passed.
- `aapt2 dump xmltree ... | rg "DirectionSampleTestReceiver|DEBUG_DIRECTION_SAMPLE_TEST"`: passed.
- `node scripts/audit-service-readiness.mjs --write-report --report-dir data/runs/20260528_voice_direction_mvp/52-service-readiness-audit`: passed and regenerated the audit report.
- `node scripts/validate-release-artifact-readiness.mjs --json`: passed default mode with `uploadReady=false`.
- `scripts/android-device-smoke-test.sh --skip-build --write-evidence`: expected failure code `2` because no ADB device is attached.
