# Evidence Snapshot Receiver

Date: 2026-05-28 KST

## Goal

Add a debug-only physical-device evidence path that summarizes repository state without exposing private voice data.

## Implemented

- `EvidenceSnapshotReceiver` in the debug source set.
- Debug broadcast action `com.voicedirection.glass.qa.DEBUG_EVIDENCE_SNAPSHOT`.
- Smoke script collection step after app launch.
- `device-evidence.md` section for the non-PII repository evidence snapshot.
- Release-readiness gate item for physical-phone snapshot proof.

## Privacy Boundary

The receiver reports only counts, statuses, booleans, and enum values:

- profile/event/feedback/direction-validation counts.
- latest cue presence and direction enum.
- service bridge presence.
- false-positive run presence, active state, and verdict.

It must not report speaker labels, transcripts, raw audio, PCM, embedding values, encrypted payloads, preference values, or bystander text.

## Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- Unit tests passed.
- Debug APK assembled with `EvidenceSnapshotReceiver`.

From the repository root:

```bash
bash -n scripts/android-device-smoke-test.sh
scripts/android-device-smoke-test.sh --help
```

Result:

- Smoke script syntax/help path passed.
- Physical snapshot execution still needs an attached Android phone.

## Next Work

- Run `scripts/android-device-smoke-test.sh --write-evidence` with a connected Android phone.
- Confirm `Non-PII repository evidence snapshot: script-pass` in the generated report.
- Review the snapshot output and keep only counts, statuses, booleans, and enum values.
