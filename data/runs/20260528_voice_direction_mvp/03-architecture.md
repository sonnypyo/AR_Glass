# Architecture Stage

Date: 2026-05-28 KST

## Decision

Use Android native Kotlin as the first implementation. Keep detection, direction, and output adapters separate.

## Main Interfaces

- `AudioCaptureAdapter`
- `TriggerPhraseDetector`
- `SpeakerVerifier`
- `DirectionEstimator`
- `AlertOutputAdapter`
- `MetaDatAdapter`
- `AndroidXrProjectedAdapter`

## Verification Path

1. Simulator event fusion tests.
2. Phone notification/vibration tests.
3. Meta MockDeviceKit tests.
4. Meta Ray-Ban Display real session tests.
5. Android XR projected emulator/device tests.
