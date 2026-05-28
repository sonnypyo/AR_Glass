# Service Bridge UI Snapshot Stage

Date: 2026-05-28 KST

## Goal

Make the latest service automation result visible on the phone so physical testing does not depend only on logcat.

## Implemented

- Added `ServiceAutomationBridgeSnapshot`.
- Added local encode/decode support for the snapshot.
- Added repository support for saving/loading the latest service automation bridge snapshot.
- Updated the foreground service to save the snapshot after prototype voice and direction bridge evaluation.
- Added `latestServiceAutomationBridge` to `ListeningSessionState`.
- Added a `서비스 자동화 진단` card to the Compose UI.
- Updated Activity resume/local restore flow so the card reflects the latest service result after returning to the app.
- Added the diagnostic card to the smoke evidence script/template/test plan.

## What The Card Shows

- Actionable vs condition-not-met.
- Voice sample status.
- Prototype match status.
- Similarity percentage.
- Direction enum and confidence percentage.
- Audio direction sample status.
- Whether sampled audio direction was used.
- Source adapter.

## Privacy Boundary

- The snapshot stores no transcript, raw PCM, embedding values, or speaker names.
- It stores only statuses, confidence values, direction enum, source, event id, and timestamp.

## Limitations

- The card updates when the Activity restores/resumes from local storage; it is not a live streaming dashboard.
- Actual runtime usefulness still requires physical phone testing.
- At this stage, the snapshot was still stored in development plaintext `SharedPreferences`. This was superseded by `25-encrypted-local-storage.md`; physical-device encrypted-storage proof remains pending.

## Verification

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
node -e "const fs=require('fs'); for (const f of ['data/canonical/app-candidates/voice-direction-glass.json','data/canonical/voice-direction-glass.product-plan.json','data/canonical/voice-direction-glass.backend-contract.json','data/canonical/voice-direction-glass.qa-report.json','apps/voice-direction-glass/agent-output/implementation.lock.json']) { JSON.parse(fs.readFileSync(f,'utf8')); console.log('valid', f); }"
bash -n scripts/android-device-smoke-test.sh
scripts/android-device-smoke-test.sh --help
scripts/android-device-smoke-test.sh --skip-build --write-evidence
```

Result:

- Gradle test/build passed.
- Canonical JSON validation passed.
- Smoke script syntax/help passed.
- No-device smoke path exits with code `2`, as expected when no ADB device is attached.

## Next Work

1. Verify it on a physical phone after service-side prototype voice and direction bridge runs.
