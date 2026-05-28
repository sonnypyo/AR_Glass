# Phone Lane Hardware Runner

Date: 2026-05-28 KST

## Goal

Add a single phone-lane runner that refreshes readiness state and executes `RUN_PHONE=1` only when the refreshed phone action is ready.

## Why

The operator previously had to run the dashboard, run the next-action brief, inspect the phone action, and then copy the phone command manually. That is easy to do out of order on a hardware day. The runner makes the sequence repeatable while keeping the same release guardrails.

## Implemented

- Added `scripts/run-phone-lane-hardware.mjs`.
- Added `docs/56-phone-lane-hardware-runner.md`.
- Generated `data/runs/20260528_voice_direction_mvp/114-phone-lane-hardware-runner/phone-lane-hardware-runner.md`.
- Generated `data/runs/20260528_voice_direction_mvp/114-phone-lane-hardware-runner/phone-lane-hardware-runner.json`.

## Current Result

The current no-phone state is blocked:

```text
authorized ADB devices must be exactly 1, current=0
```

The runner refreshed both dashboard and next-action state, then refused execution because `run-phone-lane` is not ready. This is the intended local result.

## Verification

```bash
node --check scripts/run-phone-lane-hardware.mjs
scripts/run-phone-lane-hardware.mjs --help
scripts/run-phone-lane-hardware.mjs --write-report --json
```

Result:

- Syntax check passed.
- Help output passed.
- Dry-run report was written.
- Dashboard refresh step passed.
- Next-action refresh step passed.
- Phone lane execution was blocked only by authorized ADB device count.
- Raw child command output was not persisted.

## Trial/Error Notes

- This runner deliberately exits non-zero when the phone lane is blocked. That makes accidental phone-evidence claims harder.
- `--execute` remains gated by the refreshed dashboard and next-action brief.
- This is automation readiness, not phone evidence. A real phone run still needs device evidence, direction summary, manifest apply dry-run, promotion validation, service audit, and privacy scan.
