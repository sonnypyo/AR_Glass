# Release Readiness UI

Date: 2026-05-28 KST

## Purpose

This document defines the in-app release readiness surface. The app now shows a `릴리스 준비` card so a tester can see whether the current build is internal-prototype ready, phone-private-alpha ready, glasses-private-alpha ready, external-beta ready, or production ready before collecting hardware evidence.

## Source of Truth

- `apps/voice-direction-glass/app/src/main/kotlin/com/voicedirection/glass/qa/ReleaseReadiness.kt`
- `apps/voice-direction-glass/app/src/main/kotlin/com/voicedirection/glass/ui/VoiceDirectionApp.kt`
- `apps/voice-direction-glass/app/src/debug/kotlin/com/voicedirection/glass/qa/ReleaseReadinessSnapshotReceiver.kt`

The UI reuses `VoiceDirectionReleaseChecklist`; it does not maintain a separate readiness list.

## What The Card Shows

- Internal prototype status.
- Phone private alpha status.
- Glasses private alpha status.
- External beta status.
- Production status.
- Passed/required/manual/blocked counts per target.
- The first three open phone-private-alpha evidence items, including evidence state and next action. See `docs/34-release-readiness-next-actions.md`.

## Why This Matters

The project is intentionally not production-ready yet. Before physical testing, the operator should see that:

- Internal prototype is ready by local build/test evidence.
- Phone private alpha still needs physical Android phone evidence.
- Glasses private alpha remains blocked by Meta DAT credentials and hardware proof.
- External beta and production remain blocked by model, direction, privacy, support, release, and policy gates.

## Trial/Error Notes

- The app card is a status surface, not a release approval.
- Debug `ReleaseReadinessSnapshotReceiver` remains the machine-readable evidence path for ADB reports.
- Do not change checklist statuses to `PASS` unless the matching evidence file or hardware run proves it.

## Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- Release readiness card compiled into the Compose host app.
- Existing release readiness unit tests passed.
- Debug APK assembled.
