# Controlled Direction Trial Session

Date: 2026-05-28 KST

## Goal

Add a generated session folder for controlled front/back/left/right direction trials so the next physical phone or glasses-route test has a repeatable non-PII plan.

## Implemented

- `scripts/create-controlled-direction-trial-session.mjs`
- `scripts/validate-controlled-direction-trial-session.mjs`
- `docs/51-controlled-direction-trial-session.md`
- Generated session folder at `data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session`

The generated session includes:

- `README.md`
- `commands.sh`
- `adb-command-templates.md`
- `trial-run-sheet.md`
- `trial-plan.csv`
- `aggregate-summary-template.json`
- `privacy-redaction-rules.md`
- `service-readiness-audit/service-readiness-audit.md` after `commands.sh` runs.

## Evidence Boundary

The generator plans 20 front, 20 back, 20 left, and 20 right rows by default. It does not guess observed directions. The operator must fill observed enum/status/confidence/latency values during real controlled trials.

The generated aggregate template starts with `productionDirectionCandidate=false`, raw audio persistence disabled, transcript evidence disabled, speaker-name evidence disabled, Bluetooth-name evidence disabled, and private alert text disabled.

## Verification

Commands run:

```bash
node --check scripts/create-controlled-direction-trial-session.mjs
node --check scripts/validate-controlled-direction-trial-session.mjs
scripts/create-controlled-direction-trial-session.mjs --help
scripts/validate-controlled-direction-trial-session.mjs --help
scripts/create-controlled-direction-trial-session.mjs --run-dir data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session --force --json
scripts/validate-controlled-direction-trial-session.mjs data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session --json
data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session/commands.sh
```

Result:

- Script syntax and help passed.
- Session generation passed.
- Session validation passed.
- Generated no-hardware workflow passed.
- Gradle unit tests and `assembleDebug` passed inside the generated workflow.
- Direction evidence draft validation passed inside the generated workflow.
- Session-scoped service readiness audit was written.

## Remaining Hardware Work

- Run the session with an attached phone and `RUN_ADB_CLEAR=1` only after the debug APK is installed.
- Record controlled observed values through `scripts/record-direction-validation-trial.sh`.
- Generate and validate `device-evidence.md`.
- Extract and validate a direction evidence summary.
- Keep strict production direction validation blocked until real aggregate phone and wearable evidence meets the gate.
