# Diagnostics Logging Stage

Date: 2026-05-28 KST

## Goal

Make the first physical-device run debuggable without collecting transcripts, speaker names, or raw audio.

## Implemented

- `DiagnosticsLogger` with the Android logcat tag `VoiceDirectionGlass`.
- Permission result logs.
- Main Activity logs for manual recognition, simulation, session start/stop, audio probe, direction sample, and event evaluation.
- Foreground service logs for lifecycle, recognition loop, recognition errors, and event evaluation.
- Projected cue Activity logs for latest-cue load state.
- Smoke test script logcat grep updated for `VoiceDirectionGlass`.

## Privacy Boundary

Diagnostic logs may include:

- Boolean permission/session/evaluation states.
- Direction enum.
- Confidence bucket.
- Delivery count.
- Cue-save status.
- Audio probe/sample status.

Diagnostic logs must not include:

- Speech transcripts.
- Raw PCM.
- Speaker names.
- Voice embeddings.
- Exact biometric identifiers.

## Verification

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result: passed.

```bash
bash -n scripts/android-device-smoke-test.sh
scripts/android-device-smoke-test.sh --skip-build
```

Result: syntax passed; no-device path still exits with code `2`.

## Next Work

1. Connect an Android phone with USB debugging enabled.
2. Run `scripts/android-device-smoke-test.sh`.
3. Inspect `adb logcat -s VoiceDirectionGlass` during session start, speech recognition, audio probe, direction sample, and projected preview.
4. Record physical-device evidence in `docs/06-experiment-log.md`.
