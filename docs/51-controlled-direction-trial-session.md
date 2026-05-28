# Controlled Direction Trial Session

Date: 2026-05-28 KST

## Purpose

This document defines the generated session folder used for controlled front/back/left/right direction trial planning.

The session is an operator workflow. It creates trial sheets, ADB command templates, an aggregate summary template, and privacy rules. It does not run trials, does not invent observed directions, and does not prove production direction accuracy by itself.

## Source Of Truth

- `scripts/create-controlled-direction-trial-session.mjs`
- `scripts/validate-controlled-direction-trial-session.mjs`
- `scripts/record-direction-validation-trial.sh`
- `docs/50-direction-validation-adb-recorder.md`
- `docs/22-direction-accuracy-evidence.md`

## Generate A Session

From the repository root:

```bash
scripts/create-controlled-direction-trial-session.mjs \
  --run-dir data/runs/<run>/controlled-direction-trial-session \
  --source controlled-phone \
  --route phone-built-in-microphones \
  --trials-per-direction 20 \
  --json
```

Validate it:

```bash
scripts/validate-controlled-direction-trial-session.mjs data/runs/<run>/controlled-direction-trial-session --json
```

Run the generated no-hardware workflow:

```bash
data/runs/<run>/controlled-direction-trial-session/commands.sh
```

When the debug APK is installed and the operator deliberately wants to clear old trial rows:

```bash
RUN_ADB_CLEAR=1 data/runs/<run>/controlled-direction-trial-session/commands.sh
```

## Generated Files

- `README.md`
- `commands.sh`
- `adb-command-templates.md`
- `trial-run-sheet.md`
- `trial-plan.csv`
- `aggregate-summary-template.json`
- `privacy-redaction-rules.md`
- `service-readiness-audit/service-readiness-audit.md` after `commands.sh` runs.

## Evidence Rules

Each generated session starts with 20 planned rows for each expected direction: front, back, left, and right.

Allowed recorded values:

- Direction enums.
- Status enums.
- Confidence buckets.
- Latency buckets.
- Counts and rates.
- Device-class or route-class labels.
- Workspace-relative evidence paths.

Disallowed values:

- Raw audio or PCM.
- Transcripts.
- Person or speaker names.
- Raw embedding values.
- Encrypted payload values.
- Bluetooth owner/device names or MAC addresses.
- Private alert text.
- Exact room descriptions or exact locations.

## Trial/Error Notes

- `UNKNOWN` is a valid observed direction when confidence is weak.
- The generated command templates use placeholders for observed values because only the operator can know what happened during the physical trial.
- The generated aggregate template starts with `productionDirectionCandidate=false`.
- This session should feed review and direction summary extraction. It must not directly update `apps/voice-direction-glass/direction-evidence/manifest.json`.

## Verification

The current generated session is:

```text
data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session
```

Local verification commands:

```bash
node --check scripts/create-controlled-direction-trial-session.mjs
node --check scripts/validate-controlled-direction-trial-session.mjs
scripts/create-controlled-direction-trial-session.mjs --run-dir data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session --force --json
scripts/validate-controlled-direction-trial-session.mjs data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session --json
data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session/commands.sh
```

Result:

- Session generation passed.
- Session validation passed.
- Generated `commands.sh` passed in no-hardware mode and regenerated a session-scoped service readiness audit.
- No physical direction trial rows were recorded yet.
- The Android app `방향 검증 기록` panel now mirrors the same 20-per-direction target by showing total progress toward 80 rows and remaining front/back/left/right rows during physical entry.
