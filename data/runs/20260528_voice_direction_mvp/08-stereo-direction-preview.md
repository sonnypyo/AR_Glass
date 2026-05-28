# Stereo Direction And Cue Preview Stage

Date: 2026-05-28 KST

## Goal

Make the glasses cue screen testable from the phone app and begin replacing simulated direction with a constrained, evidence-based direction estimator.

## Implemented

- `글래스 큐 미리보기` action in the host app.
- Direct launch path from `MainActivity` to `GlassesProjectedActivity`.
- `StereoPcmFrame` model.
- `StereoPcmDirectionEstimator` based on two-channel PCM energy balance.
- Unit tests for left, right, balanced, and mono inputs.

## What This Proves

- The projected cue screen can be opened without Android XR hardware for local preview.
- A stereo PCM input can produce rough left/right estimates without relying on the simulator.
- Mono or balanced audio returns `UNKNOWN` instead of fake precision.

## What This Does Not Prove Yet

- Phone or glasses hardware exposes two-channel PCM.
- Front/back estimation.
- Real-time `AudioRecord` integration.
- Actual Meta Ray-Ban or Android XR rendering.

## Verification

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test
./gradlew --no-daemon assembleDebug
```

Result: both commands passed. The refreshed debug APK was generated at:

```text
apps/voice-direction-glass/app/build/outputs/apk/debug/app-debug.apk
```

## Next Work

1. Add an `AudioRecord` capability probe that reports sample rate, channel count, and input source behavior without storing raw audio.
2. Install on a physical phone and verify the cue preview button.
3. Only wire `StereoPcmDirectionEstimator` into the service if real stereo PCM is available.
