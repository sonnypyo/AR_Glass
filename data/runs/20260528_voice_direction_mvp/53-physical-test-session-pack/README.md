# Physical Test Session Summary

Generated: 2026-05-28T12:17:16+09:00

## Session

- Tester: local tester
- Phone target: physical Android phone
- Glasses target: Meta Ray-Ban Display / Ray-Ban Meta Gen 1 / Android XR
- App: Voice Direction Glass
- APK path: apps/voice-direction-glass/app/build/outputs/apk/debug/app-debug.apk

## Objective

Collect the first non-PII physical-device evidence needed to move the project from internal prototype toward phone private alpha and later glasses private alpha.

## Required Order

1. Read `privacy-redaction-rules.md`.
2. Run `commands.sh` from this session folder or copy the commands manually.
3. Complete `phone-manual-checklist.md` while the app is installed on a real phone.
4. Complete `meta-rayban-checklist.md` only when Meta DAT credentials and Ray-Ban hardware are available.
5. Complete `android-xr-checklist.md` only when Android XR runtime or hardware is available.
6. Generate or review `controlled-direction-trial-session` before a 20-per-direction front/back/left/right pass.
7. Complete `direction-accuracy-checklist.md` before any front/back or four-direction claim.
8. Run `scripts/audit-service-readiness.mjs --write-report --report-dir data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack/service-readiness-audit`.
9. Run `scripts/validate-physical-test-session.mjs data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack --json`.

## Expected Evidence Files

- `data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack/android-phone-smoke/device-evidence.md`
- `data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack/glasses-preflight/glasses-preflight.md`
- `data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack/controlled-direction-trial-session/README.md`
- `data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack/service-readiness-audit/service-readiness-audit.md`
- Filled manual checklist files in this folder.

## Current Known Gaps

- No physical `device-evidence.md` exists yet in this workspace.
- Meta DAT credentials and package access are not configured.
- Android XR projected runtime proof is not recorded.
- Production speaker verification and direction accuracy are not proven.
