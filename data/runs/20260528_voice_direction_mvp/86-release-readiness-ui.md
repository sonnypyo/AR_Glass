# Stage 86: Release Readiness UI

Date: 2026-05-28 KST

## Decision

Expose release readiness status directly in the app UI.

## Reasoning

The release checklist and ADB snapshot already existed, but a tester using the app still had to inspect docs or generated reports to know whether the build was ready for phone alpha, glasses alpha, beta, or production. Since this project is explicitly evidence-gated, the app should surface those gates before hardware testing starts.

## Implemented

- `VoiceDirectionApp.kt` now includes a `릴리스 준비` card.
- The card reuses `VoiceDirectionReleaseChecklist.summaryFor(...)`.
- The card shows readiness status and pass/manual/blocked counts for internal prototype, phone private alpha, glasses private alpha, external beta, and production.
- The card lists the first three open phone-private-alpha evidence items.
- `docs/33-release-readiness-ui.md` records the UI contract.

## Trial/Error Notes

- This is intentionally read-only. It does not mark evidence complete from the UI.
- The machine-readable path remains `ReleaseReadinessSnapshotReceiver`.
- Phone/glasses/private beta/production statuses remain not-ready or blocked until real evidence closes the checklist.

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
- `node scripts/audit-service-readiness.mjs --write-report --report-dir data/runs/20260528_voice_direction_mvp/52-service-readiness-audit` regenerated the service audit with `docs/33-release-readiness-ui.md` as a required artifact.
- `data/canonical/voice-direction-glass.qa-report.json` and `apps/voice-direction-glass/agent-output/implementation.lock.json` parse successfully after the Stage 86 metadata update.
