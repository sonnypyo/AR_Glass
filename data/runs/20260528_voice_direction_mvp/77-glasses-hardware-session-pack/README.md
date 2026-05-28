# Glasses Hardware Session Summary

Generated: 2026-05-28T07:50:41+09:00

## Session

- Tester: local glasses tester
- Target: Meta Ray-Ban Display / Ray-Ban Meta Gen 1 / Android XR
- App: Voice Direction Glass
- Canonical manifest: apps/voice-direction-glass/glasses-evidence/manifest.json
- Hardware gate doc: docs/25-glasses-hardware-evidence.md

## Objective

Collect non-PII hardware evidence for Meta Ray-Ban Display cue rendering, Ray-Ban Meta Gen 1 Bluetooth fallback, Android XR projected runtime, and haptics/fallback status.

## Required Order

1. Read `privacy-redaction-rules.md`.
2. Run `commands.sh` before hardware proof to confirm the draft gates.
3. Complete `meta-rayban-display-evidence.md` only when DAT credentials, package access, and Ray-Ban Display hardware are available.
4. Complete `rayban-gen1-fallback-evidence.md` when Ray-Ban Meta Gen 1 is paired for Bluetooth route/TTS/vibration fallback checks.
5. Complete `android-xr-projected-evidence.md` only when Android XR projected runtime or hardware is available.
6. Complete `haptics-fallback-evidence.md` with either real official haptics proof or the documented phone-vibration fallback result.
7. Fill `manifest-update-template.json` with aggregate pass/fail/boolean/enum values only.
8. Review all files for private data.
9. Deliberately copy approved aggregate values into `apps/voice-direction-glass/glasses-evidence/manifest.json`.
10. Run `node scripts/validate-glasses-hardware-evidence.mjs --require-glasses-alpha-ready --json` only after real evidence paths and pass fields exist.
11. Regenerate service readiness audit.

## Expected Evidence Files

- `data/runs/20260528_voice_direction_mvp/77-glasses-hardware-session-pack/meta-rayban-display-evidence.md`
- `data/runs/20260528_voice_direction_mvp/77-glasses-hardware-session-pack/rayban-gen1-fallback-evidence.md`
- `data/runs/20260528_voice_direction_mvp/77-glasses-hardware-session-pack/android-xr-projected-evidence.md`
- `data/runs/20260528_voice_direction_mvp/77-glasses-hardware-session-pack/haptics-fallback-evidence.md`
- `data/runs/20260528_voice_direction_mvp/77-glasses-hardware-session-pack/manifest-update-template.json`
- `data/runs/20260528_voice_direction_mvp/77-glasses-hardware-session-pack/service-readiness-audit/service-readiness-audit.md`

## Current Known Gaps

- This folder is a template until hardware rows are filled.
- The canonical manifest remains draft until reviewed aggregate values are copied deliberately.
- Strict glasses hardware validation is expected to fail before real Ray-Ban Display, Ray-Ban Gen 1 fallback, Android XR projected, and haptics/fallback evidence exists.
