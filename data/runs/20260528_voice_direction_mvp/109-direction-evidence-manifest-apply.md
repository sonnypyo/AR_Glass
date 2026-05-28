# Direction Evidence Manifest Apply Gate

Date: 2026-05-28 KST

## Goal

Add a safe apply gate for promoting strict direction evidence summaries into the canonical direction manifest.

## Why

The extractor writes a `manifest-update-template.json`, but manual copying is risky. A fixture or partial hardware summary could accidentally make the repository claim front/back or four-direction support before real controlled phone/wearable evidence exists.

## Implemented

- Added `scripts/apply-direction-evidence-summary.mjs`.
- Added `docs/52-direction-evidence-manifest-apply.md`.
- The script runs default and strict direction summary validation.
- Dry-run can report `applyReady=false` without changing files.
- `--write` requires `productionDirectionCandidate=true`, `fixtureEvidence=false`, strict summary validation, complete target progress, non-PII shape, and a `DIRECTION_EVIDENCE_EVALUATED` manifest template.
- If a future write passes initial checks but strict canonical direction validation fails afterward, the script restores the previous canonical files.

## Current Result

The current fixture summary is not apply-ready:

- `fixtureEvidence=true`.
- `productionDirectionCandidate=false`.
- `targetProgress.missingTotalTrials=76`.
- `targetProgress.controlledTrialTargetComplete=false`.
- `--write` is refused.
- `apps/voice-direction-glass/direction-evidence/manifest.json` remains in draft status.

## Verification

```bash
node --check scripts/apply-direction-evidence-summary.mjs
scripts/apply-direction-evidence-summary.mjs data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor/direction-evidence-summary.json --json
scripts/apply-direction-evidence-summary.mjs data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor/direction-evidence-summary.json --write --json
node scripts/validate-direction-accuracy-evidence.mjs --json
```

Result:

- Script syntax passed.
- Dry-run passed with `applyReady=false`.
- Write failed as expected and wrote no manifest or aggregate evidence file.
- Default direction accuracy validation still passed with the canonical draft manifest.

## Trial/Error Notes

- The first execution attempt failed because the new script file did not have executable permission. The file is now executable like the other `scripts/*.mjs` commands.
- The current fixture blockers are intentionally visible in dry-run output so a tester can see exactly what real evidence is still missing.
