# Phone Lane Hardware Runner

Date: 2026-05-28 KST

## Purpose

This document defines the phone-lane hardware runner for the next real Android phone test.

The runner reduces the operator path to one command. It refreshes the hardware dashboard, refreshes the next-action brief, checks whether `run-phone-lane` is ready, and optionally executes `RUN_PHONE=1` only when the refreshed action is ready and allow-listed.

## Command

Dry-run readiness and write a non-PII report:

```bash
scripts/run-phone-lane-hardware.mjs --write-report --json
```

Execute the phone lane only when the refreshed lane is ready:

```bash
scripts/run-phone-lane-hardware.mjs --execute --write-report --json
```

Default output:

```text
data/runs/20260528_voice_direction_mvp/114-phone-lane-hardware-runner/
```

Generated files:

- `phone-lane-hardware-runner.md`
- `phone-lane-hardware-runner.json`

## Execution Contract

The runner executes the phone lane only when all of these are true:

- The refreshed dashboard says `collectionReadiness.phoneReadyToCollect=true`.
- The refreshed next-action brief contains `run-phone-lane`.
- The action status is `ready`.
- The command is exactly `RUN_PHONE=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh`.
- `collectionReadiness.phoneCollectionBlockers` is empty.

When it executes the operator pack, raw child command output is suppressed. The runner stores only exit code, timestamps, booleans, counts, command labels, and workspace-relative paths.

## Current Result

Current local state is blocked:

```text
authorized ADB devices must be exactly 1, current=0
```

The dry-run report is still useful because it proves the runner can refresh dashboard/next-action state and refuse phone evidence collection without storing raw command output.

## Promotion Rule

A passing phone-lane runner does not by itself approve phone alpha. After a real `--execute` pass, the operator must still validate:

- generated `device-evidence.md`
- device evidence validator
- direction evidence summary
- direction manifest apply dry-run
- hardware promotion validator
- service readiness audit
- evidence privacy scan

## Trial/Error Notes

- This runner is intentionally stricter than a plain shell command. It will not run `RUN_PHONE=1` from stale dashboard state.
- The current no-phone failure is expected and should remain non-PII.
- Evidence gaps such as missing `device-evidence.md` and missing direction summary remain post-run gaps, not collection blockers.
- The runner does not replace controlled direction trials. It only reaches the first real phone evidence collection lane.
