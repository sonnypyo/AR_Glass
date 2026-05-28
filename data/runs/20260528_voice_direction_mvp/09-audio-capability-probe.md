# Audio Capability Probe Stage

Date: 2026-05-28 KST

## Goal

Add a safe device-side probe that reports whether Android claims mono or stereo PCM recording combinations are supported before connecting stereo direction estimation to live audio.

## Implemented

- `AudioCapabilityProbe` interface.
- `AudioProbeReport` and channel capability models.
- `AndroidAudioCapabilityProbe` using `AudioRecord.getMinBufferSize(...)` for 16 kHz, 44.1 kHz, and 48 kHz mono/stereo PCM.
- `AudioProbeSummaryFormatter`.
- `마이크 채널 점검` button in the host app.
- Unit tests for formatter output.

## What This Proves

- The app has a non-recording path to collect microphone capability hints.
- The user can run the check from the phone UI after granting microphone permission.
- The next AudioRecord step can be gated on real reported stereo support.

## What This Does Not Prove Yet

- Actual stereo channel separation.
- Stable real-time audio capture.
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
2. Run `마이크 채널 점검` and record the supported combinations.
3. If stereo support appears, add a short in-memory `AudioRecord` energy sample path without file persistence.
