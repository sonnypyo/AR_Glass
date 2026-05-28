# Product Plan

## Decision

Proceed with a constrained MVP: a native Android app with simulated direction first, then real Meta DAT and Android XR hardware validation. Do not promise full front/back/left/right accuracy until hardware audio capabilities are measured.

## Target User

People who wear smart glasses and want a subtle assistive cue when a known person calls them, especially while walking, working, using a phone, or in a noisy space.

## Core Job

When a trusted person's voice calls me, tell me who called and where to look without forcing me to pull out my phone.

## Primary Workflow

1. User enrolls a trusted speaker.
2. User sets a trigger phrase/name.
3. App listens during an active session.
4. App detects phrase and speaker match.
5. App estimates direction.
6. App sends a short cue to glasses and phone.
7. User can confirm correct/incorrect result for model improvement.

## MVP Features

- Speaker profile enrollment with consent prompt.
- Speaker profile state that distinguishes label-only simulation from real on-device voice embedding readiness.
- Short enrollment sample quality capture that analyzes PCM in memory and stores only sample metadata.
- Trigger phrase configuration.
- Foreground listening session with clear on/off state.
- Direction simulator for development and UI testing.
- Direction result model: `front`, `back`, `left`, `right`, `unknown`, plus confidence.
- Phone notification and vibration.
- Glasses adapter interface for Meta DAT display and Android XR projected UI.
- Local event history with no raw audio by default.
- Debug panel for testing false positives and hardware status.

## Non-Goals

- Secretly identifying people.
- Continuous cloud audio upload.
- Emergency/safety-critical navigation.
- Public release before SDK preview limits are resolved.
- Building one shared binary that fully supports Meta DAT, Android XR, and iOS in the first pass.

## Screens

- Home/session screen: start/stop listening, connected device, last detection.
- Enrollment screen: speaker name, consent, sample capture status.
- Trigger settings: call phrase/name, sensitivity.
- Alert detail: who, direction, confidence, output channel used.
- Device lab: Meta DAT state, Android XR state, simulator controls.
- Privacy/settings: data retention, delete profiles, debug export.

## Speaker Enrollment States

Current prototype:

- `TRANSCRIPT_LABEL_SIMULATION`: matches an enrolled label in recognized text. This is only for local development and UI/service testing.
- `LABEL_ONLY`: no real voice embedding exists yet.
- `SAMPLE_CAPTURE_REQUIRED`: one or two accepted enrollment samples exist, but more samples are needed.
- `SAMPLES_CAPTURED_MODEL_PENDING`: enough accepted samples have been counted for a first model build, but no embedding model has produced a usable profile yet.

Production path:

- `ON_DEVICE_EMBEDDING` plus `MODEL_READY`: the profile can be matched by a local speaker embedding model.

The app must not treat a model-required profile as verified by transcript text. That guard is now covered by unit tests.

## Analytics Events

PII-safe only:

- `session_started`
- `session_stopped`
- `speaker_enrollment_started`
- `speaker_enrollment_completed`
- `alert_emitted`
- `alert_user_marked_correct`
- `alert_user_marked_incorrect`
- `device_adapter_connected`
- `device_adapter_disconnected`

Do not include speaker names, raw phrases, transcripts, audio, exact location, or contact identifiers in analytics.

## Monetization Later

First version should be free/internal. If the utility proves useful, possible future model:

- Free: one enrolled speaker and local notifications.
- Paid: multiple trusted speakers, advanced tuning, cross-device profiles, richer glasses cues.

## Risks

- Direction estimation may be impossible or low-quality without raw multi-channel microphone access.
- Background listening may conflict with OS privacy limits.
- Meta DAT public release may remain limited to preview/test users.
- Android XR smart glasses hardware may be hard to acquire or APIs may shift.
- Speaker verification can create false positives in noisy spaces or with similar voices.
