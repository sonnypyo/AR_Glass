# Stage 84: Cue Contract Device Evidence

Date: 2026-05-28 KST

## Decision

Add cue output contract markers to the debug alert-output device evidence path.

## Reasoning

The app now shows a `방향 큐 계약` card, but physical phone reports also need machine-checkable evidence that the intended output contract was present during the ADB smoke run. The right place is the existing debug alert-output broadcast because it emits the same generic test cue used for output checks.

## Implemented

- `DirectionCueOutputContracts.cueForDirection(...)` now creates the shared generic output-test cue.
- `MainActivity.runAlertOutputTest` uses the shared cue helper.
- `AlertOutputTestReceiver` uses the shared cue helper and appends non-PII cue contract markers:
  - `cueContractDirection`
  - `cueContractConfidencePercent`
  - `cueContractNotificationDirection`
  - `cueContractTtsDirectionOnly`
  - `cueContractTtsSpeakerLabelIncluded`
  - `cueContractDisplayEvidence`
- `scripts/validate-device-evidence.mjs` requires those markers in generated `device-evidence.md`.
- `scripts/android-device-smoke-test.sh` describes the debug alert output row as channel/status plus non-PII cue contract metadata.
- The validator fixture includes the new markers.

## Trial/Error Notes

- The report intentionally does not store full alert message text.
- `cueContractDisplayEvidence` stores direction, confidence percent, and label-present state only.
- This still proves output contract bookkeeping only. Physical vibration feel, TTS audibility, projected display visibility, and direction accuracy remain manual/hardware gates.

## Verification

From the repository root:

```bash
node --check scripts/validate-device-evidence.mjs
bash -n scripts/android-device-smoke-test.sh
node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json
```

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- Device evidence validator syntax passed.
- Smoke script syntax passed.
- Fixture validation returned `"ok": true`.
- Unit tests passed.
- Debug APK assembled.
