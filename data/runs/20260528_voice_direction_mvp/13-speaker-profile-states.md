# Speaker Profile States Stage

Date: 2026-05-28 KST

## Goal

Separate the current label-based development simulator from future real voice embedding verification.

## Implemented

- `SpeakerVerificationMode`
  - `TRANSCRIPT_LABEL_SIMULATION`
  - `ON_DEVICE_EMBEDDING`
- `SpeakerEnrollmentStatus`
  - `LABEL_ONLY`
  - `SAMPLE_CAPTURE_REQUIRED`
  - `MODEL_READY`
- `SpeakerProfile` fields for verification mode, enrollment status, and sample count.
- Local profile codec support for both old 5-field rows and new 8-field rows.
- Simulated verifier guard so model-required profiles are not matched by transcript text.
- UI row status for verification mode, enrollment status, and sample count.

## What This Proves

- The app can now represent whether a profile is only a simulator label or is intended for a real local voice model.
- The simulator cannot silently pretend an `ON_DEVICE_EMBEDDING` profile is verified.
- Existing local development data can still be read.

## What This Does Not Prove Yet

- Audio sample capture for speaker enrollment.
- On-device speaker embedding extraction.
- Real speaker verification against live audio.
- False-positive rate against similar voices.

## Verification

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test
```

Result: passed.

## Next Work

1. Add consented enrollment sample capture that records transient PCM quality metrics without saving raw audio by default.
2. Select or train an on-device speaker embedding model.
3. Replace `SimulatedSpeakerVerifier` with an adapter that can evaluate a live embedding against `MODEL_READY` profiles.
4. Run same-room, noisy-room, and similar-voice false-positive tests.
