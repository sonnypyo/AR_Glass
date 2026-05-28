# Controlled Direction Trial Session

Generated: 2026-05-28T12:14:30+09:00

## Session

- Tester: direction trial tester
- Source label: controlled-phone
- Route label: phone-built-in-microphones
- Trials per direction: 20
- Total planned trials: 80
- App: Voice Direction Glass

## Objective

Collect repeatable, non-PII expected-vs-observed direction trial rows for front, back, left, and right before any direction accuracy claim changes.

This session is a planning and evidence-entry aid. It does not prove direction accuracy until real controlled observations, microphone metadata, route proof, latency evidence, and privacy review exist.

## Required Order

1. Read `privacy-redaction-rules.md`.
2. Install the debug APK on one authorized Android phone.
3. Run `commands.sh` once with no ADB clear flag to validate the session shape.
4. Set `RUN_ADB_CLEAR=1` and rerun `commands.sh` only when the debug APK is installed and clearing old direction trial rows is intended.
5. Use `adb-command-templates.md` during each controlled trial and fill `trial-run-sheet.md` / `trial-plan.csv` with aggregate-safe values only.
6. Update `aggregate-summary-template.json` with reviewed aggregate counts only.
7. Run `scripts/validate-controlled-direction-trial-session.mjs data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session --json`.
8. Generate phone evidence with `scripts/android-device-smoke-test.sh --write-evidence`, extract the direction summary, and keep strict production validation blocked unless the evidence truly meets the gate.

## Expected Files

- `data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session/commands.sh`
- `data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session/adb-command-templates.md`
- `data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session/trial-run-sheet.md`
- `data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session/trial-plan.csv`
- `data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session/aggregate-summary-template.json`
- `data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session/privacy-redaction-rules.md`

## Current Known Gaps

- No physical ADB direction trial output is recorded by this generated session.
- No microphone metadata, route proof, or latency evidence is filled yet.
- Production direction validation remains blocked.
