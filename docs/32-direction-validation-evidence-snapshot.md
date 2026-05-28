# Direction Validation Evidence Snapshot

Date: 2026-05-28 KST

## Purpose

This document defines how expected-vs-observed direction trials should appear in the app UI and generated device evidence before any front/back or four-direction claim.

## Source of Truth

- `apps/voice-direction-glass/app/src/main/kotlin/com/voicedirection/glass/model/DirectionValidation.kt`
- `apps/voice-direction-glass/app/src/main/kotlin/com/voicedirection/glass/ui/VoiceDirectionApp.kt`
- `apps/voice-direction-glass/app/src/debug/kotlin/com/voicedirection/glass/qa/DirectionValidationTrialReceiver.kt`
- `apps/voice-direction-glass/app/src/debug/kotlin/com/voicedirection/glass/qa/EvidenceSnapshotReceiver.kt`
- `scripts/record-direction-validation-trial.sh`
- `scripts/validate-device-evidence.mjs`

## Evidence Shape

The app stores expected direction, observed direction, status, confidence bucket source metadata, sample rate, and sample count for each local trial. Generated evidence must stay aggregate-only.

The non-PII device snapshot now includes:

- Overall counts: `directionTrialCount`, `directionMatched`, `directionMismatched`, `directionUnknownOrUnusable`.
- Controlled target counts: `directionRequiredTrialsPerDirection`, `directionRequiredTotalTrials`, `directionMissingTotalTrials`, `directionControlledTrialTargetComplete`.
- Direction totals: `directionFrontTrials`, `directionBackTrials`, `directionLeftTrials`, `directionRightTrials`.
- Direction remaining counts: `directionFrontMissingTrials`, `directionBackMissingTrials`, `directionLeftMissingTrials`, `directionRightMissingTrials`.
- Per-direction outcome counts:
  - `directionFrontMatched`, `directionFrontMismatched`, `directionFrontUnknownOrUnusable`
  - `directionBackMatched`, `directionBackMismatched`, `directionBackUnknownOrUnusable`
  - `directionLeftMatched`, `directionLeftMismatched`, `directionLeftUnknownOrUnusable`
  - `directionRightMatched`, `directionRightMismatched`, `directionRightUnknownOrUnusable`

## Manual Test Use

During controlled hardware testing:

1. Choose the expected caller position in `방향 검증 기록`.
2. Run `현재 방향 기록`.
3. Repeat for front, back, left, and right.
4. Record aggregate counts and remaining-row counts only.
5. Do not store or paste raw audio, PCM, transcripts, speaker names, Bluetooth names, or private room notes.

ADB helper path:

```bash
scripts/record-direction-validation-trial.sh --clear
scripts/record-direction-validation-trial.sh --expected LEFT --observed UNKNOWN --source controlled-phone
scripts/record-direction-validation-trial.sh --expected RIGHT --observed RIGHT --confidence 0.75 --source bluetooth-route
```

Allowed source labels are `controlled-phone`, `bluetooth-route`, `rayban-display`, `rayban-gen1-fallback`, `android-xr-projected`, and `manual-adb-direction-validation`. The receiver ignores arbitrary source text by falling back to `manual-adb-direction-validation`, so evidence does not capture Bluetooth product names, owner names, room notes, or speaker labels.

## Trial/Error Notes

- Direction totals alone are not enough. A front trial count of 20 is meaningless if all 20 are unknown or mismatched.
- Front/back remains unproven until strict direction validation passes with controlled phone/glasses evidence.
- These fields help locate which axis failed without implying production direction accuracy.
- Missing-row fields help operators finish the 20-per-direction plan, but target completion is still not direction accuracy proof.
- The ADB helper records a tester-declared expected/observed result. It is useful for reproducible evidence entry, not for proving that the algorithm sampled the direction correctly by itself.

## Verification

From the repository root:

```bash
node --check scripts/validate-device-evidence.mjs
node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json
bash -n scripts/record-direction-validation-trial.sh
scripts/record-direction-validation-trial.sh --help
```

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- Per-direction summary unit tests passed.
- Debug evidence snapshot compiled with per-direction outcome fields.
- Fixture validation returned `"ok": true`.
