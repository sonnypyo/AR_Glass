# Release Readiness Checklist Stage

Date: 2026-05-28 KST

## Goal

Make the next promotion target explicit so prototype work, phone private alpha, glasses alpha, external beta, and production service are not mixed together.

## Implemented

- Added `ReleaseReadiness.kt` under the Android app QA package.
- Added unit coverage for checklist uniqueness, internal prototype readiness, phone manual evidence, glasses blockers, and production blockers.
- Added `docs/10-release-readiness.md` as the human-readable promotion gate.

## Current Readiness

| Target | Status |
| --- | --- |
| Internal prototype | Ready |
| Phone private alpha | Manual evidence required |
| Glasses private alpha | Blocked |
| External beta | Blocked |
| Production service | Blocked |

## Open Phone Evidence

- Physical Android phone smoke test.
- Foreground speech loop runtime behavior.
- Prototype enrollment and live voice match with real speakers.
- Thirty-minute false-positive run.

## Blocked Glasses/Service Evidence

- Meta DAT credentials/package access.
- Ray-Ban Display cue rendering proof.
- Android XR projected display proof.
- Encrypted storage migration.
- Production-grade on-device speaker verification.
- Front/back direction evidence.
- Store/SDK/policy clearance.
- Support and mistaken-alert incident process.

## Trial/Error Notes

- This stage does not add new hardware behavior. It prevents accidental promotion by forcing every target to account for missing evidence.
- `MANUAL_REQUIRED` means a connected device can close the item.
- `BLOCKED` means another dependency must be solved first, such as SDK access, hardware, model selection, or policy review.

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
- JSON validation passed.
- Script syntax/help passed.
- No-device smoke path still exits with code `2`, as expected when no ADB device is attached.
