# Stage 99 - Hardware Test Status Dashboard

Date: 2026-05-28 KST

## Goal

Add a single non-PII dashboard that summarizes the current hardware test operator pack status, splits default workflow readiness from real phone/glasses/support/controlled-direction evidence readiness, and prevents a default no-hardware pass from being mistaken for private-alpha evidence.

## Implemented

- Added `scripts/summarize-hardware-test-status.mjs`.
- Added `docs/46-hardware-test-status-dashboard.md`.
- Generated `data/runs/20260528_voice_direction_mvp/99-hardware-test-status-dashboard/hardware-test-status-dashboard.md`.
- Generated `data/runs/20260528_voice_direction_mvp/99-hardware-test-status-dashboard/hardware-test-status-dashboard.json`.
- Later updated the dashboard to validate the controlled direction-trial session and show planned, recorded, and TODO row counts.

## Current Dashboard Result

- Current safe workflow: yes.
- Private alpha candidate: no.
- Default no-hardware workflow: ready.
- Phone evidence lane: blocked because authorized ADB device count is 0 and real direction summary evidence does not exist.
- Glasses evidence lane: blocked because Meta credentials are missing, glasses preflight still has blocked rows, Android XR is still `phone_preview_stub`, and strict glasses candidate evidence does not exist.
- Support evidence lane: manual-required because deletion and mistaken-alert drill evidence has not been reviewed.
- Controlled direction trials lane: manual-required because the 80-row plan exists but observed rows are still 0/80.

## Verification

```bash
node --check scripts/summarize-hardware-test-status.mjs
scripts/summarize-hardware-test-status.mjs --write-report --json
```

Both passed. The current generated dashboard also includes `controlledDirection` with `totalPlannedRows=80`, `recordedRows=0`, and `todoRows=80`. The generated dashboard stores only booleans, counts, statuses, command recommendations, and workspace-relative paths.

## Next Required Action

Connect exactly one authorized Android phone and run:

```bash
RUN_PHONE=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
```

Do not run or promote strict glasses/support/private-alpha profiles until the matching real evidence exists.
