# Stage 116: Phone Lane Ready Watcher

Date: 2026-05-28 KST

## Decision

Add a polling watcher that waits for the guarded phone lane to become ready, then optionally executes the phone lane and immediately runs the post-run evidence reviewer.

## Reasoning

The previous phone lane runner and post-run reviewer reduced manual steps, but the operator still had to rerun commands after attaching a phone. The watcher closes that automation gap while preserving the same release blockers: hardware collection still requires `--execute`, exactly one authorized phone, and a passing post-run review before any phone-alpha claim.

## Implemented

- Added `scripts/run-phone-lane-when-ready.mjs`.
- Added `docs/58-phone-lane-ready-watcher.md`.
- Generated `data/runs/20260528_voice_direction_mvp/116-phone-lane-ready-watcher/phone-lane-ready-watcher.md`.
- Generated `data/runs/20260528_voice_direction_mvp/116-phone-lane-ready-watcher/phone-lane-ready-watcher.json`.

## Current Result

- Current no-phone smoke status is `timed-out`.
- One poll was recorded.
- `authorizedAdbDevices=0`.
- `collectionBlockerCount=1`.
- `evidenceGapCount=4`.
- Hardware execution was not attempted.
- Post-run review was not attempted because readiness was not observed.

## Trial/Error Notes

- The watcher uses `scripts/run-phone-lane-hardware.mjs --json` for polling so the same safety gates decide readiness.
- Raw child command output is not persisted; reports store aggregate statuses, counts, timestamps, command labels, and workspace-relative paths only.
- `--timeout-ms 0` exists for quick local no-device validation.
- `--execute` remains explicit so a connected personal phone is not used accidentally.

## Verification

From the repository root:

```bash
node --check scripts/run-phone-lane-when-ready.mjs
scripts/run-phone-lane-when-ready.mjs --help
scripts/run-phone-lane-when-ready.mjs --timeout-ms 0 --interval-ms 250 --write-report --json
```

Result:

- Syntax check passed.
- Help output passed.
- No-phone smoke generated the expected `timed-out` report without running hardware collection.
