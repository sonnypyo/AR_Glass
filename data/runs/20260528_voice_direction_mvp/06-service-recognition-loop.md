# Service Recognition Loop Stage

Date: 2026-05-28 KST

## Goal

Make the foreground service own the active listening prototype so the app moves closer to automatic detection instead of relying on Activity-only button flows.

## Implemented

- Persisted `VoiceDirectionSettings`.
- Repository save/load support for trigger phrase and simulated direction settings.
- `ListeningForegroundService` now creates its own speech recognition controller and detection engine.
- `AndroidListeningEngineFactory` keeps Activity-owned and Service-owned detection output configuration aligned.
- The service repeatedly listens, evaluates recognized text, stores detection metadata, routes alerts, and updates the foreground notification.
- Manual one-shot speech recognition is now labeled as a test action and disabled during active service sessions to avoid recognizer contention.

## What This Proves

- Active detection work can live inside the visible Android foreground service.
- The app can evaluate recognized speech without requiring a second UI button.
- Service-owned detection has enough persisted local state to run after the Activity is not the primary owner.

## What This Does Not Prove Yet

- Reliable long-running speech recognition on every Android device.
- Real speaker embeddings.
- Real directional audio.
- Glasses display or haptics.
- Encrypted storage.

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

1. Install on a physical Android device and observe service notification state changes.
2. Decide whether repeated `SpeechRecognizer` is acceptable for alpha or whether `AudioRecord` plus a local keyword/speaker model is required immediately.
3. Start Meta DAT adapter integration after credentials are available.
