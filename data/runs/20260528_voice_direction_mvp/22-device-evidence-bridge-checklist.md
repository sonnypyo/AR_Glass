# Device Evidence Bridge Checklist Stage

Date: 2026-05-28 KST

## Goal

Update the physical-device evidence workflow so it verifies the latest automatic service path: trigger phrase, prototype voice match, direction sample bridge, notification, and projected cue.

## Implemented

- Updated `scripts/android-device-smoke-test.sh --write-evidence` generated report.
- Added manual rows for service-side prototype voice match.
- Added manual rows for service-side direction sample bridge.
- Added required log events for `service_prototype_voice_sample_started`, `service_prototype_voice_evaluation_completed`, and `service_prototype_voice_match_completed`.
- Added bridge-specific direction notes for `audioDirectionStatus`, `usedAudioDirection`, observed direction, and confidence bucket.
- Updated `docs/09-device-evidence-template.md`.
- Updated `docs/08-device-test-plan.md`.

## Trial/Error Notes

- The script still cannot prove UI taps, felt vibration, or glasses rendering. Those remain manual rows.
- The generated report now treats `UNKNOWN` as a valid observed direction when audio confidence is weak.
- The report continues to forbid transcripts, speaker names, PCM, and embedding values.

## Verification

```bash
bash -n scripts/android-device-smoke-test.sh
scripts/android-device-smoke-test.sh --help
scripts/android-device-smoke-test.sh --skip-build --write-evidence
node -e "const fs=require('fs'); for (const f of ['data/canonical/app-candidates/voice-direction-glass.json','data/canonical/voice-direction-glass.product-plan.json','data/canonical/voice-direction-glass.backend-contract.json','data/canonical/voice-direction-glass.qa-report.json','apps/voice-direction-glass/agent-output/implementation.lock.json']) { JSON.parse(fs.readFileSync(f,'utf8')); console.log('valid', f); }"
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- Script syntax/help passed.
- No-device evidence path exits with code `2`, as expected when no ADB device is attached.
- Canonical JSON validation passed.
- Gradle test/build passed.

## Next Work

1. Run the updated evidence script on a physical phone.
2. Fill the new service automation bridge rows.
3. Compare generated log evidence against the required event list.
