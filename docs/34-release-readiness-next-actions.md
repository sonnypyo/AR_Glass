# Release Readiness Next Actions

Date: 2026-05-28 KST

## Purpose

This document defines the operator-facing next-action surface for release readiness. The app now shows each near-term phone-private-alpha blocker with its title, evidence state, next action, and stable checklist id inside the `릴리스 준비` card.

## Source of Truth

- `apps/voice-direction-glass/app/src/main/kotlin/com/voicedirection/glass/qa/ReleaseReadiness.kt`
- `apps/voice-direction-glass/app/src/main/kotlin/com/voicedirection/glass/ui/VoiceDirectionApp.kt`
- `docs/10-release-readiness.md`
- `docs/33-release-readiness-ui.md`

The UI still reads from `VoiceDirectionReleaseChecklist`; it does not create a separate checklist or allow a tester to mark release items complete.

## What The App Shows

For the first three open phone-private-alpha blockers, the card shows:

- Status label.
- Human-readable title.
- Current evidence state.
- Next action.
- Stable checklist id for generated reports and issue tracking.

## Why This Matters

The next real gate is physical Android phone evidence. Showing only ids is useful for automation, but it is weak for a tester standing at the device. The next-action view turns the checklist into a run guide while preserving the evidence rule: no phone alpha, glasses alpha, beta, or production status changes without actual artifacts.

## Trial/Error Notes

- Long evidence text is allowed to wrap in the card; it is better than hiding the evidence requirement behind a short id.
- The card intentionally limits the list to the first three open phone-alpha blockers so the main screen remains usable during repeated tests.
- The full checklist remains in `docs/10-release-readiness.md` and `VoiceDirectionReleaseChecklist`.
- Physical phone verification still requires `scripts/android-device-smoke-test.sh --write-evidence` and `scripts/validate-device-evidence.mjs <device-evidence.md> --json`.

## Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Expected result:

- `VoiceDirectionReleaseChecklistTest` verifies open phone-alpha items carry non-empty title, evidence, and next-action copy.
- The Compose host app compiles with the expanded `릴리스 준비` next-action rows.
