# Hardware Next Actions

Date: 2026-05-28 KST

## Goal

Add a non-PII next-action brief that turns the hardware dashboard into ordered operator commands.

## Why

The project now has multiple evidence lanes: default workflow, phone, controlled direction trials, glasses, support, Android XR, privacy scan, promotion profiles, and direction manifest apply readiness. The dashboard exposes them, but test-day operation benefits from one concise ordered list that says what can run now and what must remain blocked.

## Implemented

- Added `scripts/recommend-hardware-next-actions.mjs`.
- Added `docs/53-hardware-next-actions.md`.
- Generated `data/runs/20260528_voice_direction_mvp/111-hardware-next-actions/hardware-next-actions.md`.
- Generated `data/runs/20260528_voice_direction_mvp/111-hardware-next-actions/hardware-next-actions.json`.

## Current Result

Current decision:

```text
default_workflow_ready_attach_phone_next
```

Current ordered action state:

- Default no-hardware workflow: ready.
- Android phone evidence lane: blocked because authorized ADB devices are `0`.
- Controlled direction rows: manual-required, `0/80` observed.
- Glasses evidence lane: blocked by Meta application id, GitHub token, preflight blockers, and real Android XR proof.
- Support drill lane: manual-required.

## Verification

```bash
node --check scripts/recommend-hardware-next-actions.mjs
scripts/recommend-hardware-next-actions.mjs --write-report --json
```

Result:

- Syntax check passed.
- Report generation passed.
- Output contains only booleans, counts, statuses, command recommendations, blockers, and workspace-relative paths.

## Trial/Error Notes

- This script reads the latest dashboard only. Regenerate `scripts/summarize-hardware-test-status.mjs --write-report --json` first after any hardware evidence change.
- The recommendation is not a release approval. It is an execution-order guide.
