# Hardware Dashboard Controlled Direction Session Integration

Date: 2026-05-28 KST

## Goal

Make the hardware test status dashboard show whether the controlled direction-trial session is ready for a test day and whether real observed rows have been recorded.

## Why

The project already had a generated 80-row controlled direction session, but the hardware-day dashboard still only summarized phone, glasses, support, Android XR, and promotion status. That made it too easy to miss the direction-trial readiness gap while preparing for physical tests.

## Implemented

- Updated `scripts/summarize-hardware-test-status.mjs`.
- Added `--controlled-direction-session DIR`.
- Added controlled direction session validation to dashboard checks.
- Added `controlledDirection` JSON summary with:
  - session path
  - validator status
  - source and route
  - planned rows
  - planned rows by direction
  - recorded rows
  - TODO rows
  - production direction candidate flag
- Added a `Controlled direction trials` dashboard lane.
- Regenerated `data/runs/20260528_voice_direction_mvp/99-hardware-test-status-dashboard/hardware-test-status-dashboard.md`.
- Updated `docs/46-hardware-test-status-dashboard.md`.

## Current Result

- Controlled direction plan ready: yes.
- Planned rows: 80.
- Recorded rows: 0.
- TODO rows: 80.
- Lane status: manual-required.
- Production direction candidate: false.

## Verification

```bash
node --check scripts/summarize-hardware-test-status.mjs
scripts/summarize-hardware-test-status.mjs --json
scripts/summarize-hardware-test-status.mjs --write-report --json
```

Result:

- Script syntax passed.
- Dashboard JSON includes `controlledDirection`.
- Dashboard checks include `Validate controlled direction trial session`.
- Default no-hardware workflow remains ready.
- Phone/glasses lanes remain blocked without real evidence.
- Support lane remains manual-required.
- Controlled direction trial lane remains manual-required because observed rows are `0/80`.

## Trial/Error Notes

- The dashboard treats a valid session as planning readiness, not evidence readiness.
- `observedRowsComplete=false` is deliberate until physical phone or glasses trials fill reviewed observed rows.
- `productionDirectionCandidate=false` remains the correct state until aggregate direction evidence is reviewed and copied through the strict direction evidence process.
