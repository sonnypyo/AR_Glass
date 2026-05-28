# Glasses Lane Post-Run Review

Date: 2026-05-28 KST

## Purpose

This document defines the post-run reviewer for the glasses evidence lane.

Use it after `RUN_GLASSES=1` or after a glasses hardware session updates the operator pack. It does not collect hardware evidence. It reads the generated operator-pack glasses summary, validates strict glasses evidence conditions, checks promotion profiles, checks Android XR projected contract state, runs an evidence privacy scan, and writes a non-PII review report.

## Command

```bash
scripts/review-glasses-lane-evidence.mjs --write-report --json
```

Default output:

```text
data/runs/20260528_voice_direction_mvp/117-glasses-lane-post-run-review/
```

Generated files:

- `glasses-lane-post-run-review.md`
- `glasses-lane-post-run-review.json`

## What It Checks

- Glasses runner summary shape and privacy guardrails.
- Strict glasses-private-alpha runner validation.
- Hardware operator-pack workflow promotion profile.
- Hardware operator-pack `glasses-alpha` promotion profile.
- Android XR projected default contract.
- Android XR strict real projected contract.
- Operator-pack evidence privacy scan.
- Meta Ray-Ban Display evidence readiness.
- Ray-Ban Gen 1 fallback readiness.
- Android XR projected runtime readiness.
- Haptics proof or documented phone-vibration fallback readiness.

## Current Result

Current local result is blocked because real glasses evidence has not been collected:

- Meta Ray-Ban Display evidence is not ready.
- Ray-Ban Gen 1 fallback evidence is not ready.
- Android XR projected evidence is not ready.
- Strict Android XR projected contract does not pass.
- Strict glasses-alpha promotion profile does not pass.
- Privacy scan passes with zero violations.

## Promotion Rule

Do not change glasses alpha readiness unless this reviewer reports `glassesAlphaReady=true` and the manual glasses evidence rows have also been reviewed.

This reviewer is not a substitute for phone private-alpha evidence, controlled direction trials, support drills, policy review, or production direction validation.

## Trial/Error Notes

- The current blocked result is expected in a no-glasses environment.
- Workflow profile passing means the generated pack is structurally safe; it does not mean glasses alpha is ready.
- Strict glasses-alpha failure is correct until real Ray-Ban Display, Ray-Ban Gen 1 fallback, Android XR, and haptics/fallback evidence exists.
- The report stores only aggregate statuses, exit codes, booleans, counts, command labels, and workspace-relative paths.
