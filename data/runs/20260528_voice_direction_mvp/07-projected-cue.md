# Projected Cue Stage

Date: 2026-05-28 KST

## Goal

Connect actionable voice-direction detections to a glasses-facing projected cue screen before real Meta DAT and Android XR SDK adapters are available.

## Implemented

- `GlassesCueSnapshot` stores latest actionable cue metadata.
- `LocalStorageCodecs` can encode/decode the cue.
- `VoiceDirectionRepository` exposes `latestGlassesCue`.
- `MainActivity` and `ListeningForegroundService` save the latest cue after actionable detections.
- `GlassesProjectedActivity` reads the latest cue on create/resume.
- `GlassesCueScreen` renders status, speaker, direction, and confidence.

## What This Proves

- Detection results can flow from phone/service logic into a glasses-facing UI surface.
- The projected screen can be tested separately from Meta DAT/Android XR SDK credentials.
- The latest cue path avoids raw audio and full transcript storage.

## What This Does Not Prove Yet

- Actual Meta Ray-Ban Display rendering.
- Actual Android XR projected launch on glasses hardware.
- Live cue updates while the projected screen is already open.
- Real direction estimation.

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

1. Test on a connected Android phone.
2. Confirm whether the projected Activity can be launched on Android XR hardware.
3. Replace the display stub with Meta DAT rendering when credentials are available.
