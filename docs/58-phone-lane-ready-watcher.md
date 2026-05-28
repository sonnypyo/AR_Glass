# Phone Lane Ready Watcher

Date: 2026-05-28 KST

## Purpose

This document defines the ready watcher for the Android phone evidence lane.

The watcher is for the next physical phone session. It repeatedly runs the guarded phone-lane readiness check until exactly one authorized Android phone is visible. With `--execute`, it then runs the phone evidence lane and immediately starts the post-run reviewer.

## Command

Dry-run with the default five-minute timeout:

```bash
scripts/run-phone-lane-when-ready.mjs --write-report --json
```

Short no-phone smoke check:

```bash
scripts/run-phone-lane-when-ready.mjs --timeout-ms 0 --interval-ms 250 --write-report --json
```

Execute when a known test phone is attached and authorized:

```bash
scripts/run-phone-lane-when-ready.mjs --execute --write-report --json
```

Default output:

```text
data/runs/20260528_voice_direction_mvp/116-phone-lane-ready-watcher/
```

Generated files:

- `phone-lane-ready-watcher.md`
- `phone-lane-ready-watcher.json`

## Execution Contract

The watcher never runs hardware collection unless `--execute` is present.

When `--execute` is present, collection still requires all of these conditions from `scripts/run-phone-lane-hardware.mjs`:

- `phoneReadyToCollect=true`
- `executionAllowed=true`
- `run-phone-lane` action status is `ready`
- exactly one authorized ADB phone is present
- phone collection blockers are empty

After execution, the watcher always runs `scripts/review-phone-lane-evidence.mjs --write-report --json` before any phone-alpha claim can be considered.

## Current Result

Current local no-phone smoke result is blocked:

```text
status=timed-out
authorizedAdbDevices=0
collectionBlockerCount=1
evidenceGapCount=4
```

This is expected. It proves the watcher polls the guarded runner and refuses collection without an authorized phone.

## Promotion Rule

Do not change phone alpha readiness unless the watcher reaches `phoneAlphaReady=true` through the post-run reviewer and the generated manual evidence rows have also been reviewed.

The watcher does not replace controlled direction trials, glasses evidence, support drills, policy review, or production direction validation.

## Trial/Error Notes

- A zero-timeout mode is kept for CI/local no-device verification.
- The watcher stores parsed aggregate child summaries only, never raw child command output.
- The first ready state without `--execute` is considered a dry-run success, not hardware evidence.
- An executed run can still end as `executed-review-blocked` when generated evidence exists but strict phone-alpha review is not ready.
