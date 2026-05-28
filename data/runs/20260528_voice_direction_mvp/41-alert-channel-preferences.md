# Alert Channel Preferences

## Goal

Let the tester choose which alert outputs are active before running phone, Ray-Ban, or Android XR device checks.

## Implemented

- Added `enabledAlertChannels` to persisted app settings.
- Added alert-channel encode/decode helpers for local storage.
- Added an `알림 채널` UI card with checkboxes for:
  - phone notification
  - phone vibration
  - TTS
  - Meta Display
  - Android XR Display
- Updated `AlertRouter` so it emits only enabled channel adapters.
- Wired both manual host-app evaluation and the foreground service to the same persisted channel preferences.
- Kept a guard that prevents disabling every alert channel.

## Privacy Boundary

- The stored setting contains only alert channel enum names.
- The delivery snapshot still stores channel/status fields only, not alert message text.
- The foreground service notification remains visible for microphone transparency even when directional phone notification output is disabled.

## Trial/Error

- Channel preferences are useful before Meta DAT and Android XR runtime access because they isolate test evidence per output path.
- Meta and Android XR channels are still stub adapters; disabling/enabling them now only controls whether the stub delivery row appears.
- Physical-device evidence still needs manual observation because the script cannot feel vibration, hear TTS, or see projected glasses UI.

## Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- Build and unit tests passed.
- Added unit coverage for `AlertRouter` channel filtering.
- Added unit coverage for alert channel set storage codec.

## Next Work

- On a physical phone, toggle each channel and confirm the next simulation/service run only records enabled delivery channels.
- On Ray-Ban or Android XR, use this setting to isolate phone-only, TTS-only, Meta-only, and Android-XR-only observations.
