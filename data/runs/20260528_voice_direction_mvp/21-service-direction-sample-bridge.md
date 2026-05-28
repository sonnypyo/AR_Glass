# Service Direction Sample Bridge Stage

Date: 2026-05-28 KST

## Goal

Move the automatic service path closer to the user's direction-alert goal: after a saved/prototype voice match, try to infer whether the caller is left or right before sending the phone/glasses cue.

## Implemented

- Added `ServiceDirectionResolver`.
- Connected `ListeningForegroundService` to `AndroidStereoDirectionSampler` through `AndroidAudioCapabilityProbe`.
- The service now tries one short stereo direction sample after prototype voice matching.
- If a stereo sample succeeds, the service uses that direction estimate for the detection event and alert cue.
- If stereo sampling is unavailable or fails, the service falls back to the saved prototype direction setting.
- If the stereo sample succeeds but returns `UNKNOWN`, the service preserves `UNKNOWN` rather than inventing a fallback direction.
- Added unit tests for sampled direction, sampled `UNKNOWN`, fallback behavior, and engine use of an externally resolved direction estimate.

## Why This Matters

Before this stage, automatic service alerts used only the saved simulator direction. Now a phone or future glasses device that exposes useful stereo PCM can influence the service alert direction without storing raw audio.

## Privacy Boundary

- The direction sampler reads a short transient in-memory PCM buffer.
- Raw PCM is not persisted.
- Diagnostics log only direction sample status, whether audio direction was used, direction enum, and confidence bucket.

## Limitations

- This still proves only a left/right-style stereo bridge, not front/back direction.
- Android phone microphone layouts vary, so a physical phone must prove whether stereo input is available.
- The service currently samples voice identity and direction sequentially after `SpeechRecognizer`; real device timing may reduce usefulness.
- Real Meta DAT and Android XR direction sources remain unverified.

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

1. Validate on a physical phone with `scripts/android-device-smoke-test.sh --write-evidence`.
2. Compare left/right side calls against service logs: `audioDirectionStatus`, `usedAudioDirection`, `direction`, and `directionConfidence`.
3. Keep `UNKNOWN` as the correct result when hardware evidence is weak.
