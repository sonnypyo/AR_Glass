# Hardware Next Actions

Date: 2026-05-28 KST

## Purpose

This document defines the next-action brief for real hardware test days.

The hardware dashboard shows lane status. The next-action brief turns that status into an ordered, non-PII action list so the operator can see what to run now, what must stay blocked, and why.

## Command

```bash
scripts/recommend-hardware-next-actions.mjs --write-report --json
```

Default output:

```text
data/runs/20260528_voice_direction_mvp/111-hardware-next-actions/
```

Generated files:

- `hardware-next-actions.md`
- `hardware-next-actions.json`

To dry-run or execute the first ready action from the generated brief:

```bash
scripts/run-hardware-next-action.mjs --write-report --json
scripts/run-hardware-next-action.mjs --execute --write-report --json
```

For the Android phone lane specifically, prefer the guarded phone-lane runner:

```bash
scripts/run-phone-lane-hardware.mjs --write-report --json
scripts/run-phone-lane-hardware.mjs --execute --write-report --json
```

## What It Reads

Default source:

```text
data/runs/20260528_voice_direction_mvp/99-hardware-test-status-dashboard/hardware-test-status-dashboard.json
```

The source dashboard already summarizes:

- default no-hardware workflow status
- phone evidence lane status
- direction manifest apply dry-run status
- controlled direction-trial session status
- glasses lane blockers
- support lane state
- privacy scan result

## Current Recommendation

Current decision:

```text
phone_lane_blocked_attach_phone
```

Meaning:

- The default no-hardware operator workflow is current when the dashboard checks and privacy scan already pass.
- `RUN_PHONE=1` is the next real hardware lane, but it still needs exactly one authorized Android phone.
- Controlled direction planning and support preparation can be `current` even though observed direction rows and strict support evidence still require real reviewed evidence.
- Missing phone `device-evidence.md` and direction summary are post-run evidence gaps, not pre-run blockers.
- Keep glasses lane blocked until the phone MVP and direction evidence path are proven, then handle Meta application id, GitHub Packages token, glasses preflight blockers, and real Android XR proof.
- Controlled direction trial planning is ready, but observed rows remain `0/80`.
- Direction manifest apply is not ready for canonical promotion.

## Privacy Guardrail

The report stores only booleans, counts, statuses, command recommendations, blockers, and workspace-relative paths. It must not include raw command output, ADB serials, Bluetooth names, MAC addresses, raw audio, transcripts, speaker names, embeddings, private alert text, exact locations, tokens, or application id values.

## Trial/Error Notes

- This script does not run hardware commands. It only recommends the next safe command from the latest dashboard state.
- The executor in `docs/54-hardware-next-action-executor.md` is the only automation that runs a recommended action, and it refuses blocked/manual-required actions.
- The phone-lane runner in `docs/56-phone-lane-hardware-runner.md` refreshes this brief before attempting `RUN_PHONE=1`.
- A ready default workflow is not release evidence.
- `RUN_PHONE=1`, `RUN_GLASSES=1`, and `RUN_SUPPORT=1` remain gated by the matching real evidence conditions.
- The phone lane becomes executable based on collection readiness; phone alpha and direction promotion still require post-run evidence validation.
