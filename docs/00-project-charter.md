# Project Charter

## Product Name

Working name: **Voice Direction Glass**
Korean shorthand: **보이스 방향 알림 글래스**

## Goal

Build a glasses-linked app that detects when a saved person calls the user by voice/name, estimates the caller direction, and alerts the user through the least distracting available output: glasses visual cue, audio/TTS, phone notification, phone vibration, and later glasses-side haptics if an official API supports it.

## Narrowed Execution Goal

As of 2026-06-01, the goal is narrowed to reduce wasted work and token usage.

The next goal is not "finish the whole commercial service." The next goal is:

1. Make the Android phone MVP run on a real device.
2. Prove the alert path with phone notification, vibration, and TTS.
3. Collect controlled direction evidence for front, back, left, and right.
4. Use Meta Ray-Ban Display, Ray-Ban Gen 1, and Android XR only after the phone lane is proven.

Do not add new broad planning documents, new agent frameworks, new release paperwork, new market research, or new platform abstractions unless they directly unblock one of the four items above.

## User Problem

The user may be focused on a phone, moving outside, wearing glasses, or unable to immediately tell who called them and from which direction. The app should surface only the useful signal: who called, from where, and how urgent/confident the detection is.

## Target Hardware

- Primary test hardware: Meta Ray-Ban Display.
- Secondary test hardware: Ray-Ban Meta Gen 1.
- Future target: Android XR audio/display glasses, including developer kits if needed.
- Host phone: Android phone first. iPhone support is a later phase.

## MVP Outcome

The MVP is successful when it can:

1. Store one or more enrolled speaker profiles with explicit consent.
2. Detect a configured call phrase such as the user's name.
3. Match the likely enrolled speaker.
4. Produce a directional result with confidence.
5. Notify the user on phone and glasses using available platform APIs.
6. Log enough local diagnostic data to debug false positives without storing raw audio by default.

For the next execution window, success is smaller:

- one Android phone build/install/run path works;
- one saved/test speaker flow can trigger a local alert;
- the app records redacted direction evidence;
- the next hardware blocker is concrete and not speculative.

## MVP Boundaries

Included:

- Android-native companion app.
- Local-first speaker profile storage.
- Direction detection abstraction with simulator mode.
- Meta DAT adapter plan.
- Android XR projected activity plan.
- Device test checklist for Meta Ray-Ban Display, Ray-Ban Meta Gen 1, and Android XR.

Excluded for first build:

- Public app-store launch.
- Cloud voice identification by default.
- Always-on background recording without clear OS permission flow.
- Claims of precise direction before hardware validation.
- Glasses-only vibration unless official haptics APIs are confirmed.

## Technical Stack

- Mobile: Kotlin, Android Studio, Jetpack Compose.
- Android XR: Jetpack XR SDK, Jetpack Projected, Jetpack Compose Glimmer, Android `SpeechRecognizer`, Android `TextToSpeech`, CameraX where needed.
- Meta glasses: Meta Wearables Device Access Toolkit for Android: public setup lists `mwdat-core`, `mwdat-camera`, and `mwdat-mockdevice`; display cue APIs/modules must be confirmed through authenticated DAT docs before replacing the stub adapter.
- Audio: Android foreground service, `AudioRecord` where available, on-device keyword/phrase detection, speaker verification via local embeddings/TFLite candidate model.
- Direction: adapter-based direction estimator; simulator first, device microphone/camera proofs second.
- Notifications: Android notification channels, phone vibration, glasses display/TTS adapters.
- Storage: encrypted local storage first. Backend only for opt-in backup, tester management, and anonymized crash/quality telemetry.
- QA: MockDeviceKit, Android XR emulator/projected testing, real hardware logs, false-positive/false-negative test set.

## Success Metrics

- Detection latency under 1.5 seconds after the call phrase in controlled tests.
- False positive rate below 1 per hour in quiet indoor tests.
- Direction accuracy at least 80% for left/right in supported hardware tests.
- User can understand the alert within one glance or one short vibration/audio cue.
- No raw audio leaves the phone unless the user explicitly enables a research/debug mode.
