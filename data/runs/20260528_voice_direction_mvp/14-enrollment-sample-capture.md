# Enrollment Sample Capture Stage

Date: 2026-05-28 KST

## Goal

Move from label-only speaker profiles toward real saved-voice enrollment without storing raw audio.

## Implemented

- In-memory mono PCM enrollment sample capture through `AndroidVoiceEnrollmentSampler`.
- `VoiceEnrollmentSampleAnalyzer` for RMS, peak, clipping ratio, and duration.
- Quality statuses: accepted, no permission, recorder unavailable, read failed, too quiet, clipped, error.
- Per-profile UI action: `음성 샘플 품질 수집`.
- Accepted sample count stored on `SpeakerProfile`.
- Enrollment status advances from `LABEL_ONLY` to `SAMPLE_CAPTURE_REQUIRED`, then `SAMPLES_CAPTURED_MODEL_PENDING` after three accepted samples.
- `VoiceDirectionGlass` diagnostic event: `enrollment_sample_completed`.

## Privacy Boundary

- Raw PCM is never written to repository storage.
- The app stores profile sample count and enrollment status only.
- Diagnostic logs use status and quality buckets, not audio or transcripts.

## What This Proves

- The app has a real microphone path for profile-specific enrollment sample quality checks.
- The code can reject quiet or clipped samples before any model work.
- Existing profile storage can represent sample progress.

## What This Does Not Prove Yet

- On-device speaker embedding extraction.
- Real speaker verification from live audio.
- Similar-voice false-positive behavior.
- Physical-device behavior, because no ADB device was attached locally.

## Verification

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test
./gradlew --no-daemon assembleDebug
```

Result: passed.

```bash
scripts/android-device-smoke-test.sh --skip-build
```

Result: expected no-device failure with exit code `2`.

## Next Work

1. Run the enrollment sample button on a physical phone and record accepted/retry behavior.
2. Select an on-device speaker embedding approach.
3. Generate local embeddings from accepted samples without storing raw PCM by default.
4. Add a real `SpeakerVerifier` implementation for `MODEL_READY` profiles.
