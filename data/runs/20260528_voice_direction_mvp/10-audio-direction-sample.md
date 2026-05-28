# Audio Direction Sample Stage

Date: 2026-05-28 KST

## Goal

Add a safe local diagnostic that can read a short stereo PCM buffer in memory and calculate rough left/right direction without saving raw audio.

## Implemented

- `AudioDirectionSampler` interface.
- `AudioDirectionSampleResult` and status model.
- `AndroidStereoDirectionSampler` using `AudioRecord.Builder`.
- `AudioDirectionSampleSummaryFormatter`.
- Host app `방향 샘플 점검` button.
- Unit tests for summary formatting.

## What This Proves

- The app has a concrete path from live PCM to `StereoPcmDirectionEstimator`.
- PCM remains transient and is reduced immediately to direction/confidence metadata.
- The diagnostic is separated from the always-on service until device behavior is measured.

## What This Does Not Prove Yet

- The connected phone exposes useful stereo PCM.
- The sample result is stable across rooms, pockets, and device orientations.
- Front/back direction.
- Glasses microphone access.

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

1. Install on a physical phone.
2. Run `마이크 채널 점검`.
3. If stereo appears, run `방향 샘플 점검` from left and right positions and record confidence.
4. Promote the sampler into the foreground service only after useful device evidence exists.
