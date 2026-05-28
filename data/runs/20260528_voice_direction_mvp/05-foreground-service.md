# Foreground Service Stage

Date: 2026-05-28 KST

## Goal

Create the Android lifecycle shell required for a visible microphone session before adding continuous audio capture, speaker verification, or glasses SDK output.

## Implemented

- `ListeningForegroundService`
- `ListeningControlReceiver`
- Manifest service declaration with `android:foregroundServiceType="microphone"`
- Runtime `RECORD_AUDIO` gate before service start
- Persistent notification titled `Voice Direction Glass 실행 중`
- Notification stop action
- Main app start/stop wiring
- Activity resume synchronization with the service running flag

## What This Proves

- The app now has a policy-aligned place to run longer listening work.
- The user can see when the listening session is active.
- The listening session can be stopped from the notification without reopening the app.

## What This Does Not Prove Yet

- Continuous Android speech recognition reliability.
- Speaker embedding capture or matching on real audio.
- Front/back/left/right direction from real microphones.
- Meta Ray-Ban Display or Android XR rendering.

## Verification

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test
./gradlew --no-daemon assembleDebug
```

Result: both commands passed. The debug APK was generated at:

```text
apps/voice-direction-glass/app/build/outputs/apk/debug/app-debug.apk
```

## Next Work

1. Install the APK on a phone and verify the foreground notification.
2. Verify service-owned recognition on the phone.
3. Service-owned recognition was added in `06-service-recognition-loop.md`.
4. Add controlled audio fixtures for direction evidence.
