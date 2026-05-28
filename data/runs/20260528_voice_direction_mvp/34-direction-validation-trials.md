# Direction Validation Trials

Date: 2026-05-28 KST

## Goal

Make physical direction testing repeatable before calling any direction behavior reliable.

The app now records expected-vs-observed direction trials for front, back, left, and right. This gives the phone/Ray-Ban/Android XR test pass a structured evidence path instead of relying only on handwritten notes.

## Implemented

- Added `DirectionValidationTrial`, `DirectionValidationStatus`, and `DirectionValidationSummarizer`.
- Added encrypted local storage for direction validation trials through the existing repository path.
- Added a `방향 검증 기록` section in the microphone card.
- Added controls to choose expected direction, record the current one-shot direction sample, and clear trial history.
- Added evidence rows and log requirements for `direction_validation_trial_recorded`.

## Privacy Boundary

- No PCM is stored.
- No transcript is stored.
- No speaker label is stored.
- Persisted trial data is limited to expected direction, observed direction, status, confidence, sample rate, sample count, source label, and timestamp.

## Trial/Error Notes

- Front/back remains unproven. The trial UI can record front/back attempts, but a phone stereo energy estimator should still return `UNKNOWN` unless stronger hardware evidence exists.
- A trial mismatch is evidence, not a bug by itself. Direction claims must be promoted only after enough controlled trials pass.
- Bluetooth HFP route trials are useful for input routing proof but are not enough for reliable direction-of-arrival because HFP is generally single-microphone.

## Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon testDebugUnitTest
```

Result:

- `testDebugUnitTest`: passed after adding direction validation models, storage codecs, repository methods, and UI wiring.

## Next Work

- Run at least left/right controlled trials on a physical Android phone.
- Run the same trial workflow after selecting a Ray-Ban or Android XR Bluetooth route.
- Keep front/back marked unproven unless Android XR projected context, wearable microphone array data, head pose, or vision evidence supports it.
