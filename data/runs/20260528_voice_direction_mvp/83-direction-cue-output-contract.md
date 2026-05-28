# Stage 83: Direction Cue Output Contract

Date: 2026-05-28 KST

## Decision

Add an in-app direction cue output contract card before physical phone/glasses testing.

## Reasoning

The project already had phone notification, vibration, TTS, Meta display, and Android XR display output paths, but a tester still had to infer what each selected direction should produce. Before the first real phone/Ray-Ban/Android XR session, the app should show the intended cue shape directly in the operational UI: notification text, vibration signature, TTS phrase, and non-PII glasses evidence summary.

## Implemented

- `DirectionCueOutputContract.kt` combines the existing vibration mapper, TTS formatter, and glasses cue payload summary into one output contract.
- `VoiceDirectionApp.kt` now shows a `방향 큐 계약` card after alert channel settings.
- `DirectionCueOutputContractsTest.kt` verifies right-direction output, privacy boundaries, and unique vibration signatures for all directions.
- `docs/31-direction-cue-output-contract.md` records how to use the contract during hardware tests.
- `scripts/audit-service-readiness.mjs` now includes the cue contract document as a local evidence artifact.

## Trial/Error Notes

- This is not a new alert path; it deliberately reuses existing production-path helpers so UI, tests, and adapters stay aligned.
- The phone fallback remains pattern-coded only. It does not imply per-side phone motors or glasses haptics.
- The glasses evidence summary remains non-PII and omits speaker label text.

## Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- Unit tests passed.
- Debug APK assembled.
- The Compose host app compiled with the new cue contract card.
