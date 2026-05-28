# Direction Validation ADB Recorder

Date: 2026-05-28 KST

## Purpose

This document defines the debug-only ADB path for recording controlled expected-vs-observed direction validation trials after the debug APK is installed on a physical Android phone.

The recorder exists to make hardware-day evidence entry repeatable. It does not sample audio by itself and does not prove direction accuracy without a real controlled trial setup.

## Source Of Truth

- `apps/voice-direction-glass/app/src/debug/kotlin/com/voicedirection/glass/qa/DirectionValidationTrialReceiver.kt`
- `apps/voice-direction-glass/app/src/debug/AndroidManifest.xml`
- `scripts/record-direction-validation-trial.sh`
- `docs/32-direction-validation-evidence-snapshot.md`

## Commands

Clear prior local direction trials before a controlled run:

```bash
scripts/record-direction-validation-trial.sh --clear
```

Record a controlled phone trial where the operator expected left but the sampled/observed result was unknown:

```bash
scripts/record-direction-validation-trial.sh --expected LEFT --observed UNKNOWN --source controlled-phone
```

Record a Bluetooth-route trial where the observed result matched right:

```bash
scripts/record-direction-validation-trial.sh --expected RIGHT --observed RIGHT --confidence 0.75 --source bluetooth-route
```

Use `ANDROID_SERIAL=<serial>` only in the shell environment when multiple phones are attached. Do not paste that serial into evidence files.

For a full 20-per-direction test plan, generate a controlled direction trial session first:

```bash
scripts/create-controlled-direction-trial-session.mjs --run-dir data/runs/<run>/controlled-direction-trial-session --json
scripts/validate-controlled-direction-trial-session.mjs data/runs/<run>/controlled-direction-trial-session --json
```

## Evidence Shape

The receiver stores only:

- Expected direction enum.
- Observed direction enum.
- Direction validation status enum.
- Confidence value/bucket.
- Optional sample rate and sample count.
- Allow-listed source label.
- Aggregate and per-direction matched/mismatched/unknown counts surfaced by the existing snapshot path.

Allowed source labels:

- `controlled-phone`
- `bluetooth-route`
- `rayban-display`
- `rayban-gen1-fallback`
- `android-xr-projected`
- `manual-adb-direction-validation`

Unexpected source text is replaced with `manual-adb-direction-validation`.

## Privacy Rules

Do not put speaker names, transcripts, room descriptions, Bluetooth device names, owner names, MAC addresses, raw audio, PCM, embedding values, encrypted values, or private alert text into command arguments or evidence notes.

The ADB command output may be copied only if it contains result codes, direction enums, statuses, confidence buckets, counts, and allow-listed source labels.

## Trial/Error Notes

- The helper is deliberately separate from `scripts/android-device-smoke-test.sh` because a smoke test cannot know where the caller was standing.
- The controlled direction trial session is deliberately separate from the ADB recorder because the session plans the physical run while the recorder appends individual rows.
- `UNKNOWN` is a valid observed result when confidence is weak. Do not replace it with a guessed direction.
- A matching ADB trial row is not production evidence unless the surrounding hardware setup, microphone metadata, route proof, and latency evidence are recorded and strict direction validation passes.

## Verification

From the repository root:

```bash
bash -n scripts/record-direction-validation-trial.sh
scripts/record-direction-validation-trial.sh --help
bash -n scripts/android-device-smoke-test.sh
```

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```
