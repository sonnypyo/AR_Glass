# 48. Release Readiness Snapshot Automation

## Objective

Make the generated Android device evidence report include the app's release gate state, not only runtime smoke outputs.

## Changes

- Added `ReleaseReadinessSnapshotReceiver` in the debug source set.
- Registered `DEBUG_RELEASE_READINESS_SNAPSHOT` in the debug manifest.
- Updated `scripts/android-device-smoke-test.sh` to collect a release readiness snapshot after the repository evidence snapshot.
- Added a `Release Readiness Snapshot` section to generated `device-evidence.md`.
- Strengthened `scripts/validate-device-evidence.mjs` so physical evidence must include the release readiness snapshot and the `debug-alert-output-device-qa` phone-alpha gate id.
- Updated the validator fixture with release target counts and open checklist ids.

## Privacy Shape

The release readiness snapshot contains only:

- release target readiness booleans
- required item counts
- passed/manual/blocked counts
- open checklist ids

It does not include speaker labels, transcripts, alert text, audio, PCM, embeddings, or encrypted payloads.

## Current Limits

- This is gate-state evidence only.
- It intentionally reports `phoneReady=false` until physical phone manual rows are completed.
- It does not prove TTS audibility, vibration, display rendering, speaker matching, or direction accuracy.

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
- APK manifest contains `ReleaseReadinessSnapshotReceiver` and `DEBUG_RELEASE_READINESS_SNAPSHOT`.
- Smoke test without a connected ADB device still exits with expected code `2`.
- Glasses preflight evidence regenerated with expected blocked setup rows.
