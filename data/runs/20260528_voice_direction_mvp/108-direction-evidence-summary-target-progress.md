# Direction Evidence Summary Target Progress

Date: 2026-05-28 KST

## Goal

Carry controlled direction target-progress counters from generated `device-evidence.md` into the extracted direction summary and validator.

## Why

Stage 107 added 20-per-direction target-progress fields to the non-PII device evidence snapshot. The direction extractor still summarized counts and rates, but downstream review also needs the planned total, missing total, per-direction missing counts, and target-complete boolean so a phone runner or operator-pack summary cannot hide an incomplete 80-row controlled trial plan.

## Implemented

- Updated `scripts/extract-direction-evidence-summary.mjs`.
- Added top-level `targetProgress` to `direction-evidence-summary.json`.
- Mirrored `targetProgress` into `aggregateEvaluation.targetProgress`.
- Mirrored the same object into `manifestUpdateTemplate.aggregateEvaluation.targetProgress`.
- Changed trial-count thresholds to use `requiredTrialsPerDirection` and `requiredTotalTrials`.
- Added `thresholds.controlledTargetProgressMet`.
- Updated `scripts/validate-direction-evidence-summary.mjs` to require and cross-check target progress consistency.

## Current Fixture Result

The current fixture summary records:

- Required trials per direction: 20.
- Required total trials: 80.
- Existing fixture trials: 4.
- Missing total trials: 76.
- Missing trials by direction: 19 each.
- Controlled trial target complete: false.
- Production direction candidate: false.

## Verification

```bash
node --check scripts/extract-direction-evidence-summary.mjs
node --check scripts/validate-direction-evidence-summary.mjs
scripts/extract-direction-evidence-summary.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --report-dir data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor --json
scripts/validate-direction-evidence-summary.mjs data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor/direction-evidence-summary.json --json
scripts/validate-direction-evidence-summary.mjs data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor/direction-evidence-summary.json --require-production-direction-candidate --json
```

Result:

- Extractor and validator syntax passed.
- Fixture extraction passed.
- Default summary validation passed.
- Strict production-candidate validation failed as expected because `productionDirectionCandidate=false`.

## Trial/Error Notes

- The first validation run caught that `targetProgress` was present at the summary root and manifest template, but missing from `aggregateEvaluation`.
- The extractor now writes the same target-progress object in all three places so validators and downstream manifest review see identical row-count evidence.
- `controlledTrialTargetComplete=true` remains only a row-count milestone. It is not direction accuracy proof.
