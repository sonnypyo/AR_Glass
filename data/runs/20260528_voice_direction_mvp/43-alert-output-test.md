# Alert Output Test

## Goal

Allow testers to verify phone notification, vibration, TTS, Meta Display, and Android XR Display output routing without needing a live voice recognition event.

## Implemented

- Exposed the Android alert router factory for UI diagnostics.
- Added `알림 출력 점검` to the alert-channel card.
- The button builds a direction-only test cue from the currently selected direction and confidence.
- It emits only enabled alert channels.
- It persists the latest alert delivery snapshot with an `alert-test-*` id.
- It does not append a detection event or store any transcript/audio/speaker content.
- It logs `alert_output_test_completed` with direction enum, enabled channel count, delivery count, and delivered count.

## Privacy Boundary

- The test cue uses a generic title and direction/confidence body.
- The repository stores only channel/delivered status in the latest delivery snapshot.
- No detection event, transcript, raw audio, PCM, embedding, or speaker label is created by this diagnostic.

## Trial/Error

- `호출 감지 시뮬레이션` still validates event fusion, but it depends on phrase/speaker setup and currently runs in the active session workflow.
- A direct output test is better for the first physical phone pass because testers can isolate notification, vibration, TTS, Meta stub, and Android XR stub channels before evaluating voice detection.
- Real hardware observation is still required; unit tests cannot feel vibration, hear TTS, or see projected display output.

## Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- Build and unit tests passed.

## Next Work

- On a physical phone, toggle one channel at a time, tap `알림 출력 점검`, and record enabled channel names plus delivery counts only.
- With Ray-Ban/Android XR connected, use this button to isolate phone-only, TTS-only, Meta-only, and Android-XR-only output observations.
