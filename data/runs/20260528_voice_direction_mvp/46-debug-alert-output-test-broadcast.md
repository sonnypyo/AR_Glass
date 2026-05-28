# 46. Debug Alert Output Test Broadcast

## Objective

Move the direct alert-output check from a UI-only manual path into the ADB smoke evidence path, so a physical-device run can prove the shared alert router emits a generic test cue through the currently enabled channels before the non-PII evidence snapshot is collected.

## Why This Matters

The app already had an `알림 출력 점검` button, but the device evidence script could only ask a tester to press it manually. For automation, the debug APK now exposes a QA-only broadcast that emits the same kind of direction-only test cue, saves only channel/status counts, and marks the latest delivery source as `TEST_CUE`.

## Changes

- Added `AlertOutputTestReceiver` under the debug source set only.
- Registered `com.voicedirection.glass.qa.DEBUG_ALERT_OUTPUT_TEST` in the debug manifest.
- Updated `scripts/android-device-smoke-test.sh` to run the alert output broadcast after Activity launch and before repository evidence snapshot collection.
- Updated generated evidence output to include:
  - `Debug alert output test: script-pass`
  - `Debug alert output test broadcast runs`
  - the raw non-PII broadcast result block
- Strengthened `scripts/validate-device-evidence.mjs` so generated evidence must include the debug alert output script-pass row and `latestDeliverySource=TEST_CUE`.
- Updated device test docs, evidence template, release gate, wiki, and final report.

## Privacy Shape

The broadcast output contains only:

- pass/fail
- enabled channel count
- delivery count
- delivered count
- delivery source enum
- per-channel delivery status enum
- non-PII message state

It does not include transcript, speaker label, alert body, raw audio, PCM, embedding values, or encrypted payloads.

## Current Limits

- The broadcast proves routing and delivery bookkeeping only.
- It does not prove that TTS was audible, vibration was felt, or a glasses display rendered visibly.
- It does not prove voice detection, speaker verification, or direction accuracy.
- Physical Android phone evidence is still required because no ADB device is attached in this workspace.

## Verification

From `apps/voice-direction-glass`:

```bash
JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk ./gradlew --no-daemon test assembleDebug
```

From the repository root:

```bash
node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json
bash -n scripts/android-device-smoke-test.sh
aapt2 dump xmltree apps/voice-direction-glass/app/build/outputs/apk/debug/app-debug.apk --file AndroidManifest.xml
scripts/android-device-smoke-test.sh --skip-build --write-evidence
scripts/glasses-integration-preflight.sh --write-evidence --evidence-dir data/runs/20260528_voice_direction_mvp/30-glasses-preflight-evidence
```

Result:

- Gradle `test assembleDebug`: passed.
- JSON canonical parse: passed.
- Device evidence validator fixture: passed with `"ok": true`.
- Smoke script shell syntax/help path: passed.
- APK manifest contains `AlertOutputTestReceiver` and `DEBUG_ALERT_OUTPUT_TEST`.
- Smoke test without a connected ADB device exited with expected code `2`.
- Glasses preflight evidence was regenerated with blocked setup rows, as expected until credentials/devices are attached.
