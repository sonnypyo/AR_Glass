# 50. Audio Direction Evidence Classifier

## Objective

Make direction sample output harder to misread as a proven front/back/left/right feature before physical hardware evidence exists.

## Changes

- Added `AudioDirectionEvidenceClassifier`.
- Added evidence levels:
  - `LEFT_RIGHT_USABLE`
  - `LOW_CONFIDENCE`
  - `FRONT_BACK_UNPROVEN`
  - `UNAVAILABLE`
- Updated `AudioDirectionSampleSummaryFormatter` to show `판정` and `지침` lines.
- Added unit tests for:
  - high-confidence left/right sample
  - unavailable stereo input
  - `UNKNOWN` low-confidence sample
  - front/back unproven sample

## Reasoning

The product goal includes notifying direction through glasses, but current phone-hosted stereo energy can only support rough left/right evidence. Front/back requires stronger hardware evidence such as a microphone array, timing data, head pose, or vision context. The app should make that limitation visible in every direction sample result instead of relying only on documentation.

## Current Limits

- This does not improve direction accuracy by itself.
- It does not prove real phone or glasses microphone behavior.
- It prevents premature product claims by labeling weak or unsupported results clearly.

## Verification

From `apps/voice-direction-glass`:

```bash
JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk ./gradlew --no-daemon test assembleDebug
```

From the repository root:

```bash
node -e 'JSON.parse(...)'
bash -n scripts/android-device-smoke-test.sh
bash -n scripts/glasses-integration-preflight.sh
node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json
aapt2 dump xmltree apps/voice-direction-glass/app/build/outputs/apk/debug/app-debug.apk --file AndroidManifest.xml
scripts/android-device-smoke-test.sh --skip-build --write-evidence
scripts/glasses-integration-preflight.sh --write-evidence --evidence-dir data/runs/20260528_voice_direction_mvp/30-glasses-preflight-evidence
```

Result:

- Gradle `test assembleDebug`: passed.
- Canonical JSON and implementation lock parse: passed.
- Evidence validator fixture: passed with `"ok": true`.
- APK manifest still contains the debug QA receivers and glasses metadata.
- Smoke test without a connected ADB device still exits with expected code `2`.
- Glasses preflight evidence regenerated with expected blocked setup rows.
