# 49. Glasses Readiness Snapshot Automation

## Objective

Make generated Android device evidence include the Meta DAT and Android XR glasses readiness gate state.

## Changes

- Added `GlassesReadinessSnapshotReceiver` in the debug source set.
- Registered `DEBUG_GLASSES_READINESS_SNAPSHOT` in the debug manifest.
- Updated `scripts/android-device-smoke-test.sh` to collect a glasses readiness snapshot after the release readiness snapshot.
- Added a `Glasses Readiness Snapshot` section to generated `device-evidence.md`.
- Strengthened `scripts/validate-device-evidence.mjs` so physical evidence must include Meta DAT and Android XR readiness ids.
- Updated the validator fixture with current Meta DAT and Android XR counts and open checklist ids.

## Privacy Shape

The glasses readiness snapshot contains only:

- glasses alpha readiness boolean
- per-platform item counts
- per-platform pass/manual/blocked counts
- open checklist ids

It does not include speaker labels, transcripts, alert text, audio, PCM, embeddings, Bluetooth device owner names, or encrypted payloads.

## Current Limits

- This is gate-state evidence only.
- It intentionally reports `glassesAlphaReady=false` until Meta credentials, real adapters, and hardware proof exist.
- It does not prove Ray-Ban Display rendering, Android XR projected runtime, glasses microphone routing, direction accuracy, or glasses-side haptics.

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
- APK manifest contains `GlassesReadinessSnapshotReceiver` and `DEBUG_GLASSES_READINESS_SNAPSHOT`.
- Smoke test without a connected ADB device still exits with expected code `2`.
- Glasses preflight evidence regenerated with expected blocked setup rows.
