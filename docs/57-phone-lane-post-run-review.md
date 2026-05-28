# Phone Lane Post-Run Review

Date: 2026-05-28 KST

## Purpose

This document defines the post-run reviewer for the Android phone evidence lane.

Use it after `RUN_PHONE=1` or after `scripts/run-phone-lane-hardware.mjs --execute` completes. It does not collect hardware evidence. It reads the generated operator-pack phone summary, validates strict phone evidence conditions, checks promotion profiles, runs an evidence privacy scan, and writes a non-PII review report.

## Command

```bash
scripts/review-phone-lane-evidence.mjs --write-report --json
```

Default output:

```text
data/runs/20260528_voice_direction_mvp/115-phone-lane-post-run-review/
```

Generated files:

- `phone-lane-post-run-review.md`
- `phone-lane-post-run-review.json`

## What It Checks

- Phone runner summary shape and privacy guardrails.
- Strict phone-private-alpha runner validation.
- Hardware operator-pack workflow promotion profile.
- Hardware operator-pack `phone-alpha` promotion profile.
- Operator-pack evidence privacy scan.
- Presence and validation state of generated `device-evidence.md`.
- Presence and validation state of generated direction evidence summary.
- Direction manifest apply dry-run state.

## Current Result

Current local result is blocked because no real phone evidence has been collected:

- `device-evidence.md` does not exist.
- Direction evidence summary does not exist.
- Strict phone-alpha promotion profile does not pass.
- Privacy scan passes with zero violations.

## Promotion Rule

Do not change phone alpha readiness unless this reviewer reports `phoneAlphaReady=true` and the manual phone evidence rows have also been reviewed.

This reviewer is not a substitute for controlled direction trials, glasses evidence, support drills, policy review, or production direction validation.

## Trial/Error Notes

- The current blocked result is expected in a no-phone environment.
- Workflow profile passing means the generated pack is structurally safe; it does not mean phone alpha is ready.
- Strict phone-alpha failure is correct until a real authorized phone run produces validated evidence.
- The report stores only aggregate statuses, exit codes, booleans, counts, command labels, and workspace-relative paths.
