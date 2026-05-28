# Stage 87: Release Readiness Next Actions

Date: 2026-05-28 KST

## Decision

Expand the in-app release readiness card from checklist ids to actionable phone-private-alpha evidence rows.

## Reasoning

The previous release readiness card correctly showed target status and the first three open phone-private-alpha ids. That was enough for automation but not enough for a tester holding a phone. The app should show what evidence is missing and what command or manual run should happen next.

## Implemented

- `ReleaseReadinessOpenItemRow` now shows status, title, evidence, next action, and stable id.
- The `릴리스 준비` card now shows the visible/total open phone-alpha blocker count.
- `VoiceDirectionReleaseChecklistTest` verifies phone-private-alpha open items carry non-empty title, evidence, and next-action copy.
- `docs/34-release-readiness-next-actions.md` records the UI/evidence contract.

## Trial/Error Notes

- The card remains read-only and does not close release gates.
- Only the first three phone-alpha blockers are shown to keep the main screen usable.
- Long evidence strings are accepted because the next-action card is an operator tool, not marketing UI.
- Actual phone-private-alpha readiness still requires generated `device-evidence.md` from a physical phone.

## Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- Unit tests pass.
- Debug APK assembles.
- `node scripts/audit-service-readiness.mjs --write-report --report-dir data/runs/20260528_voice_direction_mvp/52-service-readiness-audit` regenerated the service audit with `docs/34-release-readiness-next-actions.md` as a required artifact.
