# 47. Release Gate Debug Alert Output

## Objective

Keep the in-app release readiness checklist synchronized with the documented phone private alpha gate after adding debug alert-output broadcast automation.

## Changes

- Added `debug-alert-output-device-qa` to `VoiceDirectionReleaseChecklist`.
- Marked the item as `MANUAL_REQUIRED` for `PHONE_PRIVATE_ALPHA`.
- Updated the release checklist unit test so phone private alpha now requires ten manual device-evidence items.

## Reasoning

`docs/10-release-readiness.md` already required generated evidence to show the debug alert output test as script-pass and the following snapshot as `latestDeliverySource=TEST_CUE`. Without the same item in `ReleaseReadiness.kt`, the app-side QA model and human-readable release gate could drift.

## Current Limits

- This is still a device evidence gate, not a pass.
- No physical Android phone is attached in the current workspace.
- The next proof must come from `scripts/android-device-smoke-test.sh --write-evidence` on a connected phone.

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
- APK manifest still contains `AlertOutputTestReceiver` and `DEBUG_ALERT_OUTPUT_TEST`.
- Smoke test without a connected ADB device still exits with expected code `2`.
- Glasses preflight evidence regenerated with expected blocked setup rows.
