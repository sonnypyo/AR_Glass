# AR Glass Voice Direction

AR Glass Voice Direction is an Android-first wearable companion app for voice-aware direction alerts.

The app is designed for situations where a trusted person calls the user from nearby and the user needs a quick, low-distraction cue about where the call came from. It recognizes a saved speaker profile, estimates the caller direction, and delivers the cue through the best available output path: phone notification, vibration, TTS, glasses display cue, or platform-specific fallback.

The project targets Meta Ray-Ban Display, Ray-Ban Meta Gen 1 fallback flows, and Android XR-style projected experiences. Android phone install/run and alert proof are the first real hardware milestone; phone outputs are still not proof of glasses support.

## What It Does

- Stores trusted speaker profiles with explicit consent.
- Detects configured call phrases such as the user's name.
- Estimates direction as front, back, left, right, or unknown depending on available signal quality.
- Sends clear alerts through phone notification, vibration patterns, and TTS.
- Provides adapter boundaries for Meta Ray-Ban Display and Android XR projected cue support.
- Keeps private voice data local-first and avoids storing raw audio by default.

## Repository Map

- `apps/voice-direction-glass`: Android Kotlin app.
- `docs`: architecture, platform notes, privacy rules, and hardware test runbooks.
- `scripts`: local validation, evidence, privacy, and hardware-test helpers.
- `data/canonical`: product, backend, and QA artifacts.
- `data/runs`: implementation history and generated test artifacts.

## Tech Stack

- Kotlin
- Android
- Jetpack Compose
- Android foreground service
- Android SpeechRecognizer/TextToSpeech
- Local encrypted storage
- Meta Wearables Device Access Toolkit integration boundary
- Android XR projected experience integration boundary

## Privacy

The app is built around explicit consent, local-first processing, redacted diagnostics, and no raw-audio persistence by default.
